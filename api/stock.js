// GET /api/stock: live stock for every product, read from Stripe.
// The site falls back to the numbers in products.js if this is unavailable.

const { PRODUCTS } = require("../products.js");
const { getLiveStock } = require("./_stock.js");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Use GET." });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(503).json({ error: "Stock isn't set up yet." });

  try {
    const stock = await getLiveStock(key);
    // Short shared cache: fresh enough for a small shop, and spares Stripe on busy pages.
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=20, stale-while-revalidate=60");
    // `products` is for the inventory sheet's "Stock take" tab.
    const products = PRODUCTS.map((p) => ({
      id: p.id, sku: p.sku || "", name: p.name, type: p.type, collection: p.collection || "", price: p.price, stock: stock[p.id],
    }));
    return res.status(200).json({ stock, products, updated: new Date().toISOString() });
  } catch (err) {
    console.error("stock lookup failed:", err.message);
    return res.status(502).json({ error: "Couldn't load stock." });
  }
};
