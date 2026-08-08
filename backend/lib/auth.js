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
  theme: 'system',
  suggestions: 'on',
};

async function findUserBy(field, value) {
  const result = await db(
    'GET',
    '/users?select=id,username,salt,hash,token,token_at&' +
      field +
      '=eq.' +
      encode(value)
  );
  if (!result.ok || !Array.isArray(result.data) || !result.data.length) {
    return null;
  }
  return result.data[0];
}

async function setToken(userId, token) {
  const value = token === null ? null : new Date().toISOString();
  await db(
    'PATCH',
    '/users?id=eq.' + encode(userId),
    { token: token, token_at: value },
  );
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
  return login(username, password);
}

export async function login(username, password) {
  const name = String(username || '').trim();
  const account = await findUserBy('username', name);
  if (!account || !verifyPassword(String(password || ''), account)) {
    throw new Error('Unknown username or wrong password.');
  }
  const token = newToken();
  await setToken(account.id, token);
  return { token, username: account.username };
}

export async function logout(token) {
  if (!token) return;
  const account = await findUserBy('token', token);
  if (account) await setToken(account.id, null);
}

export async function session(token) {
  if (!token) return null;
  const account = await findUserBy('token', token);
  if (!account || !account.token_at) return null;
  if (Date.now() - Date.parse(account.token_at) > TOKEN_TTL) {
    await setToken(account.id, null);
    return null;
  }
  const syncResult = await db(
    'GET',
    '/user_sync?select=*&id=eq.' + encode(account.id)
  );
  const row =
    syncResult.ok && Array.isArray(syncResult.data) && syncResult.data[0]
      ? syncResult.data[0]
      : null;
  const sync = row
    ? {
        historySetting:
          typeof row.history_setting === 'string'
            ? row.history_setting
            : '24h',
        theme: typeof row.theme === 'string' ? row.theme : 'system',
        suggestions:
          typeof row.suggestions === 'string' ? row.suggestions : 'on',
        history: Array.isArray(row.history) ? row.history : [],
      }
    : DEFAULT_SYNC;
  return { username: account.username, sync };
}

export async function setSync(token, sync) {
  const account = await findUserBy('token', token);
  if (!account) return false;
  const result = await db(
    'POST',
    '/user_sync?on_conflict=id',
    {
      id: account.id,
      history_setting: sync.historySetting || '24h',
      theme: sync.theme || 'system',
      suggestions: sync.suggestions || 'on',
      history: Array.isArray(sync.history) ? sync.history : [],
      updated_at: new Date().toISOString(),
    },
  );
  return result.ok;
}
