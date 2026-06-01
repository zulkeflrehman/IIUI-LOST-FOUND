# FAQ & Troubleshooting

Got a problem? Probably someone else had it too. Here are answers.

## General Questions

**Q: Is this only for IIUI?**
A: Yes, it's built specifically for IIUI students and staff.

**Q: Do I need to pay for anything?**
A: No, it's completely free to use and deploy.

**Q: Will my data be safe?**
A: Yes, passwords are encrypted, emails are verified, and we only store what's necessary.

**Q: Can I use this for another university?**
A: Sure! Change the text and make it your own.

---

## Running Locally

**Q: "npm: command not found"**
A: You need to install Node.js from nodejs.org

**Q: "Port 3000 already in use"**
A: Something else is using that port. Either:
- Close the other program
- Change port in `backend/server.js` from 3000 to 3001
- Restart your computer

**Q: "Cannot find module"**
A: Run `npm install` to get missing libraries

**Q: "ENOENT: no such file or directory, open '.env'"**
A: Create the `.env` file - copy from SETUP.md

**Q: The site loads but nothing works**
A: Check browser console (F12) for errors. Screenshot it and ask for help.

**Q: Images won't upload**
A: Check these in `.env`:
- Is `SUPABASE_URL` correct?
- Is `SUPABASE_SERVICE_ROLE_KEY` correct?
- Does the bucket `uploads` exist in Supabase?

---

## Deployment Issues

**Q: GitHub Pages shows 404**
A: Make sure:
- You deployed from `/frontend` folder
- Wait 5 minutes after enabling
- Refresh browser (hard refresh: Ctrl+Shift+R)

**Q: Website loads but can't save items**
A: You need to deploy backend too. See DEPLOYMENT.md

**Q: "Can't connect to server" error**
A: Check that:
- Render backend is showing "Live"
- You updated the API URL in `frontend/js/api.js`
- The URL doesn't have `/` at the end

**Q: Emails aren't sending**
A: Check:
- `BREVO_API_KEY` is added to Render environment
- `SENDER_EMAIL` matches your Brevo account
- Check spam folder
- Only works when deployed, not locally

**Q: Database is empty**
A: First user signup creates tables. Report an item to test.

---

## Users Reporting Issues

**Q: "Can't create account"**
A: Possible causes:
- Email already used
- Invalid email
- Password too short
- Check the error message

**Q: "Can't find my item"**
A: Try:
- Different search words
- Check all filters are reset
- Your item might not be reported yet

**Q: "Other person won't respond"**
A: 
- They might be busy
- Try sending a message in chat
- Wait 24 hours
- Ask admin if needed

**Q: "Photo won't upload"**
A: File must be:
- JPEG, PNG, or WEBP
- Smaller than 5MB
- Try resizing it first

---

## Security Issues

**Q: Someone is being harassed**
A: Admin can:
- Delete messages
- Ban user
- Report to university

**Q: I think there's a bug**
A: Report it on GitHub issues with:
- What you tried
- What happened
- Your browser/device
- Screenshot if possible

**Q: How is data encrypted?**
A: 
- Passwords: bcrypt (special one-way encryption)
- Data: Stored on Supabase (encrypted at rest)
- Connection: HTTPS (encrypted in transit)

---

## Database Issues

**Q: Database file is huge**
A: Normal if many items and photos. Can clean old items if needed.

**Q: Database corrupted**
A: Last resort: Delete `database.db`, it'll rebuild on restart

**Q: Can I backup data?**
A: Yes, Supabase has backups. Check their dashboard.

---

## Performance Issues

**Q: Site is slow**
A: Check:
- Internet speed
- Browser tabs open (close some)
- Try different browser
- Check Render dashboard (might be sleeping)

**Q: Lots of photos makes it slow**
A: Can:
- Resize photos before uploading
- Add image compression
- Use CDN (Supabase does this)

---

## Team Questions

**Q: Who can access the admin panel?**
A: Only users marked as "admin" in database

**Q: How do we moderate content?**
A: Admins can:
- View all items
- Delete inappropriate ones
- Block users if needed
- See statistics

**Q: Can we see who reported what?**
A: Yes, admin panel shows reporter names and dates

---

## Still stuck?

1. **Check console**: F12 → Console tab → look for red errors
2. **Google it**: Your error message often has solutions online
3. **Ask on GitHub**: Open an issue with details
4. **Ask the team**: Slack or WhatsApp group

---

**Last updated:** June 1, 2024
