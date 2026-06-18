
// Products Management

let productsData = [];

async function initProducts() {
    productsData = await loadJson('products.json');
    renderProductsTable();
}

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if(productsData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No products found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = productsData.map(p => `
        <tr>
            <td><strong>${p.sku}</strong></td>
            <td><img src="https://drive.google.com/thumbnail?id=${p.images[0]}" class="img-thumbnail" alt="${p.name}"></td>
            <td>${p.name}<br><small class="text-muted">${p.brand}</small></td>
            <td>${p.category}</td>
            <td>₹${p.price} / ${p.unit}</td>
            <td><span class="badge badge-success">In Stock</span></td>
            <td class="actions">
                <button class="btn btn-danger" style="padding: 0.25rem 0.5rem;" onclick="deleteProduct('${p.internalId}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Prefix mapping for SKU generation
const skuPrefixes = {
    'floor_tiles': 'FT', 'wall_tiles': 'WT', 'vitrified_tiles': 'VF',
    'bathroom_fittings': 'BF', 'electrical': 'EL', 'accessories': 'AC', 'sanitary_ware': 'SW'
};

async function handleSaveProduct(e) {
    e.preventDefault();
    showLoader("Processing product details...");
    
    const catSlug = document.getElementById('prod_category').value;
    const brand = document.getElementById('prod_brand').value;
    const name = document.getElementById('prod_name').value;
    const files = document.getElementById('prod_images').files;
    
    // Generate Internal ID and SKU
    const internalId = 'prd_' + Date.now();
    const prefix = skuPrefixes[catSlug] || 'GN';
    const brandCode = brand.substring(0,3).toUpperCase();
    const seq = String(productsData.length + 1).padStart(3, '0');
    const sku = `${prefix}-${brandCode}-${seq}`;
    
    try {
        // 1. Get correct category products folder
        const catFolderId = await ensureCategoryFolder(catSlug);
        
        // Find 'products' subfolder inside category folder
        let productsFolder = await findFile('products', catFolderId, 'application/vnd.google-apps.folder');
        
        // Create specific folder for this product
        const specificProductFolderId = await createFolder(internalId, productsFolder.id);
        
        // 2. Upload images
        let uploadedImageIds = [];
        for(let i=0; i<files.length; i++) {
            const ext = files[i].name.split('.').pop();
            const filename = `${sku}_0${i+1}.${ext}`;
            const imgId = await uploadImage(files[i], specificProductFolderId, filename);
            uploadedImageIds.push(imgId);
        }
        
        // 3. Build product object
        const newProduct = {
            internalId: internalId,
            sku: sku,
            category: catSlug,
            brand: brand,
            name: name,
            size: document.getElementById('prod_size').value,
            finish: document.getElementById('prod_finish').value,
            price: document.getElementById('prod_price').value,
            unit: document.getElementById('prod_unit').value,
            stockStatus: 'In Stock',
            images: uploadedImageIds
        };
        
        productsData.push(newProduct);
        await saveJson('products.json', productsData);
        
        // Update category count
        let catIndex = categoriesData.findIndex(c => c.slug === catSlug);
        if(catIndex > -1) {
            categoriesData[catIndex].productCount = (categoriesData[catIndex].productCount || 0) + 1;
            await saveJson('categories.json', categoriesData);
            renderCategoriesTable();
        }
        
        await logActivity('CREATE_PRODUCT', 'product', internalId);
        
        closeModal('productModal');
        renderProductsTable();
        
    } catch(err) {
        console.error("Failed to save product", err);
        alert("Error saving product.");
    } finally {
        hideLoader();
    }
}

async function deleteProduct(internalId) {
    if(!confirm("Delete this product?")) return;
    productsData = productsData.filter(p => p.internalId !== internalId);
    await saveJson('products.json', productsData);
    await logActivity('DELETE_PRODUCT', 'product', internalId);
    renderProductsTable();
}
