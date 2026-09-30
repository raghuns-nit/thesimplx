// ============================================================
// activity.js — Admin action audit trail (Supabase)
// Depends on supabase-client.js, storage.js
// ============================================================

async function logActivity(action, entityType, entityId) {
  try {
    const { data: { user } } = await sb.auth.getUser();
    const { error } = await sb.from('activity_logs').insert({
      username: user?.email || 'system',
      action,
      entity_type: entityType,
      entity_id: entityId,
    });
    if (error) console.error('logActivity:', error);
  } catch (e) {
    console.error('logActivity exception:', e);
  }
}
