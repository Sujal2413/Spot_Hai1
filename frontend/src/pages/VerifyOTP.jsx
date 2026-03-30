import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../services/api';

export default function VerifyOTP() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const refs = useRef([]);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => { refs.current[0]?.focus(); }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return toast.error('Please enter complete 6-digit OTP');
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP({ email, otp: code });
      if (res.data.token) login({ email }, res.data.token);
      toast.success('Email verified successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      const res = await authAPI.resendOTP({ email });
      toast.success(res.message || 'New OTP sent to your email!');
      setCountdown(60);
    } catch (err) {
      toast.error(err.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeIn">
        <div className="auth-header">
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>📧</div>
          <h1>Verify Email</h1>
          <p>We sent a 6-digit code to <strong style={{ color: 'var(--primary-accent)' }}>{email || 'your email'}</strong></p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="otp-inputs" style={{ marginBottom: 20 }}>
            {otp.map((digit, i) => (
              <input key={i} ref={el => refs.current[i] = el}
                className="otp-input" type="text" maxLength={1} value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)} id={`otp-${i}`} />
            ))}
          </div>
          <button className="btn btn-accent btn-full btn-lg" type="submit" disabled={loading} id="verify-submit">
            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : '✓ Verify OTP'}
          </button>
        </form>
        <div className="auth-footer">
          Didn't receive code?{' '}
          {countdown > 0 ? (
            <span style={{ color: 'var(--text-muted)' }}>Resend in {countdown}s</span>
          ) : (
            <a href="#" onClick={(e) => { e.preventDefault(); handleResend(); }}
              style={{ color: 'var(--primary-accent)', cursor: resending ? 'wait' : 'pointer' }}>
              {resending ? 'Sending...' : 'Resend OTP'}
            </a>
          )}
        </div>
        <div className="auth-footer" style={{ marginTop: 8 }}>
          <Link to="/login" style={{ color: 'var(--text-muted)' }}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
