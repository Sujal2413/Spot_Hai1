require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'user-service' }));

// Routes
app.use('/api/users', authRoutes);
app.use('/api/users', profileRoutes);

app.listen(PORT, () => {
  console.log(`🔵 User Service running on port ${PORT}`);
});
