
// Client-Side Searching and Filtering
let allProducts = [];
let filteredProducts = [];

async function initCategoryPage() {
    showLoader("Loading Products...");
    const urlParams = new URLSearchParams(window.location.search);
    const catSlug = urlParams.get('slug');
    
    allProducts = await loadJson('products.json');
    
    if(catSlug) {
        allProducts = allProducts.filter(p => p.category === catSlug);
        // Optional: Get category name
        const cats = await loadJson('categories.json');
        const catObj = cats.find(c => c.slug === catSlug);
        if(catObj) document.getElementById('pageTitle').innerText = catObj.name;
    }
    
    filteredProducts = [...allProducts];
    populateFilterOptions();
    renderProducts();
    hideLoader();
    
    // Event Listeners for Filters
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('filterBrand').addEventListener('change', applyFilters);
    document.getElementById('filterFinish').addEventListener('change', applyFilters);
    document.getElementById('filterStock').addEventListener('change', applyFilters);
}

function populateFilterOptions() {
    const brands = [...new Set(allProducts.map(p => p.brand).filter(b => b))];
    const finishes = [...new Set(allProducts.map(p => p.finish).filter(f => f))];
    
    const brandSelect = document.getElementById('filterBrand');
    const finishSelect = document.getElementById('filterFinish');
    
    brands.forEach(b => brandSelect.add(new Option(b, b)));
    finishes.forEach(f => finishSelect.add(new Option(f, f)));
}

function applyFilters() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const brand = document.getElementById('filterBrand').value;
    const finish = document.getElementById('filterFinish').value;
    const stock = document.getElementById('filterStock').value;
    
    filteredProducts = allProducts.filter(p => {
        const matchesSearch = !term || 
            p.name.toLowerCase().includes(term) || 
            p.brand.toLowerCase().includes(term) || 
            p.sku.toLowerCase().includes(term);
            
        const matchesBrand = !brand || p.brand === brand;
        const matchesFinish = !finish || p.finish === finish;
        const matchesStock = !stock || p.stockStatus === stock;
        
        return matchesSearch && matchesBrand && matchesFinish && matchesStock;
    });
    
    renderProducts();
}

function renderProducts() {
    const grid = document.getElementById('productGrid');
    document.getElementById('resultCount').innerText = `${filteredProducts.length} Products Found`;
    
    if(filteredProducts.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding: 2rem;">No products match your criteria.</div>';
        return;
    }
    
    grid.innerHTML = filteredProducts.map(p => `
        <div class="card">
            <a href="product.html?id=${p.internalId}" style="text-decoration:none; color:inherit; display:flex; flex-direction:column; height:100%;">
                <div class="card-img-container">
                    <img src="https://drive.google.com/thumbnail?id=${p.images[0]}" class="card-img" alt="${p.name}">
                </div>
                <div class="card-body">
                    <span class="badge badge-warning mb-2" style="align-self:flex-start;">${p.brand}</span>
                    <h3 class="card-title">${p.name}</h3>
                    <div class="card-meta">
                        <span>SKU: ${p.sku}</span> | <span>${p.size || 'N/A'}</span>
                    </div>
                    <div class="card-price">₹${p.price} <span style="font-size:0.875rem; font-weight:normal; color:var(--text-muted)">/ ${p.unit}</span></div>
                    <p style="color:var(--success); font-size:0.875rem; font-weight:600; margin-top:auto;">${p.stockStatus}</p>
                </div>
            </a>
            <div class="card-actions" style="padding: 0 1rem 1rem;">
                <button class="btn btn-whatsapp" onclick='requestQuote(${JSON.stringify(p).replace(/'/g, "&#39;")})'>WhatsApp</button>
                <button class="btn btn-primary" onclick="payAdvance(${p.price})">Pay Advance</button>
            </div>
        </div>
    `).join('');
}

// Product Details Page Logic
async function initProductPage() {
    showLoader("Loading Product...");
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if(!id) { window.location.href = 'index.html'; return; }
    
    const products = await loadJson('products.json');
    const product = products.find(p => p.internalId === id);
    
    if(!product) {
        document.getElementById('productContainer').innerHTML = '<div class="text-center section">Product not found.</div>';
        hideLoader();
        return;
    }
    
    // Render Gallery
    const mainImg = document.getElementById('mainImg');
    mainImg.src = `https://drive.google.com/thumbnail?id=${product.images[0]}`;
    
    const thumbnails = document.getElementById('thumbnails');
    thumbnails.innerHTML = product.images.map(imgId => `
        <img src="https://drive.google.com/thumbnail?id=${imgId}" class="img-thumbnail" style="width:80px; height:80px; cursor:pointer;" onclick="document.getElementById('mainImg').src=this.src">
    `).join('');
    
    // Render Details
    document.getElementById('p_brand').innerText = product.brand;
    document.getElementById('p_name').innerText = product.name;
    document.getElementById('p_sku').innerText = product.sku;
    document.getElementById('p_price').innerText = `₹${product.price}`;
    document.getElementById('p_unit').innerText = `/ ${product.unit}`;
    
    const specs = [
        { label: 'Category', value: product.category },
        { label: 'Size', value: product.size },
        { label: 'Finish', value: product.finish },
        { label: 'Thickness', value: product.thickness },
        { label: 'Material', value: product.material },
        { label: 'Status', value: product.stockStatus }
    ];
    
    document.getElementById('p_specs').innerHTML = specs.filter(s => s.value).map(s => `
        <div style="display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid var(--border);">
            <span class="text-muted">${s.label}</span>
            <span style="font-weight:600;">${s.value}</span>
        </div>
    `).join('');
    
    // Button actions
    window.currentProduct = product; // Store for global access
    
    hideLoader();
}
