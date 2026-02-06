(function () {
  var SHEET_ID = "14nV8isKpUlmej7JoVciVBkoeaWqtMBX6c2wBnczm_H0";
  var GID = "0";
  var CALLBACK = "__releaseHealSheetCallback";

  function toText(cell) {
    if (!cell || cell.v === null || typeof cell.v === "undefined") {
      return "";
    }
    return String(cell.v);
  }

  function applyText(el, text) {
    var attr = el.getAttribute("data-text-attr");
    if (attr) {
      el.setAttribute(attr, text);
      return;
    }
    el.textContent = text;
  }

  function applyRows(map) {
    var keyed = document.querySelectorAll("[data-text-key]");
    keyed.forEach(function (el) {
      var key = el.getAttribute("data-text-key");
      if (!key) return;
      var value = map[key];
      if (typeof value === "undefined") return;
      applyText(el, value);
    });
  }

  function buildMap(resp) {
    var rows = (resp && resp.table && resp.table.rows) || [];
    var map = {};
    rows.forEach(function (r) {
      var cells = r.c || [];
      var textKey = toText(cells[1]).trim();
      var text = toText(cells[3]);
      if (textKey) {
        map[textKey] = text;
      }
    });
    return map;
  }

  window[CALLBACK] = function (resp) {
    try {
      var map = buildMap(resp);
      applyRows(map);
    } catch (e) {
      console.error("Sheet text mapping failed:", e);
    }
  };

  var tqx = encodeURIComponent("out:json;responseHandler:" + CALLBACK);
  var src =
    "https://docs.google.com/spreadsheets/d/" +
    SHEET_ID +
    "/gviz/tq?gid=" +
    GID +
    "&tqx=" +
    tqx;

  var script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.onerror = function () {
    console.error("Could not load Google Sheet data.");
  };
  document.head.appendChild(script);
})();
