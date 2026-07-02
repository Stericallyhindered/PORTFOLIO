const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies
    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'No user found with this token',
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'User account is deactivated',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
    }

    next();
  };
};

// Check if user can access customer data
const canAccessCustomerData = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
    });
  }

  const allowedRoles = ['salesAgent', 'technician', 'supportManager', 'systemAdmin'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access customer data',
    });
  }

  next();
};

// Check if user can escalate tickets
const canEscalateTickets = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
    });
  }

  const allowedRoles = ['supportManager', 'systemAdmin'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to escalate tickets',
    });
  }

  next();
};

// Check if user can manage knowledge base
const canManageKnowledgeBase = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
    });
  }

  const allowedRoles = ['supportManager', 'systemAdmin'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to manage knowledge base',
    });
  }

  next();
};

// Check if user can access analytics
const canAccessAnalytics = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
    });
  }

  const allowedRoles = ['supportManager', 'systemAdmin'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access analytics',
    });
  }

  next();
};

// Check if user can manage system
const canManageSystem = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
    });
  }

  if (req.user.role !== 'systemAdmin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to manage system',
    });
  }

  next();
};

module.exports = {
  protect,
  authorize,
  canAccessCustomerData,
  canEscalateTickets,
  canManageKnowledgeBase,
  canAccessAnalytics,
  canManageSystem,
};
