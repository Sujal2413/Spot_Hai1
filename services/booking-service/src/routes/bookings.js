const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../../../../shared/db');
const { authMiddleware } = require('../../../../shared/auth');
const { success, error, paginate } = require('../../../../shared/response');

const router = express.Router();

// POST /api/bookings — Create booking
router.post('/', authMiddleware, (req, res) => {
  try {
    const { spot_id, vehicle_number, vehicle_type, start_time, end_time, notes } = req.body;

    if (!spot_id || !vehicle_number || !start_time || !end_time) {
      return error(res, 'spot_id, vehicle_number, start_time, and end_time are required', 400);
    }

    const db = getDb();
    const spot = db.prepare('SELECT * FROM parking_spots WHERE id = ? AND status = ?').get(spot_id, 'active');

    if (!spot) {
      return error(res, 'Parking spot not found or inactive', 404);
    }

    if (spot.available_slots <= 0) {
      return error(res, 'No available slots at this parking spot', 409);
    }

    const start = new Date(start_time);
    const end = new Date(end_time);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = Math.max(Math.ceil(durationMs / 3600000), 1);
    const totalAmount = durationHours * spot.price_per_hour;

    const id = uuidv4();
    const qrCode = `SPOTHAI-${id.substr(0, 8).toUpperCase()}`;

    db.prepare(`
      INSERT INTO bookings (id, user_id, spot_id, spot_name, vehicle_number, vehicle_type, start_time, end_time, duration_hours, total_amount, status, qr_code, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(id, req.user.id, spot_id, spot.name, vehicle_number, vehicle_type || 'car', start_time, end_time, durationHours, totalAmount, qrCode, notes || null);

    // Decrease available slots
    db.prepare('UPDATE parking_spots SET available_slots = available_slots - 1 WHERE id = ?').run(spot_id);

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);

    return success(res, { booking }, 'Booking created successfully', 201);
  } catch (err) {
    console.error('Create booking error:', err);
    return error(res, 'Failed to create booking');
  }
});

// GET /api/bookings — Get user's bookings
router.get('/', authMiddleware, (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const db = getDb();

    let sql = 'SELECT * FROM bookings WHERE user_id = ?';
    const params = [req.user.id];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const { total } = db.prepare(countSql).get(...params);

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const bookings = db.prepare(sql).all(...params);

    return paginate(res, bookings, total, page, limit, 'Bookings retrieved');
  } catch (err) {
    console.error('Get bookings error:', err);
    return error(res, 'Failed to get bookings');
  }
});

// GET /api/bookings/:id — Get booking details
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!booking) {
      return error(res, 'Booking not found', 404);
    }

    const spot = db.prepare('SELECT * FROM parking_spots WHERE id = ?').get(booking.spot_id);
    if (spot) {
      spot.amenities = JSON.parse(spot.amenities || '[]');
    }

    const payment = booking.payment_id
      ? db.prepare('SELECT * FROM payments WHERE id = ?').get(booking.payment_id)
      : null;

    return success(res, { booking, spot, payment }, 'Booking details retrieved');
  } catch (err) {
    console.error('Get booking error:', err);
    return error(res, 'Failed to get booking details');
  }
});

// PUT /api/bookings/:id/cancel — Cancel booking
router.put('/:id/cancel', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!booking) {
      return error(res, 'Booking not found', 404);
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return error(res, `Cannot cancel a ${booking.status} booking`, 400);
    }

    db.prepare('UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('cancelled', req.params.id);

    // Restore available slot
    db.prepare('UPDATE parking_spots SET available_slots = available_slots + 1 WHERE id = ?')
      .run(booking.spot_id);

    // Refund payment if exists
    if (booking.payment_id) {
      db.prepare('UPDATE payments SET status = ? WHERE id = ?').run('refunded', booking.payment_id);
    }

    return success(res, {}, 'Booking cancelled successfully');
  } catch (err) {
    console.error('Cancel booking error:', err);
    return error(res, 'Failed to cancel booking');
  }
});

// PUT /api/bookings/:id/confirm — Confirm booking (after payment)
router.put('/:id/confirm', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!booking) {
      return error(res, 'Booking not found', 404);
    }

    db.prepare('UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('confirmed', req.params.id);

    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    return success(res, { booking: updated }, 'Booking confirmed');
  } catch (err) {
    return error(res, 'Failed to confirm booking');
  }
});

module.exports = router;
