const logger = require('../utils/logger');

const maintenanceMode = (req, res, next) => {
  const isMaintenanceMode = process.env.ENABLE_MAINTENANCE_MODE === 'true';
  
  if (isMaintenanceMode) {
    // Allow health check and admin routes during maintenance
    if (req.path === '/health' || req.path.startsWith('/api/admin')) {
      return next();
    }
    
    logger.warn(`Maintenance mode: Blocking request to ${req.method} ${req.path}`);
    
    return res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable',
      message: 'The system is currently under maintenance. Please try again later.',
      maintenanceMode: true,
      estimatedRestoreTime: process.env.MAINTENANCE_ESTIMATED_TIME || 'Unknown',
    });
  }
  
  next();
};

module.exports = maintenanceMode;
