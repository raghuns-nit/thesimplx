// ============================================================
// admin.js — Admin panel core logic (Supabase)
// Tab switching, modal management, dashboard stats, settings, enquiries.
// Depends on supabase-client.js, storage.js, auth.js, activity.js,
//            categories.js, products.js
// ============================================================

// ── Tab switching ─────────────────────────────────────────────

function switchTab(tabId, element = null) {
  document.querySelectorAll('.admin-nav-item').forEach((el) => el.classList.remove('active'));
  if (element) element.classList.add('active');

  document.querySelectorAll('.tab-content').forEach((el) => el.classList.add('hidden'));
  const targetPanel = document.getElementById('tab-' + tabId);
  if (targetPanel) targetPanel.classList.remove('hidden');

  const titles = {
    dashboard: 'Dashboard',
    categories: 'Manage Categories',
    products: 'Manage Products',
    enquiries: 'Customer Enquiries',
    settings: 'Site Settings',
    activity: 'Activity Logs',
  };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.innerText = titles[tabId] || 'Dashboard';

  if (tabId === 'enquiries' && typeof loadEnquiries === 'function') loadEnquiries();
  if (tabId === 'activity' && typeof loadActivityLogs === 'function') loadActivityLogs();

  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('open')) sidebar.classList.remove('open');
}

// ── Modal helpers ─────────────────────────────────────────────

function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.getElementById(id.replace('Modal', 'Form'))?.reset();

  if (id === 'categoryModal') {
    const titleEl = document.getElementById('categoryModalTitle');
    const hintEl = document.getElementById('cat_image_hint');
    const preview = document.getElementById('cat_slug_preview');
    if (titleEl) titleEl.innerText = 'Add Category';
    if (hintEl) hintEl.innerText = '(required)';
    if (preview) preview.value = '';
    window.editingCategoryId = null;
  }
  if (id === 'productModal') {
    const titleEl = document.getElementById('productModalTitle');
    const hintEl = document.getElementById('prod_images_hint');
    if (titleEl) titleEl.innerText = 'Add Product';
    if (hintEl) hintEl.innerText = '(required for new products)';
    window.editingProductId = null;
  }
}

// ── App entry point ───────────────────────────────────────────

window.addEventListener('supabaseReady', async function () {
  if (!(await validateAdminSession())) {
    window.location.href = 'admin-login.html';
    return;
  }

  document.getElementById('adminUserEmail').innerText = STATE.userEmail;

  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn) {
    menuBtn.style.display = '';
    menuBtn.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }

  await loadDashboardData();
  await initCategories();
  await initProducts();
  await initSettings();
});

// ── Dashboard ─────────────────────────────────────────────────

async function loadDashboardData() {
  showLoader('Loading Dashboard...');

  const [cats, prods, logs, enquiries] = await Promise.all([
    loadCategories(),
    loadProducts(),
    loadActivityLogsFromDB(),
    loadEnquiriesFromDB(),
  ]);
  window._enquiriesCache = enquiries;

  document.getElementById('stat-categories').innerText = cats.length;
  document.getElementById('stat-products').innerText = prods.length;
  document.getElementById('stat-activity').innerText = logs.length;

  const pendingCount = enquiries.filter((e) => e.status !== 'Closed').length;
  document.getElementById('stat-enquiries').innerText = pendingCount;

  hideLoader();
}

// ── Enquiries tab ─────────────────────────────────────────────

async function loadEnquiries() {
  showLoader('Loading Enquiries...');

  const enquiries = await loadEnquiriesFromDB();
  window._enquiriesCache = enquiries;
  const tbody = document.getElementById('enquiriesTableBody');
  if (!tbody) { hideLoader(); return; }

  if (!enquiries.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:2rem; color:var(--text-muted);">No enquiries yet.</td></tr>';
    hideLoader();
    return;
  }

  tbody.innerHTML = enquiries.map((e) => {
    const badgeClass = e.status === 'Closed' ? 'badge-success' : e.status === 'Assigned' ? 'badge-warning' : 'badge-info';
    return `
      <tr>
        <td><small>${new Date(e.created_at).toLocaleString()}</small></td>
        <td>
          <strong>${e.name}</strong><br>
          <small class="text-muted">Assigned: <span style="color:var(--primary);">${e.assignee || 'Unassigned'}</span></small>
        </td>
        <td>${e.phone}<br><small>${e.email || '—'}</small></td>
        <td style="max-width:240px; white-space:pre-wrap;">${e.message}</td>
        <td style="max-width:180px; font-size:0.85rem; color:var(--text-muted);">${e.comment || ''}</td>
        <td>
          <span class="badge ${badgeClass}">${e.status}</span>
        </td>
        <td>
          <button class="btn btn-outline" style="padding:0.25rem 0.5rem;" onclick="openEnquiryModal('${e.id}')">Update</button>
        </td>
      </tr>`;
  }).join('');

  hideLoader();
}

async function loadEnquiriesFromDB() {
  return loadEnquiries();
}

async function loadActivityLogsFromDB() {
  return loadActivityLogs();
}

// ── Enquiries Update Handlers ─────────────────────────────────

function openEnquiryModal(id) {
  // Fetch the enquiry from the table data
  const enquiries = window._enquiriesCache || [];
  const e = enquiries.find((x) => x.id === id);
  if (!e) return;

  document.getElementById('enq_id').value = id;
  document.getElementById('enq_assignee').value = e.assignee || '';
  document.getElementById('enq_status').value = e.status || 'New';
  document.getElementById('enq_comment').value = e.comment || '';

  openModal('enquiryModal');
}

async function handleSaveEnquiryMeta(e) {
  e.preventDefault();
  const id = document.getElementById('enq_id').value;

  showLoader('Saving update...');

  await updateEnquiry(id, {
    assignee: document.getElementById('enq_assignee').value.trim(),
    status: document.getElementById('enq_status').value,
    comment: document.getElementById('enq_comment').value.trim(),
  });

  await logActivity('UPDATE_ENQUIRY', 'enquiry', id);

  closeModal('enquiryModal');
  await loadEnquiries();
  await loadDashboardData();
}

// ── Activity Logs tab ─────────────────────────────────────────

async function loadActivityLogs() {
  showLoader('Loading Activity Logs...');
  const data = await loadActivityLogsFromDB();
  const tbody = document.getElementById('activityTableBody');
  if (!tbody) { hideLoader(); return; }

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:2rem; color:var(--text-muted);">No activity yet.</td></tr>';
    hideLoader();
    return;
  }

  tbody.innerHTML = data.map((l) => `
    <tr>
      <td><small>${l.created_at ? new Date(l.created_at).toLocaleString() : '—'}</small></td>
      <td>${l.username || '—'}</td>
      <td><span class="badge badge-warning">${l.action || '—'}</span></td>
      <td>${l.entity_type || '—'}</td>
      <td><small class="text-muted">${l.entity_id || '—'}</small></td>
    </tr>
  `).join('');
  hideLoader();
}

// ── Settings ──────────────────────────────────────────────────

async function initSettings() {
  const s = await loadSettings();
  const fields = ['company_name', 'phone', 'whatsapp', 'email', 'address', 'upi_id'];
  fields.forEach((key) => {
    const el = document.getElementById('set_' + key);
    if (el && s[key]) el.value = s[key];
  });
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const fields = ['company_name', 'phone', 'whatsapp', 'email', 'address', 'upi_id'];
  const settings = {};
  fields.forEach((key) => {
    const el = document.getElementById('set_' + key);
    if (el) settings[key] = el.value.trim();
  });

  const ok = await saveSettings(settings);
  if (ok) {
    await logActivity('UPDATE_SETTINGS', 'settings', 'global');
    alert('Settings saved successfully!');
  }
}
