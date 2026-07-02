# GoDaddy Shared Hosting Deployment Instructions

## ⚠️ IMPORTANT: Node.js Limitation
GoDaddy shared hosting doesn't support Node.js. You have 3 options:

### Option 1: Convert to PHP Backend (Recommended)
I can convert your Node.js server to PHP to work with shared hosting.

### Option 2: Use Node.js Hosting Service
- Upgrade to GoDaddy VPS ($6-15/month)
- Use Heroku, DigitalOcean, or Vercel for backend
- Keep frontend on GoDaddy

### Option 3: Static Frontend Only
- Upload just the frontend
- Connect to external database service

## If You Want PHP Conversion:
I can rewrite the server.js to PHP files that will work on shared hosting.

## File Upload Steps (After Backend Solution):

1. **Create folder structure in cPanel File Manager:**
   ```
   public_html/
   └── customertracking/
       ├── index.html
       ├── api/
       │   ├── auth.php
       │   ├── companies.php
       │   ├── contacts.php
       │   ├── orders.php
       │   └── documents.php
       ├── uploads/
       └── database.sqlite (or MySQL)
   ```

2. **Upload files:**
   - Upload `public/index.html` to `customertracking/`
   - Convert and upload server endpoints as PHP files
   - Upload `database.sqlite` or migrate to MySQL

3. **Test access:**
   - Visit `stealthlaser.com/customertracking`
   - Login with admin credentials

## Which option would you prefer?
