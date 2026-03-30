import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../services/api';
import { Mail, Lock, Eye, EyeOff, Car } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.user, res.data.token);
      toast.success('Welcome back! ' + res.data.user.name);
      navigate(res.data.user.role === 'operator' || res.data.user.role === 'admin' ? '/operator' : '/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      try {
        // Exchange Google access token for user info, then send to backend
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();

        // Create a mock credential for our backend (we'll send the access token)
        const res = await authAPI.googleAuth({ credential: tokenResponse.access_token, userInfo });
        login(res.data.user, res.data.token);
        toast.success('Welcome, ' + res.data.user.name + '!');
        navigate('/dashboard');
      } catch (err) {
        toast.error(err.message || 'Google sign-in failed');
      }
    },
    onError: () => {
      toast.error('Google sign-in was cancelled');
    },
  });

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeIn">
        <div className="auth-header">
          <Link to="/" className="nav-logo" style={{ justifyContent: 'center' }}>
            <div className="nav-logo-icon">
              <Car size={26} color="#0B0114" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 400, fontSize: '1.6rem', letterSpacing: '-0.02em', marginLeft: '4px' }}>SpotHai</span>
          </Link>
          <h1>Welcome Back</h1>
          <p>Log in to your SpotHai account</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
          {/* Hidden honeypot fields to absorb Chrome autofill */}
          <input type="text" name="prevent_autofill" id="prevent_autofill" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
          <input type="password" name="password_fake" id="password_fake" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
          <div className="input-group">
            <label>Email Address</label>
            <div className="input-icon">
              <Mail />
              <input className="input" type="text" placeholder="you@example.com" id="login-email" name="spothai_email" autoComplete="one-time-code"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
          </div>
          <div className="input-group">
            <label>Password</label>
            <div className="input-icon">
              <Lock />
              <input className="input" type={showPass ? 'text' : 'password'} placeholder="Enter password" id="login-password" name="spothai_pass" autoComplete="one-time-code"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              <span onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                cursor: 'pointer', color: 'var(--text-muted)'
              }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
          </div>
          <div className="flex-between" style={{ fontSize: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgot-password" style={{ color: 'var(--primary-accent)' }}>Forgot password?</Link>
          </div>
          <button className="btn btn-accent btn-full btn-lg" type="submit" disabled={loading} id="login-submit">
            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Log In'}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="btn btn-secondary btn-full"
            style={{ fontSize: '0.9rem', padding: '14px 24px', gap: 10 }}
            onClick={() => googleLogin()}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
        </div>
        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up free</Link>
        </div>

      </div>
    </div>
  );
}
