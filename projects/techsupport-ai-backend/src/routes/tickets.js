const express = require('express');
const { protect, canAccessCustomerData } = require('../middleware/auth');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Machine = require('../models/Machine');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    // Filter by user role
    if (req.user.role === 'customer') {
      query.customerId = req.user._id;
    }

    // Add other filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }

    const tickets = await Ticket.find(query)
      .populate('customerId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('machineId', 'model serialNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    logger.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customerId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('machineId', 'model serialNumber')
      .populate('messages.senderId', 'firstName lastName email role');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    // Check if user can access this ticket
    if (req.user.role === 'customer' && ticket.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this ticket',
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    logger.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const ticket = await Ticket.create({
      ...req.body,
      customerId: req.user._id,
    });

    await ticket.populate('customerId', 'firstName lastName email');
    if (ticket.machineId) {
      await ticket.populate('machineId', 'model serialNumber');
    }

    logger.info(`New ticket created: ${ticket.ticketNumber} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    logger.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    // Check if user can update this ticket
    if (req.user.role === 'customer' && ticket.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this ticket',
      });
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('customerId', 'firstName lastName email')
     .populate('assignedTo', 'firstName lastName email')
     .populate('machineId', 'model serialNumber');

    logger.info(`Ticket updated: ${updatedTicket.ticketNumber}`);

    res.status(200).json({
      success: true,
      data: updatedTicket,
    });
  } catch (error) {
    logger.error('Update ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Add message to ticket
// @route   POST /api/tickets/:id/messages
// @access  Private
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    // Check if user can add message to this ticket
    if (req.user.role === 'customer' && ticket.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add message to this ticket',
      });
    }

    const message = {
      ...req.body,
      senderId: req.user._id,
      senderRole: req.user.role,
    };

    await ticket.addMessage(message);

    const updatedTicket = await Ticket.findById(req.params.id)
      .populate('customerId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('machineId', 'model serialNumber')
      .populate('messages.senderId', 'firstName lastName email role');

    logger.info(`Message added to ticket: ${ticket.ticketNumber}`);

    res.status(200).json({
      success: true,
      data: updatedTicket,
    });
  } catch (error) {
    logger.error('Add message error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

module.exports = router;
