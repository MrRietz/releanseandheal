(function () {
  "use strict";

  // Time booking calendar for the booking form (prototype).
  // Does nothing unless #tidskalender exists AND either TIDER_CONFIG is filled in or the URL has ?tider=demo.

  var root = document.getElementById("tidskalender");
  if (!root) return;

  var config = window.TIDER_CONFIG || {};
  var csvUrl = String(config.csvUrl || "");
  var apiUrl = String(config.reserveApiUrl || "");
  var demo = new URLSearchParams(window.location.search).get("tider") === "demo";

  if (!demo && !csvUrl) return;

  var form = root.closest("form");
  if (!form) return;

  var fieldTid = form.querySelector('input[name="Tid"]');
  var fieldCode = form.querySelector('input[name="Tid-kod"]');
  var fieldNone = form.querySelector('input[name="Ingen tid passar"]');
  var fieldHoneypot = form.querySelector('input[name="website"]');
  var serviceSelect = form.querySelector('select[name="Tjänst"]');
  var submitButton = form.querySelector('button[type="submit"]');
  var noneLabel = form.querySelector(".tider-none");
  var honeypotWrap = form.querySelector(".tider-hp");
  if (!fieldTid || !fieldCode || !fieldNone || !fieldHoneypot) return;

  var DAY_SHORT = ["sön", "mån", "tis", "ons", "tors", "fre", "lör"];
  var DAY_LONG = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
  var MONTH_SHORT = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  var MONTH_LONG = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];

  var MSG_NONE_CHOSEN = "Välj en tid eller kryssa i att ingen av tiderna passar.";
  var MSG_TAKEN = "Tiden hann bli bokad, välj en annan tid";
  var MSG_ERROR = "Det gick inte att reservera tiden just nu. Du kan kryssa i att ingen av tiderna passar och skicka förfrågan ändå, så hör jag av mig.";
  var MSG_LOAD_ERROR = "Kunde inte uppdatera tiderna just nu.";

  var slots = []; // free future slots: {date, time, length, when, key}
  var weekStart = null; // Monday 00:00 of the visible week
  var selectedKey = "";
  var busy = false;
  var active = false;

  var ui = {};

  // ---------- Dates ----------

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function dateKey(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function mondayOf(d) {
    var m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
    return m;
  }

  function addDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }

  function isoWeek(d) {
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    var yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  }

  function shortDay(d) {
    return DAY_SHORT[d.getDay()] + " " + d.getDate() + " " + MONTH_SHORT[d.getMonth()];
  }

  function longWhen(d) {
    return DAY_LONG[d.getDay()] + " " + d.getDate() + " " + MONTH_LONG[d.getMonth()] + " kl " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }

  // ---------- Data ----------

  // Builds slot objects from rows {datum, tid, langd, status}, keeping only free slots in the future.
  function toSlots(rows) {
    var now = new Date();
    var result = [];
    rows.forEach(function (row) {
      if (String(row.status || "").trim().toLowerCase() !== "ledig") return;
      var d = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(row.datum || "").trim());
      var t = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(String(row.tid || "").trim());
      if (!d || !t) return;
      var when = new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
      if (isNaN(when.getTime()) || when <= now) return;
      var length = parseInt(row.langd, 10);
      result.push({
        date: dateKey(when),
        time: pad2(when.getHours()) + ":" + pad2(when.getMinutes()),
        length: length > 0 ? length : 0,
        when: when,
        key: dateKey(when) + "T" + pad2(when.getHours()) + ":" + pad2(when.getMinutes())
      });
    });
    result.sort(function (a, b) {
      return a.when - b.when;
    });
    return result;
  }

  // Parses CSV text. Handles quotes, escaped quotes, CRLF/LF and a leading BOM.
  function parseCsv(text) {
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    text = String(text || "").replace(/^﻿/, "");
    for (var i = 0; i < text.length; i++) {
      var c = text.charAt(i);
      if (inQuotes) {
        if (c === '"') {
          if (text.charAt(i + 1) === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text.charAt(i + 1) === "\n") i++;
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
    if (field !== "" || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter(function (r) {
      return r.some(function (cell) {
        return String(cell).trim() !== "";
      });
    });
  }

  function csvToRows(text) {
    var table = parseCsv(text);
    if (!table.length) return [];
    var index = { datum: 0, tid: 1, langd: 2, status: 3 };
    var first = table[0].map(function (h) {
      return String(h).trim().toLowerCase();
    });
    // Use the header row to find columns when it is present, otherwise fall back to the documented order.
    if (first.indexOf("datum") !== -1 && first.indexOf("status") !== -1) {
      index.datum = first.indexOf("datum");
      index.tid = first.indexOf("tid");
      index.status = first.indexOf("status");
      index.langd = first.indexOf("längd") !== -1 ? first.indexOf("längd") : first.indexOf("langd");
      table = table.slice(1);
    }
    return table.map(function (r) {
      return {
        datum: r[index.datum],
        tid: r[index.tid],
        langd: index.langd >= 0 ? r[index.langd] : "",
        status: r[index.status]
      };
    });
  }

  function demoRows() {
    var rows = [];
    var today = new Date();
    var times = ["10:00", "13:00", "15:00"];
    var n = 0;
    for (var i = 0; i < 21; i++) {
      var d = addDays(today, i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      times.forEach(function (t) {
        n++;
        rows.push({ datum: dateKey(d), tid: t, langd: "60", status: n % 4 === 1 ? "Reserverad" : "Ledig" });
      });
    }
    return rows;
  }

  function loadSlots() {
    if (demo) return Promise.resolve(toSlots(demoRows()));
    return fetch(csvUrl, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("CSV " + res.status);
        return res.text();
      })
      .then(function (text) {
        return toSlots(csvToRows(text));
      });
  }

  // ---------- Rendering ----------

  function build() {
    root.textContent = "";
    root.classList.add("tider");

    var title = document.createElement("p");
    title.className = "tider-title";
    title.id = "tider-title";
    title.textContent = "Välj en tid som passar";
    root.appendChild(title);

    if (demo) {
      var note = document.createElement("p");
      note.className = "tider-demo";
      note.textContent = "Demoläge: tiderna är exempel och inget skickas eller reserveras på riktigt.";
      root.appendChild(note);
    }

    var nav = document.createElement("div");
    nav.className = "tider-nav";
    ui.prev = document.createElement("button");
    ui.prev.type = "button";
    ui.prev.className = "tider-step";
    ui.prev.textContent = "← Föregående vecka";
    ui.next = document.createElement("button");
    ui.next.type = "button";
    ui.next.className = "tider-step";
    ui.next.textContent = "Nästa vecka →";
    ui.week = document.createElement("span");
    ui.week.className = "tider-week";
    ui.week.setAttribute("aria-live", "polite");
    nav.appendChild(ui.prev);
    nav.appendChild(ui.week);
    nav.appendChild(ui.next);
    root.appendChild(nav);

    ui.grid = document.createElement("div");
    ui.grid.className = "tider-grid";
    ui.grid.setAttribute("role", "group");
    ui.grid.setAttribute("aria-labelledby", "tider-title");
    root.appendChild(ui.grid);

    ui.empty = document.createElement("p");
    ui.empty.className = "tider-empty";
    ui.empty.textContent = "Inga lediga tider den här veckan";
    ui.empty.hidden = true;
    root.appendChild(ui.empty);

    ui.chosen = document.createElement("p");
    ui.chosen.className = "tider-chosen";
    ui.chosen.setAttribute("aria-live", "polite");
    root.appendChild(ui.chosen);

    ui.msg = document.createElement("p");
    ui.msg.className = "tider-msg";
    ui.msg.setAttribute("role", "alert");
    ui.msg.hidden = true;
    root.appendChild(ui.msg);

    ui.prev.addEventListener("click", function () {
      weekStart = addDays(weekStart, -7);
      renderWeek();
    });
    ui.next.addEventListener("click", function () {
      weekStart = addDays(weekStart, 7);
      renderWeek();
    });
  }

  function renderWeek() {
    var weekEnd = addDays(weekStart, 7);
    var last = addDays(weekEnd, -1);

    ui.week.textContent = "Vecka " + isoWeek(weekStart) + ", " + shortDay(weekStart) + " till " + shortDay(last);
    ui.prev.disabled = !slots.some(function (s) {
      return s.when < weekStart;
    });
    ui.next.disabled = !slots.some(function (s) {
      return s.when >= weekEnd;
    });

    ui.grid.textContent = "";
    var days = {};
    var order = [];
    slots.forEach(function (s) {
      if (s.when >= weekStart && s.when < weekEnd) {
        if (!days[s.date]) {
          days[s.date] = [];
          order.push(s.date);
        }
        days[s.date].push(s);
      }
    });

    ui.empty.hidden = order.length > 0;
    ui.grid.hidden = order.length === 0;

    order.forEach(function (date) {
      var section = document.createElement("section");
      section.className = "tider-day";
      var heading = document.createElement("h3");
      heading.className = "tider-dayname";
      heading.textContent = shortDay(days[date][0].when);
      section.appendChild(heading);
      var list = document.createElement("ul");
      list.className = "tider-slots";
      days[date].forEach(function (s) {
        var item = document.createElement("li");
        var button = document.createElement("button");
        button.type = "button";
        button.className = "tider-slot";
        button.textContent = s.time;
        button.setAttribute("data-key", s.key);
        button.setAttribute("aria-label", longWhen(s.when) + (s.length ? ", " + s.length + " minuter" : ""));
        button.setAttribute("aria-pressed", s.key === selectedKey ? "true" : "false");
        button.addEventListener("click", function () {
          select(s.key === selectedKey ? "" : s.key);
        });
        item.appendChild(button);
        list.appendChild(item);
      });
      section.appendChild(list);
      ui.grid.appendChild(section);
    });
  }

  function findSlot(key) {
    for (var i = 0; i < slots.length; i++) {
      if (slots[i].key === key) return slots[i];
    }
    return null;
  }

  // Updates the selection in place so keyboard focus stays on the clicked button.
  function select(key) {
    var slot = key ? findSlot(key) : null;
    selectedKey = slot ? slot.key : "";

    ui.grid.querySelectorAll(".tider-slot").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-key") === selectedKey ? "true" : "false");
    });

    if (slot) {
      fieldTid.value = longWhen(slot.when);
      fieldCode.value = slot.key;
      fieldNone.checked = false;
      ui.chosen.textContent = "Vald tid: " + longWhen(slot.when);
    } else {
      fieldTid.value = "";
      fieldCode.value = "";
      ui.chosen.textContent = "";
    }
    fieldTid.disabled = fieldCode.disabled = !slot;
    clearMessage();
  }

  function showMessage(text) {
    ui.msg.textContent = text;
    ui.msg.hidden = !text;
  }

  function clearMessage() {
    showMessage("");
  }

  // ---------- Activation ----------

  function activate() {
    active = true;
    root.hidden = false;
    if (noneLabel) noneLabel.hidden = false;
    if (honeypotWrap) honeypotWrap.hidden = false;
    fieldNone.disabled = false;
    fieldHoneypot.disabled = false;
    form.classList.add("tider-active");
  }

  // Back to the plain form, exactly as without the calendar.
  function deactivate() {
    active = false;
    root.hidden = true;
    if (noneLabel) noneLabel.hidden = true;
    if (honeypotWrap) honeypotWrap.hidden = true;
    fieldNone.disabled = fieldNone.checked = false;
    fieldHoneypot.disabled = true;
    fieldTid.disabled = fieldCode.disabled = true;
    fieldTid.value = fieldCode.value = "";
    form.classList.remove("tider-active");
  }

  function showFirstWeek() {
    weekStart = mondayOf(slots.length ? slots[0].when : new Date());
    renderWeek();
  }

  function init() {
    build();
    loadSlots()
      .then(function (loaded) {
        slots = loaded;
        activate();
        showFirstWeek();
      })
      .catch(function (error) {
        // Fail open: if the times cannot be read, the form works as it always has.
        if (window.console) console.warn("Tider kunde inte läsas, formuläret fungerar som vanligt.", error);
        deactivate();
      });
  }

  function reload() {
    return loadSlots()
      .then(function (loaded) {
        slots = loaded;
        if (selectedKey && !findSlot(selectedKey)) select("");
        if (slots.length && (!weekStart || !weekHasSlots())) showFirstWeek();
        else renderWeek();
      })
      .catch(function () {
        showMessage(MSG_LOAD_ERROR);
      });
  }

  function weekHasSlots() {
    var weekEnd = addDays(weekStart, 7);
    return slots.some(function (s) {
      return s.when >= weekStart && s.when < weekEnd;
    });
  }

  // ---------- Form ----------

  fieldNone.addEventListener("change", function () {
    if (fieldNone.checked) select("");
    clearMessage();
  });

  function clientId() {
    var id = "";
    try {
      id = window.localStorage.getItem("tider-klient") || "";
    } catch (e) {
      id = "";
    }
    if (!/^[A-Za-z0-9_-]{6,64}$/.test(id)) {
      id = "k";
      for (var i = 0; i < 20; i++) id += Math.floor(Math.random() * 36).toString(36);
      try {
        window.localStorage.setItem("tider-klient", id);
      } catch (e) {
        // Private mode: a per-page id is good enough.
      }
    }
    return id;
  }

  function setBusy(state) {
    busy = state;
    if (submitButton) submitButton.disabled = state;
  }

  function reserve(slot) {
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = controller ? window.setTimeout(function () { controller.abort(); }, 15000) : 0;
    var payload = {
      datum: slot.date,
      tid: slot.time,
      tjanst: serviceSelect ? serviceSelect.value : "",
      klient: clientId(),
      website: fieldHoneypot.value
    };
    // text/plain avoids a CORS preflight, which Apps Script cannot answer.
    return fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        window.clearTimeout(timer);
        return data;
      }, function (error) {
        window.clearTimeout(timer);
        throw error;
      });
  }

  function finish() {
    // Send as a normal form post to Formspree. submit() does not fire the submit event again.
    fieldHoneypot.disabled = true;
    form.submit();
  }

  form.addEventListener("submit", function (event) {
    if (!active) return;
    if (busy) {
      event.preventDefault();
      return;
    }

    var slot = selectedKey ? findSlot(selectedKey) : null;
    if (!slot && !fieldNone.checked) {
      event.preventDefault();
      showMessage(MSG_NONE_CHOSEN);
      var firstButton = ui.grid.querySelector(".tider-slot");
      (firstButton || fieldNone).focus();
      return;
    }

    if (demo) {
      event.preventDefault();
      setBusy(true);
      window.setTimeout(function () {
        setBusy(false);
        if (slot) {
          slots = slots.filter(function (s) {
            return s.key !== slot.key;
          });
          select("");
          renderWeek();
          showMessage("Demo: tiden " + longWhen(slot.when) + " hade reserverats och formuläret skickats. Inget har skickats på riktigt.");
        } else {
          showMessage("Demo: formuläret hade skickats utan vald tid. Inget har skickats på riktigt.");
        }
      }, 500);
      return;
    }

    if (!slot || !apiUrl) return; // plain submit, the chosen time (if any) travels in the mail

    event.preventDefault();
    setBusy(true);
    reserve(slot)
      .then(function (data) {
        if (data && data.ok === true) {
          finish();
          return;
        }
        setBusy(false);
        var reason = data && data.reason;
        if (reason === "taken" || reason === "past") {
          select("");
          reload().then(function () {
            showMessage(MSG_TAKEN);
          });
        } else {
          showMessage(MSG_ERROR);
        }
      })
      .catch(function (error) {
        if (window.console) console.warn("Reservationen misslyckades.", error);
        setBusy(false);
        showMessage(MSG_ERROR);
      });
  });

  init();
})();
