// Release & Heal: tidsbokning (prototype).
// Google Apps Script web app that reserves a free slot in a Google Sheet.
//
// Sheet layout (see README.md in this folder):
//   Tab "Tider": Datum (YYYY-MM-DD) | Tid (HH:MM) | Längd (min, optional) | Status | Reserverad | Händelse-id
//   Tab "Logg":  private audit log, created automatically by this script.
//
// No names or e-mail addresses are ever stored here. They only travel in the Formspree e-mail.
// A reserved slot also becomes an event in the Google Calendar of the account running the web app
// (no customer data, no guests). onStatusEdit removes it again when the status is set back to "Ledig".
// Pattern borrowed from the schema-noah project (LockService, rate limit, audit log).

// Paste the id of your own spreadsheet here (the long string in the sheet URL).
// Never commit a real id.
const SPREADSHEET_ID = "PASTE_SPREADSHEET_ID_HERE";

// Calendar event on reservation. Set CALENDAR_ENABLED to false to switch it off.
const CALENDAR_ENABLED = true;
// Empty string = the default calendar of the account running the script.
const CALENDAR_ID = "";
const DEFAULT_DURATION_MINUTES = 60;

const TIMES_SHEET_NAME = "Tider";
const LOG_SHEET_NAME = "Logg";
const TIMEZONE = "Europe/Stockholm";

// 1-based column numbers on the "Tider" tab.
const COLUMN = {
  datum: 1,
  tid: 2,
  langd: 3,
  status: 4,
  reserverad: 5,
  handelseId: 6,
};

const EVENT_ID_HEADER = "Händelse-id";

const STATUS_FREE = "Ledig";
const STATUS_RESERVED = "Reserverad";

// Rate limiting, counted from the audit log.
const RATE_LIMIT_WINDOW_MINUTES = 10;
const RATE_LIMIT_MAX_ATTEMPTS = 6; // per client id within the window
const RATE_LIMIT_GLOBAL_MAX_ATTEMPTS = 60; // all clients together, guards against rotating client ids
const BLOCK_DURATION_MINUTES = 30;
const LOG_LOOKBACK_ROWS = 300;
const LOCK_WAIT_MS = 5000;
const MAX_FIELD_LENGTH = 120;

const LOG_HEADERS = ["Tidsstämpel", "Utfall", "Datum", "Tid", "Tjänst", "Klient", "Meddelande"];

function doGet() {
  // Simple health check: open the web app URL in a browser and expect {"ok":true}.
  return jsonResponse({ ok: true });
}

function doPost(e) {
  let payload = {};
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(LOCK_WAIT_MS);
  } catch (error) {
    // Could not get the lock in time: another request is busy. Treat as "try again later".
    return jsonResponse({ ok: false, reason: "rate" });
  }

  try {
    try {
      payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    } catch (error) {
      payload = {};
      return respond("invalid", payload, "Bad JSON");
    }
    if (!payload || typeof payload !== "object") {
      payload = {};
      return respond("invalid", payload, "Payload is not an object");
    }

    // Honeypot: real visitors never fill in this field.
    if (String(payload.website || "") !== "") {
      return respond("invalid", payload, "Honeypot filled");
    }

    const klient = String(payload.klient || "");
    if (!/^[A-Za-z0-9_-]{6,64}$/.test(klient)) {
      return respond("invalid", payload, "Bad klient");
    }

    const now = new Date();
    const rate = evaluateRateLimit(klient, now);
    if (rate.blocked) {
      return respond("rate", payload, rate.message);
    }

    const datum = String(payload.datum || "");
    const tid = String(payload.tid || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum) || !/^\d{2}:\d{2}$/.test(tid)) {
      return respond("invalid", payload, "Bad datum or tid");
    }

    // ISO-like strings compare correctly as text.
    const nowText = Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd HH:mm");
    if (datum + " " + tid <= nowText) {
      return respond("past", payload, "Slot already passed");
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TIMES_SHEET_NAME);
    const values = sheet.getDataRange().getValues();

    for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      const row = values[rowIndex];
      if (formatSheetDate(row[COLUMN.datum - 1]) !== datum || formatSheetTime(row[COLUMN.tid - 1]) !== tid) {
        continue;
      }

      if (String(row[COLUMN.status - 1]).trim() !== STATUS_FREE) {
        return respond("taken", payload, "Status is " + String(row[COLUMN.status - 1]));
      }

      sheet.getRange(rowIndex + 1, COLUMN.status).setValue(STATUS_RESERVED);
      sheet.getRange(rowIndex + 1, COLUMN.reserverad).setValue(Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd HH:mm:ss"));
      createCalendarEvent(sheet, rowIndex + 1, row, datum, tid, payload);
      SpreadsheetApp.flush();
      logAttempt("reserved", payload, "");
      return jsonResponse({ ok: true });
    }

    return respond("taken", payload, "Row not found");
  } catch (error) {
    try {
      logAttempt("error", payload, String(error));
    } catch (logError) {
      // Ignore logging errors.
    }
    return jsonResponse({ ok: false, reason: "error" });
  } finally {
    try {
      lock.releaseLock();
    } catch (error) {
      // Ignore lock release errors.
    }
  }
}

// Creates the calendar event for a reserved row and stores its id in column F.
// Never throws: a calendar problem must not stop the reservation.
function createCalendarEvent(sheet, sheetRow, row, datum, tid, payload) {
  if (!CALENDAR_ENABLED) {
    return;
  }

  try {
    const calendar = getCalendar();
    const tjanst = String(payload.tjanst || "").trim();
    const title = tjanst ? "Reserverad: " + truncate(tjanst) : "Reserverad tid";
    const start = Utilities.parseDate(datum + " " + tid, TIMEZONE, "yyyy-MM-dd HH:mm");
    const minutes = Number(row[COLUMN.langd - 1]);
    const duration = isFinite(minutes) && minutes > 0 ? minutes : DEFAULT_DURATION_MINUTES;
    const end = new Date(start.getTime() + duration * 60 * 1000);
    const description = "Reserverad via hemsidan. Namn och kontaktuppgifter finns i bokningsmejlet från Formspree "
      + "(Tid-kod: " + datum + "T" + tid + "). Bekräfta tiden och ändra rubriken när den är bokad.";

    const event = calendar.createEvent(title, start, end, { description: description });

    // Column F may be missing on older sheets: create the header first.
    const headerCell = sheet.getRange(1, COLUMN.handelseId);
    if (String(headerCell.getValue()).trim() !== EVENT_ID_HEADER) {
      headerCell.setValue(EVENT_ID_HEADER);
    }
    sheet.getRange(sheetRow, COLUMN.handelseId).setValue(event.getId());
  } catch (error) {
    try {
      logAttempt("calendar-error", payload, String(error));
    } catch (logError) {
      // Ignore logging errors.
    }
  }
}

function getCalendar() {
  const calendar = CALENDAR_ID ? CalendarApp.getCalendarById(CALENDAR_ID) : CalendarApp.getDefaultCalendar();
  if (!calendar) {
    throw new Error("Calendar not found");
  }
  return calendar;
}

// Installable "On edit" trigger (spreadsheet): when Status in "Tider" is set back to "Ledig",
// delete the calendar event and clear the Reserverad and Händelse-id cells on that row.
// Errors are logged, never thrown.
function onStatusEdit(e) {
  try {
    if (!CALENDAR_ENABLED || !e || !e.range) {
      return;
    }

    const range = e.range;
    const sheet = range.getSheet();
    if (sheet.getName() !== TIMES_SHEET_NAME) {
      return;
    }
    if (range.getColumn() > COLUMN.status || range.getLastColumn() < COLUMN.status) {
      return;
    }

    const firstRow = Math.max(range.getRow(), 2); // row 1 holds the headers
    for (let sheetRow = firstRow; sheetRow <= range.getLastRow(); sheetRow += 1) {
      releaseCalendarEvent(sheet, sheetRow);
    }
  } catch (error) {
    try {
      logAttempt("calendar-error", {}, "onStatusEdit: " + String(error));
    } catch (logError) {
      // Ignore logging errors.
    }
  }
}

function releaseCalendarEvent(sheet, sheetRow) {
  const payload = {};
  try {
    const row = sheet.getRange(sheetRow, 1, 1, COLUMN.handelseId).getValues()[0];
    payload.datum = formatSheetDate(row[COLUMN.datum - 1]);
    payload.tid = formatSheetTime(row[COLUMN.tid - 1]);

    const eventId = String(row[COLUMN.handelseId - 1]).trim();
    if (String(row[COLUMN.status - 1]).trim() !== STATUS_FREE || !eventId) {
      return;
    }

    const event = getCalendar().getEventById(eventId);
    if (event) {
      event.deleteEvent();
    }

    sheet.getRange(sheetRow, COLUMN.reserverad).clearContent();
    sheet.getRange(sheetRow, COLUMN.handelseId).clearContent();
    logAttempt("calendar-released", payload, event ? "" : "Event not found, ids cleared");
  } catch (error) {
    try {
      logAttempt("calendar-error", payload, "release: " + String(error));
    } catch (logError) {
      // Ignore logging errors.
    }
  }
}

// Logs the attempt and returns the failure response in one step.
function respond(reason, payload, message) {
  logAttempt(reason, payload, message);
  return jsonResponse({ ok: false, reason: reason });
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// Sheet cells may be plain text or real dates, so normalise both to "yyyy-MM-dd".
function formatSheetDate(value) {
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, TIMEZONE, "yyyy-MM-dd");
  }

  return String(value).trim();
}

// Time cells may be text ("9:00", "09:00:00"), a Date or a fraction of a day. Normalise to "HH:mm".
function formatSheetTime(value) {
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, TIMEZONE, "HH:mm");
  }

  if (typeof value === "number") {
    const totalMinutes = Math.round(value * 24 * 60);
    return pad2(Math.floor(totalMinutes / 60) % 24) + ":" + pad2(totalMinutes % 60);
  }

  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  return match ? pad2(Number(match[1])) + ":" + match[2] : String(value).trim();
}

function pad2(number) {
  return (number < 10 ? "0" : "") + number;
}

function truncate(value) {
  return String(value === undefined || value === null ? "" : value).slice(0, MAX_FIELD_LENGTH);
}

function logAttempt(outcome, payload, message) {
  const sheet = getOrCreateLogSheet(SpreadsheetApp.openById(SPREADSHEET_ID));
  const safe = payload || {};

  sheet.appendRow([
    new Date(),
    outcome,
    truncate(safe.datum),
    truncate(safe.tid),
    truncate(safe.tjanst),
    truncate(safe.klient),
    truncate(message),
  ]);
}

function getOrCreateLogSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
  if (sheet) {
    return sheet;
  }

  sheet = spreadsheet.insertSheet(LOG_SHEET_NAME);
  sheet.appendRow(LOG_HEADERS);
  return sheet;
}

function evaluateRateLimit(klient, now) {
  const properties = PropertiesService.getScriptProperties();
  const blockKey = "blockedUntil:" + klient;
  const blockedUntil = Number(properties.getProperty(blockKey) || 0);

  if (blockedUntil && blockedUntil > now.getTime()) {
    return { blocked: true, message: "Blocked until " + new Date(blockedUntil).toISOString() };
  }

  const counts = countRecentAttempts(klient, now);
  if (counts.global >= RATE_LIMIT_GLOBAL_MAX_ATTEMPTS) {
    return { blocked: true, message: "Global limit reached" };
  }

  if (counts.client >= RATE_LIMIT_MAX_ATTEMPTS) {
    properties.setProperty(blockKey, String(now.getTime() + BLOCK_DURATION_MINUTES * 60 * 1000));
    return { blocked: true, message: "Too many attempts in " + RATE_LIMIT_WINDOW_MINUTES + " minutes" };
  }

  return { blocked: false, message: "" };
}

// Counts recent log rows for this client and for everyone.
function countRecentAttempts(klient, now) {
  const sheet = getOrCreateLogSheet(SpreadsheetApp.openById(SPREADSHEET_ID));
  const lastRow = sheet.getLastRow();
  const counts = { client: 0, global: 0 };

  if (lastRow <= 1) {
    return counts;
  }

  const startRow = Math.max(2, lastRow - LOG_LOOKBACK_ROWS + 1);
  const rows = sheet.getRange(startRow, 1, lastRow - startRow + 1, LOG_HEADERS.length).getValues();
  const cutoff = now.getTime() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;

  rows.forEach(function (row) {
    const timestamp = new Date(row[0]).getTime();
    if (!timestamp || timestamp < cutoff) {
      return;
    }

    counts.global += 1;
    if (String(row[5]) === klient) {
      counts.client += 1;
    }
  });

  return counts;
}
