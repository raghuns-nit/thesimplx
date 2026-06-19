// ============================================================
// admin.js — Admin panel core logic
// Tab switching, modal management, dashboard stats, settings.
// Depends on drive.js, storage.js, auth.js, activity.js,
//            categories.js, products.js
// ============================================================

// ── Tab switching ─────────────────────────────────────────────

function switchTab(tabId, element = null) {
    // 1. Update sidebar active state safely
    document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
    
    if (element) {
        element.classList.add('active'); // If element passed explicitly
    } else if (typeof event !== 'undefined' && event && event.currentTarget) {
        event.currentTarget.classList.add('active'); // Fallback to window.event
    }

    // 2. Hide all tab panels, show the selected one safely
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    
    const targetPanel = document.getElementById('tab-' + tabId);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
    } else {
        console.error(`[Navigation Error] Could not find HTML element with id="tab-${tabId}"`);
    }

    // 3. Update header title
    const titles = {
        dashboard:  'Dashboard',
        categories: 'Manage Categories',
        products:   'Manage Products',
        enquiries:  'Customer Enquiries',
        settings:   'Site Settings',
        activity:   'Activity Logs'
    };
    
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) {
        titleEl.innerText = titles[tabId] || 'Dashboard';
    }

    // 4. Lazy-load data for tabs that fetch on demand
    if (tabId === 'enquiries' && typeof loadEnquiries === 'function') loadEnquiries();
    if (tabId === 'activity' && typeof loadActivityLogs === 'function') loadActivityLogs();
}

// ── Modal helpers ─────────────────────────────────────────────

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    // Reset the form inside the modal
    document.getElementById(id.replace('Modal', 'Form'))?.reset();

    // Reset modal title and editing state so reopening always shows Add mode
    if (id === 'categoryModal') {
        const titleEl = document.getElementById('categoryModalTitle');
        const hintEl  = document.getElementById('cat_image_hint');
        const preview = document.getElementById('cat_slug_preview');
        if (titleEl)  titleEl.innerText = 'Add Category';
        if (hintEl)   hintEl.innerText  = '(required)';
        if (preview)  preview.value     = '';
        window.editingCategoryId = null;
    }
    if (id === 'productModal') {
        const titleEl = document.getElementById('productModalTitle');
        const hintEl  = document.getElementById('prod_images_hint');
        if (titleEl) titleEl.innerText = 'Add Product';
        if (hintEl)  hintEl.innerText  = '(required for new products)';
        window.editingProductId = null;
    }
}

// ── App entry point ───────────────────────────────────────────

window.onAppReady = async function () {
    if (!accessToken || !(await validateAdminSession())) {
        window.location.href = 'admin-login.html';
        return;
    }

    document.getElementById('adminUserEmail').innerText = STATE.userEmail;

    // Mobile sidebar toggle — moved here so DOM is guaranteed ready
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
        menuBtn.style.display = '';          // make it visible
        menuBtn.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
    }

    // Load all panel data
    await loadDashboardData();
    await initCategories();
    await initProducts();
    await initSettings();
};

// ── Dashboard ─────────────────────────────────────────────────

async function loadDashboardData() {
    showLoader('Loading Dashboard...');
    const [cats, prods, logs, enqs] = await Promise.all([
        loadJson('categories.json'),
        loadJson('products.json'),
        loadJson('activity_logs.json'),
        loadJson('enquiries.json')
    ]);

    document.getElementById('stat-categories').innerText = cats.length;
    document.getElementById('stat-products').innerText   = prods.length;
    document.getElementById('stat-activity').innerText   = logs.length;
    // FIX: count only Pending enquiries (was always 0 before)
    document.getElementById('stat-enquiries').innerText  =
        enqs.filter(e => e.status === 'Pending').length;

    hideLoader();
}

// ── Enquiries tab ─────────────────────────────────────────────

async function loadEnquiries() {
    showLoader('Loading Enquiries...');
    const data  = await loadJson('enquiries.json');
    const tbody = document.getElementById('enquiriesTableBody');
    if (!tbody) { hideLoader(); return; }

    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:2rem; color:var(--text-muted);">No enquiries yet.</td></tr>';
        hideLoader();
        return;
    }

    tbody.innerHTML = data.map(e => `
        <tr>
            <td><small>${e.date ? new Date(e.date).toLocaleString() : '—'}</small></td>
            <td><strong>${e.name || '—'}</strong></td>
            <td>${e.phone || '—'}</td>
            <td>${e.email || '—'}</td>
            <td style="max-width:260px; white-space:pre-wrap;">${e.message || '—'}</td>
            <td>
                <span class="badge ${e.status === 'Pending' ? 'badge-warning' : 'badge-success'}">
                    ${e.status || 'Unknown'}
                </span>
            </td>
        </tr>
    `).join('');
    hideLoader();
}

// ── Activity Logs tab ─────────────────────────────────────────

async function loadActivityLogs() {
    showLoader('Loading Activity Logs...');
    const data  = await loadJson('activity_logs.json');
    const tbody = document.getElementById('activityTableBody');
    if (!tbody) { hideLoader(); return; }

    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:2rem; color:var(--text-muted);">No activity yet.</td></tr>';
        hideLoader();
        return;
    }

    tbody.innerHTML = data.map(l => `
        <tr>
            <td><small>${l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}</small></td>
            <td>${l.username || '—'}</td>
            <td><span class="badge badge-warning">${l.action || '—'}</span></td>
            <td>${l.entityType || '—'}</td>
            <td><small class="text-muted">${l.entityId || '—'}</small></td>
        </tr>
    `).join('');
    hideLoader();
}

// ── Settings ──────────────────────────────────────────────────

async function initSettings() {
    const s = await loadJson('settings.json');
    // Populate all 6 fields (phone and address are new)
    const fields = ['companyName', 'phone', 'whatsapp', 'email', 'address', 'upiId'];
    fields.forEach(key => {
        const el = document.getElementById('set_' + key);
        if (el && s[key]) el.value = s[key];
    });
}

async function handleSaveSettings(e) {
    e.preventDefault();
    const fields   = ['companyName', 'phone', 'whatsapp', 'email', 'address', 'upiId'];
    const settings = {};
    fields.forEach(key => {
        const el = document.getElementById('set_' + key);
        if (el) settings[key] = el.value.trim();
    });

    const ok = await saveJson('settings.json', settings);
    if (ok) {
        await logActivity('UPDATE_SETTINGS', 'settings', 'global');
        alert('Settings saved successfully!');
    }
}
