# GoDaddy Deployment Guide for Customer Tracking System

## Option 1: GoDaddy VPS/Dedicated Server (Recommended)

If you have a GoDaddy VPS or dedicated server with Node.js support:

### 1. Upload Files
- Upload all files to `/var/www/stealthlaser.com/customertracking/`
- Or via cPanel File Manager to `public_html/customertracking/`

### 2. Install Dependencies
```bash
cd /var/www/stealthlaser.com/customertracking/
npm install
```

### 3. Create Production Environment File
Create `.env` file:
```
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-production-key-change-this
```

### 4. Set up PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start server.js --name "customer-tracking"
pm2 startup
pm2 save
```

### 5. Configure Apache/Nginx Reverse Proxy
Create `.htaccess` in `public_html/customertracking/`:
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

## Option 2: GoDaddy Shared Hosting (Limited)

If you only have shared hosting without Node.js support:

### Convert to Static Version
1. Use frontend-only approach with external API service
2. Convert to PHP backend (requires rewriting server.js)
3. Use serverless functions (Vercel, Netlify)

## Option 3: Subdomain Setup (Easiest)

### 1. Create Subdomain
- In cPanel, create subdomain: `app.stealthlaser.com`
- Point to Node.js application folder

### 2. Update Application
- Change API_BASE in index.html to full URL
- Update CORS settings for domain

## Recommended Steps:

1. **Check your hosting type** - Log into GoDaddy and check if you have:
   - Shared hosting (basic)
   - VPS hosting (supports Node.js)
   - Dedicated server

2. **Domain Configuration**
   - For stealthlaser.com/customertracking, you'll need either:
     - Reverse proxy setup (VPS required)
     - Subdirectory routing in cPanel

3. **Database Setup**
   - Upload SQLite database file
   - Or migrate to MySQL if preferred

Would you like me to create specific deployment files based on your hosting type?
