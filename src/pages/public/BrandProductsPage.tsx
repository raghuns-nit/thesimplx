import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import { loadBrandBySlug, loadProductsByBrandName } from '../../lib/data';
import type { Brand, Product } from '../../types';
import { Search, ArrowLeft } from 'lucide-react';
import ContrastImage from '../../components/ContrastImage';

interface OutletContextType {
  openWhatsApp: (product?: Product | null) => void;
}

export default function BrandProductsPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { openWhatsApp } = useOutletContext<OutletContextType>();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    setLoading(true);
    loadBrandBySlug(slug).then((b) => {
      setBrand(b);
      if (b) {
        loadProductsByBrandName(b.name).then((prods) => {
          setProducts(prods);
          setLoading(false);
        });
      } else {
        setProducts([]);
        setLoading(false);
      }
    });
  }, [slug]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const term = search.toLowerCase();
    return products.filter((p) =>
      p.name?.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      p.size?.toLowerCase().includes(term),
    );
  }, [products, search]);

  useEffect(() => { setVisibleCount(12); }, [search, slug]);

  const visibleProducts = filtered.slice(0, visibleCount);

  const stockStyle = (status: string | null) => {
    if (status === 'Out of Stock') return { color: 'var(--danger)' };
    if (status === 'Limited Stock') return { color: 'var(--warning)' };
    return { color: 'var(--success)' };
  };

  if (loading) {
    return <div className="container section text-center text-muted" style={{ padding: '3rem' }}>Loading brand...</div>;
  }

  if (!brand) {
    return (
      <div className="container section text-center" style={{ padding: '3rem' }}>
        <h2>Brand not found</h2>
        <p className="text-muted mt-2">The brand you are looking for does not exist.</p>
        <Link to="/brands" className="btn btn-primary mt-4">Browse all brands</Link>
      </div>
    );
  }

  return (
    <div className="container section fade-in">
      {/* Brand header */}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: '2rem',
        background: 'var(--bg-white)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-card)',
      }}>
        {brand.image_url && (
          <img
            src={brand.image_url}
            alt={brand.name}
            style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: 'var(--radius)', flexShrink: 0 }}
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
          />
        )}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ marginBottom: '0.25rem' }}>{brand.name}</h1>
          {brand.description && <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>{brand.description}</p>}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/brands" style={{ color: 'var(--accent)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <ArrowLeft size={14} /> All Brands
            </Link>
            {brand.url && (
              <a href={brand.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>
                Visit Brand Website ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Search bar scoped to this brand */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <p className="text-muted" style={{ margin: 0 }}>{filtered.length} Product{filtered.length === 1 ? '' : 's'}</p>
        <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', pointerEvents: 'none' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search within ${brand.name}...`}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          {products.length === 0 ? `No products found for ${brand.name}.` : 'No products match your search.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3">
            {visibleProducts.map((p, idx) => {
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
                  transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s',
                  animation: `fadeInSlow 0.4s ease-out ${Math.min(idx * 0.05, 0.4)}s both`,
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <Link to={`/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <ContrastImage
                      src={imgSrc}
                      alt={p.name}
                      padding="0.5rem"
                      imgStyle={{ transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                      onHoverImg={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                      onLeaveImg={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      badge={onSale ? (
                        <span style={{
                          position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 1,
                          background: 'var(--danger)', color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                          padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)',
                          letterSpacing: '0.03em',
                        }}>
                          SALE{discount ? ` -${discount}%` : ''}
                        </span>
                      ) : null}
                    />
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{p.name}</h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        {p.sku && <span>SKU: {p.sku}</span>}
                        {p.size && <span> · {p.size}</span>}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--primary)' }}>
                        {p.price ? (
                          <>
                            ₹{p.price}
                            <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--text-muted)' }}> / {p.unit || 'unit'}</span>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.95rem' }}>Price On Request</span>
                        )}
                        {onSale && p.price && (
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
          {visibleCount < filtered.length && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setVisibleCount((count) => count + 12)}>
                Load more products
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
