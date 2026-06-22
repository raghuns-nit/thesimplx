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
    const matchesSearch =
      !term ||
      (p.name || "").toLowerCase().includes(term) ||
      (p.brand || "").toLowerCase().includes(term) ||
      (p.sku || "").toLowerCase().includes(term);

    const matchesBrand = !brand || p.brand === brand;
    const matchesFinish = !finish || p.finish === finish;
    const matchesSize = !size || p.size === size;
    const matchesStock
