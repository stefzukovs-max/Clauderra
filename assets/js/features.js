/* ==========================================================================
   WebVeido — papildu funkcijas
   --------------------------------------------------------------------------
   1.  Ritināšanas progress un aktīvās sadaļas iezīmēšana
   2.  Sīkdatņu piekrišana
   3.  Pieteikumu saglabāšana (padod tālāk administrācijas panelim)

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
})();
