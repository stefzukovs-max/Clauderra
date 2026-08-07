/* ==========================================================================
   WebVeido — pieteikumu glabātuve
   --------------------------------------------------------------------------
   Kopīgs slānis mājaslapai un administrācijas panelim.

   SVARĪGI: dati glabājas TIKAI apmeklētāja pārlūkā (localStorage). Tas ir
   demonstrācijas risinājums, lai paneli varētu izmēģināt bez servera.
   Reālā darbā pieteikumi jāsūta uz serveri — skat. README.
   ========================================================================== */

(function () {
  "use strict";

  var KEY = "wv-leads";

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function write(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;                       // piem., pilna krātuve vai privātais režīms
    }
  }

  function id() {
    return "wv-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  window.WVStore = {
    KEY: KEY,

    all: function () {
      return read().sort(function (a, b) {
        return (b.created || 0) - (a.created || 0);
      });
    },

    add: function (lead) {
      var list = read();
      var item = {
        id: id(),
        created: Date.now(),
        status: "jauns",
        vards: lead.vards || "",
        epasts: lead.epasts || "",
        talrunis: lead.talrunis || "",
        nozare: lead.nozare || "",
        zina: lead.zina || "",
        avots: lead.avots || "mājaslapa",
        aprekins: lead.aprekins || null
      };
      list.push(item);
      write(list);
      return item;
    },

    update: function (leadId, patch) {
      var list = read();
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === leadId) {
          Object.keys(patch).forEach(function (k) { list[i][k] = patch[k]; });
          write(list);
          return list[i];
        }
      }
      return null;
    },

    remove: function (leadId) {
      write(read().filter(function (l) { return l.id !== leadId; }));
    },

    clear: function () { write([]); },

    /* Demonstrācijas dati, lai paneli varētu apskatīt arī tukšā pārlūkā */
    seed: function () {
      if (read().length) return false;
      var now = Date.now();
      var day = 86400000;
      var demo = [
        { vards: "Ilze Krastiņa", epasts: "ilze@salons-riga.lv", talrunis: "+371 26 111 222",
          nozare: "Skaistumkopšanas salons", zina: "Vēlamies mājaslapu ar pierakstu sistēmu un cenrādi.",
          status: "jauns", d: 0.2 },
        { vards: "Jānis Bērziņš", epasts: "janis@galdnieciba.lv", talrunis: "+371 29 333 444",
          nozare: "Galdniecība Siguldā", zina: "Vajag darbu galeriju un cenu pieprasījuma formu.",
          status: "sazinājāmies", d: 1.4 },
        { vards: "Anna Ozola", epasts: "anna@veikals.lv", talrunis: "",
          nozare: "Interneta veikals", zina: "Interesē e-komercija ar latviešu maksājumiem.",
          status: "piedāvājums", d: 3.1 },
        { vards: "Mārtiņš Liepa", epasts: "martins@buvfirma.lv", talrunis: "+371 20 555 666",
          nozare: "Būvniecība", zina: "Esošā lapa ir lēna un neparādās Google.",
          status: "klients", d: 6.5 },
        { vards: "Laura Kalniņa", epasts: "laura@studija.lv", talrunis: "",
          nozare: "Foto studija", zina: "Portfolio lapa ar galeriju.",
          status: "atteikts", d: 9.2 }
      ];

      var list = demo.map(function (x) {
        return {
          id: id(), created: now - x.d * day, status: x.status,
          vards: x.vards, epasts: x.epasts, talrunis: x.talrunis,
          nozare: x.nozare, zina: x.zina, avots: "demonstrācija", aprekins: null
        };
      });
      write(list);
      return true;
    },

    toCSV: function () {
      var cols = ["created", "status", "vards", "epasts", "talrunis", "nozare", "zina", "avots"];
      var head = ["Saņemts", "Statuss", "Vārds", "E-pasts", "Tālrunis", "Nozare", "Ziņa", "Avots"];

      function esc(v) {
        var t = String(v == null ? "" : v).replace(/"/g, '""');
        return '"' + t + '"';
      }

      var lines = [head.map(esc).join(";")];
      this.all().forEach(function (l) {
        lines.push(cols.map(function (c) {
          if (c === "created") return esc(new Date(l.created).toLocaleString("lv-LV"));
          return esc(l[c]);
        }).join(";"));
      });
      // BOM, lai Excel pareizi nolasītu latviešu burtus
      return "﻿" + lines.join("\r\n");
    }
  };
})();
