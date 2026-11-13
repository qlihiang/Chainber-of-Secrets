/**
 * Chainber of Secrets: inventory record (Google Apps Script for the inventory sheet).
 *
 * Paste this into the sheet: Extensions > Apps Script, replace everything, Save.
 * Then run setUp once (it asks for permission and shows the token for Vercel),
 * and deploy it as a web app (Deploy > New deployment > Web app,
 * Execute as: Me, Who has access: Anyone).
 *
 * Tabs it keeps:
 *   Stock take    current stock for every piece, refreshed after every sale and every hour
 *   Transactions  one row per change: opening stock, sales, and restocks made in Stripe
 */

var SITE = "https://chainberofsecrets.com";
// The inventory sheet, so the script works whether it was opened from the sheet
// (Extensions > Apps Script) or created separately at script.google.com.
var SHEET_ID = "1sFH4WwR-nhi0zOq8KN1OmB9HHPlzzHApurYsgv0El0A";
var STOCK_TAB = "Stock take";
var TX_TAB = "Transactions";
var TX_HEADERS = ["Date", "Type", "Product", "Change", "Stock after", "Customer", "Amount (SGD)", "Reference", "Key"];
var STOCK_HEADERS = ["Product", "Type", "Collection", "Price (SGD)", "In stock", "Status"];

function ss_() {
  return SpreadsheetApp.getActive() || SpreadsheetApp.openById(SHEET_ID);
}

// Pop-up when run from the sheet; otherwise the message goes to the Execution log.
function tell_(title, message) {
  try {
    SpreadsheetApp.getUi().alert(title, message, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (err) {
    Logger.log(title + ": " + message);
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Chainber")
    .addItem("Refresh stock take now", "refreshStockTake")
    .addItem("Show token for Vercel", "showToken")
    .addSeparator()
    .addItem("Set up (first time only)", "setUp")
    .addToUi();
}

// First-time setup: tabs, headers, hourly refresh, token, and an opening-stock record.
function setUp() {
  var ss = ss_();
  var tx = sheet_(TX_TAB, TX_HEADERS);
  sheet_(STOCK_TAB, STOCK_HEADERS);
  tx.hideColumns(TX_HEADERS.length); // the Key column is only for skipping duplicates

  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty("TOKEN")) props.setProperty("TOKEN", Utilities.getUuid());

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "refreshStockTake") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("refreshStockTake").timeBased().everyHours(1).create();

  var data = refreshStockTake();
  if (data && tx.getLastRow() === 1) {
    var now = new Date();
    data.products.forEach(function (p) {
      addTx_(tx, now, "Opening stock", p.name, p.stock, p.stock, "", "", "Stock take", "open:" + p.id);
    });
  }
  try { ss.setActiveSheet(ss.getSheetByName(STOCK_TAB)); } catch (err) {}
  showToken();
}

function showToken() {
  var token = PropertiesService.getScriptProperties().getProperty("TOKEN") || "Run 'Set up' first.";
  tell_("Token for Vercel", "Add this in Vercel as INVENTORY_SHEET_TOKEN (Secret):\n\n" + token);
}

// Rewrites the Stock take tab from the live numbers on the website.
function refreshStockTake() {
  var res = UrlFetchApp.fetch(SITE + "/api/stock", { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return null;
  var data = JSON.parse(res.getContentText());
  var sh = sheet_(STOCK_TAB, STOCK_HEADERS);
  var rows = data.products.map(function (p) {
    var status = p.stock === 0 ? "Sold out" : p.stock <= 1 ? "Last one" : p.stock <= 3 ? "Low" : "In stock";
    return [p.name, cap_(p.type), titleCase_(p.collection), p.price, p.stock, status];
  });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, STOCK_HEADERS.length).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, STOCK_HEADERS.length).setValues(rows);
  var total = rows.reduce(function (n, r) { return n + r[4]; }, 0);
  sh.getRange(rows.length + 3, 1, 2, 2).setValues([
    ["Total pieces in stock", total],
    ["Last updated", new Date()],
  ]);
  return data;
}

// The website posts every sale (and every restock made in Stripe) here.
function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "bad json" }); }
  var token = PropertiesService.getScriptProperties().getProperty("TOKEN");
  if (!token || body.token !== token) return json_({ ok: false, error: "bad token" });

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var tx = sheet_(TX_TAB, TX_HEADERS);
    var keyCol = TX_HEADERS.length;
    var existing = {};
    if (tx.getLastRow() > 1) {
      tx.getRange(2, keyCol, tx.getLastRow() - 1, 1).getValues().forEach(function (r) { existing[r[0]] = true; });
    }
    var date = body.date ? new Date(body.date) : new Date();
    (body.rows || []).forEach(function (r) {
      var key = r.order + ":" + r.productId;
      if (existing[key]) return; // already recorded (Stripe sometimes sends twice)
      if (body.kind === "sale") {
        addTx_(tx, date, "Sale", r.product, -r.qty, r.stockAfter, body.customer || "", r.amount, r.order, key);
      } else if (body.kind === "adjustment") {
        var change = r.from == null || r.stockAfter == null ? "" : r.stockAfter - r.from;
        var label = change === "" ? "Stock set in Stripe" : change > 0 ? "Restock" : "Stock correction";
        addTx_(tx, date, label, r.product, change, r.stockAfter, "", "", "Edited in Stripe", key);
      }
      existing[key] = true;
    });
  } finally {
    lock.releaseLock();
  }
  try { refreshStockTake(); } catch (err) {}
  return json_({ ok: true });
}

function doGet() {
  return json_({ ok: true, note: "Chainber inventory sheet is listening." });
}

// ---- helpers --------------------------------------------------------------

function sheet_(name, headers) {
  var ss = ss_();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

function addTx_(sh, date, type, product, change, stockAfter, customer, amount, ref, key) {
  sh.appendRow([date, type, product, change, stockAfter, customer, amount, ref, key]);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function cap_(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
function titleCase_(s) { return (s || "").split("-").map(cap_).join(" "); }
