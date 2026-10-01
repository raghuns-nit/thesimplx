import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLoader } from '../../context/LoaderContext';
import { loadCategories, loadProducts, loadEnquiries, loadActivityLogs, loadSettings, saveSettings, insertEnquiry, updateEnquiry, logActivity, uploadImage } from '../../lib/data';
import type { Category, Product, Enquiry, ActivityLog, Settings } from '../../types';
import {
  LayoutDashboard, FolderTree, Package, Mail, Settings as SettingsIcon, History,
  ClipboardList, LogOut, Menu, X, Plus, Pencil, Trash2, AlertTriangle, IndianRupee,
} from 'lucide-react';

type Tab = 'dashboard' | 'categories' | 'products' | 'inventory' | 'enquiries' | 'settings' | 'activity';

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
    { id: 'inventory', label: 'Inventory Management', icon: ClipboardList },
    { id: 'enquiries', label: 'Enquiries', icon: Mail },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'activity', label: 'Activity Logs', icon: History },
  ];

  const pendingEnquiries = enquiries.filter((e) => e.status !== 'Closed').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Sidebar */}
      <aside className="admin-sidebar" style={{
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
      <div className="admin-content" style={{ flex: 1, marginLeft: 0, display: 'flex', flexDirection: 'column', width: 'auto', minWidth: 0 }}>
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
          {tab === 'inventory' && <InventoryTab categories={categories} products={products} settings={settings} onRefresh={refreshAll} onOpenProducts={() => setTab('products')} />} 
          {tab === 'enquiries' && <EnquiriesTab enquiries={enquiries} onRefresh={refreshAll} />}
          {tab === 'settings' && <SettingsTab settings={settings} onRefresh={refreshAll} />}
          {tab === 'activity' && <ActivityTab logs={logs} />}
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          aside.admin-sidebar { transform: translateX(0) !important; }
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
  const [stockQuantity, setStockQuantity] = useState('0');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('Sft');
  const [liquidateStock, setLiquidateStock] = useState(false);
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
    setStockStatus('In Stock'); setStockQuantity('0'); setPrice(''); setUnit('Sft');
    setLiquidateStock(false); setOnSale(false); setDiscount(''); setImages(null);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name || ''); setCategoryId(p.category_id || ''); setBrand(p.brand || '');
    setSize(p.size || ''); setFinish(p.finish || '');
    setStockStatus(p.stock_status || 'In Stock'); setStockQuantity(String(p.stock_quantity ?? 0)); setPrice(String(p.price || '')); setUnit(p.unit || 'Sft');
    setLiquidateStock(Boolean(p.liquidate_stock)); setImages(null);
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
    const parsedStockQuantity = Number.parseFloat(stockQuantity);
    if (!Number.isFinite(parsedStockQuantity) || parsedStockQuantity < 0) {
      alert('Enter a valid stock quantity of 0 or more.');
      return;
    }
    if (!unit) { alert('Please select a unit.'); return; }
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
        stock_quantity: Number(parsedStockQuantity.toFixed(2)),
        liquidate_stock: liquidateStock,
        price: parseFloat(price) || null,
        unit,
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
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Stock Qty</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>On Sale</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Liquidate Stock</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={10} className="text-center text-muted" style={{ padding: '2rem' }}>No products yet.</td></tr>
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
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{Number(p.stock_quantity ?? 0).toFixed(2)} <small className="text-muted">{p.unit || 'Sft'}</small></td>
                  <td style={{ padding: '0.75rem 1rem' }}><span className={`badge ${getStockBadge(p.stock_status)}`}>{p.stock_status || 'In Stock'}</span></td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {isOnSale
                      ? <span className="badge badge-danger" style={{ background: 'var(--danger)', color: '#fff' }}>ON SALE{disc ? ` -${disc}%` : ''}</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {p.liquidate_stock ? <span className="badge badge-warning">Liquidate</span> : <span className="text-muted">—</span>}
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
                    <label>Stock *</label>
                    <input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} required min="0" step="0.01" placeholder="e.g., 120.50" />
                  </div>
                  <div className="form-group">
                    <label>Unit *</label>
                    <select value={unit} onChange={(e) => setUnit(e.target.value)} required>
                      <option value="Sft">Sft</option>
                      <option value="Box">Box</option>
                      <option value="Unit">Unit</option>
                      <option value="KG">KG</option>
                      <option value="Lt">Lt</option>
                      <option value="Ft">Ft</option>
                    </select>
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
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <input type="checkbox" id="prod_liquidate" checked={liquidateStock} onChange={(e) => setLiquidateStock(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                    <label htmlFor="prod_liquidate" style={{ margin: 0, fontWeight: 700, color: 'var(--warning)', cursor: 'pointer' }}>Mark as "Liquidate Stock"</label>
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

// ── Inventory Management Tab ────────────────────────────────
function InventoryTab({ categories, products, settings, onRefresh, onOpenProducts }: {
  categories: Category[];
  products: Product[];
  settings: Settings | null;
  onRefresh: () => Promise<void>;
  onOpenProducts: () => void;
}) {
  const { show, hide } = useLoader();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [threshold, setThreshold] = useState(String(settings?.low_stock_threshold ?? 10));
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    setThreshold(String(settings?.low_stock_threshold ?? 10));
  }, [settings?.low_stock_threshold]);

  useEffect(() => {
    setStockInputs(Object.fromEntries(products.map((product) => [product.id, String(product.stock_quantity ?? 0)])));
  }, [products]);

  const numericThreshold = Number.parseFloat(threshold);
  const lowStockThreshold = Number.isFinite(numericThreshold) && numericThreshold >= 0 ? numericThreshold : 10;
  const filteredProducts = products.filter((product) => {
    const categoryMatches = !categoryId || product.category_id === categoryId;
    const search = query.trim().toLowerCase();
    const searchMatches = !search || [product.name, product.brand, product.size, product.sku]
      .some((value) => value?.toLowerCase().includes(search));
    return categoryMatches && searchMatches;
  });
  const totalStockValue = products.reduce((total, product) => total + (product.price || 0) * (product.stock_quantity || 0), 0);
  const lowStockCount = products.filter((product) => (product.stock_quantity || 0) <= lowStockThreshold).length;

  const saveThreshold = async () => {
    const value = Number.parseFloat(threshold);
    if (!Number.isFinite(value) || value < 0) {
      setThreshold(String(settings?.low_stock_threshold ?? 10));
      return;
    }
    const rounded = Number(value.toFixed(2));
    setThreshold(String(rounded));
    if (rounded === (settings?.low_stock_threshold ?? 10)) return;
    show('Saving threshold...');
    await saveSettings({ low_stock_threshold: rounded });
    await onRefresh();
    hide();
  };

  const saveStock = async (product: Product) => {
    const value = Number.parseFloat(stockInputs[product.id] ?? '');
    if (!Number.isFinite(value) || value < 0) {
      setStockInputs((current) => ({ ...current, [product.id]: String(product.stock_quantity ?? 0) }));
      return;
    }
    const rounded = Number(value.toFixed(2));
    if (rounded === Number(product.stock_quantity ?? 0)) {
      setStockInputs((current) => ({ ...current, [product.id]: rounded.toFixed(2) }));
      return;
    }
    show('Saving stock...');
    const { error } = await supabase.from('products').update({ stock_quantity: rounded }).eq('id', product.id);
    if (error) {
      alert('Could not update stock.');
      setStockInputs((current) => ({ ...current, [product.id]: String(product.stock_quantity ?? 0) }));
    } else {
      await logActivity('UPDATE_STOCK', 'product', product.id);
      await onRefresh();
    }
    hide();
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: 'var(--radius)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <Package size={22} style={{ color: 'var(--accent)', marginBottom: '0.75rem' }} />
          <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Products</p>
          <strong style={{ display: 'block', fontSize: '1.8rem', marginTop: '0.25rem' }}>{products.length}</strong>
        </div>
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderTop: '3px solid var(--success)', borderRadius: 'var(--radius)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <IndianRupee size={22} style={{ color: 'var(--success)', marginBottom: '0.75rem' }} />
          <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Stock Value</p>
          <strong style={{ display: 'block', fontSize: '1.8rem', color: 'var(--success)', marginTop: '0.25rem' }}>₹{totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderTop: '3px solid var(--danger)', borderRadius: 'var(--radius)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <AlertTriangle size={22} style={{ color: 'var(--danger)' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0, fontSize: '0.7rem', textTransform: 'none', letterSpacing: 0 }}>
              ≤ <input type="number" min="0" step="0.01" value={threshold} onChange={(e) => setThreshold(e.target.value)} onBlur={saveThreshold} style={{ width: '58px', padding: '0.25rem', textAlign: 'center' }} />
            </label>
          </div>
          <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Low Stock Items</p>
          <strong style={{ display: 'block', fontSize: '1.8rem', color: 'var(--danger)', marginTop: '0.25rem' }}>{lowStockCount}</strong>
        </div>
      </div>

      <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-light)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: 'auto' }}><ClipboardList size={20} /> Inventory List</h3>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." style={{ maxWidth: '220px' }} />
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All Categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-light)' }}>
                {['Image', 'Product', 'Brand', 'Size', 'Price', 'Stock', 'Action'].map((heading) => <th key={heading} style={{ padding: '0.75rem 1rem', textAlign: heading === 'Action' ? 'right' : 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>No inventory items found.</td></tr>
              ) : filteredProducts.map((product) => {
                const quantity = product.stock_quantity || 0;
                const isLow = quantity <= lowStockThreshold;
                return (
                  <tr key={product.id} style={{ borderBottom: '1px solid var(--border)', background: isLow ? 'var(--warning-light)' : undefined }}>
                    <td style={{ padding: '0.75rem 1rem' }}><img src={product.image_urls?.[0] || '/placeholder.png'} alt={product.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} /></td>
                    <td style={{ padding: '0.75rem 1rem' }}><strong>{product.name}</strong><br /><small className="text-muted">{categories.find((category) => category.id === product.category_id)?.name || '—'}</small></td>
                    <td style={{ padding: '0.75rem 1rem' }}>{product.brand || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{product.size || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>₹{(product.price || 0).toFixed(2)}<br /><small className="text-muted">/ {product.unit || 'Sft'}</small></td>
                    <td style={{ padding: '0.75rem 1rem' }}><input type="number" min="0" step="0.01" value={stockInputs[product.id] ?? '0'} onChange={(e) => setStockInputs((current) => ({ ...current, [product.id]: e.target.value }))} onBlur={() => saveStock(product)} style={{ width: '92px', borderColor: isLow ? 'var(--danger)' : undefined }} /></td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}><button className="btn btn-outline" onClick={onOpenProducts} style={{ padding: '0.4rem 0.65rem' }}>Edit Product</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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
  const [visualForm, setVisualForm] = useState({
    threshold: 50,
    maxResults: 12,
    colorWeight: 70,
    brightnessWeight: 15,
    textureWeight: 10,
    varianceWeight: 5,
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
      setVisualForm({
        threshold: settings.visual_search_threshold ?? 50,
        maxResults: settings.visual_search_max_results ?? 12,
        colorWeight: settings.visual_search_color_weight ?? 70,
        brightnessWeight: settings.visual_search_brightness_weight ?? 15,
        textureWeight: settings.visual_search_texture_weight ?? 10,
        varianceWeight: settings.visual_search_variance_weight ?? 5,
      });
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (visualForm.threshold < 0 || visualForm.threshold > 100 || visualForm.maxResults < 1 || visualForm.maxResults > 50) {
      alert('Keep the similarity threshold between 0 and 100, and results between 1 and 50.');
      return;
    }
    const weightTotal = visualForm.colorWeight + visualForm.brightnessWeight + visualForm.textureWeight + visualForm.varianceWeight;
    if ([visualForm.colorWeight, visualForm.brightnessWeight, visualForm.textureWeight, visualForm.varianceWeight].some((value) => value < 0) || weightTotal <= 0) {
      alert('Similarity weights must be non-negative and at least one weight must be greater than zero.');
      return;
    }
    show('Saving settings...');
    const ok = await saveSettings({
      ...form,
      visual_search_threshold: Number(visualForm.threshold.toFixed(2)),
      visual_search_max_results: Math.round(visualForm.maxResults),
      visual_search_color_weight: Number(visualForm.colorWeight.toFixed(2)),
      visual_search_brightness_weight: Number(visualForm.brightnessWeight.toFixed(2)),
      visual_search_texture_weight: Number(visualForm.textureWeight.toFixed(2)),
      visual_search_variance_weight: Number(visualForm.varianceWeight.toFixed(2)),
    });
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
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '0.35rem' }}>Visual Search Settings</h3>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>Adjust matching behavior without changing the app code. Weight values are relative percentages and are normalized automatically.</p>
          <div className="form-group">
            <label>Minimum Similarity Score (%)</label>
            <input type="number" min="0" max="100" step="1" value={visualForm.threshold} onChange={(e) => setVisualForm({ ...visualForm, threshold: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>Maximum Results</label>
            <input type="number" min="1" max="50" step="1" value={visualForm.maxResults} onChange={(e) => setVisualForm({ ...visualForm, maxResults: Number(e.target.value) })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div className="form-group"><label>Color Signature Weight</label><input type="number" min="0" step="1" value={visualForm.colorWeight} onChange={(e) => setVisualForm({ ...visualForm, colorWeight: Number(e.target.value) })} /></div>
            <div className="form-group"><label>Brightness Weight</label><input type="number" min="0" step="1" value={visualForm.brightnessWeight} onChange={(e) => setVisualForm({ ...visualForm, brightnessWeight: Number(e.target.value) })} /></div>
            <div className="form-group"><label>Texture Weight</label><input type="number" min="0" step="1" value={visualForm.textureWeight} onChange={(e) => setVisualForm({ ...visualForm, textureWeight: Number(e.target.value) })} /></div>
            <div className="form-group"><label>Color Variation Weight</label><input type="number" min="0" step="1" value={visualForm.varianceWeight} onChange={(e) => setVisualForm({ ...visualForm, varianceWeight: Number(e.target.value) })} /></div>
          </div>
          <div style={{ background: 'var(--bg-light)', borderRadius: 'var(--radius-sm)', padding: '0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-main)' }}>Signature reference</strong><br />Version {2} · 64 × 64 pixel sample · 30 HSV color buckets · browser-only image analysis
          </div>
        </div>
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
