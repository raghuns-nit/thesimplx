import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { MessageCircle } from 'lucide-react';
import { useState, useCallback } from 'react';
import WhatsAppModal from './WhatsAppModal';
import type { Product } from '../types';

export default function PublicLayout() {
  const [waOpen, setWaOpen] = useState(false);
  const [waProduct, setWaProduct] = useState<Product | null>(null);

  const openWhatsApp = useCallback((product?: Product | null) => {
    setWaProduct(product || null);
    setWaOpen(true);
  }, []);

  // Expose globally so child components can trigger without prop drilling
  if (typeof window !== 'undefined') {
    (window as any).__openWhatsApp = openWhatsApp;
  }

  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet context={{ openWhatsApp }} />
      </main>
      <Footer />
      <button
        onClick={() => openWhatsApp(null)}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#25d366',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
          zIndex: 100,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        aria-label="WhatsApp"
      >
        <MessageCircle size={26} />
      </button>
      <WhatsAppModal isOpen={waOpen} onClose={() => setWaOpen(false)} product={waProduct} />
    </>
  );
}
