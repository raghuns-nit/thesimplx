
// Admin Panel Core Logic

function switchTab(tabId) {
    // Update nav classes
    document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    
    // Show selected
    document.getElementById('tab-' + tabId).classList.remove('hidden');
    
    // Update Title
    const titles = {
        'dashboard': 'Dashboard', 'categories': 'Manage Categories', 
        'products': 'Manage Products', 'brands': 'Manage Brands',
        'enquiries': 'Enquiries', 'settings': 'Settings', 'activity': 'Activity Logs'
    };
    document.getElementById('pageTitle').innerText = titles[tabId] || 'Dashboard';
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { 
    document.getElementById(id).classList.remove('active'); 
    document.getElementById(id.replace('Modal', 'Form'))?.reset();
}

window.onAppReady = async function() {
    if(!accessToken || !(await validateAdminSession())) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    document.getElementById('adminUserEmail').innerText = STATE.userEmail;
    
    // Initialize Data
    await loadDashboardData();
    await initCategories();
    await initProducts();
    await initSettings();
};

async function loadDashboardData() {
    showLoader("Loading Dashboard...");
    const cats = await loadJson('categories.json');
    const prods = await loadJson('products.json');
    const logs = await loadJson('activity_logs.json');
    
    document.getElementById('stat-categories').innerText = cats.length;
    document.getElementById('stat-products').innerText = prods.length;
    document.getElementById('stat-activity').innerText = logs.length;
    hideLoader();
}

async function initSettings() {
    const settings = await loadJson('settings.json');
    if(settings.companyName) document.getElementById('set_companyName').value = settings.companyName;
    if(settings.whatsapp) document.getElementById('set_whatsapp').value = settings.whatsapp;
    if(settings.email) document.getElementById('set_email').value = settings.email;
    if(settings.upiId) document.getElementById('set_upiId').value = settings.upiId;
}

async function handleSaveSettings(e) {
    e.preventDefault();
    const settings = {
        companyName: document.getElementById('set_companyName').value,
        whatsapp: document.getElementById('set_whatsapp').value,
        email: document.getElementById('set_email').value,
        upiId: document.getElementById('set_upiId').value
    };
    
    await saveJson('settings.json', settings);
    await logActivity('UPDATE_SETTINGS', 'settings', 'global');
    alert("Settings saved successfully!");
}

// Mobile menu toggle
document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});
