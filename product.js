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

  const buy = document.getElementById("pdp-buy");
  const note = document.getElementById("pdp-note");
  if (product.stripeLink) {
    buy.href = product.stripeLink;
    buy.textContent = "Buy now";
    buy.removeAttribute("aria-disabled");
    note.textContent = "Secure checkout with Stripe";
  } else {
    buy.removeAttribute("href");
    buy.textContent = "Coming soon";
    buy.setAttribute("aria-disabled", "true");
    note.textContent = "Checkout for this piece opens soon.";
  }

  const others = PRODUCTS.filter((p) => p.id !== product.id);
  document.querySelector(".more").hidden = others.length === 0;
  document.getElementById("more-grid").innerHTML = others.map((p) => `
    <a href="product.html#${p.id}" class="product">
      <div class="product-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy" width="1200" height="1600">
      </div>
      <h3>${p.name}</h3>
      <p class="product-summary">${p.summary}</p>
      <p class="price">${formatPrice(p.price)}</p>
    </a>
  `).join("");

  window.scrollTo(0, 0);
}

renderProduct();
window.addEventListener("hashchange", renderProduct);
