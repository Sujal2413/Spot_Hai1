import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CreditCard, Smartphone, Wallet, Building2, Check, Shield, Lock } from 'lucide-react';

export default function Payment() {
  const location = useLocation();
  const booking = location.state?.booking;
  const [method, setMethod] = useState('card');
  const [cardNum, setCardNum] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  if (!booking) {
    return (
      <div className="page">
        <div className="container flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
          <h2>No booking to pay for</h2>
          <button className="btn btn-accent" onClick={() => navigate('/search')}>Find Parking</button>
        </div>
      </div>
    );
  }

  const handlePay = async () => {
    setProcessing(true);
    try {
      // 1. Create a Razorpay Order
      const res = await paymentsAPI.createRazorpayOrder({
        booking_id: booking.id
      });
      
      const order = res.data;

      // 2. Load the SDK script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      
      script.onerror = () => {
        toast.error('Failed to load Razorpay SDK. Check your connection.');
        setProcessing(false);
      };

      script.onload = () => {
        // 3. Initialize Razorpay Modal
        const options = {
          key: 'rzp_test_dummy_key', // Uses mocked test key for the UI
          amount: booking.total_amount * 100, // paise
          currency: 'INR',
          name: 'SpotHai Premium',
          description: `Parking at ${booking.spot_name}`,
          order_id: order.id,
          handler: function (response) {
            // Frontend validation representation
            // Note: The actual Webhook listener updates the database backend.
            setSuccess(true);
            setPaymentData({
              transaction_id: response.razorpay_payment_id || order.id,
              amount: booking.total_amount,
              method: 'RAZORPAY Checkout'
            });
            toast.success('Payment verified & booked successfully!');
          },
          prefill: {
            name: "SpotHai User",
            email: "user@spothai.dev",
            contact: "9999999999"
          },
          theme: {
            color: "#FFCC00"
          }
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on('payment.failed', function (response) {
          toast.error(response.error.description || 'Payment Failed');
        });

        razorpayInstance.open();
        setProcessing(false);
      };

      document.body.appendChild(script);

    } catch (err) {
      toast.error(err.message || 'Payment order initialization failed');
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="page">
        <div className="container flex-center" style={{ minHeight: '70vh' }}>
          <div className="card animate-fadeIn" style={{ maxWidth: 500, textAlign: 'center', padding: 48 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(0,184,148,0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
            }}>
              <Check size={40} color="var(--primary-accent)" />
            </div>
            <h2 className="heading-md" style={{ marginBottom: 8 }}>Payment Successful!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Your parking spot has been booked</p>

            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 24, textAlign: 'left' }}>
              <div className="flex-between" style={{ marginBottom: 10 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Transaction ID</span>
                <span style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{paymentData?.transaction_id}</span>
              </div>
              <div className="flex-between" style={{ marginBottom: 10 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Amount Paid</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-accent)' }}>₹{paymentData?.amount}</span>
              </div>
              <div className="flex-between" style={{ marginBottom: 10 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Method</span>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>{paymentData?.method}</span>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Parking Spot</span>
                <span style={{ fontSize: '0.85rem' }}>{booking.spot_name}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 204, 0,0.06)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 24, border: '1px dashed rgba(255, 204, 0,0.3)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>QR Code</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: 2, fontFamily: 'monospace', color: 'var(--primary-accent)' }}>
                {booking.qr_code}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Show this code at parking entry</div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/bookings')}>My Bookings</button>
              <button className="btn btn-accent" style={{ flex: 1 }} onClick={() => navigate('/dashboard')}>Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const methods = [
    { id: 'card', icon: <CreditCard size={20} />, label: 'Credit/Debit Card' },
    { id: 'upi', icon: <Smartphone size={20} />, label: 'UPI' },
    { id: 'wallet', icon: <Wallet size={20} />, label: 'Wallet' },
    { id: 'netbanking', icon: <Building2 size={20} />, label: 'Net Banking' },
  ];

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 20 }}>
        <h1 className="heading-lg" style={{ marginBottom: 24 }}>Complete <span style={{ color: 'var(--primary-accent)' }}>Payment</span></h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
          <div>
            {/* Payment Methods */}
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 className="heading-sm" style={{ marginBottom: 20 }}>Select Payment Method</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {methods.map(m => (
                  <div key={m.id} onClick={() => setMethod(m.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
                    background: method === m.id ? 'rgba(255, 204, 0,0.06)' : 'var(--bg-tertiary)',
                    border: `2px solid ${method === m.id ? 'var(--primary-accent)' : 'var(--border-light)'}`,
                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}>
                    <div style={{ color: method === m.id ? 'var(--primary-accent)' : 'var(--text-muted)' }}>{m.icon}</div>
                    <span style={{ fontWeight: 500 }}>{m.label}</span>
                    {method === m.id && <Check size={18} color="var(--primary-accent)" style={{ marginLeft: 'auto' }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Card Details */}
            {method === 'card' && (
              <div className="card">
                <h3 className="heading-sm" style={{ marginBottom: 20 }}>Card Details</h3>
                <div className="input-group" style={{ marginBottom: 14 }}>
                  <label>Card Number</label>
                  <input className="input" placeholder="4242 4242 4242 4242" id="card-number"
                    value={cardNum} onChange={e => setCardNum(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="input-group">
                    <label>Expiry</label>
                    <input className="input" placeholder="MM/YY" id="card-expiry" />
                  </div>
                  <div className="input-group">
                    <label>CVV</label>
                    <input className="input" placeholder="123" type="password" id="card-cvv" />
                  </div>
                </div>
              </div>
            )}

            {method === 'upi' && (
              <div className="card">
                <h3 className="heading-sm" style={{ marginBottom: 20 }}>UPI ID</h3>
                <div className="input-group">
                  <label>Enter UPI ID</label>
                  <input className="input" placeholder="yourname@paytm" id="upi-id" />
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <div className="card" style={{ position: 'sticky', top: 92 }}>
              <h3 className="heading-sm" style={{ marginBottom: 20 }}>Booking Summary</h3>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{booking.spot_name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  🚗 {booking.vehicle_number} · {booking.vehicle_type}
                </div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
                <div className="flex-between" style={{ marginBottom: 8, fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Duration</span>
                  <span>{booking.duration_hours} hour{booking.duration_hours > 1 ? 's' : ''}</span>
                </div>
                <div className="flex-between" style={{ marginBottom: 8, fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Start</span>
                  <span>{new Date(booking.start_time).toLocaleString()}</span>
                </div>
                <div className="flex-between" style={{ fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>End</span>
                  <span>{new Date(booking.end_time).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex-between" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--primary-accent)' }}>₹{booking.total_amount}</span>
              </div>
              <button className="btn btn-accent btn-full btn-lg" onClick={handlePay} disabled={processing} id="pay-button">
                {processing ? (
                  <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Processing...</>
                ) : (
                  <>
                    <Lock size={16} /> Pay ₹{booking.total_amount}
                  </>
                )}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                <Shield size={14} color="var(--success)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Secure 256-bit SSL encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
