const express = require('express');
const { getDb } = require('../../../../shared/db');
const { authMiddleware, roleMiddleware } = require('../../../../shared/auth');
const { success, error } = require('../../../../shared/response');

const router = express.Router();

// GET /api/operator/dashboard — Operator dashboard stats
router.get('/dashboard', authMiddleware, roleMiddleware('operator', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const isAdmin = req.user.role === 'admin';

    let spotCondition = isAdmin ? '' : 'WHERE operator_id = ?';
    let spotParams = isAdmin ? [] : [req.user.id];

    // Get spots
    const spots = db.prepare(`SELECT * FROM parking_spots ${spotCondition}`).all(...spotParams);
    const spotIds = spots.map(s => s.id);

    if (spotIds.length === 0) {
      return success(res, {
        totalSpots: 0, totalSlots: 0, occupiedSlots: 0, occupancyRate: 0,
        totalBookings: 0, activeBookings: 0, totalRevenue: 0,
        todayBookings: 0, todayRevenue: 0, spots: [], recentBookings: []
      }, 'Dashboard data retrieved');
    }

    const placeholders = spotIds.map(() => '?').join(',');

    // Stats
    const totalSlots = spots.reduce((sum, s) => sum + s.total_slots, 0);
    const availableSlots = spots.reduce((sum, s) => sum + s.available_slots, 0);
    const occupiedSlots = totalSlots - availableSlots;
    const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

    // Bookings
    const totalBookings = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE spot_id IN (${placeholders})`).get(...spotIds).c;
    const activeBookings = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE spot_id IN (${placeholders}) AND status IN ('confirmed', 'active')`).get(...spotIds).c;

    // Revenue
    const totalRevenue = db.prepare(`SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE b.spot_id IN (${placeholders}) AND p.status = 'success'`).get(...spotIds).total;

    // Today stats
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE spot_id IN (${placeholders}) AND date(created_at) = ?`).get(...spotIds, today).c;
    const todayRevenue = db.prepare(`SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE b.spot_id IN (${placeholders}) AND date(p.created_at) = ? AND p.status = 'success'`).get(...spotIds, today).total;

    // Recent bookings
    const recentBookings = db.prepare(`SELECT b.*, u.name as user_name, u.email as user_email FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.spot_id IN (${placeholders}) ORDER BY b.created_at DESC LIMIT 10`).all(...spotIds);

    // Parse spots
    const parsedSpots = spots.map(s => ({
      ...s,
      amenities: JSON.parse(s.amenities || '[]'),
      occupancy: s.total_slots > 0 ? Math.round(((s.total_slots - s.available_slots) / s.total_slots) * 100) : 0
    }));

    return success(res, {
      totalSpots: spots.length,
      totalSlots,
      occupiedSlots,
      availableSlots,
      occupancyRate,
      totalBookings,
      activeBookings,
      totalRevenue,
      todayBookings,
      todayRevenue,
      spots: parsedSpots,
      recentBookings
    }, 'Dashboard data retrieved');
  } catch (err) {
    console.error('Dashboard error:', err);
    return error(res, 'Failed to get dashboard data');
  }
});

// GET /api/operator/analytics — Revenue analytics
router.get('/analytics', authMiddleware, roleMiddleware('operator', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const isAdmin = req.user.role === 'admin';

    let spotCondition = isAdmin ? '' : 'WHERE operator_id = ?';
    let params = isAdmin ? [] : [req.user.id];

    const spots = db.prepare(`SELECT id FROM parking_spots ${spotCondition}`).all(...params);
    const spotIds = spots.map(s => s.id);

    if (spotIds.length === 0) {
      return success(res, { daily: [], monthly: [], bySpot: [], byMethod: [] }, 'Analytics retrieved');
    }

    const placeholders = spotIds.map(() => '?').join(',');

    // Daily revenue (last 7 days)
    const daily = db.prepare(`
      SELECT date(p.created_at) as date, SUM(p.amount) as revenue, COUNT(*) as bookings
      FROM payments p JOIN bookings b ON p.booking_id = b.id
      WHERE b.spot_id IN (${placeholders}) AND p.status = 'success'
      AND p.created_at >= datetime('now', '-7 days')
      GROUP BY date(p.created_at) ORDER BY date
    `).all(...spotIds);

    // Revenue by payment method
    const byMethod = db.prepare(`
      SELECT p.method, SUM(p.amount) as total, COUNT(*) as count
      FROM payments p JOIN bookings b ON p.booking_id = b.id
      WHERE b.spot_id IN (${placeholders}) AND p.status = 'success'
      GROUP BY p.method
    `).all(...spotIds);

    return success(res, { daily, byMethod }, 'Analytics retrieved');
  } catch (err) {
    console.error('Analytics error:', err);
    return error(res, 'Failed to get analytics');
  }
});

module.exports = router;
