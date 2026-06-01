# Quick Start (5 Minutes)

Want to get it running RIGHT NOW? Follow this.

## In 5 steps

### 1. Get the code
```bash
git clone https://github.com/YOUR_USERNAME/lost-found-iiui.git
cd lost-found-iiui
```

### 2. Install stuff
```bash
npm install
```

### 3. Create `.env` file
Create file called `.env` with:
```
SUPABASE_URL=https://fcpiczpaubazgkcvwsfi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ask_your_team
SUPABASE_BUCKET=uploads
BREVO_API_KEY=ask_your_team
SENDER_EMAIL=your_email@gmail.com
```

### 4. Start
```bash
npm start
```

### 5. Open browser
```
http://localhost:3000
```

Done! 🎉

---

## Go live (5 more steps)

1. **Push code**: `git push origin main`
2. **Deploy website**: GitHub Settings → Pages → `/frontend` folder
3. **Deploy backend**: render.com → connect GitHub → add `.env` variables
4. **Update API URL**: Change `localhost:3000` to your Render URL in `frontend/js/api.js`
5. **Wait 5 minutes**: Everything auto-deploys

---

## Need more help?

- **Local setup issues?** → See SETUP.md
- **Deployment stuck?** → See DEPLOYMENT.md
- **Random errors?** → See FAQ.md
- **Want to contribute?** → See CONTRIBUTING.md

---

**That's it. Go build! 🚀**
