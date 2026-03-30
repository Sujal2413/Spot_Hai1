import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { spotsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Search, MapPin, Filter, SlidersHorizontal, Star, Car, Bike, Zap, Eye, Shield, Clock, Navigation, TrendingDown, TrendingUp, ChevronDown, Sparkles, X, Wifi } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Create a custom icon generator
const customMapIcon = (isHovered) => new L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background: ${isHovered ? 'var(--primary-accent)' : 'var(--bg-tertiary)'}; border: 2px solid ${isHovered ? 'var(--bg-primary)' : 'var(--primary-accent)'}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: ${isHovered ? '0 0 16px rgba(255,204,0,0.8)' : '0 4px 12px rgba(0,0,0,0.5)'}; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: scale(${isHovered ? 1.2 : 1}); z-index: ${isHovered ? 1000 : 1}">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${isHovered ? '#000' : 'var(--primary-accent)'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Map movement listener component
function MapEvents({ onBoundsChange }) {
  useMapEvents({
    moveend(e) {
      if (onBoundsChange) onBoundsChange(e.target.getBounds());
    }
  });
  return null;
}

// Predictive Busy-ness Graph component
function BusynessGraph({ data }) {
  const max = Math.max(...data);
  return (
    <div className="busyness-graph">
      {data.map((val, i) => {
        const pct = (val / max) * 100;
        const color = pct > 70 ? 'var(--avail-limited)' : pct > 40 ? 'var(--primary-accent)' : 'rgba(255, 204, 0,0.3)';
        return (
          <div key={i} className="busyness-bar" style={{ height: `${pct}%`, background: color }} title={`${Math.round(pct)}% occupied`} />
        );
      })}
    </div>
  );
}

// Mini-detail modal on marker click
function MiniDetail({ spot, onClose, onBook }) {
  if (!spot) return null;
  const avail = spot.available_slots / spot.total_slots;
  const occupancy = [40, 55, 70, 85, 60, 45, 35, 50];
  const isPremium = spot.price_per_hour > 50;

  return (
    <div style={{
      position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 10,
      background: 'rgba(26,2,50,0.95)', backdropFilter: 'blur(20px)',
      borderRadius: 'var(--radius-xl)', padding: 24,
      border: '1px solid var(--border-hover)',
      boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
      animation: 'snapIn 0.3s ease',
    }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
        <X size={18} />
      </button>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>{spot.name}</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>{spot.address}</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <span className="live-badge">
              <span className={`live-dot ${avail > 0.3 ? 'high' : avail > 0 ? 'limited' : 'full'}`} />
              <span style={{ color: avail > 0.3 ? 'var(--avail-high)' : avail > 0 ? 'var(--avail-limited)' : 'var(--text-muted)' }}>
                {spot.available_slots} Slots Available
              </span>
            </span>
            <span className={`pricing-indicator ${isPremium ? 'premium' : 'lower'}`}>
              {isPremium ? <><TrendingUp size={10} /> Premium</> : <><TrendingDown size={10} /> Lower than usual</>}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {(Array.isArray(spot.amenities) ? spot.amenities : (spot.amenities || 'CCTV,EV Charging').split(',')).slice(0, 4).map((a, i) => (
              <span key={i} className="amenity-tag">{a.trim ? a.trim() : a}</span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-accent)' }}>₹{spot.price_per_hour}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>per hour</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Next 4 hrs</div>
            <BusynessGraph data={occupancy} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Link to={`/spots/${spot.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
          View Details
        </Link>
        <button onClick={() => onBook(spot)} className="quick-reserve" style={{ flex: 1, marginTop: 0 }}>
          ⚡ Quick Reserve 15min
        </button>
      </div>
    </div>
  );
}

// Skeleton Card for loading
function SkeletonCard() {
  return (
    <div className="skeleton skeleton-card" style={{ overflow: 'hidden' }}>
      <div style={{ height: 200, background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, rgba(255, 204, 0,0.04) 50%, var(--bg-tertiary) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
      <div style={{ padding: 20 }}>
        <div className="skeleton skeleton-line" style={{ width: '70%' }} />
        <div className="skeleton skeleton-line short" />
        <div className="skeleton skeleton-line medium" style={{ marginTop: 16 }} />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('rating');
  const [vehicleType, setVehicleType] = useState('');
  const [showEVOnly, setShowEVOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMapSpot, setSelectedMapSpot] = useState(null);
  const [hoveredSpot, setHoveredSpot] = useState(null);
  const cardRefs = useRef({});
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadSpots();
  }, [city, type, sort]);

  const loadSpots = async (bounds = null) => {
    setLoading(true);
    try {
      const params = {};
      if (city) params.city = city;
      if (type) params.type = type;
      if (sort) params.sort = sort;
      if (bounds) {
        params.neLat = bounds.getNorthEast().lat;
        params.neLng = bounds.getNorthEast().lng;
        params.swLat = bounds.getSouthWest().lat;
        params.swLng = bounds.getSouthWest().lng;
      }
      const data = await spotsAPI.search(params);
      let results = data.data || [];

      if (showEVOnly) {
        results = results.filter(s => {
          const a = Array.isArray(s.amenities) ? s.amenities.join(',') : (s.amenities || '');
          return a.toLowerCase().includes('ev');
        });
      }

      setSpots(results);
    } catch (err) {
      toast.error('Failed to load spots');
    } finally {
      setLoading(false);
    }
  };

  const filteredSpots = spots.filter(s =>
    !query || s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.address?.toLowerCase().includes(query.toLowerCase())
  );

  const handleQuickReserve = (spot) => {
    navigate(`/spots/${spot.id}?quickReserve=true`);
    toast.success(`Quick-reserving at ${spot.name}!`);
  };

  const getAvailColor = (spot) => {
    const ratio = spot.available_slots / spot.total_slots;
    if (ratio > 0.3) return 'var(--avail-high)';
    if (ratio > 0) return 'var(--avail-limited)';
    return 'var(--avail-full)';
  };

  const getAvailClass = (spot) => {
    const ratio = spot.available_slots / spot.total_slots;
    if (ratio > 0.3) return 'high';
    if (ratio > 0) return 'limited';
    return 'full';
  };

  const types = ['outdoor', 'indoor', 'underground', 'multilevel'];
  const vehicleTypes = ['Hatchback', 'Sedan', 'SUV', 'Bike'];

  try {
    return (
      <div className="page" style={{ paddingTop: 72 }}>
      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        {/* Page Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 className="heading-lg" style={{ marginBottom: 6 }}>
            Find <span style={{ color: 'var(--primary-accent)' }}>Parking</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Discover available parking spots in your city
          </p>
        </div>

        {/* Command Center Search Bar */}
        <div className="command-center" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', color: 'var(--primary-accent)' }}>
            <Sparkles size={18} />
          </div>
          <input
            className="input"
            placeholder='Try "Parking near Gateway of India under ₹50"'
            value={query}
            onChange={e => setQuery(e.target.value)}
            id="search-input"
          />
          <div className="search-divider" />
          <select
            className="input"
            style={{ background: 'transparent', border: 'none', maxWidth: 180, cursor: 'pointer' }}
            value={city}
            onChange={e => setCity(e.target.value)}
            id="city-select"
          >
            <option value="">All Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Pune">Pune</option>
            <option value="Kolkata">Kolkata</option>
          </select>
          <button className="btn btn-accent" onClick={loadSpots} id="search-btn">
            <Search size={18} /> Search
          </button>
        </div>

        {/* Mobility Tray — Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <SlidersHorizontal size={16} />
          </div>

          {/* Type filters */}
          <div className="filter-chips">
            <button className={`filter-chip ${type === '' ? 'active' : ''}`} onClick={() => setType('')}>All Types</button>
            {types.map(t => (
              <button key={t} className={`filter-chip ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 4px' }} />

          {/* EV Toggle */}
          <button
            className={`filter-chip ${showEVOnly ? 'active' : ''}`}
            onClick={() => { setShowEVOnly(!showEVOnly); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Zap size={14} /> EV Charging
          </button>

          {/* Vehicle filter */}
          <select
            className="filter-chip"
            style={{ background: vehicleType ? 'rgba(255, 204, 0,0.1)' : 'var(--bg-tertiary)', border: vehicleType ? '1px solid rgba(255, 204, 0,0.3)' : '1px solid var(--border)', color: vehicleType ? 'var(--primary-accent)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
            value={vehicleType}
            onChange={e => setVehicleType(e.target.value)}
          >
            <option value="">🚗 Vehicle</option>
            {vehicleTypes.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          {/* Icon filters */}
          {[
            { icon: <Eye size={14} />, label: 'CCTV', key: 'cctv' },
            { icon: <Shield size={14} />, label: 'Covered', key: 'covered' },
            { icon: <Clock size={14} />, label: '24/7', key: '247' },
          ].map(f => (
            <button key={f.key} className="filter-chip" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {f.icon} {f.label}
            </button>
          ))}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <select
              className="filter-chip"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="rating">Top Rated</option>
              <option value="price_asc">Lowest Price</option>
              <option value="price_desc">Highest Price</option>
              <option value="availability">Most Available</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredSpots.length}</strong> parking spots
          {query && <> for "<span style={{ color: 'var(--primary-accent)' }}>{query}</span>"</>}
        </p>

        {/* Results Grid & Maps — Nova Split View */}
        <div style={{ display: 'flex', gap: 24, height: '800px', marginTop: 10 }}>
          {/* Left panel - scrollable cards */}
          <div style={{ flex: '1 1 40%', overflowY: 'auto', paddingRight: 10, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : filteredSpots.length === 0 ? (
              <div className="empty-state">
                <MapPin size={48} />
                <h3>No spots found in area</h3>
                <p>Try adjusting your search or moving the map</p>
              </div>
            ) : (
              filteredSpots.map((spot, idx) => {
                const avail = spot.available_slots / spot.total_slots;
                const isPremium = spot.price_per_hour > 50;
                const occupancy = [
                  30 + Math.random() * 40, 40 + Math.random() * 30, 50 + Math.random() * 30, 60 + Math.random() * 25,
                  45 + Math.random() * 35, 35 + Math.random() * 25, 25 + Math.random() * 30, 40 + Math.random() * 35,
                ];

                return (
                  <div 
                    key={spot.id} 
                    className="nova-card" 
                    style={{ 
                      animationDelay: `${idx * 0.05}s`, 
                      border: hoveredSpot === spot.id || selectedMapSpot === spot.id ? '1px solid var(--primary-accent)' : '1px solid var(--border)',
                      transform: hoveredSpot === spot.id || selectedMapSpot === spot.id ? 'translateY(-2px)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={() => setHoveredSpot(spot.id)}
                    onMouseLeave={() => setHoveredSpot(null)}
                    ref={el => cardRefs.current[spot.id] = el}
                  >
                    <Link to={`/spots/${spot.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="nova-card-image" style={{ height: 120, background: `linear-gradient(135deg, rgba(108,92,231,0.3), rgba(255, 204, 0,0.1)), linear-gradient(135deg, var(--bg-tertiary), var(--bg-card))` }}>
                        <span className="badge badge-accent type-badge" style={{ zIndex: 3 }}>
                          {spot.type?.toUpperCase() || 'PARKING'}
                        </span>
                        <div className="price-tag" style={{ zIndex: 3 }}>₹{spot.price_per_hour}/hr</div>
                      </div>
                    </Link>

                    <div className="nova-card-body" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <Link to={`/spots/${spot.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                          <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>{spot.name}</h3>
                        </Link>
                        <span className={`pricing-indicator ${isPremium ? 'premium' : 'lower'}`}>
                          {isPremium ? <><TrendingUp size={10} /> Premium</> : <><TrendingDown size={10} /> Lower</>}
                        </span>
                      </div>

                      <p className="address" style={{ fontSize: '0.8rem', marginBottom: 12 }}><MapPin size={12} /> {spot.address}</p>

                      <div className="nova-card-meta" style={{ marginBottom: 12 }}>
                        <div className="live-badge">
                          <span className={`live-dot ${getAvailClass(spot)}`} />
                          <span style={{ color: getAvailColor(spot), fontSize: '0.8rem' }}>
                            {spot.available_slots} Slots Now
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, padding: '8px 0', fontSize: '0.8rem' }}
                          onClick={(e) => { e.preventDefault(); navigate(`/spots/${spot.id}`); }}
                        >
                          Details
                        </button>
                        <button
                          className="quick-reserve"
                          style={{ flex: 1, padding: '8px 0', fontSize: '0.8rem', marginTop: 0 }}
                          onClick={(e) => { e.preventDefault(); handleQuickReserve(spot); }}
                        >
                          ⚡ Quick 15min
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right panel - Leaflet Map */}
          <div style={{ flex: '1 1 60%', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
            <MapContainer 
              center={[city === 'Delhi' ? 28.7041 : city === 'Bangalore' ? 12.9716 : 19.0760, city === 'Delhi' ? 77.1025 : city === 'Bangalore' ? 77.5946 : 72.8777]} 
              zoom={12} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer 
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              <MapEvents onBoundsChange={(bounds) => loadSpots(bounds)} />
              {filteredSpots.map(spot => (
                <Marker 
                  key={spot.id} 
                  position={[spot.lat, spot.lng]}
                  icon={customMapIcon(hoveredSpot === spot.id || selectedMapSpot === spot.id)}
                  eventHandlers={{
                    click: () => {
                      setSelectedMapSpot(spot.id);
                      if(cardRefs.current[spot.id]) {
                        cardRefs.current[spot.id].scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    },
                    mouseover: () => setHoveredSpot(spot.id),
                    mouseout: () => setHoveredSpot(null)
                  }}
                >
                  <Popup className="premium-popup">
                    <div style={{ padding: '8px', textAlign: 'center', background: 'var(--bg-card)' }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{spot.name}</h4>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--primary-accent)' }}>₹{spot.price_per_hour}/hr</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)'}}>{spot.available_slots} slots left</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

      </div>
    </div>
    );
  } catch (renderError) {
    return (
      <div style={{ marginTop: '100px', padding: '20px', color: 'red', background: 'white' }}>
        <h2>SearchPage Render Error:</h2>
        <pre>{renderError.stack}</pre>
      </div>
    );
  }
}
