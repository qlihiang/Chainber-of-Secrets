// Creates a Stripe Checkout Session for the items in the cart.
// Prices always come from Stripe (by Price ID), never from the browser.
// Needs the STRIPE_SECRET_KEY environment variable set in Vercel.

const { PRODUCTS, SHOP } = require("../products.js");

const STRIPE_API = "https://api.stripe.com/v1";

function stripeRequest(path, key, params) {
  const body = params ? new URLSearchParams(params).toString() : undefined;
  return fetch(`${STRIPE_API}${path}`, {
    method: params ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
  }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || `Stripe error ${r.status}`);
    return data;
  });
}

function fail(res, status, message) {
  res.status(status).json({ error: message });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return fail(res, 405, "Use POST.");

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return fail(res, 503, "Checkout isn't set up yet.");

  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (items.length === 0) return fail(res, 400, "Your cart is empty.");

  // Check every item against the catalog.
  const lines = [];
  for (const item of items) {
    const product = PRODUCTS.find((p) => p.id === item?.id);
    const qty = Number.parseInt(item?.qty, 10);
    if (!product) return fail(res, 400, "One of the items is no longer available.");
    if (product.soldOut) return fail(res, 409, `${product.name} has sold out.`);
    if (!product.stripePriceId) return fail(res, 409, `${product.name} isn't available to buy yet.`);
    if (!Number.isInteger(qty) || qty < 1 || qty > (product.maxQty || 1)) {
      return fail(res, 400, `Please check the quantity for ${product.name}.`);
    }
    lines.push({ product, qty });
  }

  try {
    // Look up each price in Stripe to get the real amount for the shipping rule.
    let subtotal = 0;
    for (const line of lines) {
      const price = await stripeRequest(`/prices/${encodeURIComponent(line.product.stripePriceId)}`, key);
      if (!price.active || price.currency !== SHOP.currency) {
        return fail(res, 409, `${line.product.name} isn't available to buy right now.`);
      }
      subtotal += price.unit_amount * line.qty;
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const params = {
      mode: "payment",
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/index.html#collection`,
      "phone_number_collection[enabled]": "true",
    };
    lines.forEach((line, i) => {
      params[`line_items[${i}][price]`] = line.product.stripePriceId;
      params[`line_items[${i}][quantity]`] = String(line.qty);
    });
    SHOP.shipToCountries.forEach((country, i) => {
      params[`shipping_address_collection[allowed_countries][${i}]`] = country;
    });

    const freeOver = SHOP.freeShippingOver == null ? null : Math.round(SHOP.freeShippingOver * 100);
    const fee = SHOP.shippingFee == null ? 0 : Math.round(SHOP.shippingFee * 100);
    const shipsFree = fee === 0 || (freeOver != null && subtotal >= freeOver);
    params["shipping_options[0][shipping_rate_data][type]"] = "fixed_amount";
    params["shipping_options[0][shipping_rate_data][fixed_amount][amount]"] = String(shipsFree ? 0 : fee);
    params["shipping_options[0][shipping_rate_data][fixed_amount][currency]"] = SHOP.currency;
    params["shipping_options[0][shipping_rate_data][display_name]"] = shipsFree ? "Free shipping" : "Standard shipping";

    const session = await stripeRequest("/checkout/sessions", key, params);
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("checkout failed:", err.message);
    fail(res, 502, "We couldn't start checkout. Please try again in a moment.");
  }
};
