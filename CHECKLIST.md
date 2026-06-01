# Pre-Launch Checklist

Before you tell everyone about the Lost & Found system, go through this checklist.

## Code Quality

- [ ] Remove any test data from database
- [ ] Check all buttons work (try clicking everything)
- [ ] Test on phone view (F12 → responsive design)
- [ ] Test on Chrome, Firefox, Safari if possible
- [ ] No console errors (F12 → Console)
- [ ] Links don't have typos
- [ ] Images load properly

## Security

- [ ] `.env` file is in `.gitignore` (not shared)
- [ ] No passwords in code
- [ ] No secret keys in comments
- [ ] Database backups enabled
- [ ] Admin accounts created
- [ ] Email sender verified
- [ ] HTTPS working (little lock icon)

## Functionality

- [ ] Can create account
- [ ] Can login/logout
- [ ] Can report item (with photo)
- [ ] Can search items
- [ ] Can claim item (needs proof)
- [ ] Can chat with another user
- [ ] Can receive email (check spam)
- [ ] Admin panel works
- [ ] Can delete own items
- [ ] Notifications work

## Documentation

- [ ] README.md complete
- [ ] SETUP.md complete
- [ ] DEPLOYMENT.md complete
- [ ] FAQ.md complete
- [ ] CONTRIBUTING.md complete
- [ ] GitHub description set
- [ ] LICENSE chosen (if needed)

## Deployment

- [ ] Code pushed to GitHub
- [ ] GitHub Pages deployed
- [ ] Render backend deployed (if using)
- [ ] Environment variables set on Render
- [ ] API URL updated in `api.js`
- [ ] Domain working (GitHub.io or custom)
- [ ] Can access on phone
- [ ] Emails work in production

## Testing on Production

- [ ] Create test account
- [ ] Report test item
- [ ] Search for it
- [ ] Login as different user
- [ ] Claim test item
- [ ] Check both get notifications
- [ ] Chat works
- [ ] Delete test item
- [ ] Logout works

## Communication

- [ ] Tell team it's live
- [ ] Share link with IIUI community
- [ ] Post on IIUI groups
- [ ] Add to IIUI website if possible
- [ ] Create help email (support@...)
- [ ] Set up feedback form (optional)

## Post-Launch

- [ ] Monitor for errors (check Render logs)
- [ ] Monitor for new users
- [ ] Respond to feedback
- [ ] Fix bugs as reported
- [ ] Celebrate! 🎉

---

## Common things people forget

❌ Setting `.env` variables on Render
❌ Updating API URL in production
❌ Clearing old test data
❌ Testing on phones
❌ Checking console for errors
❌ Telling people it's live
❌ Having admin account ready

---

## Launch Day Steps

1. **Morning**: Run through checklist
2. **Mid-day**: Deploy to GitHub Pages
3. **Afternoon**: Deploy backend to Render
4. **Evening**: Test everything works
5. **Night**: Tell people about it!

---

**Good luck! 🚀**
