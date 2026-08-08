/* ==========================================================================
   WebVeido — hero aina
   --------------------------------------------------------------------------
   Canvas 2D, nevis WebGL — tāpat izskatās kā dzīva gaisma, bet nav atkarīga
   no GPU draiveriem un nesabojā headless renderēšanu. Divi slāņi:

     1. Aurora — trīs peldošas gradienta lāses, "lighter" sajaukšanā
     2. Putekļi — smalki punkti, kas lēni ceļas augšup un mirgo

   Abi slāņi reaģē uz peles pozīciju (viegla paralakse), apstājas, kad hero
   nav ekrānā vai cilne nav aktīva, un vispār netiek zīmēti, ja lietotājs
   izvēlējies samazinātu kustību — tad paliek tikai CSS gradients no
   main.css (`.hero::before`).
   ========================================================================== */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  var canvas = document.getElementById("hero-canvas");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d", { alpha: true });
  var hero = canvas.closest(".hero");
  if (!hero) return;

  var W = 0, H = 0, DPR = 1;
  var running = false;
  var raf = 0;
  var t0 = performance.now();

  // Peles mērķa pozīcija (0..1) un tā, kurai sekojam ar aizturi —
  // aizture padara kustību mīkstu, nevis raustītu.
  var targetX = 0.5, targetY = 0.32;
  var mx = 0.5, my = 0.32;

  var narrow = window.matchMedia("(max-width: 48rem)").matches;

  var BLOBS = [
    { hue: "225 25 65", baseX: 0.24, baseY: 0.30, r: 0.52, ax: 0.09, ay: 0.07, speed: 0.055, phase: 0 },
    { hue: "349 78 58", baseX: 0.78, baseY: 0.22, r: 0.46, ax: 0.07, ay: 0.09, speed: 0.041, phase: 2.1 },
    { hue: "38 82 58", baseX: 0.55, baseY: 0.68, r: 0.40, ax: 0.06, ay: 0.05, speed: 0.063, phase: 4.4 }
  ];

  var dust = [];
  function seedDust() {
    var count = narrow ? 26 : 60;
    dust = [];
    for (var i = 0; i < count; i++) {
      dust.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.6 + Math.random() * 1.4,
        speed: 0.004 + Math.random() * 0.01,
        drift: (Math.random() - 0.5) * 0.02,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.6 + Math.random() * 1.2
      });
    }
  }

  function resize() {
    var rect = hero.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    narrow = window.matchMedia("(max-width: 48rem)").matches;
    seedDust();
  }

  function draw(now) {
    raf = 0;
    if (!running) return;

    var t = (now - t0) / 1000;

    // Aizturēta sekošana pelei — eksponenciāla tuvošanās mērķim.
    mx += (targetX - mx) * 0.04;
    my += (targetY - my) * 0.04;

    ctx.clearRect(0, 0, W, H);

    // --- 1. Aurora ---
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < BLOBS.length; i++) {
      var b = BLOBS[i];
      var driftX = Math.sin(t * b.speed * 6 + b.phase) * b.ax;
      var driftY = Math.cos(t * b.speed * 5 + b.phase) * b.ay;
      var px = (b.baseX + driftX + (mx - 0.5) * 0.05) * W;
      var py = (b.baseY + driftY + (my - 0.5) * 0.05) * H;
      var r = b.r * Math.max(W, H) * 0.62;

      var g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, "hsl(" + b.hue.split(" ")[0] + " " + b.hue.split(" ")[1] + "% " + b.hue.split(" ")[2] + "% / 0.20)");
      g.addColorStop(0.55, "hsl(" + b.hue.split(" ")[0] + " " + b.hue.split(" ")[1] + "% " + b.hue.split(" ")[2] + "% / 0.07)");
      g.addColorStop(1, "hsl(" + b.hue.split(" ")[0] + " " + b.hue.split(" ")[1] + "% " + b.hue.split(" ")[2] + "% / 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- 2. Putekļi ---
    ctx.globalCompositeOperation = "source-over";
    for (var j = 0; j < dust.length; j++) {
      var d = dust[j];
      d.y -= d.speed * 0.6;
      d.x += d.drift * 0.01;
      if (d.y < -0.02) { d.y = 1.02; d.x = Math.random(); }
      if (d.x < -0.02) d.x = 1.02;
      if (d.x > 1.02) d.x = -0.02;

      var alpha = 0.14 + Math.sin(t * d.twinkle + d.phase) * 0.10;
      var dx = d.x * W + (mx - 0.5) * 14;
      var dy = d.y * H + (my - 0.5) * 10;

      ctx.beginPath();
      ctx.fillStyle = "rgb(255 245 250 / " + Math.max(0, alpha).toFixed(3) + ")";
      ctx.arc(dx, dy, d.r * DPR * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = window.requestAnimationFrame(draw);
  }

  function start() {
    if (running) return;
    running = true;
    canvas.classList.add("is-ready");
    if (!raf) raf = window.requestAnimationFrame(draw);
  }

  function stop() {
    running = false;
    if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
  }

  // Paralakse: peles pozīcija relatīvi pret hero, ar rezervi ārpus tā.
  window.addEventListener("pointermove", function (e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    var rect = hero.getBoundingClientRect();
    targetX = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    targetY = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

    // Tā pati pozīcija baro CSS "starmeša" slāni virs canvas — skat. motion.css.
    hero.style.setProperty("--spot-x", (targetX * 100).toFixed(1) + "%");
    hero.style.setProperty("--spot-y", (targetY * 100).toFixed(1) + "%");
  }, { passive: true });

  window.addEventListener("resize", resize);

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && document.visibilityState === "visible") start();
      else stop();
    });
  }, { threshold: 0.01 });
  io.observe(hero);

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") stop();
    else if (hero.getBoundingClientRect().bottom > 0) start();
  });

  resize();
})();
