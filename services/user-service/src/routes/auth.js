const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../../../../shared/db');
const { generateToken } = require('../../../../shared/auth');
const { success, error } = require('../../../../shared/response');
const { sendOTPEmail, sendPasswordResetEmail } = require('../../../../shared/mailer');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
      return error(res, 'Name, email, and password are required', 400);
    }

    if (password.length < 6) {
      return error(res, 'Password must be at least 6 characters', 400);
    }

    const db = getDb();
    
    // Ensure pending table exists
    db.exec(`CREATE TABLE IF NOT EXISTS pending_users (
      email TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      password_hash TEXT,
      role TEXT,
      otp_code TEXT,
      otp_expires_at DATETIME
    )`);

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return error(res, 'Email already registered', 409);
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60000).toISOString();

    db.prepare(`
      INSERT INTO pending_users (email, name, phone, password_hash, role, otp_code, otp_expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        name=excluded.name, phone=excluded.phone, password_hash=excluded.password_hash,
        role=excluded.role, otp_code=excluded.otp_code, otp_expires_at=excluded.otp_expires_at
    `).run(email, name, phone || null, passwordHash, role || 'user', otpCode, otpExpires);

    // Send OTP email via Gmail SMTP
    const emailResult = await sendOTPEmail(email, otpCode, name);

    return success(res, { email }, 
      emailResult.simulated 
        ? 'Registration initiated. OTP shown in console.' 
        : `Registration initiated. OTP sent to ${email}`, 
      201
    );
  } catch (err) {
    console.error('Register error:', err);
    return error(res, 'Registration failed');
  }
});

// POST /api/users/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required', 400);
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return error(res, 'Invalid email or password', 401);
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return error(res, 'Invalid email or password', 401);
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    return success(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar_url: user.avatar_url,
        is_verified: user.is_verified
      },
      token
    }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Login failed');
  }
});

// POST /api/users/verify-otp
router.post('/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return error(res, 'Email and OTP are required', 400);
    }

    const db = getDb();
    const pendingUser = db.prepare('SELECT * FROM pending_users WHERE email = ?').get(email);

    if (!pendingUser) {
      return error(res, 'No pending registration found for this email', 404);
    }

    if (pendingUser.otp_code !== otp) {
      return error(res, 'Invalid OTP', 400);
    }

    if (new Date(pendingUser.otp_expires_at) < new Date()) {
      return error(res, 'OTP has expired', 400);
    }

    // Now insert as verified user
    const id = uuidv4();
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(id, pendingUser.name, pendingUser.email, pendingUser.phone, pendingUser.password_hash, pendingUser.role);

    // Clean up pending memory
    db.prepare('DELETE FROM pending_users WHERE email = ?').run(email);

    const token = generateToken({ id, email: pendingUser.email, role: pendingUser.role, name: pendingUser.name });

    return success(res, { verified: true, token, user: { id, email: pendingUser.email, name: pendingUser.name } }, 'Account created successfully');
  } catch (err) {
    console.error('OTP verification error:', err);
    return error(res, 'OTP verification failed');
  }
});

// POST /api/users/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return error(res, 'Email is required', 400);
    }

    const db = getDb();
    
    // Check if user is already registered and verified
    const registered = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (registered) {
      return error(res, 'Email is already registered and verified', 400);
    }

    const pendingUser = db.prepare('SELECT * FROM pending_users WHERE email = ?').get(email);
    if (!pendingUser) {
      return error(res, 'No pending registration found. Please sign up first.', 404);
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60000).toISOString();

    db.prepare('UPDATE pending_users SET otp_code = ?, otp_expires_at = ? WHERE email = ?')
      .run(otpCode, otpExpires, email);

    const emailResult = await sendOTPEmail(email, otpCode, pendingUser.name);

    return success(res, {},
      emailResult.simulated
        ? 'OTP resent (check console)'
        : `New OTP sent to ${email}`
    );
  } catch (err) {
    console.error('Resend OTP error:', err);
    return error(res, 'Failed to resend OTP');
  }
});

// POST /api/users/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return error(res, 'Email is required', 400);
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return success(res, {}, 'If the email exists, a reset link has been sent.');
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 30 * 60000).toISOString();

    db.prepare('UPDATE users SET reset_token = ?, reset_expires_at = ? WHERE id = ?')
      .run(resetToken, resetExpires, user.id);

    // Send password reset email via Gmail SMTP
    await sendPasswordResetEmail(email, resetToken, user.name);

    return success(res, { resetToken }, 'Password reset link sent to your email.');
  } catch (err) {
    console.error('Forgot password error:', err);
    return error(res, 'Failed to process request');
  }
});

// POST /api/users/reset-password
router.post('/reset-password', (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return error(res, 'Token and new password are required', 400);
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token);

    if (!user || new Date(user.reset_expires_at) < new Date()) {
      return error(res, 'Invalid or expired reset token', 400);
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires_at = NULL WHERE id = ?')
      .run(passwordHash, user.id);

    return success(res, {}, 'Password reset successful');
  } catch (err) {
    console.error('Reset password error:', err);
    return error(res, 'Password reset failed');
  }
});

// POST /api/users/google-auth
router.post('/google-auth', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return error(res, 'Google credential is required', 400);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return error(res, 'Google Sign-In is not configured on the server', 500);
    }

    // Verify the Google access token
    const client = new OAuth2Client(clientId);
    const tokenInfo = await client.getTokenInfo(credential);
    
    // tokenInfo contains the verified email (if scope included)
    const email = tokenInfo.email;
    if (!email) {
      return error(res, 'Could not retrieve email from Google account', 400);
    }

    // Extract name and picture from frontend's userInfo (since email is securely verified)
    const { userInfo } = req.body;
    const name = userInfo?.name || email.split('@')[0];
    const picture = userInfo?.picture || null;

    const db = getDb();

    // Check if user already exists
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      // Create new user (Google users are auto-verified)
      const id = uuidv4();
      const randomPassword = bcrypt.hashSync(uuidv4(), 10); // random hash, user won't use password
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, role, is_verified, avatar_url)
        VALUES (?, ?, ?, ?, 'user', 1, ?)
      `).run(id, name || email.split('@')[0], email, randomPassword, picture || null);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    }

    const token = generateToken({
      id: user.id, email: user.email, role: user.role, name: user.name,
    });

    return success(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar_url: user.avatar_url || picture,
        is_verified: 1,
      },
      token,
    }, 'Google sign-in successful');
  } catch (err) {
    console.error('Google auth error:', err);
    return error(res, 'Google authentication failed. Please try again.');
  }
});

module.exports = router;
