(function () {
  "use strict";

  const PRODUCTS = window.PRODUCTS;
  const CART_KEY = "hh_cart";
  const ORDERS_KEY = "hh_orders";
  const FREE_SHIPPING_MIN = 50;
  const SHIPPING_FEE = 5.99;
  const TAX_RATE = 0.08;

  const app = document.getElementById("app");
  const cartCountEl = document.getElementById("cart-count");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const toastEl = document.getElementById("toast");

  const state = { query: "", category: "All", sort: "featured" };

  // ---------- Helpers ----------
  const money = (n) => "$" + n.toFixed(2);
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable: keep working in memory */
    }
  }

  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  function thumb(p, cls) {
    return `<div class="thumb ${cls || ""}" style="background:${p.color}"><span aria-hidden="true">${p.emoji}</span></div>`;
  }
  function stars(r) {
    return `<span class="stars" aria-label="Rated ${r} out of 5">★ ${r.toFixed(1)}</span>`;
  }

  // ---------- Cart ----------
  // Cart is stored as { [productId]: qty }
  let cart = load(CART_KEY, {});
  // Drop items that no longer exist in the catalog.
  Object.keys(cart).forEach((id) => { if (!byId(id)) delete cart[id]; });

  function cartLines() {
    return Object.entries(cart).map(([id, qty]) => ({ product: byId(id), qty }));
  }
  function cartCount() {
    return Object.values(cart).reduce((a, b) => a + b, 0);
  }
  function totals() {
    const subtotal = cartLines().reduce((s, l) => s + l.product.price * l.qty, 0);
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    return { subtotal, shipping, tax, total: subtotal + shipping + tax };
  }
  function setQty(id, qty) {
    const p = byId(id);
    if (!p) return;
    qty = Math.max(0, Math.min(qty, p.stock));
    if (qty === 0) delete cart[id];
    else cart[id] = qty;
    save(CART_KEY, cart);
    updateCartCount();
  }
  function addToCart(id, qty) {
    const p = byId(id);
    const current = cart[id] || 0;
    if (current + qty > p.stock) {
      toast(`Only ${p.stock} in stock`);
      qty = p.stock - current;
      if (qty <= 0) return;
    }
    setQty(id, current + qty);
    toast(`Added ${p.name} to cart`);
  }
  function updateCartCount() {
    const n = cartCount();
    cartCountEl.textContent = n;
    cartCountEl.hidden = n === 0;
  }

  // ---------- Views ----------
  function viewShop() {
    const categories = ["All", ...new Set(PRODUCTS.map((p) => p.category))];
    const q = state.query.trim().toLowerCase();
    let list = PRODUCTS.filter(
      (p) =>
        (state.category === "All" || p.category === state.category) &&
        (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    );
    const sorters = {
      featured: () => 0,
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    list = [...list].sort(sorters[state.sort]);

    const showHero = !q && state.category === "All";
    return `
      ${showHero ? `
      <section class="hero">
        <div>
          <h1>Small tools for better days.</h1>
          <p>Everyday goods that make good habits easier to keep. Free shipping on orders over ${money(FREE_SHIPPING_MIN)}.</p>
          <a href="#products" class="btn" data-scroll="products">Shop now</a>
        </div>
        <div class="hero-art" aria-hidden="true">🌱</div>
      </section>` : ""}
      <section id="products">
        <div class="toolbar">
          <div class="chips" role="group" aria-label="Filter by category">
            ${categories.map((c) => `<button class="chip ${c === state.category ? "active" : ""}" data-category="${esc(c)}" aria-pressed="${c === state.category}">${esc(c)}</button>`).join("")}
          </div>
          <label class="sort">Sort
            <select id="sort-select">
              ${[["featured", "Featured"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["rating", "Top rated"], ["name", "Name"]]
                .map(([v, l]) => `<option value="${v}" ${v === state.sort ? "selected" : ""}>${l}</option>`).join("")}
            </select>
          </label>
        </div>
        ${q ? `<p class="muted">${list.length} result${list.length === 1 ? "" : "s"} for “${esc(state.query)}” <button class="link" data-clear-search>Clear</button></p>` : ""}
        ${list.length ? `<div class="grid">${list.map(card).join("")}</div>` : `<div class="empty"><p>No products match your search.</p></div>`}
      </section>`;
  }

  function card(p) {
    const out = p.stock === 0;
    return `
      <article class="card">
        <a href="#/product/${p.id}" class="card-link">
          ${thumb(p)}
          <div class="card-body">
            <span class="muted small">${esc(p.category)}</span>
            <h3>${esc(p.name)}</h3>
            <div class="row">${stars(p.rating)}<strong>${money(p.price)}</strong></div>
          </div>
        </a>
        <button class="btn btn-block" data-add="${p.id}" ${out ? "disabled" : ""}>${out ? "Sold out" : "Add to cart"}</button>
      </article>`;
  }

  function viewProduct(id) {
    const p = byId(id);
    if (!p) return viewNotFound();
    const out = p.stock === 0;
    const related = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
    return `
      <nav class="crumbs"><a href="#/">Shop</a> / <span>${esc(p.category)}</span></nav>
      <section class="product">
        ${thumb(p, "thumb-lg")}
        <div class="product-info">
          <h1>${esc(p.name)}</h1>
          <div class="row">${stars(p.rating)}<span class="${out ? "danger" : p.stock < 15 ? "warn" : "ok"} small">${out ? "Out of stock" : p.stock < 15 ? `Only ${p.stock} left` : "In stock"}</span></div>
          <p class="price">${money(p.price)}</p>
          <p>${esc(p.description)}</p>
          <form id="add-form" class="add-form">
            <label>Qty <input type="number" id="qty" min="1" max="${p.stock}" value="1" ${out ? "disabled" : ""} /></label>
            <button class="btn" type="submit" ${out ? "disabled" : ""}>${out ? "Sold out" : "Add to cart"}</button>
          </form>
        </div>
      </section>
      ${related.length ? `<section><h2>You might also like</h2><div class="grid">${related.map(card).join("")}</div></section>` : ""}`;
  }

  function summary(t, withButton) {
    return `
      <aside class="summary">
        <h2>Order summary</h2>
        <dl>
          <div><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div>
          <div><dt>Shipping</dt><dd>${t.shipping === 0 ? "Free" : money(t.shipping)}</dd></div>
          <div><dt>Tax (${TAX_RATE * 100}%)</dt><dd>${money(t.tax)}</dd></div>
          <div class="total"><dt>Total</dt><dd>${money(t.total)}</dd></div>
        </dl>
        ${t.subtotal > 0 && t.subtotal < FREE_SHIPPING_MIN ? `<p class="small muted">Add ${money(FREE_SHIPPING_MIN - t.subtotal)} more for free shipping.</p>` : ""}
        ${withButton ? `<a href="#/checkout" class="btn btn-block">Checkout</a>` : ""}
      </aside>`;
  }

  function viewCart() {
    const lines = cartLines();
    if (!lines.length) {
      return `<div class="empty"><h1>Your cart is empty</h1><p><a href="#/" class="btn">Continue shopping</a></p></div>`;
    }
    return `
      <h1>Your cart</h1>
      <div class="two-col">
        <ul class="lines">
          ${lines.map(({ product: p, qty }) => `
            <li class="line">
              <a href="#/product/${p.id}">${thumb(p, "thumb-sm")}</a>
              <div class="line-info">
                <a href="#/product/${p.id}"><strong>${esc(p.name)}</strong></a>
                <span class="muted small">${money(p.price)} each</span>
                <button class="link danger small" data-remove="${p.id}">Remove</button>
              </div>
              <div class="stepper" aria-label="Quantity for ${esc(p.name)}">
                <button data-dec="${p.id}" aria-label="Decrease">−</button>
                <span>${qty}</span>
                <button data-inc="${p.id}" aria-label="Increase" ${qty >= p.stock ? "disabled" : ""}>+</button>
              </div>
              <strong class="line-total">${money(p.price * qty)}</strong>
            </li>`).join("")}
        </ul>
        ${summary(totals(), true)}
      </div>`;
  }

  function viewCheckout() {
    if (!cartCount()) { location.hash = "#/cart"; return ""; }
    const field = (id, label, attrs) =>
      `<label class="field">${label}<input id="${id}" name="${id}" ${attrs} /><span class="error" data-error-for="${id}"></span></label>`;
    return `
      <h1>Checkout</h1>
      <div class="two-col">
        <form id="checkout-form" novalidate>
          <fieldset>
            <legend>Contact</legend>
            ${field("name", "Full name", 'required autocomplete="name"')}
            ${field("email", "Email", 'type="email" required autocomplete="email"')}
          </fieldset>
          <fieldset>
            <legend>Shipping address</legend>
            ${field("address", "Street address", 'required autocomplete="street-address"')}
            <div class="field-row">
              ${field("city", "City", 'required autocomplete="address-level2"')}
              ${field("zip", "Postal code", 'required autocomplete="postal-code"')}
            </div>
            ${field("country", "Country", 'required autocomplete="country-name" value="United States"')}
          </fieldset>
          <fieldset>
            <legend>Payment <span class="muted small">(demo — use 4242 4242 4242 4242)</span></legend>
            ${field("card", "Card number", 'required inputmode="numeric" autocomplete="off" placeholder="4242 4242 4242 4242"')}
            <div class="field-row">
              ${field("exp", "Expiry (MM/YY)", 'required placeholder="12/29" autocomplete="off"')}
              ${field("cvc", "CVC", 'required inputmode="numeric" placeholder="123" autocomplete="off"')}
            </div>
          </fieldset>
          <button class="btn btn-block" type="submit">Place order · ${money(totals().total)}</button>
        </form>
        ${summary(totals(), false)}
      </div>`;
  }

  function validateCheckout(data) {
    const errors = {};
    ["name", "email", "address", "city", "zip", "country", "card", "exp", "cvc"].forEach((k) => {
      if (!data[k].trim()) errors[k] = "Required";
    });
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email";
    const digits = data.card.replace(/\s+/g, "");
    if (data.card && !luhn(digits)) errors.card = "Enter a valid card number";
    const m = data.exp.match(/^(\d{2})\s*\/\s*(\d{2})$/);
    if (data.exp) {
      if (!m || +m[1] < 1 || +m[1] > 12) errors.exp = "Use MM/YY";
      else {
        const now = new Date();
        const expEnd = new Date(2000 + +m[2], +m[1], 1); // first day after expiry month
        if (expEnd <= now) errors.exp = "Card has expired";
      }
    }
    if (data.cvc && !/^\d{3,4}$/.test(data.cvc)) errors.cvc = "3 or 4 digits";
    return errors;
  }

  function luhn(num) {
    if (!/^\d{12,19}$/.test(num)) return false;
    let sum = 0;
    for (let i = 0; i < num.length; i++) {
      let d = +num[num.length - 1 - i];
      if (i % 2) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    return sum % 10 === 0;
  }

  function placeOrder(data) {
    const t = totals();
    const order = {
      id: "HH-" + Date.now().toString(36).toUpperCase(),
      date: new Date().toISOString(),
      customer: { name: data.name, email: data.email },
      shipTo: { address: data.address, city: data.city, zip: data.zip, country: data.country },
      cardLast4: data.card.replace(/\s+/g, "").slice(-4),
      items: cartLines().map(({ product: p, qty }) => ({ id: p.id, name: p.name, price: p.price, qty })),
      ...t,
    };
    // Decrement stock locally (a real backend would do this server-side).
    order.items.forEach((i) => { byId(i.id).stock -= i.qty; });
    const orders = load(ORDERS_KEY, []);
    orders.push(order);
    save(ORDERS_KEY, orders);
    cart = {};
    save(CART_KEY, cart);
    updateCartCount();
    return order;
  }

  function viewOrder(id) {
    const order = load(ORDERS_KEY, []).find((o) => o.id === id);
    if (!order) return viewNotFound();
    return `
      <div class="confirm">
        <div class="check" aria-hidden="true">✓</div>
        <h1>Thank you, ${esc(order.customer.name.split(" ")[0])}!</h1>
        <p>Your order <strong>${esc(order.id)}</strong> has been placed. A confirmation would be sent to <strong>${esc(order.customer.email)}</strong>.</p>
        <ul class="order-items">
          ${order.items.map((i) => `<li><span>${i.qty} × ${esc(i.name)}</span><span>${money(i.price * i.qty)}</span></li>`).join("")}
          <li class="total"><span>Total paid (card •••• ${esc(order.cardLast4)})</span><span>${money(order.total)}</span></li>
        </ul>
        <p class="muted small">Shipping to ${esc(order.shipTo.address)}, ${esc(order.shipTo.city)} ${esc(order.shipTo.zip)}, ${esc(order.shipTo.country)}</p>
        <a href="#/" class="btn">Keep shopping</a>
      </div>`;
  }

  function viewNotFound() {
    return `<div class="empty"><h1>Page not found</h1><p><a href="#/" class="btn">Back to shop</a></p></div>`;
  }

  // ---------- Router ----------
  function route() {
    const hash = location.hash.replace(/^#/, "") || "/";
    const parts = hash.split("/").filter(Boolean);
    let html;
    if (parts.length === 0) html = viewShop();
    else if (parts[0] === "product") html = viewProduct(parts[1]);
    else if (parts[0] === "cart") html = viewCart();
    else if (parts[0] === "checkout") html = viewCheckout();
    else if (parts[0] === "order") html = viewOrder(parts[1]);
    else html = viewNotFound();
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }

  function rerender() {
    const y = window.scrollY;
    route();
    window.scrollTo(0, y);
  }

  // ---------- Events ----------
  app.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    const d = t.dataset;
    if (d.add) { addToCart(d.add, 1); }
    else if (d.category) { state.category = d.category; rerender(); }
    else if (d.inc) { setQty(d.inc, cart[d.inc] + 1); rerender(); }
    else if (d.dec) { setQty(d.dec, cart[d.dec] - 1); rerender(); }
    else if (d.remove) { setQty(d.remove, 0); toast("Item removed"); rerender(); }
    else if (d.scroll) { e.preventDefault(); document.getElementById(d.scroll).scrollIntoView({ behavior: "smooth" }); }
    else if ("clearSearch" in d) { state.query = ""; searchInput.value = ""; rerender(); }
  });

  app.addEventListener("change", (e) => {
    if (e.target.id === "sort-select") { state.sort = e.target.value; rerender(); }
  });

  app.addEventListener("submit", (e) => {
    e.preventDefault();
    if (e.target.id === "add-form") {
      const id = location.hash.split("/")[2];
      const qty = Math.max(1, parseInt(document.getElementById("qty").value, 10) || 1);
      addToCart(id, qty);
    } else if (e.target.id === "checkout-form") {
      const data = Object.fromEntries(new FormData(e.target).entries());
      const errors = validateCheckout(data);
      e.target.querySelectorAll("[data-error-for]").forEach((el) => {
        const msg = errors[el.dataset.errorFor] || "";
        el.textContent = msg;
        el.previousElementSibling.setAttribute("aria-invalid", msg ? "true" : "false");
      });
      const firstBad = Object.keys(errors)[0];
      if (firstBad) { document.getElementById(firstBad).focus(); return; }
      const order = placeOrder(data);
      location.hash = "#/order/" + order.id;
    }
  });

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    state.query = searchInput.value;
    state.category = "All";
    if (location.hash && location.hash !== "#/") location.hash = "#/";
    else route();
  });
  searchInput.addEventListener("input", () => {
    if (location.hash && location.hash !== "#/" && location.hash !== "#") return;
    state.query = searchInput.value;
    state.category = "All";
    rerender();
    searchInput.focus();
  });

  window.addEventListener("hashchange", route);
  window.addEventListener("storage", (e) => {
    if (e.key === CART_KEY) { cart = load(CART_KEY, {}); updateCartCount(); rerender(); }
  });

  document.getElementById("year").textContent = new Date().getFullYear();
  updateCartCount();
  route();
})();
