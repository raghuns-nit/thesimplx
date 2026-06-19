// ============================================================
// products.js — Product CRUD + Drive image management
// Depends on drive.js (findFile, createFolder, STATE),
//            storage.js (loadJson, saveJson, ensureCategoryFolder,
//                        uploadImage, deleteProductFolder),
//            activity.js (logActivity),
//            categories.js (categoriesData, renderCategoriesTable),
//            admin.js (openModal, closeModal)
// ============================================================

let productsData = [];

// ── Init ─────────────────────────────────────────────────────

async function initProducts() {
  productsData = await loadJson("products.json");
  renderProductsTable();
}

// ── Stock badge helper ────────────────────────────────────────

function getStockBadgeClass(status) {
  if (status === "Out of Stock") return "badge-danger";
  if (status === "Limited Stock") return "badge-warning";
  return "badge-success"; // 'In Stock' or undefined
}

// ── Table render ──────────────────────────────────────────────

function renderProductsTable() {
  const tbody = document.getElementById("productsTableBody");
  if (!productsData.length) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center" style="padding:2rem; color:var(--text-muted);">No products yet. Click "+ Add Product" to begin.</td></tr>';
    return;
  }

  tbody.innerHTML = productsData
    .map((p) => {
      const stock = p.stockStatus || "In Stock";
      return `
        <tr>
            <td><strong style="font-family:monospace;">${p.sku}</strong></td>
            <td>
                <img src="https://drive.google.com/thumbnail?id=${p.images[0]}"
                     class="img-thumbnail" alt="${p.name}">
            </td>
            <td>
                ${p.name}
                <br><small class="text-muted">${p.brand}</small>
            </td>
            <td>${p.category}</td>
            <td>&#8377;${p.price} <small class="text-muted">/ ${p.unit}</small></td>
            <td>
                <span class="badge ${getStockBadgeClass(stock)}">${stock}</span>
            </td>
            <td class="actions">
                <button class="btn btn-outline" style="padding:0.25rem 0.5rem;"
                        onclick="editProduct('${p.internalId}')">Edit</button>
                <button class="btn btn-danger"  style="padding:0.25rem 0.5rem;"
                        onclick="deleteProduct('${p.internalId}')">Delete</button>
            </td>
        </tr>`;
    })
    .join("");
}

// ── SKU prefix map ────────────────────────────────────────────

const skuPrefixes = {
  floor_tiles: "FT",
  wall_tiles: "WT",
  vitrified_tiles: "VF",
  bathroom_fittings: "BF",
  mirrors: "MR",
  sanitary_ware: "SW",
  electrical: "EL",
  accessories: "AC",
  other_services: "OS",
  paints: "PT",
  cement: "CM",
  steel: "ST",
};

// ── Modal: Add mode ───────────────────────────────────────────

function openAddProductModal() {
  window.editingProductId = null;

  const titleEl = document.getElementById("productModalTitle");
  const hintEl = document.getElementById("prod_images_hint");
  if (titleEl) titleEl.innerText = "Add Product";
  if (hintEl) hintEl.innerText = "(required for new products)";

  openModal("productModal");
}

// ── Modal: Edit mode ──────────────────────────────────────────

function editProduct(internalId) {
  const p = productsData.find((prod) => prod.internalId === internalId);
  if (!p) return;

  window.editingProductId = internalId;

  const titleEl = document.getElementById("productModalTitle");
  const hintEl = document.getElementById("prod_images_hint");
  if (titleEl) titleEl.innerText = "Edit Product";
  if (hintEl)
    hintEl.innerText = "(optional — leave empty to keep existing images)";

  document.getElementById("prod_name").value = p.name;
  document.getElementById("prod_category").value = p.category;
  document.getElementById("prod_brand").value = p.brand;
  document.getElementById("prod_size").value = p.size || "";
  document.getElementById("prod_finish").value = p.finish || "";
  document.getElementById("prod_color").value = p.color || "";
  document.getElementById("prod_thickness").value = p.thickness || "";
  document.getElementById("prod_material").value = p.material || "";
  document.getElementById("prod_stockStatus").value =
    p.stockStatus || "In Stock";
  document.getElementById("prod_price").value = p.price;
  document.getElementById("prod_unit").value = p.unit;

  openModal("productModal");
}

// ── Save (handles both Add and Edit) ─────────────────────────

async function handleSaveProduct(e) {
  e.preventDefault();
  showLoader("Processing product...");

  const catSlug = document.getElementById("prod_category").value;
  const brand = document.getElementById("prod_brand").value.trim();
  const name = document.getElementById("prod_name").value.trim();
  const files = document.getElementById("prod_images").files;

  // Collect all text fields into one object for reuse
  const fields = {
    category: catSlug,
    brand,
    name,
    size: document.getElementById("prod_size").value.trim(),
    finish: document.getElementById("prod_finish").value.trim(),
    color: document.getElementById("prod_color").value.trim(),
    thickness: document.getElementById("prod_thickness").value.trim(),
    material: document.getElementById("prod_material").value.trim(),
    stockStatus: document.getElementById("prod_stockStatus").value,
    price: document.getElementById("prod_price").value,
    unit: document.getElementById("prod_unit").value.trim(),
  };

  try {
    // ────────────────────────────────────────────────────
    // EDIT path
    // ────────────────────────────────────────────────────
    if (window.editingProductId) {
      const idx = productsData.findIndex(
        (p) => p.internalId === window.editingProductId,
      );
      if (idx === -1) throw new Error("Product record not found.");

      const existing = productsData[idx];
      const updatedProduct = { ...existing, ...fields };

      if (files.length > 0) {
        // New images supplied — delete old Drive folder, upload fresh set
        await deleteProductFolder(existing.internalId, existing.category);

        const catFolderId = await ensureCategoryFolder(catSlug);
        const productsFolder = await findFile(
          "products",
          catFolderId,
          "application/vnd.google-apps.folder",
        );
        const productFolderId = await createFolder(
          existing.internalId,
          productsFolder.id,
        );

        const uploadedIds = [];
        for (let i = 0; i < files.length; i++) {
          const ext = files[i].name.split(".").pop();
          const filename = `${existing.sku}_0${i + 1}.${ext}`;
          uploadedIds.push(
            await uploadImage(files[i], productFolderId, filename),
          );
        }
        updatedProduct.images = uploadedIds;
        // images array stays as existing.images when no new files chosen
      }

      productsData[idx] = updatedProduct;
      await saveJson("products.json", productsData);
      await logActivity("UPDATE_PRODUCT", "product", existing.internalId);

      // ────────────────────────────────────────────────────
      // CREATE path
      // ────────────────────────────────────────────────────
    } else {
      if (files.length === 0) {
        hideLoader();
        alert("Please select at least one product image.");
        return;
      }

      // Auto-generate SKU:  PREFIX-BRD-001
      const internalId = "prd_" + Date.now();
      const prefix = skuPrefixes[catSlug] || "GN";
      const brandCode = brand.substring(0, 3).toUpperCase();
      const seq = String(productsData.length + 1).padStart(3, "0");
      const sku = `${prefix}-${brandCode}-${seq}`;

      // Create Drive folder:  images/<slug>/products/<internalId>/
      const catFolderId = await ensureCategoryFolder(catSlug);
      const productsFolder = await findFile(
        "products",
        catFolderId,
        "application/vnd.google-apps.folder",
      );
      const productFolderId = await createFolder(internalId, productsFolder.id);

      // Upload images
      const uploadedIds = [];
      for (let i = 0; i < files.length; i++) {
        const ext = files[i].name.split(".").pop();
        const filename = `${sku}_0${i + 1}.${ext}`;
        uploadedIds.push(
          await uploadImage(files[i], productFolderId, filename),
        );
      }

      const newProduct = { internalId, sku, ...fields, images: uploadedIds };
      productsData.push(newProduct);
      await saveJson("products.json", productsData);

      // Increment category product count
      const catIdx = categoriesData.findIndex((c) => c.slug === catSlug);
      if (catIdx > -1) {
        categoriesData[catIdx].productCount =
          (categoriesData[catIdx].productCount || 0) + 1;
        await saveJson("categories.json", categoriesData);
        renderCategoriesTable();
      }

      await logActivity("CREATE_PRODUCT", "product", internalId);
    }

    closeModal("productModal");
    renderProductsTable();
  } catch (err) {
    console.error("handleSaveProduct error:", err);
    alert("Error saving product. Check the browser console.");
  } finally {
    hideLoader();
  }
}

// ── Delete ────────────────────────────────────────────────────

async function deleteProduct(internalId) {
  const p = productsData.find((prod) => prod.internalId === internalId);
  if (!p) return;

  if (
    !confirm(
      `Delete "${p.name}"?\n\n` +
        `This will permanently remove the product and its images from Google Drive.`,
    )
  )
    return;

  showLoader("Deleting product...");
  try {
    // 1. Remove Drive image folder  images/<slug>/products/<internalId>/
    await deleteProductFolder(internalId, p.category);

    // 2. Remove from JSON
    productsData = productsData.filter(
      (prod) => prod.internalId !== internalId,
    );
    await saveJson("products.json", productsData);

    // 3. Decrement category product count
    const catIdx = categoriesData.findIndex((c) => c.slug === p.category);
    if (catIdx > -1 && (categoriesData[catIdx].productCount || 0) > 0) {
      categoriesData[catIdx].productCount--;
      await saveJson("categories.json", categoriesData);
      renderCategoriesTable();
    }

    await logActivity("DELETE_PRODUCT", "product", internalId);
    renderProductsTable();
  } catch (err) {
    console.error("deleteProduct error:", err);
    alert("Error deleting product. Check the browser console.");
  } finally {
    hideLoader();
  }
}
