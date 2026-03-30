const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dashboardRoutes = require('./routes/dashboard');
const managementRoutes = require('./routes/management');

const app = express();
const PORT = process.env.PORT || 4004;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'operator-service' }));

app.use('/api/operator', dashboardRoutes);
app.use('/api/operator', managementRoutes);

app.listen(PORT, () => {
  console.log(`🟡 Operator Service running on port ${PORT}`);
});
