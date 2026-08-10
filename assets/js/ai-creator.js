/* ==========================================================================
   WebVeido — AI Izveides demo
   --------------------------------------------------------------------------
   Trīs reāli, iepriekš izstrādāti piemēri (nevis katru reizi no jauna
   ģenerēts, kombinētisks rezultāts) — vienkārša ciļņu pārslēgšana starp
   trim gataviem HTML fragmentiem (skat. #ai-izveide index.html). Godīgi:
   nekas šeit netiek "ģenerēts" reālā laikā, tāpēc arī nav simulēta
   ielādes animācija, kas to apgalvotu.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.getElementById("ai-creator");
  if (!root) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".ai-demo-tab"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".ai-demo"));
  var subscribeBtn = document.getElementById("ai-subscribe");

  var DEMO_LABELS = {
    restorans: "Kafejnīca Rasa (Restorāns)",
    skaistumkopsana: "Silta Telpa (Skaistumkopšana)",
    buvnieciba: "Ozola Būve (Būvniecība)"
  };

  var current = tabs.length ? tabs[0].getAttribute("data-demo") : null;

  function showDemo(value) {
    current = value;
    tabs.forEach(function (tab) {
      var active = tab.getAttribute("data-demo") === value;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.id !== "ai-demo-" + value;
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      showDemo(tab.getAttribute("data-demo"));
    });
  });

  if (subscribeBtn) {
    subscribeBtn.addEventListener("click", function () {
      var zina = document.getElementById("zina");
      if (zina) {
        var label = DEMO_LABELS[current] || "izvēlētais piemērs";
        zina.value = "Interesē AI Izveides abonements (20 €/mēn.) — piemērs: " + label + ".";
      }
      var target = document.getElementById("sakt");
      if (target) target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      var vards = document.getElementById("vards");
      if (vards) window.setTimeout(function () { vards.focus({ preventScroll: true }); }, reduced ? 0 : 500);
    });
  }
})();
