/**
 * Ensures a logged-in session exists before allowing access to cart routes.
 */
function authGuard(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'You must be logged in to perform this action'
    });
  }
  next();
}

module.exports = authGuard;
