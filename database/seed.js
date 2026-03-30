const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'spothai.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

console.log('✅ Database schema created\n');

// Seed Users
const users = [
  { name: 'Rahul Sharma', email: 'rahul@spothai.com', phone: '+91-9876543210', role: 'user', password: 'password123' },
  { name: 'Priya Patel', email: 'priya@spothai.com', phone: '+91-9876543211', role: 'user', password: 'password123' },
  { name: 'Amit Kumar', email: 'amit@spothai.com', phone: '+91-9876543212', role: 'operator', password: 'password123' },
  { name: 'Sneha Reddy', email: 'sneha@spothai.com', phone: '+91-9876543213', role: 'operator', password: 'password123' },
  { name: 'Admin SpotHai', email: 'admin@spothai.com', phone: '+91-9876543200', role: 'admin', password: 'admin123' },
  { name: 'Demo User', email: 'demo@spothai.com', phone: '+91-9999999999', role: 'user', password: 'demo123' },
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, role, is_verified)
  VALUES (?, ?, ?, ?, ?, ?, 1)
`);

const userIds = {};
for (const user of users) {
  const id = uuidv4();
  const hash = bcrypt.hashSync(user.password, 10);
  insertUser.run(id, user.name, user.email, user.phone, hash, user.role);
  userIds[user.email] = id;
  console.log(`  👤 Created user: ${user.name} (${user.email}) [${user.role}]`);
}

// Seed Parking Spots
const spots = [
  {
    name: 'Phoenix Mall Parking',
    description: 'Premium indoor parking at Phoenix MarketCity with 24/7 security, CCTV surveillance, and EV charging stations. Located at basement levels B1 and B2.',
    address: 'Phoenix MarketCity, Viman Nagar, Pune 411014',
    city: 'Pune',
    state: 'Maharashtra',
    lat: 18.5679,
    lng: 73.9143,
    total_slots: 200,
    available_slots: 45,
    price_per_hour: 40,
    spot_type: 'multilevel',
    amenities: JSON.stringify(['CCTV', 'EV Charging', '24/7 Security', 'Covered', 'Wheelchair Access', 'Car Wash']),
    rating: 4.5,
    total_reviews: 328,
  },
  {
    name: 'Connaught Place Underground',
    description: 'Spacious underground parking in the heart of Delhi. Walking distance to major restaurants, shops, and metro stations.',
    address: 'Block A, Connaught Place, New Delhi 110001',
    city: 'Delhi',
    state: 'Delhi',
    lat: 28.6315,
    lng: 77.2167,
    total_slots: 500,
    available_slots: 120,
    price_per_hour: 60,
    spot_type: 'underground',
    amenities: JSON.stringify(['CCTV', '24/7 Security', 'Metro Access', 'Covered', 'Valet']),
    rating: 4.2,
    total_reviews: 512,
  },
  {
    name: 'Bandra Kurla Complex Parking',
    description: 'Modern multilevel parking facility in Mumbai\'s premium business district. Ideal for office-goers and visitors.',
    address: 'BKC Road, Bandra East, Mumbai 400051',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0596,
    lng: 72.8656,
    total_slots: 350,
    available_slots: 89,
    price_per_hour: 80,
    spot_type: 'multilevel',
    amenities: JSON.stringify(['CCTV', 'EV Charging', '24/7 Security', 'Valet', 'Car Wash', 'Restrooms']),
    rating: 4.7,
    total_reviews: 245,
  },
  {
    name: 'MG Road Metro Parking',
    description: 'Convenient outdoor parking near MG Road metro station. Perfect for daily commuters with monthly pass options.',
    address: 'MG Road, Bengaluru 560001',
    city: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9758,
    lng: 77.6045,
    total_slots: 150,
    available_slots: 32,
    price_per_hour: 30,
    spot_type: 'outdoor',
    amenities: JSON.stringify(['CCTV', 'Metro Access', 'Bike Parking', '24/7 Security']),
    rating: 4.0,
    total_reviews: 189,
  },
  {
    name: 'Hitech City Hub Parking',
    description: 'State-of-the-art indoor parking in Hyderabad\'s IT corridor. Automated entry/exit with app-based access.',
    address: 'Hitech City Main Road, Hyderabad 500081',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.4474,
    lng: 78.3762,
    total_slots: 300,
    available_slots: 156,
    price_per_hour: 35,
    spot_type: 'indoor',
    amenities: JSON.stringify(['CCTV', 'EV Charging', 'Automated Entry', 'Covered', 'App Access']),
    rating: 4.6,
    total_reviews: 167,
  },
  {
    name: 'Anna Nagar Tower Parking',
    description: 'Well-maintained multi-level parking facility near Anna Nagar Tower Park. Family-friendly with easy accessibility.',
    address: '2nd Avenue, Anna Nagar, Chennai 600040',
    city: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.0850,
    lng: 80.2101,
    total_slots: 180,
    available_slots: 67,
    price_per_hour: 25,
    spot_type: 'multilevel',
    amenities: JSON.stringify(['CCTV', '24/7 Security', 'Covered', 'Wheelchair Access']),
    rating: 4.1,
    total_reviews: 143,
  },
  {
    name: 'Salt Lake Smart Parking',
    description: 'IoT-enabled smart parking with real-time slot detection. Located in Kolkata\'s IT hub with excellent connectivity.',
    address: 'Sector V, Salt Lake City, Kolkata 700091',
    city: 'Kolkata',
    state: 'West Bengal',
    lat: 22.5726,
    lng: 88.4345,
    total_slots: 250,
    available_slots: 98,
    price_per_hour: 20,
    spot_type: 'outdoor',
    amenities: JSON.stringify(['CCTV', 'Smart Sensors', 'App Access', 'Bike Parking', 'EV Charging']),
    rating: 4.3,
    total_reviews: 201,
  },
  {
    name: 'Amanora Mall Parking',
    description: 'Massive parking complex at Amanora Town Centre. Free for first 2 hours with mall purchase validation.',
    address: 'Amanora Park Town, Hadapsar, Pune 411028',
    city: 'Pune',
    state: 'Maharashtra',
    lat: 18.5167,
    lng: 73.9342,
    total_slots: 400,
    available_slots: 213,
    price_per_hour: 30,
    spot_type: 'multilevel',
    amenities: JSON.stringify(['CCTV', 'EV Charging', 'Valet', 'Covered', 'Restrooms', 'Car Wash']),
    rating: 4.4,
    total_reviews: 387,
  },
];

const operatorEmails = ['amit@spothai.com', 'sneha@spothai.com'];
const insertSpot = db.prepare(`
  INSERT OR IGNORE INTO parking_spots (id, name, description, address, city, state, lat, lng, total_slots, available_slots, price_per_hour, operator_id, amenities, rating, total_reviews, spot_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const spotIds = [];
for (let i = 0; i < spots.length; i++) {
  const s = spots[i];
  const id = uuidv4();
  const operatorId = userIds[operatorEmails[i % operatorEmails.length]];
  insertSpot.run(id, s.name, s.description, s.address, s.city, s.state, s.lat, s.lng, s.total_slots, s.available_slots, s.price_per_hour, operatorId, s.amenities, s.rating, s.total_reviews, s.spot_type);
  spotIds.push(id);
  console.log(`  🅿️  Created spot: ${s.name} (${s.city})`);
}

// Seed Bookings
const vehicleNumbers = ['MH-12-AB-1234', 'DL-01-CD-5678', 'KA-05-EF-9012', 'MH-14-GH-3456', 'TN-07-IJ-7890'];
const vehicleTypes = ['car', 'suv', 'bike', 'car', 'ev'];
const statuses = ['completed', 'completed', 'active', 'completed', 'cancelled'];

const insertBooking = db.prepare(`
  INSERT OR IGNORE INTO bookings (id, user_id, spot_id, spot_name, vehicle_number, vehicle_type, start_time, end_time, duration_hours, total_amount, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const bookingIds = [];
const userEmails = ['rahul@spothai.com', 'priya@spothai.com', 'demo@spothai.com'];
for (let i = 0; i < 5; i++) {
  const id = uuidv4();
  const userId = userIds[userEmails[i % userEmails.length]];
  const spotIdx = i % spotIds.length;
  const hours = [2, 4, 1, 3, 6][i];
  const daysAgo = [7, 5, 0, 3, 1][i];
  const startTime = new Date(Date.now() - daysAgo * 86400000);
  const endTime = new Date(startTime.getTime() + hours * 3600000);
  const amount = hours * spots[spotIdx].price_per_hour;

  insertBooking.run(id, userId, spotIds[spotIdx], spots[spotIdx].name, vehicleNumbers[i], vehicleTypes[i], startTime.toISOString(), endTime.toISOString(), hours, amount, statuses[i]);
  bookingIds.push(id);
  console.log(`  📋 Created booking: ${vehicleNumbers[i]} at ${spots[spotIdx].name}`);
}

// Seed Payments
const insertPayment = db.prepare(`
  INSERT OR IGNORE INTO payments (id, booking_id, user_id, amount, method, status, transaction_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const methods = ['card', 'upi', 'wallet', 'card', 'upi'];
for (let i = 0; i < bookingIds.length; i++) {
  const id = uuidv4();
  const userId = userIds[userEmails[i % userEmails.length]];
  const paymentStatus = statuses[i] === 'cancelled' ? 'refunded' : 'success';
  const txnId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
  const hours = [2, 4, 1, 3, 6][i];
  const amount = hours * spots[i % spots.length].price_per_hour;

  insertPayment.run(id, bookingIds[i], userId, amount, methods[i], paymentStatus, txnId);

  // Update booking with payment_id
  db.prepare('UPDATE bookings SET payment_id = ? WHERE id = ?').run(id, bookingIds[i]);
  console.log(`  💳 Created payment: ₹${amount} via ${methods[i]}`);
}

console.log('\n✅ Database seeded successfully!');
console.log(`\n📊 Summary:`);
console.log(`   Users: ${users.length}`);
console.log(`   Parking Spots: ${spots.length}`);
console.log(`   Bookings: ${bookingIds.length}`);
console.log(`   Payments: ${bookingIds.length}`);
console.log(`\n🔑 Demo Login: demo@spothai.com / demo123`);
console.log(`🔑 Admin Login: admin@spothai.com / admin123`);
console.log(`🔑 Operator Login: amit@spothai.com / password123\n`);

db.close();
