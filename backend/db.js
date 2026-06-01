const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database', 'db.json');

// Ensure database directory and file exist
function initializeDb() {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  if (!fs.existsSync(DB_PATH)) {
    const initialSchema = {
      users: [],
      items: [],
      claims: [],
      chats: [],
      notifications: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialSchema, null, 2), 'utf-8');
  }

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

initializeDb();

// Helper to read DB
function readDb() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file:', error);
    return { users: [], items: [], claims: [], chats: [], notifications: [] };
  }
}

// Helper to write DB
function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing database file:', error);
    return false;
  }
}

// Simple Levenshtein distance for fuzzy string comparison
function getSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  s1 = s1.toLowerCase().trim();
  s2 = s2.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  
  // Calculate keyword overlap
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  
  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? intersection / union : 0;
}

const db = {
  // --- USERS ---
  users: {
    find: (predicate) => {
      const dbData = readDb();
      return dbData.users.find(predicate);
    },
    create: (userData) => {
      const dbData = readDb();
      const newUser = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        role: 'user', // 'user' or 'admin'
        createdAt: new Date().toISOString(),
        ...userData
      };
      dbData.users.push(newUser);
      writeDb(dbData);
      return newUser;
    }
  },

  // --- ITEMS ---
  items: {
    all: () => {
      return readDb().items;
    },
    find: (predicate) => {
      const dbData = readDb();
      return dbData.items.find(predicate);
    },
    filter: (predicate) => {
      const dbData = readDb();
      return dbData.items.filter(predicate);
    },
    create: (itemData) => {
      const dbData = readDb();
      const newItem = {
        id: 'itm_' + Math.random().toString(36).substr(2, 9),
        status: itemData.type === 'lost' ? 'lost' : 'found', // 'lost', 'found', 'claimed'
        createdAt: new Date().toISOString(),
        ...itemData
      };
      
      dbData.items.push(newItem);
      writeDb(dbData);

      // Perform matching triggers
      db.matching.triggerMatchChecking(newItem);

      return newItem;
    },
    update: (id, updates) => {
      const dbData = readDb();
      const idx = dbData.items.findIndex(i => i.id === id);
      if (idx !== -1) {
        dbData.items[idx] = { ...dbData.items[idx], ...updates, updatedAt: new Date().toISOString() };
        writeDb(dbData);
        return dbData.items[idx];
      }
      return null;
    },
    delete: (id) => {
      const dbData = readDb();
      const initialLength = dbData.items.length;
      dbData.items = dbData.items.filter(i => i.id !== id);
      
      // Also delete claims related to this item
      dbData.claims = dbData.claims.filter(c => c.itemId !== id);
      
      const success = dbData.items.length < initialLength;
      if (success) {
        writeDb(dbData);
      }
      return success;
    }
  },

  // --- CLAIMS ---
  claims: {
    filter: (predicate) => {
      const dbData = readDb();
      return dbData.claims.filter(predicate);
    },
    find: (predicate) => {
      const dbData = readDb();
      return dbData.claims.find(predicate);
    },
    create: (claimData) => {
      const dbData = readDb();
      const newClaim = {
        id: 'clm_' + Math.random().toString(36).substr(2, 9),
        status: 'pending', // 'pending', 'approved', 'rejected'
        createdAt: new Date().toISOString(),
        ...claimData
      };
      dbData.claims.push(newClaim);
      writeDb(dbData);

      // Notify owner/finder of claim request
      const item = dbData.items.find(i => i.id === claimData.itemId);
      if (item) {
        db.notifications.create({
          userId: item.reporterId,
          type: 'claim_received',
          message: `New claim request received from ${claimData.claimerName} for your item: "${item.title}".`,
          link: `dashboard?tab=claims`
        });
      }

      return newClaim;
    },
    updateStatus: (id, status) => {
      const dbData = readDb();
      const claimIdx = dbData.claims.findIndex(c => c.id === id);
      if (claimIdx === -1) return null;
      
      const claim = dbData.claims[claimIdx];
      claim.status = status;
      claim.updatedAt = new Date().toISOString();
      
      const item = dbData.items.find(i => i.id === claim.itemId);
      
      if (status === 'approved' && item) {
        // Mark item as claimed
        item.status = 'claimed';
        
        // Reject all other pending claims for this item
        dbData.claims.forEach(c => {
          if (c.itemId === item.id && c.id !== id && c.status === 'pending') {
            c.status = 'rejected';
            c.updatedAt = new Date().toISOString();
            
            // Notify other claimers of rejection
            dbData.notifications.push({
              id: 'ntf_' + Math.random().toString(36).substr(2, 9),
              userId: c.claimerId,
              type: 'claim_rejected',
              message: `Your claim request for "${item.title}" was declined (item successfully recovered by another user).`,
              link: `dashboard?tab=my-claims`,
              read: false,
              createdAt: new Date().toISOString()
            });
          }
        });

        // Create Chat room between finder and claimer if it doesn't exist
        const roomId = `${item.id}_${item.reporterId}_${claim.claimerId}`;
        const chatExists = dbData.chats.some(c => c.roomId === roomId);
        if (!chatExists) {
          dbData.chats.push({
            id: 'cht_' + Math.random().toString(36).substr(2, 9),
            roomId,
            itemId: item.id,
            itemTitle: item.title,
            reporterId: item.reporterId,
            reporterName: item.reporterName,
            claimerId: claim.claimerId,
            claimerName: claim.claimerName,
            messages: [
              {
                senderId: 'system',
                senderName: 'e-Lost & Found System',
                text: `Claim request approved! You can now securely coordinate a meetup location on campus to retrieve the item. Please bring proper identification (IIUI Student Card).`,
                timestamp: new Date().toISOString()
              }
            ],
            createdAt: new Date().toISOString()
          });
        }
      }

      // Notify the claimer
      if (item) {
        dbData.notifications.push({
          id: 'ntf_' + Math.random().toString(36).substr(2, 9),
          userId: claim.claimerId,
          type: status === 'approved' ? 'claim_approved' : 'claim_rejected',
          message: status === 'approved' 
            ? `Congratulations! Your claim for "${item.title}" has been APPROVED. Click here to chat with the finder.` 
            : `Your claim for "${item.title}" has been rejected. Details did not match the item's criteria.`,
          link: status === 'approved' ? `dashboard?tab=messages` : `dashboard?tab=my-claims`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      writeDb(dbData);
      return claim;
    }
  },

  // --- CHATS ---
  chats: {
    findRoom: (roomId) => {
      const dbData = readDb();
      return dbData.chats.find(c => c.roomId === roomId);
    },
    getUserRooms: (userId) => {
      const dbData = readDb();
      return dbData.chats.filter(c => c.reporterId === userId || c.claimerId === userId);
    },
    addMessage: (roomId, messageData) => {
      const dbData = readDb();
      const chatIdx = dbData.chats.findIndex(c => c.roomId === roomId);
      if (chatIdx === -1) return null;

      const newMessage = {
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        text: messageData.text,
        timestamp: new Date().toISOString()
      };

      dbData.chats[chatIdx].messages.push(newMessage);
      writeDb(dbData);
      return newMessage;
    }
  },

  // --- NOTIFICATIONS ---
  notifications: {
    getUserNotifications: (userId) => {
      const dbData = readDb();
      return dbData.notifications.filter(n => n.userId === userId).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    create: (ntfData) => {
      const dbData = readDb();
      const newNtf = {
        id: 'ntf_' + Math.random().toString(36).substr(2, 9),
        read: false,
        createdAt: new Date().toISOString(),
        ...ntfData
      };
      dbData.notifications.push(newNtf);
      writeDb(dbData);
      return newNtf;
    },
    markAllRead: (userId) => {
      const dbData = readDb();
      dbData.notifications.forEach(n => {
        if (n.userId === userId) n.read = true;
      });
      writeDb(dbData);
      return true;
    }
  },

  // --- DUPLICATE DETECTION AND SMART MATCHING ENGINE ---
  matching: {
    checkPotentialDuplicates: (itemData) => {
      const items = db.items.all();
      // Look for duplicate items of the same type or similar reports in the system
      const matches = [];
      
      items.forEach(existing => {
        // Exclude claimed items or the same item
        if (existing.status === 'claimed' || existing.id === itemData.id) return;
        // Verify duplicate condition: same type (both lost, or both found)
        if (existing.type !== itemData.type) return;

        let score = 0;
        
        // 1. Category match
        if (existing.category === itemData.category) score += 40;
        
        // 2. Title word similarity
        const titleSim = getSimilarity(existing.title, itemData.title);
        score += titleSim * 35;
        
        // 3. Location match
        if (existing.location === itemData.location) {
          score += 25;
        } else {
          const locSim = getSimilarity(existing.location, itemData.location);
          score += locSim * 15;
        }

        if (score >= 50) {
          matches.push({ item: existing, confidence: Math.round(score) });
        }
      });

      return matches.sort((a, b) => b.confidence - a.confidence);
    },

    triggerMatchChecking: (newItem) => {
      const dbData = readDb();
      const items = dbData.items;
      
      // We want to match: Lost item matches with Found items, and vice versa
      const targetType = newItem.type === 'lost' ? 'found' : 'lost';

      items.forEach(existing => {
        if (existing.type !== targetType || existing.status === 'claimed') return;

        let score = 0;

        // 1. Category Check
        if (existing.category === newItem.category) score += 40;

        // 2. Title & Description check
        const textSim = getSimilarity(`${existing.title} ${existing.description}`, `${newItem.title} ${newItem.description}`);
        score += textSim * 35;

        // 3. Location Check
        if (existing.location === newItem.location) {
          score += 25;
        } else {
          const locSim = getSimilarity(existing.location, newItem.location);
          score += locSim * 15;
        }

        if (score >= 55) {
          const confidence = Math.round(score);
          
          // Match detected! Dispatch alerts to BOTH users.
          // 1. Notify the new item reporter
          dbData.notifications.push({
            id: 'ntf_' + Math.random().toString(36).substr(2, 9),
            userId: newItem.reporterId,
            type: 'match_found',
            message: `Smart Match found! A similar ${targetType} item "${existing.title}" is listed at ${existing.location} (${confidence}% match score). Check it out!`,
            link: `items?id=${existing.id}`,
            read: false,
            createdAt: new Date().toISOString()
          });

          // 2. Notify the existing item reporter
          dbData.notifications.push({
            id: 'ntf_' + Math.random().toString(36).substr(2, 9),
            userId: existing.reporterId,
            type: 'match_found',
            message: `Smart Match found! A new similar ${newItem.type} item "${newItem.title}" has been reported at ${newItem.location} (${confidence}% match score).`,
            link: `items?id=${newItem.id}`,
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      });

      writeDb(dbData);
    }
  }
};

module.exports = db;
