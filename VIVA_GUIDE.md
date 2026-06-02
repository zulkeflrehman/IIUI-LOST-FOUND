# Lost & Found @ IIUI - Complete Viva Preparation Guide

## 📖 Table of Contents
1. [Project Overview](#project-overview)
2. [Problem Statement & Use Cases](#problem-statement--use-cases)
3. [System Architecture](#system-architecture)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Frontend Explanation](#frontend-explanation)
7. [Backend Explanation](#backend-explanation)
8. [Database Schema](#database-schema)
9. [Features Breakdown](#features-breakdown)
10. [Deployment Guide](#deployment-guide)
11. [Viva Q&A (15+ Questions)](#viva-qa)
12. [Code Walkthroughs](#code-walkthroughs)

---

## Project Overview

### What is Lost & Found @ IIUI?

**Simple Definition:** 
A web-based platform where IIUI students and staff can report lost items they're searching for and found items they've discovered. The system automatically matches similar items and helps students reconnect with their belongings.

### The Problem It Solves

**Real Problem at IIUI:**
- Students lose belongings on campus (mobile phones, wallets, ID cards, etc.)
- Finding lost items is difficult because there's no centralized system
- Multiple WhatsApp groups and Facebook posts make searching chaotic
- Manual searching takes time and effort
- No structured way to verify ownership

**How Lost & Found @ IIUI Solves It:**
- ✅ **One Place:** All lost/found items in one location
- ✅ **Smart Matching:** System automatically matches similar items
- ✅ **Secure Verification:** Students prove ownership with details & ID card photo
- ✅ **Direct Chat:** Private messages between students
- ✅ **Campus-Only:** Only IIUI students can access
- ✅ **Fast & Easy:** No scrolling through groups

### Who Uses It?

1. **Students** - Report lost items, claim found items, chat with finders
2. **Staff** - Same as students
3. **Administrators** - Monitor, moderate, and verify listings

### Why Build This?

- IIUI had no official lost & found system
- Manual processes were inefficient
- Need for technology-based solution on campus
- Project to demonstrate full-stack web development

---

## Problem Statement & Use Cases

### Real-World Use Cases

#### Use Case 1: Student Loses Phone
```
Student "Ahmed" loses his iPhone on campus.
1. Ahmed goes to website and clicks "Report Lost Item"
2. Fills details: "Black iPhone 13 Pro, lost in library, 2nd floor"
3. Uploads photo of similar phone
4. System checks database → Finds "Found Item: Black iPhone"
5. Notifies Ahmed: "Potential match found!"
6. Ahmed clicks the found item, reviews details
7. Clicks "Submit Claim" and provides proof: 
   - "My phone number is 03001234567, IMEI is 123456789"
   - Uploads his IIUI Student Card
8. Finder (Fatima) gets notification to approve/reject
9. Fatima approves (verification matches)
10. Ahmed & Fatima get private chat room
11. They coordinate meetup in library
12. Item returned ✅
```

#### Use Case 2: Student Finds Wallet
```
Student "Fatima" finds a red wallet in the cafeteria.
1. Fatima goes to website and clicks "Report Found Item"
2. Fills details: "Red leather wallet, found in student cafe"
3. Uploads wallet photo
4. System notifies users searching for similar items
5. Student "Ali" claimed wallet is his, submitted proof
6. Fatima reviews: "He knows exact amount of cash inside"
7. Fatima approves the claim
8. Ali & Fatima chat and arrange meeting
9. Item returned ✅
```

#### Use Case 3: Duplicate Item Detection
```
Student reports: "Lost Samsung Galaxy S20"
System automatically checks database and finds:
- 2 existing "Samsung Galaxy S20" reports
- Shows: "Similar items already reported"
- Asks: "Is your item one of these?"
- Prevents duplicate listings
```

### Key Benefits
- **Time-Saving:** Find items in minutes instead of days
- **Secure:** Verify ownership before handover
- **Efficient:** Automatic matching system
- **Campus-Wide:** Helps entire IIUI community
- **Transparent:** All processes documented

---

## System Architecture

### High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    LOST & FOUND SYSTEM                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  FRONTEND    │◄──────►│   BACKEND    │◄──────►│   DATABASE   │
│  (Website)   │        │  (Express)   │        │  (Supabase)  │
└──────────────┘        └──────────────┘        └──────────────┘
      ▲                       ▲                        ▲
      │                       │                        │
   HTML/CSS/JS            API Endpoints          Tables & Data
   Single Page App        • /api/items           • Users
   Pages:                 • /api/auth            • Items
   • Home                 • /api/claims          • Claims
   • Report               • /api/chat            • Chats
   • Dashboard            • /api/notify          • Notifications
   • Admin                                    
                                          ┌──────────────┐
                                          │   SERVICES   │
                                          └──────────────┘
                                               ▲
                                          Email / Storage
```

### Data Flow Example: Reporting an Item

```
1. User fills form and clicks "Submit"
   ↓
2. Frontend sends POST request to /api/items
   Body: { title, description, category, location, image, type }
   ↓
3. Backend validates data & checks for duplicates
   ↓
4. If no duplicates, saves to Supabase database
   Image uploaded to Supabase Storage
   ↓
5. System runs matching algorithm:
   - Finds similar items in database
   - Calculates match score
   - Creates notifications for users
   ↓
6. Response sent back to frontend
   ↓
7. User sees success message
   Item appears in feed
   Matched users get notifications
```

---

## Technology Stack

### Frontend (What Users See)
- **HTML** - Page structure & layout
- **CSS** - Styling & animations (modern dark theme)
- **JavaScript (Vanilla)** - Interactivity & logic
  - No frameworks (pure JavaScript)
  - Fetch API for HTTP requests
  - DOM manipulation for dynamic content

**Why?**
- Lightweight and fast
- No framework overhead
- Full control over code
- Good learning opportunity

### Backend (Server Logic)
- **Node.js** - JavaScript runtime on server
- **Express.js** - Web framework (routing, middleware)
- **Environment:** Runs on Render (cloud hosting)

**What it does:**
- Handles API requests from frontend
- Validates data before saving
- Authenticates users
- Matches items
- Sends emails
- Manages file uploads

### Database (Data Storage)
- **Supabase** - Cloud PostgreSQL database
- **Tables:** users, items, claims, chats, notifications
- **Image Storage:** Supabase Storage bucket

**Why Supabase?**
- Free tier available
- Easy to set up
- Includes storage
- PostgreSQL (powerful & reliable)

### Authentication & Security
- **bcrypt** - Password hashing
  - Passwords not stored plain text
  - Hashed before saving to database
  - Verified on login

### Email Service
- **Brevo (Sendinblue)** - Email service
- Sends verification OTP codes
- Sends notifications to users

### File Upload
- **Multer** - Node.js middleware
- Handles form-data (files + fields)
- Stores images temporarily
- Uploads to Supabase Storage

---

## Project Structure

```
lost-found-iiui/
│
├── frontend/                    # Web application (what users see)
│   ├── index.html              # Main HTML file (single page)
│   ├── css/
│   │   └── style.css           # All styling (44KB)
│   ├── js/
│   │   ├── api.js              # Backend communication
│   │   ├── auth.js             # Login/Signup logic
│   │   ├── items.js            # Item listing & reporting
│   │   ├── dashboard.js        # User dashboard
│   │   ├── admin.js            # Admin panel
│   │   └── app.js              # Main app logic & routing
│   ├── iiui-logo.jpg           # Logo image
│   └── uploads/                # Local uploads (temp)
│
├── backend/                     # Server (handles requests)
│   ├── server.js               # Express server (main file)
│   ├── db_supabase.js          # Database adapter (Supabase)
│   ├── db_sql.js               # Alternative: SQLite adapter
│   ├── db.js                   # Alternative: JSON database
│   ├── database/
│   │   └── db.json             # Local JSON database
│   ├── database.db             # SQLite database file
│   └── uploads/                # Uploaded images
│
├── docs/                        # Documentation copy (for GitHub Pages)
├── package.json                 # Project dependencies & scripts
├── README.md                    # Main documentation
├── DEPLOYMENT.md               # How to deploy
├── QUICK_START.md              # Quick reference
├── VIVA_GUIDE.md              # This file!
├── .env                         # Secrets (not in GitHub)
└── .gitignore                   # Files to exclude from Git
```

### Key Files Explanation

**frontend/index.html** (Main Page)
- Single HTML file with all pages as hidden sections
- Each page (home, report, dashboard, etc.) is a `<section id="page-xxx">`
- JavaScript shows/hides sections based on URL hash (#home, #report, etc.)

**frontend/js/api.js**
```javascript
// Centralized API communication
const API_BASE = '/api';

// Methods: get, post, postMultipart, delete
api.post('/items', {title, description, ...})
```
- All communication with backend goes through this file
- Consistent error handling
- Base URL configuration in one place

**backend/server.js**
- Express server (Node.js web framework)
- Defines all API endpoints
- Handles authentication
- Validates requests
- Calls database operations
- Sends emails
- Handles file uploads

---

## Frontend Explanation

### What is a Single Page Application (SPA)?

**Traditional Website:**
- Click link → Page reloads → New HTML downloaded → Displayed
- Slow and basic

**Single Page Application (SPA):**
- Website loads once
- Click link → JavaScript changes content
- No page reload needed
- Fast and smooth
- Our Lost & Found app is an SPA

### How Our Frontend Works

#### 1. **Hash-Based Routing**
```
URL: https://example.com/#home      → Shows home page
URL: https://example.com/#report    → Shows report page
URL: https://example.com/#dashboard → Shows dashboard
URL: https://example.com/#admin     → Shows admin panel
```

**How it works:**
```javascript
// In app.js
window.addEventListener('hashchange', () => {
  const page = window.location.hash.slice(1); // Get page name
  showPage(page); // Show that page
  hideAllPages(); // Hide others
});
```

#### 2. **JavaScript DOM Manipulation**
```javascript
// Hide all pages
document.getElementById('page-home').style.display = 'none';
document.getElementById('page-report').style.display = 'none';

// Show specific page
document.getElementById('page-report').style.display = 'block';
```

#### 3. **Frontend Pages Breakdown**

| Page | ID | Purpose |
|------|----|---------| 
| **Home** | #home | Welcome, statistics, item feed & search |
| **Login/Signup** | #auth | User registration & login forms |
| **Report Item** | #report | Form to report lost/found items |
| **Item Detail** | #item-detail | Single item view with claim button |
| **Dashboard** | #dashboard | User's items, claims, messages |
| **Admin** | #admin | Moderation & analytics |

#### 4. **Authentication Flow (Frontend)**
```
1. User clicks "Login"
   ↓
2. Shows login form
   ↓
3. User enters email & password
   ↓
4. Frontend sends POST to /api/auth/login
   ↓
5. Backend returns: { success, token, user }
   ↓
6. Frontend saves token to localStorage
   ↓
7. All future requests include token
   ↓
8. User logged in! Can see dashboard, report items, etc.
```

**Code Example:**
```javascript
// auth.js
async function login(email, password) {
  const response = await api.post('/auth/login', {
    email: email,
    password: password
  });
  
  if (response.success) {
    localStorage.setItem('token', response.token); // Save token
    localStorage.setItem('user', JSON.stringify(response.user));
    showPage('home'); // Go to home
  } else {
    showError(response.error);
  }
}
```

#### 5. **Reporting an Item (Frontend Flow)**
```javascript
// User fills form and submits
form.addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent page reload
  
  // Collect data
  const title = document.getElementById('report-title').value;
  const type = document.querySelector('input[name="item-type"]:checked').value;
  const category = document.getElementById('report-category').value;
  // ... collect all fields
  
  // Create FormData for file upload
  const formData = new FormData();
  formData.append('title', title);
  formData.append('type', type);
  formData.append('image', imageFile); // File upload
  
  // Send to backend
  const result = await api.postMultipart('/items', formData);
  
  // Show success/error
  if (result.success) {
    showSuccess('Item reported!');
    navigateTo('#home'); // Go to home
  } else {
    showError(result.error);
  }
});
```

---

## Backend Explanation

### What is a Backend?

**Frontend vs Backend:**
- **Frontend:** What users see (website, buttons, forms)
- **Backend:** Brain of the system (logic, data storage, security)

### Our Backend (Express.js)

**File:** `backend/server.js`

**Main Responsibilities:**
1. Receive requests from frontend
2. Validate data
3. Save/retrieve data from database
4. Send emails
5. Handle file uploads
6. Manage authentication
7. Return responses

### API Endpoints (Routes)

```javascript
// Authentication
POST   /api/auth/signup          → Register new user
POST   /api/auth/login           → Login & get token
POST   /api/auth/verify-otp      → Verify email code

// Items
GET    /api/items                → Get all items
GET    /api/items/:id            → Get single item
POST   /api/items                → Create new item
PUT    /api/items/:id            → Update item
DELETE /api/items/:id            → Delete item

// Claims (Ownership Claims)
POST   /api/claims               → Submit claim for an item
GET    /api/claims/:id           → Get claim details
PUT    /api/claims/:id/approve   → Approve claim
PUT    /api/claims/:id/reject    → Reject claim

// Chat
GET    /api/chats/:claimId       → Get messages
POST   /api/chats/:claimId       → Send message

// Search & Match
GET    /api/items/search?q=...   → Search items
POST   /api/items/match          → Find matching items
```

### Authentication Security

**How Passwords Are Stored (NOT in plain text!):**

```javascript
// When user signs up
const plainPassword = "MyPassword123";

// Backend hashes it using bcrypt
const hashedPassword = await bcrypt.hash(plainPassword, 10);
// Result: $2b$10$aB7cD8xY9zQw... (encrypted)

// Save hashed password to database
await db.users.insert({
  email: 'student@gmail.com',
  password: hashedPassword  // Never save plain password!
});

// When user logs in
const loginPassword = "MyPassword123";

// Compare plain password with hashed version
const isMatch = await bcrypt.compare(loginPassword, hashedPassword);

if (isMatch) {
  // Correct password → Generate token & login
  const token = generateToken(user);
  return { success: true, token };
} else {
  // Wrong password
  return { success: false, error: 'Invalid credentials' };
}
```

**Why bcrypt?**
- One-way encryption (can't reverse)
- Even developers can't see passwords
- If database leaks, passwords are protected
- Industry standard for security

### File Upload Process

```
User selects image file
       ↓
Frontend sends FormData (file + item details)
       ↓
Backend receives request
       ↓
Multer processes the file (checks size, format)
       ↓
Upload to Supabase Storage
       ↓
Get back public URL: https://storage.example.com/item123.jpg
       ↓
Save URL to database
       ↓
Return success response with URL
       ↓
Frontend displays image using URL
```

**Code Example:**
```javascript
// backend/server.js - File upload endpoint
app.post('/api/items', upload.single('image'), async (req, res) => {
  try {
    // Multer has already processed the file
    const file = req.file; // { fieldname, originalname, mimetype, buffer, size }
    
    // Upload to Supabase
    const filename = `items/${Date.now()}-${file.originalname}`;
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filename, file.buffer);
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filename);
    
    // Save to database with image URL
    const item = await db.items.create({
      title: req.body.title,
      imageUrl: publicUrl,  // Store the URL
      // ... other fields
    });
    
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Database Schema

### What is a Database?

- **Storage System** for all application data
- **Tables** organize data (like Excel sheets)
- **Rows** = individual records
- **Columns** = data fields

### Our Database Tables

#### 1. **Users Table**
```sql
CREATE TABLE users (
  id          INTEGER PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  department  VARCHAR(255),
  avatar      VARCHAR(255),
  role        VARCHAR(50) DEFAULT 'user', -- 'user' or 'admin'
  isVerified  BOOLEAN DEFAULT FALSE,
  createdAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Example Data:**
| id | email | password | name | role |
|----|-------|----------|------|------|
| 1 | ahmed@gmail.com | $2b$10$xyz... | Ahmed Ali | user |
| 2 | admin@iiui.edu.pk | $2b$10$abc... | Admin | admin |

#### 2. **Items Table**
```sql
CREATE TABLE items (
  id          INTEGER PRIMARY KEY,
  userId      INTEGER FOREIGN KEY,
  title       VARCHAR(255) NOT NULL,
  type        VARCHAR(50) NOT NULL, -- 'lost' or 'found'
  category    VARCHAR(100),
  description TEXT,
  location    VARCHAR(255),
  imageUrl    VARCHAR(255),
  status      VARCHAR(50) DEFAULT 'active', -- 'active', 'claimed', 'returned'
  dateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Example Data:**
| id | userId | title | type | category | status |
|----|--------|-------|------|----------|--------|
| 1 | 1 | Black iPhone 13 | lost | mobiles | active |
| 2 | 2 | Red Wallet | found | wallets | claimed |

#### 3. **Claims Table**
```sql
CREATE TABLE claims (
  id          INTEGER PRIMARY KEY,
  itemId      INTEGER FOREIGN KEY,
  claimantId  INTEGER FOREIGN KEY, -- Who claimed
  ownershipProof TEXT,
  studentCardUrl VARCHAR(255),
  status      VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  createdAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. **Chats Table**
```sql
CREATE TABLE chats (
  id          INTEGER PRIMARY KEY,
  claimId     INTEGER FOREIGN KEY,
  senderId    INTEGER FOREIGN KEY,
  message     TEXT,
  timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. **Notifications Table**
```sql
CREATE TABLE notifications (
  id          INTEGER PRIMARY KEY,
  userId      INTEGER FOREIGN KEY,
  type        VARCHAR(100), -- 'item_match', 'claim_approved', etc.
  message     TEXT,
  itemId      INTEGER FOREIGN KEY,
  isRead      BOOLEAN DEFAULT FALSE,
  createdAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Database Relationships

```
Users (1) ──────────────── (Many) Items
  │                           │
  │                           └──── (Many) Claims
  │                                  │
  └──────────────────────────────────┴──── (Many) Chats

Users ──── (Many) Notifications
```

### CRUD Operations

**CRUD = Create, Read, Update, Delete**

**Create (Insert):**
```javascript
// Add new item to database
db.items.create({
  userId: 1,
  title: "Black iPhone",
  type: "lost",
  category: "mobiles"
});
// Result: New row added
```

**Read (Select):**
```javascript
// Get all items
const items = await db.items.getAll();

// Get single item
const item = await db.items.getById(1);

// Get filtered items (lost items only)
const lostItems = await db.items.getWhere({ type: 'lost' });
```

**Update:**
```javascript
// Update item status
db.items.update(1, {
  status: 'claimed'
});
```

**Delete:**
```javascript
// Delete item
db.items.delete(1);
```

---

## Features Breakdown

### 1. **User Registration & Authentication**

**Flow:**
1. User clicks "Sign Up"
2. Fills form: name, email, department, password
3. Clicks "Request OTP Code"
4. Backend sends 6-digit code to email (Brevo)
5. User enters code in verification modal
6. Backend verifies code
7. Password hashed with bcrypt
8. User saved to database
9. Account active ✅

**What Happens Behind Scenes:**
```javascript
// Backend
app.post('/auth/signup', async (req, res) => {
  const { email, password, name, department } = req.body;
  
  // Check if user exists
  const existingUser = await db.users.findByEmail(email);
  if (existingUser) return res.status(400).json({ error: 'Email exists' });
  
  // Generate OTP
  const otp = generateRandomOTP(); // Random 6-digit code
  
  // Send email
  await sendEmail(email, `Your verification code: ${otp}`);
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Save temporarily (not verified yet)
  await db.pendingUsers.save({
    email, hashedPassword, name, department, otp
  });
  
  res.json({ success: true, message: 'OTP sent to email' });
});
```

### 2. **Reporting Items (Lost & Found)**

**User Perspective:**
1. Click "Report Lost/Found Item"
2. Select type (Lost or Found)
3. Fill form: title, category, location, date, description
4. Upload photo
5. Click "Submit Report"
6. System checks for duplicates
7. If duplicates found, warns user
8. If no duplicates, item saved
9. Other users get notifications
10. Item appears in feed

**Matching Algorithm:**
```javascript
// Simple fuzzy matching
function findMatches(itemTitle, category) {
  // Get all items in same category
  const candidates = db.items.getWhere({ category });
  
  // Calculate similarity score
  const matches = candidates.map(item => ({
    item,
    score: calculateSimilarity(itemTitle, item.title)
  }));
  
  // Return items with score > 70%
  return matches.filter(m => m.score > 0.7);
}

function calculateSimilarity(str1, str2) {
  // Compare strings character by character
  // Return percentage match
}
```

### 3. **Search & Filtering**

**Frontend Search:**
```javascript
// Real-time search as user types
searchInput.addEventListener('keyup', (e) => {
  const query = e.target.value;
  
  // Filter local items array
  const results = allItems.filter(item =>
    item.title.includes(query) ||
    item.description.includes(query)
  );
  
  // Display results
  displayItems(results);
});
```

**Backend Search:**
```javascript
app.get('/api/items/search', async (req, res) => {
  const { q, category, type, location } = req.query;
  
  let query = db.items.getAll();
  
  if (q) query = query.filter(i => i.title.includes(q));
  if (category) query = query.filter(i => i.category === category);
  if (type) query = query.filter(i => i.type === type);
  if (location) query = query.filter(i => i.location === location);
  
  res.json(query);
});
```

### 4. **Claiming Items**

**Flow:**
1. User finds their item in listing
2. Clicks "Claim Item"
3. Modal opens asking for proof
4. User provides:
   - Ownership proof (description of item details)
   - Student card photo
5. Clicks "Submit Claim"
6. Finder gets notification
7. Finder reviews claim
8. If proof matches → Approves
9. If not → Rejects
10. If approved → Chat opens

### 5. **Chat System**

**Flow:**
```
1. Claim approved → Chat room created
2. Both users see each other's name
3. They can send messages
4. Messages saved in database
5. Used to coordinate meetup
6. Example:
   - Finder: "I found it in library 2nd floor"
   - Claimer: "Yes! Can we meet tomorrow?"
   - Finder: "Sure, library entrance at 2 PM?"
   - Claimer: "Perfect!"
   - They meetup and exchange item ✅
```

**Backend Chat Save:**
```javascript
app.post('/api/chats/:claimId', async (req, res) => {
  const { claimId } = req.params;
  const { message } = req.body;
  const userId = req.user.id; // From token
  
  // Save message
  const msg = await db.chats.create({
    claimId,
    senderId: userId,
    message,
    timestamp: new Date()
  });
  
  res.json({ success: true, message: msg });
});
```

### 6. **Notifications**

**Types:**
- **Item Match:** "We found 3 items matching your search"
- **Claim Received:** "Someone claimed the wallet you found"
- **Claim Approved:** "Your claim was approved! Start chatting"
- **Message Received:** "New message from Ahmed in chat"

**Backend Notification Creation:**
```javascript
// When item reported, notify users searching for similar items
async function notifyUsers(newItem) {
  // Find users searching for this category
  const users = await db.users.getWhere({
    searchCategory: newItem.category
  });
  
  // Create notification for each user
  for (let user of users) {
    await db.notifications.create({
      userId: user.id,
      type: 'item_match',
      message: `New ${newItem.type} item: ${newItem.title}`,
      itemId: newItem.id
    });
  }
}
```

### 7. **Admin Panel**

**Admin Can:**
- View all items reported
- See statistics (total items, lost vs found, recovery rate)
- Moderate inappropriate items
- Delete spam reports
- View user activity

**Admin Endpoints:**
```javascript
app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
  const stats = {
    totalItems: await db.items.count(),
    lostItems: await db.items.countWhere({ type: 'lost' }),
    foundItems: await db.items.countWhere({ type: 'found' }),
    recoveredItems: await db.items.countWhere({ status: 'returned' }),
    totalUsers: await db.users.count()
  };
  res.json(stats);
});
```

---

## Deployment Guide

### What is Deployment?

**Development vs Deployment:**
- **Development:** Code on your computer, only you can access
- **Deployment:** Code on cloud server, everyone can access via URL

### Where We Deploy Each Part

| Component | Platform | Why |
|-----------|----------|-----|
| Frontend | GitHub Pages | Free, easy, serves static files |
| Backend | Render | Free tier, auto-scaling, GitHub integration |
| Database | Supabase | Free tier, includes storage, PostgreSQL |
| Emails | Brevo | Free tier, sends real emails |

### Step-by-Step Deployment

#### 1. Frontend Deployment (GitHub Pages)

**What we deploy:** HTML, CSS, JavaScript files

**Steps:**
```
1. Push code to GitHub
   git push origin main

2. Go to repo Settings → Pages

3. Select:
   - Branch: main
   - Folder: /docs (where frontend files are)

4. Save

5. Wait 2-3 minutes

6. Your site lives at: https://username.github.io/repo-name
```

**What GitHub Pages Does:**
- Takes files from /docs folder
- Serves them as a website
- Free hosting
- Auto-updates when you push

#### 2. Backend Deployment (Render)

**What we deploy:** Node.js server code

**Steps:**
```
1. Go to render.com

2. Create "Web Service"

3. Connect GitHub repo

4. Configure:
   - Build: npm install
   - Start: node backend/server.js

5. Add Environment Variables:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - BREVO_API_KEY
   - etc.

6. Deploy

7. Get URL: https://your-app.onrender.com
```

**What Render Does:**
- Installs dependencies (npm install)
- Starts Node.js server
- Keeps it running 24/7
- Free tier has limits (15 hours/month)
- After limit, app sleeps (just refresh, wakes up)

#### 3. Database Deployment (Supabase)

**What we use:**
- PostgreSQL database in cloud
- Storage bucket for images
- Free tier includes:
  - 500 MB database
  - 1 GB storage
  - Enough for small projects

**Connection String:**
```
Backend connects using:
- SUPABASE_URL: https://xxxxx.supabase.co
- SUPABASE_SERVICE_ROLE_KEY: key_xxxxx
```

#### 4. Email Service (Brevo)

**What we use:**
- Send emails from application
- Free: 300 emails/day
- Used for OTP verification

**Configuration:**
```
Set in .env:
- BREVO_API_KEY: your_api_key
- SENDER_EMAIL: your_email@gmail.com
```

### Environment Variables

**What are they?**
- Sensitive information (API keys, secrets)
- NOT pushed to GitHub
- Set in deployment platform
- Backend reads them via `process.env`

**Example .env file (local):**
```
SUPABASE_URL=https://fcpiczpaubazgkcvwsfi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xyz...
BREVO_API_KEY=xkeysib_xyz...
SENDER_EMAIL=myapp@gmail.com
PORT=3000
```

**How backend reads them:**
```javascript
require('dotenv').config(); // Load from .env

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

---

## Viva Q&A

### Technical Questions (15+ Answers)

#### Q1: What problem does this project solve?

**Answer:** 
IIUI had no centralized system for lost and found items. Students had to post in multiple WhatsApp groups and Facebook pages, making searches chaotic and time-consuming. Our system provides one location where students can report lost items, search for found items, verify ownership, and directly chat with finders to arrange meetups. It's faster, more organized, and secure.

---

#### Q2: Explain the architecture of your system.

**Answer:**
The system has three main layers:

1. **Frontend (HTML/CSS/JavaScript)** - What users see. It's a Single Page Application that runs in the browser. When users click links, JavaScript changes the content without page reload. The frontend sends requests to the backend using fetch API.

2. **Backend (Node.js + Express)** - The server that handles all business logic. It receives requests from the frontend, validates data, performs operations, communicates with the database, sends emails, and returns responses. It's essentially the "brain" of the system.

3. **Database (Supabase/PostgreSQL)** - Cloud storage for all data. It has tables for users, items, claims, chats, and notifications. The backend queries this to store and retrieve data.

These three parts communicate: Frontend → Backend → Database.

---

#### Q3: What is a Single Page Application (SPA)?

**Answer:**
An SPA is a web application that loads once and then dynamically updates the content without full page reloads. In our app, when you click "Report Item", JavaScript hides the home page and shows the report page - no server request needed for this change. This makes it faster and smoother than traditional websites. Users only see URL changes with hash (#home, #report, #dashboard), but the browser doesn't reload.

---

#### Q4: How does authentication work?

**Answer:**
1. User signs up and creates password
2. Password is hashed using bcrypt (one-way encryption)
3. Hashed password is stored in database (not plain text)
4. When user logs in, their password is hashed again
5. This hash is compared with the one in database
6. If they match, a security token is generated
7. Token is sent to frontend and stored in localStorage
8. Every future request includes this token
9. Backend verifies token before allowing access
10. This ensures only logged-in users can report items, claim, chat, etc.

**Why bcrypt?** It's one-way encryption, so even if someone gets the database, they can't reverse-engineer passwords. Industry standard for security.

---

#### Q5: Explain how users report items.

**Answer:**
1. User clicks "Report Lost/Found Item"
2. Selects type (lost or found)
3. Fills form: title, category, location, date, description, and uploads photo
4. Clicks "Submit Report"
5. Frontend sends FormData (form fields + image) to backend
6. Backend validates all data
7. Image is uploaded to Supabase Storage (cloud storage for files)
8. System runs matching algorithm to find similar items
9. Item is saved to database with image URL
10. Other users get notifications
11. Item appears in everyone's feed
12. Users searching for similar items are notified of potential matches

---

#### Q6: How does the item matching algorithm work?

**Answer:**
When a user reports an item, the backend checks if similar items already exist. It uses fuzzy string matching to calculate similarity score. For example:

- New item: "Black iPhone 13 Pro"
- Existing item: "Black iPhone 13"
- Similarity: ~85% (similar enough to match!)

If similarity score is above 70%, it shows as a potential match. System notifies both users (the person searching and the person who found). They can then review the match and proceed with claiming if it's correct. This prevents duplicate listings and helps users find their items faster.

---

#### Q7: How are images stored and handled?

**Answer:**
1. User selects image file from their computer
2. Frontend validates: must be JPEG/PNG/WEBP, under 5MB
3. Frontend sends file to backend using FormData (special format for files)
4. Backend uses Multer middleware to process the file
5. Image is uploaded to Supabase Storage (cloud storage)
6. A public URL is returned: `https://storage.supabase.co/items/image123.jpg`
7. This URL is saved in the database
8. Frontend displays image using the URL
9. The actual image file is stored in Supabase, not on our server
10. This saves server space and is more reliable

**Why cloud storage?** Servers have limited disk space. Cloud storage (Supabase) is unlimited and automatically backed up.

---

#### Q8: Explain the database schema and relationships.

**Answer:**
We have 5 main tables:

- **Users:** Contains student information (email, password, name, department)
- **Items:** Lost/found items reported by users (title, description, image, type, location)
- **Claims:** When user claims they own an item (contains proof, student card, status)
- **Chats:** Messages between users (after claim is approved)
- **Notifications:** Updates for users (item match, claim approved, messages)

**Relationships:**
- 1 user can report many items (1-to-many)
- 1 item can have many claims (1-to-many)
- 1 claim can have many chat messages (1-to-many)
- 1 user can receive many notifications (1-to-many)

**Foreign Keys:** Connect tables together. Example: `items.userId` points to `users.id`, linking item to the user who reported it.

---

#### Q9: What are API endpoints and give examples.

**Answer:**
API endpoints are URLs where the frontend sends requests to perform actions. They're like buttons on a remote control - each button does something different.

Examples from our project:
- `POST /api/items` - Report new item
- `GET /api/items` - Get all items  
- `GET /api/items/:id` - Get single item details
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/claims` - Submit claim for an item
- `POST /api/chats/:claimId` - Send message in chat

**How it works:**
Frontend sends request: `POST /api/items { title, description, type }`
Backend receives it, processes data, saves to database, returns response.

---

#### Q10: How does the claiming system work?

**Answer:**
1. User finds their lost item in the found items list
2. Clicks "Claim Item" button
3. Modal appears asking for ownership proof
4. User provides:
   - Detailed description: "My phone has a cracked bottom-left corner, red phone case, wallpaper is my dog's photo"
   - Student ID card photo
5. Clicks "Submit Claim"
6. Item owner (finder) gets notification
7. Finder reviews the proof details and photo
8. If details match: Finder clicks "Approve Claim" ✅
9. If fake: Finder clicks "Reject Claim" ❌
10. If approved → Private chat opens for pickup arrangement

**Security:** This prevents random people from claiming items. The finder verifies proof.

---

#### Q11: Explain the chat system after claim approval.

**Answer:**
Once a claim is approved:
1. Both users (finder and claimer) can access a private chat room
2. Room is associated with the specific claim
3. Users can send messages about pickup details
4. Example conversation:
   - Claimer: "Thanks! Can we meet tomorrow?"
   - Finder: "Sure, library at 2 PM?"
   - Claimer: "Perfect! I'll be at main entrance"
5. Messages are saved in database
6. Both users get notifications of new messages
7. Only these two users can see this chat (private)
8. After item is returned, conversation can be marked complete

**Use:** Coordinate safe campus meetup location and time.

---

#### Q12: How is the system deployed?

**Answer:**
We deploy to three platforms:

1. **Frontend to GitHub Pages:**
   - Push code to GitHub
   - GitHub Pages serves static files from /docs folder
   - Website lives at: `https://username.github.io/IIUI-LOST-FOUND`
   - Auto-updates when code is pushed

2. **Backend to Render:**
   - Connect GitHub repo to Render
   - Render installs dependencies and starts Node.js server
   - Backend URL: `https://iiui-lost-found.onrender.com`
   - Runs 24/7 (free tier sleeps after 15 hrs/month)

3. **Database on Supabase:**
   - PostgreSQL database in cloud
   - Accessible via: `https://fcpiczpaubazgkcvwsfi.supabase.co`
   - Storage bucket for images
   - No maintenance needed

**Environment Variables:** Sensitive keys (API keys) are stored on each platform, not in GitHub.

---

#### Q13: What technologies did you use and why?

**Answer:**
- **HTML/CSS/JavaScript** - Frontend because lightweight, no framework needed, full control
- **Vanilla JavaScript** - No React/Vue/Angular because smaller project, faster learning, less overhead
- **Node.js + Express** - Backend because JavaScript full-stack, simple and fast framework
- **Supabase** - Database because free tier, easy setup, includes storage for images
- **bcrypt** - Password hashing for security, industry standard
- **Brevo** - Email service for sending OTP codes
- **Multer** - Handles file uploads in Node.js
- **GitHub Pages** - Frontend hosting because free
- **Render** - Backend hosting because free tier, GitHub integration

**Design Decision:** Single Page Application because faster user experience, less server load.

---

#### Q14: What features does your system have?

**Answer:**
1. **User Management**
   - Registration with email verification (OTP code)
   - Login/logout with password hashing
   - User profiles with department info
   - Admin role for moderation

2. **Item Management**
   - Report lost/found items with photos
   - Search and filter items
   - Duplicate detection (prevent multiple reports of same item)
   - Item matching algorithm

3. **Claiming System**
   - Submit claim with proof details
   - Finder verification
   - Approve/reject claims

4. **Chat System**
   - Private messaging after claim approval
   - Coordinate meetup details
   - Real-time notifications

5. **Dashboard**
   - View my reported items
   - View claims received
   - View claims submitted
   - Chat messages

6. **Admin Panel**
   - View statistics
   - Moderate items
   - View user activity

7. **Notifications**
   - Item match alerts
   - Claim status updates
   - Message notifications

---

#### Q15: What challenges did you face?

**Answer:**
1. **File Upload Complexity** - Had to learn Multer for handling file uploads from frontend to cloud storage
2. **Database Relationships** - Setting up proper foreign keys and relationships between users, items, claims, chats
3. **Authentication** - Ensuring secure password storage with bcrypt and token-based authentication
4. **Matching Algorithm** - Creating fuzzy string matching to find similar items
5. **Real-time Notifications** - Notifying users instantly when items match or claims arrive
6. **Deployment** - Coordinating three separate platforms (GitHub Pages, Render, Supabase) with correct URLs and environment variables
7. **CORS Issues** - Frontend and backend on different domains, had to enable CORS
8. **Frontend Routing** - Building SPA with hash-based routing without page framework

**How overcome:** Research, tutorials, reading documentation, testing thoroughly, debugging with console logs.

---

#### Q16: What improvements could be made?

**Answer:**
1. **Real-time Updates** - Use WebSockets so changes appear instantly for all users
2. **User Ratings** - Add rating system for finders/claimers to build trust
3. **Location Map** - Show item location on campus map instead of text
4. **Email Notifications** - Send email when item matches, not just in-app notification
5. **Advanced Search** - Filter by date range, price range, condition
6. **Item Categories** - Expand categories beyond current ones
7. **Report Statistics** - Show which campus locations have most lost items
8. **Mobile App** - Convert to React Native for iOS/Android
9. **Payment Integration** - Optional reward system for returned items
10. **AI Matching** - Use computer vision to match items by photo, not just text

---

#### Q17: How would you add a new feature (e.g., user ratings)?

**Answer:**
1. **Database:** Add `ratings` table with columns: fromUserId, toUserId, score, review, itemId

2. **Backend:** Create endpoints:
   - `POST /api/ratings` - Submit rating
   - `GET /api/users/:id/ratings` - Get user's ratings
   - `GET /api/ratings/average/:userId` - Get average rating

3. **Frontend:** Add UI:
   - After item exchange, show "Rate this user"
   - Star rating (1-5 stars)
   - Text comment
   - Click submit

4. **Integration:** Show ratings on user profile when viewing their items

5. **Testing:** Test rating submission, retrieval, average calculation

6. **Deploy:** Push to GitHub, Render redeploys automatically

---

#### Q18: Explain your code change process.

**Answer:**
1. **Plan Change** - Understand what needs to change
2. **Make Changes** - Edit files in code editor
3. **Test Locally** - Run `npm start`, test in browser
4. **Commit to Git** - `git add .` then `git commit -m "message"`
5. **Push to GitHub** - `git push origin main`
6. **GitHub Pages Updates** - Auto-updates website (2-3 min delay)
7. **Render Redeploys** - GitHub webhook triggers Render to rebuild (5 min)
8. **Verify Live** - Check deployed site to ensure changes work

---

#### Q19: What is the purpose of .env file?

**Answer:**
The `.env` file stores sensitive information like API keys and database passwords. It's not pushed to GitHub for security. When code runs, it reads variables from `.env`:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=secret_key_xyz
BREVO_API_KEY=email_api_key
```

Backend code accesses them:
```javascript
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

On deployment platforms (Render, Supabase), environment variables are set through dashboard, not in code.

---

#### Q20: How would you handle an error in production?

**Answer:**
1. **User Reports Issue** - "App is crashing when I upload image"
2. **Check Logs** - Look at backend logs on Render dashboard
3. **Identify Error** - Find error message and line number
4. **Fix Code** - Edit the problematic code locally
5. **Test** - Run locally and verify fix works
6. **Commit** - `git commit -m "Fix image upload error"`
7. **Push** - `git push origin main`
8. **Wait for Deploy** - Render automatically redeploys (5-10 min)
9. **Verify** - Test the fix on live site
10. **Inform User** - "Issue fixed, try again"

---

## Code Walkthroughs

### Walkthrough 1: How Login Works (End-to-End)

**Frontend (auth.js):**
```javascript
// User clicks login button
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Don't reload page
  
  // Get values
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  // Call API
  try {
    const response = await api.post('/auth/login', {
      email: email,
      password: password
    });
    
    // If successful
    if (response.success) {
      // Save token (proof user is logged in)
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Show success and go to home
      showSuccess('Login successful!');
      setTimeout(() => window.location.hash = '#home', 500);
    } else {
      // Show error
      showError(response.error || 'Login failed');
    }
  } catch (error) {
    showError('Network error: ' + error.message);
  }
});
```

**API Layer (api.js):**
```javascript
async post(endpoint, body = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include token if exists (for auth)
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error(`API POST ${endpoint} error:`, error);
    throw error;
  }
}
```

**Backend (server.js):**
```javascript
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await db.users.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token (proof of authentication)
    const token = jwt.sign({ userId: user.id }, 'secret_key', { expiresIn: '7d' });
    
    // Send response
    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Flow Summary:**
1. User enters email & password
2. Frontend sends POST to /api/auth/login
3. Backend finds user in database
4. Compares plain password with hashed version
5. If match, generates JWT token
6. Sends back token and user info
7. Frontend saves token in localStorage
8. Token automatically included in future requests
9. User is now authenticated!

---

### Walkthrough 2: How Reporting an Item Works

**Frontend (items.js):**
```javascript
reportForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Collect form data
  const formData = new FormData();
  formData.append('title', document.getElementById('report-title').value);
  formData.append('type', document.querySelector('input[name="item-type"]:checked').value);
  formData.append('category', document.getElementById('report-category').value);
  formData.append('location', document.getElementById('report-location').value);
  formData.append('description', document.getElementById('report-desc').value);
  
  // Add image file
  const imageFile = document.getElementById('report-image').files[0];
  if (imageFile) {
    formData.append('image', imageFile); // Browser sends as multipart
  }
  
  // Show loading
  showLoading('Reporting item...');
  
  try {
    // Send to backend
    const response = await api.postMultipart('/items', formData);
    
    if (response.success) {
      showSuccess('Item reported successfully!');
      
      // Check for matches
      if (response.matches && response.matches.length > 0) {
        showInfo(`Found ${response.matches.length} potential matches!`);
      }
      
      // Clear form and go to home
      reportForm.reset();
      setTimeout(() => window.location.hash = '#home', 1000);
    } else {
      showError(response.error || 'Failed to report');
    }
  } catch (error) {
    showError('Error: ' + error.message);
  }
});
```

**Backend (server.js):**
```javascript
app.post('/items', upload.single('image'), async (req, res) => {
  try {
    const { title, type, category, location, description } = req.body;
    const userId = req.user.id; // From auth token
    
    // Validate data
    if (!title || !type || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Upload image if provided
    let imageUrl = null;
    if (req.file) {
      const filename = `items/${Date.now()}-${req.file.originalname}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filename, req.file.buffer);
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filename);
      
      imageUrl = publicUrl;
    }
    
    // Create item in database
    const item = await db.items.create({
      userId,
      title,
      type,
      category,
      location,
      description,
      imageUrl,
      status: 'active'
    });
    
    // Find matching items
    const matches = findMatches(title, category, type);
    
    // Notify users with matching items
    for (let match of matches) {
      await createNotification({
        userId: match.userId,
        type: 'item_match',
        message: `New ${type} item: ${title}`,
        itemId: item.id
      });
    }
    
    // Return success
    res.json({
      success: true,
      item: item,
      matches: matches
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Data Flow:**
1. User fills form and selects image
2. Frontend creates FormData (special format for files)
3. Sends POST to /api/items with image
4. Backend receives file via Multer
5. Image uploaded to Supabase Cloud Storage
6. Public URL returned
7. Item saved to database with image URL
8. System finds matching items
9. Notifications sent to users with matches
10. Response sent back to frontend
11. User sees success message

---

### Walkthrough 3: How Claiming an Item Works

**Frontend (items.js):**
```javascript
// User clicks claim button on item
claimButton.addEventListener('click', () => {
  const itemId = document.getElementById('claim-item-id').value;
  
  // Open claim modal
  document.getElementById('modal-claim').style.display = 'flex';
  document.getElementById('claim-item-id').value = itemId;
});

// User submits claim form
claimForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const itemId = document.getElementById('claim-item-id').value;
  const proofText = document.getElementById('claim-proof-desc').value;
  const cardImage = document.getElementById('claim-student-card').files[0];
  
  // Create FormData
  const formData = new FormData();
  formData.append('itemId', itemId);
  formData.append('proofDescription', proofText);
  formData.append('studentCard', cardImage);
  
  try {
    const response = await api.postMultipart('/claims', formData);
    
    if (response.success) {
      showSuccess('Claim submitted! Waiting for approval');
      document.getElementById('modal-claim').style.display = 'none';
      claimForm.reset();
    } else {
      showError(response.error);
    }
  } catch (error) {
    showError('Error: ' + error.message);
  }
});
```

**Backend (server.js):**
```javascript
app.post('/claims', upload.single('studentCard'), async (req, res) => {
  try {
    const { itemId, proofDescription } = req.body;
    const claimantId = req.user.id;
    
    // Get the item
    const item = await db.items.getById(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    
    // Check if already claimed
    const existingClaim = await db.claims.getWhere({
      itemId,
      status: 'approved'
    });
    if (existingClaim) {
      return res.status(400).json({ error: 'Item already claimed' });
    }
    
    // Upload student card
    let cardImageUrl = null;
    if (req.file) {
      const filename = `claims/${Date.now()}-${req.file.originalname}`;
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filename, req.file.buffer);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filename);
      
      cardImageUrl = publicUrl;
    }
    
    // Create claim
    const claim = await db.claims.create({
      itemId,
      claimantId,
      proofDescription,
      studentCardUrl: cardImageUrl,
      status: 'pending'
    });
    
    // Notify item owner (finder)
    await createNotification({
      userId: item.userId,
      type: 'claim_received',
      message: `New claim on your ${item.type} item: "${item.title}"`,
      itemId
    });
    
    res.json({
      success: true,
      claim: claim,
      message: 'Claim submitted for review'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Finder approves claim
app.put('/claims/:claimId/approve', async (req, res) => {
  try {
    const { claimId } = req.params;
    const finderId = req.user.id;
    
    // Get claim
    const claim = await db.claims.getById(claimId);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    
    // Get item
    const item = await db.items.getById(claim.itemId);
    
    // Verify user is the finder (owner of item)
    if (item.userId !== finderId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Update claim status
    await db.claims.update(claimId, { status: 'approved' });
    
    // Create chat room
    await db.chats.createRoom({
      claimId,
      participant1: finderId,
      participant2: claim.claimantId,
      itemId: claim.itemId
    });
    
    // Notify claimer (winner)
    await createNotification({
      userId: claim.claimantId,
      type: 'claim_approved',
      message: `Your claim on "${item.title}" was approved! Start chatting to arrange pickup.`,
      itemId: claim.itemId
    });
    
    res.json({
      success: true,
      message: 'Claim approved! Chat room created.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Flow:**
1. User fills claim form with proof details & student card photo
2. Frontend uploads to backend
3. Backend validates claim
4. Student card image uploaded to cloud storage
5. Claim saved as "pending"
6. Item owner (finder) gets notification
7. Finder reviews claim details and photo
8. If proof matches, clicks "Approve Claim"
9. Backend updates claim to "approved"
10. Chat room created between finder and claimer
11. Both users get notifications
12. Private chat opens for pickup coordination

---

## Practice Exercises

### Exercise 1: Add a Feature

**Task:** Add a "Favorites" button so users can bookmark items they're interested in.

**Steps:**
1. Add `favorites` table to database
2. Create backend endpoints:
   - POST /api/favorites (add to favorites)
   - DELETE /api/favorites/:itemId (remove)
   - GET /api/favorites (get user's favorites)
3. Add heart icon button on item cards
4. Style button to change when clicked
5. Test locally
6. Deploy

---

### Exercise 2: Fix a Bug

**Scenario:** Users report that images aren't uploading.

**Debugging Process:**
1. Check browser console for JavaScript errors
2. Check Render logs for backend errors
3. Verify Supabase API key is correct
4. Check file size limit (5MB)
5. Verify CORS is enabled
6. Test with small image first
7. Check network tab in browser
8. Add console.log() statements to trace issue

---

### Exercise 3: Modify Code

**Task:** Change "Lost Item" button color from green to blue.

**Answer:**
```css
/* In frontend/css/style.css */
.btn-gradient {
  background: linear-gradient(135deg, #0099ff, #0066ff); /* Changed to blue */
  color: white;
}
```

Then:
```bash
git add .
git commit -m "Change button color to blue"
git push origin main
```

---

## Final Tips for Viva

1. **Understand, Don't Memorize** - Know concepts, not exact code
2. **Draw Diagrams** - Show architecture with arrows
3. **Give Examples** - Use real use cases from app
4. **Explain Simply** - Imagine explaining to non-technical person
5. **Show Enthusiasm** - Talk passionately about your project
6. **Admit Challenges** - Discuss problems you faced and solutions
7. **Suggest Improvements** - Show you think beyond current code
8. **Test Your Knowledge** - Ask yourself questions from Q&A section
9. **Practice** - Explain project to friends multiple times
10. **Be Confident** - You built this! You know it best!

---

**Good luck with your viva! You've built an impressive full-stack application.** 🎉
