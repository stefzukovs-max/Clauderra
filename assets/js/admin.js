/* ==========================================================================
   WebVeido — administrācijas paneļa loģika
   --------------------------------------------------------------------------
   UZMANĪBU: piekļuves kods tiek pārbaudīts pārlūkā un nesniedz drošību.
   Tā ir demonstrācija. Reālam darbam vajadzīga servera puses pārbaude.
   ========================================================================== */

(function () {
  "use strict";

  var STATUSES = ["jauns", "sazinājāmies", "piedāvājums", "klients", "atteikts"];

  // Viena toņa secīga skala + neitrāls tonis noslēgtajiem (skat. admin.css)
  var COLORS = {
    "jauns": "var(--c-1)",
    "sazinājāmies": "var(--c-2)",
    "piedāvājums": "var(--c-3)",
    "klients": "var(--c-4)",
    "atteikts": "var(--c-off)"
  };

  var LABELS = {
    "jauns": "Jauns",
    "sazinājāmies": "Sazinājāmies",
    "piedāvājums": "Piedāvājums",
    "klients": "Klients",
    "atteikts": "Atteikts"
  };

  var $ = function (id) { return document.getElementById(id); };

  function esc(t) {
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function plural(n, one, many, zero) {
    if (n === 0 && zero) return zero;
    if (n % 10 === 1 && n % 100 !== 11) return one;
    return many;
  }

  function fmtDate(ts) {
    return new Date(ts).toLocaleDateString("lv-LV", {
      day: "numeric", month: "short", year: "numeric"
    });
  }

  function fmtDateTime(ts) {
    return new Date(ts).toLocaleString("lv-LV", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  }

  /* ------------------------------------------------------------------
     Piekļuves ekrāns (tikai demonstrācijai)
     ------------------------------------------------------------------ */
  var gate = $("gate");
  var admin = $("admin");
  var KEY = "wv-admin-open";

  function openPanel() {
    gate.hidden = true;
    gate.style.display = "none";
    admin.hidden = false;
    render();
  }

  (function initGate() {
    var open = false;
    try { open = sessionStorage.getItem(KEY) === "1"; } catch (e) {}
    if (open) { openPanel(); return; }

    $("gate-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var code = $("gate-code").value.trim().toLowerCase();
      var err = $("gate-error");

      if (code !== "webveido") {
        err.textContent = "Nepareizs kods. Demonstrācijas kods ir «webveido».";
        $("gate-code").setAttribute("aria-invalid", "true");
        return;
      }

      err.textContent = "";
      try { sessionStorage.setItem(KEY, "1"); } catch (e2) {}
      openPanel();
    });
  })();

  var logout = $("logout");
  if (logout) {
    logout.addEventListener("click", function () {
      try { sessionStorage.removeItem(KEY); } catch (e) {}
      window.location.reload();
    });
  }

  /* ------------------------------------------------------------------
     Tēmas pārslēgs
     ------------------------------------------------------------------ */
  (function initTheme() {
    var btn = $("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var root = document.documentElement;
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("wv-theme", next); } catch (e) {}
      render();                            // diagrammu krāsas nāk no marķieriem
    });
  })();

  /* ------------------------------------------------------------------
     Kopsavilkuma plāksnes
     ------------------------------------------------------------------ */
  function renderTiles(leads) {
    var week = Date.now() - 7 * 86400000;
    var recent = leads.filter(function (l) { return l.created >= week; }).length;
    var fresh = leads.filter(function (l) { return l.status === "jauns"; }).length;
    var won = leads.filter(function (l) { return l.status === "klients"; }).length;
    var rate = leads.length ? Math.round((won / leads.length) * 100) : 0;

    $("t-total").textContent = leads.length;
    $("t-total-sub").textContent = plural(leads.length, "ieraksts", "ieraksti", "nav ierakstu");
    $("t-week").textContent = recent;
    $("t-week-sub").textContent = plural(recent, "jauns pieteikums", "jauni pieteikumi", "nav jaunu");
    $("t-new").textContent = fresh;
    $("t-rate").textContent = rate + " %";
    $("t-rate-sub").textContent = won + " no " + leads.length;
  }

  /* ------------------------------------------------------------------
     Diagramma: pieteikumi pa dienām
     ------------------------------------------------------------------ */
  function renderDays(leads) {
    var box = $("chart-days");
    var days = [];
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    for (var i = 13; i >= 0; i--) {
      var d = new Date(today.getTime() - i * 86400000);
      days.push({ date: d, n: 0 });
    }

    leads.forEach(function (l) {
      var d = new Date(l.created);
      d.setHours(0, 0, 0, 0);
      days.forEach(function (slot) {
        if (slot.date.getTime() === d.getTime()) slot.n++;
      });
    });

    var max = Math.max(1, Math.max.apply(null, days.map(function (d) { return d.n; })));

    box.innerHTML = days.map(function (d) {
      var pct = (d.n / max) * 100;
      var label = d.date.getDate() + "." + (d.date.getMonth() + 1) + ".";
      return '<div class="bar" tabindex="0" role="listitem" ' +
        'aria-label="' + label + " — " + d.n + " " +
        plural(d.n, "pieteikums", "pieteikumi", "pieteikumu") + '">' +
        '<span class="bar__tip">' + label + " — <strong>" + d.n + "</strong></span>" +
        '<span class="bar__fill" style="height:' + Math.max(pct, 1.5) + '%"></span>' +
        '<span class="bar__day">' + label + "</span>" +
        "</div>";
    }).join("");
  }

  /* ------------------------------------------------------------------
     Diagramma: sadalījums pa posmiem
     ------------------------------------------------------------------ */
  function renderStages(leads) {
    var box = $("chart-stages");
    var total = leads.length || 1;

    box.innerHTML = STATUSES.map(function (st) {
      var n = leads.filter(function (l) { return l.status === st; }).length;
      var pct = (n / total) * 100;
      return '<div class="stage">' +
        '<div class="stage__top">' +
          '<span class="stage__name">' +
            '<i class="stage__dot" style="background:' + COLORS[st] + '" aria-hidden="true"></i>' +
            LABELS[st] +
          "</span>" +
          '<span class="stage__n">' + n + " · " + Math.round(pct) + " %</span>" +
        "</div>" +
        '<div class="stage__track">' +
          '<div class="stage__fill" style="width:' + pct + "%;background:" + COLORS[st] + '"></div>' +
        "</div>" +
        "</div>";
    }).join("");
  }

  /* ------------------------------------------------------------------
     Pieteikumu tabula
     ------------------------------------------------------------------ */
  var selected = null;

  function visible() {
    var q = ($("q").value || "").trim().toLowerCase();
    var f = $("filter").value;

    return window.WVStore.all().filter(function (l) {
      if (f && l.status !== f) return false;
      if (!q) return true;
      return [l.vards, l.epasts, l.nozare, l.zina]
        .join(" ").toLowerCase().indexOf(q) > -1;
    });
  }

  function renderTable(list) {
    var body = $("leads-body");
    var empty = $("leads-empty");

    $("leads-count").textContent = list.length + " " +
      plural(list.length, "ieraksts", "ieraksti", "ierakstu");

    if (!list.length) {
      body.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    body.innerHTML = list.map(function (l) {
      return '<tr data-id="' + l.id + '" tabindex="0" aria-selected="' +
        (selected === l.id) + '">' +
        '<td class="leads__date">' + fmtDate(l.created) + "</td>" +
        "<td>" +
          '<div class="leads__name">' + esc(l.vards || "Bez vārda") + "</div>" +
          '<div class="leads__mail">' + esc(l.epasts) + "</div>" +
        "</td>" +
        "<td>" + esc(l.nozare || "—") + "</td>" +
        "<td>" + esc(l.avots || "—") + "</td>" +
        '<td><span class="pill"><i style="background:' + COLORS[l.status] +
          '"></i>' + (LABELS[l.status] || l.status) + "</span></td>" +
        "</tr>";
    }).join("");
  }

  /* ------------------------------------------------------------------
     Detaļu panelis
     ------------------------------------------------------------------ */
  var drawer = $("drawer");
  var scrim = $("scrim");

  function openDrawer(id) {
    var lead = window.WVStore.all().filter(function (l) { return l.id === id; })[0];
    if (!lead) return;

    selected = id;
    drawer.hidden = false;
    // Nākamajā kadrā, lai pārejas animācija nostrādātu
    window.requestAnimationFrame(function () {
      drawer.setAttribute("data-open", "true");
      scrim.setAttribute("data-open", "true");
    });

    $("drawer-title").textContent = lead.vards || "Pieteikums";
    $("drawer-date").textContent = fmtDateTime(lead.created);

    var rows = [
      ["E-pasts", '<a href="mailto:' + esc(lead.epasts) + '">' + esc(lead.epasts) + "</a>"],
      ["Tālrunis", lead.talrunis
        ? '<a href="tel:' + esc(lead.talrunis.replace(/\s/g, "")) + '">' + esc(lead.talrunis) + "</a>"
        : "—"],
      ["Uzņēmums vai nozare", esc(lead.nozare || "—")],
      ["Ziņa", esc(lead.zina || "—")],
      ["Avots", esc(lead.avots || "—")]
    ];

    if (lead.aprekins) rows.push(["Kalkulatora aprēķins", esc(lead.aprekins)]);

    $("drawer-body").innerHTML = rows.map(function (r) {
      return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>";
    }).join("");

    $("drawer-status").value = lead.status;
    $("drawer-mail").href = "mailto:" + lead.epasts +
      "?subject=" + encodeURIComponent("Par tavu pieteikumu — WebVeido");

    $("drawer-status").onchange = function () {
      window.WVStore.update(id, { status: this.value });
      render();
    };

    $("drawer-delete").onclick = function () {
      window.WVStore.remove(id);
      closeDrawer();
      render();
    };

    render();
    $("drawer-close").focus();
  }

  function closeDrawer() {
    selected = null;
    drawer.setAttribute("data-open", "false");
    scrim.setAttribute("data-open", "false");
    window.setTimeout(function () { drawer.hidden = true; }, 360);
    render();
  }

  $("drawer-close").addEventListener("click", closeDrawer);
  scrim.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer.getAttribute("data-open") === "true") closeDrawer();
  });

  $("leads-body").addEventListener("click", function (e) {
    var tr = e.target.closest("tr[data-id]");
    if (tr) openDrawer(tr.dataset.id);
  });

  $("leads-body").addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var tr = e.target.closest("tr[data-id]");
    if (tr) { e.preventDefault(); openDrawer(tr.dataset.id); }
  });

  /* ------------------------------------------------------------------
     Rīkjosla
     ------------------------------------------------------------------ */
  $("q").addEventListener("input", render);
  $("filter").addEventListener("change", render);

  $("export").addEventListener("click", function () {
    var csv = window.WVStore.toCSV();
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "webveido-pieteikumi-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  $("seed").addEventListener("click", function () {
    var added = window.WVStore.seed();
    if (!added) window.alert("Dati jau ir. Demo ierakstus pievieno tikai tukšā sarakstā.");
    render();
  });

  /* ------------------------------------------------------------------
     Zīmēšana
     ------------------------------------------------------------------ */
  function render() {
    if (admin.hidden) return;
    var all = window.WVStore.all();
    renderTiles(all);
    renderDays(all);
    renderStages(all);
    renderTable(visible());
  }
})();
