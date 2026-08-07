/* ==========================================================================
   WebVeido — saskarnes loģika
   Bez ārējām bibliotēkām. Viss darbojas arī tad, ja JS neielādējas:
   saturs ir HTML, formas ir īstas formas, BUJ izmanto <details>.
   ========================================================================== */

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     1. Tēmas pārslēgšana
     ------------------------------------------------------------------ */
  (function initTheme() {
    var toggle = document.getElementById("theme-toggle");
    if (!toggle) return;

    function apply(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      toggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Ieslēgt gaišo režīmu" : "Ieslēgt tumšo režīmu"
      );
      var meta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (meta) meta.setAttribute("content", theme === "dark" ? "#0a090b" : "#fbfafb");
    }

    apply(document.documentElement.getAttribute("data-theme") || "dark");

    toggle.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem("wv-theme", next); } catch (e) {}
    });
  })();

  /* ------------------------------------------------------------------
     2. Galvenes stāvoklis ritinot
     ------------------------------------------------------------------ */
  (function initHeader() {
    var header = document.querySelector(".header");
    if (!header) return;

    var ticking = false;

    function update() {
      header.setAttribute("data-scrolled", window.scrollY > 12 ? "true" : "false");
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  })();

  /* ------------------------------------------------------------------
     3. Mobilā navigācija
     ------------------------------------------------------------------ */
  (function initMobileNav() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("mobila-navigacija");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.setAttribute("data-open", open ? "true" : "false");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Aizvērt izvēlni" : "Atvērt izvēlni");
      document.body.setAttribute("data-nav-open", open ? "true" : "false");
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(nav.getAttribute("data-open") !== "true");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.getAttribute("data-open") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Ja logs kļūst plats, izvēlne vairs nav vajadzīga
    window.matchMedia("(min-width: 52rem)").addEventListener("change", function (e) {
      if (e.matches) setOpen(false);
    });
  })();

  /* ------------------------------------------------------------------
     4. Parādīšanās animācija ritinot
     ------------------------------------------------------------------ */
  (function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    items.forEach(function (el) { observer.observe(el); });
  })();

  /* ------------------------------------------------------------------
     5. Skaitītāji ar pareizu latviešu locījumu
     ------------------------------------------------------------------ */
  (function initCounters() {
    var counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;

    /**
     * Latviešu valodas skaitļa saskaņošana.
     *  0        → ģenitīvs daudzskaitlī ("0 dienu")
     *  1, 21…   → vienskaitlis ("1 diena"), izņemot 11
     *  pārējie  → daudzskaitlis ("7 dienas")
     */
    function declension(n, forms) {
      if (!forms) return "";
      if (n === 0 && forms.zero) return forms.zero;
      if (n % 10 === 1 && n % 100 !== 11) return forms.one;
      return forms.many;
    }

    function render(el, value) {
      var forms = el.dataset.one
        ? { one: el.dataset.one, many: el.dataset.many, zero: el.dataset.zero }
        : null;
      var suffix = forms ? " " + declension(value, forms) : (el.dataset.suffix || "");
      el.textContent = (el.dataset.prefix || "") + value + suffix;
    }

    function animate(el) {
      var target = parseInt(el.dataset.count, 10);
      if (isNaN(target) || target === 0) return;

      var duration = 1100;
      var start = null;

      function frame(now) {
        if (start === null) start = now;
        var progress = Math.min((now - start) / duration, 1);
        // easeOutExpo — ātrs sākums, mīksts nobeigums
        var eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        render(el, Math.round(target * eased));
        if (progress < 1) window.requestAnimationFrame(frame);
      }

      window.requestAnimationFrame(frame);
    }

    if (reducedMotion || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) { observer.observe(el); });
  })();

  /* ------------------------------------------------------------------
     6. BUJ — vienlaikus atvērts viens jautājums
     ------------------------------------------------------------------ */
  (function initFaq() {
    var items = document.querySelectorAll(".faq__item");
    items.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  })();

  /* ------------------------------------------------------------------
     7. Formu validācija un nosūtīšana
     ------------------------------------------------------------------ */
  (function initForms() {
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    var MSG = {
      emailEmpty: "Lūdzu, ievadi e-pasta adresi.",
      emailInvalid: "Šķiet, e-pasta adresē ir kļūda. Pārbaudi, lūdzu.",
      phoneInvalid: "Lūdzu, ievadi derīgu tālruņa numuru, piemēram, +371 20 000 000.",
      sending: "Sūtām…",
      ok: "Paldies! Pieteikums saņemts. Dizaina koncepciju atsūtīsim 24 stundu laikā.",
      mailto: "Atvērām tavu e-pasta programmu ar sagatavotu vēstuli — atliek nospiest “Sūtīt”.",
      fail: "Neizdevās nosūtīt pieteikumu. Uzraksti mums tieši: "
    };

    function setError(input, message) {
      var errorId = input.getAttribute("aria-describedby");
      var box = errorId ? document.getElementById(errorId) : null;
      input.setAttribute("aria-invalid", message ? "true" : "false");
      if (box) box.textContent = message || "";
      return !message;
    }

    function validEmail(input) {
      var value = input.value.trim();
      if (!value) return setError(input, MSG.emailEmpty);
      if (!EMAIL_RE.test(value)) return setError(input, MSG.emailInvalid);
      return setError(input, "");
    }

    function validPhone(input) {
      var value = input.value.trim();
      if (!value) return setError(input, "");                 // neobligāts lauks
      var digits = value.replace(/\D/g, "");
      if (!/^[+\d\s()\-]+$/.test(value) || digits.length < 8) {
        return setError(input, MSG.phoneInvalid);
      }
      return setError(input, "");
    }

    function showStatus(form, state, text) {
      var box = form.querySelector(".form-status");
      if (!box) return;
      box.hidden = false;
      box.setAttribute("data-state", state);
      box.textContent = text;
    }

    function buildMailto(form, address) {
      var data = new FormData(form);
      var lines = [];
      var labels = {
        vards: "Vārds",
        epasts: "E-pasts",
        talrunis: "Tālrunis",
        nozare: "Uzņēmums vai nozare",
        zina: "Ziņa"
      };

      Object.keys(labels).forEach(function (key) {
        var value = (data.get(key) || "").toString().trim();
        if (value) lines.push(labels[key] + ": " + value);
      });

      return "mailto:" + address +
        "?subject=" + encodeURIComponent("Pieteikums bezmaksas dizaina paraugam") +
        "&body=" + encodeURIComponent(lines.join("\n") + "\n\nSūtīts no webveido.com");
    }

    document.querySelectorAll("form[data-fallback-email]").forEach(function (form) {
      var emailInput = form.querySelector('input[type="email"]');
      var phoneInput = form.querySelector('input[type="tel"]');
      var button = form.querySelector('button[type="submit"]');
      var label = button ? button.querySelector("[data-submit-label]") : null;
      var labelText = label ? label.textContent : "";

      // Kļūdu paziņojumu noņemam, tiklīdz lietotājs sāk labot
      if (emailInput) {
        emailInput.addEventListener("input", function () {
          if (emailInput.getAttribute("aria-invalid") === "true") validEmail(emailInput);
        });
        emailInput.addEventListener("blur", function () {
          if (emailInput.value.trim()) validEmail(emailInput);
        });
      }

      if (phoneInput) {
        phoneInput.addEventListener("blur", function () { validPhone(phoneInput); });
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        // Mēstuļu slazds — roboti aizpilda paslēptos laukus
        var honeypot = form.querySelector('input[name="uznemums-hp"]');
        if (honeypot && honeypot.value) return;

        var ok = true;
        if (emailInput) ok = validEmail(emailInput) && ok;
        if (phoneInput) ok = validPhone(phoneInput) && ok;

        if (!ok) {
          var firstInvalid = form.querySelector('[aria-invalid="true"]');
          if (firstInvalid) firstInvalid.focus();
          return;
        }

        var endpoint = form.dataset.endpoint;
        var fallback = form.dataset.fallbackEmail;

        // Serveris nav pieslēgts — atveram e-pasta programmu ar gatavu vēstuli
        if (!endpoint) {
          window.location.href = buildMailto(form, fallback);
          showStatus(form, "ok", MSG.mailto);
          return;
        }

        if (button) {
          button.disabled = true;
          if (label) label.textContent = MSG.sending;
        }

        fetch(endpoint, {
          method: "POST",
          headers: { "Accept": "application/json" },
          body: new FormData(form)
        })
          .then(function (response) {
            if (!response.ok) throw new Error("HTTP " + response.status);
            form.reset();
            showStatus(form, "ok", MSG.ok);
          })
          .catch(function () {
            showStatus(form, "error", MSG.fail + fallback);
          })
          .finally(function () {
            if (button) {
              button.disabled = false;
              if (label) label.textContent = labelText;
            }
          });
      });
    });
  })();

  /* ------------------------------------------------------------------
     8. Sīkumi
     ------------------------------------------------------------------ */
  (function initMisc() {
    var year = document.getElementById("gads");
    if (year) year.textContent = new Date().getFullYear();
  })();
})();
