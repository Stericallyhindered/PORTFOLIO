const express = require('express');
const { body, validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const { protect, canAccessCustomerData } = require('../middleware/auth');
const User = require('../models/User');
const Machine = require('../models/Machine');
const Ticket = require('../models/Ticket');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Generate AI response
// @route   POST /api/ai/chat
// @access  Private
router.post('/chat', protect, [
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
  body('context').optional().isObject(),
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

    const { message, context = {} } = req.body;
    const user = req.user;

    // Build context from user data
    const aiContext = await buildAIContext(user, context);

    // Generate AI response
    const aiResponse = await aiService.generateResponse(message, user, aiContext);

    // Log the interaction
    logger.info(`AI chat interaction: User ${user.email}, Message: ${message.substring(0, 100)}...`);

    res.status(200).json({
      success: true,
      data: {
        response: aiResponse.response,
        confidence: aiResponse.confidence,
        suggestedActions: aiResponse.suggestedActions,
        shouldEscalate: aiResponse.shouldEscalate,
        model: aiResponse.model,
        tokens: aiResponse.tokens,
        timestamp: aiResponse.timestamp,
        relevantDocuments: aiResponse.relevantDocuments || [],
      },
    });
  } catch (error) {
    logger.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI service temporarily unavailable',
    });
  }
});

// @desc    Generate AI response for specific feature
// @route   POST /api/ai/feature/:featureName
// @access  Private
router.post('/feature/:featureName', protect, async (req, res) => {
  try {
    const { featureName } = req.params;
    const { params = {} } = req.body;
    const user = req.user;

    // Check if user can access this AI feature
    if (!user.canAccessAIFeature(featureName)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this AI feature',
      });
    }

    // Add user to params
    params.user = user;

    // Generate feature-specific response
    const aiResponse = await aiService.generateFeatureResponse(featureName, params);

    logger.info(`AI feature interaction: User ${user.email}, Feature: ${featureName}`);

    res.status(200).json({
      success: true,
      data: aiResponse,
    });
  } catch (error) {
    logger.error('AI feature error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI service temporarily unavailable',
    });
  }
});

// @desc    Get AI capabilities for user
// @route   GET /api/ai/capabilities
// @access  Private
router.get('/capabilities', protect, async (req, res) => {
  try {
    const user = req.user;

    // Define AI capabilities based on user role
    const aiCapabilities = {
      customer: [
        'basicChat',
        'ticketCreation',
        'knowledgeBaseSearch',
      ],
      salesAgent: [
        'basicChat',
        'ticketCreation',
        'knowledgeBaseSearch',
        'customerDataAccess',
        'productInfo',
      ],
      technician: [
        'basicChat',
        'ticketCreation',
        'knowledgeBaseSearch',
        'customerDataAccess',
        'technicalSupport',
        'escalation',
      ],
      supportManager: [
        'basicChat',
        'ticketCreation',
        'knowledgeBaseSearch',
        'customerDataAccess',
        'technicalSupport',
        'escalation',
        'analytics',
        'teamManagement',
      ],
      systemAdmin: [
        'basicChat',
        'ticketCreation',
        'knowledgeBaseSearch',
        'customerDataAccess',
        'technicalSupport',
        'escalation',
        'analytics',
        'teamManagement',
        'systemManagement',
        'aiTraining',
      ],
    };

    const userCapabilities = aiCapabilities[user.role] || aiCapabilities.customer;

    res.status(200).json({
      success: true,
      data: {
        capabilities: userCapabilities,
        role: user.role,
        aiCapabilityLevel: user.role,
      },
    });
  } catch (error) {
    logger.error('Get AI capabilities error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Get AI performance metrics
// @route   GET /api/ai/metrics
// @access  Private
router.get('/metrics', protect, canAccessAnalytics, async (req, res) => {
  try {
    // This would typically come from a metrics database
    // For now, we'll return mock data
    const metrics = {
      totalQueries: 15420,
      successfulQueries: 14890,
      failedQueries: 530,
      averageResponseTime: 1.2,
      averageConfidence: 0.87,
      escalationRate: 0.15,
      userSatisfaction: 4.2,
      topFeatures: [
        { feature: 'basicChat', usage: 8500 },
        { feature: 'technicalSupport', usage: 3200 },
        { feature: 'knowledgeBaseSearch', usage: 2100 },
        { feature: 'ticketCreation', usage: 1200 },
        { feature: 'customerDataAccess', usage: 420 },
      ],
      modelPerformance: {
        'gpt-4': {
          queries: 8500,
          avgResponseTime: 1.2,
          successRate: 0.96,
          cost: 850.50,
        },
        'gpt-3.5-turbo': {
          queries: 6200,
          avgResponseTime: 0.8,
          successRate: 0.94,
          cost: 350.25,
        },
      },
      recentQueries: [
        {
          id: '1',
          user: 'John Smith',
          query: 'How do I calibrate my SMT machine?',
          response: 'To calibrate your SMT machine, follow these steps...',
          confidence: 0.95,
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
        },
        {
          id: '2',
          user: 'Sarah Johnson',
          query: 'What are the specifications for the new model?',
          response: 'The new model features include...',
          confidence: 0.88,
          timestamp: new Date(Date.now() - 12 * 60 * 1000),
        },
      ],
    };

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Get AI metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Train AI model with new data
// @route   POST /api/ai/train
// @access  Private
router.post('/train', protect, canManageSystem, [
  body('trainingData').isArray().withMessage('Training data must be an array'),
  body('model').optional().isString(),
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

    const { trainingData, model } = req.body;

    // This would typically involve training the AI model with new data
    // For now, we'll simulate the training process
    logger.info(`AI training initiated with ${trainingData.length} data points`);

    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 2000));

    res.status(200).json({
      success: true,
      message: 'AI model training completed successfully',
      data: {
        trainingDataPoints: trainingData.length,
        model: model || 'default',
        trainingTime: '2.0s',
        accuracy: 0.94,
      },
    });
  } catch (error) {
    logger.error('AI training error:', error);
    res.status(500).json({
      success: false,
      error: 'AI training failed',
    });
  }
});

// @desc    Get AI configuration
// @route   GET /api/ai/config
// @access  Private
router.get('/config', protect, canManageSystem, async (req, res) => {
  try {
    const config = {
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
      confidenceThreshold: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD) || 0.8,
      escalationThreshold: parseFloat(process.env.AI_ESCALATION_THRESHOLD) || 0.6,
      maxContextLength: parseInt(process.env.AI_MAX_CONTEXT_LENGTH) || 8000,
      responseTimeout: parseInt(process.env.AI_RESPONSE_TIMEOUT) || 30000,
      enableLearning: process.env.ENABLE_AI_LEARNING === 'true',
      enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
      enableDebugMode: process.env.ENABLE_DEBUG_MODE === 'true',
    };

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    logger.error('Get AI config error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Update AI configuration
// @route   PUT /api/ai/config
// @access  Private
router.put('/config', protect, canManageSystem, [
  body('model').optional().isString(),
  body('maxTokens').optional().isInt({ min: 100, max: 8000 }),
  body('temperature').optional().isFloat({ min: 0, max: 2 }),
  body('confidenceThreshold').optional().isFloat({ min: 0, max: 1 }),
  body('escalationThreshold').optional().isFloat({ min: 0, max: 1 }),
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

    // In a real application, you would update the configuration
    // For now, we'll just return a success message
    logger.info(`AI configuration updated by user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'AI configuration updated successfully',
      data: req.body,
    });
  } catch (error) {
    logger.error('Update AI config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update AI configuration',
    });
  }
});

// Helper function to build AI context
async function buildAIContext(user, context) {
  const aiContext = { ...context };

  try {
    // Add user's recent tickets
    if (user.role === 'customer') {
      const recentTickets = await Ticket.find({ customerId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title status category priority');
      aiContext.recentTickets = recentTickets;
    }

    // Add user's machines
    if (user.role === 'customer') {
      const machines = await Machine.find({ customerId: user._id })
        .select('model serialNumber status specifications');
      aiContext.machines = machines;
    }

    // Add machine context if machineId is provided
    if (context.machineId) {
      const machine = await Machine.findById(context.machineId)
        .select('model serialNumber status specifications maintenanceHistory issues');
      aiContext.machine = machine;
    }

    // Add ticket context if ticketId is provided
    if (context.ticketId) {
      const ticket = await Ticket.findById(context.ticketId)
        .select('title description category priority status messages');
      aiContext.ticket = ticket;
    }

  } catch (error) {
    logger.error('Error building AI context:', error);
  }

  return aiContext;
}

module.exports = router;
