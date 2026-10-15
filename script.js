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

// Fireflies drifting through the enchanted sections.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.querySelectorAll(".enchanted").forEach((section) => {
  const canvas = document.createElement("canvas");
  canvas.className = "fireflies";
  canvas.setAttribute("aria-hidden", "true");
  section.prepend(canvas);
  const ctx = canvas.getContext("2d");
  let flies = [];

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = section.clientWidth * ratio;
    canvas.height = section.clientHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.round(section.clientWidth / 55);
    flies = Array.from({ length: count }, () => ({
      x: Math.random() * section.clientWidth,
      y: Math.random() * section.clientHeight,
      r: 0.8 + Math.random() * 1.8,
      dx: (Math.random() - 0.5) * 0.25,
      dy: -0.1 - Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function draw(t) {
    const w = section.clientWidth;
    const h = section.clientHeight;
    ctx.clearRect(0, 0, w, h);
    for (const f of flies) {
      const glow = 0.15 + 0.55 * Math.abs(Math.sin(t / 1100 + f.phase));
      const color = "236, 214, 160";
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 6);
      g.addColorStop(0, `rgba(${color}, ${glow})`);
      g.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 6, 0, Math.PI * 2);
      ctx.fill();
      if (!reduceMotion) {
        f.x += f.dx + Math.sin(t / 2000 + f.phase) * 0.15;
        f.y += f.dy;
        if (f.y < -10) { f.y = h + 10; f.x = Math.random() * w; }
        if (f.x < -10) f.x = w + 10;
        if (f.x > w + 10) f.x = -10;
      }
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
});
