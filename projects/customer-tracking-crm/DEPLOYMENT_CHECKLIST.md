# GoDaddy Deployment Checklist

Use this checklist to ensure successful deployment of your Customer Tracking System to GoDaddy.

## Pre-Deployment Checklist

### ✅ Files Ready
- [ ] `server.js` (modified for GoDaddy)
- [ ] `package.json` (dependencies list)
- [ ] `public/` folder (frontend files)
- [ ] `.env.example` (environment template)
- [ ] `GODADDY_DEPLOYMENT_GUIDE.md` (full instructions)

### ✅ GoDaddy Account Ready
- [ ] GoDaddy hosting account with Node.js support
- [ ] cPanel access credentials
- [ ] "Setup Node.js App" or "Application Manager" available in cPanel

## Deployment Steps

### Step 1: Upload Files ⬆️
- [ ] Log into cPanel → File Manager
- [ ] Navigate to home directory (`/home/yourusername/`)
- [ ] Create `customertracking` folder
- [ ] Upload `server.js`
- [ ] Upload `package.json`
- [ ] Upload `public/` folder (entire directory)
- [ ] Create empty `uploads/` folder
- [ ] Create empty `database.sqlite` file

### Step 2: Set Permissions 🔒
- [ ] Set `uploads/` folder permission to **755**
- [ ] Set `database.sqlite` file permission to **644**
- [ ] Set `server.js` file permission to **644**

### Step 3: Configure Node.js App ⚙️
- [ ] Open cPanel → Setup Node.js App
- [ ] Click "Create Application"
- [ ] Set Node.js version to latest available
- [ ] Set Application mode to **Production**
- [ ] Set Application root: `/home/yourusername/customertracking`
- [ ] Set Application startup file: **server.js**
- [ ] Choose your domain/subdomain

### Step 4: Environment Variables 🔐
Add these environment variables:
- [ ] `NODE_ENV` = `production`
- [ ] `JWT_SECRET` = `[generate-long-random-string]`
- [ ] `HOST` = `0.0.0.0`
- [ ] Leave `PORT` empty (GoDaddy assigns automatically)

**🚨 IMPORTANT:** Generate a secure JWT secret (32+ characters)!

### Step 5: Install Dependencies 📦
- [ ] Click "Run NPM Install" in Node.js App interface
- [ ] Wait for installation to complete
- [ ] Check for any error messages
- [ ] Note: Some packages may fail on shared hosting (this is normal)

### Step 6: Start Application 🚀
- [ ] Click "Start" or "Restart" in Application Manager
- [ ] Check application status shows as "Running"
- [ ] Wait 30-60 seconds for initialization

## Testing Checklist

### Step 7: Initial Testing 🧪
- [ ] Visit your application URL
- [ ] Page loads without errors
- [ ] See login page or application interface

### Step 8: Admin Login 👤
- [ ] Login with default credentials:
  - Username: `admin`
  - Password: `change-me-demo-password`
- [ ] Login successful
- [ ] Dashboard loads correctly

### Step 9: Basic Functionality ✅
- [ ] Can create new users (Admin panel)
- [ ] Can create companies
- [ ] Can create contacts
- [ ] Can create orders
- [ ] Basic navigation works

### Step 10: Security Setup 🛡️
- [ ] **IMMEDIATELY** change admin password
- [ ] Update JWT_SECRET if using default
- [ ] Test logout/login with new password
- [ ] Review user permissions

## Post-Deployment

### Backup Setup 💾
- [ ] Download `database.sqlite` as backup
- [ ] Document backup procedure
- [ ] Schedule regular backups

### Monitoring 📊
- [ ] Check Passenger logs for errors
- [ ] Monitor application performance
- [ ] Test file uploads (if working)
- [ ] Verify all features work as expected

### Documentation 📝
- [ ] Document your specific settings
- [ ] Note any features that don't work
- [ ] Save login credentials securely

## Troubleshooting Quick Reference

### If App Won't Start:
1. Check Passenger error logs
2. Verify file permissions
3. Ensure all files uploaded correctly
4. Try restarting the application

### If Database Errors:
1. Check `database.sqlite` permissions (should be 644)
2. Ensure uploads folder is writable (755)
3. Restart the application

### If Dependencies Fail:
1. Some packages won't work on shared hosting
2. App will still function with core features
3. Real-time features may not work

### If Login Issues:
1. Clear browser cache
2. Check JWT_SECRET is set
3. Verify database initialized properly

## Success Indicators ✨

Your deployment is successful when:
- ✅ Application URL loads without errors
- ✅ Admin login works
- ✅ Can create and view companies/contacts/orders
- ✅ No critical errors in logs
- ✅ Database operations work

## Need Help?

1. **Check Passenger Logs** in cPanel for detailed error messages
2. **Review GODADDY_DEPLOYMENT_GUIDE.md** for detailed instructions
3. **Contact GoDaddy Support** for hosting-specific issues
4. **Verify all checklist items** are completed

---

**Deployment Date:** ________________

**Domain/URL:** ____________________

**Admin Password Changed:** ❌/✅

**Backup Created:** ❌/✅

**Notes:**
_________________________________
_________________________________
_________________________________
