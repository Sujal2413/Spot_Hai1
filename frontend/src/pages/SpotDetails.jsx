import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { spotsAPI, bookingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MapPin, Star, Clock, Shield, Car, Zap, CreditCard, Calendar, ArrowLeft, Check, Navigation, TrendingDown, TrendingUp, ExternalLink, QrCode, Eye } from 'lucide-react';
import ParkingLayout from '../components/ParkingLayout';

function BusynessGraph({ data, height = 50 }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
      {data.map((val, i) => {
        const pct = (val / max) * 100;
        const color = pct > 70 ? 'var(--avail-limited)' : pct > 40 ? 'var(--primary-accent)' : 'rgba(255, 204, 0,0.3)';
        return (
          <div key={i} style={{
            flex: 1, height: `${pct}%`, background: color,
            borderRadius: '3px 3px 0 0', transition: 'height 0.6s ease',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
              fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap',
            }}>
              {['Now', '+1h', '+2h', '+3h', '+4h', '+5h', '+6h', '+7h'][i]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SpotDetails() {
  const { id, spotId } = useParams();
  const effectiveId = spotId || id;
  const [searchParams] = useSearchParams();
  const [spot, setSpot] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    vehicle_number: '', vehicle_type: 'car',
    start_time: '', end_time: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpot = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await spotsAPI.getById(effectiveId);
        setSpot(res.data?.spot || null);
        setReviews(res.data?.reviews || []);
      } catch (err) {
        console.error("Failed to fetch spot details:", err);
        setError(err.response?.data?.message || err.message || 'Failed to load spot details from server');
        toast.error('Failed to load spot');
      } finally {
        setLoading(false);
      }
    };

    if (effectiveId) {
      fetchSpot();
    }
  }, [effectiveId]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!bookingForm.vehicle_number || !bookingForm.start_time || !bookingForm.end_time) {
      return toast.error('Please fill all fields');
    }
    setBookingLoading(true);
    try {
      const res = await bookingsAPI.create({ spot_id: effectiveId, ...bookingForm });
      toast.success('Booking created! Proceed to payment.');
      navigate('/payment', { state: { booking: res.data.booking } });
    } catch (err) {
      toast.error(err.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const isQuick = searchParams.get('quickReserve');
    const start = new Date(now.getTime() + (isQuick ? 5 : 30) * 60000);
    const end = new Date(start.getTime() + (isQuick ? 15 : 120) * 60000);
    const fmt = (d) => d.toISOString().slice(0, 16);
    setBookingForm(f => ({ ...f, start_time: fmt(start), end_time: fmt(end) }));
  }, [searchParams]);

  const occupancyData = [35, 50, 65, 80, 55, 40, 30, 45];
  const isPremium = spot?.price_per_hour > 50;

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading spot details...</p>
    </div>
  );
  if (error) return (
    <div className="page">
      <div className="container" style={{ textAlign: 'center', paddingTop: '10vh' }}>
        <h2 style={{ color: 'var(--danger, #ff4c4c)' }}>Spot Not Found or Error Occurred</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>{error}</p>
        <button className="btn btn-outline" style={{ marginTop: '20px' }} onClick={() => navigate('/search')}>
          Back to Search
        </button>
      </div>
    </div>
  );
  if (!spot) return <div className="page"><div className="container"><h2>Spot not found</h2></div></div>;

  const durationHrs = bookingForm.start_time && bookingForm.end_time
    ? Math.max(Math.ceil((new Date(bookingForm.end_time) - new Date(bookingForm.start_time)) / 3600000), 1) : 2;
  const estimatedCost = durationHrs * spot.price_per_hour;
  const avail = spot.available_slots / spot.total_slots;
  const mapsUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(spot.address)}`;

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 20, paddingBottom: 48 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
          <ArrowLeft size={16} /> Back to Search
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
          {/* Left Column */}
          <div>
            {/* Spot Image */}
            <div style={{
              height: 300, borderRadius: 'var(--radius-xl)', overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(108,92,231,0.3), rgba(255, 204, 0,0.1)), linear-gradient(135deg, var(--bg-tertiary), var(--bg-card))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 24, position: 'relative',
            }}>
              <Car size={80} color="rgba(255, 204, 0,0.15)" />
              <div style={{ position: 'absolute', top: 16, left: 16 }}>
                <span className="badge badge-accent">{spot.spot_type?.toUpperCase()}</span>
              </div>
              <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(11,1,20,0.7)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 204, 0,0.15)' }}>
                <span style={{ fontWeight: 800, color: 'var(--primary-accent)', fontSize: '1.2rem' }}>₹{spot.price_per_hour}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/hr</span>
              </div>
              {/* Dynamic pricing badge */}
              <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
                <span className={`pricing-indicator ${isPremium ? 'premium' : 'lower'}`} style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
                  {isPremium ? <><TrendingUp size={12} /> Premium pricing</> : <><TrendingDown size={12} /> Lower than usual</>}
                </span>
              </div>
            </div>

            {/* Spot Info */}
            <h1 className="heading-lg" style={{ marginBottom: 8 }}>{spot.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, color: 'var(--text-muted)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={16} color="var(--primary-accent)" /> {spot.address}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning)' }}>
                <Star size={16} fill="var(--warning)" strokeWidth={0} /> {spot.rating} ({spot.total_reviews} reviews)
              </span>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="btn btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize: '0.8rem', color: 'var(--primary-accent)' }}>
                <Navigation size={14} /> Navigate <ExternalLink size={11} />
              </a>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28, fontSize: '0.95rem' }}>{spot.description}</p>

            {/* Availability + Busyness */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h3 className="heading-sm">Real-Time Availability</h3>
                <span className="live-badge" style={{ fontSize: '0.85rem' }}>
                  <span className={`live-dot ${avail > 0.3 ? 'high' : avail > 0 ? 'limited' : 'full'}`} />
                  Live
                </span>
              </div>
              <div style={{ display: 'flex', gap: 32, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary-accent)' }}>{spot.available_slots}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Available</div>
                </div>
                <div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{spot.total_slots}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Slots</div>
                </div>
                <div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: avail > 0.3 ? 'var(--success)' : 'var(--warning)' }}>
                    {Math.round((1 - avail) * 100)}%
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Occupancy</div>
                </div>
              </div>
              {/* Occupancy bar */}
              <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 20 }}>
                <div style={{
                  width: `${(1 - avail) * 100}%`,
                  height: '100%', background: 'var(--gradient-accent)', borderRadius: 'var(--radius-full)',
                  transition: 'width 1s ease',
                }} />
              </div>

              {/* Busyness Prediction */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Predicted Occupancy</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next 8 hours</span>
                </div>
                <BusynessGraph data={occupancyData} height={60} />
              </div>
            </div>

            {/* Interactive Parking Layout */}
            <ParkingLayout
              spot={spot}
              selectedSlotId={selectedSlot?.id || null}
              onSlotSelect={(slot) => setSelectedSlot(slot)}
            />

            {/* Amenities */}
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 className="heading-sm" style={{ marginBottom: 16 }}>Amenities & Features</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {(spot.amenities || []).map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                    background: 'rgba(255, 204, 0,0.04)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255, 204, 0,0.1)', fontSize: '0.85rem',
                  }}>
                    <Check size={14} color="var(--primary-accent)" /> {a}
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="card">
                <h3 className="heading-sm" style={{ marginBottom: 16 }}>Reviews</h3>
                {reviews.map((r, i) => (
                  <div key={i} style={{ padding: '16px 0', borderBottom: i < reviews.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <strong style={{ fontSize: '0.9rem' }}>{r.user_name}</strong>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[...Array(5)].map((_, s) => (
                          <Star key={s} size={13} fill={s < r.rating ? 'var(--warning)' : 'none'} color={s < r.rating ? 'var(--warning)' : 'var(--text-muted)'} strokeWidth={s < r.rating ? 0 : 1} />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column — Booking */}
          <div>
            <div className="card" style={{ position: 'sticky', top: 92, border: '1px solid rgba(255, 204, 0,0.15)' }}>
              <h3 className="heading-sm" style={{ marginBottom: 6 }}>Book This Spot</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                {searchParams.get('quickReserve') ? '⚡ Quick Reserve — 15min slot' : 'Reserve your parking slot'}
              </p>

              <form onSubmit={handleBook}>
                <div className="input-group" style={{ marginBottom: 14 }}>
                  <label>Vehicle Number</label>
                  <input className="input" placeholder="MH-12-AB-1234" id="book-vehicle"
                    value={bookingForm.vehicle_number} onChange={e => setBookingForm({...bookingForm, vehicle_number: e.target.value})} />
                </div>
                {selectedSlot && (
                  <div className="input-group" style={{ marginBottom: 14 }}>
                    <label>Selected Slot</label>
                    <div style={{
                      padding: '12px 16px', background: 'rgba(255,204,0,0.06)',
                      borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,204,0,0.15)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary-accent)', fontSize: '1rem' }}>{selectedSlot.id}</span>
                      {selectedSlot.isEv && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--primary-accent)' }}>
                          <Zap size={12} /> EV Charging
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div className="input-group" style={{ marginBottom: 14 }}>
                  <label>Vehicle Type</label>
                  <select className="input" value={bookingForm.vehicle_type} id="book-vehicle-type"
                    onChange={e => setBookingForm({...bookingForm, vehicle_type: e.target.value})}>
                    <option value="car">🚗 Car / Sedan</option>
                    <option value="bike">🏍️ Bike</option>
                    <option value="suv">🚙 SUV</option>
                    <option value="ev">⚡ Electric Vehicle</option>
                    <option value="hatchback">🚙 Hatchback</option>
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 14 }}>
                  <label>Start Time</label>
                  <input className="input" type="datetime-local" id="book-start"
                    value={bookingForm.start_time} onChange={e => setBookingForm({...bookingForm, start_time: e.target.value})} />
                </div>
                <div className="input-group" style={{ marginBottom: 20 }}>
                  <label>End Time</label>
                  <input className="input" type="datetime-local" id="book-end"
                    value={bookingForm.end_time} onChange={e => setBookingForm({...bookingForm, end_time: e.target.value})} />
                </div>

                {/* Summary */}
                <div style={{ background: 'rgba(255, 204, 0,0.04)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20, border: '1px solid rgba(255, 204, 0,0.08)' }}>
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Rate</span>
                    <span style={{ fontSize: '0.9rem' }}>₹{spot.price_per_hour}/hr</span>
                  </div>
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Duration</span>
                    <span style={{ fontSize: '0.9rem' }}>{durationHrs} hour{durationHrs > 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 8, marginTop: 8 }} className="flex-between">
                    <span style={{ fontWeight: 600 }}>Total</span>
                    <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary-accent)' }}>₹{estimatedCost}</span>
                  </div>
                </div>

                <button type="submit" className="btn btn-accent btn-full btn-lg" disabled={bookingLoading} id="book-submit">
                  {bookingLoading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : '⚡ Book Now'}
                </button>
              </form>

              {/* Navigate to dest */}
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="btn btn-outline btn-full" style={{ marginTop: 12 }}>
                <Navigation size={16} /> Navigate to Destination
              </a>

              {!isAuthenticated && (
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 12 }}>
                  You'll need to <Link to="/login" style={{ color: 'var(--primary-accent)' }}>log in</Link> to complete booking
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
