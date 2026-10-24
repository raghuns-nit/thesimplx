import { useState } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useLoader } from '../context/LoaderContext';
import { insertEnquiry, uploadEnquiryAttachment } from '../lib/data';
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
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState('');

  const handleAttachmentChange = (file: File | undefined) => {
    if (!file) {
      setAttachment(null);
      setAttachmentError('');
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAttachment(null);
      setAttachmentError('Please choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAttachment(null);
      setAttachmentError('Please choose an image smaller than 5 MB.');
      return;
    }
    setAttachment(file);
    setAttachmentError('');
  }; 

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      alert('Please enter your name and phone number so we can assist you better.');
      return;
    }

    if (attachmentError) return;

    show(attachment ? 'Uploading image...' : 'Connecting...');

    try {
      const attachmentPath = attachment ? await uploadEnquiryAttachment(attachment) : null;
      if (attachment && !attachmentPath) throw new Error('Attachment upload failed');
      const message = product
        ? `WhatsApp Quote Request for: ${product.name} (SKU: ${product.sku || '—'})`
        : 'General WhatsApp Enquiry from the website';

      const saved = await insertEnquiry({
        name: name.trim(),
        email: null,
        phone: phone.trim(),
        message,
        attachment_path: attachmentPath,
        attachment_name: attachment?.name || null,
      });
      if (!saved) throw new Error('Enquiry save failed');

      let waNumber = '919876543210';
      if (settings?.whatsapp) waNumber = settings.whatsapp.replace(/\D/g, '');

      const chatText = product
        ? `Hi, my name is ${name}. I would like a quote for ${product.name} (SKU: ${product.sku || '—'}).${attachment ? ' I have included an image with this enquiry.' : ''}`
        : `Hi, my name is ${name}. I have a general enquiry about your products.${attachment ? ' I have included an image with this enquiry.' : ''}`;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const waUrl = isMobile
        ? `https://wa.me/${waNumber}?text=${encodeURIComponent(chatText)}`
        : `https://web.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(chatText)}`;

      window.open(waUrl, '_blank', 'noopener,noreferrer');
      onClose();
      setName('');
      setPhone('');
      setAttachment(null);
      setAttachmentError('');
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
          <div className="form-group">
            <label>Reference Image (optional)</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleAttachmentChange(e.target.files?.[0])} />
            <small className="text-muted">JPG, PNG, or WebP only, maximum 5 MB.</small>
            {attachmentError && <small role="alert" style={{ display: 'block', color: 'var(--danger)', marginTop: '0.35rem' }}>{attachmentError}</small>}
            {attachment && <small className="text-muted" style={{ display: 'block', marginTop: '0.35rem' }}>{attachment.name}</small>}
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
