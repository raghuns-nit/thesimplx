// ============================================================
// filters.js — Client-side search, filtering, and product/
//              product-detail page rendering.
// Depends on drive.js, storage.js, whatsapp.js, upi.js, app.js
// ============================================================

let allProducts = []; // full list for the current view
let filteredProducts = []; // after filters are applied

// ── Category page init ────────────────────────────────────────

async function initCategoryPage() {
  showLoader("Loading Products…");

  const params = new URLSearchParams(window.location.search);
  const catSlug = params.get("slug");

  const all = await loadJson("products.json");
  allProducts = Array.isArray(all) ? all : [];

  if (catSlug) {
    allProducts = allProducts.filter((p) => p.category === catSlug);
    const cats = await loadJson("categories.json");
    const catObj = cats.find((c) => c.slug === catSlug);
    if (catObj) document.getElementById("pageTitle").innerText = catObj.name;
  }

  filteredProducts = [...allProducts];
  populateFilterOptions();
  renderProducts();
  hideLoader();

  // ── Event listeners ───────────────────────────────────────
  document
    .getElementById("searchInput")
    .addEventListener("input", applyFilters);
  document
    .getElementById("filterBrand")
    .addEventListener("change", applyFilters);
  document
    .getElementById("filterFinish")
    .addEventListener("change", applyFilters);
  document
    .getElementById("filterSize")
    .addEventListener("change", applyFilters);
  document
    .getElementById("filterStock")
    .addEventListener("change", applyFilters);
  document
    .getElementById("filterPriceMin")
    .addEventListener("input", applyFilters);
  document
    .getElementById("filterPriceMax")
    .addEventListener("input", applyFilters);
}

// ── Populate filter dropdowns ─────────────────────────────────

function populateFilterOptions() {
  const brands = [
    ...new Set(allProducts.map((p) => p.brand).filter(Boolean)),
  ].sort();
  const finishes = [
    ...new Set(allProducts.map((p) => p.finish).filter(Boolean)),
  ].sort();
  const sizes = [
    ...new Set(allProducts.map((p) => p.size).filter(Boolean)),
  ].sort();

  const brandSel = document.getElementById("filterBrand");
  const finishSel = document.getElementById("filterFinish");
  const sizeSel = document.getElementById("filterSize");

  brands.forEach((v) => brandSel.add(new Option(v, v)));
  finishes.forEach((v) => finishSel.add(new Option(v, v)));
  sizes.forEach((v) => sizeSel.add(new Option(v, v)));
}

// ── Apply all active filters ──────────────────────────────────

function applyFilters() {
  const term = document
    .getElementById("searchInput")
    .value.toLowerCase()
    .trim();
  const brand = document.getElementById("filterBrand").value;
  const finish = document.getElementById("filterFinish").value;
  const size = document.getElementById("filterSize").value;
  const stock = document.getElementById("filterStock").value;
  const priceMin =
    parseFloat(document.getElementById("filterPriceMin").value) || 0;
  const priceMax =
    parseFloat(document.getElementById("filterPriceMax").value) || Infinity;

  filteredProducts = allProducts.filter((p) => {
    // FIX: null-guard every field before calling .toLowerCase()
    const matchesSearch =
      !term ||
      (p.name || "").toLowerCase().includes(term) ||
      (p.brand || "").toLowerCase().includes(term) ||
      (p.sku || "").toLowerCase().includes(term);

    const matchesBrand = !brand || p.brand === brand;
    const matchesFinish = !finish || p.finish === finish;
    const matchesSize = !size || p.size === size;
    const matchesStock = !stock || p.stockStatus === stock;

    const price = parseFloat(p.price) || 0;
    const matchesPrice =
      price >= priceMin && (priceMax === Infinity || price <= priceMax);

    return (
      matchesSearch &&
      matchesBrand &&
      matchesFinish &&
      matchesSize &&
      matchesStock &&
      matchesPrice
    );
  });

  renderProducts();
}

// ── Clear all filters ─────────────────────────────────────────

function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterBrand").value = "";
  document.getElementById("filterFinish").value = "";
  document.getElementById("filterSize").value = "";
  document.getElementById("filterStock").value = "";
  document.getElementById("filterPriceMin").value = "";
  document.getElementById("filterPriceMax").value = "";
  applyFilters();
}

// ── Safe onclick handlers ─────────────────────────────────────
// Use data-id instead of embedding JSON in onclick attributes —
// avoids XSS and crashes caused by quotes in product names.

function handleQuote(id) {
  const p = filteredProducts.find((x) => x.internalId === id);
  if (p) requestQuote(p);
}

function handlePay(id) {
  const p = filteredProducts.find((x) => x.internalId === id);
  if (p) payAdvance(p.price);
}

// ── Render product cards ──────────────────────────────────────

function _stockStyle(status) {
  if (status === "Out of Stock") return "color:var(--danger);";
  if (status === "Limited Stock") return "color:var(--warning);";
  return "color:var(--success);";
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  const count = filteredProducts.length;
  document.getElementById("resultCount").innerText =
    count === 0
      ? "No products found"
      : `${count} Product${count === 1 ? "" : "s"} Found`;

  if (!count) {
    grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center;
                        padding:3rem; color:var(--text-muted);">
                No products match your filters.
                <br><br>
                <button class="btn btn-outline" onclick="clearFilters()">Clear Filters</button>
            </div>`;
    return;
  }

  grid.innerHTML = filteredProducts
    .map(
      (p) => `
        <div class="card">
            <a href="product.html?id=${p.internalId}"
               style="text-decoration:none; color:inherit;
                      display:flex; flex-direction:column; height:100%;">
                <div class="card-img-container">
                    <img src="https://drive.google.com/thumbnail?id=${p.images[0]}"
                         class="card-img" alt="${p.name}"
                         onerror="this.src='assets/placeholder.png'">
                </div>
                <div class="card-body">
                    <span class="badge badge-warning mb-2"
                          style="align-self:flex-start;">${p.brand}</span>
                    <h3 class="card-title">${p.name}</h3>
                    <div class="card-meta">
                        ${p.sku ? `<span>SKU: ${p.sku}</span>` : ""}
                        ${p.size ? `<span>${p.size}</span>` : ""}
                    </div>
                    <div class="card-price">
                        &#8377;${p.price}
                        <span style="font-size:0.875rem; font-weight:normal;
                                     color:var(--text-muted);">/ ${p.unit}</span>
                    </div>
                    <p style="font-size:0.875rem; font-weight:600;
                              margin-top:auto; ${_stockStyle(p.stockStatus)}">
                        ${p.stockStatus || "In Stock"}
                    </p>
                </div>
            </a>
            <!-- FIX: data-id instead of JSON.stringify in onclick -->
            <div class="card-actions" style="padding:0 1rem 1rem;">
                <button class="btn btn-whatsapp"
                        data-id="${p.internalId}"
                        onclick="handleQuote(this.dataset.id)">
                    💬 Quote
                </button>
                <button class="btn btn-primary"
                        data-id="${p.internalId}"
                        onclick="handlePay(this.dataset.id)">
                    💳 Pay
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

// ── Product detail page ───────────────────────────────────────

async function initProductPage() {
  showLoader("Loading Product…");

  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    window.location.href = "index.html";
    return;
  }

  const products = await loadJson("products.json");
  const product = products.find((p) => p.internalId === id);

  if (!product) {
    document.getElementById("productContainer").innerHTML =
      '<div class="text-center section" style="color:var(--text-muted);">Product not found.</div>';
    hideLoader();
    return;
  }

  // Main image
  const mainImg = document.getElementById("mainImg");
  mainImg.src = `https://drive.google.com/thumbnail?id=${product.images[0]}`;

  // Thumbnails — highlight on click
  document.getElementById("thumbnails").innerHTML = product.images
    .map(
      (imgId) => `
        <img src="https://drive.google.com/thumbnail?id=${imgId}"
             style="width:80px; height:80px; object-fit:cover; cursor:pointer;
                    border-radius:var(--radius); border:2px solid var(--border);
                    transition:border-color 0.2s;"
             onmouseover="this.style.borderColor='var(--primary)'"
             onmouseout="this.style.borderColor='var(--border)'"
             onclick="document.getElementById('mainImg').src=this.src"
             alt="${product.name}">
    `,
    )
    .join("");

  // Header fields
  document.getElementById("p_brand").innerText = product.brand;
  document.getElementById("p_name").innerText = product.name;
  document.getElementById("p_sku").innerText = product.sku;
  document.getElementById("p_price").innerText = `\u20B9${product.price}`;
  document.getElementById("p_unit").innerText = `/ ${product.unit}`;

  // Specifications table — now includes Color
  const specs = [
    { label: "Category", value: product.category },
    { label: "Size", value: product.size },
    { label: "Finish", value: product.finish },
    { label: "Color", value: product.color },
    { label: "Thickness", value: product.thickness },
    { label: "Material", value: product.material },
    { label: "Status", value: product.stockStatus },
  ];

  document.getElementById("p_specs").innerHTML = specs
    .filter((s) => s.value)
    .map(
      (s) => `
            <div style="display:flex; justify-content:space-between;
                        padding:0.5rem 0; border-bottom:1px solid var(--border);">
                <span class="text-muted">${s.label}</span>
                <span style="font-weight:600;">${s.value}</span>
            </div>`,
    )
    .join("");

  // Store globally for WhatsApp / UPI buttons
  window.currentProduct = product;
  hideLoader();
}
