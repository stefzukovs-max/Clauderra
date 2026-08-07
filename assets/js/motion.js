/* ==========================================================================
   WebVeido — kustības un 3D slānis
   --------------------------------------------------------------------------
   Bez bibliotēkām. Viss ir papildinājums virs strādājošas lapas:
   ja šis fails neielādējas, mājaslapa darbojas tieši tāpat.

   1.  3D noliece
   2.  Magnētiskās pogas
   3.  Koda loga peldēšana
   ========================================================================== */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  // Izslēdzam tikai rupjo kursoru (skārienekrānus). Apzināti neprasām
  // `hover: hover`, jo daļa vižu (un dažas pārlūkprogrammas) neziņo par
  // norādītājierīci vispār — tādā gadījumā efektu labāk atstāt ieslēgtu
  // nekā klusi pazaudēt.
  var finePointer = !window.matchMedia("(pointer: coarse)").matches;


  /* ------------------------------------------------------------------
     1. 3D noliece
     ------------------------------------------------------------------ */
  (function initTilt() {
    if (reduced || !finePointer) return;

    var selector = ".entry__card";
    var elements = document.querySelectorAll(selector);

    elements.forEach(function (el) {
      el.classList.add("tilt");

      // Formā noliece ir daudz maigāka — tur lietotājs raksta
      var maxTilt = 5;

      var pending = null;
      var raf = 0;

      function apply() {
        raf = 0;
        if (!pending) return;

        var rect = el.getBoundingClientRect();
        var px = (pending.clientX - rect.left) / rect.width;
        var py = (pending.clientY - rect.top) / rect.height;

        el.style.setProperty("--tilt-mx", (px * 100).toFixed(2) + "%");
        el.style.setProperty("--tilt-my", (py * 100).toFixed(2) + "%");
        el.style.setProperty("--tilt-ry", ((px - 0.5) * 2 * maxTilt).toFixed(2) + "deg");
        el.style.setProperty("--tilt-rx", (-(py - 0.5) * 2 * maxTilt).toFixed(2) + "deg");
      }

      el.addEventListener("pointerenter", function () {
        el.classList.add("is-tilting");
      });

      el.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        pending = e;
        if (!raf) raf = window.requestAnimationFrame(apply);
      }, { passive: true });

      el.addEventListener("pointerleave", function () {
        el.classList.remove("is-tilting");
        if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
        pending = null;
        el.style.setProperty("--tilt-rx", "0deg");
        el.style.setProperty("--tilt-ry", "0deg");
      });
    });
  })();

  /* ------------------------------------------------------------------
     2. Magnētiskās pogas
     ------------------------------------------------------------------ */
  (function initMagnetic() {
    if (reduced || !finePointer) return;

    document.querySelectorAll(".btn--primary").forEach(function (btn) {
      btn.classList.add("magnetic");

      var raf = 0;
      var pending = null;

      function apply() {
        raf = 0;
        if (!pending) return;
        var rect = btn.getBoundingClientRect();
        var dx = pending.clientX - (rect.left + rect.width / 2);
        var dy = pending.clientY - (rect.top + rect.height / 2);
        btn.style.setProperty("--mag-x", (dx * 0.18).toFixed(1) + "px");
        btn.style.setProperty("--mag-y", (dy * 0.3).toFixed(1) + "px");
      }

      btn.addEventListener("pointerenter", function () {
        btn.classList.add("is-pulling");
      });

      btn.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        pending = e;
        if (!raf) raf = window.requestAnimationFrame(apply);
      }, { passive: true });

      btn.addEventListener("pointerleave", function () {
        btn.classList.remove("is-pulling");
        if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
        pending = null;
        btn.style.setProperty("--mag-x", "0px");
        btn.style.setProperty("--mag-y", "0px");
      });
    });
  })();

  /* ------------------------------------------------------------------
     3. Koda loga peldēšana pēc kursora
     ------------------------------------------------------------------ */
  (function initCodeFloat() {
    if (reduced || !finePointer) return;

    var panel = document.querySelector(".ai-panel");
    var win = document.querySelector(".code-window");
    if (!panel || !win) return;

    var raf = 0;
    var pending = null;

    function apply() {
      raf = 0;
      if (!pending) return;
      var rect = panel.getBoundingClientRect();
      var px = (pending.clientX - rect.left) / rect.width - 0.5;
      var py = (pending.clientY - rect.top) / rect.height - 0.5;
      win.style.setProperty("--float-ry", (px * 10).toFixed(2) + "deg");
      win.style.setProperty("--float-rx", (2 - py * 8).toFixed(2) + "deg");
    }

    panel.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      pending = e;
      if (!raf) raf = window.requestAnimationFrame(apply);
    }, { passive: true });

    panel.addEventListener("pointerleave", function () {
      if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
      pending = null;
      win.style.setProperty("--float-ry", "0deg");
      win.style.setProperty("--float-rx", "2deg");
    });
  })();
})();
