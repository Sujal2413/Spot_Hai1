-- SpotHai Database Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'operator', 'admin')),
  avatar_url TEXT,
  otp_code TEXT,
  otp_expires_at DATETIME,
  reset_token TEXT,
  reset_expires_at DATETIME,
  is_verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parking_spots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  zip_code TEXT,
  lat REAL,
  lng REAL,
  total_slots INTEGER NOT NULL DEFAULT 10,
  available_slots INTEGER NOT NULL DEFAULT 10,
  price_per_hour REAL NOT NULL DEFAULT 20.0,
  operator_id TEXT,
  amenities TEXT DEFAULT '[]',
  images TEXT DEFAULT '[]',
  rating REAL DEFAULT 4.0,
  total_reviews INTEGER DEFAULT 0,
  operating_hours TEXT DEFAULT '{"open":"06:00","close":"23:00"}',
  spot_type TEXT DEFAULT 'outdoor' CHECK(spot_type IN ('indoor', 'outdoor', 'underground', 'multilevel')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'maintenance')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  spot_id TEXT NOT NULL,
  spot_name TEXT,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT DEFAULT 'car' CHECK(vehicle_type IN ('car', 'bike', 'suv', 'truck', 'ev')),
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_hours REAL NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  payment_id TEXT,
  qr_code TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (spot_id) REFERENCES parking_spots(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  method TEXT DEFAULT 'card' CHECK(method IN ('card', 'upi', 'wallet', 'netbanking')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed', 'refunded')),
  transaction_id TEXT,
  card_last_four TEXT,
  receipt_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  spot_id TEXT NOT NULL,
  booking_id TEXT,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (spot_id) REFERENCES parking_spots(id)
);

CREATE INDEX IF NOT EXISTS idx_spots_city ON parking_spots(city);
CREATE INDEX IF NOT EXISTS idx_spots_status ON parking_spots(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_spot ON bookings(spot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
