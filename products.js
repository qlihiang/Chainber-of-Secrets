// Product catalog. To add a product, copy one entry and change its details.
// `id` appears in the product page link (product.html#id), so keep it lowercase with dashes.
// `stripePriceId` is the product's Price ID from Stripe (starts with "price_"); the
// checkout uses Stripe's price, so the amount here is only for display.
// `stock` is how many are available: 0 shows "Sold out"; 1-3 shows "Only N left".
//   Update it by hand after a sale (the site doesn't count sales automatically).
// `oneOfAKind: true` labels a unique piece "One of a kind" (use with stock: 1).
// `maxPerOrder` (optional) caps how many one customer can buy, e.g. 2.
// `stripeLink` is the older single-item payment link, kept as a fallback.
const PRODUCTS = [
  {
    id: "the-protector",
    stripePriceId: "",
    stock: 1,
    oneOfAKind: true,
    name: "The Protector Necklace",
    price: 138,
    image: "assets/rose-quartz-heart.jpg",
    summary: "Rose quartz heart, pearls and Swarovski crystal on woven chainmaille.",
    description: "A woven chainmaille collar draped with chain, finished with a rose quartz heart, pearls and Swarovski crystal, with stainless steel hardware.",
    details: ["Rose quartz heart", "Pearls", "Swarovski crystal", "Stainless steel hardware"],
    stripeLink: "https://buy.stripe.com/9B63cw1j97yt4Yk7JW4AU02",
  },
  {
    id: "the-queen",
    stripePriceId: "",
    stock: 1,
    oneOfAKind: true,
    name: "The Queen Necklace",
    price: 128,
    image: "assets/bee-charm.jpg",
    summary: "Yellow jade, snow obsidian and tiger eye around a bee charm.",
    description: "Two tiers of chain frame a queen bee charm, strung with yellow jade, snow obsidian and tiger eye, with stainless steel hardware.",
    details: ["Yellow jade", "Snow obsidian", "Tiger eye", "Stainless steel hardware"],
    stripeLink: "https://buy.stripe.com/28EaEY0f5f0V62o0hu4AU01",
  },
];

// Shop-wide settings, used by the cart and by the checkout on the server.
const SHOP = {
  currency: "sgd",
  shipToCountries: ["SG"],
  shippingFee: 5,           // flat shipping fee in dollars
  freeShippingOver: 100,    // orders at or above this (in dollars) ship free
};

function formatPrice(amount) {
  return amount == null ? "Price coming soon" : `$${amount}`;
}

// How many of a product one customer can put in the bag.
function maxPerCustomer(product) {
  const stock = Math.max(0, product.stock ?? 0);
  return product.maxPerOrder ? Math.min(stock, product.maxPerOrder) : stock;
}

if (typeof module !== "undefined") module.exports = { PRODUCTS, SHOP, maxPerCustomer };
