// Root-admin only route guard — must be used AFTER protect middleware
const rootAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'root_admin') {
    return next();
  }
  req.flash('error', 'Access denied. Root Admin privileges required');
  return res.redirect('/admin/dashboard');
};

module.exports = rootAdminOnly;
