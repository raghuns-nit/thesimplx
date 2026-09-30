import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Phone, MessageCircle, MapPin } from 'lucide-react';

interface HeaderProps {
  onOpenWhatsApp: () => void;
}

export default function Header({ onOpenWhatsApp }: HeaderProps) {
  const { settings } = useSettings();
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Categories' },
    { to: '/products', label: 'All Products' },
    { to: '/estimator', label: 'Estimator' },
    { to: '/visual-search', label: 'Visual Search' },
    { to: '/contact', label: 'Contact Us' },
  ];

  const hasInfoBar = settings?.phone || settings?.whatsapp || settings?.address;

  return (
    <header style={{
      background: 'rgba(255, 255, 255, 0.82)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 12px rgba(0,0,0,0.04)',
    }}>
      <div style={{ padding: '0.75rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="logo-container" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.svg" alt="Simplx World" style={{ width: '176px', height: 'auto', maxHeight: '44px', objectFit: 'contain' }} />
          </Link>
          <nav style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="header-nav">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: active ? 600 : 500,
                    fontSize: '0.875rem',
                    padding: '0.4375rem 0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--bg-light)';
                      e.currentTarget.style.color = 'var(--text-main)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  {item.label}
                  {active && (
                    <span style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'var(--accent)',
                    }} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {hasInfoBar && (
        <div style={{ background: 'var(--primary-dark)', color: '#fff', fontSize: '0.85rem', padding: '0.35rem 0' }}>
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
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer',
                  background: 'rgba(194, 112, 61, 0.25)',
                  border: '1px solid rgba(194, 112, 61, 0.5)',
                  padding: '0.2rem 0.9rem',
                  borderRadius: '20px',
                  transition: 'background 0.2s',
                }}
                onClick={onOpenWhatsApp}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(194, 112, 61, 0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(194, 112, 61, 0.25)'; }}
              >
                <MessageCircle size={14} /> WhatsApp
              </span>
            )}
            {settings?.address && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '0.2rem 0.9rem',
                  borderRadius: '20px',
                  transition: 'background 0.2s',
                }}
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(settings.address || '')}`, '_blank')}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
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
