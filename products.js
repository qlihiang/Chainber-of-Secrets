// Product catalog. To add a product, copy one entry and change its details.
// `id` appears in the product page link (product.html#id), so keep it lowercase with dashes.
// `stripePriceId` is the product's Price ID from Stripe (starts with "price_"); the
// checkout uses Stripe's price, so the amount here is only for display.
// `stock` is how many are available: 0 shows "Sold out"; 1-3 shows "Only N left".
//   Update it by hand after a sale (the site doesn't count sales automatically).
// `oneOfAKind: true` labels a unique piece "One of a kind" (use with stock: 1).
// `maxPerOrder` (optional) caps how many one customer can buy, e.g. 2.
// `images` (optional) lists extra photos for the product page gallery, main photo first;
//   `image` is the one shown on the homepage.
// `type` is "necklace" or "bracelet" (hand chains count as bracelets); used by the Shop filters.
// `collection` (optional) is the id of one of the COLLECTIONS below.
// `stripeLink` is the older single-item payment link, kept as a fallback.
const PRODUCTS = [
  {
    id: "the-protector",
    type: "necklace",
    stripePriceId: "price_1UQpAAJFPFLF0cf3CF9Qveql",
    stock: 1,
    oneOfAKind: true,
    name: "The Protector Necklace",
    price: 138,
    image: "assets/rose-quartz-heart.jpg",
    images: ["assets/rose-quartz-heart.jpg", "assets/protector-necklace-2.jpg", "assets/protector-necklace-3.jpg"],
    summary: "Rose quartz heart, pearls and Swarovski crystal on woven chainmaille.",
    description: "A woven chainmaille collar draped with chain, finished with a rose quartz heart, pearls and Swarovski crystal, with stainless steel hardware.",
    details: ["Rose quartz heart", "Pearls", "Swarovski crystal", "Stainless steel hardware"],
    stripeLink: "https://buy.stripe.com/9B63cw1j97yt4Yk7JW4AU02",
  },
  {
    id: "the-queen",
    type: "necklace",
    stripePriceId: "price_1UQp1MJFPFLF0cf36HVBHpp2",
    stock: 1,
    oneOfAKind: true,
    name: "The Queen Necklace",
    price: 128,
    image: "assets/bee-charm.jpg",
    images: ["assets/bee-charm.jpg", "assets/queen-necklace-2.jpg", "assets/queen-necklace-3.jpg"],
    summary: "Yellow jade, snow obsidian and tiger eye around a bee charm.",
    description: "Two tiers of chain frame a queen bee charm, strung with yellow jade, snow obsidian and tiger eye, with stainless steel hardware.",
    details: ["Yellow jade", "Snow obsidian", "Tiger eye", "Stainless steel hardware"],
    stripeLink: "https://buy.stripe.com/28EaEY0f5f0V62o0hu4AU01",
  },
  {
    id: "the-sister",
    type: "necklace",
    stripePriceId: "price_1URCm8JFPFLF0cf3rc21RoCi",
    stock: 1,
    oneOfAKind: true,
    name: "The Sister Necklace",
    price: 118,
    image: "assets/sister-necklace.jpg",
    images: ["assets/sister-necklace.jpg", "assets/sister-necklace-2.jpg", "assets/sister-necklace-3.jpg", "assets/sister-necklace-4.jpg"],
    summary: "Yellow jade, snow obsidian and tiger eye with a little bee charm.",
    description: "An asymmetric chain with yellow jade, snow obsidian and tiger eye gathered along one side, a bee charm hanging from a woven ring, and fine double chains with tiny drops on the other, with stainless steel hardware.",
    details: ["Yellow jade", "Snow obsidian", "Tiger eye", "Stainless steel hardware"],
    stripeLink: "https://buy.stripe.com/eVqdRae5V3id1M8fco4AU03",
  },
  {
    id: "the-harvest",
    type: "bracelet",
    stripePriceId: "price_1URD99JFPFLF0cf3oof44Zr5",
    stock: 3,
    name: "The Harvest Bracelet",
    price: 38,
    image: "assets/harvest-bracelet.jpg",
    images: ["assets/harvest-bracelet.jpg", "assets/harvest-bracelet-2.jpg"],
    summary: "Honey-toned yellow jade, snow obsidian and tiger eye, inspired by the bees' harvest.",
    description: "Inspired by the honey bees gather and store, drop by golden drop. Honey-coloured yellow jade sits beside snow obsidian and tiger eye, linked stone by stone along a fine chain like a little harvest carried home, with stainless steel hardware. Easy to wear every day, alone or stacked.",
    details: ["Yellow jade", "Snow obsidian", "Tiger eye", "Stainless steel hardware"],
  },
  {
    id: "the-forage",
    type: "bracelet",
    stripePriceId: "price_1URD1jJFPFLF0cf3AJXgrvGR",
    stock: 2,
    name: "The Forage Bracelet",
    price: 38,
    image: "assets/forage-bracelet.jpg",
    images: ["assets/forage-bracelet.jpg", "assets/forage-bracelet-2.jpg"],
    summary: "Little woven chainmaille blooms and a bee charm, all in stainless steel.",
    description: "A bee out foraging from flower to flower: small chainmaille blooms are woven ring by ring and linked by open rings, with a little bee charm by the clasp, all in stainless steel. Light and shining, easy to wear every day, alone or stacked.",
    details: ["Woven chainmaille blooms", "Bee charm", "Stainless steel hardware"],
  },
  {
    id: "the-dewdrop",
    type: "bracelet",
    collection: "moonlit",
    stripePriceId: "price_1URppCJFPFLF0cf3s84Izod9",
    stock: 4,
    name: "The Dewdrop Hand Chain",
    price: 50,
    image: "assets/dewdrop-hand-chain.jpg",
    images: ["assets/dewdrop-hand-chain.jpg", "assets/dewdrop-hand-chain-2.jpg", "assets/dewdrop-hand-chain-3.jpg"],
    summary: "Moonstone and a single kyanite drop, from wrist to finger.",
    description: "Like morning dew caught on a leaf: a moonstone bracelet that trails a fine chain across the back of the hand to a ring on the finger, with one deep-blue kyanite resting in the middle like a drop that holds the sky, with stainless steel hardware. A clear crystal sparkles at the clasp.",
    details: ["Moonstone", "Kyanite", "Stainless steel hardware"],
  },
  {
    id: "the-wisp",
    type: "bracelet",
    collection: "moonlit",
    stripePriceId: "price_1URpudJFPFLF0cf3RoYvWnBj",
    stock: 3,
    name: "The Wisp Bracelet",
    price: 60,
    image: "assets/wisp-bracelet.jpg",
    summary: "Labradorite with a hidden flash of blue light, like a wisp in the woods.",
    description: "Named after the will-o'-the-wisp, the little lights said to lead wanderers through enchanted woods. Labradorite chips glimmer along a fine chain around one round labradorite held in silver filigree caps, each stone hiding a flash of blue that appears only when the light finds it, with stainless steel hardware. A clear crystal sparkles at the clasp.",
    details: ["Labradorite", "Stainless steel hardware"],
  },
  {
    id: "the-prism",
    type: "bracelet",
    collection: "moonlit",
    stripePriceId: "price_1URq12JFPFLF0cf3ePU8lAuE",
    stock: 2,
    name: "The Prism Bracelet",
    price: 50,
    image: "assets/prism-bracelet.jpg",
    summary: "Clear quartz, moonstone and kyanite around a crystal that throws little rainbows.",
    description: "Made to catch the sun: a clear crystal hangs from a woven chainmaille link at the centre, scattering tiny rainbows as you move. Crackled clear quartz, soft moonstone and deep-blue kyanite are spaced along a fine chain on either side, with stainless steel hardware and another crystal sparkling at the clasp.",
    details: ["Kyanite", "Clear quartz", "Moonstone", "Stainless steel hardware"],
  },
  {
    id: "the-tide",
    type: "bracelet",
    collection: "moonlit",
    stripePriceId: "price_1URq5dJFPFLF0cf3Iv4h4n8Q",
    stock: 2,
    name: "The Tide Bracelet",
    price: 50,
    image: "assets/tide-bracelet.jpg",
    summary: "Deep-blue kyanite and milky moonstone, rolling in and out like waves.",
    description: "Blue and white, coming and going like the tide: deep-blue kyanite and milky moonstone take turns along a fine chain, gathered at one side by a woven chainmaille knot, with stainless steel hardware and a clear crystal sparkling at the clasp.",
    details: ["Kyanite", "Moonstone", "Stainless steel hardware"],
  },
  {
    id: "the-bluebell",
    type: "bracelet",
    collection: "moonlit",
    stripePriceId: "price_1URq8DJFPFLF0cf3P2aDqPY3",
    stock: 2,
    name: "The Bluebell Bracelet",
    price: 50,
    image: "assets/bluebell-bracelet.jpg",
    summary: "Kyanite, moonstone and a crackled clear quartz on two fine strands.",
    description: "Like bluebells in a woodland clearing: deep-blue kyanite, soft moonstone and faceted crystal beads bloom along one strand, around a crackled clear quartz that catches the light like morning frost. A second fine chain sits alongside, with stainless steel hardware and a clear crystal sparkling at the clasp.",
    details: ["Kyanite", "Clear quartz", "Moonstone", "Stainless steel hardware"],
  },
  {
    id: "the-frost",
    type: "bracelet",
    collection: "moonlit",
    stripePriceId: "price_1URqBEJFPFLF0cf3qPr8W7Ht",
    stock: 1,
    name: "The Frost Bracelet",
    price: 60,
    image: "assets/frost-bracelet.jpg",
    summary: "Icy aquamarine and crackled clear quartz, like the first frost on a winter morning.",
    description: "The first frost of a winter morning: faceted aquamarine in pale sea-glass blue sits beside sparkling crystal and moonstone, around a crackled clear quartz that looks like ice holding the light, with stainless steel hardware and a clear crystal glinting at the clasp.",
    details: ["Aquamarine", "Clear quartz", "Moonstone", "Stainless steel hardware"],
  },
  {
    id: "the-lagoon",
    type: "bracelet",
    collection: "moonlit",
    stripePriceId: "price_1URqEmJFPFLF0cf3N7yry09Z",
    stock: 3,
    name: "The Lagoon Bracelet",
    price: 60,
    image: "assets/lagoon-bracelet.jpg",
    summary: "Sea-blue larimar and sparkling crystal, like sunlight in a hidden cove.",
    description: "A hidden cove where the water turns the brightest blue: larimar with soft white ripples, like light dancing on shallow water, is spaced along a fine chain between clear quartz, moonstone and faceted crystal, gathered by a woven chainmaille knot, with stainless steel hardware and a clear crystal sparkling at the clasp.",
    details: ["Processed larimar", "Clear quartz", "Moonstone", "Stainless steel hardware"],
  },
  {
    id: "the-coquette",
    type: "necklace",
    collection: "moonlit",
    stripePriceId: "price_1URqLVJFPFLF0cf3aW1jzA6D",
    stock: 1,
    oneOfAKind: true,
    name: "The Coquette Necklace",
    price: 118,
    image: "assets/coquette-necklace.jpg",
    images: ["assets/coquette-necklace.jpg", "assets/coquette-necklace-2.jpg"],
    summary: "A ribbon bow of labradorite, with two trailing tails that catch the light.",
    description: "Tied like a ribbon bow at the collarbone: labradorite chips loop into two soft swags and fall in two trailing tails finished with tiny crystal drops. Each stone hides a flash of blue that appears only when the light finds it, with stainless steel hardware.",
    details: ["Labradorite", "Ribbon bow design", "Stainless steel hardware"],
  },
  {
    id: "the-enchantress",
    type: "necklace",
    collection: "moonlit",
    stripePriceId: "price_1URqRbJFPFLF0cf3VSeGxtya",
    stock: 1,
    oneOfAKind: true,
    name: "The Enchantress Necklace",
    price: 128,
    image: "assets/enchantress-necklace.jpg",
    images: ["assets/enchantress-necklace.jpg", "assets/enchantress-necklace-2.jpg"],
    summary: "A moonstone teardrop in a halo, with tiers of chain and blue kyanite.",
    description: "A spell woven at the collarbone: a glowing moonstone teardrop in a sparkling halo hangs from a woven chainmaille knot, framed by tiers of fine chain strung with moonstone, deep-blue kyanite and crystal, and finished with a chainmaille point and a crystal drop, with stainless steel hardware.",
    details: ["Moonstone", "Kyanite", "Stainless steel hardware"],
  },
  {
    id: "the-muse",
    type: "necklace",
    collection: "moonlit",
    stripePriceId: "price_1URqTuJFPFLF0cf3xYmOXrVG",
    stock: 1,
    oneOfAKind: true,
    name: "The Muse Necklace",
    price: 118,
    image: "assets/muse-necklace.jpg",
    images: ["assets/muse-necklace.jpg", "assets/muse-necklace-2.jpg"],
    summary: "A glowing moonstone teardrop with draped chains and moonstone drops.",
    description: "The one who inspires, with a single glowing stone at her heart: a moonstone teardrop in a sparkling halo hangs from a bold curb chain, framed by soft swags of fine chain and little moonstone drops that sway like lanterns, with stainless steel hardware.",
    details: ["Moonstone", "Stainless steel hardware"],
  },
];

// Collections for "Shop by collection". Add one here, then set `collection: "<id>"`
// on its products. The collection filter only shows once at least one exists.
const COLLECTIONS = [
  { id: "moonlit", name: "Moonlit" },
];

// Product types for "Shop by type".
const TYPES = [
  { id: "necklace", name: "Necklaces" },
  { id: "bracelet", name: "Bracelets" },
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

if (typeof module !== "undefined") module.exports = { PRODUCTS, SHOP, COLLECTIONS, TYPES, maxPerCustomer };
