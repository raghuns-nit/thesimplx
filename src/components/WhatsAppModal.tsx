import { useState } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useLoader } from '../context/LoaderContext';
import { insertEnquiry } from '../lib/data';
import type { Product } from '../types';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export default function WhatsAppModal({ isOpen, onClose, product }: WhatsAppModalProps) {
  const { settings } = useSettings();
  const { show, hide } = useLoader();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      alert('Please enter your name and phone number so we can assist you better.');
      return;
    }

    show('Connecting...');

    try {
      const message = product
        ? `WhatsApp Quote Request for: ${product.name} (SKU: ${product.sku || '—'})`
        : 'General WhatsApp Enquiry from the website';

      await insertEnquiry({ name: name.trim(), email: null, phone: phone.trim(), message });

      let waNumber = '919876543210';
      if (settings?.whatsapp) waNumber = settings.whatsapp.replace(/\D/g, '');

      const chatText = product
        ? `Hi, my name is ${name}. I would like a quote for ${product.name} (SKU: ${product.sku || '—'}).`
        : `Hi, my name is ${name}. I have a general enquiry about your products.`;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const waUrl = isMobile
        ? `https://wa.me/${waNumber}?text=${encodeURIComponent(chatText)}`
        : `https://web.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(chatText)}`;

      window.open(waUrl, '_blank', 'noopener,noreferrer');
      onClose();
      setName('');
      setPhone('');
    } catch (error) {
      console.error('Failed to log WhatsApp lead:', error);
      alert('There was an issue connecting. Please try again.');
    } finally {
      hide();
    }
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>WhatsApp Quote</h3>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p className="text-muted mb-4">
            {product
              ? `Tell us who you are and we will help with ${product.name}.`
              : 'Tell us who you are and we will help with your general enquiry.'}
          </p>
          <div className="form-group">
            <label>Your Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Raja Rama" />
          </div>
          <div className="form-group">
            <label>Phone Number *</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., 9876543210" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-whatsapp" onClick={handleSubmit}>Go to Chat</button>
        </div>
      </div>
    </div>
  );
}
