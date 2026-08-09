/* ==========================================================================
   WebVeido — ritināšanas dziļuma dzinējs
   --------------------------------------------------------------------------
   Atšķirībā no `[data-reveal]` (kas iedegas vienreiz un paliek), šis piešķir
   sadaļām un kartītēm nepārtrauktu dziļumu, kas tieši seko ritināšanas
   pozīcijai — tāpēc tas jūtas fiziski piesaistīts žestam, nevis kā vienreizēja
   animācija. Katram reģistrētam elementam iestata CSS mainīgo `--depth`
   (-1 augšā izejot, 0 ekrāna centrā, 1 lejā ienākot); pašu vizuālo izteiksmi
   (rotācija, mērogs, izpludums) nosaka motion.css, nevis šis fails.

   Viens rAF cikls visai lapai. Aktīvo elementu kopu (tos, kas ir tuvu
   redzamajai daļai) uztur IntersectionObserver, tāpēc katrā kadrā tiek
   lasīti tikai daži elementi, nevis visa lapa. Pilnībā izslēgts zem
   prefers-reduced-motion — CSS mainīgais tad vienkārši nekad neiestatās,
   un `calc(var(--depth, 0) * ...)` atrisinās uz 0.
   ========================================================================== */

(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var clamp = function (n, a, b) { return Math.max(a, Math.min(b, n)); };

  /* ------------------------------------------------------------------
     1. Sadaļu un kartīšu reģistrācija
     ------------------------------------------------------------------ */
  var sectionEls = Array.prototype.slice.call(
    document.querySelectorAll("main > section, .trust")
  );
  sectionEls.forEach(function (el) { el.setAttribute("data-depth", "section"); });

  var cardEls = Array.prototype.slice.call(
    document.querySelectorAll(".work__frame, .plan, .cap, .step")
  );
  cardEls.forEach(function (el) { el.setAttribute("data-depth", "card"); });

  var tracked = sectionEls.concat(cardEls);
  if (!tracked.length && !document.querySelector(".hero")) return;

  /* ------------------------------------------------------------------
     2. Aktīvā kopa — tikai elementi tuvu skata laukam tiek skaitīti katrā
        kadrā. rootMargin dod rezervi, lai dziļums jau būtu pareizs brīdī,
        kad elements ienāk ekrānā, nevis "uzlec" pēc tam.
     ------------------------------------------------------------------ */
  var active = new Set();
  if ("IntersectionObserver" in window && tracked.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) active.add(entry.target);
          else {
            active.delete(entry.target);
            entry.target.style.setProperty("--depth", "0");
          }
        });
      },
      { rootMargin: "50% 0px 50% 0px", threshold: 0 }
    );
    tracked.forEach(function (el) { io.observe(el); });
  } else {
    tracked.forEach(function (el) { active.add(el); });
  }

  /* ------------------------------------------------------------------
     3. Izlīdzināšana — katrs elements virzās uz savu jauno vērtību ar
        vieglu aizturi, nevis lecot uz to uzreiz. Tas dod "smagumu"
        kustībai bez atpalikšanas sajūtas.
     ------------------------------------------------------------------ */
  // Laikam piesaistīta izlīdzināšana — ne fiksēta daļa uz kadru, jo tad
  // ātrums mainītos līdz ar kadru biežumu (ātrāks 120 Hz ekrānā, gausāks
  // zemas veiktspējas ierīcē). `halfLifeMs` ir laiks, kurā attālums līdz
  // mērķim samazinās uz pusi — tas jūtas vienādi neatkarīgi no fps.
  var smoothed = new WeakMap();
  function lerp(el, raw, halfLifeMs, dt) {
    var prev = smoothed.has(el) ? smoothed.get(el) : raw;
    var factor = 1 - Math.pow(0.5, dt / halfLifeMs);
    var next = prev + (raw - prev) * factor;
    if (Math.abs(next) < 0.0005) next = 0;
    smoothed.set(el, next);
    return next;
  }

  function sectionDepth(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight;
    var center = r.top + r.height / 2;
    var raw = (center - vh / 2) / (vh / 2 + r.height / 2);
    return clamp(raw, -1, 1);
  }

  var hero = document.querySelector(".hero");

  /* ------------------------------------------------------------------
     4. Galvenais cikls — lasa vispirms visus, tad raksta visus, lai
        nešķeltu izkārtojumu (layout thrashing).
     ------------------------------------------------------------------ */
  var running = true;
  var lastTime = 0;

  function frame(now) {
    if (!running) return;

    // Pirmais kadrs vai ilga pauze (cilne bija fonā) — nevis milzīgs
    // lēciens izlīdzināšanā, bet vienkārši sākam no jauna.
    var dt = lastTime ? Math.min(now - lastTime, 100) : 16.7;
    lastTime = now;

    if (hero) {
      var vh = window.innerHeight;
      var rawExit = clamp(window.scrollY / (vh * 0.85), 0, 1);
      hero.style.setProperty("--hero-exit", lerp(hero, rawExit, 120, dt).toFixed(4));
    }

    if (active.size) {
      var reads = [];
      active.forEach(function (el) { reads.push([el, sectionDepth(el)]); });
      reads.forEach(function (pair) {
        pair[0].style.setProperty("--depth", lerp(pair[0], pair[1], 140, dt).toFixed(4));
      });
    }

    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);

  document.addEventListener("visibilitychange", function () {
    running = document.visibilityState === "visible";
    if (running) window.requestAnimationFrame(frame);
  });
})();
