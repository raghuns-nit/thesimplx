// ============================================================
// products.js — Product CRUD (Supabase)
// Depends on supabase-client.js, storage.js, activity.js,
//            categories.js, admin.js
// ============================================================

let productsData = [];

// ── Init ─────────────────────────────────────────────────────

async function initProducts() {
  productsData = await loadProducts();
  renderProductsTable();
}

// ── Stock badge helper ────────────────────────────────────────

function getStockBadgeClass(status) {
  if (status === 'Out of Stock') return 'badge-danger';
  if (status === 'Limited Stock') return 'badge-warning';
  return 'badge-success';
}

// ── Table render ──────────────────────────────────────────────

function renderProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  if (!productsData.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:2rem; color:var(--text-muted);">No products yet. Click "+ Add Product" to begin.</td></tr>';
    return;
  }

  tbody.innerHTML = productsData.map((p) => {
    const stock = p.stock_status || 'In Stock';
    const images = p.image_urls || [];
    const imgSrc = images.length > 0 ? images[0] : 'placeholder.png';

    // Find category name
    const cat = categoriesData.find((c) => c.id === p.category_id);
    const catName = cat ? cat.name : '—';

    return `
        <tr>
            <td><strong style="font-family:monospace;">${p.sku || '—'}</strong></td>
            <td>
                <img src="${imgSrc}" class="img-thumbnail" alt="${p.name}" onerror="this.src='placeholder.png'">
            </td>
            <td>
                ${p.name}
                <br><small class="text-muted">${p.brand || ''}</small>
            </td>
            <td>${catName}</td>
            <td>
                &#8377;${p.price || 0} <small class="text-muted">/ ${p.unit || 'unit'}</small>
            </td>
            <td>
                <span class="badge ${getStockBadgeClass(stock)}">${stock}</span>
            </td>
            <td class="actions">
                <button class="btn btn-outline" style="padding:0.25rem 0.5rem;"
                        onclick="editProduct('${p.id}')">Edit</button>
                <button class="btn btn-danger"  style="padding:0.25rem 0.5rem;"
                        onclick="deleteProduct('${p.id}')">Delete</button>
            </td>
        </tr>`;
  }).join('');
}

// ── SKU prefix map ────────────────────────────────────────────

const skuPrefixes = {
  floor_tiles: 'FT', wall_tiles: 'WT', vitrified_tiles: 'VF',
  bathroom_fittings: 'BF', mirrors: 'MR', sanitary_ware: 'SW',
  electrical: 'EL', accessories: 'AC', other_services: 'OS',
  paints: 'PT', cement: 'CM', steel: 'ST',
};

// ── Modal: Add mode ───────────────────────────────────────────

function openAddProductModal() {
  window.editingProductId = null;
  const titleEl = document.getElementById('productModalTitle');
  const hintEl = document.getElementById('prod_images_hint');
  if (titleEl) titleEl.innerText = 'Add Product';
  if (hintEl) hintEl.innerText = '(required for new products)';
  openModal('productModal');
}

// ── Modal: Edit mode ──────────────────────────────────────────

function editProduct(id) {
  const p = productsData.find((prod) => prod.id === id);
  if (!p) return;

  window.editingProductId = id;

  const titleEl = document.getElementById('productModalTitle');
  const hintEl = document.getElementById('prod_images_hint');
  if (titleEl) titleEl.innerText = 'Edit Product';
  if (hintEl) hintEl.innerText = '(optional — leave empty to keep existing images)';

  document.getElementById('prod_name').value = p.name || '';
  document.getElementById('prod_category').value = p.category_id || '';
  document.getElementById('prod_brand').value = p.brand || '';
  document.getElementById('prod_size').value = p.size || '';
  document.getElementById('prod_finish').value = p.finish || '';

  // Extra spec fields (may not exist in older HTML)
  const colorEl = document.getElementById('prod_color');
  const thickEl = document.getElementById('prod_thickness');
  const matEl = document.getElementById('prod_material');
  if (colorEl && p.specifications) colorEl.value = p.specifications.color || '';
  if (thickEl && p.specifications) thickEl.value = p.specifications.thickness || '';
  if (matEl && p.specifications) matEl.value = p.specifications.material || '';

  const ssEl = document.getElementById('prod_stockStatus');
  if (ssEl) ssEl.value = p.stock_status || 'In Stock';
  document.getElementById('prod_price').value = p.price || '';
  document.getElementById('prod_unit').value = p.unit || '';

  const onSaleEl = document.getElementById('prod_onSale');
  if (onSaleEl) onSaleEl.checked = false;
  const discountEl = document.getElementById('prod_discount');
  if (discountEl) discountEl.value = '';

  openModal('productModal');
}

// ── Save (handles both Add and Edit) ─────────────────────────

async function handleSaveProduct(e) {
  e.preventDefault();
  showLoader('Processing product...');

  const categoryId = document.getElementById('prod_category').value;
  const brand = document.getElementById('prod_brand').value.trim();
  const name = document.getElementById('prod_name').value.trim();
  const files = document.getElementById('prod_images').files;

  if (!categoryId) { hideLoader(); alert('Please select a category.'); return; }

  // Collect specifications from optional fields
  const specs = {};
  const colorEl = document.getElementById('prod_color');
  const thickEl = document.getElementById('prod_thickness');
  const matEl = document.getElementById('prod_material');
  if (colorEl && colorEl.value.trim()) specs.color = colorEl.value.trim();
  if (thickEl && thickEl.value.trim()) specs.thickness = thickEl.value.trim();
  if (matEl && matEl.value.trim()) specs.material = matEl.value.trim();

  const fields = {
    category_id: categoryId,
    name,
    brand,
    size: document.getElementById('prod_size').value.trim(),
    finish: document.getElementById('prod_finish').value.trim(),
    stock_status: document.getElementById('prod_stockStatus').value,
    price: parseFloat(document.getElementById('prod_price').value) || null,
    unit: document.getElementById('prod_unit').value.trim(),
    specifications: specs,
  };

  try {
    if (window.editingProductId) {
      // ── EDIT path ──
      const existing = productsData.find((p) => p.id === window.editingProductId);
      if (!existing) throw new Error('Product not found.');

      let imageUrls = existing.image_urls || [];

      if (files.length > 0) {
        imageUrls = [];
        const cat = categoriesData.find((c) => c.id === categoryId);
        const folder = cat ? cat.slug : 'misc';
        for (let i = 0; i < files.length; i++) {
          const ext = files[i].name.split('.').pop();
          const filename = `${existing.sku || 'img'}_0${i + 1}.${ext}`;
          const url = await uploadImage(files[i], `products/${folder}`, filename);
          if (url) imageUrls.push(url);
        }
      }

      const { error } = await sb.from('products').update({
        ...fields,
        image_urls: imageUrls,
      }).eq('id', existing.id);

      if (error) throw error;
      await logActivity('UPDATE_PRODUCT', 'product', existing.id);

    } else {
      // ── CREATE path ──
      if (files.length === 0) {
        hideLoader();
        alert('Please select at least one product image.');
        return;
      }

      // Auto-generate SKU
      const cat = categoriesData.find((c) => c.id === categoryId);
      const catSlug = cat ? cat.slug : '';
      const prefix = skuPrefixes[catSlug] || 'GN';
      const brandCode = brand.substring(0, 3).toUpperCase();
      const seq = String(productsData.length + 1).padStart(3, '0');
      const sku = `${prefix}-${brandCode}-${seq}`;

      const imageUrls = [];
      const folder = cat ? cat.slug : 'misc';
      for (let i = 0; i < files.length; i++) {
        const ext = files[i].name.split('.').pop();
        const filename = `${sku}_0${i + 1}.${ext}`;
        const url = await uploadImage(files[i], `products/${folder}`, filename);
        if (url) imageUrls.push(url);
      }

      const { data: newProduct, error } = await sb.from('products').insert({
        ...fields,
        sku,
        image_urls: imageUrls,
      }).select().single();

      if (error) throw error;
      await logActivity('CREATE_PRODUCT', 'product', newProduct.id);
    }

    closeModal('productModal');
    productsData = await loadProducts();
    renderProductsTable();

    // Refresh category counts
    categoriesData = await loadCategories();
    renderCategoriesTable();

  } catch (err) {
    console.error('handleSaveProduct error:', err);
    alert('Error saving product. Check the browser console.');
  } finally {
    hideLoader();
  }
}

// ── Delete ────────────────────────────────────────────────────

async function deleteProduct(id) {
  const p = productsData.find((prod) => prod.id === id);
  if (!p) return;

  if (!confirm(`Delete "${p.name}"?\n\nThis will permanently remove the product.`)) return;

  showLoader('Deleting product...');
  try {
    const { error } = await sb.from('products').delete().eq('id', id);
    if (error) throw error;

    await logActivity('DELETE_PRODUCT', 'product', id);
    productsData = await loadProducts();
    renderProductsTable();
    categoriesData = await loadCategories();
    renderCategoriesTable();
  } catch (err) {
    console.error('deleteProduct error:', err);
    alert('Error deleting product. Check the browser console.');
  } finally {
    hideLoader();
  }
}
