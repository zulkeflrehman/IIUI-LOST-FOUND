const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'database.db');

function ensureDatabaseFolder() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

function parseMessages(messagesJson) {
  try {
    return JSON.parse(messagesJson || '[]');
  } catch (error) {
    return [];
  }
}

function serializeMessages(messages) {
  return JSON.stringify(messages || []);
}

ensureDatabaseFolder();
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

function initializeDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      fullName TEXT NOT NULL,
      department TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      location TEXT NOT NULL,
      date TEXT NOT NULL,
      reporterId TEXT NOT NULL,
      reporterEmail TEXT NOT NULL,
      reporterName TEXT NOT NULL,
      imageUrl TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY(reporterId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      itemId TEXT NOT NULL,
      itemTitle TEXT NOT NULL,
      claimerId TEXT NOT NULL,
      claimerName TEXT NOT NULL,
      claimerEmail TEXT NOT NULL,
      proofDescription TEXT NOT NULL,
      studentCardUrl TEXT,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY(itemId) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      roomId TEXT UNIQUE NOT NULL,
      itemId TEXT NOT NULL,
      itemTitle TEXT NOT NULL,
      reporterId TEXT NOT NULL,
      reporterName TEXT NOT NULL,
      claimerId TEXT NOT NULL,
      claimerName TEXT NOT NULL,
      messages TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY(itemId) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_items_reporterId ON items(reporterId);
    CREATE INDEX IF NOT EXISTS idx_claims_itemId ON claims(itemId);
    CREATE INDEX IF NOT EXISTS idx_chats_roomId ON chats(roomId);
    CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
  `);
}

initializeDb();

function getSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  s1 = s1.toLowerCase().trim();
  s2 = s2.toLowerCase().trim();
  if (s1 === s2) return 1.0;

  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }

  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? intersection / union : 0;
}

const dbSql = {
  users: {
    find: (predicate) => {
      const rows = db.prepare('SELECT * FROM users').all();
      if (typeof predicate === 'function') {
        return rows.find(predicate);
      }
      return rows.find(row => Object.keys(predicate).every(key => row[key] === predicate[key]));
    },
    create: (userData) => {
      const now = new Date().toISOString();
      const user = {
        id: generateId('usr'),
        role: 'user',
        createdAt: now,
        updatedAt: null,
        ...userData
      };
      db.prepare(`
        INSERT INTO users (id, email, fullName, department, password, role, createdAt, updatedAt)
        VALUES (@id, @email, @fullName, @department, @password, @role, @createdAt, @updatedAt)
      `).run(user);
      return user;
    }
  },

  items: {
    all: () => {
      return db.prepare('SELECT * FROM items').all();
    },
    find: (predicate) => {
      const rows = db.prepare('SELECT * FROM items').all();
      if (typeof predicate === 'function') {
        return rows.find(predicate);
      }
      return rows.find(row => Object.keys(predicate).every(key => row[key] === predicate[key]));
    },
    filter: (predicate) => {
      const rows = db.prepare('SELECT * FROM items').all();
      if (typeof predicate === 'function') {
        return rows.filter(predicate);
      }
      return rows.filter(row => Object.keys(predicate).every(key => row[key] === predicate[key]));
    },
    create: (itemData) => {
      const now = new Date().toISOString();
      const newItem = {
        id: generateId('itm'),
        status: itemData.type === 'lost' ? 'lost' : 'found',
        createdAt: now,
        updatedAt: null,
        ...itemData
      };
      db.prepare(`
        INSERT INTO items (id, title, description, category, type, status, location, date, reporterId, reporterEmail, reporterName, imageUrl, createdAt, updatedAt)
        VALUES (@id, @title, @description, @category, @type, @status, @location, @date, @reporterId, @reporterEmail, @reporterName, @imageUrl, @createdAt, @updatedAt)
      `).run(newItem);
      dbSql.matching.triggerMatchChecking(newItem);
      return newItem;
    },
    update: (id, updates) => {
      const existing = dbSql.items.find(item => item.id === id);
      if (!existing) return null;
      const updatedItem = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      db.prepare(`
        UPDATE items SET
          title = @title,
          description = @description,
          category = @category,
          type = @type,
          status = @status,
          location = @location,
          date = @date,
          reporterId = @reporterId,
          reporterEmail = @reporterEmail,
          reporterName = @reporterName,
          imageUrl = @imageUrl,
          createdAt = @createdAt,
          updatedAt = @updatedAt
        WHERE id = @id
      `).run(updatedItem);
      return updatedItem;
    },
    delete: (id) => {
      const item = dbSql.items.find(item => item.id === id);
      if (!item) return false;
      db.prepare('DELETE FROM claims WHERE itemId = ?').run(id);
      const result = db.prepare('DELETE FROM items WHERE id = ?').run(id);
      return result.changes > 0;
    }
  },

  claims: {
    filter: (predicate) => {
      const rows = db.prepare('SELECT * FROM claims').all();
      if (typeof predicate === 'function') return rows.filter(predicate);
      return rows.filter(row => Object.keys(predicate).every(key => row[key] === predicate[key]));
    },
    find: (predicate) => {
      const rows = db.prepare('SELECT * FROM claims').all();
      if (typeof predicate === 'function') return rows.find(predicate);
      return rows.find(row => Object.keys(predicate).every(key => row[key] === predicate[key]));
    },
    create: (claimData) => {
      const now = new Date().toISOString();
      const claim = {
        id: generateId('clm'),
        status: 'pending',
        createdAt: now,
        updatedAt: null,
        ...claimData
      };
      db.prepare(`
        INSERT INTO claims (id, itemId, itemTitle, claimerId, claimerName, claimerEmail, proofDescription, studentCardUrl, status, createdAt, updatedAt)
        VALUES (@id, @itemId, @itemTitle, @claimerId, @claimerName, @claimerEmail, @proofDescription, @studentCardUrl, @status, @createdAt, @updatedAt)
      `).run(claim);
      const item = dbSql.items.find(i => i.id === claim.itemId);
      if (item) {
        dbSql.notifications.create({
          userId: item.reporterId,
          type: 'claim_received',
          message: `New claim request received from ${claim.claimerName} for your item: "${item.title}".`,
          link: `dashboard?tab=claims`
        });
      }
      return claim;
    },
    updateStatus: (id, status) => {
      const existingClaim = dbSql.claims.find(c => c.id === id);
      if (!existingClaim) return null;
      const now = new Date().toISOString();
      db.prepare('UPDATE claims SET status = ?, updatedAt = ? WHERE id = ?').run(status, now, id);

      const item = dbSql.items.find(i => i.id === existingClaim.itemId);
      if (!item) return existingClaim;

      if (status === 'approved') {
        db.prepare('UPDATE items SET status = ?, updatedAt = ? WHERE id = ?').run('claimed', now, item.id);
        const otherClaims = dbSql.claims.filter(c => c.itemId === item.id && c.id !== id && c.status === 'pending');
        otherClaims.forEach(c => {
          db.prepare('UPDATE claims SET status = ?, updatedAt = ? WHERE id = ?').run('rejected', now, c.id);
          dbSql.notifications.create({
            userId: c.claimerId,
            type: 'claim_rejected',
            message: `Your claim request for "${item.title}" was declined (item successfully recovered by another user).`,
            link: `dashboard?tab=my-claims`
          });
        });

        const roomId = `${item.id}_${item.reporterId}_${existingClaim.claimerId}`;
        const chat = dbSql.chats.findRoom(roomId);
        if (!chat) {
          db.prepare(`
            INSERT INTO chats (id, roomId, itemId, itemTitle, reporterId, reporterName, claimerId, claimerName, messages, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            generateId('cht'),
            roomId,
            item.id,
            item.title,
            item.reporterId,
            item.reporterName,
            existingClaim.claimerId,
            existingClaim.claimerName,
            serializeMessages([
              {
                senderId: 'system',
                senderName: 'e-Lost & Found System',
                text: `Claim request approved! You can now securely coordinate a meetup location on campus to retrieve the item. Please bring proper identification (IIUI Student Card).`,
                timestamp: now
              }
            ]),
            now,
            now
          );
        }
      }

      dbSql.notifications.create({
        userId: existingClaim.claimerId,
        type: status === 'approved' ? 'claim_approved' : 'claim_rejected',
        message: status === 'approved'
          ? `Congratulations! Your claim for "${item.title}" has been APPROVED. Click here to chat with the finder.`
          : `Your claim for "${item.title}" has been rejected. Details did not match the item's criteria.`,
        link: status === 'approved' ? `dashboard?tab=messages` : `dashboard?tab=my-claims`
      });

      return dbSql.claims.find(c => c.id === id);
    }
  },

  chats: {
    findRoom: (roomId) => {
      const row = db.prepare('SELECT * FROM chats WHERE roomId = ?').get(roomId);
      if (!row) return null;
      return { ...row, messages: parseMessages(row.messages) };
    },
    getUserRooms: (userId) => {
      const rows = db.prepare('SELECT * FROM chats WHERE reporterId = ? OR claimerId = ?').all(userId, userId);
      return rows.map(row => ({ ...row, messages: parseMessages(row.messages) }));
    },
    addMessage: (roomId, messageData) => {
      const room = dbSql.chats.findRoom(roomId);
      if (!room) return null;
      const messages = [...room.messages, {
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        text: messageData.text,
        timestamp: new Date().toISOString()
      }];
      db.prepare('UPDATE chats SET messages = ?, updatedAt = ? WHERE roomId = ?').run(serializeMessages(messages), new Date().toISOString(), roomId);
      return messages[messages.length - 1];
    }
  },

  notifications: {
    getUserNotifications: (userId) => {
      return db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC').all(userId);
    },
    create: (ntfData) => {
      const now = new Date().toISOString();
      const notification = {
        id: generateId('ntf'),
        read: 0,
        createdAt: now,
        updatedAt: null,
        ...ntfData
      };
      db.prepare(`
        INSERT INTO notifications (id, userId, type, message, link, read, createdAt, updatedAt)
        VALUES (@id, @userId, @type, @message, @link, @read, @createdAt, @updatedAt)
      `).run(notification);
      return notification;
    },
    markAllRead: (userId) => {
      db.prepare('UPDATE notifications SET read = 1, updatedAt = ? WHERE userId = ?').run(new Date().toISOString(), userId);
      return true;
    }
  },

  matching: {
    checkPotentialDuplicates: (itemData) => {
      const items = dbSql.items.all();
      const matches = [];

      items.forEach(existing => {
        if (existing.status === 'claimed' || existing.id === itemData.id) return;
        if (existing.type !== itemData.type) return;

        let score = 0;
        if (existing.category === itemData.category) score += 40;
        score += getSimilarity(existing.title, itemData.title) * 35;
        if (existing.location === itemData.location) {
          score += 25;
        } else {
          score += getSimilarity(existing.location, itemData.location) * 15;
        }

        if (score >= 50) {
          matches.push({ item: existing, confidence: Math.round(score) });
        }
      });

      return matches.sort((a, b) => b.confidence - a.confidence);
    },
    triggerMatchChecking: (newItem) => {
      const items = dbSql.items.all();
      const targetType = newItem.type === 'lost' ? 'found' : 'lost';

      items.forEach(existing => {
        if (existing.type !== targetType || existing.status === 'claimed') return;

        let score = 0;
        if (existing.category === newItem.category) score += 40;
        const textSim = getSimilarity(`${existing.title} ${existing.description}`, `${newItem.title} ${newItem.description}`);
        score += textSim * 35;

        if (existing.location === newItem.location) {
          score += 25;
        } else {
          score += getSimilarity(existing.location, newItem.location) * 15;
        }

        if (score >= 55) {
          const confidence = Math.round(score);
          dbSql.notifications.create({
            userId: newItem.reporterId,
            type: 'match_found',
            message: `Smart Match found! A similar ${targetType} item "${existing.title}" is listed at ${existing.location} (${confidence}% match score). Check it out!`,
            link: `items?id=${existing.id}`
          });
          dbSql.notifications.create({
            userId: existing.reporterId,
            type: 'match_found',
            message: `Smart Match found! A new similar ${newItem.type} item "${newItem.title}" has been reported at ${newItem.location} (${confidence}% match score).`,
            link: `items?id=${newItem.id}`
          });
        }
      });
    }
  }
};

module.exports = dbSql;
