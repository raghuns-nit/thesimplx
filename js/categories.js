// ============================================================
// categories.js — Category CRUD (Supabase)
// Depends on supabase-client.js, storage.js, activity.js, admin.js
// ============================================================

let categoriesData = [];

// ── Init ─────────────────────────────────────────────────────

async function initCategories() {
  categoriesData = await loadCategories();
  renderCategoriesTable();
  populateCategoryDropdowns();

  const nameInput = document.getElementById('cat_name');
  if (nameInput) {
    nameInput.addEventListener('input', function () {
      const preview = document.getElementById('cat_slug_preview');
      if (preview && !window.editingCategoryId) {
        preview.value = makeSlug(this.value);
      }
    });
  }
}

// ── Slug helper ───────────────────────────────────────────────

function makeSlug(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

// ── Table render ──────────────────────────────────────────────

function renderCategoriesTable() {
  const tbody = document.getElementById('categoriesTableBody');
  if (!tbody) return;

  if (!categoriesData.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:2rem; color:var(--text-muted);">No categories yet. Click "+ Add Category" to begin.</td></tr>';
    return;
  }

  tbody.innerHTML = categoriesData.map((c) => `
        <tr>
            <td>
                <img src="${c.image_url || 'placeholder.png'}" class="img-thumbnail" alt="${c.name}" onerror="this.src='placeholder.png'">
            </td>
            <td>
                <strong>${c.name}</strong>
                ${c.description ? `<br><small class="text-muted">${c.description}</small>` : ''}
            </td>
            <td>
                <span class="badge badge-warning" style="font-family:monospace; letter-spacing:0.02em;">
                    ${c.slug}
                </span>
            </td>
            <td>${c.product_count || 0}</td>
            <td class="actions">
                <button class="btn btn-outline" style="padding:0.25rem 0.5rem;"
                        onclick="editCategory('${c.id}')">Edit</button>
                <button class="btn btn-danger"  style="padding:0.25rem 0.5rem;"
                        onclick="deleteCategory('${c.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

// ── Category dropdown (used by product form) ──────────────────

function populateCategoryDropdowns() {
  const select = document.getElementById('prod_category');
  if (select) {
    select.innerHTML =
      '<option value="">Select Category</option>' +
      categoriesData.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  }
}

// ── Modal: Add mode ───────────────────────────────────────────

function openAddCategoryModal() {
  window.editingCategoryId = null;

  const titleEl = document.getElementById('categoryModalTitle');
  const hintEl = document.getElementById('cat_image_hint');
  const slugEl = document.getElementById('cat_slug_preview');

  if (titleEl) titleEl.innerText = 'Add Category';
  if (hintEl) hintEl.innerText = '(required)';
  if (slugEl) { slugEl.value = ''; slugEl.disabled = false; }

  openModal('categoryModal');
}

// ── Modal: Edit mode ──────────────────────────────────────────

function editCategory(id) {
  const c = categoriesData.find((cat) => cat.id === id);
  if (!c) return;

  window.editingCategoryId = id;

  const titleEl = document.getElementById('categoryModalTitle');
  const hintEl = document.getElementById('cat_image_hint');
  const slugEl = document.getElementById('cat_slug_preview');

  if (titleEl) titleEl.innerText = 'Edit Category';
  if (hintEl) hintEl.innerText = '(optional — leave empty to keep existing image)';
  if (slugEl) { slugEl.value = c.slug; slugEl.disabled = true; }

  document.getElementById('cat_name').value = c.name;
  document.getElementById('cat_desc').value = c.description || '';

  openModal('categoryModal');
}

// ── Save (handles both Add and Edit) ─────────────────────────

async function handleSaveCategory(e) {
  e.preventDefault();

  const name = document.getElementById('cat_name').value.trim();
  const desc = document.getElementById('cat_desc').value.trim();
  const fileInput = document.getElementById('cat_image');
  const newSlug = makeSlug(name);

  if (!newSlug) { alert('Please enter a valid category name.'); return; }

  try {
    if (window.editingCategoryId) {
      // ── EDIT path ──
      showLoader('Updating category...');
      const existing = categoriesData.find((c) => c.id === window.editingCategoryId);
      if (!existing) throw new Error('Category not found.');

      const updates = {
        name,
        description: desc,
        slug: newSlug,
      };

      // Check slug uniqueness (excluding current)
      if (newSlug !== existing.slug) {
        const clash = categoriesData.find((c) => c.slug === newSlug && c.id !== existing.id);
        if (clash) {
          alert('A category with a similar name already exists. Choose a different name.');
          hideLoader();
          return;
        }
      }

      // Upload new image if provided
      if (fileInput.files.length > 0) {
        const imageUrl = await uploadImage(fileInput.files[0], 'categories', `${newSlug}.jpg`);
        if (imageUrl) updates.image_url = imageUrl;
      }

      const { error } = await sb.from('categories').update(updates).eq('id', existing.id);
      if (error) throw error;

      await logActivity('UPDATE_CATEGORY', 'category', existing.id);

    } else {
      // ── CREATE path ──
      if (fileInput.files.length === 0) {
        alert('Please select a category image.');
        return;
      }
      if (categoriesData.find((c) => c.slug === newSlug)) {
        alert('A category with a similar name already exists.');
        return;
      }

      showLoader('Creating category...');

      const imageUrl = await uploadImage(fileInput.files[0], 'categories', `${newSlug}.jpg`);

      const { data: newCat, error } = await sb.from('categories').insert({
        name,
        slug: newSlug,
        description: desc,
        image_url: imageUrl,
        sort_order: categoriesData.length,
      }).select().single();

      if (error) throw error;

      await logActivity('CREATE_CATEGORY', 'category', newCat.id);
    }

    closeModal('categoryModal');
    categoriesData = await loadCategories();
    renderCategoriesTable();
    populateCategoryDropdowns();

  } catch (err) {
    console.error('handleSaveCategory error:', err);
    alert('An error occurred while saving. Check the browser console.');
  } finally {
    hideLoader();
  }
}

// ── Delete ────────────────────────────────────────────────────

async function deleteCategory(id) {
  const cat = categoriesData.find((c) => c.id === id);
  if (!cat) return;

  if (!confirm(`Delete "${cat.name}"?\n\nThis removes the category and all its products.`)) return;

  showLoader('Deleting category...');
  try {
    const { error } = await sb.from('categories').delete().eq('id', id);
    if (error) throw error;

    await logActivity('DELETE_CATEGORY', 'category', id);
    categoriesData = await loadCategories();
    renderCategoriesTable();
    populateCategoryDropdowns();
  } catch (err) {
    console.error('deleteCategory error:', err);
    alert('Error deleting category. Check the browser console.');
  } finally {
    hideLoader();
  }
}
