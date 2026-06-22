function renderProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return; // Safety guard if the grid doesn't exist

  const count = filteredProducts.length;
  
  // Safety guard for the result count text
  const resultCountEl = document.getElementById("resultCount");
  if (resultCountEl) {
      resultCountEl.innerText = count === 0
        ? "No products found"
        : `${count} Product${count === 1 ? "" : "s"} Found`;
  }

  if (!count) {
    grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center;
                        padding:3rem; color:var(--text-muted);">
                No products match your filters.
                <br><br>
                <button class="btn btn-outline" onclick="clearFilters()">Clear Filters</button>
            </div>`;
    return;
  }

  grid.innerHTML = filteredProducts
    .map(
      (p) => {
        // 1. SAFETy CHECKS: Fallbacks if a product is missing data
        const imageId = (p.images && p.images.length > 0) ? p.images[0] : '';
        const price = p.price || "0";
        const unit = p.unit || "unit";
        const stock = p.stockStatus || "In Stock";
        const name = p.name || "Unnamed Product";
        const brand = p.brand || "Brand";

        // 2. BADGE LOGIC
        const saleBanner = p.onSale ? `<div style="position:absolute; bottom:0; left:0; width:100%; background:rgba(220, 38, 38, 0.9); color:white; text-align:center; font-size:0.85rem; font-weight:bold; padding:4px 0; text-transform:uppercase;">On Sale</div>` : '';
        const discountBadge = p.discount ? `<div style="position:absolute; top:10px; right:10px; background:var(--danger); color:white; font-weight:bold; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-size:0.85rem; z-index:2; box-shadow:0 2px 4px rgba(0,0,0,0.2);">-${p.discount}%</div>` : '';

        // 3. HTML GENERATION
        return `
        <div class="card">
            <a href="product.html?id=${p.internalId}"
               style="text-decoration:none; color:inherit;
                      display:flex; flex-direction:column; height:100%;">
                
                <div class="card-img-container" style="position:relative; overflow:hidden;">
                    ${discountBadge}
                    <img src="https://drive.google.com/thumbnail?id=${imageId}"
                         class="card-img" alt="${name}"
                         onerror="this.src='assets/placeholder.png'">
                    ${saleBanner}
                </div>
                
                <div class="card-body">
                    <span class="badge badge-warning mb-2"
                          style="align-self:flex-start;">${brand}</span>
                    <h3 class="card-title">${name}</h3>
                    <div class="card-meta">
                        ${p.sku ? `<span>SKU: ${p.sku}</span>` : ""}
                        ${p.size ? `<span>${p.size}</span>` : ""}
                    </div>
                    <div class="card-price">
                        &#8377;${price}
                        <span style="font-size:0.875rem; font-weight:normal;
                                     color:var(--text-muted);">/ ${unit}</span>
                    </div>
                    <p style="font-size:0.875rem; font-weight:600;
                              margin-top:auto; ${_stockStyle(stock)}">
                        ${stock}
                    </p>
                </div>
            </a>
            <div class="card-actions" style="padding:0 1rem 1rem;">
                <button class="btn btn-whatsapp"
                        data-id="${p.internalId}"
                        onclick="handleQuote(this.dataset.id)">
                    💬 Quote
                </button>
                <button class="btn btn-primary"
                        data-id="${p.internalId}"
                        onclick="handlePay(this.dataset.id)">
                    💳 Pay
                </button>
            </div>
        </div>
    `;
      }
    )
    .join("");
}
