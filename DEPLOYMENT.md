# How to Deploy (Put it online for everyone)

This guide shows you how to make your Lost & Found site live for IIUI students.

## What you get

- **Website**: Everyone can see it
- **Free**: No cost
- **Auto-updates**: Push to GitHub, it updates automatically
- **Fast**: Takes about 5-10 minutes

## Option 1: Website only (GitHub Pages)

Perfect if you just want people to see the website (no database yet).

### Steps

1. **Push to GitHub** first:
```bash
git add .
git commit -m "Ready to deploy"
git push origin main
```

2. **Go to GitHub repo settings**
   - Click your repo
   - Click "Settings"
   - Click "Pages" on the left

3. **Set deployment source**
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/frontend`
   - Click "Save"

4. **Wait 2-3 minutes**
   - GitHub will process it
   - You'll see a green checkmark

5. **Your site is live at:**
   ```
   https://YOUR_USERNAME.github.io/lost-found-iiui
   ```

**Limitation**: This only shows the website. Users can't actually save data yet.

---

## Option 2: Full App (Website + Database)

Everything works - users can report items, search, chat, etc.

### A. Deploy Backend on Render.com

**1. Sign up on Render**
   - Go to render.com
   - Sign up (free)
   - Click "Connect GitHub"

**2. Create Web Service**
   - Click "New" → "Web Service"
   - Select your `lost-found-iiui` repo
   - Click "Connect"

**3. Set deployment settings**
   - **Name**: `lost-found-api` (or whatever)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node backend/server.js`
   - **Keep default for rest**

**4. Add secrets (important!)**
   - Scroll down to "Environment"
   - Add these from your `.env` file:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `SUPABASE_BUCKET`
     - `BREVO_API_KEY`
     - `SENDER_EMAIL`

**5. Deploy**
   - Click "Create Web Service"
   - Wait 5 minutes
   - When you see "Live", it's running!
   - You'll get a URL like: `https://lost-found-api.onrender.com`

### B. Update Frontend to Use Backend

Now tell the website where to find the server.

**1. Open** `frontend/js/api.js`

**2. Find this line:**
```javascript
const API_URL = 'http://localhost:3000';
```

**3. Change to your Render URL:**
```javascript
const API_URL = 'https://lost-found-api.onrender.com';
```

**4. Save and push:**
```bash
git add frontend/js/api.js
git commit -m "Update API URL to production"
git push
```

### C. Deploy Website

Same as Option 1:
- Go to Settings → Pages
- Deploy from `main` → `/frontend`

---

## It's now LIVE! 🎉

Users can visit:
```
https://YOUR_USERNAME.github.io/lost-found-iiui
```

And everything works!

---

## How updates work

Now whenever you make changes:

1. **Make changes** to files
2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "what changed"
   git push
   ```
3. **Automatic**: Both website and backend update in 2-5 minutes!

No extra steps needed.

---

## Free tier limits

- **GitHub Pages**: Unlimited
- **Render**: 750 hours/month (plenty for a school project)
- **Supabase**: 500MB storage free
- **Brevo Emails**: 300 emails/day free

You're covered!

---

## Troubleshooting

**"Can't connect to server"**
- Check your API URL in `api.js`
- Make sure Render deployment is showing "Live"

**"Emails not sending"**
- Check BREVO_API_KEY in Render settings
- Check Sender email is allowed

**"Images not uploading"**
- Check SUPABASE keys in Render

**"Stuck in deployment"**
- Click "Cancel Deployment" on Render
- Wait a minute
- Push to GitHub again

---

## Questions?

- Check deployment status on Render dashboard
- Check GitHub Actions for build errors
- Ask the team!
