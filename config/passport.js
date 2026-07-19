const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const { LRUCache } = require('lru-cache');

// Cache user objects for 5 minutes (max 1000 users)
const userCache = new LRUCache({ max: 1000, ttl: 1000 * 60 * 5 });

module.exports = function(passport) {
  // Local strategy — authenticate with email + password
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Store user ID in session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Retrieve user — with LRU cache to avoid DB hit on every request
  passport.deserializeUser(async (id, done) => {
    try {
      const idStr = id.toString();

      // Check cache first
      let user = userCache.get(idStr);
      if (user) return done(null, user);

      // Cache miss — query DB
      user = await User.findById(id);
      if (user) userCache.set(idStr, user);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
