const express = require('express');
const { protect, canAccessCustomerData } = require('../middleware/auth');
const Machine = require('../models/Machine');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get all machines
// @route   GET /api/machines
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
    if (req.query.model) {
      query.model = new RegExp(req.query.model, 'i');
    }
    if (req.query.manufacturer) {
      query['specifications.manufacturer'] = new RegExp(req.query.manufacturer, 'i');
    }

    const machines = await Machine.find(query)
      .populate('customerId', 'firstName lastName email companyName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: machines.length,
      data: machines,
    });
  } catch (error) {
    logger.error('Get machines error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Get single machine
// @route   GET /api/machines/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id)
      .populate('customerId', 'firstName lastName email companyName')
      .populate('maintenanceHistory.performedBy', 'firstName lastName email')
      .populate('issues.reportedBy', 'firstName lastName email')
      .populate('issues.resolvedBy', 'firstName lastName email');

    if (!machine) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found',
      });
    }

    // Check if user can access this machine
    if (req.user.role === 'customer' && machine.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this machine',
      });
    }

    res.status(200).json({
      success: true,
      data: machine,
    });
  } catch (error) {
    logger.error('Get machine error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Create new machine
// @route   POST /api/machines
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const machine = await Machine.create({
      ...req.body,
      customerId: req.user._id,
    });

    await machine.populate('customerId', 'firstName lastName email companyName');

    logger.info(`New machine registered: ${machine.serialNumber} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: machine,
    });
  } catch (error) {
    logger.error('Create machine error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Update machine
// @route   PUT /api/machines/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found',
      });
    }

    // Check if user can update this machine
    if (req.user.role === 'customer' && machine.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this machine',
      });
    }

    const updatedMachine = await Machine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('customerId', 'firstName lastName email companyName');

    logger.info(`Machine updated: ${updatedMachine.serialNumber}`);

    res.status(200).json({
      success: true,
      data: updatedMachine,
    });
  } catch (error) {
    logger.error('Update machine error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Add maintenance record
// @route   POST /api/machines/:id/maintenance
// @access  Private
router.post('/:id/maintenance', protect, async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found',
      });
    }

    // Check if user can add maintenance record
    if (req.user.role === 'customer' && machine.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add maintenance record',
      });
    }

    const maintenanceRecord = {
      ...req.body,
      performedBy: req.user._id,
    };

    await machine.addMaintenanceRecord(maintenanceRecord);

    const updatedMachine = await Machine.findById(req.params.id)
      .populate('customerId', 'firstName lastName email companyName')
      .populate('maintenanceHistory.performedBy', 'firstName lastName email');

    logger.info(`Maintenance record added to machine: ${machine.serialNumber}`);

    res.status(200).json({
      success: true,
      data: updatedMachine,
    });
  } catch (error) {
    logger.error('Add maintenance record error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Add issue
// @route   POST /api/machines/:id/issues
// @access  Private
router.post('/:id/issues', protect, async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found',
      });
    }

    // Check if user can add issue
    if (req.user.role === 'customer' && machine.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add issue',
      });
    }

    const issue = {
      ...req.body,
      reportedBy: req.user._id,
    };

    await machine.addIssue(issue);

    const updatedMachine = await Machine.findById(req.params.id)
      .populate('customerId', 'firstName lastName email companyName')
      .populate('issues.reportedBy', 'firstName lastName email');

    logger.info(`Issue added to machine: ${machine.serialNumber}`);

    res.status(200).json({
      success: true,
      data: updatedMachine,
    });
  } catch (error) {
    logger.error('Add issue error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

module.exports = router;
