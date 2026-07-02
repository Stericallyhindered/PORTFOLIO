const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Machine = require('../models/Machine');
const Ticket = require('../models/Ticket');
const logger = require('../utils/logger');

const router = express.Router();

// In-memory storage for chat sessions and messages
// In production, this should be stored in a database
const chatSessions = new Map();
const chatMessages = new Map();

// @desc    Create a new chat session
// @route   POST /api/chat/sessions
// @access  Private
router.post('/sessions', protect, [
  body('sessionId').trim().isLength({ min: 1 }).withMessage('Session ID is required'),
  body('userId').trim().isLength({ min: 1 }).withMessage('User ID is required'),
  body('userName').trim().isLength({ min: 1 }).withMessage('User name is required'),
  body('userRole').trim().isLength({ min: 1 }).withMessage('User role is required'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { sessionId, userId, userName, userRole } = req.body;
    const user = req.user;

    // Verify user can create sessions
    if (user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create session for this user',
      });
    }

    // Create session
    const session = {
      id: sessionId,
      userId: userId,
      userName: userName,
      userRole: userRole,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      messageCount: 0,
    };

    chatSessions.set(sessionId, session);
    chatMessages.set(sessionId, []);

    logger.info(`Chat session created: ${sessionId} for user: ${userId}`);

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    logger.error('Create chat session error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Get user's chat sessions
// @route   GET /api/chat/users/:userId/sessions
// @access  Private
router.get('/users/:userId/sessions', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user;

    // Verify user can access sessions
    if (user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access sessions for this user',
      });
    }

    // Get user's sessions
    const userSessions = Array.from(chatSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    res.status(200).json({
      success: true,
      data: userSessions.map(session => session.id),
    });
  } catch (error) {
    logger.error('Get user sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Get messages for a session
// @route   GET /api/chat/sessions/:sessionId/messages
// @access  Private
router.get('/sessions/:sessionId/messages', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const user = req.user;

    // Get session
    const session = chatSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // Verify user can access this session
    if (session.userId !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this session',
      });
    }

    // Get messages
    const messages = chatMessages.get(sessionId) || [];

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    logger.error('Get session messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Save a message to a session
// @route   POST /api/chat/messages
// @access  Private
router.post('/messages', protect, [
  body('sessionId').trim().isLength({ min: 1 }).withMessage('Session ID is required'),
  body('message').isObject().withMessage('Message is required'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { sessionId, message } = req.body;
    const user = req.user;

    // Get session
    const session = chatSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // Verify user can add messages to this session
    if (session.userId !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add messages to this session',
      });
    }

    // Add message
    const messages = chatMessages.get(sessionId) || [];
    messages.push({
      ...message,
      timestamp: new Date(),
    });
    chatMessages.set(sessionId, messages);

    // Update session
    session.lastActivity = new Date();
    session.messageCount = messages.length;
    chatSessions.set(sessionId, session);

    logger.info(`Message added to session: ${sessionId}`);

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    logger.error('Save message error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Delete a chat session
// @route   DELETE /api/chat/sessions/:sessionId
// @access  Private
router.delete('/sessions/:sessionId', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const user = req.user;

    // Get session
    const session = chatSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // Verify user can delete this session
    if (session.userId !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this session',
      });
    }

    // Delete session and messages
    chatSessions.delete(sessionId);
    chatMessages.delete(sessionId);

    logger.info(`Chat session deleted: ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    logger.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Get chat analytics for a user
// @route   GET /api/chat/analytics/:userId
// @access  Private
router.get('/analytics/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user;

    // Verify user can access analytics
    if (user._id.toString() !== userId && !user.canAccessAnalytics) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access analytics',
      });
    }

    // Get user's sessions
    const userSessions = Array.from(chatSessions.values())
      .filter(session => session.userId === userId);

    // Calculate analytics
    const totalSessions = userSessions.length;
    const totalMessages = userSessions.reduce((sum, session) => sum + session.messageCount, 0);
    const averageMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0;
    
    const activeSessions = userSessions.filter(session => session.isActive).length;
    const completedSessions = totalSessions - activeSessions;

    // Get recent activity
    const recentSessions = userSessions
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
      .slice(0, 5);

    const analytics = {
      totalSessions,
      totalMessages,
      averageMessagesPerSession: Math.round(averageMessagesPerSession * 100) / 100,
      activeSessions,
      completedSessions,
      recentSessions: recentSessions.map(session => ({
        id: session.id,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        messageCount: session.messageCount,
        isActive: session.isActive,
      })),
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Get chat analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Export chat history for a user
// @route   GET /api/chat/export/:userId
// @access  Private
router.get('/export/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user;

    // Verify user can export data
    if (user._id.toString() !== userId && !user.canAccessCustomerData) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to export data',
      });
    }

    // Get user's sessions and messages
    const userSessions = Array.from(chatSessions.values())
      .filter(session => session.userId === userId);

    const exportData = {
      userId: userId,
      exportedAt: new Date(),
      sessions: [],
    };

    for (const session of userSessions) {
      const messages = chatMessages.get(session.id) || [];
      exportData.sessions.push({
        session: session,
        messages: messages,
      });
    }

    res.status(200).json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    logger.error('Export chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

module.exports = router;
