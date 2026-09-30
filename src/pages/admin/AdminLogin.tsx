import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLoader } from '../../context/LoaderContext';
import { Lock, Mail } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { show, hide } = useLoader();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/admin');
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    show('Signing in...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    hide();

    if (error) {
      setError(error.message || 'Login failed');
      return;
    }

    if (data.session) {
      navigate('/admin');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)',
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--bg-white)',
        borderRadius: 'var(--radius-lg)',
        padding: '2.5rem',
        maxWidth: '420px',
        width: '100%',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.svg" alt="Simplx World" style={{ width: '200px', height: 'auto', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem' }}>Admin Portal</h2>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Sign in to manage your catalog</p>
        </div>

        {error && (
          <div className="mb-4" style={{
            background: '#fee2e2',
            color: '#b91c1c',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@example.com" style={{ paddingLeft: '2.5rem' }} />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ paddingLeft: '2.5rem' }} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ padding: '1rem', marginTop: '0.5rem' }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
