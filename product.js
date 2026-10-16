// Product page: shows the product named in the link (product.html#id).

function renderProduct() {
  const id = location.hash.slice(1);
  const product = PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];

  document.title = `${product.name} · Chainber of Secrets`;
  const img = document.getElementById("pdp-img");
  img.src = product.image;
  img.alt = product.name;
  document.getElementById("pdp-name").textContent = product.name;
  document.getElementById("pdp-price").textContent = formatPrice(product.price);
  document.getElementById("pdp-desc").textContent = product.description;
  document.getElementById("pdp-details").innerHTML = product.details.map((d) => `<li>${d}</li>`).join("");

  document.getElementById("pdp-buy").dataset.id = product.id;
  updateBuyButton();

  const others = PRODUCTS.filter((p) => p.id !== product.id);
  document.querySelector(".more").hidden = others.length === 0;
  document.getElementById("more-grid").innerHTML = others.map((p) => `
    <a href="product.html#${p.id}" class="product">
      <div class="product-image">
        ${(p.stock ?? 0) === 0 ? `<span class="badge">Sold out</span>` : ""}
        <img src="${p.image}" alt="${p.name}" loading="lazy" width="1200" height="1600">
      </div>
      <h3>${p.name}</h3>
      <p class="product-summary">${p.summary}</p>
      <p class="price">${formatPrice(p.price)}</p>
    </a>
  `).join("");

  window.scrollTo(0, 0);
}

function updateBuyButton() {
  const buy = document.getElementById("pdp-buy");
  const note = document.getElementById("pdp-note");
  const product = PRODUCTS.find((p) => p.id === buy.dataset.id);
  const inBag = Cart.qtyOf(product.id);
  const max = maxPerCustomer(product);
  const stock = Math.max(0, product.stock ?? 0);
  buy.disabled = false;
  if (stock === 0) {
    buy.textContent = "Sold out";
    buy.disabled = true;
    note.textContent = "This piece has found its home.";
  } else if (!Cart.canBuy(product)) {
    buy.textContent = "Coming soon";
    buy.disabled = true;
    note.textContent = "Checkout for this piece opens soon.";
  } else if (inBag >= max) {
    buy.textContent = "In your bag · View bag";
    note.textContent = product.oneOfAKind ? "One of a kind: only one available." : `That's the most available per order (${max}).`;
  } else {
    buy.textContent = inBag ? `Add another · ${inBag} in bag` : "Add to bag";
    note.textContent = product.oneOfAKind
      ? "One of a kind · Secure checkout with Stripe"
      : stock <= 3
        ? `Only ${stock} left · Secure checkout with Stripe`
        : "In stock · Secure checkout with Stripe";
  }
}

document.getElementById("pdp-buy").addEventListener("click", (e) => {
  const id = e.currentTarget.dataset.id;
  const product = PRODUCTS.find((p) => p.id === id);
  if (Cart.qtyOf(id) < maxPerCustomer(product)) Cart.add(id);
  window.openCart();
});
Cart.onChange(updateBuyButton);

renderProduct();
window.addEventListener("hashchange", renderProduct);
