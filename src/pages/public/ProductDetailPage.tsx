import { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { loadProductById, loadCategories } from '../../lib/data';
import { useSettings } from '../../context/SettingsContext';
import type { Product, Category } from '../../types';
import { ArrowLeft, Check } from 'lucide-react';

interface OutletContextType {
  openWhatsApp: (product?: Product | null) => void;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { settings } = useSettings();
  const { openWhatsApp } = useOutletContext<OutletContextType>();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!id) return;
    Promise.all([loadProductById(id), loadCategories()]).then(([p, cats]) => {
      setProduct(p);
      setCategories(cats);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="container section text-center text-muted">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="container section text-center">
        <p className="text-muted">Product not found.</p>
        <Link to="/products" className="btn btn-primary mt-4">Back to Products</Link>
      </div>
    );
  }

  const images = product.image_urls || [];
  const cat = categories.find((c) => c.id === product.category_id);
  const specs = product.specifications as Record<string, unknown> | null;
  const onSale = specs?.onSale === true || specs?.onSale === 'true';
  const discount = (specs?.discount as string) || '';

  const specEntries = [
    { label: 'Size', value: product.size },
    { label: 'Finish', value: product.finish },
    { label: 'Status', value: product.stock_status },
  ];

  if (specs && typeof specs === 'object') {
    for (const [key, val] of Object.entries(specs)) {
      if (val && key !== 'onSale' && key !== 'discount') {
        specEntries.push({ label: key.charAt(0).toUpperCase() + key.slice(1), value: String(val) });
      }
    }
  }

  const upiId = settings?.upi_id;
  const companyName = settings?.company_name || 'Merchant';

  const handlePay = () => {
    if (!upiId) {
      alert('UPI payment is not configured yet. Please contact the store.');
      return;
    }
    const link = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}&cu=INR&am=${product.price || ''}`;
    window.open(link, '_blank');
  };

  return (
    <div className="container section fade-in">
      <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', transition: 'color 0.2s' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <ArrowLeft size={16} /> Back to Products
      </Link>

      <div className="product-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
        {/* Images */}
        <div>
          <div style={{
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--bg-white)',
            aspectRatio: '1',
            boxShadow: 'var(--shadow-card)',
          }}>
            <img
              src={images[activeImg] || '/placeholder.png'}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
            />
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${product.name} ${i + 1}`}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    border: activeImg === i ? '2px solid var(--accent)' : '2px solid var(--border)',
                    transition: 'border-color 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={(e) => { if (activeImg !== i) e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.brand && <span className="badge badge-warning mb-2">{product.brand}</span>}
          {onSale && (
            <span className="badge mb-2" style={{ background: 'var(--danger)', color: '#fff', fontWeight: 700, marginLeft: '0.5rem' }}>
              ON SALE{discount ? ` -${discount}%` : ''}
            </span>
          )}
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{product.name}</h1>
          {cat && <p className="text-muted" style={{ marginBottom: '1rem' }}>in {cat.name}</p>}

          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.5rem', fontFamily: "'Sora', sans-serif" }}>
            ₹{product.price || 0}
            <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}> / {product.unit || 'unit'}</span>
          </div>

          {product.sku && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              SKU: <strong style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>{product.sku}</strong>
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
            <button className="btn btn-whatsapp" style={{ flex: 1, padding: '0.75rem' }} onClick={() => openWhatsApp(product)}>
              Get Quote
            </button>
            {upiId && (
              <button className="btn btn-accent" style={{ flex: 1, padding: '0.75rem' }} onClick={handlePay}>
                Pay Advance
              </button>
            )}
          </div>

          {/* Specifications */}
          <div style={{
            background: 'var(--bg-white)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-card)',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Specifications</h3>
            {specEntries.filter((s) => s.value).map((s, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.6rem 0',
                borderBottom: i < specEntries.filter((s) => s.value).length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>{s.label}</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.value}</span>
              </div>
            ))}
            {specEntries.filter((s) => s.value).length === 0 && (
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>No specifications available.</p>
            )}
          </div>

          {/* UPI QR */}
          {upiId && (
            <div style={{
              marginTop: '1.5rem',
              background: 'var(--bg-white)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-card)',
            }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                Pay via UPI
              </p>
              <div style={{ display: 'inline-block', marginBottom: '0.75rem', padding: '0.75rem', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <a href={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}&cu=INR`} target="_blank" rel="noopener noreferrer">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${companyName}&cu=INR`)}`}
                    alt="UPI QR Code"
                    width={160}
                    height={160}
                  />
                </a>
              </div>
              <p style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem', margin: 0 }}>{upiId}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Scan with PhonePe, GPay, Paytm or any UPI app.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .product-detail-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}
