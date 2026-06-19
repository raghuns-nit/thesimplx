// ============================================================
// auth.js — Google OAuth login / logout / session validation
// Depends on drive.js (accessToken, STATE, showLoader, hideLoader, initDriveStructure)
//           storage.js (loadJson, saveJson)
// ============================================================

/** Prompt the user to sign in with Google. */
async function handleLogin() {
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

/**
 * Sign the current admin out.
 * FIX: capture the token BEFORE nulling it — revoke() needs the actual value.
 */
function handleLogout() {
    const token = accessToken;   // capture first
    accessToken        = null;
    STATE.userEmail    = null;

    if (token) {
        google.accounts.oauth2.revoke(token, () => {
            window.location.href = 'admin-login.html';
        });
    } else {
        window.location.href = 'admin-login.html';
    }
}

/**
 * Check that the signed-in Google account is in admins.json.
 * On the very first login (admins.json is empty) the current user
 * is automatically registered as super_admin.
 * Returns true if access is granted, false otherwise.
 */
async function validateAdminSession() {
    console.log('[auth.js] validateAdminSession() starting...');
    if (!accessToken) {
        console.log('[auth.js] ❌ No access token');
        return false;
    }

    showLoader('Validating session...');
    try {
        // 0. Initialize Drive structure if not already done (needed for login page)
        console.log('[auth.js] STATE.catalogFolderId =', STATE.catalogFolderId);
        if (!STATE.catalogFolderId) {
            console.log('[auth.js] Drive structure not initialized, initializing now...');
            // Call initDriveStructure from drive.js
            await initDriveStructure();
            console.log('[auth.js] Drive structure initialized, STATE:', STATE);
        }

        // 1. Fetch the signed-in user's email from Google
        console.log('[auth.js] Fetching user info from Google...');
        const res      = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const userInfo = await res.json();
        STATE.userEmail = userInfo.email;
        console.log('[auth.js] User email:', STATE.userEmail);

        // 2. Load the admin list from Drive
        console.log('[auth.js] Loading admins.json from Drive...');
        let admins = await loadJson('admins.json');
        admins = admins || [];   // defensive: loadJson may return null on error
        console.log('[auth.js] Found', admins.length, 'admins');

        // 3. First-run bootstrap — register the first user as super_admin
        if (admins.length === 0) {
            console.log('[auth.js] No admins found, registering first user as super_admin...');
            admins.push({ email: STATE.userEmail, role: 'super_admin', enabled: true });
            await saveJson('admins.json', admins);
            console.log('[auth.js] ✅ First user registered as super_admin');
            return true;
        }

        // 4. Check the admin list
        console.log('[auth.js] Checking if user is in admin list...');
        const found = admins.find(a => a.email === STATE.userEmail && a.enabled === true);
        if (found) {
            console.log('[auth.js] ✅ User is authorized admin:', found.role);
            return true;
        } else {
            console.log('[auth.js] ❌ User not in admin list or disabled');
            return false;
        }

    } catch (e) {
        console.error('[auth.js] ❌ validateAdminSession error:', e);
        return false;
    } finally {
        hideLoader();
    }
}
