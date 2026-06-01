# Contributing

Want to help improve Lost & Found @ IIUI? Great! Here's how.

## What can you help with?

- **Bug fixes** - Something broken? Fix it!
- **New features** - Cool ideas? Build them!
- **Design** - Make it look better
- **Documentation** - Help explain how to use it
- **Testing** - Try things and report issues

## How to contribute

### 1. Fork the repo
- Click "Fork" on GitHub
- This makes your own copy

### 2. Make your own branch
```bash
git checkout -b feature-name
```

Example: `git checkout -b fix-search-button`

### 3. Make changes
- Edit files
- Test on your computer
- Make sure it works

### 4. Commit your changes
```bash
git add .
git commit -m "Clear message about what you changed"
```

**Good message example:**
```
Fix login button not working on mobile
```

**Bad message example:**
```
Fixed stuff
```

### 5. Push to GitHub
```bash
git push origin feature-name
```

### 6. Make a Pull Request
- Go to GitHub
- Click "Compare & pull request"
- Explain what you changed and why
- Wait for feedback
- Make changes if asked
- Get merged! 🎉

---

## Rules (keep it simple)

- ✅ Test your changes before asking to merge
- ✅ Write clear commit messages
- ✅ One feature per pull request
- ✅ Don't remove files that work
- ❌ Don't commit secret keys (`.env` files)
- ❌ Don't break existing features
- ❌ Don't add random libraries without asking

---

## Setting up for development

See SETUP.md for how to run locally.

---

## Questions?

- Ask on GitHub issues
- Ask the main team
- No question is stupid!

---

## Code style

Keep it simple and clear:

✅ Good:
```javascript
// Get all lost items
const lostItems = items.filter(item => item.type === 'lost');
```

❌ Bad:
```javascript
const a = i.filter(x => x.t === 'l');
```

---

## Testing

Before submitting:
1. Test on your computer
2. Try different browsers (Chrome, Firefox)
3. Try on phone view (F12 in browser)
4. Test with and without images
5. Test login/logout

---

Thanks for helping! 🙌
