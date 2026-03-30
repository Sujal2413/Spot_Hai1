const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../../../../shared/db');
const { authMiddleware, roleMiddleware } = require('../../../../shared/auth');
const { success, error } = require('../../../../shared/response');

const router = express.Router();

// POST /api/operator/spots — Add parking spot
router.post('/spots', authMiddleware, roleMiddleware('operator', 'admin'), (req, res) => {
  try {
    const { name, description, address, city, state, zip_code, lat, lng, total_slots, price_per_hour, amenities, spot_type } = req.body;

    if (!name || !address || !city || !total_slots || !price_per_hour) {
      return error(res, 'name, address, city, total_slots, and price_per_hour are required', 400);
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO parking_spots (id, name, description, address, city, state, zip_code, lat, lng, total_slots, available_slots, price_per_hour, operator_id, amenities, spot_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description || '', address, city, state || '', zip_code || '', lat || 0, lng || 0, total_slots, total_slots, price_per_hour, req.user.id, JSON.stringify(amenities || []), spot_type || 'outdoor');

    const spot = db.prepare('SELECT * FROM parking_spots WHERE id = ?').get(id);
    spot.amenities = JSON.parse(spot.amenities || '[]');

    return success(res, { spot }, 'Parking spot created', 201);
  } catch (err) {
    console.error('Create spot error:', err);
    return error(res, 'Failed to create parking spot');
  }
});

// PUT /api/operator/spots/:id — Update parking spot
router.put('/spots/:id', authMiddleware, roleMiddleware('operator', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const spot = db.prepare('SELECT * FROM parking_spots WHERE id = ? AND operator_id = ?').get(req.params.id, req.user.id);

    if (!spot && req.user.role !== 'admin') {
      return error(res, 'Parking spot not found or you do not own it', 404);
    }

    const { name, description, address, city, total_slots, price_per_hour, amenities, spot_type, status } = req.body;
    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (description) { updates.push('description = ?'); values.push(description); }
    if (address) { updates.push('address = ?'); values.push(address); }
    if (city) { updates.push('city = ?'); values.push(city); }
    if (total_slots) {
      const diff = total_slots - (spot || db.prepare('SELECT * FROM parking_spots WHERE id = ?').get(req.params.id)).total_slots;
      updates.push('total_slots = ?'); values.push(total_slots);
      updates.push('available_slots = available_slots + ?'); values.push(diff);
    }
    if (price_per_hour) { updates.push('price_per_hour = ?'); values.push(price_per_hour); }
    if (amenities) { updates.push('amenities = ?'); values.push(JSON.stringify(amenities)); }
    if (spot_type) { updates.push('spot_type = ?'); values.push(spot_type); }
    if (status) { updates.push('status = ?'); values.push(status); }

    if (updates.length === 0) {
      return error(res, 'No fields to update', 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    db.prepare(`UPDATE parking_spots SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM parking_spots WHERE id = ?').get(req.params.id);
    updated.amenities = JSON.parse(updated.amenities || '[]');

    return success(res, { spot: updated }, 'Parking spot updated');
  } catch (err) {
    console.error('Update spot error:', err);
    return error(res, 'Failed to update parking spot');
  }
});

// GET /api/operator/bookings — Get bookings for operator's spots
router.get('/bookings', authMiddleware, roleMiddleware('operator', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const isAdmin = req.user.role === 'admin';

    let spotCondition = isAdmin ? '' : 'WHERE operator_id = ?';
    let params = isAdmin ? [] : [req.user.id];

    const spots = db.prepare(`SELECT id FROM parking_spots ${spotCondition}`).all(...params);
    const spotIds = spots.map(s => s.id);

    if (spotIds.length === 0) {
      return success(res, { bookings: [] }, 'No bookings found');
    }

    const placeholders = spotIds.map(() => '?').join(',');
    const bookings = db.prepare(`
      SELECT b.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM bookings b JOIN users u ON b.user_id = u.id
      WHERE b.spot_id IN (${placeholders})
      ORDER BY b.created_at DESC LIMIT 50
    `).all(...spotIds);

    return success(res, { bookings }, 'Bookings retrieved');
  } catch (err) {
    console.error('Get operator bookings error:', err);
    return error(res, 'Failed to get bookings');
  }
});

module.exports = router;
