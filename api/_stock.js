// Live stock, kept in Stripe so sales count themselves down.
// Each Stripe product can carry a metadata field "stock" (a whole number). When a
// product has none yet, the starting number from products.js is used instead.
// To restock, edit the product's "stock" metadata in the Stripe Dashboard.
// (Files starting with "_" in /api are helpers, not endpoints.)

const { PRODUCTS } = require("../products.js");

const STRIPE_API = "https://api.stripe.com/v1";

async function stripe(path, key, params) {
  const r = await fetch(`${STRIPE_API}${path}`, {
    method: params ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: params ? new URLSearchParams(params).toString() : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || `Stripe error ${r.status}`);
  return data;
}

// A metadata value counts only if it is a whole number; anything else falls back.
function parseStock(value) {
  if (value == null || String(value).trim() === "") return null;
  const n = Number(String(value).trim());
  return Number.isInteger(n) ? Math.max(0, n) : null;
}

const fallbackStock = (product) => Math.max(0, product.stock ?? 0);

// Every price with its product expanded, following Stripe's pagination.
async function listPricesWithProducts(key) {
  const prices = [];
  let startingAfter = "";
  for (let page = 0; page < 20; page++) {
    const q = `?limit=100&expand[]=data.product${startingAfter ? `&starting_after=${startingAfter}` : ""}`;
    const res = await stripe(`/prices${q}`, key);
    prices.push(...res.data);
    if (!res.has_more || res.data.length === 0) break;
    startingAfter = res.data[res.data.length - 1].id;
  }
  return prices;
}

// { "the-queen": 1, ... } for every product on the site.
async function getLiveStock(key) {
  const byPrice = new Map((await listPricesWithProducts(key)).map((p) => [p.id, p]));
  const stock = {};
  for (const product of PRODUCTS) {
    const stripeProduct = byPrice.get(product.stripePriceId)?.product;
    const live = parseStock(stripeProduct?.metadata?.stock);
    stock[product.id] = live ?? fallbackStock(product);
  }
  return stock;
}

// Live stock for one site product, read through its price.
async function getProductStock(product, key) {
  const price = await stripe(`/prices/${encodeURIComponent(product.stripePriceId)}?expand[]=product`, key);
  return { price, stock: parseStock(price.product?.metadata?.stock) ?? fallbackStock(product) };
}

// Lowers a Stripe product's stock after a sale (never below 0); returns the new number.
// `priceId` finds the site product, whose starting number is used if Stripe has none yet.
// Stripe can deliver the same order twice, so the last few order ids are kept on the
// product ("stock_orders") and an order already counted is skipped.
const REMEMBERED_ORDERS = 5;
async function decrementStock(stripeProductId, priceId, qty, orderId, key) {
  const stripeProduct = await stripe(`/products/${encodeURIComponent(stripeProductId)}`, key);
  const counted = String(stripeProduct.metadata?.stock_orders || "").split(",").filter(Boolean);
  const current = parseStock(stripeProduct.metadata?.stock);
  if (counted.includes(orderId)) return current;

  const site = PRODUCTS.find((p) => p.stripePriceId === priceId);
  const start = current ?? (site ? fallbackStock(site) : null);
  if (start == null) return null; // a Stripe product the site doesn't know about
  const next = Math.max(0, start - qty);
  await stripe(`/products/${encodeURIComponent(stripeProductId)}`, key, {
    "metadata[stock]": String(next),
    "metadata[stock_orders]": [...counted, orderId].slice(-REMEMBERED_ORDERS).join(","),
  });
  return next;
}

module.exports = { stripe, parseStock, getLiveStock, getProductStock, decrementStock };
