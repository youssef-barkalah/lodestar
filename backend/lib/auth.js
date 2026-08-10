import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';

const SUPABASE_URL = config.supabaseUrl;
const SERVICE_KEY = config.supabaseServiceRole;
const TOKEN_TTL = 30 * 24 * 3600 * 1000;

function assertConfigured() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error(
      'Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env and run backend/data/supabase-schema.sql in your Supabase project.'
    );
  }
}

function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: 'Bearer ' + SERVICE_KEY,
    'Content-Type': 'application/json',
  };
}

function encode(value) {
  return encodeURIComponent(value);
}

function messageFrom(data) {
  if (data && data.message) return data.message;
  if (data && data.msg) return data.msg;
  return 'Something went wrong. Please try again.';
}

async function db(method, path, body) {
  assertConfigured();
  const res = await fetch(SUPABASE_URL + '/rest/v1' + path, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(function () {
    return null;
  });
  return { status: res.status, ok: res.ok, data };
}

function hashPassword(password, salt) {
  return scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, account) {
  const expected = Buffer.from(account.hash, 'hex');
  const actual = Buffer.from(hashPassword(password, account.salt), 'hex');
  return (
    expected.length === actual.length && timingSafeEqual(expected, actual)
  );
}

function validUsername(username) {
  return /^[a-zA-Z0-9_.-]{3,20}$/.test(username);
}

function newToken() {
  return randomBytes(32).toString('hex');
}

const DEFAULT_SYNC = {
  historySetting: '24h',
  history: [],
  bookmarks: [],
  theme: 'system',
  suggestions: 'on',
  language: 'en',
};

function userPublic(user) {
  return {
    username: user.username,
    displayName: user.display_name || '',
    bio: user.bio || '',
    avatar: user.avatar || '',
    created: user.created_at || null,
  };
}

async function findUserBy(field, value) {
  const result = await db(
    'GET',
    '/users?select=*&' + field + '=eq.' + encode(value)
  );
  if (!result.ok || !Array.isArray(result.data) || !result.data.length) {
    return null;
  }
  return result.data[0];
}

async function findUserById(userId) {
  const result = await db(
    'GET',
    '/users?select=*&id=eq.' + encode(userId)
  );
  if (!result.ok || !Array.isArray(result.data) || !result.data.length) {
    return null;
  }
  return result.data[0];
}

async function findSession(token) {
  const result = await db(
    'GET',
    '/sessions?select=*&token=eq.' + encode(token)
  );
  if (!result.ok || !Array.isArray(result.data) || !result.data.length) {
    return null;
  }
  return result.data[0];
}

async function createSession(userId, label) {
  const token = newToken();
  const now = new Date().toISOString();
  const result = await db('POST', '/sessions', {
    token,
    user_id: userId,
    created_at: now,
    last_seen: now,
    label: label || null,
  });
  if (!result.ok) {
    throw new Error(messageFrom(result.data));
  }
  return token;
}

async function loadSync(userId) {
  const result = await db(
    'GET',
    '/user_sync?select=*&id=eq.' + encode(userId)
  );
  const row =
    result.ok && Array.isArray(result.data) && result.data[0]
      ? result.data[0]
      : null;
  if (!row) return DEFAULT_SYNC;
  return {
    historySetting:
      typeof row.history_setting === 'string'
        ? row.history_setting
        : '24h',
    theme: typeof row.theme === 'string' ? row.theme : 'system',
    suggestions:
      typeof row.suggestions === 'string' ? row.suggestions : 'on',
    language: typeof row.language === 'string' ? row.language : 'en',
    history: Array.isArray(row.history) ? row.history : [],
    bookmarks: Array.isArray(row.bookmarks) ? row.bookmarks : [],
  };
}

export async function register(username, password) {
  const name = String(username || '').trim();
  if (!validUsername(name)) {
    throw new Error(
      'Username must be 3-20 characters (letters, numbers, . _ -).'
    );
  }
  if (!password || String(password).length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  const salt = randomBytes(16).toString('hex');
  const result = await db('POST', '/users', {
    username: name,
    salt,
    hash: hashPassword(String(password), salt),
  });
  if (!result.ok) {
    if (
      result.status === 409 ||
      /duplicate key|23505/i.test(messageFrom(result.data))
    ) {
      throw new Error('That username is already taken.');
    }
    throw new Error(messageFrom(result.data));
  }
  const user = await findUserBy('username', name);
  const token = await createSession(user.id, null);
  return Object.assign({ token }, userPublic(user));
}

export async function login(username, password) {
  const name = String(username || '').trim();
  const account = await findUserBy('username', name);
  if (!account || !verifyPassword(String(password || ''), account)) {
    throw new Error('Unknown username or wrong password.');
  }
  const token = await createSession(account.id, null);
  return Object.assign({ token }, userPublic(account));
}

export async function logout(token) {
  if (!token) return;
  await db('DELETE', '/sessions?token=eq.' + encode(token));
}

export async function session(token) {
  if (!token) return null;
  const row = await findSession(token);
  if (!row) return null;
  if (Date.now() - Date.parse(row.last_seen || row.created_at) > TOKEN_TTL) {
    await db('DELETE', '/sessions?token=eq.' + encode(token));
    return null;
  }
  const user = await findUserById(row.user_id);
  if (!user) {
    await db('DELETE', '/sessions?token=eq.' + encode(token));
    return null;
  }
  db('PATCH', '/sessions?token=eq.' + encode(token), {
    last_seen: new Date().toISOString(),
  }).catch(function () {});
  const sync = await loadSync(user.id);
  return Object.assign({}, userPublic(user), { sync });
}

export async function changePassword(token, current, next) {
  const row = await findSession(token);
  if (!row) return;
  const account = await findUserById(row.user_id);
  if (!account) return;
  if (!verifyPassword(String(current || ''), account)) {
    throw new Error('Current password is not correct.');
  }
  const salt = randomBytes(16).toString('hex');
  await db(
    'PATCH',
    '/users?id=eq.' + encode(account.id),
    { salt, hash: hashPassword(String(next), salt) },
  );
}

export async function updateProfile(token, profile) {
  const row = await findSession(token);
  if (!row) return false;
  const result = await db(
    'PATCH',
    '/users?id=eq.' + encode(row.user_id),
    {
      display_name: String(profile.displayName || '').slice(0, 40),
      bio: String(profile.bio || '').slice(0, 300),
    },
  );
  return result.ok;
}

export async function setAvatar(token, data) {
  const row = await findSession(token);
  if (!row) return false;
  const result = await db(
    'PATCH',
    '/users?id=eq.' + encode(row.user_id),
    { avatar: data },
  );
  return result.ok;
}

export async function clearAvatar(token) {
  const row = await findSession(token);
  if (!row) return false;
  const result = await db(
    'PATCH',
    '/users?id=eq.' + encode(row.user_id),
    { avatar: null },
  );
  return result.ok;
}

export async function deleteAccount(token) {
  const row = await findSession(token);
  if (!row) return;
  await db('DELETE', '/users?id=eq.' + encode(row.user_id));
}

export async function listSessions(token) {
  const row = await findSession(token);
  if (!row) return [];
  const result = await db(
    'GET',
    '/sessions?select=token,created_at,last_seen,label&user_id=eq.' +
      encode(row.user_id) +
      '&order=last_seen.desc'
  );
  if (!result.ok || !Array.isArray(result.data)) return [];
  return result.data;
}

export async function revokeSession(token, sessionToken) {
  if (!sessionToken) return;
  const row = await findSession(token);
  if (!row) return;
  await db(
    'DELETE',
    '/sessions?token=eq.' +
      encode(sessionToken) +
      '&user_id=eq.' +
      encode(row.user_id)
  );
}

export async function revokeAllSessions(token) {
  const row = await findSession(token);
  if (!row) return;
  await db('DELETE', '/sessions?user_id=eq.' + encode(row.user_id));
}

export async function setSync(token, sync) {
  const row = await findSession(token);
  if (!row) return false;
  const result = await db(
    'POST',
    '/user_sync?on_conflict=id',
    {
      id: row.user_id,
      history_setting: sync.historySetting || '24h',
      theme: sync.theme || 'system',
      suggestions: sync.suggestions || 'on',
      language: sync.language || 'en',
      history: Array.isArray(sync.history) ? sync.history : [],
      bookmarks: Array.isArray(sync.bookmarks) ? sync.bookmarks : [],
      updated_at: new Date().toISOString(),
    },
  );
  return result.ok;
}
