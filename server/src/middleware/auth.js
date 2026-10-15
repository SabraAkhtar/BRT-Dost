const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'brt_dost_dev_secret_key_peshawar_brt_2026_bootcamp_secure';

/**
 * Authentication middleware verifying JWT Bearer token
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check secure HttpOnly cookie first, then fallback to Authorization Bearer header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No valid authorization token or session cookie provided.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User session expired or user no longer exists.'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Administrator account has been deactivated. Contact system admin.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }
};

/**
 * Role-based access control checking for Administrator or Moderator role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'moderator')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required for this action.'
    });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin
};
