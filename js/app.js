// ============================================================
// app.js — Public page logic (homepage, category, product)
// Depends on drive.js, storage.js, whatsapp.js, upi.js
// Called via window.onAppReady from drive.js after Drive init.
// ============================================================

let globalSettings = {}; // settings.json — WA, UPI, phone, address, etc.
let allCategories = []; // full category list, kept for homepage live search

// ── App entry point ───────────────────────────────────────────
// Called by drive.js → checkAuthAndInit() once Drive folders are resolved.

window.onAppReady = async function () {
  // Load site-wide settings
  globalSettings = await loadJson("settings.json");

  // Update every element with class="company-name"
  const companyName = globalSettings.companyName || "theSimpLx";
  document
    .querySelectorAll(".company-name")
    .forEach((el) => (el.innerText = companyName));

  // Optionally update the browser tab title
  if (globalSettings.companyName) {
    const titleTag = document.querySelector("title");
    if (titleTag && !titleTag.dataset.fixed) {
      titleTag.innerText = titleTag.innerText.replace(
        "theSimpLx",
        globalSettings.companyName,
      );
      titleTag.dataset.fixed = "1";
    }
  }

  // Populate the homepage info bar (phone / WhatsApp / Location)
  _initInfoBar();

  // Render UPI QR on any page that has a .upi-display element
  if (typeof initUpiDisplay === "function") initUpiDisplay();

  // Route to the correct page initialiser
  const path = window.location.pathname;
  if (path.endsWith("/") || path.endsWith("index.html")) await initHome();
  else if (path.endsWith("category.html")) await initCategoryPage();
  else if (path.endsWith("product.html")) await initProductPage();
};

// ── Info bar (homepage only) ──────────────────────────────────

function _initInfoBar() {
  const bar = document.getElementById("infoBar");
  if (!bar) return; // only exists on index.html

  let visible = false;

  // Phone number
  if (globalSettings.phone) {
    const phoneWrap = document.getElementById("headerPhone");
    const phoneLink = document.getElementById("headerPhoneLink");
    if (phoneWrap && phoneLink) {
      phoneLink.textContent = globalSettings.phone;
      phoneLink.href = "tel:" + globalSettings.phone.replace(/[^0-9+]/g, "");
      phoneWrap.style.display = "";
      visible = true;
    }
  }

  // WhatsApp button
  if (globalSettings.whatsapp) {
    const waBtn = document.getElementById("headerWaBtn");
    if (waBtn) {
      waBtn.style.display = "";
      visible = true;
    }
  }

  // Location button → opens Google Maps
  if (globalSettings.address) {
    const locBtn = document.getElementById("headerLocBtn");
    if (locBtn) {
      locBtn.style.display = "";
      locBtn.onclick = () =>
        window.open(
          "https://maps.google.com/?q=" +
            encodeURIComponent(globalSettings.address),
          "_blank",
        );
      visible = true;
    }
  }

  if (visible) bar.style.display = "";
}

// ── Homepage ──────────────────────────────────────────────────

async function initHome() {
  showLoader("Loading Categories...");
  const categories = await loadJson("categories.json");
  allCategories = Array.isArray(categories) ? categories : [];
  hideLoader();

  renderCategories(allCategories);

  // Live search — filters category cards by name without a network call
  const searchEl = document.getElementById("categorySearch");
  if (searchEl) {
    searchEl.addEventListener("input", function () {
      const term = this.value.trim().toLowerCase();
      const filtered = term
        ? allCategories.filter((c) => c.name.toLowerCase().includes(term))
        : allCategories;
      renderCategories(filtered);
    });
  }
}

/** Render (or re-render) the category grid with the given list. */
function renderCategories(list) {
  const grid = document.getElementById("categoryGrid");
  if (!grid) return;

  if (!list || !list.length) {
    grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">
                No categories found.
            </div>`;
    return;
  }

  grid.innerHTML = list
    .map(
      (c) => `
        <a href="category.html?slug=${c.slug}" class="card category-card">
            <div class="card-img-container" style="padding-top:60%;">
                <img src="https://drive.google.com/thumbnail?id=${c.imageId}"
                     class="card-img" alt="${c.name}"
                     onerror="this.src='assets/placeholder.png'">
            </div>
            <div class="card-body">
                <h3 class="card-title">${c.name}</h3>
                <span class="category-count">${c.productCount || 0} Products</span>
            </div>
        </a>
    `,
    )
    .join("");
}
