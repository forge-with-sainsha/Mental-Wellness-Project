'use strict';

/**
 * Returns middleware that checks req.user.role matches the required role.
 * Must be used AFTER verifyToken.
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden. Insufficient privileges.' });
    }
    next();
  };
}

module.exports = { requireRole };
