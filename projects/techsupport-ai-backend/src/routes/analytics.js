const express = require('express');
const { protect, canAccessAnalytics } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get analytics dashboard data
// @route   GET /api/analytics/dashboard
// @access  Private
router.get('/dashboard', protect, canAccessAnalytics, async (req, res) => {
  try {
    // Mock analytics data
    const dashboardData = {
      overview: {
        totalUsers: 1247,
        activeUsers: 89,
        totalTickets: 342,
        openTickets: 23,
        resolvedTickets: 298,
        averageResolutionTime: 4.2,
        customerSatisfaction: 4.3,
      },
      trends: {
        userGrowth: [
          { month: 'Jan', users: 1200 },
          { month: 'Feb', users: 1250 },
          { month: 'Mar', users: 1300 },
          { month: 'Apr', users: 1247 },
        ],
        ticketTrends: [
          { month: 'Jan', tickets: 45 },
          { month: 'Feb', tickets: 52 },
          { month: 'Mar', tickets: 38 },
          { month: 'Apr', tickets: 42 },
        ],
        resolutionTime: [
          { month: 'Jan', hours: 5.2 },
          { month: 'Feb', hours: 4.8 },
          { month: 'Mar', hours: 4.5 },
          { month: 'Apr', hours: 4.2 },
        ],
      },
      topIssues: [
        { issue: 'Calibration Problems', count: 45, percentage: 23.5 },
        { issue: 'Sensor Malfunctions', count: 32, percentage: 16.7 },
        { issue: 'Software Updates', count: 28, percentage: 14.6 },
        { issue: 'Maintenance Required', count: 25, percentage: 13.1 },
        { issue: 'Installation Issues', count: 20, percentage: 10.5 },
      ],
      performance: {
        aiResponseTime: 1.2,
        aiAccuracy: 94.5,
        escalationRate: 15.2,
        firstCallResolution: 78.3,
      },
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    logger.error('Get analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Get user analytics
// @route   GET /api/analytics/users
// @access  Private
router.get('/users', protect, canAccessAnalytics, async (req, res) => {
  try {
    const userAnalytics = {
      totalUsers: 1247,
      activeUsers: 89,
      newUsersThisMonth: 45,
      userRoles: [
        { role: 'customer', count: 1100, percentage: 88.2 },
        { role: 'salesAgent', count: 85, percentage: 6.8 },
        { role: 'technician', count: 45, percentage: 3.6 },
        { role: 'supportManager', count: 12, percentage: 1.0 },
        { role: 'systemAdmin', count: 5, percentage: 0.4 },
      ],
      userActivity: [
        { date: '2024-04-01', activeUsers: 45 },
        { date: '2024-04-02', activeUsers: 52 },
        { date: '2024-04-03', activeUsers: 38 },
        { date: '2024-04-04', activeUsers: 61 },
        { date: '2024-04-05', activeUsers: 48 },
      ],
      topCompanies: [
        { company: 'TechCorp Inc.', users: 25, tickets: 45 },
        { company: 'Manufacturing Co.', users: 18, tickets: 32 },
        { company: 'Electronics Ltd.', users: 15, tickets: 28 },
        { company: 'Industrial Systems', users: 12, tickets: 22 },
        { company: 'Automation Corp.', users: 10, tickets: 18 },
      ],
    };

    res.status(200).json({
      success: true,
      data: userAnalytics,
    });
  } catch (error) {
    logger.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Get ticket analytics
// @route   GET /api/analytics/tickets
// @access  Private
router.get('/tickets', protect, canAccessAnalytics, async (req, res) => {
  try {
    const ticketAnalytics = {
      totalTickets: 342,
      openTickets: 23,
      resolvedTickets: 298,
      closedTickets: 21,
      averageResolutionTime: 4.2,
      ticketStatus: [
        { status: 'open', count: 23, percentage: 6.7 },
        { status: 'in_progress', count: 45, percentage: 13.2 },
        { status: 'pending_customer', count: 12, percentage: 3.5 },
        { status: 'resolved', count: 298, percentage: 87.1 },
        { status: 'closed', count: 21, percentage: 6.1 },
      ],
      ticketPriority: [
        { priority: 'low', count: 45, percentage: 13.2 },
        { priority: 'medium', count: 156, percentage: 45.6 },
        { priority: 'high', count: 98, percentage: 28.7 },
        { priority: 'urgent', count: 32, percentage: 9.4 },
        { priority: 'critical', count: 11, percentage: 3.2 },
      ],
      ticketCategory: [
        { category: 'technical', count: 125, percentage: 36.5 },
        { category: 'installation', count: 78, percentage: 22.8 },
        { category: 'maintenance', count: 65, percentage: 19.0 },
        { category: 'training', count: 45, percentage: 13.2 },
        { category: 'billing', count: 20, percentage: 5.8 },
        { category: 'general', count: 9, percentage: 2.6 },
      ],
      resolutionTimeByPriority: [
        { priority: 'low', averageHours: 8.5 },
        { priority: 'medium', averageHours: 4.2 },
        { priority: 'high', averageHours: 2.1 },
        { priority: 'urgent', averageHours: 1.2 },
        { priority: 'critical', averageHours: 0.8 },
      ],
    };

    res.status(200).json({
      success: true,
      data: ticketAnalytics,
    });
  } catch (error) {
    logger.error('Get ticket analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Get AI analytics
// @route   GET /api/analytics/ai
// @access  Private
router.get('/ai', protect, canAccessAnalytics, async (req, res) => {
  try {
    const aiAnalytics = {
      totalQueries: 15420,
      successfulQueries: 14890,
      failedQueries: 530,
      averageResponseTime: 1.2,
      averageConfidence: 0.87,
      escalationRate: 0.15,
      userSatisfaction: 4.2,
      modelPerformance: [
        {
          model: 'GPT-4',
          queries: 8500,
          avgResponseTime: 1.2,
          successRate: 0.96,
          cost: 850.50,
        },
        {
          model: 'GPT-3.5-turbo',
          queries: 6200,
          avgResponseTime: 0.8,
          successRate: 0.94,
          cost: 350.25,
        },
        {
          model: 'Claude-3',
          queries: 720,
          avgResponseTime: 1.5,
          successRate: 0.98,
          cost: 50.00,
        },
      ],
      topFeatures: [
        { feature: 'basicChat', usage: 8500, percentage: 55.1 },
        { feature: 'technicalSupport', usage: 3200, percentage: 20.8 },
        { feature: 'knowledgeBaseSearch', usage: 2100, percentage: 13.6 },
        { feature: 'ticketCreation', usage: 1200, percentage: 7.8 },
        { feature: 'customerDataAccess', usage: 420, percentage: 2.7 },
      ],
      confidenceDistribution: [
        { range: '0.9-1.0', count: 8500, percentage: 55.1 },
        { range: '0.8-0.9', count: 4200, percentage: 27.2 },
        { range: '0.7-0.8', count: 1800, percentage: 11.7 },
        { range: '0.6-0.7', count: 720, percentage: 4.7 },
        { range: '0.0-0.6', count: 200, percentage: 1.3 },
      ],
    };

    res.status(200).json({
      success: true,
      data: aiAnalytics,
    });
  } catch (error) {
    logger.error('Get AI analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Get performance metrics
// @route   GET /api/analytics/performance
// @access  Private
router.get('/performance', protect, canAccessAnalytics, async (req, res) => {
  try {
    const performanceMetrics = {
      systemHealth: {
        uptime: 99.9,
        responseTime: 120,
        errorRate: 0.1,
        throughput: 1500,
      },
      database: {
        connectionPool: 85,
        queryTime: 45,
        cacheHitRate: 92.5,
        storageUsed: 68.2,
      },
      ai: {
        responseTime: 1.2,
        accuracy: 94.5,
        availability: 99.8,
        costPerQuery: 0.05,
      },
      api: {
        requestsPerMinute: 150,
        averageResponseTime: 200,
        errorRate: 0.2,
        successRate: 99.8,
      },
    };

    res.status(200).json({
      success: true,
      data: performanceMetrics,
    });
  } catch (error) {
    logger.error('Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

module.exports = router;
