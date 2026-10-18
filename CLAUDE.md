# Chainber of Secrets website

Static site (HTML/CSS/JS, no build step) for a handmade chainmaille jewelry shop.
Hosted on Vercel at https://chainberofsecrets.com, auto-deployed from `main` on GitHub.

## Workflow
- Make changes on a `preview/<topic>` branch and push it; Vercel builds a preview URL.
- Nothing goes to `main` until the owner says "publish".
- On "publish": merge the preview branch into `main` and push to GitHub. Every
  published change must be committed and pushed to GitHub (that push is what deploys).
- Never commit secrets. The Stripe secret key lives only in Vercel as the
  `STRIPE_SECRET_KEY` environment variable.

## Cart and checkout
- `cart.js`: cart kept in the browser (localStorage), slide-out "Bag" panel.
- `api/checkout.js`: Vercel serverless function that validates the cart against
  `products.js`, reads real prices from Stripe by `stripePriceId`, applies the
  shipping rule in `SHOP`, and creates a Stripe Checkout Session (SGD, Singapore only).
- `success.html`: thank-you page after payment; clears the cart.
- Per product in `products.js`: `stripePriceId`, `stock` (0 = sold out; update by hand after
  sales), `oneOfAKind` (label + one per order), optional `maxPerOrder`.
- Shop filters on the homepage: each product has `type` (necklace/bracelet) and optional
  `collection` (an id from `COLLECTIONS` in `products.js`). Filters live in the URL,
  e.g. `index.html?type=necklace#collection`. The collection row appears once a collection exists.

## Where things live
- `products.js`: product catalog (name, price, image, materials, Stripe link).
- `index.html`, `product.html` (`product.html#<id>`), `our-story.html`, `jewellery-care.html`,
  `shipping.html`, `returns.html` (policy pages; keep fees in sync with `SHOP`).
- `styles.css`: base styles (baby pink palette), then the "Rose canopy" theme section.
- `assets/vines-back.webp`, `assets/vines-front.webp`: pre-rendered hanging vines (rose).
- `assets/logo-light.png`: white logo used on the pink header/hero/footer.
