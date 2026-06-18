
// Public App Core Logic
let globalSettings = {};

window.onAppReady = async function() {
    // Load settings for global use (WA, UPI, Phone)
    globalSettings = await loadJson('settings.json');
    
    // Update UI elements if they exist
    const brandEls = document.querySelectorAll('.company-name');
    brandEls.forEach(el => el.innerText = globalSettings.companyName || 'theSimpLx');
    
    // Initialize specific page logic based on URL
    const path = window.location.pathname;
    if(path.endsWith('/') || path.endsWith('index.html')) {
        await initHome();
    } else if (path.endsWith('category.html')) {
        await initCategoryPage();
    } else if (path.endsWith('product.html')) {
        await initProductPage();
    }
};

async function initHome() {
    showLoader("Loading Categories...");
    const categories = await loadJson('categories.json');
    const grid = document.getElementById('categoryGrid');
    
    if(!categories || categories.length === 0) {
        grid.innerHTML = '<div class="text-center" style="grid-column: 1/-1;">No categories available yet.</div>';
        hideLoader();
        return;
    }

    grid.innerHTML = categories.map(c => `
        <a href="category.html?slug=${c.slug}" class="card category-card">
            <div class="card-img-container" style="padding-top: 60%;">
                <img src="https://drive.google.com/thumbnail?id=${c.imageId}" class="card-img" alt="${c.name}">
            </div>
            <div class="card-body">
                <h3 class="card-title">${c.name}</h3>
                <span class="category-count">${c.productCount || 0} Products</span>
            </div>
        </a>
    `).join('');
    hideLoader();
}
