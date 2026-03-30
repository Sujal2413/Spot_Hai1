import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Search, Clock, Shield, CreditCard, Star, ArrowRight, Car, Bike, Zap, ChevronRight, Users, Building2, QrCode, Navigation, Sparkles, TrendingDown, Eye, Wifi } from 'lucide-react';

// Interactive SVG Mesh Component
function MeshBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const pointsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    // Generate city coordinate mesh points
    const pts = [];
    for (let i = 0; i < 60; i++) {
      pts.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        ox: 0, oy: 0,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
      });
    }
    pointsRef.current = pts;

    const handleMouse = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', handleMouse);

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      pts.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Mouse influence
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const force = (200 - dist) / 200;
          p.ox = dx * force * 0.05;
          p.oy = dy * force * 0.05;
        } else {
          p.ox *= 0.95;
          p.oy *= 0.95;
        }
      });

      // Draw connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = (pts[i].x + pts[i].ox) - (pts[j].x + pts[j].ox);
          const dy = (pts[i].y + pts[i].oy) - (pts[j].y + pts[j].oy);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const alpha = (180 - dist) / 180 * 0.12;
            ctx.beginPath();
            ctx.moveTo(pts[i].x + pts[i].ox, pts[i].y + pts[i].oy);
            ctx.lineTo(pts[j].x + pts[j].ox, pts[j].y + pts[j].oy);
            ctx.strokeStyle = `rgba(255, 204, 0, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw points
      pts.forEach(p => {
        const px = p.x + p.ox;
        const py = p.y + p.oy;
        const dx = mx - px;
        const dy = my - py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const glow = dist < 150 ? (150 - dist) / 150 : 0;

        ctx.beginPath();
        ctx.arc(px, py, p.size + glow * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 204, 0, ${0.3 + glow * 0.5})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.6 }} />;
}

// Floating Phone Mockup
function PhoneMockup({ screen, style, className }) {
  const screens = {
    map: (
      <div style={{ background: '#0B0114', height: '100%', padding: 12, position: 'relative' }}>
        <div style={{ background: 'linear-gradient(135deg, #1A0232, #22053F)', borderRadius: 12, height: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 40%, rgba(255, 204, 0,0.08), transparent)' }} />
          {[
            { left: '20%', top: '30%', price: '₹40', color: '#FFCC00' },
            { left: '60%', top: '45%', price: '₹60', color: '#FFC92C' },
            { left: '40%', top: '65%', price: '₹30', color: '#FFCC00' },
          ].map((m, i) => (
            <div key={i} style={{
              position: 'absolute', left: m.left, top: m.top,
              background: 'rgba(11,1,20,0.8)', backdropFilter: 'blur(8px)',
              padding: '3px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700,
              color: m.color, border: `1px solid ${m.color}40`,
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: m.color, boxShadow: `0 0 4px ${m.color}` }} />
              {m.price}
            </div>
          ))}
          <Navigation size={14} color="rgba(255, 204, 0,0.3)" />
        </div>
        <div style={{ marginTop: 8, background: 'var(--bg-tertiary)', borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: '#F0F0FF', marginBottom: 4 }}>Near You</div>
          <div style={{ fontSize: 7, color: '#6B6E8A' }}>3 spots available</div>
        </div>
      </div>
    ),
    slots: (
      <div style={{ background: '#0B0114', height: '100%', padding: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#F0F0FF', marginBottom: 8 }}>Select Slot</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
          {[1,1,1,0,1,0,1,1,0,1,1,1,1,0,1,1].map((avail, i) => (
            <div key={i} style={{
              height: 20, borderRadius: 4,
              background: i === 6 ? 'rgba(255, 204, 0,0.3)' : avail ? 'rgba(255, 204, 0,0.08)' : 'rgba(255,107,107,0.15)',
              border: i === 6 ? '1px solid #FFCC00' : '1px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 6, color: avail ? '#FFCC00' : '#FF6B6B',
            }}>
              {i === 6 ? '✓' : avail ? 'A' + (i+1) : '✕'}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, background: '#FFCC00', borderRadius: 6, padding: '5px 0', textAlign: 'center', fontSize: 8, fontWeight: 700, color: '#0B0114' }}>
          Reserve A7 · ₹40/hr
        </div>
      </div>
    ),
    qr: (
      <div style={{ background: '#0B0114', height: '100%', padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFCC00', marginBottom: 6, boxShadow: '0 0 12px #FFCC00' }} />
        <div style={{ fontSize: 9, fontWeight: 700, color: '#FFCC00', marginBottom: 8 }}>Booking Confirmed!</div>
        <div style={{ width: 60, height: 60, background: 'rgba(255, 204, 0,0.08)', borderRadius: 8, border: '2px dashed rgba(255, 204, 0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QrCode size={32} color="rgba(255, 204, 0,0.6)" />
        </div>
        <div style={{ fontSize: 7, color: '#6B6E8A', marginTop: 6 }}>Scan at entry gate</div>
      </div>
    ),
  };

  return (
    <div style={{ ...style }} className={className}>
      <div style={{
        width: 140, height: 280, borderRadius: 24, overflow: 'hidden',
        border: '2px solid rgba(255, 204, 0,0.15)',
        background: 'var(--bg-primary)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255, 204, 0,0.08)',
        position: 'relative',
      }}>
        {/* Notch */}
        <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 40, height: 14, background: '#0B0114', borderRadius: 10, zIndex: 5 }}>
          <div style={{ position: 'absolute', right: 8, top: 4, width: 5, height: 5, borderRadius: '50%', background: 'rgba(255, 204, 0,0.3)' }} />
        </div>
        <div style={{ paddingTop: 20, height: '100%' }}>
          {screens[screen]}
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();

  const features = [
    { icon: <Search size={24} />, title: 'AI-Powered Search', desc: 'Natural language search — "Parking near Gateway of India under ₹50". SpotHai understands intent.', badge: 'AI' },
    { icon: <Clock size={24} />, title: 'Instant Booking', desc: 'One-tap Quick-Reserve for the next 15 minutes. No forms, no friction.', badge: 'FAST' },
    { icon: <Shield size={24} />, title: 'Verified Security', desc: 'CCTV, gated access, covered parking — filter by your security needs.', badge: null },
    { icon: <CreditCard size={24} />, title: 'Smart Payments', desc: 'UPI, cards, wallets. Dynamic pricing shows when rates are lower than usual.', badge: null },
    { icon: <Zap size={24} />, title: 'EV-First Design', desc: 'Dedicated toggle for EV charging stations. Slow/fast charge filters.', badge: 'EV' },
    { icon: <Eye size={24} />, title: 'Predictive Availability', desc: '"Busy-ness" graphs show expected occupancy for the next 4 hours.', badge: 'SMART' },
  ];

  const steps = [
    { num: '01', title: 'Search Smart', desc: 'Enter any query in natural language. Our AI finds the best matches.', icon: <Search size={28} /> },
    { num: '02', title: 'Compare Live', desc: 'See real-time prices, availability bars, and dynamic pricing on the map.', icon: <MapPin size={28} /> },
    { num: '03', title: 'Quick Reserve', desc: 'One tap to book. No forms for immediate needs — reserve for next 15 min.', icon: <Zap size={28} /> },
    { num: '04', title: 'Scan & Park', desc: 'Get QR pass. Scan at entry. AR navigation guides you to your exact slot.', icon: <QrCode size={28} /> },
  ];

  return (
    <div className="page" style={{ paddingTop: 0 }}>
      {/* ====== MOTION HERO ====== */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(160deg, #0B0114 0%, #1A0232 50%, #110320 100%)',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 72,
      }}>
        <MeshBackground />

        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: '5%', right: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(108,92,231,0.12), transparent)', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(255, 204, 0,0.06), transparent)', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0 }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 80, alignItems: 'center' }}>
            {/* Left: Content Stack */}
            <div className="animate-fadeIn">
              <div className="badge badge-accent" style={{ marginBottom: 24, fontSize: '0.78rem' }}>
                <Sparkles size={12} /> CONTACTLESS SMART PARKING
              </div>
              <h1 className="heading-xl" style={{ marginBottom: 28 }}>
                Smarter<br />
                Contactless<br />
                <span style={{ color: 'var(--primary-accent)' }}>Parking.</span>
              </h1>
              <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: 480, marginBottom: 40, lineHeight: 1.8 }}>
                Find, book, and navigate to parking in seconds. Real-time availability,
                dynamic pricing, and AR-guided entry across 2,500+ verified spots.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Link to={isAuthenticated ? '/search' : '/signup'} className="btn btn-accent btn-lg" id="hero-cta">
                  {isAuthenticated ? 'Find Parking' : 'Get Started Free'} <ArrowRight size={18} />
                </Link>
                <Link to="/search" className="btn btn-outline btn-lg">
                  Explore Map
                </Link>
              </div>

              {/* Social Proof Strip */}
              <div className="social-proof-strip" style={{ marginTop: 48 }}>
                <div className="social-proof-item">
                  <div className="social-proof-icon"><Users size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>5,000+</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trusted Land Owners</div>
                  </div>
                </div>
                <div className="social-proof-divider" />
                <div className="social-proof-item">
                  <div className="social-proof-icon"><Shield size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>99.9%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Booking Accuracy</div>
                  </div>
                </div>
                <div className="social-proof-divider" />
                <div className="social-proof-item">
                  <div className="social-proof-icon"><Star size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>4.8★</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>App Rating</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Floating Device Mockups */}
            <div style={{ position: 'relative', height: 520 }} className="animate-slideUp">
              <PhoneMockup screen="map" className="animate-float" style={{ position: 'absolute', top: 0, right: 60, zIndex: 3, transform: 'perspective(800px) rotateY(-8deg)' }} />
              <PhoneMockup screen="slots" className="animate-floatSlow" style={{ position: 'absolute', top: 80, right: -10, zIndex: 2, transform: 'perspective(800px) rotateY(-5deg) scale(0.9)', opacity: 0.85 }} />
              <PhoneMockup screen="qr" className="animate-float" style={{ position: 'absolute', top: 160, right: 130, zIndex: 1, transform: 'perspective(800px) rotateY(-3deg) scale(0.8)', opacity: 0.7, animationDelay: '1s' }} />

              {/* Floating pill markers */}
              <div className="pill-marker animate-float" style={{ position: 'absolute', top: 40, left: 0, animationDelay: '0.5s' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFCC00', boxShadow: '0 0 6px #FFCC00' }} />
                ₹30/hr
                <div className="avail-bar"><div className="avail-bar-fill" style={{ width: '75%', background: '#FFCC00' }} /></div>
              </div>
              <div className="pill-marker animate-floatSlow" style={{ position: 'absolute', bottom: 120, left: 20, animationDelay: '1.5s' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFC92C', boxShadow: '0 0 6px #FFC92C' }} />
                ₹60/hr
                <div className="avail-bar"><div className="avail-bar-fill" style={{ width: '25%', background: '#FFC92C' }} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== SMART FEATURES ====== */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: 64 }}>
            <span className="badge badge-accent" style={{ marginBottom: 16 }}>THE SMART LAYER</span>
            <h2 className="heading-lg">Beyond Just <span style={{ color: 'var(--primary-accent)' }}>Finding Parking</span></h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 12, maxWidth: 600, margin: '12px auto 0' }}>
              AI-powered search, predictive availability, dynamic pricing — everything to make parking invisible.
            </p>
          </div>
          <div className="grid grid-3" style={{ gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} className="card" style={{ textAlign: 'left', padding: 32, position: 'relative' }}>
                {f.badge && (
                  <span className="badge badge-accent" style={{ position: 'absolute', top: 16, right: 16, fontSize: '0.65rem', padding: '2px 8px' }}>
                    {f.badge}
                  </span>
                )}
                <div style={{
                  width: 52, height: 52, borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 204, 0,0.08)', color: 'var(--primary-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20, border: '1px solid rgba(255, 204, 0,0.12)'
                }}>
                  {f.icon}
                </div>
                <h3 className="heading-sm" style={{ marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: 64 }}>
            <span className="badge badge-accent" style={{ marginBottom: 16 }}>HOW IT WORKS</span>
            <h2 className="heading-lg">Park in <span style={{ color: 'var(--primary-accent)' }}>4 Steps</span></h2>
          </div>
          <div className="grid grid-4" style={{ gap: 20 }}>
            {steps.map((s, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: 32, position: 'relative' }}>
                <div style={{
                  fontSize: '3rem', fontWeight: 900, lineHeight: 1,
                  background: 'linear-gradient(135deg, var(--primary-accent), transparent)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  marginBottom: 20, opacity: 0.4,
                }}>
                  {s.num}
                </div>
                <div style={{
                  width: 56, height: 56, borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 204, 0,0.08)', color: 'var(--primary-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', border: '1px solid rgba(255, 204, 0,0.12)'
                }}>
                  {s.icon}
                </div>
                <h3 className="heading-sm" style={{ marginBottom: 10 }}>{s.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== DISCOVERY PREVIEW ====== */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <span className="badge badge-accent" style={{ marginBottom: 16 }}>DISCOVERY ENGINE</span>
              <h2 className="heading-lg" style={{ marginBottom: 16 }}>The <span style={{ color: 'var(--primary-accent)' }}>Map Marketplace</span></h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 32 }}>
                Intelligent pill markers show real-time prices and availability bars.
                Our "Command Center" search bar understands natural language —
                just type what you need.
              </p>

              {/* Feature highlights */}
              {[
                { icon: <Search size={18} />, title: 'Natural Language Search', desc: '"Covered parking near Bandra under ₹50 with EV charging"' },
                { icon: <TrendingDown size={18} />, title: 'Dynamic Pricing', desc: 'See when rates are "Lower than usual" vs "Premium" demand hours' },
                { icon: <Navigation size={18} />, title: 'Navigate After Booking', desc: 'One-tap Google Maps / Waze integration to reach your spot' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: 'rgba(255, 204, 0,0.08)', color: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255, 204, 0,0.12)' }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.95rem' }}>{f.title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Map Preview Card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ height: 340, background: 'linear-gradient(135deg, #1A0232, #22053F)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 40% 50%, rgba(255, 204, 0,0.06), transparent)' }} />

                {/* Command Center mockup */}
                <div style={{ position: 'absolute', top: 16, left: 16, right: 16, background: 'rgba(11,1,20,0.8)', backdropFilter: 'blur(12px)', borderRadius: 16, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255, 204, 0,0.1)', zIndex: 3 }}>
                  <Search size={16} color="var(--primary-accent)" />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Parking near Gateway of India under ₹50...</span>
                  <Sparkles size={14} color="var(--primary-accent)" style={{ marginLeft: 'auto' }} />
                </div>

                {/* Pill markers on map */}
                {[
                  { left: '15%', top: '40%', price: '₹30', avail: 80, color: '#FFCC00' },
                  { left: '55%', top: '35%', price: '₹45', avail: 55, color: '#FFCC00' },
                  { left: '70%', top: '55%', price: '₹60', avail: 15, color: '#FFC92C' },
                  { left: '35%', top: '65%', price: '₹80', avail: 0, color: 'rgba(148,163,184,0.5)' },
                  { left: '25%', top: '75%', price: '₹35', avail: 70, color: '#FFCC00' },
                ].map((m, i) => (
                  <div key={i} className="pill-marker" style={{ position: 'absolute', left: m.left, top: m.top, zIndex: 2, fontSize: '0.75rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, boxShadow: `0 0 6px ${m.color}`, animation: m.avail > 0 ? 'livePulse 1.5s ease-in-out infinite' : 'none' }} />
                    {m.price}
                    <div className="avail-bar"><div className="avail-bar-fill" style={{ width: `${m.avail}%`, background: m.color }} /></div>
                  </div>
                ))}

                {/* Grid lines */}
                <svg style={{ position: 'absolute', inset: 0, opacity: 0.05 }} width="100%" height="100%">
                  {[...Array(10)].map((_, i) => (
                    <line key={`h${i}`} x1="0" y1={`${(i + 1) * 10}%`} x2="100%" y2={`${(i + 1) * 10}%`} stroke="#FFCC00" strokeWidth="0.5" />
                  ))}
                  {[...Array(10)].map((_, i) => (
                    <line key={`v${i}`} x1={`${(i + 1) * 10}%`} y1="0" x2={`${(i + 1) * 10}%`} y2="100%" stroke="#FFCC00" strokeWidth="0.5" />
                  ))}
                </svg>
              </div>

              {/* Filter tray */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="filter-chip active" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>⚡ EV Charging</span>
                <span className="filter-chip" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>🚗 Sedan</span>
                <span className="filter-chip" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>📹 CCTV</span>
                <span className="filter-chip" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>🏠 Covered</span>
                <span className="filter-chip" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>🕐 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== AR FEATURE MOCKUP ====== */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            {/* AR Mockup */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: 240, height: 440, borderRadius: 36, overflow: 'hidden',
                border: '2px solid rgba(255, 204, 0,0.15)',
                background: 'linear-gradient(135deg, #1A0232, #0B0114)',
                boxShadow: '0 20px 80px rgba(0,0,0,0.6), 0 0 60px rgba(255, 204, 0,0.06)',
                position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 60, height: 20, background: '#0B0114', borderRadius: 12, zIndex: 5 }} />
                <div style={{ padding: 20, paddingTop: 36, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-accent)', marginBottom: 12 }}>AR Entry Assist</div>
                  <div style={{ width: 120, height: 120, borderRadius: '50%', border: '2px dashed rgba(255, 204, 0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 16 }}>
                    <Navigation size={40} color="var(--primary-accent)" style={{ transform: 'rotate(45deg)' }} />
                    <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '1px solid rgba(255, 204, 0,0.1)', animation: 'livePulse 2s ease-in-out infinite' }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Follow arrow to<br />
                    <strong style={{ color: 'var(--primary-accent)' }}>Slot A7 — Level 2</strong>
                  </div>
                  <div style={{ marginTop: 16, fontSize: 8, color: 'var(--text-muted)', background: 'rgba(255, 204, 0,0.06)', padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(255, 204, 0,0.1)' }}>
                    📍 28m away · Walking
                  </div>
                </div>
              </div>
            </div>

            <div>
              <span className="badge badge-accent" style={{ marginBottom: 16 }}>COMING SOON</span>
              <h2 className="heading-lg" style={{ marginBottom: 16 }}>
                <span style={{ color: 'var(--primary-accent)' }}>Scan to Find</span> Your Slot
              </h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 32, fontSize: '1.05rem' }}>
                After booking, open the AR Entry Assist. Point your camera and follow the
                augmented reality arrow directly to your reserved slot. No confusion, no wandering.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { icon: <Eye size={18} />, label: 'AR Navigation' },
                  { icon: <QrCode size={18} />, label: 'QR Scan Entry' },
                  { icon: <Navigation size={18} />, label: 'Multi-Stop Waypoints' },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(255, 204, 0,0.06)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255, 204, 0,0.1)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--primary-accent)' }}>{f.icon}</span>
                    {f.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, #1A0232, #0B0114)',
            borderRadius: 'var(--radius-xl)',
            padding: '80px 48px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255, 204, 0,0.1)',
          }}>
            <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255, 204, 0,0.06), transparent)', borderRadius: '50%', filter: 'blur(80px)' }} />
            <div style={{ position: 'absolute', bottom: '-30%', left: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(108,92,231,0.08), transparent)', borderRadius: '50%', filter: 'blur(60px)' }} />
            <h2 className="heading-lg" style={{ marginBottom: 16, position: 'relative', zIndex: 1 }}>
              Ready to Park <span style={{ color: 'var(--primary-accent)' }}>Smarter</span>?
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: 36, position: 'relative', zIndex: 1, maxWidth: 500, margin: '0 auto 36px' }}>
              Join 50,000+ smart parkers. Start booking in under 30 seconds.
            </p>
            <Link to={isAuthenticated ? '/search' : '/signup'} className="btn btn-accent btn-lg" style={{ position: 'relative', zIndex: 1 }} id="cta-bottom">
              {isAuthenticated ? 'Find Parking Now' : 'Create Free Account'} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer style={{ borderTop: '1px solid var(--border-light)', padding: '56px 0 40px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }}>
            <div>
              <div className="nav-logo" style={{ marginBottom: 16 }}>
                 <div className="nav-logo-icon"><Car size={26} color="#0B0114" strokeWidth={2.5} /></div>
                <span style={{ fontWeight: 400, fontSize: '1.6rem', letterSpacing: '-0.02em', marginLeft: '4px' }}>SpotHai</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 300, lineHeight: 1.7 }}>
                India's smartest contactless parking platform. AI-powered discovery, real-time booking, and AR navigation.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Discovery Map', 'Quick Reserve', 'Dynamic Pricing', 'AR Navigation'] },
              { title: 'Company', links: ['About Us', 'Careers', 'Operators', 'Press'] },
              { title: 'Support', links: ['Help Center', 'Contact', 'Privacy Policy', 'Terms'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.9rem' }}>{col.title}</h4>
                {col.links.map((link, j) => (
                  <div key={j} style={{ marginBottom: 10 }}>
                    <a href="#" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', transition: 'var(--transition)' }}>{link}</a>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border-light)', marginTop: 48, paddingTop: 24, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>© 2024 SpotHai. All rights reserved. Made with 💚 in India.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
