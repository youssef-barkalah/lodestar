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

export async function register(username, password) {
  const data = await request('/api/auth/register', 'POST', {
    username,
    password,
  });
  write({ token: data.token, username: data.username });
  return data;
}

export async function login(username, password) {
  const data = await request('/api/auth/login', 'POST', {
    username,
    password,
  });
  write({ token: data.token, username: data.username });
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
