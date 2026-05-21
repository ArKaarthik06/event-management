// Protect routes — must be logged in
const protect = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Please log in to access this page');
  return res.redirect('/auth/login');
};

module.exports = { protect };
