/* ==========================================================================
   WebVeido — papildu funkcijas
   --------------------------------------------------------------------------
   1.  Ritināšanas progress un aktīvās sadaļas iezīmēšana
   2.  Sīkdatņu piekrišana
   3.  Pieteikumu saglabāšana (padod tālāk administrācijas panelim)
   4.  Projekta cenas kalkulators

   Katra daļa strādā atsevišķi — ja kāds elements lapā neeksistē, pārējās
   turpina darboties.
   ========================================================================== */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     1. Ritināšanas progress
     --------------------------------------------------------------------
     Aktīvās sadaļas / `aria-current` iezīmēšanu dara `initChapters` main.js
     (viena atjaunināšanas vieta gan galvenes navigācijai, gan nodaļu
     joslai) — šeit tas agrāk dublējās ar savu, neatkarīgu skrituma
     klausītāju, kas cīnījās par tiem pašiem atribūtiem katrā kadrā.
     ------------------------------------------------------------------ */
  (function initProgress() {
    var bar = document.getElementById("progress");
    if (!bar) return;

    var ticking = false;

    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    }

    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    window.addEventListener("resize", update, { passive: true });
    update();
  })();


  /* ------------------------------------------------------------------
     2. Sīkdatņu piekrišana
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
     3. Pieteikumu saglabāšana
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
          avots: "kontaktforma",
          aprekins: calc || null
        });
      });
    });
  })();

  /* ------------------------------------------------------------------
     4. Projekta cenas kalkulators
     --------------------------------------------------------------------
     Tikai reālas, jau publicētas cenas — tās pašas summas, kas redzamas
     #cenas kartītēs. Nekas šeit netiek izdomāts vai noapaļots uz augšu.
     Izvēle tiek saglabāta sessionStorage atslēgā `wv-calc`, ko jau
     sagaida pieteikumu saglabāšana (3. daļa augstāk).
     ------------------------------------------------------------------ */
  (function initEstimator() {
    var root = document.querySelector(".estimator");
    if (!root) return;

    var opts = Array.prototype.slice.call(root.querySelectorAll(".estimator__opt"));
    var care = document.getElementById("est-care");
    var amountEl = document.getElementById("est-amount");
    var monthlyEl = document.getElementById("est-monthly");
    var hintEl = document.getElementById("est-hint");
    var ctaLabel = document.getElementById("est-cta-label");
    if (!opts.length || !amountEl || !care) return;

    // Manuāli formatējam (nevis ar Intl), lai atstarpe starp tūkstošiem
    // sakristu ar statisko marķējumu #cenas kartītēs neatkarīgi no pārlūka
    // ICU datiem — piem. "1 890", nevis "1890" vai "1,890".
    function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

    var current = {
      price: parseInt(opts[0].getAttribute("data-price"), 10) || 0,
      name: opts[0].getAttribute("data-name") || "",
      note: opts[0].getAttribute("data-note") || ""
    };
    var shown = current.price;
    var tweenRaf = 0;

    function tween(to) {
      var from = shown;
      var start = null;
      var dur = reduced ? 0 : 420;

      if (tweenRaf) window.cancelAnimationFrame(tweenRaf);

      if (!dur) {
        shown = to;
        amountEl.textContent = fmt(to);
        return;
      }

      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        shown = Math.round(from + (to - from) * eased);
        amountEl.textContent = fmt(shown);
        if (p < 1) { tweenRaf = window.requestAnimationFrame(step); }
        else { shown = to; amountEl.textContent = fmt(to); tweenRaf = 0; }
      }
      tweenRaf = window.requestAnimationFrame(step);
    }

    function render() {
      tween(current.price);
      if (monthlyEl) monthlyEl.textContent = care.checked ? " + no 90 € / mēn." : "";
      if (hintEl) hintEl.textContent = current.note + " Precīzu summu apstiprinām pēc bezmaksas audita.";
      if (ctaLabel) ctaLabel.textContent = "Pieprasīt piedāvājumu variantam “" + current.name + "”";

      try {
        sessionStorage.setItem("wv-calc", JSON.stringify({
          variants: current.name,
          cena: current.price,
          uzturesana: !!care.checked
        }));
      } catch (e) {}
    }

    opts.forEach(function (btn) {
      btn.addEventListener("click", function () {
        opts.forEach(function (b) {
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");
        current = {
          price: parseInt(btn.getAttribute("data-price"), 10) || 0,
          name: btn.getAttribute("data-name") || "",
          note: btn.getAttribute("data-note") || ""
        };
        render();
      });
    });

    care.addEventListener("change", render);

    var cta = document.getElementById("est-cta");
    if (cta) {
      cta.addEventListener("click", function () {
        var textarea = document.getElementById("zina");
        if (textarea && !textarea.value.trim()) {
          var msg = "Interesē: " + current.name + " (aptuveni " +
            fmt(current.price) + " € + PVN)";
          if (care.checked) msg += ", ar ikmēneša uzturēšanu no 90 €/mēn.";
          msg += ".";
          textarea.value = msg;
        }
      });
    }

    render();
  })();
})();
