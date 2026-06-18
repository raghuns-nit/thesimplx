
// Authentication Logic
async function handleLogin() {
    tokenClient.requestAccessToken({prompt: 'consent'});
}

function handleLogout() {
    accessToken = null;
    STATE.userEmail = null;
    google.accounts.oauth2.revoke(accessToken, () => {
        window.location.href = 'admin-login.html';
    });
}

async function validateAdminSession() {
    if(!accessToken) return false;
    showLoader("Validating session...");
    try {
        // Get user info
        let response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        let userInfo = await response.json();
        STATE.userEmail = userInfo.email;
        
        // Check admins.json
        let admins = await loadJson('admins.json');
        
        // If empty (first run), add current user as super_admin
        if(admins.length === 0) {
            admins.push({ email: STATE.userEmail, role: 'super_admin', enabled: true });
            await saveJson('admins.json', admins);
            return true;
        }
        
        const isAdmin = admins.find(a => a.email === STATE.userEmail && a.enabled === true);
        return !!isAdmin;

    } catch(e) {
        console.error("Validation error", e);
        return false;
    } finally {
        hideLoader();
    }
}
