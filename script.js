// Shared page behavior: product grid, mobile menu, newsletter form, footer year.

const grid = document.getElementById("product-grid");
if (grid) {
  grid.innerHTML = PRODUCTS.map((p) => `
    <a href="product.html#${p.id}" class="product">
      <div class="product-image">
        ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
        <img src="${p.image}" alt="${p.name}" loading="lazy" width="1200" height="1600">
      </div>
      <h3>${p.name}</h3>
      <p class="product-summary">${p.summary}</p>
      <p class="price">${formatPrice(p.price)}</p>
    </a>
  `).join("");
}

const toggle = document.querySelector(".menu-toggle");
const navLeft = document.querySelector(".nav-left");
toggle.addEventListener("click", () => {
  const open = navLeft.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});

const signup = document.getElementById("signup");
if (signup) {
  signup.addEventListener("submit", (e) => {
    e.preventDefault();
    e.target.reset();
    document.getElementById("form-msg").textContent = "You're on the list. Check your inbox for your code!";
  });
}

document.getElementById("year").textContent = new Date().getFullYear();
