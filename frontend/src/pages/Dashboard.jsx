import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI, spotsAPI } from '../services/api';
import { MapPin, Calendar, Car, Clock, ArrowRight, Search, CreditCard, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsAPI.getAll({ limit: 5 }).then(res => setBookings(res.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeBookings = bookings.filter(b => ['confirmed', 'active', 'pending'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalSpent = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.total_amount, 0);

  const statusBadge = (status) => {
    const map = { pending: 'badge-warning', confirmed: 'badge-info', active: 'badge-success', completed: 'badge-primary', cancelled: 'badge-danger' };
    return <span className={`badge ${map[status] || 'badge-primary'}`}>{status}</span>;
  };

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 20 }}>
        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <h1 className="heading-lg">Welcome back, <span style={{ color: 'var(--primary-accent)' }}>{user?.name?.split(' ')[0]}</span> 👋</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Here's your parking activity overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-4" style={{ marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-icon lime"><Car size={22} /></div>
            <div className="stat-info">
              <h3>{activeBookings.length}</h3>
              <p>Active Bookings</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><Calendar size={22} /></div>
            <div className="stat-info">
              <h3>{completedBookings.length}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><CreditCard size={22} /></div>
            <div className="stat-info">
              <h3>₹{totalSpent}</h3>
              <p>Total Spent</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><TrendingUp size={22} /></div>
            <div className="stat-info">
              <h3>{bookings.length}</h3>
              <p>Total Bookings</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          <Link to="/search" className="card" style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: 24,
            background: 'linear-gradient(135deg, rgba(255, 204, 0,0.08), rgba(108,92,231,0.05))',
            cursor: 'pointer', textDecoration: 'none'
          }}>
            <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: 'rgba(255, 204, 0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={24} color="var(--primary-accent)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>Find Parking</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Search spots near you</div>
            </div>
            <ArrowRight size={20} color="var(--text-muted)" />
          </Link>
          <Link to="/bookings" className="card" style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: 24,
            background: 'linear-gradient(135deg, rgba(0,184,148,0.15), rgba(0,210,255,0.05))',
            cursor: 'pointer', textDecoration: 'none'
          }}>
            <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: 'rgba(0,184,148,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={24} color="var(--success)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>My Bookings</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>View booking history</div>
            </div>
            <ArrowRight size={20} color="var(--text-muted)" />
          </Link>
        </div>

        {/* Recent Bookings */}
        <div style={{ marginBottom: 32 }}>
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <h2 className="heading-md">Recent Bookings</h2>
            <Link to="/bookings" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          {loading ? (
            <div className="loading-page" style={{ minHeight: 200 }}>
              <div className="spinner" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <Car size={48} />
              <h3>No bookings yet</h3>
              <p>Start by finding a parking spot near you</p>
              <Link to="/search" className="btn btn-accent">Find Parking</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bookings.slice(0, 5).map(booking => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-icon">
                    <Car size={24} color="var(--primary-accent)" />
                  </div>
                  <div className="booking-details">
                    <h3>{booking.spot_name || 'Parking Spot'}</h3>
                    <div className="booking-meta">
                      <span className="booking-meta-item"><Car size={14} /> {booking.vehicle_number}</span>
                      <span className="booking-meta-item"><Clock size={14} /> {booking.duration_hours}h</span>
                      <span className="booking-meta-item"><Calendar size={14} /> {new Date(booking.start_time).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="booking-actions">
                    <div className="booking-amount">₹{booking.total_amount}</div>
                    {statusBadge(booking.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
