// Admin-only route guard — must be used AFTER protect middleware
const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'root_admin')) {
    return next();
  }
  req.flash('error', 'Access denied. Admin privileges required');
  return res.redirect('/');
};

module.exports = adminOnly;
