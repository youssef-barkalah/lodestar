import { API_URL } from './api.js';

const SESSION_KEY = 'lodestar.account';

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    return raw && raw.token ? raw : null;
  } catch (err) {
    return null;
  }
}

function write(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {}
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (err) {}
}

export function getSession() {
  return read();
}

export function isLoggedIn() {
  return !!read();
}

export function refreshSession(fields) {
  const current = read();
  if (current) write(Object.assign({}, current, fields || {}));
}

async function request(path, method, body, token) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = 'Bearer ' + token;
  const options = { method: method || 'GET', headers };
  if (body !== undefined) options.body = JSON.stringify(body);
  const response = await fetch(API_URL + path, options);
  const data = await response.json().catch(function () {
    return {};
  });
  if (!response.ok) {
    if (response.status === 401 && token) clearSession();
    throw new Error(
      (data && data.error && data.error.message) ||
        'Something went wrong. Please try again.'
    );
  }
  return data;
}

function storeSession(data) {
  write({
    token: data.token,
    username: data.username,
    displayName: data.displayName || '',
    avatar: data.avatar || '',
  });
}

export async function register(username, password) {
  const data = await request('/api/auth/register', 'POST', {
    username,
    password,
  });
  storeSession(data);
  return data;
}

export async function login(username, password) {
  const data = await request('/api/auth/login', 'POST', {
    username,
    password,
  });
  storeSession(data);
  return data;
}

export async function logout() {
  const session = read();
  if (session) {
    try {
      await request('/api/auth/logout', 'POST', undefined, session.token);
    } catch (err) {}
  }
  clearSession();
}

export async function getAccount() {
  const session = read();
  if (!session) return null;
  const data = await request('/api/account', 'GET', undefined, session.token);
  return Object.assign({}, session, data);
}

export async function updateAccount(patch) {
  const session = read();
  if (!session) return null;
  const data = await request('/api/account', 'PATCH', patch, session.token);
  const next = Object.assign({}, session, {
    displayName: data.displayName || '',
  });
  write(next);
  return next;
}

export async function uploadAvatar(data) {
  const session = read();
  if (!session) return;
  await request('/api/account/avatar', 'PUT', { data }, session.token);
  write(Object.assign({}, session, { avatar: data }));
}

export async function removeAvatar() {
  const session = read();
  if (!session) return;
  await request('/api/account/avatar', 'DELETE', undefined, session.token);
  write(Object.assign({}, session, { avatar: '' }));
}

export async function changePassword(current, next) {
  const session = read();
  if (!session) return;
  await request('/api/auth/password', 'POST', { current, next }, session.token);
}

export async function deleteAccount() {
  const session = read();
  if (session) {
    try {
      await request('/api/auth/account', 'DELETE', undefined, session.token);
    } catch (err) {}
  }
  clearSession();
}

export async function listSessions() {
  const session = read();
  if (!session) return [];
  const data = await request('/api/sessions', 'GET', undefined, session.token);
  return Array.isArray(data.sessions) ? data.sessions : [];
}

export async function revokeSession(token) {
  const session = read();
  if (!session) return;
  await request(
    '/api/sessions/' + encodeURIComponent(token),
    'DELETE',
    undefined,
    session.token
  );
}

export async function revokeAllSessions() {
  const session = read();
  if (!session) return;
  await request('/api/sessions', 'DELETE', undefined, session.token);
}

export async function pullSync() {
  const session = read();
  if (!session) return null;
  return request('/api/sync', 'GET', undefined, session.token);
}

export async function pushSync(payload) {
  const session = read();
  if (!session) return;
  await request('/api/sync', 'POST', payload, session.token);
}
