const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'uploads';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function generateId(prefix = '') {
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

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

async function fetchAll(table) {
  const { data, error } = await supabase.from(table).select();
  if (error) throw error;
  return data || [];
}

function matchObject(row, predicate) {
  if (!predicate) return false;
  return Object.keys(predicate).every(key => {
    const value = predicate[key];
    return row[key] === value;
  });
}

const users = {
  async create(payload) {
    const record = { id: generateId('u_'), ...payload, createdAt: new Date().toISOString() };
    const { data, error } = await supabase.from('users').insert(record).select().single();
    if (error) throw error;
    return data;
  },
  async find(predicate) {
    const all = await fetchAll('users');
    if (typeof predicate === 'function') return all.find(predicate);
    return all.find(row => matchObject(row, predicate));
  },
  async findByEmail(email) {
    const { data, error } = await supabase.from('users').select().ilike('email', email).maybeSingle();
    if (error) throw error;
    return data || null;
  },
  async all() {
    return fetchAll('users');
  }
};

const items = {
  async create(payload) {
    const record = { id: generateId('it_'), status: payload.status || null, ...payload, createdAt: new Date().toISOString() };
    const { data, error } = await supabase.from('items').insert(record).select().single();
    if (error) throw error;
    return data;
  },
  async all() {
    return fetchAll('items');
  },
  async find(predicate) {
    const all = await fetchAll('items');
    if (typeof predicate === 'function') return all.find(predicate);
    return all.find(row => matchObject(row, predicate));
  },
  async delete(id) {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
  async update(id, patch) {
    const { data, error } = await supabase.from('items').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
};

const claims = {
  async create(payload) {
    const record = { id: generateId('c_'), status: 'pending', ...payload, createdAt: new Date().toISOString() };
    const { data, error } = await supabase.from('claims').insert(record).select().single();
    if (error) throw error;
    return data;
  },
  async filter(predicate) {
    const all = await fetchAll('claims');
    if (typeof predicate === 'function') return all.filter(predicate);
    return all.filter(row => matchObject(row, predicate));
  },
  async find(predicate) {
    const all = await fetchAll('claims');
    if (typeof predicate === 'function') return all.find(predicate);
    return all.find(row => matchObject(row, predicate));
  },
  async updateStatus(id, status) {
    const { data, error } = await supabase.from('claims').update({ status }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
};

const chats = {
  async getUserRooms(userId) {
    const { data, error } = await supabase.from('chats').select();
    if (error) throw error;
    return (data || []).filter(room => Array.isArray(room.members) && room.members.includes(userId));
  },
  async findRoom(id) {
    const { data, error } = await supabase.from('chats').select().eq('id', id).maybeSingle();
    if (error) throw error;
    return data || null;
  },
  async addMessage(roomId, message) {
    const room = await this.findRoom(roomId);
    if (!room) return null;
    const messages = Array.isArray(room.messages) ? room.messages : [];
    const msg = { id: generateId('m_'), ...message, createdAt: new Date().toISOString() };
    messages.push(msg);
    const { data, error } = await supabase.from('chats').update({ messages }).eq('id', roomId).select().single();
    if (error) throw error;
    return msg;
  }
};

const notifications = {
  async getUserNotifications(userId) {
    const { data, error } = await supabase.from('notifications').select().eq('userId', userId);
    if (error) throw error;
    return data || [];
  },
  async markAllRead(userId) {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('userId', userId);
    if (error) throw error;
    return true;
  }
};

function checkPotentialDuplicates({ title, description, category, location, type }) {
  // simple local duplicate search from all items
  const scoreFn = (existing) => {
    if (existing.type !== type) return 0;
    let score = 0;
    if (existing.category === category) score += 45;
    const words1 = new Set((existing.title + ' ' + existing.description).toLowerCase().split(/\s+/));
    const words2 = new Set((title + ' ' + description).toLowerCase().split(/\s+/));
    let intersection = 0;
    for (const w of words1) if (words2.has(w)) intersection++;
    const union = new Set([...words1, ...words2]).size;
    score += union > 0 ? (intersection / union) * 35 : 0;
    if (existing.location === location) score += 20;
    return score;
  };

  return fetchAll('items').then(all => {
    return all
      .map(existing => ({ item: existing, score: scoreFn(existing) }))
      .filter(result => result.score >= 45)
      .sort((a, b) => b.score - a.score)
      .map(result => result.item);
  });
}

module.exports = {
  uploadBufferToStorage,
  users,
  items,
  claims,
  chats,
  notifications,
  matching: { checkPotentialDuplicates }
};