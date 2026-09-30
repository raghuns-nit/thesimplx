import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Phone, MessageCircle, MapPin } from 'lucide-react';

export default function Header() {
  const { settings } = useSettings();
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Categories' },
    { to: '/products', label: 'All Products' },
    { to: '/estimator', label: 'Estimator' },
    { to: '/contact', label: 'Contact Us' },
  ];

  const hasInfoBar = settings?.phone || settings?.whatsapp || settings?.address;

  return (
    <header style={{ background: 'var(--bg-white)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 10px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '0.875rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="logo-container" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.svg" alt="Simplx World" style={{ width: '176px', height: 'auto', maxHeight: '48px', objectFit: 'contain' }} />
          </Link>
          <nav style={{ display: 'flex', gap: '0.125rem', alignItems: 'center' }}>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  color: location.pathname === item.to ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: location.pathname === item.to ? 600 : 500,
                  fontSize: '0.875rem',
                  padding: '0.4375rem 0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background 0.15s, color 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-light)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {hasInfoBar && (
        <div style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.85rem', padding: '0.4rem 0' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {settings?.phone && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Phone size={14} />
                <a href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`} style={{ color: '#fff', fontWeight: 600 }}>
                  {settings.phone}
                </a>
              </span>
            )}
            {settings?.whatsapp && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.5)', padding: '0.2rem 0.9rem', borderRadius: '20px' }}
                onClick={() => {
                  const wa = settings.whatsapp!;
                  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                  const waUrl = isMobile
                    ? `https://wa.me/${wa.replace(/\D/g, '')}`
                    : `https://web.whatsapp.com/send?phone=${wa.replace(/\D/g, '')}`;
                  window.open(waUrl, '_blank');
                }}
              >
                <MessageCircle size={14} /> WhatsApp
              </span>
            )}
            {settings?.address && (
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.5)', padding: '0.2rem 0.9rem', borderRadius: '20px' }}
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(settings.address || '')}`, '_blank')}
              >
                <MapPin size={14} /> Location
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
