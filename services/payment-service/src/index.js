require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'payment-service' }));

app.use('/api/payments', paymentRoutes);

app.listen(PORT, () => {
  console.log(`🟣 Payment Service running on port ${PORT}`);
});
