import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadBrands, loadProducts } from '../../lib/data';
import type { Brand, Product } from '../../types';
import { Search, ArrowRight, ExternalLink } from 'lucide-react';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadBrands(), loadProducts()]).then(([brnds, prods]) => {
      setBrands(brnds);
      setProducts(prods);
      setLoading(false);
    });
  }, []);

  const productCount = (brandName: string) =>
    products.filter((p) => p.brand?.toLowerCase() === brandName.toLowerCase()).length;

  const term = search.trim().toLowerCase();
  const visibleBrands = brands.filter((b) =>
    !term || b.name.toLowerCase().includes(term) || (b.description || '').toLowerCase().includes(term),
  );

  return (
    <div className="container section fade-in">
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1>Shop by Brand</h1>
        <p className="text-muted mt-2">Browse all our available brands</p>
        <div style={{ maxWidth: '520px', margin: '1.25rem auto 0', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', pointerEvents: 'none' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands..."
            aria-label="Search brands"
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted" style={{ padding: '3rem' }}>Loading brands...</div>
      ) : brands.length === 0 ? (
        <div className="text-center text-muted" style={{ padding: '3rem' }}>No brands yet.</div>
      ) : visibleBrands.length === 0 ? (
        <div className="text-center text-muted" style={{ padding: '3rem' }}>No brands match your search.</div>
      ) : (
        <div className="grid grid-cols-4">
          {visibleBrands.map((brand, idx) => (
            <Link
              key={brand.id}
              to={`/brand/${brand.slug}`}
              style={{
                display: 'block',
                background: 'var(--bg-white)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s',
                textDecoration: 'none',
                color: 'inherit',
                animation: `fadeInSlow 0.5s ease-out ${idx * 0.08}s both`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: 'var(--bg-light)', position: 'relative' }}>
                <img
                  src={brand.image_url || '/placeholder.png'}
                  alt={brand.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(26,26,26,0.35) 0%, transparent 50%)',
                  pointerEvents: 'none',
                }} />
              </div>
              <div style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{brand.name}</h3>
                {brand.description && (
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem', lineHeight: 1.5 }}>{brand.description}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {productCount(brand.name)} Products <ArrowRight size={14} />
                  </span>
                  {brand.url && (
                    <span className="text-muted" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <ExternalLink size={12} /> Site
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
