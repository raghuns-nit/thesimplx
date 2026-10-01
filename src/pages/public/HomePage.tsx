import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadCategories } from '../../lib/data';
import { useSettings } from '../../context/SettingsContext';
import type { Category } from '../../types';
import { Package, Star, ArrowRight, Search } from 'lucide-react';

export default function HomePage() {
  const { settings } = useSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories().then((cats) => {
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  const reviewUrl = settings?.google_review_url;
  const heroDescription = settings?.hero_description || 'Browse our catalog of tiles, sanitary ware, fittings, and construction supplies. Get instant WhatsApp quotes and pay via UPI.';
  const visibleCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categorySearch.trim().toLowerCase()),
  );

  const sampleReviews = [
    { author: 'Rajesh Kumar', rating: 5, text: 'Excellent quality tiles and great service. The team helped us choose the perfect flooring for our entire house.' },
    { author: 'Priya Sharma', rating: 5, text: 'Very professional and fair pricing. The tile estimator tool was super helpful for calculating quantities.' },
    { author: 'Mohammed Iqbal', rating: 4, text: 'Good collection of parking tiles. Delivery was on time. Would recommend to others.' },
    { author: 'Lakshmi N.', rating: 5, text: 'Best building materials supplier in the area. Wide variety and competitive rates.' },
    { author: 'Arjun Reddy', rating: 5, text: 'Outstanding customer support via WhatsApp. Got instant quotes and paid advance through UPI. Very convenient!' },
    { author: 'Sneha Patil', rating: 4, text: 'Nice showroom with good display of products. Staff is knowledgeable and guided us well.' },
  ];

  return (
    <div className="fade-in">
      {/* ── Hero ── */}
      <section style={{
        background: 'var(--primary-dark)',
        color: '#fff',
        padding: '5rem 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative geometric shapes */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(194, 112, 61, 0.12) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91, 122, 106, 0.10) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--accent)',
            marginBottom: '1.25rem',
            padding: '0.35rem 1rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(194, 112, 61, 0.12)',
            border: '1px solid rgba(194, 112, 61, 0.3)',
          }}>
            Building Materials, Built for Quality
          </span>
          <h1 style={{ color: '#fff', marginBottom: '1rem', maxWidth: '700px', margin: '0 auto 1rem' }} aria-label="Simple Luxuries">
            <span style={{ color: 'var(--accent)' }}>Simp</span>le <span style={{ color: 'var(--accent)' }}>L</span>u<span style={{ color: 'var(--accent)' }}>x</span>uries
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.7, maxWidth: '560px', margin: '0 auto 2.5rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {heroDescription}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/products" className="btn btn-accent" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
              Browse Products <ArrowRight size={18} />
            </Link>
            <Link to="/estimator" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#fff', padding: '0.875rem 2rem', fontSize: '1rem' }}>
              Tile Estimator
            </Link>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2>Shop by Category</h2>
            <p className="text-muted mt-2">Search or choose from our available categories</p>
            <div style={{ maxWidth: '520px', margin: '1.25rem auto 0', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', pointerEvents: 'none' }} />
              <input
                type="search"
                list="available-categories"
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                placeholder="Search categories..."
                aria-label="Search categories"
                style={{ paddingLeft: '2.75rem' }}
              />
              <datalist id="available-categories">
                {categories.map((category) => <option key={category.id} value={category.name} />)}
              </datalist>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-muted" style={{ padding: '3rem' }}>Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: '3rem' }}>No categories yet.</div>
          ) : visibleCategories.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: '3rem' }}>No categories match your search.</div>
          ) : (
            <div className="grid grid-cols-4">
              {visibleCategories.map((cat, idx) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
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
                      src={cat.image_url || '/placeholder.png'}
                      alt={cat.name}
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
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{cat.name}</h3>
                    {cat.description && (
                      <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem', lineHeight: 1.5 }}>{cat.description}</p>
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Package size={14} /> {cat.product_count || 0} Products
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Feature strip ── */}
      <section style={{ background: 'var(--bg-light)', padding: '2.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
            {[
              { icon: '📦', title: 'Wide Catalog', text: 'Tiles, sanitary ware, fittings & more' },
              { icon: '💬', title: 'WhatsApp Quotes', text: 'Instant pricing via chat' },
              { icon: '📱', title: 'UPI Payments', text: 'Pay advances securely' },
              { icon: '📐', title: 'Tile Estimator', text: 'Calculate exact quantities' },
            ].map((f) => (
              <div key={f.title} style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{f.icon}</div>
                <h4 style={{ marginBottom: '0.25rem' }}>{f.title}</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Google Reviews ticker ── */}
      {reviewUrl && (
        <section style={{ background: 'var(--bg-page)', padding: '3rem 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2>What Our Customers Say</h2>
              <p className="text-muted mt-2">Real reviews from our Google Business listing</p>
            </div>
            <div style={{
              overflow: 'hidden',
              position: 'relative',
              maskImage: 'linear-gradient(to right, transparent, #000 5%, #000 95%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, #000 5%, #000 95%, transparent)',
            }}>
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                animation: 'reviewScroll 30s linear infinite',
                width: 'max-content',
              }}>
                {[...sampleReviews, ...sampleReviews].map((r, i) => (
                  <div key={i} style={{
                    flexShrink: 0,
                    width: '320px',
                    background: 'var(--bg-white)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-card)',
                  }}>
                    <div style={{ color: 'var(--accent)', fontSize: '1.1rem', letterSpacing: '2px' }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </div>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: '0.5rem 0', color: 'var(--text-main)' }}>"{r.text}"</p>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>— {r.author}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--bg-white)',
                  border: '1px solid var(--border)',
                  padding: '0.6rem 1.5rem',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: 'var(--accent)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <Star size={18} /> Leave us a Google Review
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
