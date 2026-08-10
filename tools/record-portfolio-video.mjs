/* ==========================================================================
   WebVeido — darbu video priekšskatu ierakstīšana
   --------------------------------------------------------------------------
   Atver katru klienta lapu īstā pārlūkā, lēnām izritina to (sinusa forma:
   0 → apakša → atpakaļ uz 0, lai cilpa nelēkā) un no katra soļa uzņem
   PNG kadru. `ffmpeg` tos sakausē īsā, klusā, cilpā skrejošā MP4.

   Vajag `ffmpeg` sistēmā (nav JS bibliotēka — tāpat kā pārlūks, tas ir
   ārējs bināriskais rīks, nevis atkarība koda tekstā) un tīkla piekļuvi
   klientu domēniem.

   Lietošana:
     node tools/record-portfolio-video.mjs

   Rezultāts:
     assets/video/<slug>-preview.mp4   ~5 s, 960×600, H.264, bez skaņas
   ========================================================================== */

import { writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const SITES = [
  { slug: "eirostils",    url: "https://eirostils1.lv" },
  { slug: "aiskola",      url: "https://aiskola-latvija-m.lovable.app" },
  { slug: "pelnit",       url: "https://pelnit-lv-marketplace.lovable.app" },
  { slug: "latvia-kicks", url: "https://latvia-kicks-story.lovable.app" },
  { slug: "velo-city",    url: "https://velo-city-stories.lovable.app" },
  { slug: "excel-buddy",  url: "https://excel-buddy-liepaja.lovable.app" }
];

const CHROME = process.env.CHROME_PATH
  || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy || "";
const PORT = 9433;
const OUT_DIR = "assets/video";
const TMP_DIR = "/tmp/wv-video-frames";

const W = 960, H = 600;
const FRAMES = 263;
const FPS = 30;                 // 263 / 30 ≈ 8.77 s vienvirziena glide — 30fps, lai kustība
                                 // nejūkā pret 60Hz ekrāniem (16fps deva nevienmērīgu 3.75x
                                 // pulldown, vissliktāk redzamu tieši ātrākajā vidus posmā)

mkdirSync(OUT_DIR, { recursive: true });

if (!existsSync(CHROME)) {
  console.error("Nav atrasts pārlūks:", CHROME);
  console.error("Norādi to ar CHROME_PATH=/ceļš/uz/chrome");
  process.exit(1);
}
if (spawnSync("ffmpeg", ["-version"]).status !== 0) {
  console.error("Nav atrasts ffmpeg. Instalē to (piem., apt-get install ffmpeg) un mēģini vēlreiz.");
  process.exit(1);
}

async function recordOne(site) {
  const frameDir = `${TMP_DIR}/${site.slug}`;
  rmSync(frameDir, { recursive: true, force: true });
  mkdirSync(frameDir, { recursive: true });

  const args = [
    "--headless=new", "--no-sandbox", "--hide-scrollbars",
    "--use-gl=swiftshader", "--enable-unsafe-swiftshader",
    "--remote-debugging-port=" + PORT,
    "--user-data-dir=/tmp/wv-video-profile-" + PORT,
    "about:blank"
  ];
  if (PROXY) args.unshift("--proxy-server=" + PROXY, "--ssl-version-max=tls1.2");

  const browser = spawn(CHROME, args, { stdio: "ignore", detached: true });
  const killBrowser = () => { try { process.kill(-browser.pid); } catch {} };

  try {
    let target = null;
    for (let i = 0; i < 30; i++) {
      await sleep(400);
      try {
        const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
        target = list.find((x) => x.type === "page");
        if (target) break;
      } catch {}
    }
    if (!target) throw new Error("Pārlūks neatvērās");

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let id = 0;
    const pending = new Map();
    ws.onmessage = (m) => {
      const x = JSON.parse(m.data);
      if (x.id && pending.has(x.id)) {
        const { resolve, reject } = pending.get(x.id);
        pending.delete(x.id);
        x.error ? reject(new Error(JSON.stringify(x.error))) : resolve(x.result);
      }
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
    const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;

    await new Promise((r) => { ws.onopen = r; });
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: site.url });
    await sleep(3200);
    await ev(`document.documentElement.style.scrollBehavior="auto"`);
    await ev(`(() => {
      document.querySelectorAll('[class*="cookie" i]').forEach(e => e.remove());
      document.querySelectorAll('[id*="cookie" i]').forEach(e => e.remove());
    })()`);

    const maxScroll = await ev(`Math.max(0, document.body.scrollHeight - innerHeight)`);

    for (let i = 0; i < FRAMES; i++) {
      const p = i / (FRAMES - 1);
      // Vienvirziena "smoothstep" glide, nevis turp-atpakaļ lēciens —
      // ātrums ir nulle abos galos, tāpēc cilpas atsākšanās (pēdējais
      // kadrs → pirmais) izskatās pēc dabiskas apstāšanās, nevis lēciena.
      const eased = p * p * (3 - 2 * p);
      const y = Math.round(eased * maxScroll * 0.62);
      await ev(`window.scrollTo(0, ${y})`);
      const shot = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(`${frameDir}/f${String(i).padStart(4, "0")}.png`, Buffer.from(shot.data, "base64"));
    }

    ws.close();
  } finally {
    killBrowser();
  }

  const out = `${OUT_DIR}/${site.slug}-preview.mp4`;
  const ff = spawnSync("ffmpeg", [
    "-y", "-framerate", String(FPS), "-i", `${frameDir}/f%04d.png`,
    "-vf", `scale=${W}:-2,format=yuv420p`,
    "-c:v", "libx264", "-profile:v", "main", "-level", "3.1",
    "-crf", "26", "-preset", "slow", "-movflags", "+faststart", "-an",
    out
  ], { stdio: "inherit" });

  rmSync(frameDir, { recursive: true, force: true });

  if (ff.status !== 0) throw new Error("ffmpeg neizdevās priekš " + site.slug);
  console.log("✓", out);
}

for (const site of SITES) {
  console.log("Ierakstām:", site.slug, "—", site.url);
  try {
    await recordOne(site);
  } catch (err) {
    console.error("✗", site.slug, err.message);
  }
}
