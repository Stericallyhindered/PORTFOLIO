const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a ticket title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please add a ticket description'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['technical', 'installation', 'maintenance', 'training', 'billing', 'general'],
    required: [true, 'Please add a ticket category'],
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'pending_customer', 'pending_vendor', 'resolved', 'closed'],
    default: 'open',
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a customer ID'],
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedAt: {
    type: Date,
  },
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  escalatedAt: {
    type: Date,
  },
  escalationReason: {
    type: String,
  },
  isEscalated: {
    type: Boolean,
    default: false,
  },
  messages: [{
    type: {
      type: String,
      enum: ['text', 'voice', 'image', 'file', 'system'],
      default: 'text',
    },
    content: {
      type: String,
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['customer', 'salesAgent', 'technician', 'supportManager', 'systemAdmin'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isInternal: {
      type: Boolean,
      default: false,
    },
    attachments: [{
      filename: String,
      url: String,
      type: String,
      size: Number,
    }],
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    suggestedActions: [{
      action: String,
      description: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
    }],
  }],
  attachments: [{
    filename: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  tags: [{
    type: String,
    trim: true,
  }],
  estimatedResolutionTime: {
    type: Number, // in hours
  },
  actualResolutionTime: {
    type: Number, // in hours
  },
  resolution: {
    type: String,
  },
  resolvedAt: {
    type: Date,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  closedAt: {
    type: Date,
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  customerSatisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,
    ratedAt: Date,
  },
  followUpRequired: {
    type: Boolean,
    default: false,
  },
  followUpDate: {
    type: Date,
  },
  followUpNotes: {
    type: String,
  },
  slaBreach: {
    type: Boolean,
    default: false,
  },
  slaBreachReason: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ customerId: 1 });
ticketSchema.index({ machineId: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ isEscalated: 1 });
ticketSchema.index({ 'messages.timestamp': -1 });

// Virtual for ticket age in hours
ticketSchema.virtual('ageInHours').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60));
});

// Virtual for ticket age in days
ticketSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for last message
ticketSchema.virtual('lastMessage').get(function() {
  if (this.messages.length === 0) return null;
  return this.messages[this.messages.length - 1];
});

// Virtual for message count
ticketSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Virtual for customer messages count
ticketSchema.virtual('customerMessageCount').get(function() {
  return this.messages.filter(msg => msg.senderRole === 'customer').length;
});

// Virtual for staff messages count
ticketSchema.virtual('staffMessageCount').get(function() {
  return this.messages.filter(msg => msg.senderRole !== 'customer').length;
});

// Virtual for SLA status
ticketSchema.virtual('slaStatus').get(function() {
  const slaHours = {
    critical: 2,
    urgent: 4,
    high: 8,
    medium: 24,
    low: 72,
  };
  
  const expectedResolution = slaHours[this.priority] || 24;
  const ageInHours = this.ageInHours;
  
  if (this.status === 'resolved' || this.status === 'closed') {
    return 'resolved';
  } else if (ageInHours > expectedResolution) {
    return 'breached';
  } else if (ageInHours > expectedResolution * 0.8) {
    return 'at_risk';
  } else {
    return 'on_track';
  }
});

// Pre-save middleware to generate ticket number
ticketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketNumber) {
    const count = await this.constructor.countDocuments();
    this.ticketNumber = `TS-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Pre-save middleware to update timestamps
ticketSchema.pre('save', function(next) {
  // Update resolvedAt when status changes to resolved
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  
  // Update closedAt when status changes to closed
  if (this.isModified('status') && this.status === 'closed' && !this.closedAt) {
    this.closedAt = new Date();
  }
  
  // Calculate actual resolution time
  if (this.resolvedAt && this.createdAt) {
    this.actualResolutionTime = Math.floor((this.resolvedAt - this.createdAt) / (1000 * 60 * 60));
  }
  
  next();
});

// Method to add message
ticketSchema.methods.addMessage = function(message) {
  this.messages.push(message);
  return this.save();
};

// Method to assign ticket
ticketSchema.methods.assignTicket = function(userId) {
  this.assignedTo = userId;
  this.assignedAt = new Date();
  return this.save();
};

// Method to escalate ticket
ticketSchema.methods.escalateTicket = function(userId, reason) {
  this.escalatedTo = userId;
  this.escalatedAt = new Date();
  this.escalationReason = reason;
  this.isEscalated = true;
  return this.save();
};

// Method to resolve ticket
ticketSchema.methods.resolveTicket = function(userId, resolution) {
  this.status = 'resolved';
  this.resolvedBy = userId;
  this.resolution = resolution;
  this.resolvedAt = new Date();
  return this.save();
};

// Method to close ticket
ticketSchema.methods.closeTicket = function(userId) {
  this.status = 'closed';
  this.closedBy = userId;
  this.closedAt = new Date();
  return this.save();
};

// Method to add customer satisfaction rating
ticketSchema.methods.addCustomerSatisfaction = function(rating, feedback) {
  this.customerSatisfaction = {
    rating,
    feedback,
    ratedAt: new Date(),
  };
  return this.save();
};

// Static method to find tickets by status
ticketSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('customerId assignedTo machineId');
};

// Static method to find tickets by priority
ticketSchema.statics.findByPriority = function(priority) {
  return this.find({ priority }).populate('customerId assignedTo machineId');
};

// Static method to find escalated tickets
ticketSchema.statics.findEscalatedTickets = function() {
  return this.find({ isEscalated: true }).populate('customerId escalatedTo machineId');
};

// Static method to find tickets needing attention
ticketSchema.statics.findTicketsNeedingAttention = function() {
  return this.find({
    status: { $in: ['open', 'in_progress'] },
    priority: { $in: ['urgent', 'critical'] },
  }).populate('customerId assignedTo machineId');
};

// Static method to get ticket statistics
ticketSchema.statics.getTicketStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
};

// JSON transform
ticketSchema.methods.toJSON = function() {
  const ticketObject = this.toObject();
  ticketObject.ageInHours = this.ageInHours;
  ticketObject.ageInDays = this.ageInDays;
  ticketObject.lastMessage = this.lastMessage;
  ticketObject.messageCount = this.messageCount;
  ticketObject.customerMessageCount = this.customerMessageCount;
  ticketObject.staffMessageCount = this.staffMessageCount;
  ticketObject.slaStatus = this.slaStatus;
  return ticketObject;
};

module.exports = mongoose.model('Ticket', ticketSchema);
