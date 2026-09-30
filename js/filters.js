// ============================================================
// filters.js — Client-side search, filtering, and product/
//              product-detail page rendering.
// Depends on supabase-client.js, storage.js, whatsapp.js, upi.js, app.js
// ============================================================

let allProducts = [];
let filteredProducts = [];

// ── Category page init ────────────────────────────────────────

async function initCategoryPage() {
  showLoader('Loading Products…');

  const params = new URLSearchParams(window.location.search);
  const catSlug = params.get('slug');

  // Load categories to find the right one
  const cats = await loadCategories();
  let targetCat = null;

  if (catSlug) {
    targetCat = cats.find((c) => c.slug === catSlug);
    if (targetCat) {
      const titleEl = document.getElementById('pageTitle');
      if (titleEl) titleEl.innerText = targetCat.name;
      allProducts = await loadProductsByCategory(targetCat.id);
    } else {
      allProducts = [];
    }
  } else {
    allProducts = await loadProducts();
  }

  filteredProducts = [...allProducts];
  populateFilterOptions();
  renderProducts();
  hideLoader();

  // Event listeners
  const si = document.getElementById('searchInput');
  const fb = document.getElementById('filterBrand');
  const ff = document.getElementById('filterFinish');
  const fs = document.getElementById('filterSize');
  const fst = document.getElementById('filterStock');
  const fmin = document.getElementById('filterPriceMin');
  const fmax = document.getElementById('filterPriceMax');
  if (si) si.addEventListener('input', applyFilters);
  if (fb) fb.addEventListener('change', applyFilters);
  if (ff) ff.addEventListener('change', applyFilters);
  if (fs) fs.addEventListener('change', applyFilters);
  if (fst) fst.addEventListener('change', applyFilters);
  if (fmin) fmin.addEventListener('input', applyFilters);
  if (fmax) fmax.addEventListener('input', applyFilters);
}

// ── Populate filter dropdowns ─────────────────────────────────

function populateFilterOptions() {
  const brands = [...new Set(allProducts.map((p) => p.brand).filter(Boolean))].sort();
  const finishes = [...new Set(allProducts.map((p) => p.finish).filter(Boolean))].sort();
  const sizes = [...new Set(allProducts.map((p) => p.size).filter(Boolean))].sort();

  const brandSel = document.getElementById('filterBrand');
  const finishSel = document.getElementById('filterFinish');
  const sizeSel = document.getElementById('filterSize');

  brands.forEach((v) => brandSel && brandSel.add(new Option(v, v)));
  finishes.forEach((v) => finishSel && finishSel.add(new Option(v, v)));
  sizes.forEach((v) => sizeSel && sizeSel.add(new Option(v, v)));
}

// ── Apply all active filters ──────────────────────────────────

function applyFilters() {
  const term = document.getElementById('searchInput').value.toLowerCase().trim();
  const brand = document.getElementById('filterBrand').value;
  const finish = document.getElementById('filterFinish').value;
  const size = document.getElementById('filterSize').value;
  const stock = document.getElementById('filterStock').value;
  const priceMin = parseFloat(document.getElementById('filterPriceMin').value) || 0;
  const priceMax = parseFloat(document.getElementById('filterPriceMax').value) || Infinity;

  filteredProducts = allProducts.filter((p) => {
    const matchesSearch =
      !term ||
      (p.name || '').toLowerCase().includes(term) ||
      (p.brand || '').toLowerCase().includes(term) ||
      (p.sku || '').toLowerCase().includes(term);

    const matchesBrand = !brand || p.brand === brand;
    const matchesFinish = !finish || p.finish === finish;
    const matchesSize = !size || p.size === size;
    const matchesStock = !stock || p.stock_status === stock;

    const price = parseFloat(p.price) || 0;
    const matchesPrice = price >= priceMin && (priceMax === Infinity || price <= priceMax);

    return matchesSearch && matchesBrand && matchesFinish && matchesSize && matchesStock && matchesPrice;
  });

  renderProducts();
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterBrand').value = '';
  document.getElementById('filterFinish').value = '';
  document.getElementById('filterSize').value = '';
  document.getElementById('filterStock').value = '';
  document.getElementById('filterPriceMin').value = '';
  document.getElementById('filterPriceMax').value = '';
  applyFilters();
}

// ── Safe onclick handlers ─────────────────────────────────────

function handleQuote(id) {
  const p = filteredProducts.find((x) => x.id === id);
  if (p) requestQuote(p);
}

function handlePay(id) {
  const p = filteredProducts.find((x) => x.id === id);
  if (p) payAdvance(p.price);
}

function _stockStyle(status) {
  if (status === 'Out of Stock') return 'color:var(--danger);';
  if (status === 'Limited Stock') return 'color:var(--warning);';
  return 'color:var(--success);';
}

// ── Render product cards ──────────────────────────────────────

function renderProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const count = filteredProducts.length;
  const resultCountEl = document.getElementById('resultCount');

  if (resultCountEl) {
    resultCountEl.innerText = count === 0 ? 'No products found' : `${count} Product${count === 1 ? '' : 's'} Found`;
  }

  if (!count) {
    grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">
                No products match your filters.
                <br><br>
                <button class="btn btn-outline" onclick="clearFilters()">Clear Filters</button>
            </div>`;
    return;
  }

  grid.innerHTML = filteredProducts.map((p) => {
    const images = p.image_urls || [];
    const imgSrc = images.length > 0 ? images[0] : 'placeholder.png';
    const price = p.price || '0';
    const unit = p.unit || 'unit';
    const stock = p.stock_status || 'In Stock';
    const name = p.name || 'Unnamed Product';
    const brand = p.brand || 'Brand';
    const specs = p.specifications || {};
    const onSale = specs.onSale === true || specs.onSale === 'true';
    const discount = specs.discount || '';
    const saleBadge = onSale
      ? `<span class=\"badge\" style=\"background:var(--danger); color:#fff; position:absolute; top:0.5rem; left:0.5rem; z-index:1; font-size:0.75rem; font-weight:700;\">SALE${discount ? ' -' + discount + '%' : ''}</span>`
      : '';

    return `
        <div class=\"card\">
            <a href=\"product.html?id=${p.id}\" style=\"text-decoration:none; color:inherit; display:flex; flex-direction:column; height:100%;\">
                <div class=\"card-img-container\" style=\"position:relative; overflow:hidden;\">
                    ${saleBadge}
                    <img src=\"${imgSrc}\" class=\"card-img\" alt=\"${name}\" onerror=\"this.src='placeholder.png'\">
                </div>
                <div class=\"card-body\">
                    <span class=\"badge badge-warning mb-2\" style=\"align-self:flex-start;\">${brand}</span>
                    <h3 class=\"card-title\">${name}</h3>
                    <div class=\"card-meta\">
                        ${p.sku ? `<span>SKU: ${p.sku}</span>` : ''}
                        ${p.size ? `<span>${p.size}</span>` : ''}
                    </div>
                    <div class=\"card-price\">
                        &#8377;${price} <span style=\"font-size:0.875rem; font-weight:normal; color:var(--text-muted);\">/ ${unit}</span>
                        ${onSale ? `<span style=\"color:var(--danger); font-size:0.8rem; font-weight:700; margin-left:0.5rem;\">${discount ? '-' + discount + '%' : 'ON SALE'}</span>` : ''}
                    </div>
                    <p style=\"font-size:0.875rem; font-weight:600; margin-top:auto; ${_stockStyle(stock)}\">${stock}</p>
                </div>
            </a>
            <div class="card-actions" style="padding:0 1rem 1rem;">
                <button class="btn btn-whatsapp" data-id="${p.id}" onclick="handleQuote(this.dataset.id)">💬 Quote</button>
                <button class="btn btn-primary" data-id="${p.id}" onclick="handlePay(this.dataset.id)">💳 Pay</button>
            </div>
        </div>`;
  }).join('');
}

// ── Product detail page ───────────────────────────────────────

async function initProductPage() {
  showLoader('Loading Product…');

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    window.location.href = 'index.html';
    return;
  }

  const { data: product, error } = await sb.from('products').select('*').eq('id', id).maybeSingle();

  if (!product || error) {
    document.getElementById('productContainer').innerHTML =
      '<div class="text-center section" style="color:var(--text-muted);">Product not found.</div>';
    hideLoader();
    return;
  }

  const images = product.image_urls || [];
  const mainImg = document.getElementById('mainImg');
  mainImg.src = images.length > 0 ? images[0] : 'placeholder.png';
  mainImg.onerror = function () { this.src = 'placeholder.png'; };

  document.getElementById('thumbnails').innerHTML = images.map((imgUrl) => `
        <img src="${imgUrl}"
             style="width:80px; height:80px; object-fit:cover; cursor:pointer; border-radius:var(--radius); border:2px solid var(--border); transition:border-color 0.2s;"
             onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'"
             onclick="document.getElementById('mainImg').src=this.src" alt="${product.name}">
    `).join('');

  const brandEl = document.getElementById('p_brand');
  if (brandEl) brandEl.innerText = product.brand || 'Brand';

  const saleBadgeEl = document.getElementById('p_sale_badge');
  if (saleBadgeEl) {
    const specs = product.specifications || {};
    const onSale = specs.onSale === true || specs.onSale === 'true';
    if (onSale) {
      saleBadgeEl.style.display = '';
      saleBadgeEl.innerText = specs.discount ? 'ON SALE -' + specs.discount + '%' : 'ON SALE';
    } else {
      saleBadgeEl.style.display = 'none';
    }
  }

  document.getElementById('p_name').innerText = product.name || 'Product';
  document.getElementById('p_sku').innerText = product.sku || '';

  const priceEl = document.getElementById('p_price');
  if (priceEl) priceEl.innerHTML = `&#8377;${product.price || 0}`;

  const unitEl = document.getElementById('p_unit');
  if (unitEl) unitEl.innerText = `/ ${product.unit || 'unit'}`;

  const specs = [
    { label: 'Size', value: product.size },
    { label: 'Finish', value: product.finish },
    { label: 'Status', value: product.stock_status },
  ];

  // Merge any additional specifications from jsonb
  if (product.specifications && typeof product.specifications === 'object') {
    for (const [key, val] of Object.entries(product.specifications)) {
      if (val) specs.push({ label: key.charAt(0).toUpperCase() + key.slice(1), value: val });
    }
  }

  const specsEl = document.getElementById('p_specs');
  if (specsEl) {
    specsEl.innerHTML = specs.filter((s) => s.value).map((s) => `
            <div style="display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid var(--border);">
                <span class="text-muted">${s.label}</span>
                <span style="font-weight:600;">${s.value}</span>
            </div>`).join('');
  }

  window.currentProduct = product;
  hideLoader();
}
