const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = require('./config/db');
const User = require('./models/User');

connectDB().then(async () => {
  try {
    const rootAdminExists = await User.findOne({ role: 'root_admin' });
    if (!rootAdminExists) {
      await User.create({
        username: 'root_admin',
        email: 'root@example.com',
        password: 'rootadmin123',
        role: 'root_admin'
      });
      console.log('🌱 Root admin user created (root@example.com / rootadmin123)');
    }
  } catch (err) {
    console.error('Failed to seed root admin:', err.message);
  }
});

// Passport config
require('./config/passport')(passport);

const app = express();

// ── Performance & Security Middleware ─────────────────────────
app.use(compression());             // Gzip compress all responses (~70-80% size reduction)
app.use(helmet({                    // Security headers
  contentSecurityPolicy: false,     // Disabled for EJS inline scripts/styles
}));

// Rate limiting on auth routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,         // 15-minute window
  max: process.env.NODE_ENV === 'production' ? 30 : 100000, // Bypass limit for load testing
  message: 'Too many attempts. Please try again later.',
  standardHeaders: true,
});

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Method override for PUT/DELETE from forms
app.use(methodOverride('_method'));

// Session config
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 * 60 }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// Static files — with browser cache headers
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',           // Browser caches CSS/JS/images for 1 day
  etag: true,
  lastModified: true,
}));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Global variables for views
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const commentRoutes = require('./routes/commentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { getAllEvents, getMyEvents } = require('./controllers/eventController');
const { protect } = require('./middleware/auth');

// Landing page
app.get('/', getAllEvents);

// My events (protected)
app.get('/my-events', protect, getMyEvents);

// Mount routes — apply rate limiter to auth routes
app.use('/auth', authLimiter, authRoutes);
app.use('/events', eventRoutes);
app.use('/events', commentRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 Not Found',
    statusCode: 404,
    message: 'The page you are looking for does not exist'
  });
});

// Error handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
