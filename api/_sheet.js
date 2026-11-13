// Sends inventory records to the shop's Google Sheet (see tools/inventory-sheet.gs).
// The sheet's Apps Script web app receives them, adds rows to "Transactions" and
// refreshes "Stock take". Off unless INVENTORY_SHEET_URL and INVENTORY_SHEET_TOKEN
// are set in Vercel.

async function logToSheet(payload) {
  const { INVENTORY_SHEET_URL, INVENTORY_SHEET_TOKEN } = process.env;
  if (!INVENTORY_SHEET_URL || !INVENTORY_SHEET_TOKEN) return false;
  const r = await fetch(INVENTORY_SHEET_URL, {
    method: "POST",
    // Apps Script reads the body as text; sending plain text avoids a CORS-style preflight.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ token: INVENTORY_SHEET_TOKEN, ...payload }),
    redirect: "follow",
  });
  const text = await r.text();
  let reply = null;
  try { reply = JSON.parse(text); } catch {}
  if (!r.ok || !reply?.ok) throw new Error(`Inventory sheet error ${r.status}: ${text.slice(0, 200)}`);
  return true;
}

module.exports = { logToSheet };
