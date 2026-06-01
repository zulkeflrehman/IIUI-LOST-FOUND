# Setup Guide

This guide helps you get the project running on your computer.

## What you need first

- **Node.js** (download from nodejs.org)
- **Git** (download from git-scm.com)
- **A GitHub account** (free at github.com)
- **A text editor** (VS Code recommended)

## Steps to get running

### 1. Copy the project to your computer

Open terminal/command prompt and run:

```bash
git clone https://github.com/YOUR_USERNAME/lost-found-iiui.git
cd lost-found-iiui
```

### 2. Install the programs it needs

```bash
npm install
```

This downloads all the code libraries the project uses. Wait a few minutes.

### 3. Create the secrets file

Create a new file in the main folder called `.env` (just that name, no other extension).

Open it and add:

```
SUPABASE_URL=https://fcpiczpaubazgkcvwsfi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=get_this_from_team_or_supabase
SUPABASE_BUCKET=uploads
BREVO_API_KEY=get_this_from_brevo_website
SENDER_EMAIL=your_email@gmail.com
```

**Ask your team for the real keys!** These are secrets - don't share them anywhere.

### 4. Start the server

```bash
npm start
```

You should see:
```
Server running on port 3000
```

### 5. Open it in your browser

Go to: `http://localhost:3000`

You should see the Lost & Found homepage.

## How to make changes

1. Open any file with your text editor
2. Make changes
3. Save
4. The page should refresh automatically (or refresh manually)

## Common errors & fixes

**Error: "Cannot find module"**
- Fix: Run `npm install` again

**Error: "Port 3000 already in use"**
- Fix: Change port in `backend/server.js` to 3001, or close other apps using 3000

**Error: "ENOENT .env"**
- Fix: Create the `.env` file (see Step 3)

**Images not uploading**
- Fix: Check if Supabase keys are correct in `.env`

**Emails not sending**
- Fix: Check if BREVO_API_KEY is correct

## Structure of the code

```
backend/
├── server.js          ← Starts the server
├── db.js              ← Talks to database
└── db_supabase.js     ← Supabase settings

frontend/
├── index.html         ← Main page
├── js/
│   ├── app.js         ← Main app logic
│   ├── auth.js        ← Login/signup
│   └── items.js       ← Item functions
└── css/
    └── style.css      ← Colors, spacing, look
```

## Testing without real emails

When you run locally, emails don't actually send. You'll see them in the console.

When deployed, real emails work.

## Pushing changes to GitHub

```bash
git add .
git commit -m "describe what you changed"
git push
```

## Need help?

Ask in the team chat or open an issue on GitHub!
