// Product catalog. To add a product, copy one entry and change its details.
// `id` appears in the product page link (product.html#id), so keep it lowercase with dashes.
// `stripeLink` is the product's Stripe payment link; leave it empty until it exists.
const PRODUCTS = [
  {
    id: "rose-quartz-heart",
    name: "Rose Quartz Heart Necklace",
    price: 128,
    image: "assets/rose-quartz-heart.jpg",
    summary: "Layered chainmaille with a rose quartz heart.",
    description: "A woven chainmaille collar draped with curb chain, finished with a rose quartz heart, pink crystal drops and silver spikes.",
    details: ["Handmade chainmaille", "Rose quartz heart pendant", "Pink crystal and bead accents"],
    stripeLink: "https://buy.stripe.com/eVq3cwe5V3idduQc0c4AU00",
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
  {
    id: "rosette-bracelet",
    name: "Rosette Chainmaille Bracelet",
    price: null,
    image: "assets/rosette-bracelet.jpg",
    badge: "New",
    summary: "Woven silver rosettes linked by open rings.",
    description: "Little woven chainmaille rosettes alternate with smooth open rings around the wrist, catching the light from every side.",
    details: ["Handmade chainmaille", "Woven rosette links", "Silver-tone finish"],
    stripeLink: "",
  },
];

function formatPrice(amount) {
  return amount == null ? "Price coming soon" : `$${amount}`;
}
