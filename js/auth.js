// ============================================================
// auth.js — Supabase email/password login, logout, session check
// Replaces Google OAuth flow.
// Depends on supabase-client.js (window.sb), storage.js (showLoader, hideLoader)
// ============================================================

// Global state kept for backward compatibility with other scripts
const STATE = {
  userEmail: null,
  rootFolderId: null,
  catalogFolderId: null,
  imagesFolderId: null,
};
let accessToken = null; // kept for any code that checks this flag

// ── Login ─────────────────────────────────────────────────────

async function handleLogin(email, password) {
  showLoader('Signing in...');
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    accessToken = data.session?.access_token || 'supabase';
    STATE.userEmail = data.user?.email;
    hideLoader();
    return { success: true };
  } catch (err) {
    hideLoader();
    return { success: false, message: err.message || 'Login failed' };
  }
}

// ── Sign up (first admin) ─────────────────────────────────────

async function handleSignUp(email, password) {
  showLoader('Creating account...');
  try {
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
    hideLoader();
    return { success: true, user: data.user };
  } catch (err) {
    hideLoader();
    return { success: false, message: err.message || 'Sign up failed' };
  }
}

// ── Logout ────────────────────────────────────────────────────

async function handleLogout() {
  await sb.auth.signOut();
  accessToken = null;
  STATE.userEmail = null;
  window.location.href = 'admin-login.html';
}

// ── Session validation ───────────────────────────────────────

async function validateAdminSession() {
  try {
    const { data: { session }, error } = await sb.auth.getSession();
    if (!session || error) return false;

    // Refresh user info
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return false;

    accessToken = session.access_token;
    STATE.userEmail = user.email;
    return true;
  } catch (e) {
    console.error('validateAdminSession:', e);
    return false;
  }
}
