import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../services/api';
import { User, Mail, Lock, Phone, Eye, EyeOff, Car } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all required fields');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await authAPI.register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      toast.success('Account created! Please verify OTP.');
      navigate('/verify-otp', { state: { email: form.email, otp: res.data.otp } });
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
          <h1>Create Account</h1>
          <p>Join SpotHai and park smarter today</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Full Name *</label>
            <div className="input-icon">
              <User />
              <input className="input" placeholder="John Doe" id="signup-name" autoComplete="off"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
          </div>
          <div className="input-group">
            <label>Email Address *</label>
            <div className="input-icon">
              <Mail />
              <input className="input" type="email" placeholder="you@example.com" id="signup-email" autoComplete="new-email"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
          </div>
          <div className="input-group">
            <label>Phone Number</label>
            <div className="input-icon">
              <Phone />
              <input className="input" placeholder="+91-9876543210" id="signup-phone" autoComplete="off"
                value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
          </div>
          <div className="input-group">
            <label>Password *</label>
            <div className="input-icon">
              <Lock />
              <input className="input" type={showPass ? 'text' : 'password'} placeholder="Min 6 characters" id="signup-password" autoComplete="new-password"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              <span onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                cursor: 'pointer', color: 'var(--text-muted)'
              }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
          </div>
          <div className="input-group">
            <label>Confirm Password *</label>
            <div className="input-icon">
              <Lock />
              <input className="input" type="password" placeholder="Re-enter password" id="signup-confirm" autoComplete="new-password"
                value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} />
            </div>
          </div>
          <button className="btn btn-accent btn-full btn-lg" type="submit" disabled={loading} id="signup-submit">
            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Create account & send OTP'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
