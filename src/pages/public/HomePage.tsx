import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadCategories } from '../../lib/data';
import { useSettings } from '../../context/SettingsContext';
import type { Category } from '../../types';
import { Package, Star, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { settings } = useSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories().then((cats) => {
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  const reviewUrl = settings?.google_review_url;

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
      {/* Hero */}
      <section style={{
        background: `linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)`,
        color: '#fff',
        padding: '4rem 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 80% 50%, rgba(201, 149, 42, 0.15) 0%, transparent 50%)',
        }} />
        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <h1 style={{ color: '#fff', marginBottom: '1rem' }}>
            Premium Building Materials
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.85, maxWidth: '600px', margin: '0 auto 2rem' }}>
            Browse our catalog of tiles, sanitary ware, fittings, and construction supplies.
            Get instant WhatsApp quotes and pay via UPI.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/products" className="btn btn-primary" style={{ background: 'var(--accent)', color: '#fff', padding: '0.875rem 2rem', fontSize: '1rem' }}>
              Browse Products <ArrowRight size={18} />
            </Link>
            <Link to="/estimator" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', padding: '0.875rem 2rem', fontSize: '1rem' }}>
              Tile Estimator
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2>Shop by Category</h2>
            <p className="text-muted mt-2">Explore our wide range of construction materials</p>
          </div>

          {loading ? (
            <div className="text-center text-muted" style={{ padding: '3rem' }}>Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: '3rem' }}>No categories yet.</div>
          ) : (
            <div className="grid grid-cols-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  style={{
                    display: 'block',
                    background: 'var(--bg-white)',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: 'var(--bg-light)' }}>
                    <img
                      src={cat.image_url || '/placeholder.png'}
                      alt={cat.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    />
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{cat.name}</h3>
                    {cat.description && (
                      <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>{cat.description}</p>
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Package size={14} /> {cat.product_count || 0} Products
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Google Reviews ticker */}
      {reviewUrl && (
        <section style={{ background: 'var(--bg-light)', padding: '2.5rem 0' }}>
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
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '1.25rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{ color: '#f59e0b', fontSize: '1.1rem', letterSpacing: '2px' }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </div>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.5, margin: '0.5rem 0' }}>"{r.text}"</p>
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
                  background: '#fff',
                  border: '1px solid var(--border)',
                  padding: '0.6rem 1.5rem',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: 'var(--primary)',
                }}
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
