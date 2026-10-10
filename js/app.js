(function () {
  "use strict";

  const STORE = window.STORE;
  const PRODUCTS = window.PRODUCTS;
  const CART_KEY = "store_cart";
  const ORDERS_KEY = "store_orders";
  const RUO_KEY = "store_ruo_ok";

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
  const minPrice = (p) => Math.min(...p.variants.map((v) => v.price));
  const totalStock = (p) => p.variants.reduce((s, v) => s + v.stock, 0);
  const categories = () => [...new Set(PRODUCTS.map((p) => p.category))];

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

  // Product art: an SVG vial with a coloured cap and printed label.
  function vial(p, size, cls) {
    const label = size || p.variants[0].size;
    const name = p.label || p.name;
    return `
      <div class="vial-wrap ${cls || ""}" style="--cap:${p.cap}">
        <svg viewBox="0 0 120 160" class="vial" role="img" aria-label="${esc(p.name)} ${esc(label)} vial">
          <rect x="38" y="6" width="44" height="22" rx="4" fill="${p.cap}"/>
          <rect x="34" y="26" width="52" height="8" rx="2" fill="#c7ccd4"/>
          <path d="M40 34h40v6c8 2 12 6 12 14v86a12 12 0 0 1-12 12H40a12 12 0 0 1-12-12V54c0-8 4-12 12-14z" fill="#f8fafc" stroke="#d6dbe3" stroke-width="2"/>
          <rect x="30" y="74" width="60" height="56" fill="#fff"/>
          <rect x="30" y="74" width="60" height="9" fill="${p.cap}"/>
          <text x="60" y="100" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="${name.length > 12 ? 7 : 9.5}" font-weight="800" fill="#0b1f3a">${esc(name)}</text>
          <text x="60" y="114" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="8" font-weight="600" fill="#475569">${esc(label)}</text>
          <text x="60" y="125" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="5" fill="#94a3b8">RESEARCH USE ONLY</text>
          <rect x="34" y="136" width="52" height="10" rx="3" fill="#e9edf3"/>
        </svg>
      </div>`;
  }

  function stars(p) {
    return `<span class="stars" aria-label="Rated ${p.rating} out of 5 from ${p.reviews} reviews">★★★★★ <span class="muted">${p.rating.toFixed(1)} (${p.reviews})</span></span>`;
  }

  // ---------- Cart ----------
  // Cart is stored as { "productId|variantIndex": qty }
  let cart = load(CART_KEY, {});
  const parseKey = (k) => { const [id, vi] = k.split("|"); return { product: byId(id), variant: byId(id) && byId(id).variants[+vi] }; };
  Object.keys(cart).forEach((k) => { if (!parseKey(k).variant) delete cart[k]; });

  function cartLines() {
    return Object.entries(cart).map(([key, qty]) => ({ key, qty, ...parseKey(key) }));
  }
  function cartCount() {
    return Object.values(cart).reduce((a, b) => a + b, 0);
  }
  function totals(method) {
    const subtotal = cartLines().reduce((s, l) => s + l.variant.price * l.qty, 0);
    const opt = STORE.shipping[method || "standard"];
    const freeStandard = subtotal >= STORE.freeShippingMin;
    let shipping = subtotal === 0 ? 0 : opt.price;
    if (freeStandard) shipping = method === "express" ? opt.price - STORE.shipping.standard.price : 0;
    const total = subtotal + shipping;
    const gst = total - total / (1 + STORE.gstRate);
    return { subtotal, shipping, gst, total, method: method || "standard" };
  }
  function setQty(key, qty) {
    const { variant } = parseKey(key);
    if (!variant) return;
    qty = Math.max(0, Math.min(qty, variant.stock));
    if (qty === 0) delete cart[key];
    else cart[key] = qty;
    save(CART_KEY, cart);
    updateCartCount();
  }
  function addToCart(id, vi, qty) {
    const p = byId(id);
    const v = p.variants[vi];
    const key = id + "|" + vi;
    const current = cart[key] || 0;
    if (current + qty > v.stock) {
      toast(`Only ${v.stock} in stock`);
      qty = v.stock - current;
      if (qty <= 0) return;
    }
    setQty(key, current + qty);
    toast(`Added ${p.name} ${v.size} to cart`);
  }
  function updateCartCount() {
    const n = cartCount();
    cartCountEl.textContent = n;
    cartCountEl.hidden = n === 0;
  }

  // ---------- Shared sections ----------
  const ICONS = {
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
    truck: '<path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/>',
  };
  const icon = (name) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  function trustStrip() {
    const items = [
      ["flask", "≥99% purity", "Verified by HPLC & mass spec"],
      ["file", "COA every batch", "Independent third-party lab"],
      ["truck", "Same-day dispatch", `Order before ${STORE.dispatchCutoff}`],
      ["pin", "Australian stock", "Shipped from within Australia"],
    ];
    return `<section class="trust"><div class="container trust-grid">
      ${items.map(([i, t, s]) => `<div class="trust-item"><span class="trust-icon">${icon(i)}</span><div><strong>${t}</strong><span>${s}</span></div></div>`).join("")}
    </div></section>`;
  }

  function labTestingSection() {
    const p = byId("bpc-157");
    return `
      <section class="lab container" id="lab-testing">
        <div class="lab-copy">
          <span class="eyebrow">Quality assurance</span>
          <h2>Every batch independently tested</h2>
          <p class="muted">We don't rely on manufacturer paperwork. Each batch is sent to an independent analytical laboratory for identity, purity and quantity testing before it's listed for sale.</p>
          <ul class="ticks">
            <li><strong>HPLC purity analysis:</strong> confirms purity of ≥99%.</li>
            <li><strong>Mass spectrometry:</strong> confirms molecular identity.</li>
            <li><strong>Net content check:</strong> confirms the labelled mg per vial.</li>
            <li><strong>Batch-matched COAs:</strong> the batch number on your vial matches its certificate.</li>
          </ul>
        </div>
        <div class="coa" aria-label="Sample certificate of analysis">
          <div class="coa-head"><span>${icon("file")} Certificate of Analysis</span><span class="badge">PASS</span></div>
          <table>
            <tr><th>Compound</th><td>${esc(p.name)}</td></tr>
            <tr><th>Batch</th><td>AL-${new Date().getFullYear()}-0412</td></tr>
            <tr><th>Labelled content</th><td>10 mg</td></tr>
            <tr><th>Measured content</th><td>10.21 mg</td></tr>
            <tr><th>Purity (HPLC)</th><td>${p.purity}%</td></tr>
            <tr><th>Identity (MS)</th><td>Conforms</td></tr>
            <tr><th>Appearance</th><td>White lyophilised powder</td></tr>
          </table>
          <div class="purity-bar"><span style="width:${p.purity}%"></span></div>
          <p class="small muted">Sample shown for illustration. Replace with your lab's real certificates.</p>
        </div>
      </section>`;
  }

  const FAQS = [
    ["Are your products for human use?", "No. All products are sold strictly for in-vitro laboratory research. They are not for human or animal consumption, and we cannot give advice on dosing or personal use."],
    ["How fast is shipping?", `Orders placed before ${STORE.dispatchCutoff} on business days are dispatched the same day from within Australia. Standard post takes 3–6 business days and Express takes 1–3. Standard shipping is free on orders over ${money(STORE.freeShippingMin)}.`],
    ["How do I know what's in the vial?", "Every batch is tested by an independent analytical lab for purity (HPLC), identity (mass spectrometry) and net content. The certificate of analysis matches the batch number printed on your vial."],
    ["What form do the products come in?", "Peptides are supplied as lyophilised (freeze-dried) powder in sealed glass vials. For maximum stability, store them at −20°C away from light."],
    ["Which payment methods do you accept?", "Visa, Mastercard, PayID and direct bank transfer. Bank transfer and PayID orders are dispatched once payment has cleared."],
    ["Do you ship outside Australia?", "Not at the moment. We only ship to Australian addresses."],
  ];
  function faqSection() {
    return `
      <section class="faq container" id="faq">
        <span class="eyebrow">Support</span>
        <h2>Frequently asked questions</h2>
        <div class="faq-list">
          ${FAQS.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}
        </div>
      </section>`;
  }

  function card(p) {
    const out = totalStock(p) === 0;
    return `
      <article class="card">
        <a href="#/product/${p.id}" class="card-link">
          <div class="card-media">
            ${vial(p)}
            <span class="pill pill-purity">${p.purity}% purity</span>
            ${p.bestseller ? `<span class="pill pill-hot">Best seller</span>` : ""}
          </div>
          <div class="card-body">
            <span class="eyebrow small">${esc(p.category)}</span>
            <h3>${esc(p.name)}</h3>
            ${stars(p)}
            <div class="sizes">${p.variants.map((v) => `<span class="size ${v.stock ? "" : "size-out"}">${esc(v.size)}</span>`).join("")}</div>
            <p class="from">${p.variants.length > 1 ? "From " : ""}<strong>${money(minPrice(p))}</strong></p>
          </div>
        </a>
        ${out
          ? `<button class="btn btn-block btn-muted" disabled>Sold out</button>`
          : p.variants.length > 1
            ? `<a class="btn btn-block" href="#/product/${p.id}">Select size</a>`
            : `<button class="btn btn-block" data-add="${p.id}">Add to cart</button>`}
      </article>`;
  }

  // ---------- Views ----------
  function viewHome() {
    const best = PRODUCTS.filter((p) => p.bestseller);
    return `
      <section class="hero">
        <div class="container hero-inner">
          <div class="hero-copy">
            <span class="hero-tag">${icon("shield")} Independently lab tested</span>
            <h1>Australian research peptides you can verify.</h1>
            <p>High-purity compounds with a batch-matched certificate of analysis on every order, dispatched the same day from within Australia.</p>
            <div class="hero-ctas">
              <a href="#/shop" class="btn btn-lg">Shop peptides</a>
              <a href="#/lab-testing" class="btn btn-lg btn-ghost">View lab testing</a>
            </div>
            <dl class="hero-stats">
              <div><dt>≥99%</dt><dd>HPLC purity</dd></div>
              <div><dt>2pm</dt><dd>Same-day cutoff</dd></div>
              <div><dt>100%</dt><dd>Batches tested</dd></div>
            </dl>
          </div>
          <div class="hero-art" aria-hidden="true">
            ${vial(byId("tb-500"), "10mg", "hero-vial v1")}
            ${vial(byId("bpc-157"), "10mg", "hero-vial v2")}
            ${vial(byId("ghk-cu"), "50mg", "hero-vial v3")}
          </div>
        </div>
      </section>
      ${trustStrip()}
      <section class="container section">
        <div class="section-head">
          <div><span class="eyebrow">Browse</span><h2>Shop by category</h2></div>
        </div>
        <div class="cat-grid">
          ${categories().map((c) => {
            const items = PRODUCTS.filter((p) => p.category === c);
            return `<a class="cat" href="#/shop" data-goto-category="${esc(c)}" style="--cap:${items[0].cap}">
              <span class="cat-dot"></span><strong>${esc(c)}</strong><span class="muted small">${items.length} product${items.length === 1 ? "" : "s"}</span></a>`;
          }).join("")}
        </div>
      </section>
      <section class="container section">
        <div class="section-head">
          <div><span class="eyebrow">Most popular</span><h2>Best sellers</h2></div>
          <a href="#/shop" class="link-arrow">Shop all →</a>
        </div>
        <div class="grid">${best.map(card).join("")}</div>
      </section>
      <div class="band">${labTestingSection()}</div>
      <section class="container section">
        <div class="section-head"><div><span class="eyebrow">Simple</span><h2>How ordering works</h2></div></div>
        <ol class="steps">
          <li><span class="step-icon">${icon("box")}</span><strong>Place your order</strong><span class="muted">Pay by card, PayID or bank transfer.</span></li>
          <li><span class="step-icon">${icon("truck")}</span><strong>Same-day dispatch</strong><span class="muted">Ordered before ${STORE.dispatchCutoff}? It leaves today.</span></li>
          <li><span class="step-icon">${icon("file")}</span><strong>Tracked delivery + COA</strong><span class="muted">Tracking emailed, COA matched to your batch.</span></li>
        </ol>
      </section>
      ${faqSection()}`;
  }

  function viewShop() {
    const cats = ["All", ...categories()];
    const q = state.query.trim().toLowerCase();
    let list = PRODUCTS.filter(
      (p) =>
        (state.category === "All" || p.category === state.category) &&
        (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    );
    const sorters = {
      featured: (a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0),
      "price-asc": (a, b) => minPrice(a) - minPrice(b),
      "price-desc": (a, b) => minPrice(b) - minPrice(a),
      rating: (a, b) => b.rating - a.rating,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    list = [...list].sort(sorters[state.sort]);
    return `
      <section class="page-head"><div class="container">
        <nav class="crumbs"><a href="#/">Home</a> / <span>Shop</span></nav>
        <h1>${state.category === "All" ? "All research peptides" : esc(state.category)}</h1>
        <p class="muted">Every product is third-party tested and shipped from Australia.</p>
      </div></section>
      <section class="container section-tight">
        <div class="toolbar">
          <div class="chips" role="group" aria-label="Filter by category">
            ${cats.map((c) => `<button class="chip ${c === state.category ? "active" : ""}" data-category="${esc(c)}" aria-pressed="${c === state.category}">${esc(c)}</button>`).join("")}
          </div>
          <label class="sort">Sort
            <select id="sort-select">
              ${[["featured", "Featured"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["rating", "Top rated"], ["name", "Name A–Z"]]
                .map(([v, l]) => `<option value="${v}" ${v === state.sort ? "selected" : ""}>${l}</option>`).join("")}
            </select>
          </label>
        </div>
        ${q ? `<p class="muted">${list.length} result${list.length === 1 ? "" : "s"} for “${esc(state.query)}” <button class="link" data-clear-search>Clear</button></p>` : ""}
        ${list.length ? `<div class="grid">${list.map(card).join("")}</div>` : `<div class="empty"><p>No products match your search.</p></div>`}
      </section>`;
  }

  function viewProduct(id) {
    const p = byId(id);
    if (!p) return viewNotFound();
    let vi = p.variants.findIndex((v) => v.stock > 0);
    if (vi < 0) vi = 0;
    const related = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
    return `
      <div class="container section-tight">
        <nav class="crumbs"><a href="#/">Home</a> / <a href="#/shop" data-goto-category="${esc(p.category)}">${esc(p.category)}</a> / <span>${esc(p.name)}</span></nav>
        <section class="product" data-product="${p.id}">
          <div class="product-media">
            ${vial(p, p.variants[vi].size, "vial-lg")}
            <span class="pill pill-purity">${p.purity}% purity</span>
          </div>
          <div class="product-info">
            <span class="eyebrow">${esc(p.category)}</span>
            <h1>${esc(p.name)}</h1>
            ${stars(p)}
            <p class="price" id="price">${money(p.variants[vi].price)}</p>
            <p class="muted small" id="stock-note"></p>
            <p>${esc(p.description)}</p>
            <form id="add-form" class="add-form">
              <fieldset class="variant-picker">
                <legend>Size</legend>
                ${p.variants.map((v, i) => `
                  <label class="variant ${v.stock ? "" : "variant-out"}">
                    <input type="radio" name="variant" value="${i}" ${i === vi ? "checked" : ""} ${v.stock ? "" : "disabled"} />
                    <span>${esc(v.size)}<small>${v.stock ? money(v.price) : "Sold out"}</small></span>
                  </label>`).join("")}
              </fieldset>
              <div class="add-row">
                <label class="qty">Qty <input type="number" id="qty" min="1" value="1" /></label>
                <button class="btn btn-lg" type="submit" id="add-btn">Add to cart</button>
              </div>
            </form>
            <ul class="product-perks">
              <li>${icon("truck")} Dispatched today if ordered before ${STORE.dispatchCutoff}</li>
              <li>${icon("file")} Batch-matched certificate of analysis</li>
              <li>${icon("shield")} Secure checkout</li>
            </ul>
            <table class="specs">
              <tr><th>Form</th><td>Lyophilised powder, sealed glass vial</td></tr>
              <tr><th>Purity</th><td>${p.purity}% (HPLC)</td></tr>
              <tr><th>Identity</th><td>Confirmed by mass spectrometry</td></tr>
              <tr><th>Storage</th><td>−20°C, protected from light</td></tr>
              <tr><th>Intended use</th><td>In-vitro laboratory research only</td></tr>
            </table>
            <p class="ruo-note">Not for human or animal consumption. Sold for research purposes only.</p>
          </div>
        </section>
        ${related.length ? `<section class="section"><div class="section-head"><h2>Related research compounds</h2></div><div class="grid">${related.map(card).join("")}</div></section>` : ""}
      </div>`;
  }

  // Keep the product page's price, vial label and stock note in sync with the chosen size.
  function syncVariant() {
    const root = app.querySelector("[data-product]");
    if (!root) return;
    const p = byId(root.dataset.product);
    const checked = root.querySelector('input[name="variant"]:checked');
    const v = p.variants[checked ? +checked.value : 0];
    document.getElementById("price").textContent = money(v.price);
    root.querySelector(".product-media .vial-wrap").outerHTML = vial(p, v.size, "vial-lg");
    const note = document.getElementById("stock-note");
    note.className = "small " + (v.stock === 0 ? "danger" : v.stock < 15 ? "warn" : "ok");
    note.textContent = v.stock === 0 ? "Out of stock" : v.stock < 15 ? `Low stock — only ${v.stock} left` : "In stock, ready to dispatch";
    const qty = document.getElementById("qty");
    qty.max = v.stock;
    qty.disabled = v.stock === 0;
    const btn = document.getElementById("add-btn");
    btn.disabled = v.stock === 0;
    btn.textContent = v.stock === 0 ? "Sold out" : "Add to cart";
  }

  function summary(t, withButton) {
    return `
      <aside class="summary">
        <h2>Order summary</h2>
        <dl>
          <div><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div>
          <div><dt>Shipping${withButton ? " (standard)" : ""}</dt><dd>${t.shipping === 0 ? "Free" : money(t.shipping)}</dd></div>
          <div class="total"><dt>Total <small>${STORE.currency}</small></dt><dd>${money(t.total)}</dd></div>
          <div class="gst"><dt>Includes GST</dt><dd>${money(t.gst)}</dd></div>
        </dl>
        ${t.subtotal > 0 && t.subtotal < STORE.freeShippingMin
          ? `<div class="ship-progress"><p class="small">Add <strong>${money(STORE.freeShippingMin - t.subtotal)}</strong> more for free shipping</p><div class="purity-bar"><span style="width:${(t.subtotal / STORE.freeShippingMin) * 100}%"></span></div></div>`
          : t.subtotal > 0 ? `<p class="small ok">✓ You've unlocked free standard shipping</p>` : ""}
        ${withButton ? `<a href="#/checkout" class="btn btn-lg btn-block">Secure checkout</a>` : ""}
      </aside>`;
  }

  function viewCart() {
    const lines = cartLines();
    if (!lines.length) {
      return `<div class="container empty"><h1>Your cart is empty</h1><p class="muted">Browse our independently tested research peptides.</p><p><a href="#/shop" class="btn btn-lg">Shop peptides</a></p></div>`;
    }
    return `
      <div class="container section-tight">
        <h1>Your cart</h1>
        <div class="two-col">
          <ul class="lines">
            ${lines.map(({ key, product: p, variant: v, qty }) => `
              <li class="line">
                <a href="#/product/${p.id}" class="line-thumb">${vial(p, v.size)}</a>
                <div class="line-info">
                  <a href="#/product/${p.id}"><strong>${esc(p.name)}</strong></a>
                  <span class="muted small">${esc(v.size)} · ${money(v.price)} each</span>
                  <button class="link danger small" data-remove="${key}">Remove</button>
                </div>
                <div class="stepper" aria-label="Quantity for ${esc(p.name)} ${esc(v.size)}">
                  <button data-dec="${key}" aria-label="Decrease">−</button>
                  <span>${qty}</span>
                  <button data-inc="${key}" aria-label="Increase" ${qty >= v.stock ? "disabled" : ""}>+</button>
                </div>
                <strong class="line-total">${money(v.price * qty)}</strong>
              </li>`).join("")}
          </ul>
          ${summary(totals(), true)}
        </div>
      </div>`;
  }

  const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
  let checkoutShipping = "standard";

  function viewCheckout() {
    if (!cartCount()) { location.hash = "#/cart"; return ""; }
    const field = (id, label, attrs) =>
      `<label class="field">${label}<input id="${id}" name="${id}" ${attrs} /><span class="error" data-error-for="${id}"></span></label>`;
    const t = totals(checkoutShipping);
    return `
      <div class="container section-tight">
        <nav class="crumbs"><a href="#/cart">Cart</a> / <span>Checkout</span></nav>
        <h1>Checkout</h1>
        <div class="two-col">
          <form id="checkout-form" novalidate>
            <fieldset class="panel">
              <legend>Contact</legend>
              ${field("name", "Full name", 'required autocomplete="name"')}
              <div class="field-row">
                ${field("email", "Email", 'type="email" required autocomplete="email"')}
                ${field("phone", "Mobile", 'type="tel" required autocomplete="tel" placeholder="04xx xxx xxx"')}
              </div>
            </fieldset>
            <fieldset class="panel">
              <legend>Shipping address (Australia only)</legend>
              ${field("address", "Street address", 'required autocomplete="street-address"')}
              <div class="field-row three">
                ${field("suburb", "Suburb", 'required autocomplete="address-level2"')}
                <label class="field">State<select id="state" name="state" required autocomplete="address-level1"><option value="">Select…</option>${STATES.map((s) => `<option>${s}</option>`).join("")}</select><span class="error" data-error-for="state"></span></label>
                ${field("postcode", "Postcode", 'required inputmode="numeric" maxlength="4" autocomplete="postal-code"')}
              </div>
            </fieldset>
            <fieldset class="panel">
              <legend>Delivery</legend>
              ${Object.entries(STORE.shipping).map(([k, o]) => {
                const price = totals(k).shipping;
                return `<label class="option"><input type="radio" name="shipping" value="${k}" ${k === checkoutShipping ? "checked" : ""} /><span>${esc(o.label)}</span><strong>${price === 0 ? "Free" : money(price)}</strong></label>`;
              }).join("")}
            </fieldset>
            <fieldset class="panel">
              <legend>Payment</legend>
              <label class="option"><input type="radio" name="payment" value="card" checked /><span>Credit / debit card</span><span class="muted small">Visa · Mastercard</span></label>
              <label class="option"><input type="radio" name="payment" value="bank" /><span>PayID / bank transfer</span><span class="muted small">Dispatched once cleared</span></label>
              <div id="card-fields">
                <p class="muted small">Demo only. Use test card 4242 4242 4242 4242.</p>
                ${field("card", "Card number", 'inputmode="numeric" autocomplete="off" placeholder="4242 4242 4242 4242"')}
                <div class="field-row">
                  ${field("exp", "Expiry (MM/YY)", 'placeholder="12/29" autocomplete="off"')}
                  ${field("cvc", "CVC", 'inputmode="numeric" placeholder="123" autocomplete="off"')}
                </div>
              </div>
            </fieldset>
            <label class="check-row"><input type="checkbox" name="ruo" id="ruo" /> I confirm I am 18+ and that these products are purchased for laboratory research only, not for human or animal consumption.</label>
            <span class="error" data-error-for="ruo"></span>
            <button class="btn btn-lg btn-block" type="submit">Place order · ${money(t.total)}</button>
          </form>
          ${summary(t, false)}
        </div>
      </div>`;
  }

  function validateCheckout(data) {
    const errors = {};
    ["name", "email", "phone", "address", "suburb", "state", "postcode"].forEach((k) => {
      if (!(data[k] || "").trim()) errors[k] = "Required";
    });
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email";
    if (data.phone && !/^(\+?61|0)[2-478]\d{8}$/.test(data.phone.replace(/[\s()-]/g, ""))) errors.phone = "Enter an Australian number";
    if (data.postcode && !/^\d{4}$/.test(data.postcode)) errors.postcode = "4-digit postcode";
    if (data.payment === "card") {
      ["card", "exp", "cvc"].forEach((k) => { if (!(data[k] || "").trim()) errors[k] = "Required"; });
      const digits = (data.card || "").replace(/\s+/g, "");
      if (data.card && !luhn(digits)) errors.card = "Enter a valid card number";
      const m = (data.exp || "").match(/^(\d{2})\s*\/\s*(\d{2})$/);
      if (data.exp) {
        if (!m || +m[1] < 1 || +m[1] > 12) errors.exp = "Use MM/YY";
        else if (new Date(2000 + +m[2], +m[1], 1) <= new Date()) errors.exp = "Card has expired";
      }
      if (data.cvc && !/^\d{3,4}$/.test(data.cvc)) errors.cvc = "3 or 4 digits";
    }
    if (!data.ruo) errors.ruo = "Please confirm to continue";
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
    const t = totals(data.shipping);
    const order = {
      id: "AL-" + Date.now().toString(36).toUpperCase(),
      date: new Date().toISOString(),
      customer: { name: data.name, email: data.email, phone: data.phone },
      shipTo: { address: data.address, suburb: data.suburb, state: data.state, postcode: data.postcode },
      payment: data.payment,
      cardLast4: data.payment === "card" ? data.card.replace(/\s+/g, "").slice(-4) : null,
      items: cartLines().map(({ product: p, variant: v, qty }) => ({ id: p.id, name: p.name, size: v.size, price: v.price, qty })),
      ...t,
    };
    // Decrement stock locally (a real backend would do this server-side).
    cartLines().forEach(({ variant, qty }) => { variant.stock -= qty; });
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
    const bank = order.payment === "bank";
    return `
      <div class="container confirm">
        <div class="check" aria-hidden="true">✓</div>
        <h1>Thank you, ${esc(order.customer.name.split(" ")[0])}!</h1>
        <p>Order <strong>${esc(order.id)}</strong> has been received. A confirmation would be sent to <strong>${esc(order.customer.email)}</strong>.</p>
        ${bank ? `
          <div class="panel bank">
            <h2>Complete your payment</h2>
            <p class="muted small">Your order will be dispatched once payment has cleared. Use your order number as the reference.</p>
            <table class="specs">
              <tr><th>PayID</th><td>payments@example.com</td></tr>
              <tr><th>Account name</th><td>Your Business Pty Ltd</td></tr>
              <tr><th>BSB / Account</th><td>000-000 / 00000000</td></tr>
              <tr><th>Reference</th><td>${esc(order.id)}</td></tr>
              <tr><th>Amount</th><td>${money(order.total)}</td></tr>
            </table>
          </div>` : ""}
        <ul class="order-items">
          ${order.items.map((i) => `<li><span>${i.qty} × ${esc(i.name)} ${esc(i.size)}</span><span>${money(i.price * i.qty)}</span></li>`).join("")}
          <li><span>Shipping (${esc(order.method)})</span><span>${order.shipping === 0 ? "Free" : money(order.shipping)}</span></li>
          <li class="total"><span>${bank ? "Amount due" : `Total paid (card •••• ${esc(order.cardLast4)})`}</span><span>${money(order.total)}</span></li>
        </ul>
        <p class="muted small">Shipping to ${esc(order.shipTo.address)}, ${esc(order.shipTo.suburb)} ${esc(order.shipTo.state)} ${esc(order.shipTo.postcode)}</p>
        <a href="#/shop" class="btn btn-lg">Continue shopping</a>
      </div>`;
  }

  function viewNotFound() {
    return `<div class="container empty"><h1>Page not found</h1><p><a href="#/" class="btn">Back to home</a></p></div>`;
  }

  // ---------- Router ----------
  function route() {
    const hash = location.hash.replace(/^#/, "") || "/";
    const parts = hash.split("/").filter(Boolean);
    let html;
    if (parts.length === 0) html = viewHome();
    else if (parts[0] === "shop") html = viewShop();
    else if (parts[0] === "product") html = viewProduct(parts[1]);
    else if (parts[0] === "cart") html = viewCart();
    else if (parts[0] === "checkout") html = viewCheckout();
    else if (parts[0] === "order") html = viewOrder(parts[1]);
    else if (parts[0] === "lab-testing") html = `<div class="section-tight">${labTestingSection()}</div>`;
    else if (parts[0] === "faq") html = `<div class="section-tight">${faqSection()}</div>`;
    else html = viewNotFound();
    app.innerHTML = html;
    document.querySelectorAll(".nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#/" + (parts[0] || "")));
    syncVariant();
    syncPayment();
    window.scrollTo(0, 0);
  }

  function rerender() {
    const y = window.scrollY;
    route();
    window.scrollTo(0, y);
  }

  function syncPayment() {
    const fields = document.getElementById("card-fields");
    if (!fields) return;
    const card = app.querySelector('input[name="payment"]:checked').value === "card";
    fields.hidden = !card;
  }

  // ---------- Events ----------
  app.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    const d = t.dataset;
    if (d.add) { addToCart(d.add, 0, 1); }
    else if (d.gotoCategory) { state.category = d.gotoCategory; state.query = ""; searchInput.value = ""; if (location.hash === "#/shop") rerender(); }
    else if (d.category) { state.category = d.category; rerender(); }
    else if (d.inc) { setQty(d.inc, cart[d.inc] + 1); rerender(); }
    else if (d.dec) { setQty(d.dec, cart[d.dec] - 1); rerender(); }
    else if (d.remove) { setQty(d.remove, 0); toast("Item removed"); rerender(); }
    else if ("clearSearch" in d) { state.query = ""; searchInput.value = ""; rerender(); }
  });

  app.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "sort-select") { state.sort = t.value; rerender(); }
    else if (t.name === "variant") syncVariant();
    else if (t.name === "payment") syncPayment();
    else if (t.name === "shipping") {
      checkoutShipping = t.value;
      const tt = totals(checkoutShipping);
      app.querySelector(".summary").outerHTML = summary(tt, false);
      app.querySelector('#checkout-form button[type="submit"]').textContent = "Place order · " + money(tt.total);
    }
  });

  // Clear a checkout field's error as soon as the shopper edits it.
  app.addEventListener("input", (e) => {
    const err = e.target.form && e.target.form.id === "checkout-form" && app.querySelector(`[data-error-for="${e.target.name}"]`);
    if (err) { err.textContent = ""; e.target.removeAttribute("aria-invalid"); }
  });

  app.addEventListener("submit", (e) => {
    e.preventDefault();
    if (e.target.id === "add-form") {
      const id = app.querySelector("[data-product]").dataset.product;
      const vi = +e.target.querySelector('input[name="variant"]:checked').value;
      const qty = Math.max(1, parseInt(document.getElementById("qty").value, 10) || 1);
      addToCart(id, vi, qty);
    } else if (e.target.id === "checkout-form") {
      const data = Object.fromEntries(new FormData(e.target).entries());
      const errors = validateCheckout(data);
      e.target.querySelectorAll("[data-error-for]").forEach((el) => {
        const msg = errors[el.dataset.errorFor] || "";
        el.textContent = msg;
        const input = document.getElementById(el.dataset.errorFor);
        if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
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
    if (location.hash !== "#/shop") location.hash = "#/shop";
    else route();
  });
  searchInput.addEventListener("input", () => {
    state.query = searchInput.value;
    state.category = "All";
    if (location.hash !== "#/shop") { if (state.query.trim()) location.hash = "#/shop"; return; }
    rerender();
    searchInput.focus();
  });

  window.addEventListener("hashchange", route);
  window.addEventListener("storage", (e) => {
    if (e.key === CART_KEY) { cart = load(CART_KEY, {}); updateCartCount(); rerender(); }
  });

  // ---------- Research-use-only gate ----------
  function initGate() {
    if (load(RUO_KEY, false)) return;
    const gate = document.getElementById("ruo-gate");
    const check = document.getElementById("ruo-check");
    const enter = document.getElementById("ruo-enter");
    gate.hidden = false;
    document.body.classList.add("locked");
    check.addEventListener("change", () => { enter.disabled = !check.checked; });
    enter.addEventListener("click", () => {
      save(RUO_KEY, true);
      gate.hidden = true;
      document.body.classList.remove("locked");
    });
  }

  document.querySelectorAll("[data-brand]").forEach((el) => { el.textContent = STORE.name; });
  document.getElementById("year").textContent = new Date().getFullYear();
  updateCartCount();
  route();
  initGate();
})();
