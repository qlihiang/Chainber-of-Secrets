// Emails the shop when an order is paid.
// Stripe calls this after checkout (webhook events checkout.session.completed and
// checkout.session.async_payment_succeeded); it looks up what was bought and sends
// an order summary to the shop's Gmail through Resend.
// Needs these environment variables in Vercel:
//   STRIPE_SECRET_KEY      (already used by checkout)
//   STRIPE_WEBHOOK_SECRET  (whsec_..., from the webhook endpoint in Stripe)
//   RESEND_API_KEY         (re_..., from resend.com)

const crypto = require("crypto");

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

async function stripeGet(path, key) {
  const r = await fetch(`https://api.stripe.com/v1${path}`, { headers: { Authorization: `Bearer ${key}` } });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || `Stripe error ${r.status}`);
  return data;
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
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !RESEND_API_KEY) {
    console.error("order email: missing STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET or RESEND_API_KEY");
    return res.status(500).json({ error: "Not configured." });
  }

  const rawBody = await readRawBody(req);
  if (!verifyStripeSignature(rawBody, req.headers["stripe-signature"], STRIPE_WEBHOOK_SECRET)) {
    return res.status(400).json({ error: "Bad signature." });
  }

  const event = JSON.parse(rawBody.toString("utf8"));
  const session = event.data?.object;
  // Card payments are paid on "completed"; delayed methods (e.g. PayNow) arrive later
  // as "async_payment_succeeded". Email once, when the money is actually in.
  const paidNow = event.type === "checkout.session.completed" && session?.payment_status !== "unpaid";
  const paidLater = event.type === "checkout.session.async_payment_succeeded";
  if (!paidNow && !paidLater) return res.status(200).json({ received: true, emailed: false });

  try {
    const items = await stripeGet(`/checkout/sessions/${encodeURIComponent(session.id)}/line_items?limit=100`, STRIPE_SECRET_KEY);
    await sendEmail(orderEmail(session, items.data || []), RESEND_API_KEY);
    return res.status(200).json({ received: true, emailed: true });
  } catch (err) {
    // A non-2xx reply makes Stripe retry the webhook later.
    console.error("order email failed:", err.message);
    return res.status(500).json({ error: "Order email failed." });
  }
}

module.exports = handler;
// Stripe signs the exact bytes it sends, so the body must not be parsed first.
module.exports.config = { api: { bodyParser: false } };
module.exports.verifyStripeSignature = verifyStripeSignature;
module.exports.orderEmail = orderEmail;
