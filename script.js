const products = [
  { name: "Whisper Chain Necklace", price: 48, rating: 4.9, reviews: 312, tile: "--blush", icon: "necklace", badge: "Bestseller" },
  { name: "Keepsake Locket", price: 64, rating: 4.8, reviews: 198, tile: "--sage", icon: "locket" },
  { name: "Paperclip Bracelet", price: 38, rating: 4.7, reviews: 156, tile: "--lavender", icon: "bracelet", badge: "New" },
  { name: "Initial Charm", price: 28, rating: 5.0, reviews: 87, tile: "--butter", icon: "charm" },
];

const icons = {
  necklace: `<path d="M20 20 Q60 95 100 20" fill="none" stroke="var(--gold)" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round"/><circle cx="60" cy="68" r="7" fill="var(--gold)"/>`,
  locket: `<path d="M30 15 Q60 60 90 15" fill="none" stroke="var(--gold)" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round"/><ellipse cx="60" cy="62" rx="14" ry="17" fill="none" stroke="var(--gold)" stroke-width="4"/>`,
  bracelet: `<ellipse cx="60" cy="50" rx="38" ry="24" fill="none" stroke="var(--gold)" stroke-width="5" stroke-dasharray="10 4"/>`,
  charm: `<circle cx="60" cy="22" r="5" fill="none" stroke="var(--gold)" stroke-width="3"/><circle cx="60" cy="52" r="22" fill="var(--gold)"/><text x="60" y="60" text-anchor="middle" font-family="Fraunces, serif" font-size="22" fill="var(--cream)">S</text>`,
};

const grid = document.getElementById("product-grid");
grid.innerHTML = products.map((p, i) => `
  <article class="product">
    <a href="#" class="product-image" style="--tile: var(${p.tile})">
      ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
      <svg viewBox="0 0 120 100" aria-hidden="true">${icons[p.icon]}</svg>
    </a>
    <p class="stars">★★★★★ <span>${p.rating.toFixed(1)} (${p.reviews})</span></p>
    <h3>${p.name}</h3>
    <div class="product-row">
      <span class="price">$${p.price}</span>
      <button class="add-btn" data-index="${i}">Add to bag</button>
    </div>
  </article>
`).join("");

let cartCount = 0;
const cartCountEl = document.getElementById("cart-count");
grid.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-btn");
  if (!btn) return;
  cartCount += 1;
  cartCountEl.textContent = cartCount;
  btn.textContent = "Added ✓";
  btn.classList.add("added");
  setTimeout(() => {
    btn.textContent = "Add to bag";
    btn.classList.remove("added");
  }, 1200);
});

const toggle = document.querySelector(".menu-toggle");
const navLeft = document.querySelector(".nav-left");
toggle.addEventListener("click", () => {
  const open = navLeft.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});

document.getElementById("signup").addEventListener("submit", (e) => {
  e.preventDefault();
  e.target.reset();
  document.getElementById("form-msg").textContent = "You're on the list. Check your inbox for your code!";
});

document.getElementById("year").textContent = new Date().getFullYear();
