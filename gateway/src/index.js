const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: {
      user: 'http://localhost:4001',
      booking: 'http://localhost:4002',
      payment: 'http://localhost:4003',
      operator: 'http://localhost:4004'
    }
  });
});

// Service routing configuration
const services = {
  '/api/users': {
    target: 'http://localhost:4001',
    pathRewrite: {},
  },
  '/api/spots': {
    target: 'http://localhost:4002',
    pathRewrite: {},
  },
  '/api/bookings': {
    target: 'http://localhost:4002',
    pathRewrite: {},
  },
  '/api/payments': {
    target: 'http://localhost:4003',
    pathRewrite: {},
  },
  '/api/operator': {
    target: 'http://localhost:4004',
    pathRewrite: {},
  }
};

// Create proxy for each service
Object.entries(services).forEach(([path, config]) => {
  app.use(path, createProxyMiddleware({
    target: config.target,
    changeOrigin: true,
    pathRewrite: config.pathRewrite,
    onError: (err, req, res) => {
      console.error(`Proxy error for ${path}:`, err.message);
      res.status(502).json({
        success: false,
        message: `Service unavailable: ${path}`,
        error: err.message
      });
    },
    onProxyReq: (proxyReq, req) => {
      // Forward the body for POST/PUT requests
      if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    }
  }));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.listen(PORT, () => {
  console.log(`🟠 API Gateway running on port ${PORT}`);
  console.log(`   Routing to services:`);
  Object.entries(services).forEach(([path, config]) => {
    console.log(`   ${path} → ${config.target}`);
  });
});
