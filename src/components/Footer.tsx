import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Phone, MessageCircle, MapPin } from 'lucide-react';

export default function Footer() {
  const { settings } = useSettings();
  const companyName = settings?.company_name || 'Simplx World';

  return (
    <footer style={{ background: 'var(--bg-dark)', marginTop: 'auto' }}>
      <div className="container" style={{ padding: '3rem 1.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <img src="/logo.svg" alt={companyName} style={{ width: '190px', height: 'auto', marginBottom: '0.75rem', filter: 'brightness(0) invert(1)' }} />
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
              Premium construction materials and services tailored for your building needs.
            </p>
          </div>
          <div>
            <h4 style={{ marginBottom: '0.75rem', color: '#fff' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><Link to="/" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', transition: 'color 0.2s' }}>Categories</Link></li>
              <li><Link to="/products" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', transition: 'color 0.2s' }}>All Products</Link></li>
              <li><Link to="/estimator" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', transition: 'color 0.2s' }}>Tile Estimator</Link></li>
              <li><Link to="/contact" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', transition: 'color 0.2s' }}>Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: '0.75rem', color: '#fff' }}>Admin</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><Link to="/admin" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', transition: 'color 0.2s' }}>Admin Portal</Link></li>
            </ul>
          </div>
          {(settings?.phone || settings?.address) && (
            <div>
              <h4 style={{ marginBottom: '0.75rem', color: '#fff' }}>Contact</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {settings?.phone && (
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)' }}>
                    <Phone size={14} style={{ color: 'var(--accent)' }} /> {settings.phone}
                  </li>
                )}
                {settings?.address && (
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                    <MapPin size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '0.15rem' }} /> {settings.address}
                  </li>
                )}
                {settings?.whatsapp && (
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)' }}>
                    <MessageCircle size={14} style={{ color: 'var(--accent)' }} /> WhatsApp Available
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)' }}>
          &copy; 2026 {companyName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
