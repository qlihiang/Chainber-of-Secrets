// Product catalog. To add a product, copy one entry and change its details.
// `id` appears in the product page link (product.html#id), so keep it lowercase with dashes.
// `stripeLink` is the product's Stripe payment link; leave it empty until it exists.
const PRODUCTS = [
  {
    id: "rose-quartz-heart",
    name: "Rose Quartz Heart Necklace",
    price: 68,
    image: "assets/rose-quartz-heart.jpg",
    badge: "New",
    summary: "Layered chainmaille with a rose quartz heart.",
    description: "A woven chainmaille collar draped with curb chain, finished with a rose quartz heart, pink crystal drops and silver spikes.",
    details: ["Handmade chainmaille", "Rose quartz heart pendant", "Pink crystal and bead accents"],
    stripeLink: "",
  },
  {
    id: "bee-charm",
    name: "Bee Charm Necklace",
    price: 58,
    image: "assets/bee-charm.jpg",
    summary: "Stone chips and chain around a silver bee.",
    description: "Two tiers of chain framing a silver bee charm, strung with honey and black stone chips, tiger's eye beads and small spikes.",
    details: ["Handmade chain and links", "Silver bee charm", "Natural stone chips and beads"],
    stripeLink: "",
  },
];

function formatPrice(amount) {
  return `$${amount}`;
}
