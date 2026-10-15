// Product catalog. To add a product, copy one entry and change its details.
// `id` appears in the product page link (product.html#id), so keep it lowercase with dashes.
// `stripeLink` is the product's Stripe payment link; leave it empty until it exists.
const PRODUCTS = [
  {
    id: "the-protector",
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
    name: "The Queen Necklace",
    price: 128,
    image: "assets/bee-charm.jpg",
    summary: "Yellow jade, snow obsidian and tiger eye around a bee charm.",
    description: "Two tiers of chain frame a queen bee charm, strung with yellow jade, snow obsidian and tiger eye, with stainless steel hardware.",
    details: ["Yellow jade", "Snow obsidian", "Tiger eye", "Stainless steel hardware"],
    stripeLink: "https://buy.stripe.com/28EaEY0f5f0V62o0hu4AU01",
  },
];

function formatPrice(amount) {
  return amount == null ? "Price coming soon" : `$${amount}`;
}
