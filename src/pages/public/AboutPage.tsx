import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, History, Users } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import type { AboutProfile } from '../../types';

export default function AboutPage() {
  const { settings } = useSettings();
  const profiles = (settings?.about_profiles || []).filter((profile): profile is AboutProfile => Boolean(profile?.image_url || profile?.name)).slice(0, 4);
  const history = settings?.about_history?.trim();

  return (
    <div className="fade-in">
      <section style={{ background: 'var(--primary-dark)', color: '#fff', padding: '4.5rem 0 4rem' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            <Users size={15} /> About Us
          </span>
          <h1 style={{ color: '#fff', marginBottom: '1rem' }}>We Are</h1>
          <p style={{ maxWidth: '680px', color: 'rgba(255,255,255,0.72)', fontSize: '1.1rem', lineHeight: 1.8 }}>
            Simple Luxuries, thoughtfully sourced for the spaces you build.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent)', marginBottom: '1rem' }}>
            <History size={20} />
            <h2 style={{ margin: 0 }}>Our Story</h2>
          </div>
          {history ? (
            <div style={{ color: 'var(--text-main)', fontSize: '1rem', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{history}</div>
          ) : (
            <p className="text-muted" style={{ lineHeight: 1.7 }}>Our story is being updated. Visit again soon to learn more about the firm.</p>
          )}
        </div>
      </section>

      {profiles.length > 0 && (
        <section style={{ background: 'var(--bg-light)', padding: '3.5rem 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2>Management</h2>
              <p className="text-muted" style={{ marginTop: '0.5rem' }}>The people behind our commitment to quality.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
              {profiles.map((profile, index) => (
                <article key={`${profile.name}-${index}`} style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ aspectRatio: '1', background: 'var(--bg-page)' }}>
                    <img src={profile.image_url || '/placeholder.png'} alt={profile.name || 'Management profile'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(event) => { (event.target as HTMLImageElement).src = '/placeholder.png'; }} />
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{profile.name || 'Management'}</h3>
                    <p className="text-muted" style={{ fontSize: '0.82rem' }}>{profile.role || 'Leadership team'}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/products" className="btn btn-primary">Explore Products <ArrowRight size={17} /></Link>
          <Link to="/contact" className="btn btn-outline"><BriefcaseBusiness size={17} /> Contact Us</Link>
        </div>
      </section>
    </div>
  );
}
