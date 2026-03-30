import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../services/api';
import { User, Mail, Phone, Shield, Save, Camera } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 20, maxWidth: 700 }}>
        <h1 className="heading-lg" style={{ marginBottom: 32 }}>Profile <span className="text-gradient">Settings</span></h1>

        {/* Avatar Section */}
        <div className="card" style={{ marginBottom: 24, textAlign: 'center', padding: 40 }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'var(--gradient-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '2.5rem', fontWeight: 800
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{user?.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user?.email}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
            <span className="badge badge-primary">{user?.role}</span>
            {user?.is_verified ? (
              <span className="badge badge-success">✓ Verified</span>
            ) : (
              <span className="badge badge-warning">Unverified</span>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 className="heading-sm" style={{ marginBottom: 20 }}>Edit Profile</h3>
          <form onSubmit={handleSave}>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>Full Name</label>
              <div className="input-icon">
                <User />
                <input className="input" value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})} id="profile-name" />
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>Email Address</label>
              <div className="input-icon">
                <Mail />
                <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email cannot be changed</span>
            </div>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label>Phone Number</label>
              <div className="input-icon">
                <Phone />
                <input className="input" value={form.phone} placeholder="+91-9876543210"
                  onChange={e => setForm({...form, phone: e.target.value})} id="profile-phone" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="profile-save">
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <><Save size={16} /> Save Changes</>}
            </button>
          </form>
        </div>

        {/* Account Info */}
        <div className="card">
          <h3 className="heading-sm" style={{ marginBottom: 20 }}>Account Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="flex-between">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Account ID</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{user?.id?.substring(0, 16)}...</span>
            </div>
            <div className="flex-between">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Member Since</span>
              <span style={{ fontSize: '0.9rem' }}>{new Date(user?.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex-between">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Role</span>
              <span className="badge badge-primary">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
