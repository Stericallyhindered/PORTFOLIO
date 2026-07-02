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

// Note: This is a simplified version for compatibility
// Full API routes are available in server.js
