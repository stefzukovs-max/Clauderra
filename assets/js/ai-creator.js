/* ==========================================================================
   WebVeido — AI Izveides demo
   --------------------------------------------------------------------------
   Pilnībā klienta pusē: nav reāla AI API izsaukuma un nav reālas maksājumu
   apstrādes (nav vēl backend, ne Stripe konta). Četru soļu vedni pēc tam
   "ģenerē" priekšskatu no gataviem, nozarei piemērotiem teksta veidnēm —
   godīgi marķēts kā dzīvs demo, ne publicēta lapa (skat. #ai-izveide
   index.html un "ai-creator__honesty" tekstu).

   Uzņēmuma nosaukumu, ko lietotājs ievada, ievieto DOM vienmēr ar
   `textContent`, nekad ar `innerHTML` — tāpēc jebkurš ievadītais teksts
   (arī `<script>` vai citi simboli) parādās burtiski, nevis izpildās.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.getElementById("ai-creator");
  if (!root) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var wizard = document.getElementById("ai-wizard");
  var dotsEl = document.getElementById("ai-dots");
  var backBtn = document.getElementById("ai-back");
  var nextBtn = document.getElementById("ai-next");
  var nextLabel = document.getElementById("ai-next-label");
  var progressEl = document.getElementById("ai-progress");
  var previewEl = document.getElementById("ai-preview");
  var restartBtn = document.getElementById("ai-restart");
  var subscribeBtn = document.getElementById("ai-subscribe");
  var nameInput = document.getElementById("ai-name");

  var steps = [1, 2, 3, 4];
  var current = 1;
  var state = { nozare: "", name: "", merkis: "", stils: "" };

  /* ------------------------------------------------------------------
     1. Satura veidnes — nozares, mērķa un stila dati
     ------------------------------------------------------------------ */
  var NOZARES = {
    restorans: {
      label: "Restorāns, kafejnīca",
      h1: function (n) { return n + " — garšo tā, kā izskatās."; },
      lead: function (n) { return "Ēdienkarte, atrašanās vieta un rezervācija vienā skatā — " + n + " apmeklētājam nav jāmeklē tālruņa numurs kaut kur sociālajos tīklos."; },
      features: ["Ēdienkarte ar cenām un alergēniem", "Galda rezervācija tiešsaistē", "Atrašanās vieta un darba laiks"]
    },
    skaistumkopsana: {
      label: "Skaistumkopšana",
      h1: function (n) { return n + " — pieraksts uz vizīti divu klikšķu attālumā."; },
      lead: function (n) { return "Pakalpojumu saraksts, cenas un tiešsaistes pieraksts — " + n + " klientam vairs nav jāzvana darba laikā, lai vienotos par laiku."; },
      features: ["Pakalpojumu un cenu saraksts", "Tiešsaistes pieraksts uz vizīti", "Darbu galerija un atsauksmes"]
    },
    buvnieciba: {
      label: "Būvniecība, remonts",
      h1: function (n) { return n + " — pabeigti objekti runā skaļāk par solījumiem."; },
      lead: function (n) { return "Objektu galerija ar “pirms un pēc” un skaidrs pakalpojumu saraksts — " + n + " apliecina pieredzi ar darbiem, ne vārdiem."; },
      features: ["Objektu galerija ar rezultātiem", "Pakalpojumu klāsts pa kategorijām", "Pieteikuma forma bezmaksas tāmei"]
    },
    konsultacijas: {
      label: "Konsultācijas, pakalpojumi",
      h1: function (n) { return n + " — konkrēta palīdzība, konkrēts rezultāts."; },
      lead: function (n) { return "Pakalpojumu apraksts, pieredze un veids, kā pieteikties — " + n + " lapa ved tieši līdz pirmajai sarunai, ne līdz vispārīgam “sazinies ar mums”."; },
      features: ["Pakalpojumu un pieejas apraksts", "Klientu atsauksmes", "Vienkārša pieteikšanās forma"]
    },
    eveikals: {
      label: "Interneta veikals",
      h1: function (n) { return n + " — katalogs, grozs un maksājums bez liekas klikšķināšanas."; },
      lead: function (n) { return "Preču katalogs ar filtriem un Latvijā pieņemti maksājumi — " + n + " pircējam pasūtījums aizņem mazāk par minūti."; },
      features: ["Katalogs ar kategorijām un filtriem", "Maksājumi un piegādes Latvijā", "Pasūtījumu vēsture klienta kontā"]
    },
    portfolio: {
      label: "Radoša / portfolio",
      h1: function (n) { return n + " — darbi runā paši par sevi."; },
      lead: function (n) { return "Tīrs, foto-centrēts izkārtojums bez lieka teksta — " + n + " darbi ir pirmais un vienīgais, ko apmeklētājs redz."; },
      features: ["Pilnekrāna darbu galerija", "Par mani / studiju sadaļa", "Kontaktforma sadarbībai"]
    }
  };

  var MERKI = {
    pieteikumi: "Pieteikties konsultācijai",
    pardot: "Skatīt katalogu",
    radit: "Skatīt darbus",
    informet: "Uzzināt vairāk"
  };

  var MERKI_LABEL = {
    pieteikumi: "Pieteikumi un zvani",
    pardot: "Pārdot tiešsaistē",
    radit: "Rādīt darbus",
    informet: "Informēt par sevi"
  };

  var STILI = {
    klasisks: { label: "Klasisks", accent: "#c81e3f" },
    mierigs: { label: "Mierīgs", accent: "#2f5fa8" },
    silts: { label: "Silts", accent: "#b8752b" }
  };

  /* ------------------------------------------------------------------
     2. Vedņa navigācija
     ------------------------------------------------------------------ */
  function stepValid(n) {
    if (n === 1) return !!state.nozare;
    if (n === 2) return nameInput && nameInput.value.trim().length > 0;
    if (n === 3) return !!state.merkis;
    if (n === 4) return !!state.stils;
    return false;
  }

  function updateDots() {
    var dots = dotsEl.querySelectorAll("span");
    dots.forEach(function (d, i) {
      d.classList.toggle("is-active", i === current - 1);
      d.classList.toggle("is-done", i < current - 1);
    });
  }

  function updateNav() {
    backBtn.hidden = current === 1;
    nextBtn.disabled = !stepValid(current);
    nextLabel.textContent = current === 4 ? "Ģenerē manu lapu" : "Tālāk";
  }

  function goToStep(n) {
    steps.forEach(function (s) {
      document.getElementById("ai-step-" + s).hidden = s !== n;
    });
    current = n;
    updateDots();
    updateNav();
    var focusTarget = document.getElementById("ai-step-" + n).querySelector("button, input");
    if (focusTarget) focusTarget.focus({ preventScroll: true });
  }

  root.querySelectorAll(".ai-creator__opt").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var group = btn.closest(".ai-creator__options");
      group.querySelectorAll(".ai-creator__opt").forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");

      if (current === 1) state.nozare = btn.getAttribute("data-value");
      else if (current === 3) state.merkis = btn.getAttribute("data-value");
      else if (current === 4) state.stils = btn.getAttribute("data-value");

      updateNav();
    });
  });

  if (nameInput) {
    nameInput.addEventListener("input", function () {
      state.name = nameInput.value.trim();
      updateNav();
    });
  }

  backBtn.addEventListener("click", function () {
    if (current > 1) goToStep(current - 1);
  });

  nextBtn.addEventListener("click", function () {
    if (!stepValid(current)) return;
    if (current < 4) goToStep(current + 1);
    else generate();
  });

  /* ------------------------------------------------------------------
     3. "Ģenerēšanas" secība un priekšskata renderēšana
     ------------------------------------------------------------------ */
  function generate() {
    wizard.hidden = true;
    progressEl.hidden = false;
    var lines = Array.prototype.slice.call(progressEl.querySelectorAll(".ai-creator__progress-line"));
    lines.forEach(function (l) { l.classList.remove("is-active"); });

    var delay = reduced ? 0 : 480;
    lines.forEach(function (line, i) {
      window.setTimeout(function () { line.classList.add("is-active"); }, delay * (i + 1));
    });

    window.setTimeout(function () {
      progressEl.hidden = true;
      renderPreview();
      previewEl.hidden = false;
      previewEl.classList.remove("is-visible");
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { previewEl.classList.add("is-visible"); });
      });
    }, delay * (lines.length + 1));
  }

  function renderPreview() {
    var data = NOZARES[state.nozare];
    var name = state.name || "Tavs uzņēmums";
    var stils = STILI[state.stils] || STILI.klasisks;
    var inner = document.getElementById("ai-preview-inner");

    inner.style.setProperty("--demo-accent", stils.accent);

    var logo = document.getElementById("ai-p-logo");
    logo.textContent = "";
    var mark = document.createElement("span");
    mark.className = "ai-creator__preview-mark";
    mark.textContent = name.charAt(0).toUpperCase();
    var label = document.createElement("span");
    label.textContent = name;
    logo.appendChild(mark);
    logo.appendChild(label);

    document.getElementById("ai-p-h1").textContent = data.h1(name);
    document.getElementById("ai-p-lead").textContent = data.lead(name);

    var featuresEl = document.getElementById("ai-p-features");
    featuresEl.textContent = "";
    data.features.forEach(function (f) {
      var li = document.createElement("li");
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2.4");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      svg.setAttribute("aria-hidden", "true");
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M20 6 9 17l-5-5");
      svg.appendChild(path);
      var span = document.createElement("span");
      span.textContent = f;
      li.appendChild(svg);
      li.appendChild(span);
      featuresEl.appendChild(li);
    });

    document.getElementById("ai-p-cta").textContent = MERKI[state.merkis] || "Uzzināt vairāk";
  }

  restartBtn.addEventListener("click", function () {
    state = { nozare: "", name: "", merkis: "", stils: "" };
    if (nameInput) nameInput.value = "";
    root.querySelectorAll(".ai-creator__opt.is-active").forEach(function (b) { b.classList.remove("is-active"); });
    previewEl.classList.remove("is-visible");
    previewEl.hidden = true;
    wizard.hidden = false;
    goToStep(1);
  });

  /* ------------------------------------------------------------------
     4. Abonēšanas CTA — aizpilda reālo kontaktformu ar izvēlēm
     ------------------------------------------------------------------ */
  subscribeBtn.addEventListener("click", function () {
    var zina = document.getElementById("zina");
    if (zina) {
      var nozareLabel = (NOZARES[state.nozare] || {}).label || "nav norādīts";
      var merkisLabel = MERKI_LABEL[state.merkis] || "nav norādīts";
      var stilsLabel = (STILI[state.stils] || {}).label || "nav norādīts";
      zina.value = "Interesē AI Izveides abonements (20 €/mēn.) — nozare: " + nozareLabel +
        ", mērķis: " + merkisLabel + ", stils: " + stilsLabel + ".";
    }
    var target = document.getElementById("sakt");
    if (target) target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    var vards = document.getElementById("vards");
    if (vards) window.setTimeout(function () { vards.focus({ preventScroll: true }); }, reduced ? 0 : 500);
  });

  updateDots();
  updateNav();
})();
