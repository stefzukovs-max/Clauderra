/* ==========================================================================
   WebVeido — hero aina
   --------------------------------------------------------------------------
   Canvas 2D, nevis WebGL — tāpat izskatās kā dzīva gaisma, bet nav atkarīga
   no GPU draiveriem un nesabojā headless renderēšanu. Četri slāņi:

     1. Aurora — peldošas gradienta lāses ar elpojošu rādiusu, "lighter" sajaukšanā
     2. Putekļi — divslāņu (tālu/tuvu) punkti dziļuma efektam, mirgo un ceļas augšup
     3. Konstelācija — tuvākos putekļus savieno smalka gaismas līnija
     4. Zvaigžņu švīkas — reta, gaumīga "shooting star" parādība ik pa laikam

   Visi slāņi reaģē uz peles pozīciju (dziļuma atkarīga paralakse) un uz
   lēnu, autonomu "elpošanu" laikā — lai aina justos dzīva pat pirms peles
   kustības. Viss apstājas, kad hero nav ekrānā vai cilne nav aktīva, un
   vispār netiek zīmēts, ja lietotājs izvēlējies samazinātu kustību — tad
   paliek tikai CSS gradients no main.css (`.hero::before`).
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

  // Tā pati izlīdzinātā peles pozīcija, kas baro auroru, groza arī
  // pakalpojumu kartīšu skatuvi — nav vajadzīgs otrs pointermove klausītājs.
  var scene = document.getElementById("hero-scene-stage");

  var W = 0, H = 0, DPR = 1;
  var running = false;
  var raf = 0;
  var t0 = performance.now();

  // Peles mērķa pozīcija (0..1) un tā, kurai sekojam ar aizturi —
  // aizture padara kustību mīkstu, nevis raustītu.
  var targetX = 0.5, targetY = 0.32;
  var mx = 0.5, my = 0.32;

  var narrow = window.matchMedia("(max-width: 48rem)").matches;

  // Zīmola krāsas: brand-500 (rozā), gold, un neitrāls zils/violets fonam.
  var BLOBS = [
    { hue: "228 62 64", baseX: 0.20, baseY: 0.27, r: 0.58, ax: 0.10, ay: 0.08, speed: 0.055, phase: 0, pulse: 0.16, a0: 0.32, a1: 0.12 },
    { hue: "349 88 60", baseX: 0.80, baseY: 0.20, r: 0.53, ax: 0.08, ay: 0.10, speed: 0.041, phase: 2.1, pulse: 0.13, a0: 0.34, a1: 0.12 },
    { hue: "40 92 58", baseX: 0.55, baseY: 0.74, r: 0.46, ax: 0.07, ay: 0.06, speed: 0.063, phase: 4.4, pulse: 0.12, a0: 0.29, a1: 0.10 },
    { hue: "268 66 64", baseX: 0.42, baseY: 0.48, r: 0.32, ax: 0.05, ay: 0.05, speed: 0.037, phase: 1.3, pulse: 0.22, a0: 0.21, a1: 0.07 }
  ];

  // Putekļi divos dziļuma slāņos: tālie (mazi, klusi) un tuvie (lieli, spilgti,
  // reaģē vairāk uz peli) — kopā rada paralakses/dziļuma sajūtu.
  var dust = [];
  function seedDust() {
    var count = narrow ? 30 : 74;
    dust = [];
    for (var i = 0; i < count; i++) {
      var z = Math.random(); // 0 = tālu, 1 = tuvu
      dust.push({
        x: Math.random(),
        y: Math.random(),
        z: z,
        r: 0.5 + z * 1.6,
        speed: (0.003 + Math.random() * 0.006) * (0.5 + z),
        drift: (Math.random() - 0.5) * 0.02,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.5 + Math.random() * 1.3
      });
    }
  }

  // Zvaigžņu švīkas — reti, gaumīgi "shooting star" pārlaidumi.
  var streaks = [];
  var streakTimer = 0;
  var streakNext = 5000 + Math.random() * 6000;

  function spawnStreak() {
    var fromLeft = Math.random() < 0.5;
    var y0 = Math.random() * 0.35;
    streaks.push({
      x: fromLeft ? -0.06 : 1.06,
      y: y0,
      vx: (fromLeft ? 1 : -1) * (0.55 + Math.random() * 0.25),
      vy: 0.30 + Math.random() * 0.16,
      life: 0,
      maxLife: 0.85 + Math.random() * 0.35
    });
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

  var lastNow = 0;

  function draw(now) {
    raf = 0;
    if (!running) return;

    var t = (now - t0) / 1000;
    var dt = lastNow ? Math.min(now - lastNow, 100) : 16.7;
    lastNow = now;

    // Aizturēta sekošana pelei — eksponenciāla tuvošanās mērķim.
    mx += (targetX - mx) * 0.045;
    my += (targetY - my) * 0.045;

    if (scene) {
      scene.style.setProperty("--scene-ry", ((mx - 0.5) * 20).toFixed(2));
      scene.style.setProperty("--scene-rx", ((0.5 - my) * 13).toFixed(2));
    }

    // Lēna, autonoma "elpošana" — dzīvība ainā pat bez peles kustības.
    var autoX = Math.sin(t * 0.05) * 0.022;
    var autoY = Math.cos(t * 0.042) * 0.016;
    var lx = mx + autoX;
    var ly = my + autoY;

    ctx.clearRect(0, 0, W, H);

    // --- 1. Aurora ---
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < BLOBS.length; i++) {
      var b = BLOBS[i];
      var driftX = Math.sin(t * b.speed * 6 + b.phase) * b.ax;
      var driftY = Math.cos(t * b.speed * 5 + b.phase) * b.ay;
      var px = (b.baseX + driftX + (lx - 0.5) * 0.07) * W;
      var py = (b.baseY + driftY + (ly - 0.5) * 0.07) * H;
      var breathe = 1 + Math.sin(t * 0.16 + b.phase) * b.pulse;
      var r = b.r * Math.max(W, H) * 0.62 * breathe;

      var hsl = b.hue.split(" ");
      var head = "hsl(" + hsl[0] + " " + hsl[1] + "% " + hsl[2] + "%";
      var g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, head + " / " + b.a0 + ")");
      g.addColorStop(0.55, head + " / " + b.a1 + ")");
      g.addColorStop(1, head + " / 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- 2. Putekļi (ar dziļuma slāņiem) ---
    ctx.globalCompositeOperation = "source-over";
    for (var j = 0; j < dust.length; j++) {
      var d = dust[j];
      d.y -= d.speed * 0.6;
      d.x += d.drift * 0.01;
      if (d.y < -0.02) { d.y = 1.02; d.x = Math.random(); }
      if (d.x < -0.02) d.x = 1.02;
      if (d.x > 1.02) d.x = -0.02;

      var alpha = (0.08 + d.z * 0.16) + Math.sin(t * d.twinkle + d.phase) * (0.06 + d.z * 0.08);
      var parX = (lx - 0.5) * (10 + d.z * 26);
      var parY = (ly - 0.5) * (8 + d.z * 18);
      d._dx = d.x * W + parX;
      d._dy = d.y * H + parY;

      ctx.beginPath();
      ctx.fillStyle = "rgb(255 245 250 / " + Math.max(0, alpha).toFixed(3) + ")";
      ctx.arc(d._dx, d._dy, d.r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- 3. Konstelācija starp tuvākajiem putekļiem ---
    var maxDist = Math.min(W, H) * 0.11;
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 0.7;
    for (var a = 0; a < dust.length; a++) {
      var da = dust[a];
      if (da.z < 0.62) continue;
      for (var c = a + 1; c < dust.length; c++) {
        var dc = dust[c];
        if (dc.z < 0.62) continue;
        var ddx = da._dx - dc._dx;
        var ddy = da._dy - dc._dy;
        var dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist < maxDist) {
          var lineA = (1 - dist / maxDist) * 0.10 * ((da.z + dc.z) * 0.5);
          if (lineA <= 0.002) continue;
          ctx.strokeStyle = "rgb(255 250 255 / " + lineA.toFixed(3) + ")";
          ctx.beginPath();
          ctx.moveTo(da._dx, da._dy);
          ctx.lineTo(dc._dx, dc._dy);
          ctx.stroke();
        }
      }
    }

    // --- 4. Zvaigžņu švīkas ---
    streakTimer += dt;
    if (streakTimer >= streakNext && streaks.length < 2) {
      streakTimer = 0;
      streakNext = 6000 + Math.random() * 7000;
      spawnStreak();
    }
    ctx.globalCompositeOperation = "lighter";
    for (var s = streaks.length - 1; s >= 0; s--) {
      var st = streaks[s];
      st.life += dt / 1000;
      var f = st.life / st.maxLife;
      if (f >= 1) { streaks.splice(s, 1); continue; }
      st.x += st.vx * (dt / 1000);
      st.y += st.vy * (dt / 1000);

      var headX = st.x * W, headY = st.y * H;
      var tailX = headX - st.vx * W * 0.09;
      var tailY = headY - st.vy * H * 0.09;
      var fade = f < 0.15 ? f / 0.15 : (1 - (f - 0.15) / 0.85);
      fade = Math.max(0, Math.min(1, fade));

      var trail = ctx.createLinearGradient(tailX, tailY, headX, headY);
      trail.addColorStop(0, "rgb(255 255 255 / 0)");
      trail.addColorStop(1, "rgb(255 250 240 / " + (0.55 * fade).toFixed(3) + ")");
      ctx.strokeStyle = trail;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = "rgb(255 255 255 / " + (0.85 * fade).toFixed(3) + ")";
      ctx.arc(headX, headY, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = window.requestAnimationFrame(draw);
  }

  function start() {
    if (running) return;
    running = true;
    lastNow = 0;
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
