import { useState, useEffect } from 'react';
import { bookingsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Car, Clock, Calendar, MapPin, X, FileText } from 'lucide-react';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const toast = useToast();

  const fetchBookings = () => {
    setLoading(true);
    const params = {};
    if (filter) params.status = filter;
    bookingsAPI.getAll(params)
      .then(res => setBookings(res.data || []))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await bookingsAPI.cancel(id);
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel');
    }
  };

  const statusBadge = (status) => {
    const map = { pending: 'badge-warning', confirmed: 'badge-info', active: 'badge-success', completed: 'badge-primary', cancelled: 'badge-danger' };
    return <span className={`badge ${map[status] || 'badge-primary'}`}>{status}</span>;
  };

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 20 }}>
        <div className="flex-between" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="heading-lg">My <span className="text-gradient">Bookings</span></h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Manage and track your parking bookings</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-chips" style={{ marginBottom: 24 }}>
          {['', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map(f => (
            <span key={f} className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}>
              {f || 'All'}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="loading-page" style={{ minHeight: 300 }}><div className="spinner" /></div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No bookings found</h3>
            <p>{filter ? `No ${filter} bookings` : 'You haven\'t made any bookings yet'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bookings.map(b => (
              <div key={b.id} className="booking-card">
                <div className="booking-icon">
                  <Car size={24} color="var(--primary-light)" />
                </div>
                <div className="booking-details">
                  <h3>{b.spot_name || 'Parking Spot'}</h3>
                  <div className="booking-meta">
                    <span className="booking-meta-item"><Car size={14} /> {b.vehicle_number}</span>
                    <span className="booking-meta-item"><Clock size={14} /> {b.duration_hours}h</span>
                    <span className="booking-meta-item"><Calendar size={14} /> {new Date(b.start_time).toLocaleDateString()}</span>
                    <span className="booking-meta-item">
                      {new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(b.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  {b.qr_code && (
                    <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      QR: <span style={{ fontFamily: 'monospace', color: 'var(--primary-light)' }}>{b.qr_code}</span>
                    </div>
                  )}
                </div>
                <div className="booking-actions">
                  <div className="booking-amount">₹{b.total_amount}</div>
                  {statusBadge(b.status)}
                  {['pending', 'confirmed', 'active'].includes(b.status) && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.id)} style={{ marginTop: 8 }}>
                      <X size={14} /> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
