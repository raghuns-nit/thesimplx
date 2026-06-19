// ============================================================
// categories.js — Category CRUD + Drive folder management
// Depends on drive.js (findFile, renameFile, STATE),
//            storage.js (loadJson, saveJson, ensureCategoryFolder, uploadImage),
//            activity.js (logActivity), admin.js (openModal, closeModal)
// ============================================================

let categoriesData = [];

// ── Init ─────────────────────────────────────────────────────

async function initCategories() {
    categoriesData = await loadJson('categories.json');
    renderCategoriesTable();
    populateCategoryDropdowns();

    // Live slug preview while the user types a new category name
    const nameInput = document.getElementById('cat_name');
    if (nameInput) {
        nameInput.addEventListener('input', function () {
            const preview = document.getElementById('cat_slug_preview');
            // Only update preview in Add mode — slug is locked during Edit
            if (preview && !window.editingCategoryId) {
                preview.value = makeSlug(this.value);
            }
        });
    }
}

// ── Slug helper ───────────────────────────────────────────────

/** Convert a display name to a safe lowercase underscore slug. */
function makeSlug(name) {
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

// ── Table render ──────────────────────────────────────────────

function renderCategoriesTable() {
    const tbody = document.getElementById('categoriesTableBody');
    if (!categoriesData.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:2rem; color:var(--text-muted);">No categories yet. Click "+ Add Category" to begin.</td></tr>';
        return;
    }

    tbody.innerHTML = categoriesData.map(c => `
        <tr>
            <td>
                <img src="https://drive.google.com/thumbnail?id=${c.imageId}"
                     class="img-thumbnail" alt="${c.name}">
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
            <td>${c.productCount || 0}</td>
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
            categoriesData.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
    }
}

// ── Modal: Add mode ───────────────────────────────────────────

function openAddCategoryModal() {
    window.editingCategoryId = null;

    const titleEl   = document.getElementById('categoryModalTitle');
    const hintEl    = document.getElementById('cat_image_hint');
    const slugEl    = document.getElementById('cat_slug_preview');

    if (titleEl) titleEl.innerText = 'Add Category';
    if (hintEl)  hintEl.innerText  = '(required)';
    if (slugEl)  { slugEl.value = ''; slugEl.disabled = false; }

    openModal('categoryModal');
}

// ── Modal: Edit mode ──────────────────────────────────────────

function editCategory(id) {
    const c = categoriesData.find(cat => cat.id === id);
    if (!c) return;

    window.editingCategoryId = id;

    const titleEl = document.getElementById('categoryModalTitle');
    const hintEl  = document.getElementById('cat_image_hint');
    const slugEl  = document.getElementById('cat_slug_preview');

    if (titleEl) titleEl.innerText = 'Edit Category';
    if (hintEl)  hintEl.innerText  = '(optional — leave empty to keep existing image)';
    // Slug is shown but disabled in edit mode — it is auto-recalculated from name
    if (slugEl)  { slugEl.value = c.slug; slugEl.disabled = true; }

    document.getElementById('cat_name').value = c.name;
    document.getElementById('cat_desc').value = c.description || '';

    openModal('categoryModal');
}

// ── Save (handles both Add and Edit) ─────────────────────────

async function handleSaveCategory(e) {
    e.preventDefault();

    const name      = document.getElementById('cat_name').value.trim();
    const desc      = document.getElementById('cat_desc').value.trim();
    const fileInput = document.getElementById('cat_image');
    const newSlug   = makeSlug(name);

    if (!newSlug) { alert('Please enter a valid category name.'); return; }

    try {
        // ────────────────────────────────────────────────────
        // EDIT path
        // ────────────────────────────────────────────────────
        if (window.editingCategoryId) {
            const idx = categoriesData.findIndex(c => c.id === window.editingCategoryId);
            if (idx === -1) throw new Error('Category record not found.');

            showLoader('Updating category...');
            const existing   = categoriesData[idx];
            const updatedCat = { ...existing, name, description: desc };
            const slugChanged = newSlug !== existing.slug;

            if (slugChanged) {
                // Guard: new slug must not clash with an existing category
                if (categoriesData.find(c => c.slug === newSlug && c.id !== existing.id)) {
                    alert('A category with a similar name already exists. Choose a different name.');
                    hideLoader();
                    return;
                }

                // 1. Rename the Drive folder  images/<oldSlug>/ → images/<newSlug>/
                //    (all files inside are preserved automatically by Drive)
                if (STATE.imagesFolderId) {
                    const catFolder = await findFile(
                        existing.slug, STATE.imagesFolderId,
                        'application/vnd.google-apps.folder'
                    );
                    if (catFolder) {
                        const renamed = await renameFile(catFolder.id, newSlug);
                        if (!renamed) console.warn('Drive folder rename failed — slug updated in JSON anyway.');
                    }
                }

                // 2. Update every product that referenced the old slug
                let products = await loadJson('products.json');
                let changed  = false;
                products = products.map(p => {
                    if (p.category === existing.slug) {
                        changed = true;
                        return { ...p, category: newSlug };
                    }
                    return p;
                });
                if (changed) await saveJson('products.json', products);

                updatedCat.slug = newSlug;
            }

            // Optionally replace the category cover image
            if (fileInput.files.length > 0) {
                const catFolderId = await ensureCategoryFolder(updatedCat.slug);
                const imageId     = await uploadImage(fileInput.files[0], catFolderId, 'category.jpg');
                updatedCat.imageId = imageId;
            }

            categoriesData[idx] = updatedCat;
            await saveJson('categories.json', categoriesData);
            await logActivity('UPDATE_CATEGORY', 'category', existing.id);

        // ────────────────────────────────────────────────────
        // CREATE path
        // ────────────────────────────────────────────────────
        } else {
            if (fileInput.files.length === 0) {
                alert('Please select a category image.');
                return;
            }
            if (categoriesData.find(c => c.slug === newSlug)) {
                alert('A category with a similar name already exists.');
                return;
            }

            showLoader('Creating category...');

            // 1. Create Drive folder: images/<slug>/  +  products/  +  thumbnails/
            const catFolderId = await ensureCategoryFolder(newSlug);

            // 2. Upload cover image into the category folder root
            const imageId = await uploadImage(fileInput.files[0], catFolderId, 'category.jpg');

            // 3. Persist new category record
            const newCat = {
                id:           'cat_' + Date.now(),
                slug:         newSlug,
                name,
                description:  desc,
                imageId,
                productCount: 0,
                order:        categoriesData.length
            };

            categoriesData.push(newCat);
            await saveJson('categories.json', categoriesData);
            await logActivity('CREATE_CATEGORY', 'category', newCat.id);
        }

        closeModal('categoryModal');
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
    const cat = categoriesData.find(c => c.id === id);
    if (!cat) return;

    if (!confirm(
        `Delete "${cat.name}"?\n\n` +
        `This removes the category from the catalog.\n` +
        `Drive image folders are kept intact for safety.`
    )) return;

    categoriesData = categoriesData.filter(c => c.id !== id);
    await saveJson('categories.json', categoriesData);
    await logActivity('DELETE_CATEGORY', 'category', id);
    renderCategoriesTable();
    populateCategoryDropdowns();
}
