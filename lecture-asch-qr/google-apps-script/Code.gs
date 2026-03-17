const SPREADSHEET_ID = "";
const SHEET_NAME = "Assignments";
const CONFEDERATE_RATE = 0.8;

function doGet(e) {
  const callback = sanitizeCallback_(e.parameter.callback || "handleAssignment");
  const email = normalizeEmail_(e.parameter.email || "");

  if (!email) {
    return jsonp_(callback, {
      ok: false,
      error: "Email is required.",
    });
  }

  const sheet = getSheet_();
  const existing = findCondition_(sheet, email);
  const condition = existing || assignCondition_();

  if (!existing) {
    sheet.appendRow([new Date(), email, condition]);
  }

  return jsonp_(callback, {
    ok: true,
    condition: condition,
  });
}

function getSheet_() {
  const spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["timestamp", "email", "condition"]);
  }

  return sheet;
}

function findCondition_(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return "";
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  for (let i = 0; i < values.length; i += 1) {
    if (normalizeEmail_(values[i][1]) === email) {
      return values[i][2];
    }
  }

  return "";
}

function assignCondition_() {
  return Math.random() < CONFEDERATE_RATE ? "confederate" : "control";
}

function normalizeEmail_(value) {
  return String(value).trim().toLowerCase();
}

function sanitizeCallback_(value) {
  if (/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(value)) {
    return value;
  }
  return "handleAssignment";
}

function jsonp_(callback, payload) {
  return ContentService.createTextOutput(
    callback + "(" + JSON.stringify(payload) + ");",
  ).setMimeType(ContentService.MimeType.JAVASCRIPT);
}
