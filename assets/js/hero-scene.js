/* ==========================================================================
   WebVeido — hero aina
   --------------------------------------------------------------------------
   Canvas 2D, nevis WebGL — tāpat izskatās kā precīzs instruments, bet nav
   atkarīga no GPU draiveriem un nesabojā headless renderēšanu. Nevis mīksti
   kūstoši gradienta mākoņi (tas jau ir katras "AI veidnes" noklusējums), bet
   precīzs, shematisks režģis:

     1. Bāzes režģis — smalkas, klusas līnijas visā hero platumā/augstumā
     2. Mezgli — daži režģa krustpunkti "iedegas" un pēc laika pārlec uz
        jaunu krustpunktu (kvantēts lēciens, nevis brīva peldēšana)
     3. Trases — taisnleņķa līnija, kas savieno divus spilgtus mezglus,
        tiek "uzzīmēta" no viena gala uz otru kā elektroshēmas trase

   Mezglu izvēli nedaudz nosver kursora pozīcija (tuvākie krustpunkti
   biežāk iedegas). Viss apstājas, kad hero nav ekrānā vai cilne nav
   aktīva, un vispār netiek zīmēts, ja lietotājs izvēlējies samazinātu
   kustību — tad hero paliek pilnībā statisks.
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

  // Tā pati izlīdzinātā peles pozīcija, kas baro režģi, groza arī
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

  var ACCENT = "200 30 63";     // sakrīt ar --brand-600, hard-coded, jo canvas nelasa CSS mainīgos
  var GRID = 72;                // režģa soļa izmērs (loģiskie px)
  var cols = 1, rows = 1;

  function computeGrid() {
    cols = Math.max(5, Math.round(W / GRID));
    rows = Math.max(4, Math.round(H / GRID));
  }

  function cellX(c) { return (c / cols) * W; }
  function cellY(r) { return (r / rows) * H; }

  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  // Iedegtā mezgla "dzīves cikls": iedegas → tur → izdziest → lec uz jaunu
  // krustpunktu. Kvantēts lēciens (nevis tvīnots peldējums) — tas ir tas,
  // kas ataino "precīzs", nevis "kūstošs".
  function envelope(p) {
    if (p < 0.15) return smooth(p / 0.15);
    if (p > 0.7) return smooth(1 - (p - 0.7) / 0.3);
    return 1;
  }

  var nodes = [];

  function pickCell() {
    // Nosveras uz kursora tuvumu — tuvākie krustpunkti biežāk iedegas.
    var biasCol = mx * cols;
    var biasRow = my * rows;
    var spread = Math.max(cols, rows) * 0.55;
    var col = Math.round(biasCol + (Math.random() - 0.5) * spread * 2);
    var row = Math.round(biasRow + (Math.random() - 0.5) * spread * 2);
    col = Math.max(0, Math.min(cols, col));
    row = Math.max(0, Math.min(rows, row));
    return { col: col, row: row };
  }

  function seedNodes() {
    var count = narrow ? 6 : 11;
    nodes = [];
    for (var i = 0; i < count; i++) {
      var cell = pickCell();
      nodes.push({
        col: cell.col,
        row: cell.row,
        life: Math.random() * 4,
        maxLife: 3.2 + Math.random() * 3.4
      });
    }
  }

  // Trases — taisnleņķa līnija starp diviem pašlaik spilgtiem mezgliem,
  // "uzzīmēta" posmu pa posmam, kā elektroshēmas savienojums.
  var trace = null;
  var traceCooldown = 0;

  function brightNodes() {
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var p = n.life / n.maxLife;
      if (envelope(p) > 0.85) out.push(n);
    }
    return out;
  }

  function maybeSpawnTrace(dt) {
    if (trace) return;
    traceCooldown -= dt;
    if (traceCooldown > 0) return;
    var pool = brightNodes();
    if (pool.length < 2) { traceCooldown = 200; return; }
    var a = pool[Math.floor(Math.random() * pool.length)];
    var b = a;
    var tries = 0;
    while (b === a && tries < 6) { b = pool[Math.floor(Math.random() * pool.length)]; tries++; }
    if (b === a) { traceCooldown = 200; return; }
    trace = { a: a, b: b, t: 0, phase: "draw" };
    traceCooldown = 1400 + Math.random() * 1600;
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
    computeGrid();
    seedNodes();
    trace = null;
  }

  var lastNow = 0;

  function draw(now) {
    raf = 0;
    if (!running) return;

    var dt = lastNow ? Math.min(now - lastNow, 100) : 16.7;
    lastNow = now;

    // Aizturēta sekošana pelei — eksponenciāla tuvošanās mērķim.
    mx += (targetX - mx) * 0.045;
    my += (targetY - my) * 0.045;

    if (scene) {
      scene.style.setProperty("--scene-ry", ((mx - 0.5) * 20).toFixed(2));
      scene.style.setProperty("--scene-rx", ((0.5 - my) * 13).toFixed(2));
    }

    ctx.clearRect(0, 0, W, H);

    // --- 1. Bāzes režģis — klusas, taisnas līnijas ---
    ctx.strokeStyle = "rgb(" + ACCENT + " / 0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var c = 0; c <= cols; c++) {
      var gx = cellX(c);
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
    }
    for (var r = 0; r <= rows; r++) {
      var gy = cellY(r);
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
    }
    ctx.stroke();

    // --- 2. Mezgli ---
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.life += dt / 1000;
      var p = n.life / n.maxLife;
      if (p >= 1) {
        var cell = pickCell();
        n.col = cell.col;
        n.row = cell.row;
        n.life = 0;
        n.maxLife = 3.2 + Math.random() * 3.4;
        p = 0;
      }
      var alpha = envelope(p);
      if (alpha <= 0.01) continue;
      var nx = cellX(n.col), ny = cellY(n.row);
      var size = 3 + alpha * 3;
      ctx.fillStyle = "rgb(" + ACCENT + " / " + (alpha * 0.85).toFixed(3) + ")";
      ctx.fillRect(nx - size / 2, ny - size / 2, size, size);
    }

    // --- 3. Trase ---
    maybeSpawnTrace(dt);
    if (trace) {
      var ax = cellX(trace.a.col), ay = cellY(trace.a.row);
      var bx = cellX(trace.b.col), by = cellY(trace.b.row);
      var corner = { x: bx, y: ay };
      var seg1 = Math.hypot(corner.x - ax, corner.y - ay);
      var seg2 = Math.hypot(bx - corner.x, by - corner.y);
      var total = Math.max(1, seg1 + seg2);

      if (trace.phase === "draw") {
        trace.t += dt / 900;
        if (trace.t >= 1) { trace.t = 1; trace.phase = "hold"; trace.holdT = 0; }
      } else if (trace.phase === "hold") {
        trace.holdT = (trace.holdT || 0) + dt;
        if (trace.holdT > 500) trace.phase = "fade";
      } else if (trace.phase === "fade") {
        trace.t -= dt / 500;
        if (trace.t <= 0) trace = null;
      }

      if (trace) {
        var drawLen = Math.max(0, Math.min(1, trace.t)) * total;
        var fadeAlpha = trace.phase === "fade" ? Math.max(0, trace.t) : 1;
        ctx.strokeStyle = "rgb(" + ACCENT + " / " + (0.4 * fadeAlpha).toFixed(3) + ")";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        if (drawLen <= seg1) {
          var f1 = seg1 > 0 ? drawLen / seg1 : 1;
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax + (corner.x - ax) * f1, ay + (corner.y - ay) * f1);
        } else {
          ctx.moveTo(ax, ay);
          ctx.lineTo(corner.x, corner.y);
          var f2 = seg2 > 0 ? (drawLen - seg1) / seg2 : 1;
          ctx.lineTo(corner.x + (bx - corner.x) * f2, corner.y + (by - corner.y) * f2);
        }
        ctx.stroke();
      }
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
