// Shopping cart: kept in this browser, shown in a slide-out panel, and sent
// to /api/checkout which hands the customer over to Stripe Checkout.

const Cart = (() => {
  const STORAGE_KEY = "cos-cart";
  const listeners = [];

  function read() {
    try {
      const items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(items) ? items.filter((i) => PRODUCTS.some((p) => p.id === i.id)) : [];
    } catch {
      return [];
    }
  }

  function write(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
    listeners.forEach((fn) => fn(items));
  }

  const product = (id) => PRODUCTS.find((p) => p.id === id);
  const canBuy = (p) => p && !p.soldOut && p.stripePriceId && p.price != null;

  return {
    items: read,
    onChange: (fn) => listeners.push(fn),
    count: () => read().reduce((n, i) => n + i.qty, 0),
    subtotal: () => read().reduce((sum, i) => sum + (product(i.id)?.price || 0) * i.qty, 0),
    canBuy,
    qtyOf: (id) => read().find((i) => i.id === id)?.qty || 0,
    add(id) {
      const p = product(id);
      if (!canBuy(p)) return false;
      const items = read();
      const line = items.find((i) => i.id === id);
      const max = p.maxQty || 1;
      if (line) {
        if (line.qty >= max) return false;
        line.qty += 1;
      } else {
        items.push({ id, qty: 1 });
      }
      write(items);
      return true;
    },
    setQty(id, qty) {
      const p = product(id);
      const items = read()
        .map((i) => (i.id === id ? { ...i, qty: Math.min(Math.max(qty, 0), p?.maxQty || 1) } : i))
        .filter((i) => i.qty > 0);
      write(items);
    },
    clear: () => write([]),
  };
})();

// ---- Cart panel UI -------------------------------------------------------

(function setUpCartUI() {
  const navRight = document.querySelector(".nav-right");
  if (!navRight) return;

  const bagButton = document.createElement("button");
  bagButton.type = "button";
  bagButton.className = "bag-btn";
  bagButton.setAttribute("aria-haspopup", "dialog");
  bagButton.innerHTML = `Bag <span class="bag-count" aria-live="polite">0</span>`;
  navRight.appendChild(bagButton);

  const panel = document.createElement("div");
  panel.className = "cart";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="cart-backdrop" data-close></div>
    <aside class="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <header class="cart-head">
        <h2 id="cart-title">Your bag</h2>
        <button type="button" class="cart-close" data-close aria-label="Close bag">×</button>
      </header>
      <div class="cart-body"></div>
      <footer class="cart-foot">
        <p class="cart-shipping"></p>
        <div class="cart-total"><span>Subtotal</span><strong class="cart-subtotal">$0</strong></div>
        <button type="button" class="btn cart-checkout">Checkout</button>
        <p class="cart-error" role="alert"></p>
        <p class="cart-secure">Secure checkout with Stripe · Ships within Singapore</p>
      </footer>
    </aside>`;
  document.body.appendChild(panel);

  const body = panel.querySelector(".cart-body");
  const checkoutBtn = panel.querySelector(".cart-checkout");
  const errorEl = panel.querySelector(".cart-error");

  function shippingMessage(subtotal) {
    const { shippingFee, freeShippingOver } = SHOP;
    if (shippingFee == null || shippingFee === 0) return "Free shipping within Singapore.";
    if (freeShippingOver == null) return `Shipping: ${formatPrice(shippingFee)} within Singapore.`;
    if (subtotal >= freeShippingOver) return "You've unlocked free shipping.";
    return `Add ${formatPrice(freeShippingOver - subtotal)} more for free shipping.`;
  }

  function render() {
    const items = Cart.items();
    bagButton.querySelector(".bag-count").textContent = Cart.count();
    errorEl.textContent = "";
    if (items.length === 0) {
      body.innerHTML = `<p class="cart-empty">Your bag is empty.<br><a href="index.html#collection" data-close>Explore the collection</a></p>`;
      checkoutBtn.disabled = true;
    } else {
      body.innerHTML = items.map((i) => {
        const p = PRODUCTS.find((x) => x.id === i.id);
        const max = p.maxQty || 1;
        return `
          <div class="cart-line">
            <img src="${p.image}" alt="" width="72" height="96">
            <div class="cart-line-info">
              <a href="product.html#${p.id}" class="cart-line-name">${p.name}</a>
              <span class="cart-line-price">${formatPrice(p.price)}</span>
              <div class="cart-qty">
                ${max > 1 ? `
                  <button type="button" data-qty="${p.id}" data-delta="-1" aria-label="Fewer">−</button>
                  <span>${i.qty}</span>
                  <button type="button" data-qty="${p.id}" data-delta="1" aria-label="More" ${i.qty >= max ? "disabled" : ""}>+</button>
                ` : `<span class="cart-unique">One of a kind</span>`}
                <button type="button" class="cart-remove" data-remove="${p.id}">Remove</button>
              </div>
            </div>
          </div>`;
      }).join("");
      checkoutBtn.disabled = false;
    }
    const subtotal = Cart.subtotal();
    panel.querySelector(".cart-subtotal").textContent = formatPrice(subtotal);
    panel.querySelector(".cart-shipping").textContent = items.length ? shippingMessage(subtotal) : "";
  }

  function open() {
    render();
    panel.hidden = false;
    document.body.classList.add("cart-open");
    panel.querySelector(".cart-close").focus();
  }
  function close() {
    panel.hidden = true;
    document.body.classList.remove("cart-open");
    bagButton.focus();
  }

  bagButton.addEventListener("click", open);
  panel.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) close();
    const qtyBtn = e.target.closest("[data-qty]");
    if (qtyBtn) Cart.setQty(qtyBtn.dataset.qty, Cart.qtyOf(qtyBtn.dataset.qty) + Number(qtyBtn.dataset.delta));
    const removeBtn = e.target.closest("[data-remove]");
    if (removeBtn) Cart.setQty(removeBtn.dataset.remove, 0);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) close(); });

  checkoutBtn.addEventListener("click", async () => {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Opening checkout…";
    errorEl.textContent = "";
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: Cart.items() }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.url) throw new Error(data.error || "We couldn't start checkout. Please try again.");
      window.location.href = data.url;
    } catch (err) {
      errorEl.textContent = err.message;
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = "Checkout";
    }
  });

  Cart.onChange(render);
  window.addEventListener("storage", render);
  render();
  window.openCart = open;
})();
