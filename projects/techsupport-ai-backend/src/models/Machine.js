const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  model: {
    type: String,
    required: [true, 'Please add a machine model'],
    trim: true,
    maxlength: [100, 'Model cannot be more than 100 characters'],
  },
  serialNumber: {
    type: String,
    required: [true, 'Please add a serial number'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a customer ID'],
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'retired'],
    default: 'active',
  },
  specifications: {
    manufacturer: {
      type: String,
      required: [true, 'Please add a manufacturer'],
      trim: true,
    },
    modelYear: {
      type: Number,
      min: [1990, 'Model year must be 1990 or later'],
      max: [new Date().getFullYear() + 1, 'Model year cannot be in the future'],
    },
    capacity: {
      type: String,
      trim: true,
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['mm', 'cm', 'm', 'in', 'ft'],
        default: 'mm',
      },
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['kg', 'lb', 'ton'],
        default: 'kg',
      },
    },
    powerRequirements: {
      voltage: Number,
      amperage: Number,
      phase: {
        type: String,
        enum: ['single', 'three'],
        default: 'three',
      },
    },
    operatingTemperature: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['C', 'F'],
        default: 'C',
      },
    },
    features: [{
      type: String,
    }],
  },
  installationDate: {
    type: Date,
  },
  warrantyExpiry: {
    type: Date,
  },
  serviceContract: {
    type: {
      type: String,
      enum: ['basic', 'premium', 'enterprise', 'none'],
      default: 'none',
    },
    expiryDate: Date,
    provider: String,
  },
  location: {
    facility: {
      type: String,
      trim: true,
    },
    building: {
      type: String,
      trim: true,
    },
    floor: {
      type: String,
      trim: true,
    },
    room: {
      type: String,
      trim: true,
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  maintenanceHistory: [{
    type: {
      type: String,
      enum: ['preventive', 'corrective', 'emergency', 'upgrade'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    performedAt: {
      type: Date,
      default: Date.now,
    },
    nextDueDate: Date,
    cost: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD',
      },
    },
    parts: [{
      name: String,
      partNumber: String,
      quantity: Number,
      cost: Number,
    }],
    notes: String,
    attachments: [{
      filename: String,
      url: String,
      type: String,
    }],
  }],
  issues: [{
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: String,
    attachments: [{
      filename: String,
      url: String,
      type: String,
    }],
  }],
  performanceMetrics: {
    uptime: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    efficiency: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    throughput: {
      value: Number,
      unit: String,
    },
    lastCalibration: Date,
    nextCalibration: Date,
    totalOperatingHours: {
      type: Number,
      default: 0,
    },
    lastMaintenance: Date,
    nextMaintenance: Date,
  },
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['manual', 'certificate', 'warranty', 'service_record', 'other'],
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  notes: String,
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
machineSchema.index({ serialNumber: 1 });
machineSchema.index({ customerId: 1 });
machineSchema.index({ model: 1 });
machineSchema.index({ status: 1 });
machineSchema.index({ 'specifications.manufacturer': 1 });
machineSchema.index({ 'location.facility': 1 });
machineSchema.index({ 'performanceMetrics.nextMaintenance': 1 });

// Virtual for machine display name
machineSchema.virtual('displayName').get(function() {
  return `${this.specifications.manufacturer} ${this.model} (${this.serialNumber})`;
});

// Virtual for warranty status
machineSchema.virtual('isUnderWarranty').get(function() {
  return this.warrantyExpiry && this.warrantyExpiry > new Date();
});

// Virtual for service contract status
machineSchema.virtual('hasActiveServiceContract').get(function() {
  return this.serviceContract.type !== 'none' && 
         this.serviceContract.expiryDate && 
         this.serviceContract.expiryDate > new Date();
});

// Virtual for maintenance status
machineSchema.virtual('needsMaintenance').get(function() {
  return this.performanceMetrics.nextMaintenance && 
         this.performanceMetrics.nextMaintenance <= new Date();
});

// Virtual for critical issues count
machineSchema.virtual('criticalIssuesCount').get(function() {
  return this.issues.filter(issue => 
    issue.severity === 'critical' && 
    issue.status !== 'resolved' && 
    issue.status !== 'closed'
  ).length;
});

// Pre-save middleware to update performance metrics
machineSchema.pre('save', function(next) {
  // Update total operating hours based on uptime
  if (this.performanceMetrics.uptime > 0) {
    const daysSinceInstallation = this.installationDate ? 
      Math.floor((new Date() - this.installationDate) / (1000 * 60 * 60 * 24)) : 0;
    this.performanceMetrics.totalOperatingHours = 
      (daysSinceInstallation * 24 * this.performanceMetrics.uptime) / 100;
  }
  
  next();
});

// Method to add maintenance record
machineSchema.methods.addMaintenanceRecord = function(record) {
  this.maintenanceHistory.push(record);
  return this.save();
};

// Method to add issue
machineSchema.methods.addIssue = function(issue) {
  this.issues.push(issue);
  return this.save();
};

// Method to resolve issue
machineSchema.methods.resolveIssue = function(issueId, resolution, resolvedBy) {
  const issue = this.issues.id(issueId);
  if (issue) {
    issue.status = 'resolved';
    issue.resolvedAt = new Date();
    issue.resolvedBy = resolvedBy;
    issue.resolution = resolution;
  }
  return this.save();
};

// Method to update performance metrics
machineSchema.methods.updatePerformanceMetrics = function(metrics) {
  this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
  return this.save();
};

// Static method to find machines needing maintenance
machineSchema.statics.findMachinesNeedingMaintenance = function() {
  return this.find({
    'performanceMetrics.nextMaintenance': { $lte: new Date() },
    isActive: true,
  }).populate('customerId', 'firstName lastName email companyName');
};

// Static method to find machines with critical issues
machineSchema.statics.findMachinesWithCriticalIssues = function() {
  return this.find({
    'issues': {
      $elemMatch: {
        severity: 'critical',
        status: { $nin: ['resolved', 'closed'] }
      }
    },
    isActive: true,
  }).populate('customerId', 'firstName lastName email companyName');
};

// JSON transform
machineSchema.methods.toJSON = function() {
  const machineObject = this.toObject();
  machineObject.displayName = this.displayName;
  machineObject.isUnderWarranty = this.isUnderWarranty;
  machineObject.hasActiveServiceContract = this.hasActiveServiceContract;
  machineObject.needsMaintenance = this.needsMaintenance;
  machineObject.criticalIssuesCount = this.criticalIssuesCount;
  return machineObject;
};

module.exports = mongoose.model('Machine', machineSchema);
