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
        element.classList.add('active'); 
    } else if (typeof event !== 'undefined' && event && event.currentTarget) {
        event.currentTarget.classList.add('active'); 
    }

    // 2. Hide all tab panels, show the selected one safely
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    
    const targetPanel = document.getElementById('tab-' + tabId);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
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
    if (titleEl) titleEl.innerText = titles[tabId] || 'Dashboard';

    // 4. Lazy-load data
    if (tabId === 'enquiries' && typeof loadEnquiries === 'function') loadEnquiries();
    if (tabId === 'activity' && typeof loadActivityLogs === 'function') loadActivityLogs();

    // -------------------------------------------------------------
    // FIX: Close the mobile sidebar automatically after clicking a tab
    // -------------------------------------------------------------
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }
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
// Helper to fetch live data directly from Google Sheets
async function fetchEnquiriesFromSheet() {
    // ⚠️ REPLACE THIS WITH YOUR ACTUAL SHEET ID
    const SHEET_ID = '1wGARZVJsCshgdpCdPJv5MlZ22hKlULJlJYp7GIUq9gY'; 
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
    
    try {
        const response = await fetch(url);
        const text = await response.text();
        // Strip out the Google wrapper to get pure JSON
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonString);
        return data.table.rows || [];
    } catch (error) {
        console.error("Error fetching Google Sheet:", error);
        return [];
    }
}

async function loadDashboardData() {
    showLoader('Loading Dashboard...');

    // Fetch the standard data, PLUS the new metadata file (default to {} if it doesn't exist yet)
    const [cats, prods, logs, sheetRows, meta] = await Promise.all([
        loadJson('categories.json'),
        loadJson('products.json'),
        loadJson('activity_logs.json'),
        fetchEnquiriesFromSheet(),
        loadJson('enquiries_meta.json').catch(() => ({})) 
    ]);

    document.getElementById('stat-categories').innerText = cats.length;
    document.getElementById('stat-products').innerText   = prods.length;
    document.getElementById('stat-activity').innerText   = logs.length;

    // Calculate actual Pending count based on the metadata
    const metaObj = Array.isArray(meta) ? {} : meta;
    let pendingCount = 0;
    
    sheetRows.forEach(row => {
        const id = row.c[0] ? (row.c[0].f || row.c[0].v) : '—';
        const customData = metaObj[id] || {};
        if (customData.status !== 'Closed') {
            pendingCount++;
        }
    });

    document.getElementById('stat-enquiries').innerText = pendingCount;
    hideLoader();
}

// ── Enquiries tab ─────────────────────────────────────────────

async function loadEnquiries() {
    showLoader('Loading Enquiries...');
    
    // 1. Fetch BOTH the read-only Google Sheet and the read-write Drive JSON
    const [rows, meta] = await Promise.all([
        fetchEnquiriesFromSheet(),
        loadJson('enquiries_meta.json').catch(() => ({}))
    ]);

    // Save meta globally so the modal can access it
    window.enquiriesMeta = Array.isArray(meta) ? {} : meta;

    const tbody = document.getElementById('enquiriesTableBody');
    if (!tbody) { hideLoader(); return; }

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:2rem; color:var(--text-muted);">No enquiries yet.</td></tr>';
        hideLoader();
        return;
    }

    const reversedRows = rows.slice().reverse();

    // 2. Map through the rows and merge the data
    tbody.innerHTML = reversedRows.map(row => {
        const date    = row.c[0] ? (row.c[0].f || row.c[0].v) : '—';
        const name    = row.c[1] ? row.c[1].v : '—';
        const email   = row.c[2] ? row.c[2].v : '—';
        const phone   = row.c[3] ? row.c[3].v : '—';
        const message = row.c[4] ? row.c[4].v : '—';

        // Use the exact timestamp string as a unique ID to match records
        const id = date;

        // Pull the custom assignment/status from our JSON file
        const customData = window.enquiriesMeta[id] || {};
        const status     = customData.status || 'Pending';
        const assignee   = customData.assignee || 'Unassigned';
        const comment    = customData.comment || '';

        const badgeClass = status === 'Closed' ? 'badge-success' : 'badge-warning';

        return `
            <tr>
                <td><small>${date}</small></td>
                <td>
                    <strong>${name}</strong><br>
                    <small class="text-muted">Assigned: <span style="color:var(--primary);">${assignee}</span></small>
                </td>
                <td>${phone}<br><small>${email}</small></td>
                <td style="max-width:240px; white-space:pre-wrap;">${message}</td>
                <td style="max-width:180px; font-size:0.85rem; color:var(--text-muted);">${comment}</td>
                <td>
                    <span class="badge ${badgeClass}">${status}</span>
                </td>
                <td>
                    <button class="btn btn-outline" style="padding:0.25rem 0.5rem;" onclick="openEnquiryModal('${encodeURIComponent(id)}')">Update</button>
                </td>
            </tr>
        `;
    }).join('');
    
    hideLoader();
}

// ── Enquiries Update Handlers ─────────────────────────────────

function openEnquiryModal(encodedId) {
    const id = decodeURIComponent(encodedId);
    const customData = window.enquiriesMeta[id] || {};

    // Populate the modal with existing data
    document.getElementById('enq_id').value = id;
    document.getElementById('enq_assignee').value = customData.assignee || '';
    document.getElementById('enq_status').value = customData.status || 'Pending';
    document.getElementById('enq_comment').value = customData.comment || '';

    openModal('enquiryModal');
}

async function handleSaveEnquiryMeta(e) {
    e.preventDefault();
    const id = document.getElementById('enq_id').value;

    // Build or update the record for this specific enquiry
    window.enquiriesMeta[id] = {
        assignee: document.getElementById('enq_assignee').value.trim(),
        status: document.getElementById('enq_status').value,
        comment: document.getElementById('enq_comment').value.trim()
    };

    showLoader('Saving update...');
    
    // Save the updated metadata back to Google Drive
    await saveJson('enquiries_meta.json', window.enquiriesMeta);

    closeModal('enquiryModal');
    
    // Refresh the table and the dashboard pending count
    await loadEnquiries();
    await loadDashboardData(); 
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
