/* ==========================================================================
   WebVeido — kustības un 3D slānis
   --------------------------------------------------------------------------
   Bez bibliotēkām. Viss ir papildinājums virs strādājošas lapas:
   ja šis fails neielādējas, mājaslapa darbojas tieši tāpat.

   1.  3D noliece
   2.  Magnētiskās pogas
   3.  Koda loga peldēšana
   4.  Starojošas kartītes (spotlight)
   5.  Pielāgotais kursors
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

  /* ------------------------------------------------------------------
     4. Starojošas kartītes (spotlight)
     --------------------------------------------------------------------
     Vieglāka māsa 3D nolieces efektam — tikai gaismas plankums, kas seko
     kursoram, bez rotācijas. Lieto tur, kur rotācija konfliktētu ar citu
     kustību iekšpusē (piem., portfolio kartītē, kur attēls jau ritinās).
     ------------------------------------------------------------------ */
  (function initGlow() {
    if (reduced || !finePointer) return;

    // `.entry__card` apzināti nav sarakstā — tai jau ir `.tilt` (initTilt
    // augstāk), kas dod savu spotlight caur `::after`. Abi uz viena
    // elementa dublētos.
    var selector = ".work__frame, .plan, .card, .cap, .step";
    var edgeSelector = ".plan, .card, .step";
    var elements = document.querySelectorAll(selector);

    elements.forEach(function (el) {
      el.classList.add("glow");
      if (el.matches(edgeSelector)) el.classList.add("has-edge");

      var raf = 0;
      var pending = null;

      function apply() {
        raf = 0;
        if (!pending) return;
        var rect = el.getBoundingClientRect();
        el.style.setProperty("--glow-x", (pending.clientX - rect.left).toFixed(1) + "px");
        el.style.setProperty("--glow-y", (pending.clientY - rect.top).toFixed(1) + "px");
      }

      el.addEventListener("pointerenter", function () { el.classList.add("is-glowing"); });

      el.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        pending = e;
        if (!raf) raf = window.requestAnimationFrame(apply);
      }, { passive: true });

      el.addEventListener("pointerleave", function () {
        el.classList.remove("is-glowing");
        if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
        pending = null;
      });
    });
  })();

  /* ------------------------------------------------------------------
     5. Pielāgotais kursors
     --------------------------------------------------------------------
     Punkts seko precīzi, gredzens — ar vieglu aizturi. Abus vada viens
     rAF cikls, lai nesamulsinātu pārlūku ar vairākiem paralēliem.
     Ieslēdzas tikai pēc pirmās peles kustības, tāpēc skārienekrānā vai
     tastatūras lietotājam tas nekad neparādās.
     ------------------------------------------------------------------ */
  (function initCursor() {
    if (reduced || !finePointer) return;

    var dot = document.createElement("div");
    var ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var tx = 0, ty = 0;      // mērķa pozīcija (punkts)
    var rx = 0, ry = 0;      // gredzena pašreizējā, aizturētā pozīcija
    var started = false;
    var raf = 0;

    var hoverSelector = "a, button, input, textarea, summary, [role='button'], .work, .plan, .card";

    function frame() {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      dot.style.transform = "translate3d(" + tx + "px," + ty + "px,0) translate(-50%,-50%)";
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";
      raf = window.requestAnimationFrame(frame);
    }

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!started) {
        started = true;
        rx = tx; ry = ty;
        root.classList.add("has-cursor");
        raf = window.requestAnimationFrame(frame);
      }
      var target = e.target.closest && e.target.closest(hoverSelector);
      root.classList.toggle("cursor-hover", !!target);
    }, { passive: true });

    window.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") root.classList.add("cursor-down");
    });
    window.addEventListener("pointerup", function () { root.classList.remove("cursor-down"); });

    // Ja pele pamet logu, kursors nedrīkst palikt "iesalis" ekrāna malā
    document.addEventListener("mouseleave", function () { root.classList.remove("has-cursor"); });
    document.addEventListener("mouseenter", function () { if (started) root.classList.add("has-cursor"); });
  })();
})();
