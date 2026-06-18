
// Google Drive API Integration
// IMPORTANT: Replace with actual credentials before deployment
const CONFIG = {
    CLIENT_ID: "183445643227-np500mtqtb4l2ut2aqdlkg4nshvuihla.apps.googleusercontent.com", // e.g. xxxx.apps.googleusercontent.com
    API_KEY: "AIzaSyASW9A6nn7FvE4n1hzdVVvcHLvaKI0t4aU",
    DISCOVERY_DOCS: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    SCOPES: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email"
};

let tokenClient;
let gapiInited = false;
let gisInited = false;
let accessToken = null;

// Temporary in-memory state
const STATE = {
    rootFolderId: null,
    catalogFolderId: null,
    imagesFolderId: null,
    userEmail: null
};

// Loading Indicator
function showLoader(msg = "Loading...") {
    let loader = document.getElementById('globalLoader');
    if(!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'loader-container';
        loader.innerHTML = `<div class="spinner"></div><p id="loaderMsg" style="font-weight:600;">${msg}</p>`;
        document.body.appendChild(loader);
    } else {
        document.getElementById('loaderMsg').innerText = msg;
    }
    loader.classList.add('active');
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if(loader) loader.classList.remove('active');
}

// Initialization callbacks from Google scripts
function gapiLoaded() { gapi.load('client', initializeGapiClient); }
async function initializeGapiClient() {
    await gapi.client.init({ apiKey: CONFIG.API_KEY, discoveryDocs: CONFIG.DISCOVERY_DOCS });
    gapiInited = true;
    checkAuthAndInit();
}
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.CLIENT_ID,
        scope: CONFIG.SCOPES,
        callback: (response) => {
            if (response.error !== undefined) { throw (response); }
            accessToken = response.access_token;
            checkAuthAndInit();
        },
    });
    gisInited = true;
}

// App Initialization Flow
async function checkAuthAndInit() {
    if (gapiInited && gisInited) {
        // If we are on admin pages, ensure token exists
        if(window.location.pathname.includes('admin') && !window.location.pathname.includes('admin-login')) {
            if(!accessToken) {
                window.location.href = 'admin-login.html';
                return;
            }
            await initDriveStructure();
            if(typeof window.onAppReady === 'function') window.onAppReady();
        } else if(window.location.pathname.includes('admin-login')) {
             if(typeof window.onAppReady === 'function') window.onAppReady();
        } else {
            // Public pages - require token for read/write in this "database as drive" architecture
            // In a real public scenario with API key, you'd share files publicly. 
            // For this prompt's constraints (direct read/write without backend), we assume public needs read access.
            // Simplified: require token for everything for robust operation, 
            // OR use API Key for public reads if folders are public.
            // Assuming token is required to ensure consistent read/write without complex permission management for now.
            if(!accessToken) {
                 // Try to get token quietly or prompt. For simplicity, redirect to login if no token.
                 // In production, public files should have "anyone with link can view" permissions to use API_KEY only.
                 console.log("Public page: attempting read operations");
            }
            if(typeof window.onAppReady === 'function') window.onAppReady();
        }
    }
}

// Drive API Helper functions
async function findFile(name, parentId = 'root', mimeType = null) {
    let q = `name='${name}' and trashed=false`;
    if(parentId) q += ` and '${parentId}' in parents`;
    if(mimeType) q += ` and mimeType='${mimeType}'`;
    
    let requestOptions = {
        path: 'https://www.googleapis.com/drive/v3/files',
        method: 'GET',
        params: { q: q, fields: 'files(id, name, mimeType)' }
    };
    
    // Add token if available, otherwise rely on API key (might fail if not public)
    if(accessToken) requestOptions.headers = { 'Authorization': `Bearer ${accessToken}` };
    
    try {
        const response = await gapi.client.request(requestOptions);
        const files = response.result.files;
        return files && files.length > 0 ? files[0] : null;
    } catch(e) {
        console.error("Find File Error", e);
        return null;
    }
}

async function createFolder(name, parentId = 'root') {
    const fileMetadata = { name: name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] };
    try {
        const response = await gapi.client.drive.files.create({ resource: fileMetadata, fields: 'id' });
        return response.result.id;
    } catch(e) { console.error("Create Folder Error", e); throw e; }
}

async function initDriveStructure() {
    showLoader("Initializing Storage...");
    try {
        // 1. theSimpLx root
        let root = await findFile('theSimpLx', 'root', 'application/vnd.google-apps.folder');
        if(!root) STATE.rootFolderId = await createFolder('theSimpLx', 'root');
        else STATE.rootFolderId = root.id;

        // 2. catalog folder
        let catalog = await findFile('catalog', STATE.rootFolderId, 'application/vnd.google-apps.folder');
        if(!catalog) STATE.catalogFolderId = await createFolder('catalog', STATE.rootFolderId);
        else STATE.catalogFolderId = catalog.id;

        // 3. images folder
        let images = await findFile('images', STATE.rootFolderId, 'application/vnd.google-apps.folder');
        if(!images) STATE.imagesFolderId = await createFolder('images', STATE.rootFolderId);
        else STATE.imagesFolderId = images.id;

        console.log("Drive Structure Initialized", STATE);
    } catch(e) {
        alert("Failed to initialize Google Drive structure. Check console.");
    } finally {
        hideLoader();
    }
}
