// ============================================================
// auth.js — Google OAuth login / logout / session validation
// Depends on drive.js (accessToken, STATE, showLoader, hideLoader)
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
    if (!accessToken) return false;
    showLoader('Validating session...');
    try {
        // 1. Fetch the signed-in user's email from Google
        const res      = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const userInfo = await res.json();
        STATE.userEmail = userInfo.email;

        // 2. Load the admin list from Drive
        let admins = await loadJson('admins.json');
        admins = admins || [];   // defensive: loadJson may return null on error

        // 3. First-run bootstrap — register the first user as super_admin
        if (admins.length === 0) {
            admins.push({ email: STATE.userEmail, role: 'super_admin', enabled: true });
            await saveJson('admins.json', admins);
            return true;
        }

        // 4. Check the admin list
        const found = admins.find(a => a.email === STATE.userEmail && a.enabled === true);
        return !!found;

    } catch (e) {
        console.error('validateAdminSession error:', e);
        return false;
    } finally {
        hideLoader();
    }
}
