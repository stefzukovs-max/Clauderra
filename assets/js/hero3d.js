/* ==========================================================================
   WebVeido — hero 3D aina
   --------------------------------------------------------------------------
   Īsts 3D: perspektīvas kamera, skata matrica un animēts karkasa reljefs,
   kas zīmēts ar WebGL. Bez bibliotēkām — matricu matemātika ir zemāk.

   Divi zīmēšanas piegājieni vienā audeklā:
     1) aurora — pilnekrāna fragmentu ēnotājs (fons),
     2) reljefs — līnijas un spīdoši punkti ar saskaitošo sajaukšanu.

   Ja WebGL nav pieejams, uz telefoniem vai pie samazinātas kustības
   aina netiek zīmēta vispār — paliek CSS gradients.
   ========================================================================== */

(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(max-width: 48rem)").matches) return;

  var canvas = document.getElementById("hero-canvas");
  var hero = document.querySelector(".hero");
  if (!canvas || !hero) return;

  var gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: true,
    depth: false,
    stencil: false,
    powerPreference: "low-power"
  });
  if (!gl) return;

  /* ------------------------------------------------------------------
     Matricu palīgi (kolonnu secībā, kā to gaida WebGL)
     ------------------------------------------------------------------ */

  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2);
    var nf = 1 / (near - far);
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ];
  }

  function normalize(v) {
    var l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  function lookAt(eye, center, up) {
    var z = normalize([eye[0] - center[0], eye[1] - center[1], eye[2] - center[2]]);
    var x = normalize(cross(up, z));
    var y = cross(z, x);
    return [
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -dot(x, eye), -dot(y, eye), -dot(z, eye), 1
    ];
  }

  function multiply(a, b) {
    var out = new Array(16);
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        out[c * 4 + r] =
          a[r] * b[c * 4] +
          a[4 + r] * b[c * 4 + 1] +
          a[8 + r] * b[c * 4 + 2] +
          a[12 + r] * b[c * 4 + 3];
      }
    }
    return out;
  }

  /* ------------------------------------------------------------------
     Ēnotāju sagatavošana
     ------------------------------------------------------------------ */

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

  function program(vsrc, fsrc) {
    var vs = compile(gl.VERTEX_SHADER, vsrc);
    var fs = compile(gl.FRAGMENT_SHADER, fsrc);
    if (!vs || !fs) return null;
    var pr = gl.createProgram();
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    return pr;
  }

  /* --- 1. Aurora (fons) --- */

  var auroraProg = program(
    "attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0.0,1.0);}",
    [
      "precision mediump float;",
      "uniform vec2 u_res; uniform float u_time; uniform vec2 u_pointer; uniform float u_light;",
      "float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
      "float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);",
      " return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}",
      "float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=0.5;}return v;}",
      "void main(){",
      " vec2 uv=(gl_FragCoord.xy-0.5*u_res)/u_res.y;",
      " vec2 p=uv*1.55+u_pointer*0.16; float t=u_time*0.055;",
      " vec2 q=vec2(fbm(p+t),fbm(p+vec2(3.4,1.2)-t));",
      " vec2 r=vec2(fbm(p+3.0*q+vec2(1.7,9.2)+t*0.9),fbm(p+3.0*q+vec2(8.3,2.8)-t*0.7));",
      " float f=fbm(p+3.0*r);",
      " vec3 d0=vec3(0.039,0.035,0.043),d1=vec3(0.42,0.07,0.16),d2=vec3(0.78,0.12,0.25),d3=vec3(0.97,0.42,0.51);",
      " vec3 l0=vec3(0.984,0.980,0.984),l1=vec3(0.99,0.90,0.92),l2=vec3(0.96,0.74,0.79),l3=vec3(0.86,0.38,0.49);",
      " vec3 c0=mix(d0,l0,u_light),c1=mix(d1,l1,u_light),c2=mix(d2,l2,u_light),c3=mix(d3,l3,u_light);",
      " float m1=smoothstep(0.20,0.80,f);",
      " float m2=smoothstep(0.48,0.98,length(r)*0.75);",
      " float m3=smoothstep(0.66,1.00,r.y+0.12*f);",
      " vec3 col=mix(c0,c1,m1*0.80); col=mix(col,c2,m2*0.38); col=mix(col,c3,m3*0.18);",
      " float vig=smoothstep(1.10,0.22,length(uv*vec2(0.85,1.25)));",
      " col=mix(c0,col,vig);",
      " col=mix(c0,col,smoothstep(-0.45,0.60,uv.y));",
      " gl_FragColor=vec4(col,1.0);",
      "}"
    ].join("\n")
  );

  /* --- 2. Reljefs (karkass + punkti) --- */

  var TERRAIN_VS = [
    "attribute vec2 a_grid;",
    "uniform mat4 u_mvp; uniform float u_time; uniform vec2 u_mouse; uniform float u_point;",
    "varying float v_h; varying float v_fog;",

    // Lēts, bet plūstošs vilnis — četri sinusi ar dažādiem virzieniem
    "float wave(vec2 p, float t){",
    " float h = 0.0;",
    " h += sin(p.x*0.55 + t*0.70) * 0.34;",
    " h += sin(p.y*0.48 - t*0.55) * 0.30;",
    " h += sin((p.x+p.y)*0.33 + t*0.90) * 0.22;",
    " h += sin(length(p*vec2(1.0,0.7))*0.75 - t*1.15) * 0.20;",
    " return h;",
    "}",

    "void main(){",
    " vec2 p = a_grid;",
    " float h = wave(p, u_time);",
    // Kursors izspiež vieglu pauguru
    " vec2 m = vec2(u_mouse.x*11.0, -11.0 + u_mouse.y*5.0);",
    " float d = length(p - m);",
    " h += 1.15 * exp(-d*d*0.022);",
    " gl_Position = u_mvp * vec4(p.x, h, p.y, 1.0);",
    " v_h = h;",
    " v_fog = clamp((-p.y - 3.0) / 24.0, 0.0, 1.0);",
    " gl_PointSize = u_point * (1.0 - v_fog*0.55);",
    "}"
  ].join("\n");

  var TERRAIN_FS = [
    "precision mediump float;",
    "varying float v_h; varying float v_fog;",
    "uniform float u_isPoint; uniform float u_light;",
    "void main(){",
    " float glow = smoothstep(-0.35, 1.25, v_h);",
    " vec3 lo = mix(vec3(0.34,0.04,0.10), vec3(0.80,0.45,0.52), u_light);",
    " vec3 hi = mix(vec3(0.98,0.45,0.55), vec3(0.62,0.09,0.20), u_light);",
    " vec3 col = mix(lo, hi, glow);",
    " float a = (1.0 - v_fog) * mix(0.26, 0.85, glow);",
    " if (u_isPoint > 0.5) {",
    "   vec2 c = gl_PointCoord - 0.5;",
    "   float r = length(c);",
    "   if (r > 0.5) discard;",
    "   a *= smoothstep(0.5, 0.0, r) * 1.7;",
    " }",
    " gl_FragColor = vec4(col * a, a);",
    "}"
  ].join("\n");

  var terrainProg = program(TERRAIN_VS, TERRAIN_FS);
  if (!auroraProg || !terrainProg) return;

  /* ------------------------------------------------------------------
     Ģeometrija
     ------------------------------------------------------------------ */

  // Pilnekrāna trijstūris aurorai
  var quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  // Reljefa režģis
  var COLS = 96, ROWS = 56;
  var X0 = -17, X1 = 17, Z0 = -1.5, Z1 = -28;

  var verts = new Float32Array(COLS * ROWS * 2);
  var vi = 0;
  for (var r0 = 0; r0 < ROWS; r0++) {
    for (var c0 = 0; c0 < COLS; c0++) {
      verts[vi++] = X0 + (X1 - X0) * (c0 / (COLS - 1));
      verts[vi++] = Z0 + (Z1 - Z0) * (r0 / (ROWS - 1));
    }
  }

  var lines = [];
  for (var r1 = 0; r1 < ROWS; r1++) {
    for (var c1 = 0; c1 < COLS - 1; c1++) {
      lines.push(r1 * COLS + c1, r1 * COLS + c1 + 1);
    }
  }
  for (var c2 = 0; c2 < COLS; c2++) {
    for (var r2 = 0; r2 < ROWS - 1; r2++) {
      lines.push(r2 * COLS + c2, (r2 + 1) * COLS + c2);
    }
  }

  var gridBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  var lineBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lines), gl.STATIC_DRAW);
  var lineCount = lines.length;

  /* ------------------------------------------------------------------
     Uniformu vietas
     ------------------------------------------------------------------ */

  var aU = {
    pos: gl.getAttribLocation(auroraProg, "a_pos"),
    res: gl.getUniformLocation(auroraProg, "u_res"),
    time: gl.getUniformLocation(auroraProg, "u_time"),
    pointer: gl.getUniformLocation(auroraProg, "u_pointer"),
    light: gl.getUniformLocation(auroraProg, "u_light")
  };

  var tU = {
    grid: gl.getAttribLocation(terrainProg, "a_grid"),
    mvp: gl.getUniformLocation(terrainProg, "u_mvp"),
    time: gl.getUniformLocation(terrainProg, "u_time"),
    mouse: gl.getUniformLocation(terrainProg, "u_mouse"),
    point: gl.getUniformLocation(terrainProg, "u_point"),
    isPoint: gl.getUniformLocation(terrainProg, "u_isPoint"),
    light: gl.getUniformLocation(terrainProg, "u_light")
  };

  /* ------------------------------------------------------------------
     Stāvoklis
     ------------------------------------------------------------------ */

  var SCALE = 0.8;
  var pointer = { x: 0, y: 0 };
  var target = { x: 0, y: 0 };
  var visible = true;
  var start = performance.now();
  var last = 0;
  var FRAME = 1000 / 30;

  function resize() {
    var w = Math.max(1, Math.round(hero.clientWidth * SCALE));
    var h = Math.max(1, Math.round(hero.clientHeight * SCALE));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }

  window.addEventListener("pointermove", function (e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (0.5 - e.clientY / window.innerHeight) * 2;
  }, { passive: true });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0 }).observe(hero);
  }

  function isLight() {
    return document.documentElement.getAttribute("data-theme") === "light" ? 1 : 0;
  }

  function frame(now) {
    window.requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    if (now - last < FRAME) return;
    last = now;

    resize();

    pointer.x += (target.x - pointer.x) * 0.045;
    pointer.y += (target.y - pointer.y) * 0.045;

    var t = (now - start) / 1000;
    var light = isLight();

    gl.disable(gl.BLEND);

    // --- Aurora ---
    gl.useProgram(auroraProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.enableVertexAttribArray(aU.pos);
    gl.vertexAttribPointer(aU.pos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(aU.res, canvas.width, canvas.height);
    gl.uniform1f(aU.time, t);
    gl.uniform2f(aU.pointer, pointer.x, pointer.y);
    gl.uniform1f(aU.light, light);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // --- Reljefs ---
    var aspect = canvas.width / canvas.height;
    var proj = perspective(50 * Math.PI / 180, aspect, 0.1, 100);

    // Kamera skatās lejup, lai horizonts būtu kadra apakšdaļā un
    // virsraksta zona paliktu brīva. Viegli šūpojas un seko kursoram.
    var eye = [
      pointer.x * 1.6,
      5.0 + pointer.y * 0.5 + Math.sin(t * 0.25) * 0.16,
      5.4
    ];
    var view = lookAt(eye, [0, -2.4, -13], [0, 1, 0]);
    var mvp = multiply(proj, view);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);          // saskaitoša sajaukšana = mirdzums

    gl.useProgram(terrainProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf);
    gl.enableVertexAttribArray(tU.grid);
    gl.vertexAttribPointer(tU.grid, 2, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(tU.mvp, false, new Float32Array(mvp));
    gl.uniform1f(tU.time, t);
    gl.uniform2f(tU.mouse, pointer.x, pointer.y);
    gl.uniform1f(tU.light, light);

    // Karkass
    gl.uniform1f(tU.isPoint, 0);
    gl.uniform1f(tU.point, 1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineBuf);
    gl.drawElements(gl.LINES, lineCount, gl.UNSIGNED_SHORT, 0);

    // Spīdošie mezglu punkti
    gl.uniform1f(tU.isPoint, 1);
    gl.uniform1f(tU.point, 3.4 * SCALE * 2.0);
    gl.drawArrays(gl.POINTS, 0, COLS * ROWS);
  }

  resize();
  hero.classList.add("has-aurora");
  canvas.classList.add("is-ready");
  window.requestAnimationFrame(frame);

  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    canvas.classList.remove("is-ready");
    hero.classList.remove("has-aurora");
  });
})();
