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
- `api/stripe-webhook.js`: Stripe webhook (checkout.session.completed and
  checkout.session.async_payment_succeeded): counts stock down, then (only if
  `RESEND_API_KEY` is set) emails an order summary to chainberofsecrets@gmail.com.
  Needs `STRIPE_WEBHOOK_SECRET` in Vercel (never in the repo); the endpoint is
  https://chainberofsecrets.com/api/stripe-webhook.
- Inventory Google Sheet: `tools/inventory-sheet.gs` is an Apps Script pasted into the
  owner's sheet (not deployed; `.vercelignore` skips `tools/`). Tabs "Stock take" (from
  `/api/stock`, refreshed hourly and after each sale) and "Transactions". The webhook posts
  sales and Stripe-side stock edits (`product.updated`) via `api/_sheet.js` when
  `INVENTORY_SHEET_URL` and `INVENTORY_SHEET_TOKEN` are set in Vercel.
- Per product in `products.js`: `stripePriceId`, `stock` (starting number only),
  `oneOfAKind` (label + one per order), optional `maxPerOrder`.
- Live stock (`api/_stock.js`): the count lives in each Stripe product's `stock` metadata
  (falls back to `products.js` until set). The webhook lowers it after each paid order
  (skipping orders already counted, kept in `stock_orders` metadata); checkout re-checks it;
  `api/stock.js` serves it and `cart.js` applies it on every page ("stock-updated" event).
  Restock = edit the product's `stock` metadata in Stripe. The Stripe key needs Products: Write.
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
