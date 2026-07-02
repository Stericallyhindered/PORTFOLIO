const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['customer', 'salesAgent', 'technician', 'supportManager']).withMessage('Invalid role'),
  body('employeeId').optional().trim(),
  body('companyName').optional().trim(),
  body('department').optional().trim(),
  body('position').optional().trim(),
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

    const {
      firstName,
      lastName,
      email,
      password,
      role = 'customer',
      employeeId,
      companyName,
      department,
      position,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email',
      });
    }

    // Check if employee ID already exists (for employees)
    if (employeeId) {
      const existingEmployee = await User.findOne({ employeeId });
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          error: 'Employee ID already exists',
        });
      }
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      employeeId,
      companyName,
      department,
      position,
    });

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Set default permissions based on role
    const rolePermissions = {
      customer: ['canCreateTickets', 'canViewTickets', 'canEditProfile', 'canAccessKnowledgeBase'],
      salesAgent: ['canCreateTickets', 'canViewTickets', 'canEditProfile', 'canAccessKnowledgeBase'],
      technician: ['canCreateTickets', 'canViewTickets', 'canEditProfile', 'canAccessKnowledgeBase'],
      supportManager: ['canCreateTickets', 'canViewTickets', 'canEditProfile', 'canAccessKnowledgeBase', 'canManageUsers'],
      systemAdmin: ['canCreateTickets', 'canViewTickets', 'canEditProfile', 'canAccessKnowledgeBase', 'canManageUsers', 'canManageSystem'],
    };

    user.permissions = rolePermissions[role] || rolePermissions.customer;
    await user.save();

    logger.info(`New user registered: ${user.email} with role: ${user.role}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          companyName: user.companyName,
          department: user.department,
          position: user.position,
          permissions: user.permissions,
          preferences: user.preferences,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration',
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
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

    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        error: 'Account is temporarily locked due to too many failed login attempts',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    await user.updateLastLogin();

    // Generate JWT token
    const token = user.getSignedJwtToken();

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          companyName: user.companyName,
          department: user.department,
          position: user.position,
          permissions: user.permissions,
          preferences: user.preferences,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login',
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          companyName: user.companyName,
          department: user.department,
          position: user.position,
          permissions: user.permissions,
          preferences: user.preferences,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, [
  body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
  body('lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
  body('phoneNumber').optional().trim(),
  body('companyName').optional().trim(),
  body('department').optional().trim(),
  body('position').optional().trim(),
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

    const {
      firstName,
      lastName,
      phoneNumber,
      companyName,
      department,
      position,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        phoneNumber,
        companyName,
        department,
        position,
      },
      { new: true, runValidators: true }
    );

    logger.info(`User profile updated: ${user.email}`);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          employeeId: user.employeeId,
          companyName: user.companyName,
          department: user.department,
          position: user.position,
          permissions: user.permissions,
          preferences: user.preferences,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during profile update',
    });
  }
});

// @desc    Update user preferences
// @route   PUT /api/auth/preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { preferences: req.body },
      { new: true, runValidators: true }
    );

    logger.info(`User preferences updated: ${user.email}`);

    res.status(200).json({
      success: true,
      data: {
        preferences: user.preferences,
      },
    });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during preferences update',
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
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

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during password change',
    });
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    logger.info(`User logged out: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during logout',
    });
  }
});

module.exports = router;
