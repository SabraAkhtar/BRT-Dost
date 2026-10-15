const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const routeRoutes = require('./routes/routeRoutes');
const alertRoutes = require('./routes/alertRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust reverse proxy (Essential for Render HTTPS load balancers and accurate rate limiting)
app.set('trust proxy', 1);

// Security HTTP Headers
app.use(helmet());

// Cross-Origin Resource Sharing (CORS)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/+$/, ''));
}
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL.replace(/\/+$/, ''));
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. Render health checks, curl, mobile apps)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/+$/, '');
    const isExplicitlyAllowed = allowedOrigins.includes(normalizedOrigin);
    const isVercelDomain = /^https:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/.test(origin);

    if (isExplicitlyAllowed || isVercelDomain) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Cookie Parser for HttpOnly authentication tokens
app.use(cookieParser());

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body Parser
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Rate Limiting for Public Submissions and Authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // 30 report submissions per window
  message: {
    success: false,
    message: 'Too many reports submitted from this network. Please wait a few moments before submitting again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    system: 'BRT Dost API & Trust Engine',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/stations', (req, res, next) => {
  // Alias /api/stations to routeController.getStations
  const { getStations } = require('./controllers/routeController');
  getStations(req, res, next);
});
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportLimiter, reportRoutes);
app.use('/api/admin', adminRoutes);

// Catch 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' does not exist on BRT Dost server.`
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
