// ============================================================
// app.js — Public page logic (homepage, category, product)
// Depends on supabase-client.js (window.sb), storage.js, whatsapp.js, upi.js
// ============================================================

let globalSettings = {};
let allCategories = [];

// ── App entry point ───────────────────────────────────────────

window.addEventListener('supabaseReady', initApp);

async function initApp() {
  // Load site-wide settings
  globalSettings = await loadSettings();

  // Update every element with class="company-name"
  const companyName = globalSettings.company_name || 'Simplx World';
  document.querySelectorAll('.company-name').forEach((el) => (el.innerText = companyName));

  // Update browser tab title
  if (globalSettings.company_name) {
    const titleTag = document.querySelector('title');
    if (titleTag && !titleTag.dataset.fixed) {
      titleTag.innerText = titleTag.innerText.replace('Simplx World', globalSettings.company_name);
      titleTag.dataset.fixed = '1';
    }
  }

  // Populate the homepage info bar
  _initInfoBar();

  // Render UPI QR on any page that has a .upi-display element
  if (typeof initUpiDisplay === 'function') initUpiDisplay();

  // Route to the correct page initialiser
  const path = window.location.pathname;
  if (path.endsWith('/') || path.endsWith('index.html')) await initHome();
  else if (path.endsWith('category.html')) await initCategoryPage();
  else if (path.endsWith('product.html')) await initProductPage();
}

// ── Info bar (homepage only) ──────────────────────────────────

function _initInfoBar() {
  const bar = document.getElementById('infoBar');
  if (!bar) return;

  let visible = false;

  if (globalSettings.phone) {
    const phoneWrap = document.getElementById('headerPhone');
    const phoneLink = document.getElementById('headerPhoneLink');
    if (phoneWrap && phoneLink) {
      phoneLink.textContent = globalSettings.phone;
      phoneLink.href = 'tel:' + globalSettings.phone.replace(/[^0-9+]/g, '');
      phoneWrap.style.display = '';
      visible = true;
    }
  }

  if (globalSettings.whatsapp) {
    const waBtn = document.getElementById('headerWaBtn');
    if (waBtn) {
      waBtn.style.display = '';
      visible = true;
    }
  }

  if (globalSettings.address) {
    const locBtn = document.getElementById('headerLocBtn');
    if (locBtn) {
      locBtn.style.display = '';
      locBtn.onclick = () =>
        window.open('https://maps.google.com/?q=' + encodeURIComponent(globalSettings.address), '_blank');
      visible = true;
    }
  }

  if (visible) bar.style.display = '';
}

// ── Homepage ──────────────────────────────────────────────────

async function initHome() {
  showLoader('Loading Categories...');
  allCategories = await loadCategories();
  hideLoader();
  renderCategories(allCategories);

  _initGoogleReviews();

  const searchEl = document.getElementById('categorySearch');
  if (searchEl) {
    searchEl.addEventListener('input', function () {
      const term = this.value.trim().toLowerCase();
      const filtered = term
        ? allCategories.filter((c) => c.name.toLowerCase().includes(term))
        : allCategories;
      renderCategories(filtered);
    });
  }
}

function _initGoogleReviews() {
  const reviewUrl = globalSettings.google_review_url;
  const section = document.getElementById('googleReviewSection');
  if (!section || !reviewUrl) return;

  section.style.display = '';

  const linkEl = document.getElementById('reviewLink');
  if (linkEl) linkEl.href = reviewUrl;

  const sampleReviews = [
    { author: 'Rajesh Kumar', rating: 5, text: 'Excellent quality tiles and great service. The team helped us choose the perfect flooring for our entire house.' },
    { author: 'Priya Sharma', rating: 5, text: 'Very professional and fair pricing. The tile estimator tool was super helpful for calculating quantities.' },
    { author: 'Mohammed Iqbal', rating: 4, text: 'Good collection of parking tiles. Delivery was on time. Would recommend to others.' },
    { author: 'Lakshmi N.', rating: 5, text: 'Best building materials supplier in the area. Wide variety and competitive rates.' },
    { author: 'Arjun Reddy', rating: 5, text: 'Outstanding customer support via WhatsApp. Got instant quotes and paid advance through UPI. Very convenient!' },
    { author: 'Sneha Patil', rating: 4, text: 'Nice showroom with good display of products. Staff is knowledgeable and guided us well.' },
  ];

  const cards = sampleReviews.map((r) => `
    <div class="review-card">
      <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <p class="review-text">"${r.text}"</p>
      <p class="review-author">— ${r.author}</p>
    </div>`).join('');

  const track = document.getElementById('reviewTickerTrack');
  if (track) track.innerHTML = cards + cards;
}

/** Render (or re-render) the category grid with the given list. */
function renderCategories(list) {
  const grid = document.getElementById('categoryGrid');
  if (!grid) return;

  if (!list || !list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">No categories found.</div>`;
    return;
  }

  grid.innerHTML = list
    .map((c) => {
      const imgSrc = c.image_url || 'placeholder.png';
      return `
        <a href="category.html?slug=${c.slug}" class="card category-card">
            <div class="card-img-container" style="padding-top:60%;">
                <img src="${imgSrc}" class="card-img" alt="${c.name}" onerror="this.src='placeholder.png'">
            </div>
            <div class="card-body">
                <h3 class="card-title">${c.name}</h3>
                <span class="category-count">${c.product_count || 0} Products</span>
            </div>
        </a>`;
    })
    .join('');
}
