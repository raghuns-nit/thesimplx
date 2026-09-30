import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLoader } from '../../context/LoaderContext';
import { loadCategories, loadProducts, loadEnquiries, loadActivityLogs, loadSettings, saveSettings, insertEnquiry, updateEnquiry, logActivity, uploadImage } from '../../lib/data';
import type { Category, Product, Enquiry, ActivityLog, Settings } from '../../types';
import {
  LayoutDashboard, FolderTree, Package, Mail, Settings as SettingsIcon, History,
  LogOut, Menu, X, Plus, Pencil, Trash2,
} from 'lucide-react';

type Tab = 'dashboard' | 'categories' | 'products' | 'enquiries' | 'settings' | 'activity';

export default function AdminApp() {
  const navigate = useNavigate();
  const { show, hide } = useLoader();
  const [authed, setAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/admin/login');
        return;
      }
      setAuthed(true);
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) setUserEmail(user.email);
      });
    });
  }, [navigate]);

  useEffect(() => {
    if (!authed) return;
    refreshAll();
  }, [authed]);

  const refreshAll = async () => {
    show('Loading...');
    const [cats, prods, enqs, logsData, setts] = await Promise.all([
      loadCategories(),
      loadProducts(),
      loadEnquiries(),
      loadActivityLogs(),
      loadSettings(),
    ]);
    setCategories(cats);
    setProducts(prods);
    setEnquiries(enqs);
    setLogs(logsData);
    setSettings(setts);
    hide();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (!authed) {
    return <div className="text-center" style={{ padding: '3rem' }}>Checking session...</div>;
  }

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'enquiries', label: 'Enquiries', icon: Mail },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'activity', label: 'Activity Logs', icon: History },
  ];

  const pendingEnquiries = enquiries.filter((e) => e.status !== 'Closed').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        flexShrink: 0,
    background: 'var(--primary-dark)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0, bottom: 0, left: 0,
    zIndex: 200,
    transition: 'transform 0.2s',
    transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <img src="/logo.svg" alt="Simplx World" style={{ width: '140px', height: 'auto', filter: 'brightness(0) invert(1)' }} />
        </div>
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.875rem 1.5rem',
                background: tab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none',
                color: tab === item.id ? '#fff' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                fontWeight: tab === item.id ? 600 : 500,
                transition: 'all 0.15s',
                textAlign: 'left',
              }}
            >
              <item.icon size={18} />
              {item.label}
              {item.id === 'enquiries' && pendingEnquiries > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'var(--danger)',
                  color: '#fff',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.125rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}>
                  {pendingEnquiries}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>{userEmail}</p>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer', fontSize: '0.875rem',
          }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150,
        }} />
      )}

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 0, display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* Top bar */}
        <div style={{
          background: 'var(--bg-white)',
          borderBottom: '1px solid var(--border)',
          padding: '0.875rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
            className="admin-menu-btn"
          >
            <Menu size={24} />
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            {navItems.find((n) => n.id === tab)?.label}
          </h2>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
          {tab === 'dashboard' && <DashboardTab categories={categories} products={products} enquiries={enquiries} logs={logs} onNavigate={setTab} />}
          {tab === 'categories' && <CategoriesTab categories={categories} products={products} onRefresh={refreshAll} />}
          {tab === 'products' && <ProductsTab categories={categories} products={products} onRefresh={refreshAll} />}
          {tab === 'enquiries' && <EnquiriesTab enquiries={enquiries} onRefresh={refreshAll} />}
          {tab === 'settings' && <SettingsTab settings={settings} onRefresh={refreshAll} />}
          {tab === 'activity' && <ActivityTab logs={logs} />}
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          aside { transform: translateX(0) !important; }
          .admin-menu-btn { display: none !important; }
          .admin-content { margin-left: 260px !important; }
        }
        @media (max-width: 768px) {
          .admin-content { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}

// ── Dashboard Tab ──────────────────────────────────────────

function DashboardTab({ categories, products, enquiries, logs, onNavigate }: {
  categories: Category[];
  products: Product[];
  enquiries: Enquiry[];
  logs: ActivityLog[];
  onNavigate: (tab: Tab) => void;
}) {
  const pending = enquiries.filter((e) => e.status !== 'Closed').length;
  const stats = [
    { label: 'Categories', value: categories.length, color: 'var(--primary)', icon: FolderTree, tab: 'categories' as Tab },
    { label: 'Products', value: products.length, color: 'var(--accent)', icon: Package, tab: 'products' as Tab },
    { label: 'Pending Enquiries', value: pending, color: 'var(--warning)', icon: Mail, tab: 'enquiries' as Tab },
    { label: 'Activity Logs', value: logs.length, color: 'var(--success)', icon: History, tab: 'activity' as Tab },
  ];

  return (
    <div className="fade-in">
      <div className="grid grid-cols-4">
        {stats.map((s) => (
          <button key={s.label} type="button" onClick={() => onNavigate(s.tab)} style={{
            background: 'var(--bg-white)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            textAlign: 'left',
            font: 'inherit',
            color: 'inherit',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={(event) => { event.currentTarget.style.transform = 'translateY(-3px)'; event.currentTarget.style.boxShadow = 'var(--shadow-hover)'; }}
            onMouseLeave={(event) => { event.currentTarget.style.transform = 'translateY(0)'; event.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: 'var(--radius-sm)',
              background: s.color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem',
            }}>
              <s.icon size={22} />
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>{s.value}</p>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>{s.label}</p>
          </button>
        ))}
      </div>

      <div style={{
        marginTop: '2rem',
        background: 'var(--bg-white)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1.5rem',
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Recent Enquiries</h3>
        {enquiries.length === 0 ? (
          <p className="text-muted">No enquiries yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {enquiries.slice(0, 5).map((e) => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-light)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <strong style={{ fontSize: '0.875rem' }}>{e.name}</strong>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>{e.phone} · {new Date(e.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`badge ${e.status === 'Closed' ? 'badge-success' : e.status === 'Assigned' ? 'badge-warning' : 'badge-info'}`}>
                  {e.status || 'New'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Categories Tab ──────────────────────────────────────────

function CategoriesTab({ categories, onRefresh }: { categories: Category[]; products: Product[]; onRefresh: () => Promise<void> }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const { show, hide } = useLoader();

  const openAdd = () => {
    setEditing(null);
    setName('');
    setDesc('');
    setImage(null);
    setShowModal(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setDesc(c.description || '');
    setImage(null);
    setShowModal(true);
  };

  const makeSlug = (n: string) => n.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = makeSlug(name);
    if (!slug) { alert('Please enter a valid category name.'); return; }

    show('Saving...');
    try {
      if (editing) {
        const updates: Record<string, unknown> = { name, description: desc, slug };
        if (image) {
          const url = await uploadImage(image, 'categories', `${slug}.jpg`);
          if (url) updates.image_url = url;
        }
        const { error } = await supabase.from('categories').update(updates).eq('id', editing.id);
        if (error) throw error;
        await logActivity('UPDATE_CATEGORY', 'category', editing.id);
      } else {
        if (!image) { hide(); alert('Please select a category image.'); return; }
        const imageUrl = await uploadImage(image, 'categories', `${slug}.jpg`);
        const { data: newCat, error } = await supabase.from('categories').insert({
          name, slug, description: desc, image_url: imageUrl, sort_order: categories.length,
        }).select().single();
        if (error) throw error;
        await logActivity('CREATE_CATEGORY', 'category', newCat.id);
      }
      setShowModal(false);
      await onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error saving category.');
    } finally {
      hide();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?\n\nThis removes the category and all its products.`)) return;
    show('Deleting...');
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { alert('Error deleting category.'); }
    else await logActivity('DELETE_CATEGORY', 'category', id);
    await onRefresh();
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="text-muted">{categories.length} categories</p>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Category</button>
      </div>

      <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-light)' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Image</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Name</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Slug</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Products</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-muted" style={{ padding: '2rem' }}>No categories yet.</td></tr>
            ) : categories.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <img src={c.image_url || '/placeholder.png'} alt={c.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <strong>{c.name}</strong>
                  {c.description && <><br /><small className="text-muted">{c.description}</small></>}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span className="badge badge-warning" style={{ fontFamily: 'monospace' }}>{c.slug}</span>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>{c.product_count || 0}</td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                  <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem' }} onClick={() => openEdit(c)}><Pencil size={14} /></button>
                  <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(c.id, c.name)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Category' : 'Add Category'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Image {editing ? '(optional — leave empty to keep existing)' : '*'}</label>
                  <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Products Tab ───────────────────────────────────────────

function ProductsTab({ categories, products, onRefresh }: { categories: Category[]; products: Product[]; onRefresh: () => Promise<void> }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const { show, hide } = useLoader();

  // Form fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [finish, setFinish] = useState('');
  const [color, setColor] = useState('');
  const [thickness, setThickness] = useState('');
  const [material, setMaterial] = useState('');
  const [stockStatus, setStockStatus] = useState('In Stock');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [onSale, setOnSale] = useState(false);
  const [discount, setDiscount] = useState('');
  const [images, setImages] = useState<FileList | null>(null);

  const skuPrefixes: Record<string, string> = {
    floor_tiles: 'FT', wall_tiles: 'WT', vitrified_tiles: 'VF',
    bathroom_fittings: 'BF', mirrors: 'MR', sanitary_ware: 'SW',
    electrical: 'EL', accessories: 'AC', other_services: 'OS',
    paints: 'PT', cement: 'CM', steel: 'ST',
  };

  const openAdd = () => {
    setEditing(null);
    setName(''); setCategoryId(''); setBrand(''); setSize(''); setFinish('');
    setColor(''); setThickness(''); setMaterial('');
    setStockStatus('In Stock'); setPrice(''); setUnit('');
    setOnSale(false); setDiscount(''); setImages(null);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name || ''); setCategoryId(p.category_id || ''); setBrand(p.brand || '');
    setSize(p.size || ''); setFinish(p.finish || '');
    setStockStatus(p.stock_status || 'In Stock'); setPrice(String(p.price || '')); setUnit(p.unit || '');
    setImages(null);
    const specs = p.specifications as Record<string, unknown> | null;
    setColor((specs?.color as string) || '');
    setThickness((specs?.thickness as string) || '');
    setMaterial((specs?.material as string) || '');
    setOnSale(specs?.onSale === true || specs?.onSale === 'true');
    setDiscount((specs?.discount as string) || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) { alert('Please select a category.'); return; }
    show('Processing product...');

    try {
      const specs: Record<string, unknown> = {};
      if (color.trim()) specs.color = color.trim();
      if (thickness.trim()) specs.thickness = thickness.trim();
      if (material.trim()) specs.material = material.trim();
      specs.onSale = onSale;
      if (discount.trim()) specs.discount = discount.trim();

      const fields = {
        category_id: categoryId,
        name: name.trim(),
        brand: brand.trim(),
        size: size.trim(),
        finish: finish.trim(),
        stock_status: stockStatus,
        price: parseFloat(price) || null,
        unit: unit.trim(),
        specifications: specs,
      };

      const cat = categories.find((c) => c.id === categoryId);
      const folder = cat ? cat.slug : 'misc';

      if (editing) {
        let imageUrls = editing.image_urls || [];
        if (images && images.length > 0) {
          imageUrls = [];
          for (let i = 0; i < images.length; i++) {
            const ext = images[i].name.split('.').pop();
            const filename = `${editing.sku || 'img'}_0${i + 1}.${ext}`;
            const url = await uploadImage(images[i], `products/${folder}`, filename);
            if (url) imageUrls.push(url);
          }
        }
        const { error } = await supabase.from('products').update({ ...fields, image_urls: imageUrls }).eq('id', editing.id);
        if (error) throw error;
        await logActivity('UPDATE_PRODUCT', 'product', editing.id);
      } else {
        if (!images || images.length === 0) { hide(); alert('Please select at least one product image.'); return; }
        const catSlug = cat ? cat.slug : '';
        const prefix = skuPrefixes[catSlug] || 'GN';
        const brandCode = brand.substring(0, 3).toUpperCase();
        const seq = String(products.length + 1).padStart(3, '0');
        const sku = `${prefix}-${brandCode}-${seq}`;

        const imageUrls: string[] = [];
        for (let i = 0; i < images!.length; i++) {
          const ext = images![i].name.split('.').pop();
          const filename = `${sku}_0${i + 1}.${ext}`;
          const url = await uploadImage(images![i], `products/${folder}`, filename);
          if (url) imageUrls.push(url);
        }

        const { data: newProduct, error } = await supabase.from('products').insert({ ...fields, sku, image_urls: imageUrls }).select().single();
        if (error) throw error;
        await logActivity('CREATE_PRODUCT', 'product', newProduct.id);
      }

      setShowModal(false);
      await onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error saving product.');
    } finally {
      hide();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?\n\nThis will permanently remove the product.`)) return;
    show('Deleting...');
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { alert('Error deleting product.'); }
    else await logActivity('DELETE_PRODUCT', 'product', id);
    await onRefresh();
  };

  const getStockBadge = (status: string | null) => {
    if (status === 'Out of Stock') return 'badge-danger';
    if (status === 'Limited Stock') return 'badge-warning';
    return 'badge-success';
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="text-muted">{products.length} products</p>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Product</button>
      </div>

      <div style={{ overflowX: 'auto', background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-light)' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>SKU</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Image</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Name</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Category</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Price</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Stock</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>On Sale</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-muted" style={{ padding: '2rem' }}>No products yet.</td></tr>
            ) : products.map((p) => {
              const imgs = p.image_urls || [];
              const cat = categories.find((c) => c.id === p.category_id);
              const specs = p.specifications as Record<string, unknown> | null;
              const isOnSale = specs?.onSale === true || specs?.onSale === 'true';
              const disc = (specs?.discount as string) || '';
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}><strong style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.sku || '—'}</strong></td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <img src={imgs[0] || '/placeholder.png'} alt={p.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {p.name}
                    {p.brand && <><br /><small className="text-muted">{p.brand}</small></>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{cat ? cat.name : '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>₹{p.price || 0} <small className="text-muted">/ {p.unit || 'unit'}</small></td>
                  <td style={{ padding: '0.75rem 1rem' }}><span className={`badge ${getStockBadge(p.stock_status)}`}>{p.stock_status || 'In Stock'}</span></td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {isOnSale
                      ? <span className="badge badge-danger" style={{ background: 'var(--danger)', color: '#fff' }}>ON SALE{disc ? ` -${disc}%` : ''}</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem' }} onClick={() => openEdit(p)}><Pencil size={14} /></button>
                    <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(p.id, p.name)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Name *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                      <option value="">Select Category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Brand</label>
                    <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Size</label>
                    <input type="text" value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g., 600x600mm" />
                  </div>
                  <div className="form-group">
                    <label>Finish</label>
                    <input type="text" value={finish} onChange={(e) => setFinish(e.target.value)} placeholder="e.g., Matte, Glossy" />
                  </div>
                  <div className="form-group">
                    <label>Stock Status</label>
                    <select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)}>
                      <option value="In Stock">In Stock</option>
                      <option value="Limited Stock">Limited Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Price *</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" step="0.01" placeholder="e.g., 45" />
                  </div>
                  <div className="form-group">
                    <label>Unit *</label>
                    <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} required placeholder="e.g., sq.ft, piece" />
                  </div>
                  <div className="form-group">
                    <label>Color</label>
                    <input type="text" value={color} onChange={(e) => setColor(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Thickness</label>
                    <input type="text" value={thickness} onChange={(e) => setThickness(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Material</label>
                    <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <input type="checkbox" id="prod_onSale" checked={onSale} onChange={(e) => setOnSale(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                    <label htmlFor="prod_onSale" style={{ margin: 0, fontWeight: 700, color: 'var(--danger)', cursor: 'pointer' }}>Mark as "On Sale"</label>
                  </div>
                  <div className="form-group">
                    <label>Discount %</label>
                    <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} min="0" max="100" placeholder="e.g., 15" />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Product Images (up to 3) {editing ? '(optional)' : '(required)'}</label>
                    <input type="file" accept="image/*" multiple onChange={(e) => setImages(e.target.files)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Enquiries Tab ──────────────────────────────────────────

function EnquiriesTab({ enquiries, onRefresh }: { enquiries: Enquiry[]; onRefresh: () => Promise<void> }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Enquiry | null>(null);
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState('New');
  const [comment, setComment] = useState('');
  const { show, hide } = useLoader();

  const openModal = (e: Enquiry) => {
    setEditing(e);
    setAssignee(e.assignee || '');
    setStatus(e.status || 'New');
    setComment(e.comment || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    show('Saving...');
    await updateEnquiry(editing.id, { assignee: assignee.trim(), status, comment: comment.trim() });
    await logActivity('UPDATE_ENQUIRY', 'enquiry', editing.id);
    setShowModal(false);
    await onRefresh();
    hide();
  };

  return (
    <div className="fade-in">
      {enquiries.length === 0 ? (
        <div className="text-center text-muted" style={{ padding: '3rem' }}>No enquiries yet.</div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-light)' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Customer</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Phone</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Message</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Notes</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}><small>{new Date(e.created_at).toLocaleString()}</small></td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <strong>{e.name}</strong><br />
                    <small className="text-muted">Assigned: <span style={{ color: 'var(--primary)' }}>{e.assignee || 'Unassigned'}</span></small>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{e.phone}<br /><small>{e.email || '—'}</small></td>
                  <td style={{ padding: '0.75rem 1rem', maxWidth: '240px', whiteSpace: 'pre-wrap' }}>{e.message}</td>
                  <td style={{ padding: '0.75rem 1rem', maxWidth: '180px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{e.comment || ''}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`badge ${e.status === 'Closed' ? 'badge-success' : e.status === 'Assigned' ? 'badge-warning' : 'badge-info'}`}>
                      {e.status || 'New'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openModal(e)}>Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && editing && (
        <div className="modal-overlay active" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Enquiry</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Assign To</label>
                  <input type="text" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="e.g., Harisha or Babu" />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="New">New</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Closed">Closed / Resolved</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Internal Comment / Notes</label>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add resolution notes here..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Updates</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Settings Tab ───────────────────────────────────────────

function SettingsTab({ settings, onRefresh }: { settings: Settings | null; onRefresh: () => Promise<void> }) {
  const [form, setForm] = useState({
    company_name: '', phone: '', whatsapp: '', email: '', address: '', upi_id: '', google_review_url: '',
  });
  const { show, hide } = useLoader();

  useEffect(() => {
    if (settings) {
      setForm({
        company_name: settings.company_name || '',
        phone: settings.phone || '',
        whatsapp: settings.whatsapp || '',
        email: settings.email || '',
        address: settings.address || '',
        upi_id: settings.upi_id || '',
        google_review_url: settings.google_review_url || '',
      });
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    show('Saving settings...');
    const ok = await saveSettings(form);
    if (ok) {
      await logActivity('UPDATE_SETTINGS', 'settings', 'global');
      await onRefresh();
      alert('Settings saved successfully!');
    } else {
      alert('Error saving settings.');
    }
    hide();
  };

  const fields: { key: keyof typeof form; label: string; placeholder?: string; type?: string }[] = [
    { key: 'company_name', label: 'Company Name', placeholder: 'Simplx World' },
    { key: 'phone', label: 'Phone', placeholder: '+91 9876543210' },
    { key: 'whatsapp', label: 'WhatsApp Number', placeholder: '919876543210' },
    { key: 'email', label: 'Email', placeholder: 'info@simplx.com', type: 'email' },
    { key: 'address', label: 'Address', placeholder: 'Store address' },
    { key: 'upi_id', label: 'UPI ID', placeholder: 'merchant@upi' },
    { key: 'google_review_url', label: 'Google Reviews URL', placeholder: 'https://g.page/r/your-review-link/review', type: 'url' },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: '600px' }}>
      <form onSubmit={handleSave} style={{
        background: 'var(--bg-white)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '2rem',
      }}>
        {fields.map((f) => (
          <div className="form-group" key={f.key}>
            <label>{f.label}</label>
            <input
              type={f.type || 'text'}
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              placeholder={f.placeholder}
            />
          </div>
        ))}
        <button type="submit" className="btn btn-primary" style={{ padding: '0.875rem 2rem' }}>Save Settings</button>
      </form>
    </div>
  );
}

// ── Activity Tab ───────────────────────────────────────────

function ActivityTab({ logs }: { logs: ActivityLog[] }) {
  return (
    <div className="fade-in">
      {logs.length === 0 ? (
        <div className="text-center text-muted" style={{ padding: '3rem' }}>No activity yet.</div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-light)' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>User</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Action</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Entity</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}><small>{l.created_at ? new Date(l.created_at).toLocaleString() : '—'}</small></td>
                  <td style={{ padding: '0.75rem 1rem' }}>{l.username || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}><span className="badge badge-warning">{l.action || '—'}</span></td>
                  <td style={{ padding: '0.75rem 1rem' }}>{l.entity_type || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}><small className="text-muted">{l.entity_id || '—'}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
