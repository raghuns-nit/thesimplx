import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useOutletContext } from 'react-router-dom';
import { loadProducts, loadCategories } from '../../lib/data';
import type { Product, Category } from '../../types';
import { SlidersHorizontal, X, Search } from 'lucide-react';

interface OutletContextType {
  openWhatsApp: (product?: Product | null) => void;
}

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const { openWhatsApp } = useOutletContext<OutletContextType>();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterFinish, setFilterFinish] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [filterCategory, setFilterCategory] = useState(categoryFilter || '');

  useEffect(() => {
    Promise.all([loadProducts(), loadCategories()]).then(([prods, cats]) => {
      setProducts(prods);
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (categoryFilter) setFilterCategory(categoryFilter);
  }, [categoryFilter]);

  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [products]);

  const finishes = useMemo(() => {
    const set = new Set(products.map((p) => p.finish).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search) {
        const term = search.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(term);
        const matchSku = p.sku?.toLowerCase().includes(term);
        const matchBrand = p.brand?.toLowerCase().includes(term);
        if (!matchName && !matchSku && !matchBrand) return false;
      }
      if (filterCategory && p.category_id !== filterCategory) return false;
      if (filterBrand && p.brand !== filterBrand) return false;
      if (filterFinish && p.finish !== filterFinish) return false;
      if (filterStock && p.stock_status !== filterStock) return false;
      return true;
    });
  }, [products, search, filterCategory, filterBrand, filterFinish, filterStock]);

  const clearFilters = () => {
    setSearch('');
    setFilterBrand('');
    setFilterFinish('');
    setFilterStock('');
    setFilterCategory('');
  };

  const stockStyle = (status: string | null) => {
    if (status === 'Out of Stock') return { color: 'var(--danger)' };
    if (status === 'Limited Stock') return { color: 'var(--warning)' };
    return { color: 'var(--success)' };
  };

  const FilterPanel = () => (
    <div>
      <div className="form-group">
        <label>Search</label>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." />
      </div>
      <div className="form-group">
        <label>Category</label>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Brand</label>
        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Finish</label>
        <select value={filterFinish} onChange={(e) => setFilterFinish(e.target.value)}>
          <option value="">All Finishes</option>
          {finishes.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Stock Status</label>
        <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
          <option value="">All</option>
          <option value="In Stock">In Stock</option>
          <option value="Limited Stock">Limited Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>
      <button className="btn btn-outline btn-block" onClick={clearFilters}>Clear Filters</button>
    </div>
  );

  return (
    <div className="container section fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>All Products</h1>
        <p className="text-muted mt-2">{filtered.length} Product{filtered.length === 1 ? '' : 's'} Found</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Desktop sidebar */}
        <aside style={{ width: '260px', flexShrink: 0, position: 'sticky', top: '120px' }} className="filter-sidebar-desktop">
          <FilterPanel />
        </aside>

        {/* Mobile filter toggle */}
        <button
          className="btn btn-primary filter-toggle-mobile"
          style={{ display: 'none', width: '100%', marginBottom: '1rem' }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={18} /> {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {/* Mobile filter panel */}
        {showFilters && (
          <div className="filter-sidebar-mobile" style={{ display: 'none', marginBottom: '1.5rem' }}>
            <FilterPanel />
          </div>
        )}

        {/* Product grid */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div className="text-center text-muted" style={{ padding: '3rem' }}>Loading products...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No products match your filters.
              <br /><br />
              <button className="btn btn-outline" onClick={clearFilters}>Clear Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-3">
              {filtered.map((p) => {
                const images = p.image_urls || [];
                const imgSrc = images.length > 0 ? images[0] : '/placeholder.png';
                const specs = p.specifications as Record<string, unknown> | null;
                const onSale = specs?.onSale === true || specs?.onSale === 'true';
                const discount = (specs?.discount as string) || '';

                return (
                  <div key={p.id} style={{
                    background: 'var(--bg-white)',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <Link to={`/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1' }}>
                        {onSale && (
                          <span style={{
                            position: 'absolute', top: '0.5rem', left: '0.5rem', zIndex: 1,
                            background: 'var(--danger)', color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                            padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)',
                          }}>
                            SALE{discount ? ` -${discount}%` : ''}
                          </span>
                        )}
                        <img
                          src={imgSrc}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                        />
                      </div>
                      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        {p.brand && <span className="badge badge-warning mb-2" style={{ alignSelf: 'flex-start' }}>{p.brand}</span>}
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{p.name}</h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          {p.sku && <span>SKU: {p.sku}</span>}
                          {p.size && <span> · {p.size}</span>}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--primary)' }}>
                          ₹{p.price || 0}
                          <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--text-muted)' }}> / {p.unit || 'unit'}</span>
                          {onSale && (
                            <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 700, marginLeft: '0.5rem' }}>
                              {discount ? `-${discount}%` : 'ON SALE'}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: 'auto', paddingTop: '0.5rem', ...stockStyle(p.stock_status) }}>
                          {p.stock_status || 'In Stock'}
                        </p>
                      </div>
                    </Link>
                    <div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-whatsapp" style={{ flex: 1, padding: '0.5rem' }} onClick={() => openWhatsApp(p)}>
                        Quote
                      </button>
                      <Link to={`/product/${p.id}`} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }}>
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .filter-sidebar-desktop { display: none !important; }
          .filter-toggle-mobile { display: flex !important; }
          .filter-sidebar-mobile { display: block !important; }
        }
      `}</style>
    </div>
  );
}
