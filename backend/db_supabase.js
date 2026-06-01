const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'uploads';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function generateId(prefix = '') {
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Simple similarity function for duplicate checks and matches
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

// Helper to upload image to Supabase Storage
async function uploadBufferToStorage(folder, filename, buffer, contentType = 'application/octet-stream') {
  const path = `${folder}/${filename}`;
  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, buffer, {
    contentType,
    upsert: false
  });
  if (error) throw error;

  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  return data?.publicUrl || `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
}

// --- MAPPING UTILITIES ---

function toDbUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullname: user.fullName,
    department: user.department,
    password: user.password,
    role: user.role,
    createdat: user.createdAt
  };
}

function fromDbUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullname,
    department: row.department,
    password: row.password,
    role: row.role,
    createdAt: row.createdat
  };
}

function toDbItem(item) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    type: item.type,
    location: item.location,
    date: item.date,
    reporterid: item.reporterId,
    reporteremail: item.reporterEmail,
    reportername: item.reporterName,
    imageurl: item.imageUrl,
    status: item.status,
    createdat: item.createdAt
  };
}

function fromDbItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    type: row.type,
    location: row.location,
    date: row.date,
    reporterId: row.reporterid,
    reporterEmail: row.reporteremail,
    reporterName: row.reportername,
    imageUrl: row.imageurl,
    status: row.status,
    createdAt: row.createdat
  };
}

function toDbClaim(claim) {
  return {
    id: claim.id,
    itemid: claim.itemId,
    itemtitle: claim.itemTitle,
    claimerid: claim.claimerId,
    claimername: claim.claimerName,
    claimeremail: claim.claimerEmail,
    proofdescription: claim.proofDescription,
    studentcardurl: claim.studentCardUrl,
    status: claim.status,
    createdat: claim.createdAt
  };
}

function fromDbClaim(row) {
  if (!row) return null;
  return {
    id: row.id,
    itemId: row.itemid,
    itemTitle: row.itemtitle,
    claimerId: row.claimerid,
    claimerName: row.claimername,
    claimerEmail: row.claimeremail,
    proofDescription: row.proofdescription,
    studentCardUrl: row.studentcardurl,
    status: row.status,
    createdAt: row.createdat
  };
}

function toDbNotification(ntf) {
  const bodyText = ntf.link ? `${ntf.message}||${ntf.link}` : ntf.message;
  return {
    id: ntf.id || generateId('ntf_'),
    userid: ntf.userId,
    title: ntf.type,
    body: bodyText,
    read: ntf.read ? true : false,
    createdat: ntf.createdAt || new Date().toISOString()
  };
}

function fromDbNotification(row) {
  if (!row) return null;
  const bodyText = row.body || '';
  const parts = bodyText.split('||');
  const message = parts[0];
  const link = parts[1] || '';
  return {
    id: row.id,
    userId: row.userid,
    type: row.title,
    message: message,
    link: link,
    read: row.read,
    createdAt: row.createdat
  };
}

// Room ID Parser
function parseRoomId(roomId) {
  const parts = roomId.split('_');
  if (parts.length >= 6) {
    const itemId = `${parts[0]}_${parts[1]}`;
    const reporterId = `${parts[2]}_${parts[3]}`;
    const claimerId = `${parts[4]}_${parts[5]}`;
    return { itemId, reporterId, claimerId };
  }
  return null;
}

// Enriches a raw Supabase chat room row with dynamic user names and item title
async function enrichChatRoom(room) {
  if (!room) return null;
  const parsed = parseRoomId(room.id);
  if (!parsed) return room;

  const { itemId, reporterId, claimerId } = parsed;

  const [item, reporter, claimer] = await Promise.all([
    supabase.from('items').select('title').eq('id', itemId).maybeSingle().then(r => r.data),
    supabase.from('users').select('fullname').eq('id', reporterId).maybeSingle().then(r => r.data),
    supabase.from('users').select('fullname').eq('id', claimerId).maybeSingle().then(r => r.data),
  ]);

  return {
    id: room.id,
    roomId: room.id,
    itemId,
    itemTitle: item?.title || room.title || 'Unknown Item',
    reporterId,
    reporterName: reporter?.fullname || 'Unknown User',
    claimerId,
    claimerName: claimer?.fullname || 'Unknown User',
    members: room.members || [],
    messages: room.messages || [],
    createdAt: room.createdat
  };
}

// --- MODULE IMPLEMENTATION ---

const users = {
  async create(payload) {
    const record = toDbUser({
      id: generateId('u_'),
      role: 'user',
      ...payload,
      createdAt: new Date().toISOString()
    });
    const { data, error } = await supabase.from('users').insert(record).select().single();
    if (error) throw error;
    return fromDbUser(data);
  },
  async find(predicate) {
    const { data, error } = await supabase.from('users').select();
    if (error) throw error;
    const jsUsers = (data || []).map(fromDbUser);
    if (typeof predicate === 'function') return jsUsers.find(predicate);
    return jsUsers.find(row => Object.keys(predicate).every(k => row[k] === predicate[k]));
  },
  async all() {
    const { data, error } = await supabase.from('users').select();
    if (error) throw error;
    return (data || []).map(fromDbUser);
  }
};

const items = {
  async create(payload) {
    const newItem = {
      id: generateId('it_'),
      status: payload.type === 'lost' ? 'lost' : 'found',
      ...payload,
      createdAt: new Date().toISOString()
    };
    const record = toDbItem(newItem);
    const { data, error } = await supabase.from('items').insert(record).select().single();
    if (error) throw error;
    
    const jsItem = fromDbItem(data);
    
    // Trigger Match Checking asynchronously (non-blocking)
    matching.triggerMatchChecking(jsItem).catch(console.error);
    
    return jsItem;
  },
  async all() {
    const { data, error } = await supabase.from('items').select();
    if (error) throw error;
    return (data || []).map(fromDbItem);
  },
  async find(predicate) {
    const { data, error } = await supabase.from('items').select();
    if (error) throw error;
    const jsItems = (data || []).map(fromDbItem);
    if (typeof predicate === 'function') return jsItems.find(predicate);
    return jsItems.find(row => Object.keys(predicate).every(k => row[k] === predicate[k]));
  },
  async delete(id) {
    // Delete claims associated with the item
    await supabase.from('claims').delete().eq('itemid', id);
    
    // Delete chats associated with the item
    // A chat room id starts with the item id followed by an underscore
    await supabase.from('chats').delete().like('id', `${id}\_%`);

    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
  async update(id, patch) {
    const record = {};
    if (patch.title !== undefined) record.title = patch.title;
    if (patch.description !== undefined) record.description = patch.description;
    if (patch.category !== undefined) record.category = patch.category;
    if (patch.type !== undefined) record.type = patch.type;
    if (patch.location !== undefined) record.location = patch.location;
    if (patch.date !== undefined) record.date = patch.date;
    if (patch.imageUrl !== undefined) record.imageurl = patch.imageUrl;
    if (patch.status !== undefined) record.status = patch.status;
    
    const { data, error } = await supabase.from('items').update(record).eq('id', id).select().single();
    if (error) throw error;
    return fromDbItem(data);
  }
};

const claims = {
  async create(claimData) {
    const claim = {
      id: generateId('c_'),
      status: 'pending',
      ...claimData,
      createdAt: new Date().toISOString()
    };
    const record = toDbClaim(claim);
    const { data, error } = await supabase.from('claims').insert(record).select().single();
    if (error) throw error;

    const jsClaim = fromDbClaim(data);

    // Notify item owner/finder
    const item = await items.find({ id: claimData.itemId });
    if (item) {
      await notifications.create({
        userId: item.reporterId,
        type: 'claim_received',
        message: `New claim request received from ${claimData.claimerName} for your item: "${item.title}".`,
        link: `dashboard?tab=claims`
      });
    }

    return jsClaim;
  },
  async filter(predicate) {
    const { data, error } = await supabase.from('claims').select();
    if (error) throw error;
    const jsClaims = (data || []).map(fromDbClaim);
    if (typeof predicate === 'function') return jsClaims.filter(predicate);
    return jsClaims.filter(row => Object.keys(predicate).every(k => row[k] === predicate[k]));
  },
  async find(predicate) {
    const { data, error } = await supabase.from('claims').select();
    if (error) throw error;
    const jsClaims = (data || []).map(fromDbClaim);
    if (typeof predicate === 'function') return jsClaims.find(predicate);
    return jsClaims.find(row => Object.keys(predicate).every(k => row[k] === predicate[k]));
  },
  async updateStatus(id, status) {
    // 1. Update claim status
    const { data: claimData, error } = await supabase.from('claims').update({ status }).eq('id', id).select().single();
    if (error) throw error;
    const claim = fromDbClaim(claimData);

    const item = await items.find({ id: claim.itemId });
    if (!item) return claim;

    if (status === 'approved') {
      // 2. Mark item as claimed
      await items.update(item.id, { status: 'claimed' });

      // 3. Reject all other pending claims for this item and notify claimers
      const allClaims = await claims.filter({ itemId: item.id });
      const otherPendingClaims = allClaims.filter(c => c.id !== id && c.status === 'pending');
      
      for (const otherClaim of otherPendingClaims) {
        await supabase.from('claims').update({ status: 'rejected' }).eq('id', otherClaim.id);
        
        await notifications.create({
          userId: otherClaim.claimerId,
          type: 'claim_rejected',
          message: `Your claim request for "${item.title}" was declined (item successfully recovered by another user).`,
          link: `dashboard?tab=my-claims`
        });
      }

      // 4. Create Chat room between finder and claimer if it doesn't exist
      const roomId = `${item.id}_${item.reporterId}_${claim.claimerId}`;
      const { data: existingRoom } = await supabase.from('chats').select().eq('id', roomId).maybeSingle();
      
      if (!existingRoom) {
        const newRoom = {
          id: roomId,
          title: item.title,
          members: [item.reporterId, claim.claimerId],
          messages: [
            {
              senderId: 'system',
              senderName: 'e-Lost & Found System',
              text: `Claim request approved! You can now securely coordinate a meetup location on campus to retrieve the item. Please bring proper identification (IIUI Student Card).`,
              timestamp: new Date().toISOString()
            }
          ]
        };
        await supabase.from('chats').insert(newRoom);
      }
    }

    // 5. Notify the claimer
    await notifications.create({
      userId: claim.claimerId,
      type: status === 'approved' ? 'claim_approved' : 'claim_rejected',
      message: status === 'approved'
        ? `Congratulations! Your claim for "${item.title}" has been APPROVED. Click here to chat with the finder.`
        : `Your claim for "${item.title}" has been rejected. Details did not match the item's criteria.`,
      link: status === 'approved' ? `dashboard?tab=messages` : `dashboard?tab=my-claims`
    });

    return claim;
  }
};

const chats = {
  async getUserRooms(userId) {
    const { data, error } = await supabase.from('chats').select();
    if (error) throw error;
    
    // Filter rooms where members array contains the userId
    const rooms = (data || []).filter(room => Array.isArray(room.members) && room.members.includes(userId));
    
    // Enrich each room
    const enrichedRooms = [];
    for (const r of rooms) {
      const enriched = await enrichChatRoom(r);
      if (enriched) enrichedRooms.push(enriched);
    }
    return enrichedRooms;
  },
  async findRoom(roomId) {
    const { data, error } = await supabase.from('chats').select().eq('id', roomId).maybeSingle();
    if (error) throw error;
    return data ? enrichChatRoom(data) : null;
  },
  async addMessage(roomId, message) {
    const room = await supabase.from('chats').select().eq('id', roomId).maybeSingle().then(r => r.data);
    if (!room) return null;

    const messages = Array.isArray(room.messages) ? room.messages : [];
    const msg = {
      id: generateId('m_'),
      senderId: message.senderId,
      senderName: message.senderName,
      text: message.text,
      timestamp: new Date().toISOString()
    };
    messages.push(msg);

    const { error } = await supabase.from('chats').update({ messages }).eq('id', roomId);
    if (error) throw error;
    return msg;
  }
};

const notifications = {
  async create(ntfData) {
    const ntf = {
      id: generateId('ntf_'),
      read: false,
      createdAt: new Date().toISOString(),
      ...ntfData
    };
    const record = toDbNotification(ntf);
    const { data, error } = await supabase.from('notifications').insert(record).select().single();
    if (error) throw error;
    return fromDbNotification(data);
  },
  async getUserNotifications(userId) {
    const { data, error } = await supabase.from('notifications').select().eq('userid', userId);
    if (error) throw error;
    
    const list = (data || []).map(fromDbNotification);
    // Sort descending by date
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async markAllRead(userId) {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('userid', userId);
    if (error) throw error;
    return true;
  }
};

const matching = {
  async checkPotentialDuplicates(itemData) {
    const all = await items.all();
    const matches = [];

    all.forEach(existing => {
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

  async triggerMatchChecking(newItem) {
    const all = await items.all();
    const targetType = newItem.type === 'lost' ? 'found' : 'lost';

    for (const existing of all) {
      if (existing.type !== targetType || existing.status === 'claimed') continue;

      let score = 0;
      if (existing.category === newItem.category) score += 40;
      
      const textSim = getSimilarity(
        `${existing.title} ${existing.description}`,
        `${newItem.title} ${newItem.description}`
      );
      score += textSim * 35;

      if (existing.location === newItem.location) {
        score += 25;
      } else {
        score += getSimilarity(existing.location, newItem.location) * 15;
      }

      if (score >= 55) {
        const confidence = Math.round(score);
        
        // Notify the new item reporter
        await notifications.create({
          userId: newItem.reporterId,
          type: 'match_found',
          message: `Smart Match found! A similar ${targetType} item "${existing.title}" is listed at ${existing.location} (${confidence}% match score). Check it out!`,
          link: `items?id=${existing.id}`
        });

        // Notify the existing item reporter
        await notifications.create({
          userId: existing.reporterId,
          type: 'match_found',
          message: `Smart Match found! A new similar ${newItem.type} item "${newItem.title}" has been reported at ${newItem.location} (${confidence}% match score).`,
          link: `items?id=${newItem.id}`
        });
      }
    }
  }
};

module.exports = {
  uploadBufferToStorage,
  users,
  items,
  claims,
  chats,
  notifications,
  matching
};
