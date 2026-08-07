/* ==========================================================================
   WebVeido — portfolio datu ievākšana
   --------------------------------------------------------------------------
   Atver katru klienta lapu īstā pārlūkā, nolasa virsrakstu un aprakstu un
   uztaisa ekrānuzņēmumu.

   Vajag tīkla piekļuvi šiem domēniem. Ja vides tīkla politika tos bloķē,
   skripts to pateiks skaidri, nevis klusi izliks tukšus datus.

   Lietošana:
     node tools/fetch-portfolio.mjs

   Rezultāts:
     assets/img/darbi/<slug>.png     ekrānuzņēmumi
     tools/portfolio-data.json       nolasītie virsraksti un apraksti
   ========================================================================== */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const SITES = [
  { slug: "eirostils",   url: "https://eirostils1.lv" },
  { slug: "aiskola",     url: "https://aiskola-latvija-m.lovable.app" },
  { slug: "pelnit",      url: "https://pelnit-lv-marketplace.lovable.app" },
  { slug: "latvia-kicks",url: "https://latvia-kicks-story.lovable.app" },
  { slug: "velo-city",   url: "https://velo-city-stories.lovable.app" },
  { slug: "excel-buddy", url: "https://excel-buddy-liepaja.lovable.app" }
];

const CHROME = process.env.CHROME_PATH
  || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = 9333;
const OUT_IMG = "assets/img/darbi";
const VIEW = { w: 1280, h: 800 };
const SHOT_SCALE = 0.7;                 // mazāks fails, pietiekami ass

mkdirSync(OUT_IMG, { recursive: true });

if (!existsSync(CHROME)) {
  console.error("Nav atrasts pārlūks:", CHROME);
  console.error("Norādi to ar CHROME_PATH=/ceļš/uz/chrome");
  process.exit(1);
}

console.log("Startējam pārlūku…");
const browser = spawn(CHROME, [
  "--headless", "--no-sandbox", "--hide-scrollbars",
  "--use-gl=swiftshader", "--enable-unsafe-swiftshader",
  "--remote-debugging-port=" + PORT,
  "--user-data-dir=/tmp/wv-portfolio-profile",
  "about:blank"
], { stdio: "ignore", detached: true });

process.on("exit", () => { try { process.kill(-browser.pid); } catch {} });

// Gaidām, līdz atveras atkļūdošanas ports
let target = null;
for (let i = 0; i < 30; i++) {
  await sleep(500);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = list.find(t => t.type === "page");
    if (target) break;
  } catch {}
}
if (!target) { console.error("Neizdevās pieslēgties pārlūkam."); process.exit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const events = new Map();

ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  } else if (msg.method && events.has(msg.method)) {
    events.get(msg.method)();
    events.delete(msg.method);
  }
};

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const mid = ++id;
  pending.set(mid, { resolve, reject });
  ws.send(JSON.stringify({ id: mid, method, params }));
});

await new Promise(r => (ws.onopen = r));
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride",
  { width: VIEW.w, height: VIEW.h, deviceScaleFactor: 1, mobile: false });

const results = [];

for (const site of SITES) {
  process.stdout.write(`\n${site.url}\n`);
  let ok = false;

  try {
    // `Page.navigate` atgriež errorText, ja savienojums neizdevās —
    // tas ir vienīgais drošais signāls. Pārlūka kļūdas lapai ir savs
    // teksts, tāpēc pēc satura garuma vien spriest nedrīkst.
    const nav = await send("Page.navigate", { url: site.url });
    if (nav.errorText) {
      console.log("  ! navigācija neizdevās:", nav.errorText);
      results.push({ ...site, ok: false, error: nav.errorText });
      continue;
    }

    await sleep(5000);                  // laiks JS lapām uzzīmēties

    const info = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `JSON.stringify({
        title: document.title || "",
        desc: document.querySelector('meta[name="description"]')?.content || "",
        ogDesc: document.querySelector('meta[property="og:description"]')?.content || "",
        h1: document.querySelector("h1")?.innerText?.trim().slice(0, 200) || "",
        h2: [...document.querySelectorAll("h2")].slice(0,4).map(h=>h.innerText.trim().slice(0,90)),
        lang: document.documentElement.lang || "",
        bodyLen: document.body ? document.body.innerText.length : 0,
        errorPage: !!document.querySelector("#main-frame-error")
      })`
    });

    const data = JSON.parse(info.result.value);

    if (data.errorPage || !data.bodyLen) {
      console.log("  ! atvērās pārlūka kļūdas lapa — domēns, visticamāk, ir bloķēts");
      results.push({ ...site, ...data, ok: false });
      continue;                          // ekrānuzņēmumu netaisām
    } else {
      console.log("  virsraksts:", data.title || "(nav)");
      console.log("  h1:        ", data.h1 || "(nav)");
      if (data.desc || data.ogDesc) console.log("  apraksts:  ", (data.desc || data.ogDesc).slice(0, 120));
      if (data.h2.length) console.log("  sadaļas:   ", data.h2.join(" · "));
      ok = true;
    }

    const shot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: VIEW.w, height: VIEW.h, scale: SHOT_SCALE }
    });

    const file = `${OUT_IMG}/${site.slug}.png`;
    writeFileSync(file, Buffer.from(shot.data, "base64"));
    console.log("  ekrānuzņēmums →", file);

    results.push({ ...site, ...data, screenshot: file, ok });
  } catch (e) {
    console.log("  KĻŪDA:", String(e.message).slice(0, 160));
    results.push({ ...site, ok: false, error: String(e.message).slice(0, 300) });
  }
}

writeFileSync("tools/portfolio-data.json", JSON.stringify(results, null, 2));

const good = results.filter(r => r.ok).length;
console.log(`\n———\nIzdevās nolasīt: ${good} no ${SITES.length}`);
console.log("Dati saglabāti: tools/portfolio-data.json");

if (good < SITES.length) {
  console.log("\nJa visas lapas ir tukšas, visticamāk vides tīkla politika");
  console.log("joprojām bloķē šos domēnus. Pārbaudi:");
  console.log("  curl -sS \"$HTTPS_PROXY/__agentproxy/status\"");
}

ws.close();
process.exit(0);
