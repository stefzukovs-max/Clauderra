/* ==========================================================================
   WebVeido — portfolio datu ievākšana
   --------------------------------------------------------------------------
   Atver katru klienta lapu īstā pārlūkā, nolasa virsrakstu ar aprakstu un
   uztaisa divus ekrānuzņēmumus: garo (visa lapa) un mobilo.

   Vajag tīkla piekļuvi šiem domēniem. Vidē, kur izejošais HTTPS iet caur
   starpniekserveri, pārlūkam tas jāpasaka atsevišķi — HTTPS_PROXY vien
   nepietiek, tāpēc zemāk ir --proxy-server.

   Lietošana:
     node tools/fetch-portfolio.mjs

   Rezultāts:
     assets/img/darbi/<slug>.jpg          garais ekrānuzņēmums (1280 px plats)
     assets/img/darbi/<slug>-mobile.jpg   mobilais skats (390 px plats)
     tools/portfolio-data.json            nolasītie virsraksti un apraksti
   ========================================================================== */

import { writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { spawn } from "node:child_process";
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
const PORT = 9333;
const OUT_IMG = "assets/img/darbi";

const DESK = { w: 1280, h: 800, maxH: 3400 };   // garajam ekrānuzņēmumam
const MOB  = { w: 390,  h: 844, maxH: 844 };   // tieši viens telefona ekrāns
const QUALITY = 76;                              // JPEG — mazāks fails, ass teksts

mkdirSync(OUT_IMG, { recursive: true });

if (!existsSync(CHROME)) {
  console.error("Nav atrasts pārlūks:", CHROME);
  console.error("Norādi to ar CHROME_PATH=/ceļš/uz/chrome");
  process.exit(1);
}

console.log("Startējam pārlūku…" + (PROXY ? ` (caur ${PROXY})` : ""));
const args = [
  "--headless=new", "--no-sandbox", "--hide-scrollbars",
  "--use-gl=swiftshader", "--enable-unsafe-swiftshader",
  "--force-color-profile=srgb", "--font-render-hinting=none",
  "--remote-debugging-port=" + PORT,
  "--user-data-dir=/tmp/wv-portfolio-profile",
  "about:blank"
];
// Pārlūks nelasa HTTPS_PROXY no vides. CA sertifikāts jau ir NSS krātuvē,
// tāpēc verifikāciju izslēgt nevajag — bet starpniekserveris, kas pārtver
// TLS, aizver savienojumu, ieraugot Chrome TLS 1.3 sasveicināšanos. Ar
// versijas griestiem TLS 1.2 savienojums iet cauri; šifrēšana paliek.
if (PROXY) args.unshift("--proxy-server=" + PROXY, "--ssl-version-max=tls1.2");

const browser = spawn(CHROME, args, { stdio: "ignore", detached: true });
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

ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
};

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const mid = ++id;
  pending.set(mid, { resolve, reject });
  ws.send(JSON.stringify({ id: mid, method, params }));
});

const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return r.result?.value;
};

await new Promise(r => (ws.onopen = r));
await send("Page.enable");
await send("Runtime.enable");

const setView = (v) => send("Emulation.setDeviceMetricsOverride", {
  width: v.w, height: v.h, deviceScaleFactor: 1, mobile: v.w < 500
});

/* Lapas ar parādīšanās animācijām sākumā ir tukšas — tāpēc lēni izritinām
   līdz apakšai un tikai tad taisām attēlu. */
const settle = async () => {
  await evaluate(`new Promise(done => {
    const step = Math.round(innerHeight * 0.8);
    let y = 0;
    const tick = () => {
      window.scrollTo(0, y);
      y += step;
      if (y < document.body.scrollHeight + step) setTimeout(tick, 120);
      else { window.scrollTo(0, 0); setTimeout(done, 700); }
    };
    tick();
  })`);
};

/* Ekrānuzņēmumā nevajag sīkdatņu joslas, redaktora nozīmītes un sadaļas,
   kas palikušas caurspīdīgas, jo ritināšanas animācija tās paslēpa atpakaļ. */
const ACCEPT = ["pieņemt", "piekrītu", "sapratu", "labi", "accept", "got it", "allow"];

const COOKIE_RE = "/sīkdat|sikdat|sīkfail|sikfail|cookie|consent/i";

const banners = `[...document.querySelectorAll("div, section, aside, dialog, form")]
  .filter(el => {
    const t = (el.innerText || "").trim();
    return t && t.length < 400 && ${COOKIE_RE}.test(t) && el.querySelector("button, [role=button]");
  })`;

const cleanup = async () => {
  // 1. Sīkdatņu paziņojumu aizver ar pogu — tā lapa paliek tāda, kādu to
  //    redz apmeklētājs, kurš uz to jau ir atbildējis.
  await evaluate(`(() => {
    const words = ${JSON.stringify(ACCEPT)};
    const text = el => (el.innerText || "").trim().toLowerCase();
    for (const box of ${banners}) {
      const btn = [...box.querySelectorAll("button, [role=button]")]
        .find(b => { const t = text(b); return t.length < 30 && words.some(w => t.startsWith(w)); });
      if (btn) btn.click();
    }
  })()`);
  await sleep(800);

  await evaluate(`(() => {
    // 2. Kas palicis pāri: neaizvērtās joslas un redaktora nozīmīte.
    const drop = new Set(${banners});
    for (const el of document.querySelectorAll("body *")) {
      const t = (el.innerText || "").trim();
      if (t.length < 60 && /edit with|lovable/i.test(t)) drop.add(el);
    }
    for (const el of document.querySelectorAll('[id*=lovable i], [class*=lovable i], a[href*="lovable.dev"]')) drop.add(el);
    drop.forEach(el => el.remove());

    // 3. Elementi, kurus ritināšanas animācija atstāja caurspīdīgus.
    for (const el of document.querySelectorAll("body *")) {
      const s = el.style;
      if (s.opacity !== "" && parseFloat(s.opacity) < 0.95) s.opacity = "1";
      if (s.transform && /translate|scale/.test(s.transform)) s.transform = "none";
    }
    window.scrollTo(0, 0);
  })()`);
  await sleep(600);
};

const pageHeight = () => evaluate(`Math.max(
  document.body.scrollHeight, document.documentElement.scrollHeight,
  document.body.offsetHeight, document.documentElement.offsetHeight)`);

const shoot = async (view, file) => {
  await setView(view);
  await sleep(900);
  await settle();
  await cleanup();
  const h = Math.min(Math.max(await pageHeight() || view.h, view.h), view.maxH);
  const shot = await send("Page.captureScreenshot", {
    format: "jpeg", quality: QUALITY, captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: view.w, height: h, scale: 1 }
  });
  writeFileSync(file, Buffer.from(shot.data, "base64"));
  return { file, width: view.w, height: h, bytes: statSync(file).size };
};

const results = [];

for (const site of SITES) {
  process.stdout.write(`\n${site.url}\n`);

  try {
    await setView(DESK);
    // `Page.navigate` atgriež errorText, ja savienojums neizdevās — tas ir
    // vienīgais drošais signāls. Pārlūka kļūdas lapai ir savs saturs, tāpēc
    // pēc teksta garuma vien spriest nedrīkst.
    const nav = await send("Page.navigate", { url: site.url });
    if (nav.errorText) {
      console.log("  ! navigācija neizdevās:", nav.errorText);
      results.push({ ...site, ok: false, error: nav.errorText });
      continue;
    }

    await sleep(5000);                  // laiks JS lapām uzzīmēties

    const data = JSON.parse(await evaluate(`JSON.stringify({
      title: document.title || "",
      desc: document.querySelector('meta[name="description"]')?.content || "",
      ogDesc: document.querySelector('meta[property="og:description"]')?.content || "",
      h1: document.querySelector("h1")?.innerText?.trim().slice(0, 200) || "",
      h2: [...document.querySelectorAll("h2")].slice(0, 8).map(h => h.innerText.trim().slice(0, 90)),
      nav: [...document.querySelectorAll("nav a, header a")].slice(0, 12).map(a => a.innerText.trim()).filter(Boolean),
      forms: document.querySelectorAll("form").length,
      images: document.images.length,
      lang: document.documentElement.lang || "",
      bodyLen: document.body ? document.body.innerText.length : 0,
      errorPage: !!document.querySelector("#main-frame-error")
    })`));

    if (data.errorPage || !data.bodyLen) {
      console.log("  ! atvērās pārlūka kļūdas lapa — domēns, visticamāk, ir bloķēts");
      results.push({ ...site, ...data, ok: false });
      continue;                          // ekrānuzņēmumu netaisām
    }

    console.log("  virsraksts:", data.title || "(nav)");
    console.log("  h1:        ", data.h1.replace(/\s+/g, " ") || "(nav)");
    if (data.desc || data.ogDesc) console.log("  apraksts:  ", (data.desc || data.ogDesc).slice(0, 160));
    if (data.h2.length) console.log("  sadaļas:   ", data.h2.join(" · ").replace(/\s+/g, " "));

    const desktop = await shoot(DESK, `${OUT_IMG}/${site.slug}.jpg`);
    console.log(`  ekrānuzņēmums → ${desktop.file} (${desktop.width}×${desktop.height}, ${Math.round(desktop.bytes / 1024)} KB)`);

    const mobile = await shoot(MOB, `${OUT_IMG}/${site.slug}-mobile.jpg`);
    console.log(`  mobilais     → ${mobile.file} (${mobile.width}×${mobile.height}, ${Math.round(mobile.bytes / 1024)} KB)`);

    results.push({ ...site, ...data, ok: true, desktop, mobile });
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
  console.log("\nJa lapas neatveras, pārbaudi vides tīkla politiku:");
  console.log("  curl -sS \"$HTTPS_PROXY/__agentproxy/status\"");
}

ws.close();
process.exit(0);
