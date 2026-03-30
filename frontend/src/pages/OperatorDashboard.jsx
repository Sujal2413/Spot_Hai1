import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { operatorAPI } from '../services/api';
import { LayoutDashboard, MapPin, Users, TrendingUp, Car, DollarSign, Plus, Calendar, BarChart3, ParkingCircle } from 'lucide-react';

export default function OperatorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [spotForm, setSpotForm] = useState({ name: '', address: '', city: '', total_slots: 50, price_per_hour: 30 });
  const toast = useToast();

  useEffect(() => {
    operatorAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(err => toast.error(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const handleAddSpot = async (e) => {
    e.preventDefault();
    try {
      await operatorAPI.addSpot(spotForm);
      toast.success('Parking spot added!');
      setShowAddSpot(false);
      setSpotForm({ name: '', address: '', city: '', total_slots: 50, price_per_hour: 30 });
      // Refresh
      const res = await operatorAPI.getDashboard();
      setData(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to add spot');
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const statusBadge = (status) => {
    const map = { pending: 'badge-warning', confirmed: 'badge-info', active: 'badge-success', completed: 'badge-primary', cancelled: 'badge-danger' };
    return <span className={`badge ${map[status]}`}>{status}</span>;
  };

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 20 }}>
        <div className="flex-between" style={{ marginBottom: 32 }}>
          <div>
            <h1 className="heading-lg">Operator <span className="text-gradient">Dashboard</span></h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
              {user?.role === 'admin' ? 'Admin overview — all locations' : 'Manage your parking locations'}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddSpot(true)} id="add-spot-btn">
            <Plus size={16} /> Add Spot
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-4" style={{ marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-icon purple"><ParkingCircle size={22} /></div>
            <div className="stat-info">
              <h3>{data?.totalSpots || 0}</h3>
              <p>Total Locations</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><Car size={22} /></div>
            <div className="stat-info">
              <h3>{data?.occupancyRate || 0}%</h3>
              <p>Occupancy Rate</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><DollarSign size={22} /></div>
            <div className="stat-info">
              <h3>₹{data?.totalRevenue?.toLocaleString() || 0}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><Calendar size={22} /></div>
            <div className="stat-info">
              <h3>{data?.activeBookings || 0}</h3>
              <p>Active Bookings</p>
            </div>
          </div>
        </div>

        {/* Today Stats */}
        <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(108,92,231,0.15), rgba(0,210,255,0.05))' }}>
          <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Today's Bookings</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{data?.todayBookings || 0}</div>
            </div>
            <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Today's Revenue</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>₹{data?.todayRevenue || 0}</div>
            </div>
            <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Available Slots</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>{data?.availableSlots || 0}/{data?.totalSlots || 0}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="filter-chips" style={{ marginBottom: 24 }}>
          <span className={`filter-chip ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>📊 Spots Overview</span>
          <span className={`filter-chip ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>📋 Recent Bookings</span>
        </div>

        {/* Spots Overview */}
        {tab === 'overview' && (
          <div className="grid grid-2">
            {(data?.spots || []).map(spot => (
              <div key={spot.id} className="card">
                <div className="flex-between" style={{ marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontWeight: 600, marginBottom: 4 }}>{spot.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {spot.city}
                    </div>
                  </div>
                  <span className={`badge ${spot.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{spot.status}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{spot.occupancy}%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Occupancy</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{spot.available_slots}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)' }}>₹{spot.price_per_hour}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Per Hour</div>
                  </div>
                </div>
                <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${spot.occupancy}%`, height: '100%',
                    background: spot.occupancy > 80 ? 'var(--danger)' : spot.occupancy > 50 ? 'var(--warning)' : 'var(--success)',
                    borderRadius: 'var(--radius-full)'
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Bookings */}
        {tab === 'bookings' && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Spot</th>
                  <th>Vehicle</th>
                  <th>Duration</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentBookings || []).map(b => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.user_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.user_email}</div>
                    </td>
                    <td>{b.spot_name}</td>
                    <td><span style={{ fontFamily: 'monospace' }}>{b.vehicle_number}</span></td>
                    <td>{b.duration_hours}h</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>₹{b.total_amount}</td>
                    <td>{statusBadge(b.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Spot Modal */}
        {showAddSpot && (
          <div className="modal-overlay" onClick={() => setShowAddSpot(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="heading-sm">Add Parking Spot</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddSpot(false)}>✕</button>
              </div>
              <form onSubmit={handleAddSpot}>
                <div className="modal-body">
                  <div className="input-group" style={{ marginBottom: 14 }}>
                    <label>Spot Name</label>
                    <input className="input" placeholder="e.g., Central Park Parking" value={spotForm.name}
                      onChange={e => setSpotForm({...spotForm, name: e.target.value})} required id="spot-name" />
                  </div>
                  <div className="input-group" style={{ marginBottom: 14 }}>
                    <label>Address</label>
                    <input className="input" placeholder="Full address" value={spotForm.address}
                      onChange={e => setSpotForm({...spotForm, address: e.target.value})} required id="spot-address" />
                  </div>
                  <div className="input-group" style={{ marginBottom: 14 }}>
                    <label>City</label>
                    <input className="input" placeholder="e.g., Mumbai" value={spotForm.city}
                      onChange={e => setSpotForm({...spotForm, city: e.target.value})} required id="spot-city" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="input-group">
                      <label>Total Slots</label>
                      <input className="input" type="number" value={spotForm.total_slots}
                        onChange={e => setSpotForm({...spotForm, total_slots: parseInt(e.target.value)})} id="spot-slots" />
                    </div>
                    <div className="input-group">
                      <label>Price/Hour (₹)</label>
                      <input className="input" type="number" value={spotForm.price_per_hour}
                        onChange={e => setSpotForm({...spotForm, price_per_hour: parseInt(e.target.value)})} id="spot-price" />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddSpot(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" id="spot-submit">Add Spot</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
