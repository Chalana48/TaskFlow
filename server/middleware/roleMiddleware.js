/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} allowedRoles - Roles permitted to access the route ('USER', 'PROJECT_MANAGER', 'ADMIN')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure user was attached by authMiddleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before role verification',
      });
    }

    // Check if user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires ${allowedRoles.join(' or ')} permission`,
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
};
