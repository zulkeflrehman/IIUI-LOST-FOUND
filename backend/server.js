require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const multer = require('multer');
const bcrypt = require('bcrypt');
const db = require('./db_supabase');

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const SENDER_NAME = process.env.SENDER_NAME;
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

if (!BREVO_API_KEY || !SENDER_EMAIL || !SENDER_NAME) {
  console.warn('Missing BREVO env vars. Email sending may fail.');
}

function sendBrevoEmail(toEmail, toName, subject, htmlContent) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: toEmail, name: toName || toEmail }],
      subject,
      htmlContent
    });

    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ========== SMS SERVICE (Twilio / Simulated) ==========
// Sends an SMS alert to the given phone number.
// If Twilio credentials are configured, sends a real SMS via the Twilio REST API.
// Otherwise, simulates by logging to console (for demo/viva purposes).
async function sendSmsAlert(toPhone, messageText) {
  if (!toPhone || toPhone.trim().length < 5) {
    console.log('[SMS] Skipped — no valid phone number provided.');
    return { simulated: true, skipped: true };
  }

  const cleanPhone = toPhone.replace(/[^\d+]/g, '');
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📱 SMS ALERT DISPATCHED`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   To:      ${cleanPhone}`);
  console.log(`   Message: ${messageText}`);
  console.log(`   Time:    ${new Date().toLocaleString()}`);

  // If Twilio credentials are provided, send a real SMS
  if (TWILIO_SID && TWILIO_AUTH && TWILIO_PHONE) {
    return new Promise((resolve, reject) => {
      const postData = new URLSearchParams({
        To: cleanPhone,
        From: TWILIO_PHONE,
        Body: messageText
      }).toString();

      const options = {
        hostname: 'api.twilio.com',
        path: `/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        method: 'POST',
        auth: `${TWILIO_SID}:${TWILIO_AUTH}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`   Status:  ✅ DELIVERED via Twilio`);
            console.log(`${'='.repeat(60)}\n`);
            resolve(JSON.parse(data));
          } else {
            console.log(`   Status:  ⚠️ Twilio error ${res.statusCode}`);
            console.log(`${'='.repeat(60)}\n`);
            reject(new Error(`Twilio API error ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (err) => {
        console.log(`   Status:  ⚠️ Network error: ${err.message}`);
        console.log(`${'='.repeat(60)}\n`);
        reject(err);
      });

      req.write(postData);
      req.end();
    });
  } else {
    // Simulated mode — SMS is logged to console for viva demonstration
    console.log(`   Status:  ✅ SIMULATED (Twilio credentials not configured)`);
    console.log(`   Note:    In production, this would send a real SMS via Twilio API.`);
    console.log(`${'='.repeat(60)}\n`);
    return { simulated: true, to: cleanPhone, message: messageText };
  }
}

// Register SMS callback for Smart Matches in the database layer
db.setSmsCallback(sendSmsAlert);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only standard images are allowed! (.jpeg, .jpg, .png, .webp)'));
  }
});

async function seedData() {
  const allItems = await db.items.all();
  if (allItems.length === 0) {
    console.log('Seeding initial IIUI campus data...');

    const adminUser = await db.users.create({
      email: 'admin@iiu.edu.pk',
      fullName: 'IIUI Lost & Found Admin',
      department: 'Administration & Security',
      password: await bcrypt.hash('adminpassword', 10),
      phone: '+920000000000',
      role: 'admin'
    });

    const user1 = await db.users.create({
      email: 'ahmed.fcon@iiu.edu.pk',
      fullName: 'Ahmed Ali',
      department: 'Faculty of Computing',
      password: await bcrypt.hash('password123', 10),
      phone: '+923001234567',
      role: 'user'
    });

    const user2 = await db.users.create({
      email: 'zainab.fss@iiu.edu.pk',
      fullName: 'Zainab Bibi',
      department: 'Faculty of Social Sciences',
      password: await bcrypt.hash('password123', 10),
      phone: '+923009876543',
      role: 'user'
    });

    await db.items.create({
      title: 'Black Leather Wallet',
      description: 'Lost my leather wallet containing my IIUI Student Card, CNIC, and some cash. The wallet brand is J.',
      category: 'wallets',
      type: 'lost',
      location: 'Central Library',
      date: '2026-05-28',
      reporterId: user1.id,
      reporterEmail: user1.email,
      reporterName: user1.fullName,
      imageUrl: ''
    });

    await db.items.create({
      title: 'HP Laptop Charger 65W',
      description: 'Forgot my blue-tip HP laptop charger in the Computing Lab 3 desk. Please return if found.',
      category: 'mobiles',
      type: 'lost',
      location: 'Faculty of Computing (Block C)',
      date: '2026-05-27',
      reporterId: user2.id,
      reporterEmail: user2.email,
      reporterName: user2.fullName,
      imageUrl: ''
    });

    await db.items.create({
      title: 'Keys with Keychain',
      description: 'Found a bunch of keys (3 keys) on a red leather keychain near Faisal Mosque Campus parking lot.',
      category: 'others',
      type: 'found',
      location: 'Faisal Mosque Campus',
      date: '2026-05-29',
      reporterId: user2.id,
      reporterEmail: user2.email,
      reporterName: user2.fullName,
      imageUrl: ''
    });

    console.log('Seed database ready!');
  }
}

seedData();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const activeOtps = {};

app.post('/api/auth/register', async (req, res) => {
  const { email, fullName, password, department, phone } = req.body;
  if (!email || !fullName || !password || !department) {
    return res.status(400).json({ error: 'Please enter all details' });
  }

  if (!phone || phone.trim().length < 5) {
    return res.status(400).json({ error: 'Please enter a valid mobile/phone number for SMS alerts' });
  }

  const lowerEmail = email.toLowerCase().trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(lowerEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  const existingUser = await db.users.find(u => u.email.toLowerCase() === lowerEmail);
  if (existingUser) {
    return res.status(400).json({ error: 'Account with this email already exists' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  activeOtps[lowerEmail] = {
    otp,
    userData: { email: lowerEmail, fullName, password, department, phone: phone.trim() },
    expires: Date.now() + 10 * 60 * 1000
  };

  const htmlContent = `
    <div style="font-family: 'Inter', Arial, sans-serif; background: #070b15; padding: 40px 20px; min-height: 100vh;">
      <div style="max-width: 520px; margin: 0 auto; background: #0c1122; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); padding: 30px 40px; text-align: center;">
          <h1 style="color: #070b15; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">e-Lost &amp; Found IIUI</h1>
          <p style="color: #070b15; opacity: 0.75; font-size: 13px; margin: 5px 0 0;">International Islamic University Islamabad</p>
        </div>
        <div style="padding: 40px;">
          <h2 style="color: #f8fafc; font-size: 20px; margin: 0 0 8px;">Verify your email address</h2>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.7; margin: 0 0 30px;">Hello <strong style="color: #f8fafc;">${fullName}</strong>, use the verification code below to complete your registration on the IIUI campus Lost &amp; Found portal.</p>
          <div style="background: #131b31; border: 1px solid rgba(0,242,254,0.2); border-radius: 14px; padding: 28px; text-align: center; margin-bottom: 30px;">
            <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">Your Verification Code</p>
            <h1 style="color: #00f2fe; font-size: 48px; font-weight: 800; letter-spacing: 14px; margin: 0;">${otp}</h1>
            <p style="color: #64748b; font-size: 12px; margin: 12px 0 0;">This code expires in <strong>10 minutes</strong></p>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.6;">If you did not request this code, you can safely ignore this email.</p>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.05); padding: 20px 40px; text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">e-Lost &amp; Found &mdash; IIUI Campus Portal &bull; Islamabad, Pakistan</p>
        </div>
      </div>
    </div>
  `;

  try {
    console.log(`[AUTH] Registration OTP for ${lowerEmail} is [ ${otp} ]`);
    await sendBrevoEmail(lowerEmail, fullName, 'Your IIUI e-Lost & Found Verification Code', htmlContent);

    // SMS Alert: Send OTP via SMS as well
    sendSmsAlert(phone.trim(), `[IIUI Lost & Found] Your verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`).catch(err => console.error('[SMS] OTP send failed:', err.message));

    res.json({
      message: `Verification code sent to ${lowerEmail} and your mobile number. Please check your inbox (and spam folder).`,
      email: lowerEmail
    });
  } catch (err) {
    console.error('[EMAIL SERVICE] Failed to send OTP email:', err.message);
    res.status(500).json({
      error: 'Failed to send verification email. Please check your email address and try again.',
      detail: err.message
    });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const lowerEmail = email.toLowerCase().trim();
  const record = activeOtps[lowerEmail];

  if (!record) {
    return res.status(400).json({ error: 'Verification session expired. Please register again.' });
  }

  if (record.expires < Date.now()) {
    delete activeOtps[lowerEmail];
    return res.status(400).json({ error: 'Verification code expired. Please register again.' });
  }

  if (record.otp !== otp.trim()) {
    return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
  }

  const hashed = await bcrypt.hash(record.userData.password, 10);
  const user = await db.users.create({ ...record.userData, password: hashed });
  delete activeOtps[lowerEmail];

  // SMS Alert: Welcome message after successful registration
  sendSmsAlert(user.phone, `Welcome to IIUI Lost & Found, ${user.fullName}! Your account is now active. Report lost/found items at https://iiui-lost-found.onrender.com`).catch(err => console.error('[SMS] Welcome send failed:', err.message));

  res.json({
    message: 'Account verified and created successfully!',
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      department: user.department,
      phone: user.phone,
      role: user.role
    }
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter all details' });
  }

  const lowerEmail = email.toLowerCase().trim();
  const user = await db.users.find(u => u.email.toLowerCase() === lowerEmail);
  if (!user) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  res.json({
    message: 'Logged in successfully!',
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      department: user.department,
      phone: user.phone,
      role: user.role
    }
  });
});

app.get('/api/items', async (req, res) => {
  const { query, category, location, status, type, reporterId } = req.query;
  let list = await db.items.all();

  if (type) list = list.filter(i => i.type === type);
  if (status) list = list.filter(i => i.status === status);
  else if (!reporterId) list = list.filter(i => i.status !== 'claimed');
  if (category) list = list.filter(i => i.category === category);
  if (location) list = list.filter(i => i.location.toLowerCase().includes(location.toLowerCase()));
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

app.get('/api/items/:id', async (req, res) => {
  const item = await db.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

app.get('/api/items/:id/matches', async (req, res) => {
  const item = await db.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const targetType = item.type === 'lost' ? 'found' : 'lost';
  const allItems = await db.items.all();
  const matches = [];

  allItems.forEach(existing => {
    if (existing.type !== targetType || existing.status === 'claimed' || existing.id === item.id) return;

    let score = 0;
    if (existing.category === item.category) score += 45;

    const words1 = new Set((existing.title + ' ' + existing.description).toLowerCase().split(/\s+/));
    const words2 = new Set((item.title + ' ' + item.description).toLowerCase().split(/\s+/));
    let intersection = 0;
    for (const w of words1) if (words2.has(w)) intersection++;
    const union = new Set([...words1, ...words2]).size;
    score += union > 0 ? (intersection / union) * 35 : 0;

    if (existing.location === item.location) {
      score += 20;
    } else {
      const locWords1 = new Set(existing.location.toLowerCase().split(/\s+/));
      const locWords2 = new Set(item.location.toLowerCase().split(/\s+/));
      let locIntersection = 0;
      for (const lw of locWords1) if (locWords2.has(lw)) locIntersection++;
      const locUnion = new Set([...locWords1, ...locWords2]).size;
      score += locUnion > 0 ? (locIntersection / locUnion) * 15 : 0;
    }

    if (score >= 45) matches.push({ item: existing, confidence: Math.round(score) });
  });

  res.json(matches.sort((a, b) => b.confidence - a.confidence).slice(0, 3));
});

app.post('/api/items/check-duplicates', async (req, res) => {
  const { title, description, category, location, type } = req.body;
  if (!title || !category || !location || !type) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const duplicates = await db.matching.checkPotentialDuplicates({ title, description, category, location, type });
  res.json(duplicates);
});

app.post('/api/items', upload.single('image'), async (req, res) => {
  const { title, description, category, location, type, reporterId, reporterEmail, reporterName } = req.body;
  if (!title || !category || !location || !type || !reporterId || !reporterEmail || !reporterName) {
    return res.status(400).json({ error: 'Missing required item information' });
  }

  let imageUrl = '';
  if (req.file && req.file.buffer) {
    const filename = `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${path.extname(req.file.originalname)}`;
    try {
      imageUrl = await db.uploadBufferToStorage('items', filename, req.file.buffer, req.file.mimetype);
    } catch (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: 'Failed to upload image' });
    }
  }

  const newItem = await db.items.create({
    title,
    description: description || '',
    category,
    type,
    location,
    date: req.body.date || new Date().toISOString().split('T')[0],
    reporterId,
    reporterEmail,
    reporterName,
    imageUrl
  });

  res.status(201).json({ message: 'Report submitted successfully!', item: newItem });
});

app.delete('/api/items/:id', async (req, res) => {
  const { userId, role } = req.query;
  const item = await db.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.reporterId !== userId && role !== 'admin') return res.status(403).json({ error: 'You do not have permission to delete this post' });
  await db.items.delete(req.params.id);
  res.json({ message: 'Post successfully deleted' });
});

app.post('/api/items/:id/claim', upload.single('studentCard'), async (req, res) => {
  const itemId = req.params.id;
  const { claimerId, claimerName, claimerEmail, proofDescription } = req.body;
  if (!claimerId || !claimerName || !claimerEmail || !proofDescription) {
    return res.status(400).json({ error: 'Please enter claim verification details' });
  }

  const item = await db.items.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.status === 'claimed') return res.status(400).json({ error: 'Item has already been successfully recovered' });
  if (item.reporterId === claimerId) return res.status(400).json({ error: 'You cannot claim your own reported item!' });

  const existingClaims = await db.claims.filter(c => c.itemId === itemId && c.claimerId === claimerId);
  if (existingClaims.some(c => c.status === 'pending')) {
    return res.status(400).json({ error: 'You already have a pending claim request submitted for this item' });
  }

  let studentCardUrl = '';
  if (req.file && req.file.buffer) {
    const filename = `claim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${path.extname(req.file.originalname)}`;
    try {
      studentCardUrl = await db.uploadBufferToStorage('claims', filename, req.file.buffer, req.file.mimetype);
    } catch (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: 'Failed to upload student card image' });
    }
  }

  const claim = await db.claims.create({
    itemId,
    itemTitle: item.title,
    claimerId,
    claimerName,
    claimerEmail,
    proofDescription,
    studentCardUrl
  });

  // SMS Alert: Notify item reporter about new claim
  try {
    const reporter = await db.users.find(u => u.id === item.reporterId);
    if (reporter && reporter.phone) {
      sendSmsAlert(reporter.phone, `[IIUI Lost & Found] New claim received! ${claimerName} has claimed your item "${item.title}". Login to review their proof and approve/reject.`).catch(err => console.error('[SMS] Claim notification failed:', err.message));
    }
  } catch (smsErr) {
    console.error('[SMS] Claim reporter notify error:', smsErr.message);
  }

  res.status(201).json({ message: 'Claim request submitted! The finder has been notified via email and SMS.', claim });
});

app.get('/api/my-claims', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  const userClaims = await db.claims.filter(c => c.claimerId === userId);
  res.json(userClaims);
});

app.get('/api/item-claims', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  const userItems = await db.items.all();
  const itemIds = userItems.filter(i => i.reporterId === userId).map(i => i.id);
  const claims = await db.claims.filter(c => itemIds.includes(c.itemId));
  res.json(claims);
});

app.post('/api/claims/:id/status', async (req, res) => {
  const claimId = req.params.id;
  const { status, userId, role } = req.body;
  if (!status || !['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const claim = await db.claims.find(c => c.id === claimId);
  if (!claim) return res.status(404).json({ error: 'Claim request not found' });

  const item = await db.items.find(i => i.id === claim.itemId);
  if (!item) return res.status(404).json({ error: 'Associated item not found' });
  if (item.reporterId !== userId && role !== 'admin') return res.status(403).json({ error: 'Unauthorized to approve/decline claims for this item' });

  const updatedClaim = await db.claims.updateStatus(claimId, status);

  // SMS Alert: Notify claimer about claim decision
  try {
    const claimer = await db.users.find(u => u.id === claim.claimerId);
    if (claimer && claimer.phone) {
      if (status === 'approved') {
        sendSmsAlert(claimer.phone, `[IIUI Lost & Found] 🎉 Your claim for "${item.title}" has been APPROVED! Login to chat with the finder and arrange a campus meetup.`).catch(err => console.error('[SMS] Claim approved notify failed:', err.message));
      } else {
        sendSmsAlert(claimer.phone, `[IIUI Lost & Found] Your claim for "${item.title}" was rejected. The proof details did not match. You can try again with more specific details.`).catch(err => console.error('[SMS] Claim rejected notify failed:', err.message));
      }
    }
  } catch (smsErr) {
    console.error('[SMS] Claim status notify error:', smsErr.message);
  }

  res.json({ message: `Claim request has been successfully ${status}!`, claim: updatedClaim });
});

app.get('/api/chats', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  const rooms = await db.chats.getUserRooms(userId);
  res.json(rooms);
});

app.get('/api/chats/:roomId', async (req, res) => {
  const room = await db.chats.findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Chat room not found' });
  res.json(room);
});

app.post('/api/chats/:roomId/message', async (req, res) => {
  const { senderId, senderName, text } = req.body;
  if (!senderId || !senderName || !text) return res.status(400).json({ error: 'Message information is missing' });

  const msg = await db.chats.addMessage(req.params.roomId, { senderId, senderName, text });
  if (!msg) return res.status(404).json({ error: 'Chat room not found' });
  res.status(201).json(msg);
});

app.get('/api/notifications', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  const notifications = await db.notifications.getUserNotifications(userId);
  res.json(notifications);
});

app.post('/api/notifications/read', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  await db.notifications.markAllRead(userId);
  res.json({ success: true });
});

app.get('/api/admin/stats', async (req, res) => {
  const dbData = await db.items.all();
  const totalItems = dbData.length;
  const lostCount = dbData.filter(i => i.status === 'lost').length;
  const foundCount = dbData.filter(i => i.status === 'found').length;
  const claimedCount = dbData.filter(i => i.status === 'claimed').length;
  const recoveryRate = totalItems > 0 ? Math.round((claimedCount / totalItems) * 100) : 0;

  res.json({ totalItems, lostCount, foundCount, claimedCount, recoveryRate });
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server executing successfully on port ${PORT}!`);
  console.log(`Open http://localhost:${PORT} to access the application.`);
});