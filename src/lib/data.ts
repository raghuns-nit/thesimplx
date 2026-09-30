import { supabase } from './supabase';
import type { Category, Product, Settings, Enquiry, ActivityLog } from '../types';

// ── Categories ──────────────────────────────────────────────

export async function loadCategories(): Promise<Category[]> {
  const [catRes, prodRes] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('products').select('category_id'),
  ]);

  if (catRes.error) {
    console.error('loadCategories:', catRes.error);
    return [];
  }

  const counts: Record<string, number> = {};
  if (!prodRes.error) {
    (prodRes.data || []).forEach((p) => {
      counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    });
  }

  return (catRes.data || []).map((c) => ({
    ...c,
    product_count: counts[c.id] || 0,
  }));
}

// ── Products ────────────────────────────────────────────────

export async function loadProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) { console.error('loadProducts:', error); return []; }
  return data || [];
}

export async function loadProductsByCategory(categoryId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true });
  if (error) { console.error('loadProductsByCategory:', error); return []; }
  return data || [];
}

export async function loadProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) { console.error('loadProductById:', error); return null; }
  return data;
}

// ── Settings ────────────────────────────────────────────────

export async function loadSettings(): Promise<Settings | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) { console.error('loadSettings:', error); return null; }
  return data;
}

export async function saveSettings(settings: Partial<Settings>): Promise<boolean> {
  const { error } = await supabase.from('settings').upsert({
    id: 1,
    ...settings,
    updated_at: new Date().toISOString(),
  });
  if (error) { console.error('saveSettings:', error); return false; }
  return true;
}

// ── Enquiries ───────────────────────────────────────────────

export async function loadEnquiries(): Promise<Enquiry[]> {
  const { data, error } = await supabase
    .from('enquiries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('loadEnquiries:', error); return []; }
  return data || [];
}

export async function insertEnquiry(enquiry: {
  name: string;
  email: string | null;
  phone: string;
  message: string;
}): Promise<boolean> {
  const { error } = await supabase.from('enquiries').insert(enquiry);
  if (error) { console.error('insertEnquiry:', error); return false; }
  return true;
}

export async function updateEnquiry(
  id: string,
  updates: { assignee?: string; status?: string; comment?: string },
): Promise<boolean> {
  const { error } = await supabase
    .from('enquiries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { console.error('updateEnquiry:', error); return false; }
  return true;
}

// ── Activity Logs ───────────────────────────────────────────

export async function loadActivityLogs(): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) { console.error('loadActivityLogs:', error); return []; }
  return data || [];
}

export async function logActivity(
  action: string,
  entityType: string,
  entityId: string,
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('activity_logs').insert({
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

// ── Image Upload ───────────────────────────────────────────

export async function uploadImage(
  file: File,
  folder: string,
  filename: string,
): Promise<string | null> {
  const path = `${folder}/${filename}`;
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: true });

  if (error) {
    console.error('uploadImage:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(path);

  return urlData.publicUrl;
}
