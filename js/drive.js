// ============================================================
// Google Drive API Integration — drive.js
// Low-level Drive helpers used by storage.js and the admin JS.
//
// Drive folder layout after first admin login:
//   theSimpLx/                  ← STATE.rootFolderId
//   ├── catalog/                ← STATE.catalogFolderId  (JSON data files)
//   └── images/                 ← STATE.imagesFolderId
//       └── <category_slug>/    (one per category, e.g. floor_tiles)
//           ├── category.jpg
//           ├── products/
//           │   └── <internalId>/
//           │       └── *.jpg
//           └── thumbnails/
//
// Public pages: Drive folders must be shared "Anyone with link → Viewer"
// so that API-key-only requests can read them without a login.
// ============================================================

const CONFIG = {
  CLIENT_ID:
    "183445643227-np500mtqtb4l2ut2aqdlkg4nshvuihla.apps.googleusercontent.com",
  API_KEY: "AIzaSyASW9A6nn7FvE4n1hzdVVvcHLvaKI0t4aU",
  DISCOVERY_DOCS: [
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
  ],
  SCOPES:
    "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email",
};

let tokenClient;
let gapiInited = false;
let gisInited = false;
// Restore token from session storage if it exists
let accessToken = sessionStorage.getItem('g_access_token') || null;

const STATE = {
  rootFolderId: '1QRtWBhQ2zD9DbdRL25i9dllssgiMnDH3',
  catalogFolderId: '1Wp2uw_wu6prl1rgGjFY8WeCPA2deUixq',
  imagesFolderId: '1Jvp9x_lNEMfgGQ46VaINpm7WTHzZ-yAY',
  userEmail: null,
};

// ── Loading overlay ──────────────────────────────────────────

function showLoader(msg = "Loading...") {
  let loader = document.getElementById("globalLoader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "globalLoader";
    loader.className = "loader-container";
    loader.innerHTML = `<div class="spinner"></div>
                            <p id="loaderMsg" style="font-weight:600;">${msg}</p>`;
    document.body.appendChild(loader);
  } else {
    document.getElementById("loaderMsg").innerText = msg;
  }
  loader.classList.add("active");
}

function hideLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.classList.remove("active");
}

// ── Google API init callbacks ────────────────────────────────

function gapiLoaded() {
  console.log('[drive.js] gapiLoaded() fired');
  gapi.load("client", initializeGapiClient);
}

async function initializeGapiClient() {
  console.log('[drive.js] initializeGapiClient() starting...');
  try {
    await gapi.client.init({
      apiKey: CONFIG.API_KEY,
      discoveryDocs: CONFIG.DISCOVERY_DOCS,
    });
    console.log('[drive.js] ✅ gapi.client initialized');

    // FIX: Apply the restored token directly to the Google API client
    if (accessToken) {
        gapi.client.setToken({ access_token: accessToken });
        console.log('[drive.js] ✅ Restored token applied to gapi.client');
    }

    gapiInited = true;
    checkAuthAndInit();
  } catch (e) {
    console.error('[drive.js] ❌ gapi.client.init error:', e);
  }
}

function gisLoaded() {
  console.log('[drive.js] gisLoaded() fired');
  try {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.CLIENT_ID,
      scope: CONFIG.SCOPES,
      callback: (response) => {
        console.log('[drive.js] OAuth callback received:', { hasError: !!response.error });
        if (response.error !== undefined) {
          console.error('[drive.js] OAuth error:', response);
          throw response;
        }
        accessToken = response.access_token;
        // Save the token so it survives the redirect to admin.html
        sessionStorage.setItem('g_access_token', accessToken);
        console.log('[drive.js] ✅ Access token acquired');
        checkAuthAndInit();
      },
    });
    console.log('[drive.js] ✅ tokenClient initialized');
    gisInited = true;
    // Notify the login page that tokenClient is ready (enables the button)
    if (typeof onGisReady === "function") {
      console.log('[drive.js] Calling onGisReady()');
      onGisReady();
    }
  } catch (e) {
    console.error('[drive.js] ❌ gisLoaded error:', e);
  }
}

// ── App boot flow ────────────────────────────────────────────

async function checkAuthAndInit() {
  console.log('[drive.js] checkAuthAndInit() — gapiInited:', gapiInited, 'gisInited:', gisInited);
  if (!gapiInited || !gisInited) {
    console.log('[drive.js] Waiting for both APIs to initialize...');
    return;
  }

  const path = window.location.pathname;
  console.log('[drive.js] Current path:', path);

  if (path.includes("admin") && !path.includes("admin-login")) {
    // Admin: OAuth token required + full read-write Drive setup
    console.log('[drive.js] Admin page detected, checking token...');
    if (!accessToken) {
      console.log('[drive.js] ❌ No token — redirecting to login');
      window.location.href = "admin-login.html?v=2";
      return;
    }
    console.log('[drive.js] ✅ Token present, initializing Drive structure...');
    await initDriveStructure();
    if (typeof window.onAppReady === "function") window.onAppReady();
  } else if (path.includes("admin-login")) {
    // Login page: no Drive setup needed
    console.log('[drive.js] Login page detected, calling onAppReady...');
    if (typeof window.onAppReady === "function") window.onAppReady();
  } else {
    // Public pages: discover folder IDs in read-only mode
    // so loadJson() can proceed without an OAuth token.
    console.log('[drive.js] Public page detected, initializing read-only Drive...');
    await initPublicDriveStructure();
    if (typeof window.onAppReady === "function") window.onAppReady();
  }
}

// ── Drive structure: PUBLIC (read-only) ─────────────────────

async function initPublicDriveStructure() {
  // Bypassing the 'root' search because IDs are permanently hardcoded in STATE
  console.log("Drive: Public structure connected successfully.");
  
  // Optional: A small delay just to ensure the UI transitions smoothly
  showLoader("Loading catalog...");
  setTimeout(() => hideLoader(), 500); 
}

// ── Drive structure: ADMIN (read-write) ──────────────────────

async function initDriveStructure() {
  showLoader("Initializing Storage...");
  try {
    let root = await findFile(
      "theSimpLx",
      "root",
      "application/vnd.google-apps.folder",
    );
    STATE.rootFolderId = root
      ? root.id
      : await createFolder("theSimpLx", "root");

    let catalog = await findFile(
      "catalog",
      STATE.rootFolderId,
      "application/vnd.google-apps.folder",
    );
    STATE.catalogFolderId = catalog
      ? catalog.id
      : await createFolder("catalog", STATE.rootFolderId);

    let images = await findFile(
      "images",
      STATE.rootFolderId,
      "application/vnd.google-apps.folder",
    );
    STATE.imagesFolderId = images
      ? images.id
      : await createFolder("images", STATE.rootFolderId);

    console.log("Drive: admin structure initialized", STATE);
  } catch (e) {
    alert("Failed to initialize Google Drive storage. See browser console.");
    console.error(e);
  } finally {
    hideLoader();
  }
}

// ── Low-level Drive helpers ──────────────────────────────────

/**
 * Find a file or folder by name inside a parent.
 * Uses OAuth token when available, falls back to API key (public reads).
 */
async function findFile(name, parentId = "root", mimeType = null) {
  let q = `name='${name}' and trashed=false`;
  if (parentId) q += ` and '${parentId}' in parents`;
  if (mimeType) q += ` and mimeType='${mimeType}'`;

  const opts = {
    path: "https://www.googleapis.com/drive/v3/files",
    method: "GET",
    params: { q, fields: "files(id, name, mimeType)" },
  };
  if (accessToken) opts.headers = { Authorization: `Bearer ${accessToken}` };

  try {
    const res = await gapi.client.request(opts);
    const files = res.result.files;
    return files && files.length > 0 ? files[0] : null;
  } catch (e) {
    console.error("Drive findFile error:", e);
    return null;
  }
}

/**
 * List all non-trashed children inside a folder.
 */
async function listFolder(folderId) {
  const opts = {
    path: "https://www.googleapis.com/drive/v3/files",
    method: "GET",
    params: {
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name, mimeType)",
    },
  };
  if (accessToken) opts.headers = { Authorization: `Bearer ${accessToken}` };

  try {
    const res = await gapi.client.request(opts);
    return res.result.files || [];
  } catch (e) {
    console.error("Drive listFolder error:", e);
    return [];
  }
}

/**
 * Create a folder inside a parent.  Returns the new folder ID.
 */
async function createFolder(name, parentId = "root") {
  try {
    const res = await gapi.client.drive.files.create({
      resource: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      },
      fields: "id",
    });
    return res.result.id;
  } catch (e) {
    console.error("Drive createFolder error:", e);
    throw e;
  }
}

/**
 * Permanently delete a file or folder (and all its contents).
 * Returns true on success, false on failure.
 */
async function deleteFile(fileId) {
  try {
    await gapi.client.drive.files.delete({ fileId });
    return true;
  } catch (e) {
    console.error("Drive deleteFile error:", e);
    return false;
  }
}

/**
 * Rename a file or folder.
 * Returns true on success, false on failure.
 */
async function renameFile(fileId, newName) {
  try {
    await gapi.client.drive.files.update({
      fileId,
      resource: { name: newName },
    });
    return true;
  } catch (e) {
    console.error("Drive renameFile error:", e);
    return false;
  }
}

/**
 * Make a Drive file publicly readable (anyone with link → viewer).
 * Called by uploadImage() in storage.js after every image upload.
 */
async function makePublic(fileId) {
  try {
    await gapi.client.drive.permissions.create({
      fileId,
      resource: { type: "anyone", role: "reader" },
    });
  } catch (e) {
    console.error("Drive makePublic error:", e);
  }
}
