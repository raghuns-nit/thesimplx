// ============================================================
// storage.js — Supabase data layer (replaces Google Drive JSON)
// Exposes loadCategories, saveCategories, loadProducts, saveProducts,
//          loadSettings, saveSettings, loadEnquiries, saveEnquiry,
//          loadActivityLogs, logActivity, uploadImage.
// All public reads use the anon key; admin writes require an
// authenticated session (set up by auth.js).
// ============================================================

// ── Loader helpers (kept for backward compatibility) ─────────
function showLoader(msg = 'Loading...') {
  let loader = document.getElementById('globalLoader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'globalLoader';
    loader.className = 'loader-container';
    loader.innerHTML = `<div class="spinner"></div><p id="loaderMsg" style="font-weight:600;">${msg}</p>`;
    document.body.appendChild(loader);
  } else {
    const m = document.getElementById('loaderMsg');
    if (m) m.innerText = msg;
  }
  loader.classList.add('active');
}

function hideLoader() {
  const loader = document.getElementById('globalLoader');
  if (loader) loader.classList.remove('active');
}

// ── Categories ────────────────────────────────────────────────

async function loadCategories() {
  const { data, error } = await sb.from('categories').select('*').order('sort_order', { ascending: true });
  if (error) { console.error('loadCategories:', error); return []; }
  return data || [];
}

async function saveCategories(cats) {
  // Not used with Supabase — individual upserts are used instead.
  // Kept for backward compatibility but does nothing.
  return true;
}

// ── Products ──────────────────────────────────────────────────

async function loadProducts() {
  const { data, error } = await sb.from('products').select('*').order('sort_order', { ascending: true });
  if (error) { console.error('loadProducts:', error); return []; }
  return data || [];
}

async function loadProductsByCategory(categoryId) {
  const { data, error } = await sb.from('products')
    .select('*')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true });
  if (error) { console.error('loadProductsByCategory:', error); return []; }
  return data || [];
}

async function saveProducts(prods) {
  return true; // Not used with Supabase — individual upserts instead.
}

// ── Settings ──────────────────────────────────────────────────

async function loadSettings() {
  const { data, error } = await sb.from('settings').select('*').eq('id', 1).maybeSingle();
  if (error) { console.error('loadSettings:', error); return {}; }
  return data || {};
}

async function saveSettings(settings) {
  const { error } = await sb.from('settings').upsert({
    id: 1,
    ...settings,
    updated_at: new Date().toISOString()
  });
  if (error) { console.error('saveSettings:', error); return false; }
  return true;
}

// ── Enquiries ────────────────────────────────────────────────

async function loadEnquiries() {
  const { data, error } = await sb.from('enquiries').select('*').order('created_at', { ascending: false });
  if (error) { console.error('loadEnquiries:', error); return []; }
  return data || [];
}

async function insertEnquiry(enquiry) {
  const { data, error } = await sb.from('enquiries').insert(enquiry).select().single();
  if (error) { console.error('insertEnquiry:', error); return null; }
  return data;
}

async function updateEnquiry(id, updates) {
  const { error } = await sb.from('enquiries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { console.error('updateEnquiry:', error); return false; }
  return true;
}

// ── Activity Logs ────────────────────────────────────────────

async function loadActivityLogs() {
  const { data, error } = await sb.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) { console.error('loadActivityLogs:', error); return []; }
  return data || [];
}

async function logActivity(action, entityType, entityId) {
  try {
    const { data: { user } } = await sb.auth.getUser();
    const { error } = await sb.from('activity_logs').insert({
      username: user?.email || 'system',
      action,
      entity_type: entityType,
      entity_id: entityId
    });
    if (error) console.error('logActivity:', error);
  } catch (e) {
    console.error('logActivity exception:', e);
  }
}

// ── Image upload (Supabase Storage) ──────────────────────────

async function uploadImage(file, folder, filename) {
  if (!filename) filename = file.name;
  const path = `${folder}/${filename}`;

  const { data, error } = await sb.storage
    .from('product-images')
    .upload(path, file, { upsert: true });

  if (error) {
    console.error('uploadImage:', error);
    return null;
  }

  const { data: urlData } = sb.storage
    .from('product-images')
    .getPublicUrl(path);

  return urlData.publicUrl;
}

// ── Backward-compat: loadJson / saveJson shims ────────────────
// These map old Drive JSON filenames to the new Supabase tables
// so that any code still calling loadJson('xxx.json') keeps working.

async function loadJson(filename) {
  if (!window.sb) return filename === 'settings.json' ? {} : [];
  if (filename === 'categories.json') return loadCategories();
  if (filename === 'products.json') return loadProducts();
  if (filename === 'settings.json') return loadSettings();
  if (filename === 'activity_logs.json') return loadActivityLogs();
  if (filename === 'enquiries_meta.json') return {};
  return filename === 'settings.json' ? {} : [];
}

async function saveJson(filename, data) {
  if (!window.sb) return false;
  if (filename === 'settings.json') return saveSettings(data);
  // categories.json and products.json are saved via individual upserts
  // in categories.js / products.js, not via bulk save.
  return true;
}
