import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();
  const companyName = settings?.company_name || 'Simplx World';

  return (
    <footer style={{ background: 'var(--bg-white)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
      <div className="container" style={{ padding: '3rem 1.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <img src="/logo.svg" alt={companyName} style={{ width: '190px', height: 'auto', marginBottom: '0.75rem' }} />
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              Premium construction materials and services tailored for your building needs.
            </p>
          </div>
          <div>
            <h4 style={{ marginBottom: '0.75rem' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><Link to="/" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Categories</Link></li>
              <li><Link to="/products" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>All Products</Link></li>
              <li><Link to="/estimator" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tile Estimator</Link></li>
              <li><Link to="/contact" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: '0.75rem' }}>Admin</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><Link to="/admin" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Admin Portal</Link></li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          &copy; 2026 {companyName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
