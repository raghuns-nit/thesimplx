// ============================================================
// supabase-client.js — Singleton Supabase client
// Loaded on every page (public + admin). Exposes window.sb.
// ============================================================

const SUPABASE_URL = window.SUPABASE_URL || 'https://jnfuiahvibdmhohoezfk.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuZnVpYWh2aWJkbWhvaG9lemZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NTcyMzUsImV4cCI6MjEwNjMzMzIzNX0.mJOi4kDPhFgi0F-c-ADHfJKzKcOLNvAvvF-dYB7zwHc';

// Load supabase-js from CDN (UMD build exposes window.supabase)
(function () {
  if (window.supabase) {
    initClient();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  script.onload = initClient;
  script.onerror = function () { console.error('Failed to load Supabase JS SDK'); };
  document.head.appendChild(script);
})();

function initClient() {
  window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  // Fire the ready event so dependent scripts can proceed
  window.dispatchEvent(new Event('supabaseReady'));
  if (typeof window.onSupabaseReady === 'function') window.onSupabaseReady();
}
