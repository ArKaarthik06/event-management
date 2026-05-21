const passport = require('passport');
const User = require('../models/User');

// @desc    Show login page
// @route   GET /auth/login
const getLogin = (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/');
  res.render('auth/login', { title: 'Login' });
};

// @desc    Handle login
// @route   POST /auth/login
const postLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('error', 'Please provide email and password');
    return res.redirect('/auth/login');
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      req.flash('error', 'Login failed. Please try again');
      return res.redirect('/auth/login');
    }

    if (!user) {
      req.flash('error', info.message || 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    req.login(user, (err) => {
      if (err) {
        req.flash('error', 'Login failed. Please try again');
        return res.redirect('/auth/login');
      }

      req.flash('success', `Welcome back, ${user.username}!`);

      if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      }
      return res.redirect('/');
    });
  })(req, res, next);
};

// @desc    Show signup page
// @route   GET /auth/signup
const getSignup = (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/');
  res.render('auth/signup', { title: 'Sign Up' });
};

// @desc    Handle signup
// @route   POST /auth/signup
const postSignup = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, role } = req.body;

    if (!username || !email || !password) {
      req.flash('error', 'Please fill in all fields');
      return res.redirect('/auth/signup');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/auth/signup');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters');
      return res.redirect('/auth/signup');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'An account with that email already exists');
      return res.redirect('/auth/signup');
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'user'
    });

    // Log the user in immediately after signup
    req.login(user, (err) => {
      if (err) {
        req.flash('error', 'Account created but login failed. Please log in manually');
        return res.redirect('/auth/login');
      }

      req.flash('success', `Welcome to Campus Events, ${user.username}!`);

      if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      }
      return res.redirect('/');
    });
  } catch (error) {
    req.flash('error', error.message || 'Signup failed. Please try again');
    res.redirect('/auth/signup');
  }
};

// @desc    Logout
// @route   GET /auth/logout
const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
};

module.exports = { getLogin, postLogin, getSignup, postSignup, logout };
