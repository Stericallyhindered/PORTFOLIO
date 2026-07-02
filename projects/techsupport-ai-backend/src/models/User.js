const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please add a first name'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Please add a last name'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please add a valid phone number'],
  },
  role: {
    type: String,
    enum: ['customer', 'salesAgent', 'technician', 'supportManager', 'systemAdmin'],
    default: 'customer',
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values but ensures uniqueness when present
  },
  companyName: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters'],
  },
  department: {
    type: String,
    trim: true,
    maxlength: [50, 'Department cannot be more than 50 characters'],
  },
  position: {
    type: String,
    trim: true,
    maxlength: [50, 'Position cannot be more than 50 characters'],
  },
  preferences: {
    enableNotifications: {
      type: Boolean,
      default: true,
    },
    enableEmailNotifications: {
      type: Boolean,
      default: true,
    },
    enablePushNotifications: {
      type: Boolean,
      default: true,
    },
    enableSmsNotifications: {
      type: Boolean,
      default: false,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light',
    },
    language: {
      type: String,
      default: 'en',
    },
    enableSpeechToText: {
      type: Boolean,
      default: true,
    },
    enableTextToSpeech: {
      type: Boolean,
      default: true,
    },
    enableDarkMode: {
      type: Boolean,
      default: false,
    },
    sessionTimeout: {
      type: Number,
      default: 30,
      min: 5,
      max: 480,
    },
    enableBiometricAuth: {
      type: Boolean,
      default: false,
    },
    enableTwoFactorAuth: {
      type: Boolean,
      default: false,
    },
    favoriteFeatures: [{
      type: String,
    }],
    customSettings: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  permissions: [{
    type: String,
    enum: [
      'canCreateTickets',
      'canViewTickets',
      'canEditProfile',
      'canAccessKnowledgeBase',
      'canManageUsers',
      'canManageSystem',
      'canAccessAnalytics',
      'canManageKnowledgeBase',
      'canEscalateTickets',
    ],
  }],
  profileImageUrl: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date,
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
  language: {
    type: String,
    default: 'en',
  },
  twoFactorSecret: {
    type: String,
    select: false,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  emailVerificationToken: {
    type: String,
    select: false,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ companyName: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  if (this.role === 'customer') {
    return this.fullName;
  }
  return `${this.fullName} (${this.role})`;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      email: this.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user has specific permission
userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Check if user can access specific AI feature
userSchema.methods.canAccessAIFeature = function(feature) {
  const aiCapabilities = {
    customer: ['basicChat', 'ticketCreation', 'knowledgeBaseSearch'],
    salesAgent: ['basicChat', 'ticketCreation', 'knowledgeBaseSearch', 'customerDataAccess', 'productInfo'],
    technician: ['basicChat', 'ticketCreation', 'knowledgeBaseSearch', 'customerDataAccess', 'technicalSupport', 'escalation'],
    supportManager: ['basicChat', 'ticketCreation', 'knowledgeBaseSearch', 'customerDataAccess', 'technicalSupport', 'escalation', 'analytics', 'teamManagement'],
    systemAdmin: ['basicChat', 'ticketCreation', 'knowledgeBaseSearch', 'customerDataAccess', 'technicalSupport', 'escalation', 'analytics', 'teamManagement', 'systemManagement', 'aiTraining'],
  };
  
  return aiCapabilities[this.role]?.includes(feature) || false;
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  });
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  return this.updateOne({
    $set: { lastLoginAt: new Date() },
  });
};

// JSON transform
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.twoFactorSecret;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.emailVerificationToken;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
