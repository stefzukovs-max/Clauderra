/* ==========================================================================
   WebVeido — kustības un 3D slānis
   --------------------------------------------------------------------------
   Bez bibliotēkām. Viss ir papildinājums virs strādājošas lapas:
   ja šis fails neielādējas, mājaslapa darbojas tieši tāpat.

   1.  Atvēruma efekts
   2.  Hero aurora (tīrs WebGL)
   3.  3D noliece
   4.  Magnētiskās pogas
   5.  Koda loga peldēšana
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
     1. Atvēruma efekts
     ------------------------------------------------------------------ */
  (function initIntro() {
    var intro = document.getElementById("intro");
    var playing = root.classList.contains("is-intro");

    // Hero ienākšana notiek arī bez intro (atkārtota apmeklējuma gadījumā)
    function enterHero() {
      var items = document.querySelectorAll(".hero__grid > div > *");
      items.forEach(function (el, i) {
        el.style.setProperty("--enter-delay", (i * 90) + "ms");
      });
      root.classList.add("is-hero-enter");
    }

    if (!intro || !playing) {
      if (!reduced) enterHero();
      return;
    }

    var finished = false;

    function finish(immediate) {
      if (finished) return;
      finished = true;
      window.__wvIntroDone = true;

      try { sessionStorage.setItem("wv-intro", "1"); } catch (e) {}

      root.classList.add("is-intro-out");
      enterHero();

      var wait = immediate ? 0 : 900;
      window.setTimeout(function () {
        // Fokusu pārceļam tikai tad, ja tas tiešām bija intro iekšpusē
        // (piem., uz pogas «Izlaist»). Citādi fokusēšana liktu parādīties
        // saitei «Pāriet uz galveno saturu», kas paredzēta tikai tabulēšanai.
        var focusWasInside = intro.contains(document.activeElement);

        root.classList.remove("is-intro", "is-intro-out");
        if (intro.parentNode) intro.parentNode.removeChild(intro);

        if (focusWasInside) {
          var logo = document.querySelector(".header .logo");
          if (logo) logo.focus({ preventScroll: true });
        }
      }, wait);
    }

    // Aizkars aizveras, kad zīmola animācija ir nospēlējusi
    var timer = window.setTimeout(function () { finish(false); }, 2150);

    function skip() {
      window.clearTimeout(timer);
      finish(true);
    }

    var skipBtn = document.getElementById("intro-skip");
    if (skipBtn) skipBtn.addEventListener("click", skip);

    intro.addEventListener("click", skip);

    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        document.removeEventListener("keydown", onKey);
        skip();
      }
    });

    // Ja lietotājs sāk ritināt, efektu neuzspiežam
    window.addEventListener("wheel", skip, { once: true, passive: true });
    window.addEventListener("touchstart", skip, { once: true, passive: true });
  })();

  /* ------------------------------------------------------------------
     2. Hero aurora — tīrs WebGL, bez bibliotēkām
     ------------------------------------------------------------------ */
  (function initAurora() {
    if (reduced) return;

    // Uz telefoniem nepārtraukts WebGL zīmējums maksā akumulatoru vairāk,
    // nekā efekts dod. Tur paliek CSS gradients.
    if (window.matchMedia("(max-width: 48rem)").matches) return;

    var canvas = document.getElementById("hero-canvas");
    var hero = document.querySelector(".hero");
    if (!canvas || !hero) return;

    var gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power"
    });
    if (!gl) return;                       // bez WebGL paliek CSS gradients

    var VERT = [
      "attribute vec2 a_pos;",
      "void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }"
    ].join("\n");

    var FRAG = [
      "precision mediump float;",
      "uniform vec2  u_res;",
      "uniform float u_time;",
      "uniform vec2  u_pointer;",
      "uniform float u_light;",

      "float hash(vec2 p) {",
      "  p = fract(p * vec2(123.34, 456.21));",
      "  p += dot(p, p + 45.32);",
      "  return fract(p.x * p.y);",
      "}",

      "float noise(vec2 p) {",
      "  vec2 i = floor(p), f = fract(p);",
      "  vec2 u = f * f * (3.0 - 2.0 * f);",
      "  float a = hash(i);",
      "  float b = hash(i + vec2(1.0, 0.0));",
      "  float c = hash(i + vec2(0.0, 1.0));",
      "  float d = hash(i + vec2(1.0, 1.0));",
      "  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);",
      "}",

      "float fbm(vec2 p) {",
      "  float v = 0.0, a = 0.5;",
      "  for (int i = 0; i < 5; i++) {",
      "    v += a * noise(p);",
      "    p = p * 2.03 + vec2(1.7, 9.2);",
      "    a *= 0.5;",
      "  }",
      "  return v;",
      "}",

      "void main() {",
      "  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;",
      "  vec2 p = uv * 1.55 + u_pointer * 0.16;",
      "  float t = u_time * 0.055;",

      // Domēna izliekšana — no tās rodas plūstošās gaismas lentes
      "  vec2 q = vec2(fbm(p + t), fbm(p + vec2(3.4, 1.2) - t));",
      "  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 0.9),",
      "                fbm(p + 3.0 * q + vec2(8.3, 2.8) - t * 0.7));",
      "  float f = fbm(p + 3.0 * r);",

      // Tumšā un gaišā tēmas palete
      "  vec3 d0 = vec3(0.039, 0.035, 0.043);",
      "  vec3 d1 = vec3(0.42, 0.07, 0.16);",
      "  vec3 d2 = vec3(0.78, 0.12, 0.25);",
      "  vec3 d3 = vec3(0.97, 0.42, 0.51);",

      "  vec3 l0 = vec3(0.984, 0.980, 0.984);",
      "  vec3 l1 = vec3(0.99, 0.90, 0.92);",
      "  vec3 l2 = vec3(0.96, 0.74, 0.79);",
      "  vec3 l3 = vec3(0.86, 0.38, 0.49);",

      "  vec3 c0 = mix(d0, l0, u_light);",
      "  vec3 c1 = mix(d1, l1, u_light);",
      "  vec3 c2 = mix(d2, l2, u_light);",
      "  vec3 c3 = mix(d3, l3, u_light);",

      // Šauras joslas, nevis plaša krāsas pārklāšana — fonam jāpaliek fonam,
      // citādi cieš teksta kontrasts.
      "  float m1 = smoothstep(0.20, 0.80, f);",
      "  float m2 = smoothstep(0.48, 0.98, length(r) * 0.75);",
      "  float m3 = smoothstep(0.66, 1.00, r.y + 0.12 * f);",

      "  vec3 col = mix(c0, c1, m1 * 0.80);",
      "  col = mix(col, c2, m2 * 0.38);",
      "  col = mix(col, c3, m3 * 0.18);",

      // Vinjete + pāreja uz fonu, lai aurora paliek tikai augšdaļā
      "  float vig = smoothstep(1.10, 0.22, length(uv * vec2(0.85, 1.25)));",
      "  col = mix(c0, col, vig);",
      "  col = mix(c0, col, smoothstep(-0.45, 0.60, uv.y));",

      "  gl_FragColor = vec4(col, 1.0);",
      "}"
    ].join("\n");

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    }

    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // Viens liels trijstūris pārklāj visu ekrānu — lētāk nekā divi
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, "u_res");
    var uTime = gl.getUniformLocation(prog, "u_time");
    var uPointer = gl.getUniformLocation(prog, "u_pointer");
    var uLight = gl.getUniformLocation(prog, "u_light");

    // Zema izšķirtspēja pietiek — attēls ir mīksts gradients
    var SCALE = 0.55;

    function resize() {
      var w = Math.max(1, Math.round(hero.clientWidth * SCALE));
      var h = Math.max(1, Math.round(hero.clientHeight * SCALE));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    var pointer = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };

    if (finePointer) {
      window.addEventListener("pointermove", function (e) {
        target.x = (e.clientX / window.innerWidth - 0.5) * 2;
        target.y = (0.5 - e.clientY / window.innerHeight) * 2;
      }, { passive: true });
    }

    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(hero);
    }

    var start = performance.now();
    var last = 0;
    var FRAME = 1000 / 30;               // 30 fps pilnīgi pietiek gradientam

    function isLight() {
      return root.getAttribute("data-theme") === "light" ? 1 : 0;
    }

    function frame(now) {
      window.requestAnimationFrame(frame);

      if (!visible || document.hidden) return;
      if (now - last < FRAME) return;
      last = now;

      resize();

      // Kursora ietekme tiek izlīdzināta, lai kustība būtu plūstoša
      pointer.x += (target.x - pointer.x) * 0.045;
      pointer.y += (target.y - pointer.y) * 0.045;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.uniform1f(uLight, isLight());
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    resize();
    hero.classList.add("has-aurora");
    canvas.classList.add("is-ready");
    window.requestAnimationFrame(frame);

    // Konteksta zudumu (piem., pēc ilgas neaktivitātes) apstrādājam klusi
    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      canvas.classList.remove("is-ready");
      hero.classList.remove("has-aurora");
    });
  })();

  /* ------------------------------------------------------------------
     3. 3D noliece
     ------------------------------------------------------------------ */
  (function initTilt() {
    if (reduced || !finePointer) return;

    var selector = ".card, .plan, .problem-card, .guarantee__item, .step, .hero__form";
    var elements = document.querySelectorAll(selector);

    elements.forEach(function (el) {
      el.classList.add("tilt");

      // Formā noliece ir daudz maigāka — tur lietotājs raksta
      var isForm = el.classList.contains("hero__form");
      var maxTilt = isForm ? 4 : 9;

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
     4. Magnētiskās pogas
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
     5. Koda loga peldēšana pēc kursora
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
