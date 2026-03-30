import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../services/api';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch (err) {
      toast.error(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeIn">
        <div className="auth-header">
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🔐</div>
          <h1>Reset Password</h1>
          <p>{sent ? 'Check your email for reset instructions' : 'Enter your email to receive a reset link'}</p>
        </div>
        {!sent ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-icon">
                <Mail />
                <input className="input" type="email" placeholder="you@example.com" id="forgot-email"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-accent btn-full btn-lg" type="submit" disabled={loading} id="forgot-submit">
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="text-center" style={{ padding: 20 }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>✉️</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              We've sent a password reset link to <strong>{email}</strong>. Check your inbox and spam folder.
            </p>
            <button className="btn btn-secondary btn-full" onClick={() => setSent(false)}>Try Different Email</button>
          </div>
        )}
        <div className="auth-footer" style={{ marginTop: 16 }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
