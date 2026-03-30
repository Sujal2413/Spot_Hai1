const express = require('express');
const { getDb } = require('../../../../shared/db');
const { success, error, paginate } = require('../../../../shared/response');

const router = express.Router();

// GET /api/spots — Search/list parking spots
router.get('/', (req, res) => {
  try {
    const { city, query, min_price, max_price, spot_type, sort_by, page = 1, limit = 20 } = req.query;
    const db = getDb();

    let sql = 'SELECT * FROM parking_spots WHERE status = ?';
    const params = ['active'];

    if (city) {
      sql += ' AND LOWER(city) = LOWER(?)';
      params.push(city);
    }

    if (query) {
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(address) LIKE ? OR LOWER(city) LIKE ?)';
      const q = `%${query.toLowerCase()}%`;
      params.push(q, q, q);
    }

    if (min_price) {
      sql += ' AND price_per_hour >= ?';
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      sql += ' AND price_per_hour <= ?';
      params.push(parseFloat(max_price));
    }

    if (spot_type) {
      sql += ' AND spot_type = ?';
      params.push(spot_type);
    }

    // Count total
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const { total } = db.prepare(countSql).get(...params);

    // Sort
    const sortOptions = {
      price_low: 'price_per_hour ASC',
      price_high: 'price_per_hour DESC',
      rating: 'rating DESC',
      availability: 'available_slots DESC',
      name: 'name ASC'
    };
    sql += ` ORDER BY ${sortOptions[sort_by] || 'rating DESC'}`;

    // Paginate
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const spots = db.prepare(sql).all(...params);

    // Parse JSON fields
    const parsed = spots.map(s => ({
      ...s,
      amenities: JSON.parse(s.amenities || '[]'),
      images: JSON.parse(s.images || '[]'),
      operating_hours: JSON.parse(s.operating_hours || '{}')
    }));

    return paginate(res, parsed, total, page, limit, 'Parking spots retrieved');
  } catch (err) {
    console.error('Search spots error:', err);
    return error(res, 'Failed to search parking spots');
  }
});

// GET /api/spots/cities — Get list of cities
router.get('/cities', (req, res) => {
  try {
    const db = getDb();
    const cities = db.prepare('SELECT DISTINCT city FROM parking_spots WHERE status = ? ORDER BY city').all('active');
    return success(res, { cities: cities.map(c => c.city) }, 'Cities retrieved');
  } catch (err) {
    return error(res, 'Failed to get cities');
  }
});

// GET /api/spots/:id — Get spot details
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const spot = db.prepare('SELECT * FROM parking_spots WHERE id = ?').get(req.params.id);

    if (!spot) {
      return error(res, 'Parking spot not found', 404);
    }

    spot.amenities = JSON.parse(spot.amenities || '[]');
    spot.images = JSON.parse(spot.images || '[]');
    spot.operating_hours = JSON.parse(spot.operating_hours || '{}');

    // Get recent reviews
    const reviews = db.prepare(`
      SELECT r.*, u.name as user_name FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.spot_id = ? ORDER BY r.created_at DESC LIMIT 5
    `).all(req.params.id);

    return success(res, { spot, reviews }, 'Spot details retrieved');
  } catch (err) {
    console.error('Get spot error:', err);
    return error(res, 'Failed to get spot details');
  }
});

module.exports = router;
