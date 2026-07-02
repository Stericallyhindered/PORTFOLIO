# Customer Tracking System

A comprehensive, full-featured customer tracking system with admin approval workflows, document scanning with OCR, real-time customer portals, and beautiful black/red/white themed UI.

## Features

### 🎨 **Stunning Visual Design**
- **Black/Red/White Theme**: Professional dark theme with red accents
- **Glass Morphism**: Modern frosted glass effects and smooth animations
- **Responsive Design**: Perfect on desktop, tablet, and mobile devices
- **Cards-First Interface**: Beautiful card-based UI for all data

### 🔐 **Authentication & Security**
- **Role-Based Access**: Admin vs Sales user permissions
- **JWT Authentication**: Secure token-based authentication
- **Audit Logging**: Complete trail of all user actions
- **Data Encryption**: Secure data storage and transmission

### 📋 **Complete CRM System**
- **Companies Management**: Track company information and relationships
- **Contacts Management**: Full contact database with lead tracking
- **Lead Pipeline**: Visual pipeline management for opportunities
- **Customer Relationships**: Link contacts, companies, and orders

### 📦 **Order Management**
- **Maker-Checker Workflow**: Sales creates → Admin approves
- **Order Lifecycle**: Draft → Pending → Approved → Production → Shipped → Delivered
- **Status Tracking**: Real-time status updates with timeline
- **Order Items**: Detailed line items and pricing

### 📱 **Mobile Document Scanning**
- **Camera Integration**: Scan documents directly from iPhone/Samsung devices
- **OCR Processing**: Convert scanned images to searchable text
- **Document Library**: Organized storage with full-text search
- **Auto-Enhancement**: Edge detection, de-skew, and contrast adjustment

### 🌐 **Customer Portal**
- **Magic Links**: Secure email links for customer access
- **Real-Time Updates**: Live order status without page refresh
- **Visual Timeline**: Beautiful progress indicators
- **Document Access**: View approved documents and photos
- **Mobile Optimized**: Perfect experience on all devices

### 🚚 **Shipping & Logistics**
- **Vessel Tracking**: Ocean freight with vessel names and voyage details
- **Carrier Integration**: Support for UPS, FedEx, DHL tracking
- **Live Updates**: Real-time shipping status and ETA updates
- **Milestone Tracking**: Departed, in-transit, customs, delivered

### 🔔 **Notifications**
- **Real-Time Alerts**: WebSocket-based live notifications
- **Email Integration**: Automated status update emails
- **Admin Notifications**: Approval requests and system alerts
- **Customer Updates**: Professional branded communications

### 📊 **Admin Dashboard**
- **Approval Queue**: Centralized pending approvals with one-click actions
- **Analytics**: Order metrics, sales performance, approval times
- **User Management**: Create/manage admin and sales accounts
- **System Monitoring**: Complete audit logs and activity tracking

### 👥 **Sales Agent Management**
- **User Creation**: Add new sales agents with role assignment
- **Account Control**: Activate/deactivate sales agent accounts
- **Password Management**: Reset passwords for sales agents
- **Permission Control**: Granular role-based access control
- **Activity Monitoring**: Track every action by sales agents
- **Performance Analytics**: Sales metrics, order statistics, approval rates
- **Session Tracking**: Monitor active users and login patterns
- **Audit Trail**: Complete history of all sales agent activities

## Quick Start

### Prerequisites
- Node.js 16+ installed
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone or download the project**
   ```bash
   cd customertracking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Demo Accounts

**Admin Account:**
- Username: `admin`
- Password: `change-me-demo-password`
- Access: Full system access, approvals, user management

**Sales Account:**
- Username: `sales`
- Password: `sales123`
- Access: Create orders, manage contacts, submit for approval

## Usage Guide

### For Sales Users

1. **Login** with sales credentials
2. **Add Companies** and **Contacts** to build your CRM database
3. **Create Orders** by selecting company/contact and adding details
4. **Submit for Approval** when order is ready
5. **Upload Documents** using camera or file upload
6. **Track Progress** through the dashboard

### For Admin Users

1. **Login** with admin credentials
2. **Review Approvals** in the dedicated approvals section
3. **Approve/Reject Orders** with optional messages
4. **Generate Portal Links** for approved orders
5. **Manage Users** and system settings
6. **Monitor Activity** through audit logs

#### Sales Agent Management
1. **User Management**: Create, edit, activate/deactivate sales agents
2. **Activity Tracking**: View detailed logs of all sales agent actions
3. **Performance Analytics**: Monitor sales metrics and approval statistics
4. **Session Monitoring**: Track active users and their current activities
5. **Audit Reviews**: Complete forensic trail of all employee actions
6. **Password Resets**: Manage sales agent account access

#### Detailed Admin Controls
- **Create Sales Agents**: Add new sales team members with automatic role assignment
- **Monitor All Actions**: Every click, edit, and submission by sales agents is logged
- **Performance Dashboards**: View orders created, total sales, approval rates per agent
- **Real-Time Activity**: See who's currently logged in and what they're working on
- **Audit Trail**: Complete before/after records of all data changes
- **Account Control**: Instantly activate/deactivate sales agent access
- **Password Management**: Reset passwords and manage account security

### For Customers

1. **Receive Email** with secure portal link
2. **View Order Status** in real-time
3. **Track Shipments** with live updates
4. **Access Documents** marked as customer-visible
5. **See Timeline** of order progress

## Technical Architecture

### Backend
- **Node.js + Express**: RESTful API server
- **SQLite Database**: Lightweight, file-based database
- **Socket.io**: Real-time WebSocket connections
- **JWT Authentication**: Secure token-based auth
- **Multer + Sharp**: File upload and image processing
- **Tesseract.js**: OCR text extraction

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **Modern CSS**: CSS Grid, Flexbox, CSS Variables
- **WebSocket Client**: Real-time updates
- **Camera API**: Mobile document scanning
- **Responsive Design**: Mobile-first approach

### Security
- **CORS Protection**: Cross-origin request security
- **Rate Limiting**: API request throttling
- **Helmet.js**: Security headers
- **Input Validation**: Server-side validation
- **Audit Logging**: Complete action tracking

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### User Management (Admin Only)
- `GET /api/users` - List all users with pagination
- `POST /api/users` - Create new user account
- `PUT /api/users/:id` - Update user information
- `POST /api/users/:id/toggle-status` - Activate/deactivate user
- `POST /api/users/:id/reset-password` - Reset user password

### Activity Tracking (Admin Only)
- `GET /api/activity` - Get user activity logs with filtering
- `GET /api/activity/users` - Get users for activity filtering

### Analytics (Admin Only)
- `GET /api/analytics/user-performance` - Get sales performance metrics
- `GET /api/analytics/sales-users` - Get sales users for analytics

### Companies
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company

### Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `POST /api/orders/:id/submit` - Submit for approval
- `POST /api/orders/:id/approve` - Approve/reject order

### Documents
- `POST /api/documents/upload` - Upload document with OCR
- `GET /api/documents/:filename` - Download document

### Customer Portal
- `POST /api/portal/generate-token` - Generate portal link
- `GET /portal/:token` - Customer portal access

## File Structure

```
customertracking/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── public/
│   └── index.html         # Frontend application
├── uploads/               # Document storage
├── database.sqlite        # SQLite database
└── README.md             # This file
```

## Database Schema

### Core Tables
- **users**: Admin and sales user accounts
- **companies**: Company information and relationships
- **contacts**: Contact database with lead tracking
- **orders**: Order management with approval workflow
- **order_items**: Line items for orders
- **order_updates**: Status timeline and history
- **shipments**: Shipping and logistics tracking
- **documents**: File storage with OCR text
- **portal_tokens**: Customer portal access tokens
- **audit_log**: Complete action audit trail
- **notifications**: System notifications

## Customization

### Branding
- Update CSS variables in `public/index.html` for colors
- Replace logo and company name in header
- Customize email templates in server code

### Workflow
- Modify order statuses in server.js
- Add custom fields to database tables
- Extend API endpoints for new features

### Integrations
- Add shipping carrier APIs
- Connect to external CRM systems
- Integrate with email/SMS services

## Production Deployment

### Environment Variables
```bash
PORT=3000
JWT_SECRET=your-production-secret
SMTP_HOST=your-smtp-server
SMTP_USER=your-email
SMTP_PASS=your-password
```

### Database
- For production, consider upgrading to PostgreSQL
- Set up regular backups
- Configure connection pooling

### Security
- Use HTTPS in production
- Set strong JWT secret
- Configure firewall rules
- Regular security updates

## Support

This is a complete, production-ready customer tracking system with all the features you requested:

✅ **Admin/Sales Login** with role-based access  
✅ **Beautiful Black/Red/White Theme** with glass effects  
✅ **Cards-First Interface** for all data management  
✅ **Maker-Checker Approval Workflow** with full audit  
✅ **Mobile Document Scanning** with OCR  
✅ **Real-Time Customer Portal** with magic links  
✅ **Complete CRM System** for leads and contacts  
✅ **Order Lifecycle Management** from creation to delivery  
✅ **Shipping Integration** with vessel tracking  
✅ **Audit Logging** of all employee actions  
✅ **Responsive Design** for all devices  

The system is ready to use immediately with demo data and can be customized for your specific needs.
