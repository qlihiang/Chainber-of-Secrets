// Runs when an order is paid: counts the stock down, records it, and emails the shop.
// Stripe calls this after checkout (webhook events checkout.session.completed and
// checkout.session.async_payment_succeeded). It looks up what was bought, lowers each
// product's "stock" in Stripe (see _stock.js), records the sale in the inventory
// Google Sheet if set up (see _sheet.js), then, if email is set up, sends an order
// summary to the shop's Gmail through Resend.
// It also listens for product.updated, so a stock number changed by hand in Stripe
// (a restock) is recorded in the sheet too.
// Environment variables in Vercel:
//   STRIPE_SECRET_KEY      (already used by checkout; needs Products: Write)
//   STRIPE_WEBHOOK_SECRET  (whsec_..., from the webhook endpoint in Stripe)
//   RESEND_API_KEY         (optional, re_..., from resend.com; no key = no email)
//   INVENTORY_SHEET_URL, INVENTORY_SHEET_TOKEN (optional; the sheet's web app)

const crypto = require("crypto");
const { PRODUCTS } = require("../products.js");
const { stripe, parseStock, decrementStock } = require("./_stock.js");
const { logToSheet } = require("./_sheet.js");

const ORDER_EMAIL_TO = "chainberofsecrets@gmail.com";
// Resend's shared sender only delivers to the Resend account's own address,
// so the Resend account must be signed up with ORDER_EMAIL_TO.
const ORDER_EMAIL_FROM = "Chainber of Secrets Orders <onboarding@resend.dev>";
const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// Checks the Stripe-Signature header (t=timestamp,v1=hmac) against the raw body.
function verifyStripeSignature(rawBody, header, secret, now = Math.floor(Date.now() / 1000)) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.split("=")).filter((kv) => kv.length === 2 && kv[0] === "t")
  );
  const signatures = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  const timestamp = Number(parts.t);
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(now - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return signatures.some((sig) => {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));
const money = (cents, currency = "sgd") => `${currency.toUpperCase()} ${(cents / 100).toFixed(2)}`;

function orderEmail(session, lineItems) {
  const currency = session.currency || "sgd";
  const customer = session.customer_details || {};
  const shipping = session.collected_information?.shipping_details || session.shipping_details || {};
  const address = shipping.address || customer.address || {};
  const shippingCost = session.shipping_cost?.amount_total ?? 0;

  const items = lineItems.map((li) => ({
    name: li.description || li.price?.product?.name || "Item",
    qty: li.quantity || 1,
    total: li.amount_total ?? 0,
  }));
  const first = items[0]?.name || "an order";
  const more = items.length > 1 ? ` + ${items.length - 1} more` : "";
  const subject = `New order: ${first}${more} (${money(session.amount_total ?? 0, currency)})`;

  const addressLines = [
    shipping.name || customer.name,
    address.line1,
    address.line2,
    [address.postal_code, address.city].filter(Boolean).join(" "),
    address.country,
  ].filter(Boolean);

  const rows = items.map((i) => `
    <tr>
      <td style="padding:6px 0">${escapeHtml(i.name)}</td>
      <td style="padding:6px 12px;text-align:center">× ${i.qty}</td>
      <td style="padding:6px 0;text-align:right">${money(i.total, currency)}</td>
    </tr>`).join("");

  const paymentLink = session.payment_intent
    ? `https://dashboard.stripe.com/payments/${encodeURIComponent(session.payment_intent)}`
    : "https://dashboard.stripe.com/payments";

  const html = `
  <div style="font-family:Arial,sans-serif;color:#6e2a3d;max-width:560px">
    <h2 style="color:#cd5e77;margin:0 0 4px">You have a new order ✨</h2>
    <p style="margin:0 0 18px;color:#9a5a6b">Paid ${money(session.amount_total ?? 0, currency)}</p>

    <h3 style="margin:18px 0 6px">Items</h3>
    <table style="width:100%;border-collapse:collapse">${rows}
      <tr><td colspan="2" style="padding:6px 0;border-top:1px solid #f4c2c2">Shipping</td>
          <td style="padding:6px 0;border-top:1px solid #f4c2c2;text-align:right">${shippingCost ? money(shippingCost, currency) : "Free"}</td></tr>
      <tr><td colspan="2" style="padding:6px 0"><strong>Total</strong></td>
          <td style="padding:6px 0;text-align:right"><strong>${money(session.amount_total ?? 0, currency)}</strong></td></tr>
    </table>

    <h3 style="margin:18px 0 6px">Ship to</h3>
    <p style="margin:0;line-height:1.6">${addressLines.map(escapeHtml).join("<br>") || "No address given"}</p>

    <h3 style="margin:18px 0 6px">Customer</h3>
    <p style="margin:0;line-height:1.6">
      ${escapeHtml(customer.name || shipping.name || "")}<br>
      ${customer.email ? `<a href="mailto:${escapeHtml(customer.email)}">${escapeHtml(customer.email)}</a><br>` : ""}
      ${escapeHtml(customer.phone || "")}
    </p>

    <p style="margin:22px 0 0"><a href="${paymentLink}" style="color:#cd5e77">View this payment in Stripe</a></p>
    <p style="margin:8px 0 0;font-size:12px;color:#9a5a6b">Remember to update stock on the website for any piece that sold.</p>
  </div>`;

  return { subject, html, replyTo: customer.email };
}


async function sendEmail({ subject, html, replyTo }, key) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: ORDER_EMAIL_FROM,
      to: [ORDER_EMAIL_TO],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!r.ok) throw new Error(`Resend error ${r.status}: ${await r.text()}`);
}

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY } = process.env;
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error("order webhook: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return res.status(500).json({ error: "Not configured." });
  }

  const rawBody = await readRawBody(req);
  if (!verifyStripeSignature(rawBody, req.headers["stripe-signature"], STRIPE_WEBHOOK_SECRET)) {
    return res.status(400).json({ error: "Bad signature." });
  }

  const event = JSON.parse(rawBody.toString("utf8"));
  if (event.type === "product.updated") return handleProductUpdated(event, res);
  const session = event.data?.object;
  // Card payments are paid on "completed"; delayed methods (e.g. PayNow) arrive later
  // as "async_payment_succeeded". Email once, when the money is actually in.
  const paidNow = event.type === "checkout.session.completed" && session?.payment_status !== "unpaid";
  const paidLater = event.type === "checkout.session.async_payment_succeeded";
  if (!paidNow && !paidLater) return res.status(200).json({ received: true, stock: false, emailed: false });

  try {
    const items = await stripe(`/checkout/sessions/${encodeURIComponent(session.id)}/line_items?limit=100`, STRIPE_SECRET_KEY);
    const lineItems = items.data || [];

    // Stock first: if anything fails, Stripe retries and already-counted products are skipped.
    const sales = [];
    for (const li of lineItems) {
      const productId = typeof li.price?.product === "string" ? li.price.product : li.price?.product?.id;
      if (!productId) continue;
      const stockAfter = await decrementStock(productId, li.price.id, li.quantity || 1, session.id, STRIPE_SECRET_KEY);
      const site = PRODUCTS.find((p) => p.stripePriceId === li.price.id);
      sales.push({
        order: session.id,
        productId: site?.id || productId,
        sku: site?.sku || "",
        product: site?.name || li.description || productId,
        qty: li.quantity || 1,
        amount: (li.amount_total ?? 0) / 100,
        stockAfter,
      });
    }

    // Then the sheet (it ignores rows it already has, so retries don't duplicate).
    await logToSheet({
      kind: "sale",
      date: new Date((session.created || Date.now() / 1000) * 1000).toISOString(),
      customer: session.customer_details?.name || "",
      rows: sales,
    });

    if (!RESEND_API_KEY) return res.status(200).json({ received: true, stock: true, emailed: false });
    await sendEmail(orderEmail(session, lineItems), RESEND_API_KEY);
    return res.status(200).json({ received: true, stock: true, emailed: true });
  } catch (err) {
    // A non-2xx reply makes Stripe retry the webhook later.
    console.error("order webhook failed:", err.message);
    return res.status(500).json({ error: "Order processing failed." });
  }
}

// A stock number changed by hand in Stripe (a restock or correction) goes to the sheet.
// The site's own sale updates also change "stock_orders"; those are already recorded.
async function handleProductUpdated(event, res) {
  const product = event.data?.object;
  const before = event.data?.previous_attributes?.metadata;
  if (!product || !before || !("stock" in before) || "stock_orders" in before) {
    return res.status(200).json({ received: true, recorded: false });
  }
  const site = await siteProductFor(product.id);
  try {
    await logToSheet({
      kind: "adjustment",
      date: new Date((event.created || Date.now() / 1000) * 1000).toISOString(),
      rows: [{
        order: event.id,
        productId: site?.id || product.id,
        sku: site?.sku || "",
        product: site?.name || product.name || product.id,
        from: parseStock(before.stock),
        stockAfter: parseStock(product.metadata?.stock),
      }],
    });
    return res.status(200).json({ received: true, recorded: true });
  } catch (err) {
    console.error("inventory sheet failed:", err.message);
    return res.status(500).json({ error: "Recording failed." });
  }
}

// Which site product a Stripe product belongs to (through its prices).
async function siteProductFor(stripeProductId) {
  try {
    const { STRIPE_SECRET_KEY } = process.env;
    const prices = await stripe(`/prices?product=${encodeURIComponent(stripeProductId)}&limit=100`, STRIPE_SECRET_KEY);
    const ids = new Set((prices.data || []).map((p) => p.id));
    return PRODUCTS.find((p) => ids.has(p.stripePriceId)) || null;
  } catch {
    return null;
  }
}

module.exports = handler;
// Stripe signs the exact bytes it sends, so the body must not be parsed first.
module.exports.config = { api: { bodyParser: false } };
module.exports.verifyStripeSignature = verifyStripeSignature;
module.exports.orderEmail = orderEmail;
