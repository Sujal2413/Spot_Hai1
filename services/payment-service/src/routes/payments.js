const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { getDb } = require('../../../../shared/db');
const { authMiddleware } = require('../../../../shared/auth');
const { success, error, paginate } = require('../../../../shared/response');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
  key_secret: process.env.RAZORPAY_SECRET || 'dummy_secret',
});

// POST /api/payments/create-order — Initialize Razorpay order
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { booking_id } = req.body;
    if (!booking_id) return error(res, 'booking_id is required', 400);

    const db = getDb();
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(booking_id, req.user.id);
    
    if (!booking) return error(res, 'Booking not found', 404);
    if (booking.payment_id) return error(res, 'Payment already initiated/processed', 409);

    // If using dummy keys for local dev, simulate Razorpay Order
    if (process.env.RAZORPAY_KEY_ID === undefined) {
      console.warn("Using mocked Razorpay order since RAZORPAY_KEY_ID is missing");
      return success(res, { 
        id: 'order_mock_' + uuidv4().replace(/-/g, '').substring(0, 14),
        amount: booking.total_amount * 100,
        currency: 'INR',
        receipt: booking_id,
        status: 'created'
      }, 'Simulated Order Created (Dev Mode)', 201);
    }

    const options = {
      amount: parseInt(booking.total_amount * 100), // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: booking.id
    };

    const order = await razorpay.orders.create(options);
    
    // Create pending payment record
    const paymentId = uuidv4();
    db.prepare(`
      INSERT INTO payments (id, booking_id, user_id, amount, method, status, transaction_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(paymentId, booking_id, req.user.id, booking.total_amount, 'card', 'pending', order.id);

    return success(res, order, 'Order Created Successfully', 201);
  } catch (err) {
    console.error('Razorpay Create Order Error:', err);
    return error(res, 'Failed to create payment order', 500);
  }
});

// POST /api/payments/webhook — Razorpay Webhook Event Listener
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'my_webhook_secret';
    
    // Verify Webhook Signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== req.headers['x-razorpay-signature']) {
      // In dev mode with dummy keys, we can bypass this check if needed, but for prod this is required.
      if (process.env.RAZORPAY_KEY_ID) {
         return res.status(400).json({ status: 'error', message: 'Invalid Signature' });
      }
    }

    // Process actual webhook payload
    const event = req.body.event;
    const payload = req.body.payload;

    const db = getDb();
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const transactionId = paymentEntity.id;

      // Update payment status to success
      const stmt = db.prepare('UPDATE payments SET status = ?, transaction_id = ? WHERE transaction_id = ? AND status = ?');
      const info = stmt.run('success', transactionId, orderId, 'pending');

      if (info.changes > 0) {
        // Find corresponding booking to update status
        const paymentRow = db.prepare('SELECT id, booking_id FROM payments WHERE transaction_id = ?').get(transactionId);
        if (paymentRow) {
          db.prepare('UPDATE bookings SET status = ?, payment_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run('confirmed', paymentRow.id, paymentRow.booking_id);
        }
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/payments/verify — Verify Razorpay Payment Signature
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return error(res, 'Missing required payment verification parameters', 400);
    }

    const secret = process.env.RAZORPAY_SECRET || 'dummy_secret';
    
    // Verify Signature: generated_signature = hmac_sha256(order_id + "|" + payment_id, secret)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // In Dev mode with dummy keys, we might want to bypass if secret is not set, 
      // but for security we enforce it if RAZORPAY_SECRET is present.
      if (process.env.RAZORPAY_SECRET) {
        return error(res, 'Invalid payment signature', 400);
      }
    }

    const db = getDb();
    
    // 1. Update Payment Record
    const updatePayment = db.prepare(`
      UPDATE payments 
      SET status = 'success', transaction_id = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE transaction_id = ? AND status = 'pending'
    `).run(razorpay_payment_id, razorpay_order_id);

    if (updatePayment.changes === 0) {
      // Check if it was already updated (prevents duplicate processing)
      const existing = db.prepare('SELECT status FROM payments WHERE transaction_id = ?').get(razorpay_payment_id);
      if (existing?.status === 'success') {
         return success(res, { status: 'success' }, 'Payment already verified');
      }
      return error(res, 'Payment record not found or already processed', 404);
    }

    // 2. Update Booking Status
    const paymentRow = db.prepare('SELECT id, booking_id FROM payments WHERE transaction_id = ?').get(razorpay_payment_id);
    if (paymentRow) {
      db.prepare(`
        UPDATE bookings 
        SET status = 'confirmed', payment_id = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(paymentRow.id, paymentRow.booking_id);
    }

    return success(res, { status: 'success', payment_id: paymentRow?.id }, 'Payment verified successfully');
  } catch (err) {
    console.error('Payment Verification Error:', err);
    return error(res, 'Failed to verify payment', 500);
  }
});

// ... keeping original routes for backward compatibility frontend components
// POST /api/payments — Process payment
router.post('/', authMiddleware, (req, res) => {
  try {
    const { booking_id, method, card_last_four } = req.body;

    if (!booking_id || !method) {
      return error(res, 'booking_id and method are required', 400);
    }

    const db = getDb();
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(booking_id, req.user.id);

    if (!booking) {
      return error(res, 'Booking not found', 404);
    }

    if (booking.payment_id) {
      return error(res, 'Payment already processed for this booking', 409);
    }

    // Simulate payment processing (1-2 second delay feel)
    const paymentId = uuidv4();
    const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();

    // Simulate: 95% success rate
    const paymentStatus = Math.random() > 0.05 ? 'success' : 'failed';

    db.prepare(`
      INSERT INTO payments (id, booking_id, user_id, amount, method, status, transaction_id, card_last_four)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(paymentId, booking_id, req.user.id, booking.total_amount, method, paymentStatus, transactionId, card_last_four || null);

    if (paymentStatus === 'success') {
      db.prepare('UPDATE bookings SET status = ?, payment_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run('confirmed', paymentId, booking_id);
    }

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);

    return success(res, { payment, booking_status: paymentStatus === 'success' ? 'confirmed' : 'pending' },
      paymentStatus === 'success' ? 'Payment successful' : 'Payment failed. Please try again.',
      paymentStatus === 'success' ? 201 : 402
    );
  } catch (err) {
    console.error('Payment error:', err);
    return error(res, 'Payment processing failed');
  }
});

// GET /api/payments — Payment history
router.get('/', authMiddleware, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const db = getDb();

    const total = db.prepare('SELECT COUNT(*) as total FROM payments WHERE user_id = ?').get(req.user.id).total;
    const payments = db.prepare(`
      SELECT p.*, b.spot_name, b.vehicle_number, b.start_time, b.end_time
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    return paginate(res, payments, total, page, limit, 'Payment history retrieved');
  } catch (err) {
    console.error('Payment history error:', err);
    return error(res, 'Failed to get payment history');
  }
});

// GET /api/payments/:id/receipt — Get receipt
router.get('/:id/receipt', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!payment) {
      return error(res, 'Payment not found', 404);
    }

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(payment.booking_id);
    const spot = booking ? db.prepare('SELECT name, address, city FROM parking_spots WHERE id = ?').get(booking.spot_id) : null;

    const receipt = {
      receipt_id: `RCP-${payment.id.substr(0, 8).toUpperCase()}`,
      transaction_id: payment.transaction_id,
      date: payment.created_at,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      booking: booking ? {
        spot_name: booking.spot_name,
        address: spot?.address,
        city: spot?.city,
        vehicle: booking.vehicle_number,
        start_time: booking.start_time,
        end_time: booking.end_time,
        duration: booking.duration_hours + ' hours'
      } : null
    };

    return success(res, { receipt }, 'Receipt generated');
  } catch (err) {
    console.error('Receipt error:', err);
    return error(res, 'Failed to generate receipt');
  }
});

module.exports = router;
