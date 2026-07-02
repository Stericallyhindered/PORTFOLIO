const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'"],
      scriptSrcAttr: ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'set-JWT_SECRET-in-env';

// Database setup - use absolute path for GoDaddy compatibility
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'sales',
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1
    )`,

    // Companies table
    `CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      domain TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      country TEXT DEFAULT 'USA',
      phone TEXT,
      email TEXT,
      website TEXT,
      industry TEXT,
      owner_id INTEGER,
      status TEXT DEFAULT 'active',
      approval_status TEXT DEFAULT 'pending',
      approved_by INTEGER,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users (id),
      FOREIGN KEY (approved_by) REFERENCES users (id)
    )`,

    // Contacts table
    `CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      title TEXT,
      company_id INTEGER,
      owner_id INTEGER,
      status TEXT DEFAULT 'lead',
      approval_status TEXT DEFAULT 'pending',
      approved_by INTEGER,
      approved_at DATETIME,
      source TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies (id),
      FOREIGN KEY (owner_id) REFERENCES users (id),
      FOREIGN KEY (approved_by) REFERENCES users (id)
    )`,

    // Orders table
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      company_id INTEGER,
      contact_id INTEGER,
      owner_id INTEGER,
      status TEXT DEFAULT 'draft',
      approval_status TEXT DEFAULT 'pending',
      approved_by INTEGER,
      approved_at DATETIME,
      total_amount DECIMAL(10,2),
      currency TEXT DEFAULT 'USD',
      description TEXT,
      notes TEXT,
      priority TEXT DEFAULT 'medium',
      expected_delivery DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies (id),
      FOREIGN KEY (contact_id) REFERENCES contacts (id),
      FOREIGN KEY (owner_id) REFERENCES users (id),
      FOREIGN KEY (approved_by) REFERENCES users (id)
    )`,

    // Order items table
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      quantity INTEGER DEFAULT 1,
      unit_price DECIMAL(10,2),
      total_price DECIMAL(10,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    )`,

    // Order updates table
    `CREATE TABLE IF NOT EXISTS order_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      customer_visible BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,

    // Shipments table
    `CREATE TABLE IF NOT EXISTS shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      carrier TEXT,
      tracking_number TEXT,
      vessel_name TEXT,
      voyage_number TEXT,
      container_number TEXT,
      port_of_loading TEXT,
      port_of_discharge TEXT,
      estimated_departure DATE,
      estimated_arrival DATE,
      actual_departure DATE,
      actual_arrival DATE,
      status TEXT DEFAULT 'preparing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    )`,

    // Documents table
    `CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      ocr_text TEXT,
      document_type TEXT,
      customer_visible BOOLEAN DEFAULT 0,
      uploaded_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users (id)
    )`,

    // Customer portal tokens table
    `CREATE TABLE IF NOT EXISTS portal_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      order_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      views INTEGER DEFAULT 0,
      max_views INTEGER DEFAULT -1,
      is_revoked BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_accessed DATETIME,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    )`,

    // Audit log table
    `CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,

    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,

    // Product Registration Tables
    // Registered customers table
    `CREATE TABLE IF NOT EXISTS registered_customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      street_address TEXT NOT NULL,
      city TEXT NOT NULL,
      state_province TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'USA',
      email_verified BOOLEAN DEFAULT 0,
      email_verification_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Registered products table
    `CREATE TABLE IF NOT EXISTS registered_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      product_type TEXT NOT NULL CHECK (product_type IN ('battery', 'charger')),
      model_number TEXT NOT NULL,
      unique_manufacturer_id TEXT UNIQUE NOT NULL,
      manufacture_year INTEGER NOT NULL,
      manufacture_month INTEGER NOT NULL,
      purchase_date DATE NOT NULL,
      place_of_purchase TEXT NOT NULL,
      proof_of_purchase_filename TEXT,
      warranty_start_date DATE NOT NULL,
      warranty_end_date DATE NOT NULL,
      warranty_type TEXT NOT NULL,
      is_transferred BOOLEAN DEFAULT 0,
      previous_owner_id INTEGER,
      transfer_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES registered_customers (id),
      FOREIGN KEY (previous_owner_id) REFERENCES registered_customers (id)
    )`,

    // Product ownership transfers table
    `CREATE TABLE IF NOT EXISTS product_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      from_customer_id INTEGER NOT NULL,
      to_customer_id INTEGER NOT NULL,
      transfer_reason TEXT,
      transfer_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
      FOREIGN KEY (product_id) REFERENCES registered_products (id),
      FOREIGN KEY (from_customer_id) REFERENCES registered_customers (id),
      FOREIGN KEY (to_customer_id) REFERENCES registered_customers (id)
    )`,

    // Recall notifications table
    `CREATE TABLE IF NOT EXISTS recall_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recall_title TEXT NOT NULL,
      recall_description TEXT NOT NULL,
      affected_product_types TEXT NOT NULL,
      affected_manufacture_years TEXT NOT NULL,
      affected_manufacture_months TEXT NOT NULL,
      affected_model_numbers TEXT,
      notification_sent BOOLEAN DEFAULT 0,
      customers_notified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES users (id)
    )`
  ];

  tables.forEach(table => {
    db.run(table, (err) => {
      if (err) {
        console.error('Error creating table:', err);
      }
    });
  });

  // Add approval_status columns to existing tables if they don't exist
  const alterTables = [
    `ALTER TABLE companies ADD COLUMN approval_status TEXT DEFAULT 'pending'`,
    `ALTER TABLE companies ADD COLUMN approved_by INTEGER REFERENCES users(id)`,
    `ALTER TABLE companies ADD COLUMN approved_at DATETIME`,
    `ALTER TABLE contacts ADD COLUMN approval_status TEXT DEFAULT 'pending'`,
    `ALTER TABLE contacts ADD COLUMN approved_by INTEGER REFERENCES users(id)`,
    `ALTER TABLE contacts ADD COLUMN approved_at DATETIME`
  ];

  alterTables.forEach(alterQuery => {
    db.run(alterQuery, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error altering table:', err);
      }
    });
  });

  // Check if any admin users exist, if not create a default admin
  db.get('SELECT COUNT(*) as count FROM users WHERE role = "admin"', [], (err, result) => {
    if (!err && result.count === 0) {
      console.log('No admin users found. Creating default admin user...');
      const adminPassword = bcrypt.hashSync('change-me-demo-password', 10);
      db.run(`INSERT INTO users (username, email, password, role, first_name, last_name) 
              VALUES (?, ?, ?, ?, ?, ?)`, 
             ['admin', 'admin@company.com', adminPassword, 'admin', 'System', 'Administrator'], 
             function(err) {
               if (err) {
                 console.error('Error creating admin user:', err);
               } else {
                 console.log('Default admin user created successfully');
                 console.log('Admin login: username=admin, password=change-me-demo-password');
               }
             });
    }
  });
};

// Initialize database
initDatabase();

// Create uploads directory
// Use absolute paths for GoDaddy compatibility
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Audit logging function
const logAudit = (userId, action, entityType, entityId, oldValues = null, newValues = null, req = null) => {
  const ipAddress = req ? req.ip : null;
  const userAgent = req ? req.get('User-Agent') : null;
  
  db.run(`INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
         [userId, action, entityType, entityId, 
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
          ipAddress, userAgent]);
};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API Routes

// User Management Routes (Admin only)
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  const { role, search, is_active } = req.query;
  let query = 'SELECT id, username, email, role, first_name, last_name, phone, created_at, updated_at, is_active FROM users WHERE 1=1';
  const params = [];
  
  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }
  
  if (search) {
    query += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  if (is_active !== undefined) {
    query += ' AND is_active = ?';
    params.push(is_active);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

app.post('/api/users', authenticateToken, requireAdmin, (req, res) => {
  const { username, email, password, role, first_name, last_name, phone } = req.body;
  
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'Username, email, password, and role are required' });
  }
  
  if (!['admin', 'sales'].includes(role)) {
    return res.status(400).json({ error: 'Role must be admin or sales' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run(`INSERT INTO users (username, email, password, role, first_name, last_name, phone)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
         [username, email, hashedPassword, role, first_name, last_name, phone],
         function(err) {
           if (err) {
             if (err.message.includes('UNIQUE constraint failed')) {
               return res.status(400).json({ error: 'Username or email already exists' });
             }
             return res.status(500).json({ error: 'Database error' });
           }
           
           const userData = { username, email, role, first_name, last_name, phone };
           logAudit(req.user.id, 'create_user', 'user', this.lastID, null, userData, req);
           
           res.json({ id: this.lastID, message: 'User created successfully' });
         });
});

app.put('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const { username, email, role, first_name, last_name, phone, is_active } = req.body;
  
  // Get current user data for audit
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, oldUser) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!oldUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent admin from deactivating themselves
    if (userId == req.user.id && is_active === 0) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    db.run(`UPDATE users SET username = ?, email = ?, role = ?, first_name = ?, last_name = ?, phone = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
           [username, email, role, first_name, last_name, phone, is_active !== undefined ? is_active : oldUser.is_active, userId],
           (err) => {
             if (err) {
               if (err.message.includes('UNIQUE constraint failed')) {
                 return res.status(400).json({ error: 'Username or email already exists' });
               }
               return res.status(500).json({ error: 'Database error' });
             }
             
             const newUserData = { username, email, role, first_name, last_name, phone, is_active };
             const oldUserData = { 
               username: oldUser.username, 
               email: oldUser.email, 
               role: oldUser.role, 
               first_name: oldUser.first_name, 
               last_name: oldUser.last_name, 
               phone: oldUser.phone, 
               is_active: oldUser.is_active 
             };
             
             logAudit(req.user.id, 'update_user', 'user', userId, oldUserData, newUserData, req);
             
             res.json({ message: 'User updated successfully' });
           });
  });
});

app.post('/api/users/:id/reset-password', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const { new_password } = req.body;
  
  if (!new_password) {
    return res.status(400).json({ error: 'New password is required' });
  }
  
  const hashedPassword = bcrypt.hashSync(new_password, 10);
  
  db.run('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
         [hashedPassword, userId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    logAudit(req.user.id, 'reset_password', 'user', userId, null, { password_reset: true }, req);
    
    res.json({ message: 'Password reset successfully' });
  });
});

// Enhanced Activity Tracking
app.get('/api/activity', authenticateToken, requireAdmin, (req, res) => {
  const { user_id, entity_type, start_date, end_date, limit = 100 } = req.query;
  
  let query = `SELECT al.*, u.username, u.first_name, u.last_name 
               FROM audit_log al 
               LEFT JOIN users u ON al.user_id = u.id 
               WHERE 1=1`;
  const params = [];
  
  if (user_id) {
    query += ' AND al.user_id = ?';
    params.push(user_id);
  }
  
  if (entity_type) {
    query += ' AND al.entity_type = ?';
    params.push(entity_type);
  }
  
  if (start_date) {
    query += ' AND al.created_at >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    query += ' AND al.created_at <= ?';
    params.push(end_date);
  }
  
  query += ' ORDER BY al.created_at DESC LIMIT ?';
  params.push(parseInt(limit));
  
  db.all(query, params, (err, activities) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Parse JSON fields
    const formattedActivities = activities.map(activity => ({
      ...activity,
      old_values: activity.old_values ? JSON.parse(activity.old_values) : null,
      new_values: activity.new_values ? JSON.parse(activity.new_values) : null
    }));
    
    res.json(formattedActivities);
  });
});

// User Performance Analytics
app.get('/api/analytics/user-performance', authenticateToken, requireAdmin, (req, res) => {
  const { user_id, start_date, end_date } = req.query;
  
  let userFilter = '';
  let dateFilter = '';
  const params = [];
  
  if (user_id) {
    userFilter = 'AND owner_id = ?';
    params.push(user_id);
  }
  
  if (start_date && end_date) {
    dateFilter = 'AND created_at BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }
  
  // Get user performance metrics
  const queries = {
    orders: `SELECT owner_id, COUNT(*) as count, AVG(total_amount) as avg_amount, SUM(total_amount) as total_amount
             FROM orders WHERE 1=1 ${userFilter} ${dateFilter} GROUP BY owner_id`,
    contacts: `SELECT owner_id, COUNT(*) as count FROM contacts WHERE 1=1 ${userFilter} ${dateFilter} GROUP BY owner_id`,
    companies: `SELECT owner_id, COUNT(*) as count FROM companies WHERE 1=1 ${userFilter} ${dateFilter} GROUP BY owner_id`,
    approvals: `SELECT owner_id, approval_status, COUNT(*) as count 
                FROM orders WHERE 1=1 ${userFilter} ${dateFilter} GROUP BY owner_id, approval_status`
  };
  
  Promise.all([
    new Promise((resolve, reject) => {
      db.all(queries.orders, params, (err, results) => err ? reject(err) : resolve(results));
    }),
    new Promise((resolve, reject) => {
      db.all(queries.contacts, params, (err, results) => err ? reject(err) : resolve(results));
    }),
    new Promise((resolve, reject) => {
      db.all(queries.companies, params, (err, results) => err ? reject(err) : resolve(results));
    }),
    new Promise((resolve, reject) => {
      db.all(queries.approvals, params, (err, results) => err ? reject(err) : resolve(results));
    })
  ]).then(([orders, contacts, companies, approvals]) => {
    res.json({
      orders: orders || [],
      contacts: contacts || [],
      companies: companies || [],
      approvals: approvals || []
    });
  }).catch(err => {
    res.status(500).json({ error: 'Database error' });
  });
});

// Session Tracking
const activeSessions = new Map();

// Middleware to track user sessions
const trackSession = (req, res, next) => {
  if (req.user) {
    const sessionKey = `${req.user.id}-${req.ip}`;
    activeSessions.set(sessionKey, {
      user_id: req.user.id,
      username: req.user.username,
      ip: req.ip,
      user_agent: req.get('User-Agent'),
      last_activity: new Date(),
      actions_count: (activeSessions.get(sessionKey)?.actions_count || 0) + 1
    });
  }
  next();
};

// Get active sessions (Admin only)
app.get('/api/sessions', authenticateToken, requireAdmin, (req, res) => {
  const sessions = Array.from(activeSessions.values()).map(session => ({
    ...session,
    duration: Date.now() - session.last_activity.getTime()
  }));
  
  res.json(sessions);
});

// Unified approvals endpoint (Admin only)
app.get('/api/approvals', authenticateToken, requireAdmin, (req, res) => {
  const { status = 'submitted' } = req.query;
  
  const queries = [
    // Orders
    `SELECT 'order' as type, o.id, o.order_number as name, o.description, o.total_amount as value, 
     o.approval_status, o.created_at, o.owner_id,
     u.first_name as owner_first_name, u.last_name as owner_last_name
     FROM orders o
     LEFT JOIN users u ON o.owner_id = u.id
     WHERE o.approval_status = ?`,
    
    // Companies  
    `SELECT 'company' as type, c.id, c.name, c.industry as description, NULL as value,
     c.approval_status, c.created_at, c.owner_id,
     u.first_name as owner_first_name, u.last_name as owner_last_name
     FROM companies c
     LEFT JOIN users u ON c.owner_id = u.id
     WHERE c.approval_status = ?`,
    
    // Contacts
    `SELECT 'contact' as type, c.id, (c.first_name || ' ' || c.last_name) as name, c.title as description, NULL as value,
     c.approval_status, c.created_at, c.owner_id,
     u.first_name as owner_first_name, u.last_name as owner_last_name
     FROM contacts c
     LEFT JOIN users u ON c.owner_id = u.id
     WHERE c.approval_status = ?`
  ];
  
  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.all(query, [status], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    })
  )).then(([orders, companies, contacts]) => {
    // Combine all results and sort by created_at
    const allApprovals = [...orders, ...companies, ...contacts]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json(allApprovals);
  }).catch(err => {
    res.status(500).json({ error: 'Database error' });
  });
});

// Authentication routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  db.get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    logAudit(user.id, 'login', 'user', user.id, null, null, req);
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Companies routes
app.get('/api/companies', authenticateToken, trackSession, (req, res) => {
  const { search, status, approval_status } = req.query;
  let query = `SELECT c.*, u.first_name as owner_first_name, u.last_name as owner_last_name,
               approver.first_name as approver_first_name, approver.last_name as approver_last_name
               FROM companies c
               LEFT JOIN users u ON c.owner_id = u.id
               LEFT JOIN users approver ON c.approved_by = approver.id
               WHERE 1=1`;
  const params = [];
  
  // Sales users can only see their own companies unless approved
  if (req.user.role === 'sales') {
    query += ' AND (c.owner_id = ? OR c.approval_status = "approved")';
    params.push(req.user.id);
  }
  
  if (search) {
    query += ' AND (c.name LIKE ? OR c.domain LIKE ? OR c.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  if (status) {
    query += ' AND c.status = ?';
    params.push(status);
  }
  
  if (approval_status) {
    query += ' AND c.approval_status = ?';
    params.push(approval_status);
  }
  
  query += ' ORDER BY c.created_at DESC';
  
  db.all(query, params, (err, companies) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(companies);
  });
});

app.post('/api/companies', authenticateToken, trackSession, (req, res) => {
  const { name, contact_name, address, city, state, zip, country, phone, email, website, industry } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Company name is required' });
  }
  
  if (!contact_name) {
    return res.status(400).json({ error: 'Contact name is required' });
  }
  
  // Set approval status based on user role
  const approvalStatus = req.user.role === 'admin' ? 'approved' : 'pending';
  const approvedBy = req.user.role === 'admin' ? req.user.id : null;
  const approvedAt = req.user.role === 'admin' ? new Date().toISOString() : null;
  
  db.run(`INSERT INTO companies (name, domain, address, city, state, zip, country, phone, email, website, industry, owner_id, approval_status, approved_by, approved_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
         [name, null, address, city, state, zip, country, phone, email, website, industry, req.user.id, approvalStatus, approvedBy, approvedAt],
         function(err) {
           if (err) {
             console.error('Error creating company:', err);
             return res.status(500).json({ error: 'Database error creating company: ' + err.message });
           }
           
           const companyId = this.lastID;
           const companyData = { name, contact_name, address, city, state, zip, country, phone, email, website, industry, approval_status: approvalStatus };
           logAudit(req.user.id, 'create', 'company', companyId, null, companyData, req);
           
           // Parse contact name (assume "First Last" format)
           const nameParts = contact_name.trim().split(' ');
           const firstName = nameParts[0] || contact_name;
           const lastName = nameParts.slice(1).join(' ') || '';
           
           // Create associated contact
           db.run(`INSERT INTO contacts (first_name, last_name, email, phone, company_id, owner_id, status, approval_status, approved_by, approved_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [firstName, lastName, email || null, phone || null, companyId, req.user.id, 'active', approvalStatus, approvedBy, approvedAt],
                  function(contactErr) {
                    if (contactErr) {
                      console.error('Error creating contact:', contactErr);
                      // Don't fail the company creation if contact creation fails
                    } else {
                      logAudit(req.user.id, 'create', 'contact', this.lastID, null, 
                               { first_name: firstName, last_name: lastName, email, phone, company_id: companyId, auto_created: true }, req);
                    }
                  });
           
           // If sales user, notify admins for approval
           if (req.user.role === 'sales') {
             db.all('SELECT id FROM users WHERE role = "admin"', [], (err, admins) => {
               if (!err && admins.length > 0) {
                 admins.forEach(admin => {
                   db.run(`INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
                           VALUES (?, ?, ?, ?, ?, ?)`,
                          [admin.id, 'approval_request', 'Company Approval Required', 
                           `Company "${name}" with contact "${contact_name}" has been created and requires approval by ${req.user.first_name} ${req.user.last_name}`,
                           'company', companyId]);
                 });
               }
             });
             
             // Emit real-time notification
             io.emit('company_submitted', { companyId, companyName: name, submittedBy: req.user });
           }
           
           res.json({ id: companyId, message: 'Company and contact created successfully' });
         });
});

// Submit company for approval
app.post('/api/companies/:id/submit', authenticateToken, trackSession, (req, res) => {
  const companyId = req.params.id;
  
  // Check if user owns the company
  db.get('SELECT * FROM companies WHERE id = ? AND owner_id = ?', [companyId, req.user.id], (err, company) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found or access denied' });
    }
    
    if (company.approval_status !== 'pending') {
      return res.status(400).json({ error: 'Company is not in pending status' });
    }
    
    db.run('UPDATE companies SET approval_status = "submitted" WHERE id = ?', [companyId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      logAudit(req.user.id, 'submit_for_approval', 'company', companyId, { approval_status: 'pending' }, { approval_status: 'submitted' }, req);
      
      // Notify admins
      db.all('SELECT id FROM users WHERE role = "admin"', [], (err, admins) => {
        if (!err && admins.length > 0) {
          admins.forEach(admin => {
            db.run(`INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
                    VALUES (?, ?, ?, ?, ?, ?)`,
                   [admin.id, 'approval_request', 'Company Approval Required', 
                    `Company "${company.name}" has been submitted for approval by ${req.user.first_name} ${req.user.last_name}`,
                    'company', companyId]);
          });
        }
      });
      
      // Emit real-time notification
      io.emit('company_submitted', { companyId, companyName: company.name, submittedBy: req.user });
      
      res.json({ message: 'Company submitted for approval successfully' });
    });
  });
});

// Update company
app.put('/api/companies/:id', authenticateToken, trackSession, (req, res) => {
  const companyId = req.params.id;
  const { name, contact_name, address, city, state, zip, country, phone, email, website, industry } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Company name is required' });
  }
  
  // Check if user owns the company or is admin
  let accessQuery = 'SELECT * FROM companies WHERE id = ?';
  let accessParams = [companyId];
  
  if (req.user.role !== 'admin') {
    accessQuery += ' AND owner_id = ?';
    accessParams.push(req.user.id);
  }
  
  db.get(accessQuery, accessParams, (err, company) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found or access denied' });
    }
    
    // Store old values for audit
    const oldValues = {
      name: company.name,
      address: company.address,
      city: company.city,
      state: company.state,
      zip: company.zip,
      country: company.country,
      phone: company.phone,
      email: company.email,
      website: company.website,
      industry: company.industry
    };
    
    db.run(`UPDATE companies SET name = ?, address = ?, city = ?, state = ?, zip = ?, country = ?, phone = ?, email = ?, website = ?, industry = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
           [name, address, city, state, zip, country, phone, email, website, industry, companyId],
           (err) => {
             if (err) {
               return res.status(500).json({ error: 'Database error' });
             }
             
             const newValues = { name, address, city, state, zip, country, phone, email, website, industry };
             logAudit(req.user.id, 'update', 'company', companyId, oldValues, newValues, req);
             
             // If contact_name is provided, try to update the associated contact
             if (contact_name) {
               // Find the contact associated with this company
               db.get('SELECT * FROM contacts WHERE company_id = ? ORDER BY created_at ASC LIMIT 1', [companyId], (err, contact) => {
                 if (!err && contact) {
                   const nameParts = contact_name.trim().split(' ');
                   const firstName = nameParts[0] || contact_name;
                   const lastName = nameParts.slice(1).join(' ') || '';
                   
                   db.run('UPDATE contacts SET first_name = ?, last_name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                          [firstName, lastName, email, phone, contact.id], (contactErr) => {
                     if (!contactErr) {
                       logAudit(req.user.id, 'update', 'contact', contact.id, 
                                { first_name: contact.first_name, last_name: contact.last_name, email: contact.email, phone: contact.phone },
                                { first_name: firstName, last_name: lastName, email, phone }, req);
                     }
                   });
                 }
               });
             }
             
             res.json({ message: 'Company updated successfully' });
           });
  });
});

// Delete company
app.delete('/api/companies/:id', authenticateToken, trackSession, (req, res) => {
  const companyId = req.params.id;
  
  // Check if user owns the company or is admin
  let accessQuery = 'SELECT * FROM companies WHERE id = ?';
  let accessParams = [companyId];
  
  if (req.user.role !== 'admin') {
    accessQuery += ' AND owner_id = ?';
    accessParams.push(req.user.id);
  }
  
  db.get(accessQuery, accessParams, (err, company) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found or access denied' });
    }
    
    // Check if company has orders
    db.get('SELECT COUNT(*) as count FROM orders WHERE company_id = ?', [companyId], (err, orderCount) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (orderCount.count > 0) {
        return res.status(400).json({ error: 'Cannot delete company with existing orders' });
      }
      
      // Delete associated contacts first
      db.run('DELETE FROM contacts WHERE company_id = ?', [companyId], (err) => {
        if (err) {
          console.error('Error deleting associated contacts:', err);
        }
        
        // Delete the company
        db.run('DELETE FROM companies WHERE id = ?', [companyId], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          logAudit(req.user.id, 'delete', 'company', companyId, { name: company.name }, null, req);
          
          res.json({ message: 'Company and associated contacts deleted successfully' });
        });
      });
    });
  });
});

// Approve/reject company (admin only)
app.post('/api/companies/:id/approve', authenticateToken, trackSession, requireAdmin, (req, res) => {
  const companyId = req.params.id;
  const { action, message } = req.body; // action: 'approve' or 'reject'
  
  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Valid action (approve/reject) is required' });
  }
  
  db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, company) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    if (!['pending', 'submitted'].includes(company.approval_status)) {
      return res.status(400).json({ error: 'Company is not pending approval' });
    }
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    db.run('UPDATE companies SET approval_status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?', 
           [newStatus, req.user.id, companyId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      logAudit(req.user.id, action + '_company', 'company', companyId, 
               { approval_status: company.approval_status }, 
               { approval_status: newStatus, approved_by: req.user.id }, req);
      
      // Notify company owner
      db.run(`INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
              VALUES (?, ?, ?, ?, ?, ?)`,
             [company.owner_id, 'company_' + action + 'd', `Company ${action.charAt(0).toUpperCase() + action.slice(1)}d`, 
              `Your company "${company.name}" has been ${action}d${message ? ': ' + message : ''}`,
              'company', companyId]);
      
      // Emit real-time notification
      io.emit('company_' + action + 'd', { companyId, companyName: company.name, approvedBy: req.user, message });
      
      res.json({ message: `Company ${action}d successfully` });
    });
  });
});

// Contacts routes
app.get('/api/contacts', authenticateToken, trackSession, (req, res) => {
  const { search, status, company_id, approval_status } = req.query;
  let query = `SELECT c.*, comp.name as company_name,
               u.first_name as owner_first_name, u.last_name as owner_last_name,
               approver.first_name as approver_first_name, approver.last_name as approver_last_name
               FROM contacts c 
               LEFT JOIN companies comp ON c.company_id = comp.id 
               LEFT JOIN users u ON c.owner_id = u.id
               LEFT JOIN users approver ON c.approved_by = approver.id
               WHERE 1=1`;
  const params = [];
  
  // Sales users can only see their own contacts unless approved
  if (req.user.role === 'sales') {
    query += ' AND (c.owner_id = ? OR c.approval_status = "approved")';
    params.push(req.user.id);
  }
  
  if (search) {
    query += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  if (status) {
    query += ' AND c.status = ?';
    params.push(status);
  }
  
  if (company_id) {
    query += ' AND c.company_id = ?';
    params.push(company_id);
  }
  
  if (approval_status) {
    query += ' AND c.approval_status = ?';
    params.push(approval_status);
  }
  
  query += ' ORDER BY c.created_at DESC';
  
  db.all(query, params, (err, contacts) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(contacts);
  });
});

app.post('/api/contacts', authenticateToken, trackSession, (req, res) => {
  const { first_name, last_name, email, phone, title, company_id, status, source, notes } = req.body;
  
  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }
  
  // Set approval status based on user role
  const approvalStatus = req.user.role === 'admin' ? 'approved' : 'pending';
  const approvedBy = req.user.role === 'admin' ? req.user.id : null;
  const approvedAt = req.user.role === 'admin' ? new Date().toISOString() : null;
  
  db.run(`INSERT INTO contacts (first_name, last_name, email, phone, title, company_id, owner_id, status, source, notes, approval_status, approved_by, approved_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
         [first_name, last_name, email, phone, title, company_id, req.user.id, status || 'lead', source, notes, approvalStatus, approvedBy, approvedBy ? new Date().toISOString() : null],
         function(err) {
           if (err) {
             return res.status(500).json({ error: 'Database error' });
           }
           
           const contactData = { first_name, last_name, email, phone, title, company_id, status, source, notes, approval_status: approvalStatus };
           logAudit(req.user.id, 'create', 'contact', this.lastID, null, contactData, req);
           
           // If sales user, notify admins for approval
           if (req.user.role === 'sales') {
             db.all('SELECT id FROM users WHERE role = "admin"', [], (err, admins) => {
               if (!err && admins.length > 0) {
                 admins.forEach(admin => {
                   db.run(`INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
                           VALUES (?, ?, ?, ?, ?, ?)`,
                          [admin.id, 'approval_request', 'Contact Approval Required', 
                           `Contact "${first_name} ${last_name}" has been created and requires approval by ${req.user.first_name} ${req.user.last_name}`,
                           'contact', this.lastID]);
                 });
               }
             });
             
             // Emit real-time notification
             io.emit('contact_submitted', { contactId: this.lastID, contactName: `${first_name} ${last_name}`, submittedBy: req.user });
           }
           
           res.json({ id: this.lastID, message: 'Contact created successfully' });
         });
});

// Submit contact for approval
app.post('/api/contacts/:id/submit', authenticateToken, trackSession, (req, res) => {
  const contactId = req.params.id;
  
  // Check if user owns the contact
  db.get('SELECT * FROM contacts WHERE id = ? AND owner_id = ?', [contactId, req.user.id], (err, contact) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found or access denied' });
    }
    
    if (contact.approval_status !== 'pending') {
      return res.status(400).json({ error: 'Contact is not in pending status' });
    }
    
    db.run('UPDATE contacts SET approval_status = "submitted" WHERE id = ?', [contactId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      logAudit(req.user.id, 'submit_for_approval', 'contact', contactId, { approval_status: 'pending' }, { approval_status: 'submitted' }, req);
      
      // Notify admins
      db.all('SELECT id FROM users WHERE role = "admin"', [], (err, admins) => {
        if (!err && admins.length > 0) {
          admins.forEach(admin => {
            db.run(`INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
                    VALUES (?, ?, ?, ?, ?, ?)`,
                   [admin.id, 'approval_request', 'Contact Approval Required', 
                    `Contact "${contact.first_name} ${contact.last_name}" has been submitted for approval by ${req.user.first_name} ${req.user.last_name}`,
                    'contact', contactId]);
          });
        }
      });
      
      // Emit real-time notification
      io.emit('contact_submitted', { contactId, contactName: `${contact.first_name} ${contact.last_name}`, submittedBy: req.user });
      
      res.json({ message: 'Contact submitted for approval successfully' });
    });
  });
});

// Delete contact
app.delete('/api/contacts/:id', authenticateToken, trackSession, (req, res) => {
  const contactId = req.params.id;
  
  // Check if user owns the contact or is admin
  let accessQuery = 'SELECT * FROM contacts WHERE id = ?';
  let accessParams = [contactId];
  
  if (req.user.role !== 'admin') {
    accessQuery += ' AND owner_id = ?';
    accessParams.push(req.user.id);
  }
  
  db.get(accessQuery, accessParams, (err, contact) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found or access denied' });
    }
    
    // Check if contact has orders
    db.get('SELECT COUNT(*) as count FROM orders WHERE contact_id = ?', [contactId], (err, orderCount) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (orderCount.count > 0) {
        return res.status(400).json({ error: 'Cannot delete contact with existing orders' });
      }
      
      // Delete the contact
      db.run('DELETE FROM contacts WHERE id = ?', [contactId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        logAudit(req.user.id, 'delete', 'contact', contactId, { 
          first_name: contact.first_name, 
          last_name: contact.last_name, 
          email: contact.email 
        }, null, req);
        
        res.json({ message: 'Contact deleted successfully' });
      });
    });
  });
});

// Approve/reject contact (admin only)
app.post('/api/contacts/:id/approve', authenticateToken, trackSession, requireAdmin, (req, res) => {
  const contactId = req.params.id;
  const { action, message } = req.body; // action: 'approve' or 'reject'
  
  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Valid action (approve/reject) is required' });
  }
  
  db.get('SELECT * FROM contacts WHERE id = ?', [contactId], (err, contact) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    if (!['pending', 'submitted'].includes(contact.approval_status)) {
      return res.status(400).json({ error: 'Contact is not pending approval' });
    }
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    db.run('UPDATE contacts SET approval_status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?', 
           [newStatus, req.user.id, contactId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      logAudit(req.user.id, action + '_contact', 'contact', contactId, 
               { approval_status: contact.approval_status }, 
               { approval_status: newStatus, approved_by: req.user.id }, req);
      
      // Notify contact owner
      db.run(`INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
              VALUES (?, ?, ?, ?, ?, ?)`,
             [contact.owner_id, 'contact_' + action + 'd', `Contact ${action.charAt(0).toUpperCase() + action.slice(1)}d`, 
              `Your contact "${contact.first_name} ${contact.last_name}" has been ${action}d${message ? ': ' + message : ''}`,
              'contact', contactId]);
      
      // Emit real-time notification
      io.emit('contact_' + action + 'd', { contactId, contactName: `${contact.first_name} ${contact.last_name}`, approvedBy: req.user, message });
      
      res.json({ message: `Contact ${action}d successfully` });
    });
  });
});

// Orders routes
app.get('/api/orders', authenticateToken, trackSession, (req, res) => {
  const { status, approval_status, owner_id } = req.query;
  let query = `SELECT o.*, c.first_name, c.last_name, c.email, comp.name as company_name,
               u.first_name as owner_first_name, u.last_name as owner_last_name,
               approver.first_name as approver_first_name, approver.last_name as approver_last_name
               FROM orders o
               LEFT JOIN contacts c ON o.contact_id = c.id
               LEFT JOIN companies comp ON o.company_id = comp.id
               LEFT JOIN users u ON o.owner_id = u.id
               LEFT JOIN users approver ON o.approved_by = approver.id
               WHERE 1=1`;
  const params = [];
  
  // Sales users can only see their own orders unless approved
  if (req.user.role === 'sales') {
    query += ' AND (o.owner_id = ? OR o.approval_status = "approved")';
    params.push(req.user.id);
  }
  
  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }
  
  if (approval_status) {
    query += ' AND o.approval_status = ?';
    params.push(approval_status);
  }
  
  if (owner_id) {
    query += ' AND o.owner_id = ?';
    params.push(owner_id);
  }
  
  query += ' ORDER BY o.created_at DESC';
  
  db.all(query, params, (err, orders) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(orders);
  });
});

app.post('/api/orders', authenticateToken, trackSession, (req, res) => {
  const { company_id, contact_id, total_amount, currency, description, notes, priority, expected_delivery, items } = req.body;
  
  if (!company_id && !contact_id) {
    return res.status(400).json({ error: 'Company or contact is required' });
  }
  
  // Set approval status based on user role
  const approvalStatus = req.user.role === 'admin' ? 'approved' : 'pending';
  const approvedBy = req.user.role === 'admin' ? req.user.id : null;
  const approvedAt = req.user.role === 'admin' ? new Date().toISOString() : null;
  const orderStatus = req.user.role === 'admin' ? 'confirmed' : 'draft';
  
  // Generate order number
  const orderNumber = 'ORD-' + Date.now();
  
  db.run(`INSERT INTO orders (order_number, company_id, contact_id, owner_id, total_amount, currency, description, notes, priority, expected_delivery, approval_status, approved_by, approved_at, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
         [orderNumber, company_id, contact_id, req.user.id, total_amount, currency || 'USD', description, notes, priority || 'medium', expected_delivery, approvalStatus, approvedBy, approvedAt, orderStatus],
         function(err) {
           if (err) {
             return res.status(500).json({ error: 'Database error' });
           }
           
           const orderId = this.lastID;
           
           // Add order items if provided
           if (items && items.length > 0) {
             const itemPromises = items.map(item => {
               return new Promise((resolve, reject) => {
                 db.run(`INSERT INTO order_items (order_id, name, description, quantity, unit_price, total_price)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [orderId, item.name, item.description, item.quantity, item.unit_price, item.total_price],
                        (err) => {
                          if (err) reject(err);
                          else resolve();
                        });
               });
             });
             
             Promise.all(itemPromises).then(() => {
               const orderData = { orderNumber, company_id, contact_id, total_amount, description, items };
               logAudit(req.user.id, 'create', 'order', orderId, null, orderData, req);
               
               res.json({ id: orderId, order_number: orderNumber, message: 'Order created successfully' });
             }).catch(err => {
               res.status(500).json({ error: 'Error adding order items' });
             });
           } else {
             const orderData = { orderNumber, company_id, contact_id, total_amount, description };
             logAudit(req.user.id, 'create', 'order', orderId, null, orderData, req);
             
             res.json({ id: orderId, order_number: orderNumber, message: 'Order created successfully' });
           }
         });
});

// Submit order for approval
app.post('/api/orders/:id/submit', authenticateToken, trackSession, (req, res) => {
  const orderId = req.params.id;
  
  // Check if user owns the order
  db.get('SELECT * FROM orders WHERE id = ? AND owner_id = ?', [orderId, req.user.id], (err, order) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }
    
    if (order.approval_status !== 'pending') {
      return res.status(400).json({ error: 'Order is not in pending status' });
    }
    
    db.run('UPDATE orders SET approval_status = "submitted" WHERE id = ?', [orderId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      logAudit(req.user.id, 'submit_for_approval', 'order', orderId, { approval_status: 'pending' }, { approval_status: 'submitted' }, req);
      
      // Notify admins
      db.all('SELECT id FROM users WHERE role = "admin"', [], (err, admins) => {
        if (!err && admins.length > 0) {
          admins.forEach(admin => {
            db.run(`INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
                    VALUES (?, ?, ?, ?, ?, ?)`,
                   [admin.id, 'approval_request', 'Order Approval Required', 
                    `Order ${order.order_number} has been submitted for approval by ${req.user.first_name} ${req.user.last_name}`,
                    'order', orderId]);
          });
        }
      });
      
      // Emit real-time notification
      io.emit('order_submitted', { orderId, orderNumber: order.order_number, submittedBy: req.user });
      
      res.json({ message: 'Order submitted for approval successfully' });
    });
  });
});

// Approve/reject order (admin only)
app.post('/api/orders/:id/approve', authenticateToken, trackSession, requireAdmin, (req, res) => {
  const orderId = req.params.id;
  const { action, message } = req.body; // action: 'approve' or 'reject'
  
  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Valid action (approve/reject) is required' });
  }
  
  db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.approval_status !== 'submitted') {
      return res.status(400).json({ error: 'Order is not submitted for approval' });
    }
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const orderStatus = action === 'approve' ? 'confirmed' : 'draft';
    
    db.run('UPDATE orders SET approval_status = ?, status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?', 
           [newStatus, orderStatus, req.user.id, orderId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Add order update
      db.run(`INSERT INTO order_updates (order_id, user_id, status, message, customer_visible)
              VALUES (?, ?, ?, ?, ?)`,
             [orderId, req.user.id, newStatus, message || `Order ${action}d by admin`, action === 'approve' ? 1 : 0]);
      
      logAudit(req.user.id, action + '_order', 'order', orderId, 
               { approval_status: 'submitted' }, 
               { approval_status: newStatus, approved_by: req.user.id }, req);
      
      // Notify order owner
      db.run(`INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
              VALUES (?, ?, ?, ?, ?, ?)`,
             [order.owner_id, 'order_' + action + 'd', `Order ${action.charAt(0).toUpperCase() + action.slice(1)}d`, 
              `Your order ${order.order_number} has been ${action}d${message ? ': ' + message : ''}`,
              'order', orderId]);
      
      // Emit real-time notification
      io.emit('order_' + action + 'd', { orderId, orderNumber: order.order_number, approvedBy: req.user, message });
      
      res.json({ message: `Order ${action}d successfully` });
    });
  });
});

// Get documents
app.get('/api/documents', authenticateToken, (req, res) => {
  const { entity_type, entity_id } = req.query;
  let query = 'SELECT * FROM documents WHERE 1=1';
  const params = [];
  
  if (entity_type) {
    query += ' AND entity_type = ?';
    params.push(entity_type);
  }
  
  if (entity_id) {
    query += ' AND entity_id = ?';
    params.push(entity_id);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, documents) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(documents);
  });
});

// Document upload and OCR
app.post('/api/documents/upload', authenticateToken, upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const { entity_type, entity_id, document_type, customer_visible } = req.body;
  
  if (!entity_type || !entity_id) {
    return res.status(400).json({ error: 'Entity type and ID are required' });
  }
  
  try {
    let ocrText = '';
    
    // Perform OCR on images
    if (req.file.mimetype.startsWith('image/')) {
      const { data: { text } } = await Tesseract.recognize(req.file.path, 'eng');
      ocrText = text;
    }
    
    // Save document record
    db.run(`INSERT INTO documents (entity_type, entity_id, filename, original_filename, file_path, file_size, mime_type, ocr_text, document_type, customer_visible, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
           [entity_type, entity_id, req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype, ocrText, document_type, customer_visible || 0, req.user.id],
           function(err) {
             if (err) {
               return res.status(500).json({ error: 'Database error' });
             }
             
             logAudit(req.user.id, 'upload_document', entity_type, entity_id, null, { filename: req.file.originalname, document_type }, req);
             
             res.json({
               id: this.lastID,
               filename: req.file.filename,
               original_filename: req.file.originalname,
               ocr_text: ocrText,
               message: 'Document uploaded successfully'
             });
           });
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ error: 'Error processing document' });
  }
});

// Customer portal token generation
app.post('/api/portal/generate-token', authenticateToken, (req, res) => {
  const { order_id, email, expires_in_days, max_views } = req.body;
  
  if (!order_id || !email) {
    return res.status(400).json({ error: 'Order ID and email are required' });
  }
  
  // Check if user has access to the order
  let accessQuery = 'SELECT * FROM orders WHERE id = ?';
  let accessParams = [order_id];
  
  if (req.user.role === 'sales') {
    accessQuery += ' AND owner_id = ?';
    accessParams.push(req.user.id);
  }
  
  db.get(accessQuery, accessParams, (err, order) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }
    
    // Only generate tokens for approved orders
    if (order.approval_status !== 'approved') {
      return res.status(400).json({ error: 'Cannot generate portal access for unapproved orders' });
    }
    
    const token = uuidv4();
    const expiresAt = moment().add(expires_in_days || 30, 'days').format('YYYY-MM-DD HH:mm:ss');
    
    db.run(`INSERT INTO portal_tokens (token, order_id, email, expires_at, max_views)
            VALUES (?, ?, ?, ?, ?)`,
           [token, order_id, email, expiresAt, max_views || -1],
           function(err) {
             if (err) {
               return res.status(500).json({ error: 'Database error' });
             }
             
             logAudit(req.user.id, 'generate_portal_token', 'order', order_id, null, { email, expires_at: expiresAt }, req);
             
             const portalUrl = `${req.protocol}://${req.get('host')}/portal/${token}`;
             
             res.json({
               token,
               portal_url: portalUrl,
               expires_at: expiresAt,
               message: 'Portal token generated successfully'
             });
           });
  });
});

// Customer portal access
app.get('/portal/:token', (req, res) => {
  const token = req.params.token;
  
  db.get(`SELECT pt.*, o.order_number, o.status, o.description, o.total_amount, o.currency,
          c.first_name, c.last_name, c.email, comp.name as company_name
          FROM portal_tokens pt
          LEFT JOIN orders o ON pt.order_id = o.id
          LEFT JOIN contacts c ON o.contact_id = c.id
          LEFT JOIN companies comp ON o.company_id = comp.id
          WHERE pt.token = ? AND pt.is_revoked = 0 AND pt.expires_at > datetime('now')`,
         [token], (err, tokenData) => {
    if (err) {
      return res.status(500).send('Database error');
    }
    
    if (!tokenData) {
      return res.status(404).send('Invalid or expired link');
    }
    
    // Check view limits
    if (tokenData.max_views > 0 && tokenData.views >= tokenData.max_views) {
      return res.status(403).send('View limit exceeded');
    }
    
    // Update view count and last accessed
    db.run('UPDATE portal_tokens SET views = views + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = ?', [tokenData.id]);
    
    // Get order updates (customer visible only)
    db.all(`SELECT ou.*, u.first_name, u.last_name 
            FROM order_updates ou 
            LEFT JOIN users u ON ou.user_id = u.id 
            WHERE ou.order_id = ? AND ou.customer_visible = 1 
            ORDER BY ou.created_at ASC`, [tokenData.order_id], (err, updates) => {
      if (err) {
        return res.status(500).send('Database error');
      }
      
      // Get shipments
      db.all('SELECT * FROM shipments WHERE order_id = ?', [tokenData.order_id], (err, shipments) => {
        if (err) {
          return res.status(500).send('Database error');
        }
        
        // Get customer-visible documents
        db.all('SELECT * FROM documents WHERE entity_type = "order" AND entity_id = ? AND customer_visible = 1', 
               [tokenData.order_id], (err, documents) => {
          if (err) {
            return res.status(500).send('Database error');
          }
          
          // Render customer portal page
          res.send(generateCustomerPortalHTML(tokenData, updates, shipments, documents));
        });
      });
    });
  });
});

// Generate customer portal HTML
function generateCustomerPortalHTML(orderData, updates, shipments, documents) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Tracking - ${orderData.order_number}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%);
            color: #FFFFFF;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .order-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .info-card {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .info-card h3 {
            color: #DC2626;
            margin-bottom: 15px;
            font-size: 1.1rem;
        }
        
        .info-card p {
            margin-bottom: 8px;
            line-height: 1.6;
        }
        
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-draft { background: #6B7280; }
        .status-confirmed { background: #059669; }
        .status-production { background: #D97706; }
        .status-testing { background: #7C3AED; }
        .status-shipped { background: #2563EB; }
        .status-delivered { background: #059669; }
        
        .timeline {
            margin: 40px 0;
        }
        
        .timeline h2 {
            margin-bottom: 30px;
            color: #DC2626;
            font-size: 1.8rem;
        }
        
        .timeline-item {
            display: flex;
            margin-bottom: 30px;
            position: relative;
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: 20px;
            top: 50px;
            width: 2px;
            height: calc(100% + 10px);
            background: rgba(220, 38, 38, 0.3);
        }
        
        .timeline-item:last-child::before {
            display: none;
        }
        
        .timeline-dot {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #DC2626;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 20px;
            flex-shrink: 0;
            box-shadow: 0 0 20px rgba(220, 38, 38, 0.3);
        }
        
        .timeline-content {
            flex: 1;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .timeline-content h4 {
            color: #DC2626;
            margin-bottom: 10px;
            font-size: 1.2rem;
        }
        
        .timeline-content p {
            line-height: 1.6;
            margin-bottom: 10px;
        }
        
        .timeline-date {
            font-size: 0.9rem;
            opacity: 0.7;
        }
        
        .shipment-info {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 15px;
            padding: 30px;
            margin: 40px 0;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .shipment-info h2 {
            color: #DC2626;
            margin-bottom: 20px;
            font-size: 1.8rem;
        }
        
        .shipment-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .shipment-item {
            text-align: center;
        }
        
        .shipment-item h4 {
            color: #DC2626;
            margin-bottom: 10px;
        }
        
        .documents {
            margin: 40px 0;
        }
        
        .documents h2 {
            color: #DC2626;
            margin-bottom: 20px;
            font-size: 1.8rem;
        }
        
        .document-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .document-card {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
            transition: transform 0.3s ease;
        }
        
        .document-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.12);
        }
        
        .document-card a {
            color: #DC2626;
            text-decoration: none;
            font-weight: 600;
        }
        
        .refresh-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #DC2626;
            color: white;
            border: none;
            border-radius: 50px;
            padding: 15px 25px;
            font-size: 1rem;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(220, 38, 38, 0.3);
            transition: all 0.3s ease;
        }
        
        .refresh-btn:hover {
            background: #B91C1C;
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(220, 38, 38, 0.4);
        }
        
        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 15px;
            }
            
            .header {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .content {
                padding: 20px;
            }
            
            .order-info {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Order Tracking</h1>
            <p>Order #${orderData.order_number}</p>
        </div>
        
        <div class="content">
            <div class="order-info">
                <div class="info-card">
                    <h3>Order Details</h3>
                    <p><strong>Order Number:</strong> ${orderData.order_number}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${orderData.status}">${orderData.status}</span></p>
                    <p><strong>Total Amount:</strong> ${orderData.currency} ${orderData.total_amount}</p>
                </div>
                
                <div class="info-card">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ${orderData.first_name} ${orderData.last_name}</p>
                    <p><strong>Email:</strong> ${orderData.email}</p>
                    <p><strong>Company:</strong> ${orderData.company_name || 'N/A'}</p>
                </div>
            </div>
            
            ${updates.length > 0 ? `
            <div class="timeline">
                <h2>Order Progress</h2>
                ${updates.map(update => `
                <div class="timeline-item">
                    <div class="timeline-dot">✓</div>
                    <div class="timeline-content">
                        <h4>${update.status}</h4>
                        <p>${update.message}</p>
                        <div class="timeline-date">${moment(update.created_at).format('MMMM Do YYYY, h:mm A')}</div>
                    </div>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${shipments.length > 0 ? `
            <div class="shipment-info">
                <h2>Shipping Information</h2>
                ${shipments.map(shipment => `
                <div class="shipment-grid">
                    <div class="shipment-item">
                        <h4>Carrier</h4>
                        <p>${shipment.carrier || 'TBD'}</p>
                    </div>
                    <div class="shipment-item">
                        <h4>Tracking Number</h4>
                        <p>${shipment.tracking_number || 'TBD'}</p>
                    </div>
                    <div class="shipment-item">
                        <h4>Vessel Name</h4>
                        <p>${shipment.vessel_name || 'TBD'}</p>
                    </div>
                    <div class="shipment-item">
                        <h4>Estimated Arrival</h4>
                        <p>${shipment.estimated_arrival ? moment(shipment.estimated_arrival).format('MMM Do YYYY') : 'TBD'}</p>
                    </div>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${documents.length > 0 ? `
            <div class="documents">
                <h2>Documents</h2>
                <div class="document-grid">
                    ${documents.map(doc => `
                    <div class="document-card">
                        <h4>${doc.document_type || 'Document'}</h4>
                        <p>${doc.original_filename}</p>
                        <a href="/api/documents/${doc.filename}" target="_blank">View Document</a>
                    </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    </div>
    
    <button class="refresh-btn" onclick="location.reload()">Refresh</button>
    
    <script>
        // Auto-refresh every 30 seconds
        setInterval(() => {
            location.reload();
        }, 30000);
    </script>
</body>
</html>
  `;
}

// Serve static files
app.use(express.static('public'));

// Start server - GoDaddy will assign the port
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database path: ${dbPath}`);
  console.log(`Uploads directory: ${uploadsDir}`);
  console.log(`Admin login: username=admin, password=change-me-demo-password`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    db.close((err) => {
      if (err) console.error('Error closing database:', err);
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    db.close((err) => {
      if (err) console.error('Error closing database:', err);
      process.exit(0);
    });
  });
});
