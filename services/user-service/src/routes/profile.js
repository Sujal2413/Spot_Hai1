const express = require('express');
const { getDb } = require('../../../../shared/db');
const { authMiddleware } = require('../../../../shared/auth');
const { success, error } = require('../../../../shared/response');

const router = express.Router();

// GET /api/users/profile
router.get('/profile', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, name, email, phone, role, avatar_url, is_verified, created_at FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      return error(res, 'User not found', 404);
    }

    return success(res, { user }, 'Profile retrieved');
  } catch (err) {
    console.error('Get profile error:', err);
    return error(res, 'Failed to get profile');
  }
});

// PUT /api/users/profile
router.put('/profile', authMiddleware, (req, res) => {
  try {
    const { name, phone, avatar_url } = req.body;
    const db = getDb();

    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (phone) { updates.push('phone = ?'); values.push(phone); }
    if (avatar_url) { updates.push('avatar_url = ?'); values.push(avatar_url); }

    if (updates.length === 0) {
      return error(res, 'No fields to update', 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const user = db.prepare('SELECT id, name, email, phone, role, avatar_url, is_verified, created_at FROM users WHERE id = ?').get(req.user.id);

    return success(res, { user }, 'Profile updated');
  } catch (err) {
    console.error('Update profile error:', err);
    return error(res, 'Failed to update profile');
  }
});

module.exports = router;
