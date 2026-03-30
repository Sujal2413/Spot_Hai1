const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const spotRoutes = require('./routes/spots');
const bookingRoutes = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'booking-service' }));

app.use('/api/spots', spotRoutes);
app.use('/api/bookings', bookingRoutes);

app.listen(PORT, () => {
  console.log(`🟢 Booking Service running on port ${PORT}`);
});
