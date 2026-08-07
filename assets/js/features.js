/* ==========================================================================
   WebVeido — papildu funkcijas
   --------------------------------------------------------------------------
   1.  Ritināšanas progress un aktīvās sadaļas iezīmēšana
   2.  Cenu kalkulators
   3.  Komandu palete (Ctrl / ⌘ + K)
   4.  Sīkdatņu piekrišana
   5.  Pieteikumu saglabāšana (padod tālāk administrācijas panelim)

   Katra daļa strādā atsevišķi — ja kāds elements lapā neeksistē, pārējās
   turpina darboties.
   ========================================================================== */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     1. Ritināšanas progress + aktīvā sadaļa
     ------------------------------------------------------------------ */
  (function initProgress() {
    var bar = document.getElementById("progress");
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav__link[href^='#']"));
    var sections = links
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);

    if (!bar && !sections.length) return;

    var ticking = false;

    function update() {
      ticking = false;

      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
        bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      }

      // Aktīvā ir pēdējā sadaļa, kuras augšmala jau pagājusi zem galvenes
      var line = window.scrollY + 140;
      var active = null;
      sections.forEach(function (sec) {
        if (sec.offsetTop <= line) active = sec;
      });

      links.forEach(function (a) {
        var on = active && a.getAttribute("href") === "#" + active.id;
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }

    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    window.addEventListener("resize", update, { passive: true });
    update();
  })();

  /* ------------------------------------------------------------------
     2. Cenu kalkulators
     ------------------------------------------------------------------ */
  (function initCalculator() {
    var form = document.getElementById("calc");
    if (!form) return;

    var rowsBox = document.getElementById("calc-rows");
    var totalBox = document.getElementById("calc-total");
    var daysBox = document.getElementById("calc-days");
    var cta = document.getElementById("calc-cta");

    var BASE_DAYS = { vizitkarte: 5, uznemuma: 7, veikals: 12 };
    var EXTRA_DAYS = { teksti: 2, pieraksts: 2, logo: 2 };   // pārējie +1

    function euro(n) {
      return n.toLocaleString("lv-LV") + " €";
    }

    function plural(n, one, many) {
      if (n % 10 === 1 && n % 100 !== 11) return one;
      return many;
    }

    function state() {
      var base = form.querySelector('input[name="base"]:checked');
      var speed = form.querySelector('input[name="speed"]:checked');
      var extras = Array.prototype.slice.call(
        form.querySelectorAll('input[name="extra"]:checked'));
      return { base: base, speed: speed, extras: extras };
    }

    function labelOf(input) {
      var b = input.closest(".calc__opt").querySelector(".calc__label b");
      return b ? b.textContent : input.value;
    }

    function recalc() {
      var st = state();
      if (!st.base) return;

      var rows = [];
      var subtotal = Number(st.base.dataset.price || 0);
      var days = BASE_DAYS[st.base.value] || 7;

      rows.push([labelOf(st.base), euro(subtotal)]);

      st.extras.forEach(function (x) {
        var p = Number(x.dataset.price || 0);
        subtotal += p;
        days += EXTRA_DAYS[x.value] || 1;
        rows.push([labelOf(x), "+ " + euro(p)]);
      });

      var rush = st.speed && st.speed.value === "steidzams";
      var total = subtotal;

      if (rush) {
        var fee = Math.round(subtotal * 0.3);
        total += fee;
        days = Math.max(3, Math.ceil(days * 0.6));
        rows.push(["Steidzamības piemaksa (30 %)", "+ " + euro(fee)]);
      }

      rowsBox.innerHTML = rows.map(function (r) {
        return '<div class="calc__row"><span>' + r[0] + "</span><span>" + r[1] + "</span></div>";
      }).join("");

      totalBox.textContent = euro(total);
      daysBox.textContent = days + " " + plural(days, "darba diena", "darba dienas");

      form.dataset.summary = rows.map(function (r) { return r[0]; }).join(", ") +
        " — aptuveni " + euro(total) + ", " + days + " " +
        plural(days, "darba diena", "darba dienas");
      form.dataset.total = String(total);
    }

    form.addEventListener("change", recalc);
    recalc();

    // Aprēķinu paņemam līdzi uz kontaktformu
    if (cta) {
      cta.addEventListener("click", function () {
        var zina = document.getElementById("zina");
        if (zina && !zina.value.trim()) {
          zina.value = "Aprēķins no kalkulatora: " + (form.dataset.summary || "");
        }
        try {
          sessionStorage.setItem("wv-calc", form.dataset.summary || "");
        } catch (e) {}
      });
    }
  })();

  /* ------------------------------------------------------------------
     3. Komandu palete
     ------------------------------------------------------------------ */
  (function initPalette() {
    var palette = document.getElementById("palette");
    var input = document.getElementById("palette-input");
    var list = document.getElementById("palette-list");
    var openBtn = document.getElementById("palette-open");
    if (!palette || !input || !list) return;

    // Rādītāju veidojam no lapas satura, nevis rakstām ar roku
    var items = [];

    document.querySelectorAll("section[id]").forEach(function (sec) {
      var h = sec.querySelector("h2");
      if (!h) return;
      var eyebrow = sec.querySelector(".eyebrow");
      items.push({
        title: h.textContent.trim(),
        hint: eyebrow ? eyebrow.textContent.trim() : "Sadaļa",
        href: "#" + sec.id
      });
    });

    document.querySelectorAll(".faq__item").forEach(function (item, i) {
      var q = item.querySelector(".faq__q");
      if (!q) return;
      if (!item.id) item.id = "buj-" + (i + 1);
      items.push({ title: q.textContent.trim(), hint: "BUJ", href: "#" + item.id, faq: item });
    });

    var filtered = items.slice();
    var cursor = 0;

    // Diakritiskās zīmes noņemam, lai «cenas» atrastu arī «cenās»
    function fold(t) {
      return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function render() {
      if (!filtered.length) {
        list.innerHTML = '<li class="palette__empty">Nekas netika atrasts.</li>';
        return;
      }
      list.innerHTML = filtered.map(function (it, i) {
        return '<li role="option" aria-selected="' + (i === cursor) + '">' +
          '<button class="palette__item" type="button" data-i="' + i + '" ' +
          'aria-selected="' + (i === cursor) + '">' +
          "<b>" + it.title + "</b><small>" + it.hint + "</small></button></li>";
      }).join("");
    }

    function filter(q) {
      var f = fold(q.trim());
      filtered = f ? items.filter(function (it) {
        return fold(it.title).indexOf(f) > -1 || fold(it.hint).indexOf(f) > -1;
      }) : items.slice();
      cursor = 0;
      render();
    }

    function open() {
      palette.setAttribute("data-open", "true");
      document.body.style.overflow = "hidden";
      input.value = "";
      filter("");
      input.focus();
    }

    function close() {
      palette.setAttribute("data-open", "false");
      document.body.style.overflow = "";
      if (openBtn) openBtn.focus();
    }

    function go(i) {
      var it = filtered[i];
      if (!it) return;
      close();
      if (it.faq) it.faq.open = true;
      var target = document.querySelector(it.href);
      if (target) {
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
    }

    if (openBtn) openBtn.addEventListener("click", open);

    document.addEventListener("keydown", function (e) {
      var isOpen = palette.getAttribute("data-open") === "true";

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        isOpen ? close() : open();
        return;
      }

      if (!isOpen) return;

      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        cursor = Math.min(cursor + 1, filtered.length - 1);
        render();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        cursor = Math.max(cursor - 1, 0);
        render();
      } else if (e.key === "Enter") {
        e.preventDefault();
        go(cursor);
      }
    });

    input.addEventListener("input", function () { filter(input.value); });

    list.addEventListener("click", function (e) {
      var btn = e.target.closest(".palette__item");
      if (btn) go(Number(btn.dataset.i));
    });

    palette.addEventListener("click", function (e) {
      if (e.target === palette) close();
    });
  })();

  /* ------------------------------------------------------------------
     4. Sīkdatņu piekrišana
     ------------------------------------------------------------------ */
  (function initConsent() {
    var box = document.getElementById("consent");
    if (!box) return;

    var KEY = "wv-consent";
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}

    if (saved) return;                     // izvēle jau ir izdarīta

    box.hidden = false;
    window.setTimeout(function () { box.setAttribute("data-open", "true"); }, 900);

    function decide(value) {
      try { localStorage.setItem(KEY, value); } catch (e) {}
      box.setAttribute("data-open", "false");
      window.setTimeout(function () { box.hidden = true; }, 520);
    }

    var yes = document.getElementById("consent-accept");
    var no = document.getElementById("consent-decline");
    if (yes) yes.addEventListener("click", function () { decide("visas"); });
    if (no) no.addEventListener("click", function () { decide("nepieciesamas"); });
  })();

  /* ------------------------------------------------------------------
     5. Pieteikumu saglabāšana
     ------------------------------------------------------------------ */
  (function initLeadCapture() {
    if (!window.WVStore) return;

    document.querySelectorAll("form[data-fallback-email]").forEach(function (form) {
      // Šis klausītājs reģistrējas pēc main.js, tāpēc validācija jau ir notikusi
      form.addEventListener("submit", function () {
        var honeypot = form.querySelector('input[name="uznemums-hp"]');
        if (honeypot && honeypot.value) return;
        if (form.querySelector('[aria-invalid="true"]')) return;

        var get = function (n) {
          var el = form.querySelector('[name="' + n + '"]');
          return el ? el.value.trim() : "";
        };

        if (!get("epasts")) return;

        var calc = null;
        try { calc = sessionStorage.getItem("wv-calc"); } catch (e) {}

        window.WVStore.add({
          vards: get("vards"),
          epasts: get("epasts"),
          talrunis: get("talrunis"),
          nozare: get("nozare"),
          zina: get("zina"),
          avots: form.id === "lead-form" ? "hero forma" : "kontaktforma",
          aprekins: calc || null
        });
      });
    });
  })();
})();
