# Deploying CHEAPTOONER to GoDaddy

## Prerequisites

**You need GoDaddy hosting with Node.js support:**
- GoDaddy VPS (Virtual Private Server)
- GoDaddy Dedicated Server
- GoDaddy cPanel hosting with Node.js support (if available)

**Shared hosting (PHP-only) will NOT work** - you need Node.js runtime.

## Step 1: Build the Application

On your local machine:

```bash
npm run build
```

This creates a `dist` folder with production files.

## Step 2: Upload Files to GoDaddy

Upload these files/folders to your GoDaddy server:
- `dist/` folder (entire folder)
- `server.js`
- `package.json`
- `node_modules/` (or run `npm install` on server)

## Step 3: Install Dependencies on Server

SSH into your GoDaddy server and run:

```bash
npm install --production
```

## Step 4: Start the Server

### Option A: Using PM2 (Recommended - keeps server running)

```bash
npm install -g pm2
pm2 start server.js --name cheaptooner
pm2 save
pm2 startup
```

### Option B: Using Node directly

```bash
node server.js
```

### Option C: Using systemd (Linux VPS)

Create `/etc/systemd/system/cheaptooner.service`:

```ini
[Unit]
Description=CHEAPTOONER Node.js App
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable cheaptooner
sudo systemctl start cheaptooner
```

## Step 5: Configure Port

The server runs on port 3000 by default. You can change it:

1. Set environment variable: `PORT=8080 node server.js`
2. Or edit `server.js` and change `const PORT = process.env.PORT || 3000;`

**For GoDaddy cPanel:** You may need to use their Node.js app manager to set the port and start the app.

## Step 6: Access Your App

- If using default port: `http://yourdomain.com:3000`
- If using port 80: `http://yourdomain.com`
- You may need to configure firewall/port forwarding in GoDaddy control panel

## Troubleshooting

**Port already in use:**
- Change PORT in server.js or use environment variable
- Check what's running: `lsof -i :3000` (Linux) or `netstat -ano | findstr :3000` (Windows)

**Can't access from browser:**
- Check GoDaddy firewall settings
- Verify port is open
- Check server logs: `pm2 logs cheaptooner` or check console output

**API calls fail:**
- Verify server.js is running (not just static files)
- Check that `/api/chat` endpoint is proxying correctly
- Check server logs for errors

## Quick Deploy Script

Create `deploy.sh`:

```bash
#!/bin/bash
npm run build
# Upload dist/ and server.js to your server via FTP/SSH
# Then SSH into server and run:
# npm install --production
# pm2 restart cheaptooner
```





