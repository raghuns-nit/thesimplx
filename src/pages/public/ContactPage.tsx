import { useState } from 'react';
import { insertEnquiry } from '../../lib/data';
import { useLoader } from '../../context/LoaderContext';
import { Check } from 'lucide-react';

export default function ContactPage() {
  const { show, hide } = useLoader();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      alert('Please fill in your name, phone number, and message.');
      return;
    }

    show('Sending...');
    const ok = await insertEnquiry({
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim(),
      message: message.trim(),
    });

    hide();

    if (ok) {
      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setTimeout(() => setSuccess(false), 5000);
    } else {
      alert('There was an issue sending your message. Please try again.');
    }
  };

  return (
    <div className="container section fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1>Contact Us</h1>
        <p className="text-muted mt-2">Have a project in mind or need a bulk quotation? Reach out to us.</p>
      </div>

      <div style={{
        background: 'var(--bg-white)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {success && (
          <div className="mb-4" style={{
            background: '#dcfce7',
            color: '#16a34a',
            borderRadius: 'var(--radius)',
            padding: '1rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}>
            <Check size={20} /> Thank you! Your enquiry has been received. We will contact you shortly.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Phone Number *</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Message / Requirements *</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ padding: '1rem' }}>
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
