# Deployment Guide

This document explains how to deploy the Quilt Block Planner to GitHub Pages and your own server.

## Quick Reference

| Deployment Target | Command | Storage | Persistence |
|------------------|---------|---------|-------------|
| GitHub Pages | `./deploy-to-gh-pages.sh` (macOS/Linux) or `.bat` (Windows) | localStorage | Session only |
| Your Server | `npm start` in `backend/` | SQLite | Permanent |

---

## GitHub Pages Deployment

### Prerequisites

1. **Git configured** — Ensure `git` is installed and your repository is set up
2. **Remote configured** — Your repo has `origin` pointing to GitHub
3. **Main branch ready** — All changes committed to `main` branch

### One-Time Setup

1. **Enable GitHub Pages in Settings**

   a. Go to your repository on GitHub  
   b. Click **Settings** → **Pages**  
   c. Under "Build and deployment"  
   d. Choose **Deploy from a branch**  
   e. Select **gh-pages** branch and **root** folder  
   f. Click **Save**

### Deploy Your Changes

Every time you update `backend/public/` and want to publish to GitHub Pages:

#### On macOS or Linux

```bash
# Navigate to project root
cd ~/path/to/Quilt-Block-Planner

# Run deployment script
./deploy-to-gh-pages.sh
```

The script will:
1. Check you're in a git repository
2. Create `gh-pages` branch if needed
3. Copy all files from `backend/public/`
4. Commit changes
5. Push to GitHub
6. Return to your previous branch

#### On Windows

```cmd
# Navigate to project root
cd C:\path\to\Quilt-Block-Planner

# Run deployment script
deploy-to-gh-pages.bat
```

Or double-click `deploy-to-gh-pages.bat` in Windows Explorer.

#### Manual Deployment (Any Platform)

If the script doesn't work:

```bash
# 1. Switch to gh-pages branch
git checkout gh-pages

# 2. Remove old files (keep .git)
rm -rf node_modules backend server.js package.json package-lock.json
# (Windows) del server.js package.json package-lock.json && rmdir /s backend

# 3. Copy new files from backend/public
cp -r backend/public/* .
# (Windows) xcopy /E /I /Y backend\public\* .

# 4. Add changes
git add -A

# 5. Commit (if there are changes)
git commit -m "Deploy: Update from backend/public"

# 6. Push to GitHub
git push origin gh-pages

# 7. Return to main branch
git checkout main
```

### Verify Deployment

After deploying:

1. Visit your GitHub Pages URL:  
   `https://username.github.io/Quilt-Block-Planner/`

2. Check the deployment status:
   - Go to **Settings** → **Pages**
   - Look for green checkmark and "Your site is live"
   - It may take 1-2 minutes to update

3. **Console check** — Open DevTools (F12) → Console
   - Should see: `APIClient initialized in GitHub Pages (localStorage) mode`
   - If it says "Server mode", the app detected a local backend instead

### Troubleshooting GitHub Pages Deployment

**Issue: Script not found on Linux/Mac**

```bash
# Make script executable
chmod +x deploy-to-gh-pages.sh

# Then run
./deploy-to-gh-pages.sh
```

**Issue: Permission denied**

```bash
# Grant execute permission
chmod +x deploy-to-gh-pages.sh
./deploy-to-gh-pages.sh
```

**Issue: `git checkout gh-pages` fails**

The branch doesn't exist yet. Run the deployment script—it will create it.

**Issue: Files not appearing after deployment**

- Wait 1-2 minutes for GitHub Pages to rebuild
- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check **Settings** → **Pages** for any build errors

**Issue: App shows "Server mode" instead of "GitHub Pages mode"**

Check the URL bar:
- `localhost:3000` → Server mode (correct for local development)
- `username.github.io/...` → Should be GitHub Pages mode
- If not, clear browser cache and hard refresh

---

## Backend Server Deployment

For permanent, production-level storage with multiple users:

### Local Development

```bash
cd backend
npm install
npm start
```

Access at `http://localhost:3000`

### Deploy to Production Server

#### Prerequisites

- Node.js 14+ installed on your server
- Port 3000 available (or configure different port in `.env`)
- SQLite (built-in with Node.js)
- Git access to pull updates

#### Steps

1. **SSH into your server**

```bash
ssh user@your-server.com
```

2. **Clone the repository**

```bash
git clone https://github.com/pgriffin17/Quilt-Block-Planner.git
cd Quilt-Block-Planner
```

3. **Install dependencies**

```bash
cd backend
npm install
```

4. **Create `.env` file**

```bash
cat > .env << EOF
PORT=3000
NODE_ENV=production
EOF
```

5. **Run with process manager** (recommended: PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start the app
pm2 start server.js --name "quilt-block-planner"

# Auto-restart on server reboot
pm2 startup
pm2 save
```

Or use systemd:

```bash
sudo nano /etc/systemd/system/quilt-block-planner.service
```

```ini
[Unit]
Description=Quilt Block Planner
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/Quilt-Block-Planner/backend
ExecStart=/usr/bin/node server.js
Restart=always
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable quilt-block-planner
sudo systemctl start quilt-block-planner
```

6. **Set up reverse proxy** (Nginx example)

```nginx
server {
    listen 80;
    server_name quilt.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

7. **Enable HTTPS** (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d quilt.example.com
```

### Database Backups

Regular backups of `backend/db/blocks.sqlite`:

```bash
# Manual backup
cp backend/db/blocks.sqlite backup/blocks.sqlite.$(date +%Y%m%d)

# Or use cron for automated backups
0 2 * * * cp /path/to/backend/db/blocks.sqlite /backups/blocks.$(date +\%Y\%m\%d).sqlite
```

---

## Environment Detection

The app automatically detects which mode to run in:

```javascript
// From apiClient.js
const isGitHubPages = !window.location.hostname.includes('localhost') 
                      && !window.location.hostname.includes('127.0.0.1');

if (isGitHubPages) {
  // Use localStorage
} else {
  // Use Express backend API
}
```

**Summary:**
- `localhost:3000` → Server/API mode
- `username.github.io/...` → GitHub Pages/localStorage mode
- Your domain → Server/API mode

---

## Workflow Example

Typical development workflow:

```bash
# 1. Work on features locally
cd backend && npm start
# Visit http://localhost:3000

# 2. Test grid, save/load, undo, import/export
# (blocks saved to SQLite)

# 3. Commit changes
git add .
git commit -m "Add new feature"
git push origin main

# 4. When ready, deploy to GitHub Pages
./deploy-to-gh-pages.sh
# or deploy-to-gh-pages.bat

# 5. Verify at https://pgriffin17.github.io/Quilt-Block-Planner/
# (blocks saved to localStorage)

# 6. Later, deploy backend to production server
# SSH in and pull updates, restart with PM2
```

---

## FAQ

**Q: Do I need to deploy both GitHub Pages AND a backend server?**

A: No. Choose one:
- **GitHub Pages only** → Free, temporary, no persistence beyond session
- **Backend server only** → Permanent, requires hosting but full functionality

**Q: Can I run both simultaneously?**

A: Yes! The app auto-detects:
- GitHub Pages is live at your GH Pages URL (uses localStorage)
- Backend server is at your domain (uses API/SQLite)
- Users can choose which to use

**Q: How do I migrate blocks from GitHub Pages to my server?**

A: Currently, you'd need to export each block as SVG from GitHub Pages, then import them in the server version. Future version could add a migration tool.

**Q: What if I want to update GitHub Pages without updating the backend?**

A: Just run the deployment script. It only copies `backend/public/` files to `gh-pages` branch.

**Q: Can multiple people use the backend simultaneously?**

A: Yes, but you'll need user authentication first (not yet implemented, but planned).

---

## Support

If deployment fails, check:
1. Git is installed and configured
2. You're in the project root directory
3. The `backend/public/` folder exists and has files
4. You have an active internet connection
5. Your GitHub remote is set up correctly

---
