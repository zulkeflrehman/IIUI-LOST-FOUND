# Lost & Found @ IIUI

## What is this?

A simple website where IIUI students and staff can:
- Report lost items they're looking for
- Report found items they discovered
- Search through listings to find their stuff
- Chat with the person who found (or lost) their item
- Verify ownership before handing over items

Think of it like a bulletin board, but online and smart - the system tries to match lost items with found items automatically.

## How does it work?

1. **User reports an item** (lost or found)
2. **System matches it** with similar items automatically
3. **If there's a match**, both users get notified
4. **They chat and verify** the item belongs to them
5. **They meetup on campus** to exchange the item

That's it!

## What's inside this folder?

```
project/
├── frontend/           ← The website (what users see)
│   ├── index.html     ← Main page
│   ├── js/            ← Website logic
│   └── css/           ← Website design
├── backend/           ← The server (handles data)
│   ├── server.js      ← Main server file
│   ├── db.js          ← Database stuff
│   └── uploads/       ← Where images are stored
├── package.json       ← Project settings
└── .env              ← Secret keys (don't share!)
```

## How to run it locally (on your computer)

### Step 1: Get the files
```bash
git clone https://github.com/YOUR_USERNAME/lost-found-iiui.git
cd lost-found-iiui
```

### Step 2: Install what you need
```bash
npm install
```

### Step 3: Set up the secret file
Create a file called `.env` and add these (ask the team for real values):
```
SUPABASE_URL=your_url_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here
SUPABASE_BUCKET=uploads
BREVO_API_KEY=your_email_service_key
SENDER_EMAIL=your_email@gmail.com
```

### Step 4: Start it
```bash
npm start
```

Then open: `http://localhost:3000`

## How to share it with others (Deploy)

### Option 1: GitHub Pages (Website only - FREE)
1. Go to your GitHub repo settings
2. Find "Pages" 
3. Select `main` branch → `/frontend` folder
4. Wait 2 minutes, it's live!

### Option 2: Deploy everything (Backend too)

**Using Render (FREE but needs backend)**
1. Go to render.com
2. Sign up and connect your GitHub
3. Create new Web Service
4. Pick this repo
5. Set:
   - Build: `npm install`
   - Start: `node backend/server.js`
6. Add your `.env` secrets in Render dashboard
7. Deploy!

Then update the website to talk to your backend URL.

## The main parts explained

### Frontend (what users see)
- **Home page** - Report or search items
- **Report page** - Add lost/found items with photos
- **Search/Browse** - Look through all items
- **Dashboard** - See your items and messages
- **Chat** - Talk with other students

### Backend (the engine)
- Saves data to database
- Handles user login/signup
- Sends emails for verification
- Matches items automatically
- Stores photos

## Common questions

**Q: Where is the data stored?**
A: In a database on Supabase (free cloud storage)

**Q: Are passwords safe?**
A: Yes, they're encrypted with bcrypt (special code that makes passwords unreadable)

**Q: Can I test without sending real emails?**
A: Yes, emails are only sent when deployed. Local testing doesn't send them.

**Q: How do photos work?**
A: Users upload photos, they go to Supabase storage, we save the link in database

**Q: What if something breaks?**
A: Check the console for error messages, or ask the team

## Need help?

- **GitHub issue**: Open an issue on GitHub
- **Bug found?**: Describe what happened and how to repeat it
- **New feature idea?**: Create an issue labeled "feature request"

## Team Info

Made for IIUI students - find lost stuff, return found stuff, simple as that!

---

**Last updated:** June 1, 2024
