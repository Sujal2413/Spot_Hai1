import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Search, User, LogOut, LayoutDashboard, History, Settings, ChevronDown, Car } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); setDropdownOpen(false); };
  const isActive = (path) => location.pathname === path ? 'active' : '';

  const isAuthPage = ['/login', '/signup', '/verify-otp', '/forgot-password'].includes(location.pathname);
  if (isAuthPage) return null;

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="nav-logo">
          <div className="nav-logo-icon">
            <Car size={26} color="#0B0114" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 400, fontSize: '1.6rem', letterSpacing: '-0.02em', marginLeft: '4px' }}>SpotHai</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
          <Link to="/search" className={`nav-link ${isActive('/search')}`}>Find Parking</Link>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>Dashboard</Link>
              <Link to="/bookings" className={`nav-link ${isActive('/bookings')}`}>My Bookings</Link>
            </>
          )}
        </div>

        <div className="nav-actions">
          {isAuthenticated ? (
            <div style={{ position: 'relative' }} ref={dropRef}>
              <div className="nav-avatar" onClick={() => setDropdownOpen(!dropdownOpen)} id="nav-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              {dropdownOpen && (
                <div className="nav-dropdown">
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                    <span className="badge badge-accent" style={{ marginTop: 6 }}>{user?.role}</span>
                  </div>
                  <div className="nav-dropdown-item" onClick={() => { navigate('/dashboard'); setDropdownOpen(false); }}>
                    <LayoutDashboard size={16} /> Dashboard
                  </div>
                  <div className="nav-dropdown-item" onClick={() => { navigate('/bookings'); setDropdownOpen(false); }}>
                    <History size={16} /> Bookings
                  </div>
                  <div className="nav-dropdown-item" onClick={() => { navigate('/profile'); setDropdownOpen(false); }}>
                    <Settings size={16} /> Profile
                  </div>
                  {(user?.role === 'operator' || user?.role === 'admin') && (
                    <div className="nav-dropdown-item" onClick={() => { navigate('/operator'); setDropdownOpen(false); }}>
                      <LayoutDashboard size={16} /> Operator Panel
                    </div>
                  )}
                  <div className="nav-dropdown-divider" />
                  <div className="nav-dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
                    <LogOut size={16} /> Logout
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Log In</Link>
              <Link to="/signup" className="btn btn-accent btn-sm">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
