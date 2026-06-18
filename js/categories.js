
// Categories Management

let categoriesData = [];

async function initCategories() {
    categoriesData = await loadJson('categories.json');
    renderCategoriesTable();
    populateCategoryDropdowns();
}

function renderCategoriesTable() {
    const tbody = document.getElementById('categoriesTableBody');
    if(categoriesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No categories found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = categoriesData.map(c => `
        <tr>
            <td><img src="https://drive.google.com/thumbnail?id=${c.imageId}" class="img-thumbnail" alt="${c.name}"></td>
            <td><strong>${c.name}</strong></td>
            <td><span class="badge badge-warning">${c.slug}</span></td>
            <td>${c.productCount || 0}</td>
            <td class="actions">
                <button class="btn btn-outline" style="padding: 0.25rem 0.5rem;" onclick="deleteCategory('${c.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function populateCategoryDropdowns() {
    const select = document.getElementById('prod_category');
    if(select) {
        select.innerHTML = '<option value="">Select Category</option>' + 
            categoriesData.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
    }
}

async function handleSaveCategory(e) {
    e.preventDefault();
    const name = document.getElementById('cat_name').value;
    const desc = document.getElementById('cat_desc').value;
    const fileInput = document.getElementById('cat_image');
    
    // Generate valid slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    
    if(categoriesData.find(c => c.slug === slug)) {
        alert("A category with a similar name already exists.");
        return;
    }
    
    try {
        // 1. Ensure folder structure exists
        const catFolderId = await ensureCategoryFolder(slug);
        
        // 2. Upload image to that folder
        const imageFile = fileInput.files[0];
        const imageId = await uploadImage(imageFile, catFolderId, 'category.jpg');
        
        // 3. Save to JSON
        const newCat = {
            id: 'cat_' + Date.now(),
            slug: slug,
            name: name,
            description: desc,
            imageId: imageId,
            productCount: 0,
            order: categoriesData.length
        };
        
        categoriesData.push(newCat);
        await saveJson('categories.json', categoriesData);
        await logActivity('CREATE_CATEGORY', 'category', newCat.id);
        
        // 4. Update UI
        closeModal('categoryModal');
        renderCategoriesTable();
        populateCategoryDropdowns();
        
    } catch(err) {
        console.error("Failed to save category", err);
        alert("An error occurred while saving.");
    }
}

async function deleteCategory(id) {
    if(!confirm("Are you sure? This will remove the category from the database (Drive folders remain intact for safety).")) return;
    categoriesData = categoriesData.filter(c => c.id !== id);
    await saveJson('categories.json', categoriesData);
    await logActivity('DELETE_CATEGORY', 'category', id);
    renderCategoriesTable();
    populateCategoryDropdowns();
}
