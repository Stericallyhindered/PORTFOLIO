# GoDaddy Node.js Deployment Guide

This guide will help you deploy your Customer Tracking System to GoDaddy hosting using cPanel's Application Manager.

## Prerequisites

- GoDaddy hosting account with Node.js support (VPS or shared hosting with Application Manager)
- Access to cPanel
- Your application files ready for deployment

## Step 1: Check Your GoDaddy Environment

1. **Log into your GoDaddy cPanel**
2. **Look for "Setup Node.js App" or "Application Manager"**
   - If you see this, you have Node.js support
   - If not, you may need to upgrade your hosting plan

## Step 2: Prepare Your Application Files

### Required Files for Deployment:
- `server.js` (main application file)
- `package.json` (dependencies)
- `public/` folder (frontend files)
- `.env.example` (environment configuration template)

### Files to Upload:
1. **server.js** - Your main application (already modified for GoDaddy)
2. **package.json** - Dependencies list
3. **public/** - Static files directory
4. **Create empty folders on server:**
   - `uploads/` - For file uploads
   - `database.sqlite` - SQLite database file

## Step 3: Upload Files to GoDaddy

### Method 1: Using cPanel File Manager
1. Open **cPanel → File Manager**
2. Navigate to your **home directory** (usually `/home/yourusername/`)
3. Create a new folder called `customertracking`
4. Upload these files to the folder:
   - `server.js`
   - `package.json`
   - `public/` (entire folder)
5. Create empty folders:
   - `uploads/`
6. Create empty file: `database.sqlite`

### Method 2: Using FTP
1. Connect to your GoDaddy server via FTP
2. Navigate to your home directory
3. Create `customertracking` folder
4. Upload all required files

## Step 4: Set File Permissions

Using cPanel File Manager, set these permissions:
- `uploads/` folder: **755**
- `database.sqlite` file: **644**
- `server.js` file: **644**

## Step 5: Configure Node.js Application in cPanel

1. **Open cPanel → Setup Node.js App**
2. **Click "Create Application"**
3. **Configure the application:**
   - **Node.js version:** Select latest available (preferably 16.x or 18.x)
   - **Application mode:** Production
   - **Application root:** `/home/yourusername/customertracking`
   - **Application URL:** Choose your domain or subdomain
   - **Application startup file:** `server.js`
   - **Passenger log file:** Leave default

## Step 6: Set Environment Variables

In the Node.js App settings, add these environment variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `your-long-random-secret-key-here` |
| `PORT` | *Leave empty (GoDaddy will assign)* |
| `HOST` | `0.0.0.0` |

**Important:** Generate a strong JWT secret (at least 32 characters) for production!

## Step 7: Install Dependencies

1. **In the Node.js App interface, click "Run NPM Install"**
2. **Wait for installation to complete**
3. **Check for any error messages**

### If NPM Install Fails:
Some packages might fail on shared hosting. The app will still work but with limited functionality:
- **sharp** (image processing) - may fail, images won't be resized
- **tesseract.js** (OCR) - may fail, OCR features won't work
- **socket.io** - may have limited functionality on shared hosting

## Step 8: Start Your Application

1. **Click "Start" or "Restart" in Application Manager**
2. **Check the application status**
3. **Visit your application URL**

## Step 9: Database Initialization

The application will automatically:
1. Create database tables on first run
2. Create a default admin user
3. Set up the file structure

**Default Admin Login:**
- Username: `admin`
- Password: `change-me-demo-password`

**⚠️ IMPORTANT:** Change the default admin password immediately after first login!

## Step 10: Domain Configuration

### For Subdomain (Recommended):
1. **Create subdomain in cPanel**
2. **Point it to your Node.js app in Application Manager**

### For Main Domain:
1. **Configure in Application Manager**
2. **May require `.htaccess` configuration**

## Troubleshooting

### Common Issues:

#### 1. **App Won't Start**
- Check Passenger log file for errors
- Verify file permissions
- Ensure all required files are uploaded

#### 2. **Database Errors**
```bash
# Set database file permissions
chmod 644 database.sqlite
chmod 755 uploads/
```

#### 3. **Module Not Found Errors**
- Run NPM Install again
- Check if the module is compatible with shared hosting

#### 4. **Port Already in Use**
- Let GoDaddy assign the port automatically
- Don't set PORT environment variable

#### 5. **WebSocket Issues**
- Real-time features may not work on shared hosting
- Consider disabling Socket.io features if needed

## Step 11: Testing Your Deployment

1. **Visit your application URL**
2. **Login with admin credentials**
3. **Test basic functionality:**
   - User login/logout
   - Creating companies
   - Creating contacts
   - Creating orders
   - File uploads (if working)

## Step 12: Post-Deployment Security

1. **Change default admin password**
2. **Update JWT_SECRET to a secure value**
3. **Review user permissions**
4. **Set up regular backups of database.sqlite**

## Backup Strategy

### Manual Backup:
1. Download `database.sqlite` via File Manager
2. Download `uploads/` folder
3. Store securely

### Automated Backup (if available):
- Use cPanel backup features
- Schedule regular database downloads

## Performance Optimization

### For Shared Hosting:
1. **Disable WebSocket features if causing issues**
2. **Limit file upload sizes**
3. **Use lightweight image processing alternatives**

### Monitoring:
- Check Passenger logs regularly
- Monitor disk space usage
- Watch for memory limit issues

## Updating Your Application

1. **Upload new files via File Manager or FTP**
2. **Restart the application in Application Manager**
3. **Check logs for any errors**

## Support and Resources

### GoDaddy Support:
- Contact GoDaddy for hosting-specific issues
- Check their Node.js documentation

### Application Support:
- Check server logs for application errors
- Verify all files are uploaded correctly
- Ensure environment variables are set

## Limitations on GoDaddy Shared Hosting

**What Works:**
- ✅ Basic web application
- ✅ User authentication
- ✅ Database operations
- ✅ File uploads (basic)
- ✅ REST API endpoints

**What May Not Work:**
- ❌ Real-time WebSocket connections
- ❌ Advanced image processing (sharp)
- ❌ OCR text extraction (tesseract.js)
- ❌ Background processes
- ❌ High memory operations

## Success Indicators

Your deployment is successful when:
- ✅ Application loads without errors
- ✅ Admin login works
- ✅ Database operations function
- ✅ File uploads work (basic)
- ✅ No critical errors in Passenger logs

---

**Need Help?** 
- Check the Passenger error logs in cPanel
- Verify all files are uploaded and permissions are correct
- Contact GoDaddy support for hosting-specific issues
