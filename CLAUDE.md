# Chainber of Secrets website

Static site (HTML/CSS/JS, no build step) for a handmade chainmaille jewelry shop.
Hosted on Vercel at https://chainberofsecrets.com, auto-deployed from `main` on GitHub.

## Workflow
- Make changes on a `preview/<topic>` branch and push it; Vercel builds a preview URL.
- Nothing goes to `main` until the owner says "publish".
- On "publish": merge the preview branch into `main` and push to GitHub. Every
  published change must be committed and pushed to GitHub (that push is what deploys).
- Never commit secrets; payments use Stripe Payment Links stored in `products.js`.

## Where things live
- `products.js`: product catalog (name, price, image, materials, Stripe link).
- `index.html`, `product.html` (`product.html#<id>`), `our-story.html`.
- `styles.css`: base styles (baby pink palette), then the "Rose canopy" theme section.
- `assets/vines-back.webp`, `assets/vines-front.webp`: pre-rendered hanging vines (rose).
- `assets/logo-light.png`: soft white logo used on the pink header/hero/footer.
