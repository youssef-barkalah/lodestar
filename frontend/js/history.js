import { isLoggedIn, pushSync } from './account.js';

const HISTORY_KEY = 'lodestar.searchHistory';
const ITEMS_KEY = 'lodestar.historyItems';
const MAX_ITEMS = 25;
const MAX_ITEMS_ALWAYS = 100;
const VALID_TYPES = ['web', 'images', 'news', 'videos', 'maps'];

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {}
}

export function setting() {
  return read(HISTORY_KEY) || '24h';
}

function loadItems() {
  try {
    const raw = JSON.parse(read(ITEMS_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch (err) {
    return [];
  }
}

function saveItems(items) {
  write(ITEMS_KEY, JSON.stringify(items));
}

function isExpired(timestamp) {
  return setting() === '24h' && Date.now() - timestamp > 24 * 3600 * 1000;
}

let syncTimer = null;

function scheduleSync(items) {
  if (!isLoggedIn()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(function () {
    pushSync({ history: items, historySetting: setting() }).catch(function () {});
  }, 600);
}

export function record(query, type) {
  const q = String(query || '').trim().slice(0, 100);
  if (!q || setting() === 'off') return;

  const now = Date.now();
  let items = loadItems().filter(function (item) {
    return !isExpired(item.t);
  });
  items = items.filter(function (item) {
    return item.q !== q;
  });
  items.unshift({ q: q, t: now, type: type || 'web' });
  const max = setting() === 'always' ? MAX_ITEMS_ALWAYS : MAX_ITEMS;
  if (items.length > max) items = items.slice(0, max);
  saveItems(items);
  scheduleSync(items.slice(0, MAX_ITEMS_ALWAYS));
}

export function removeItem(query) {
  const q = String(query || '').trim();
  if (!q) return;
  const items = loadItems().filter(function (item) {
    return item.q !== q;
  });
  saveItems(items);
  scheduleSync(items.slice(0, MAX_ITEMS_ALWAYS));
}

export function recent() {
  if (setting() === 'off') return [];
  const items = loadItems().filter(function (item) {
    return !isExpired(item.t);
  });
  return items.slice(0, 10);
}

export function all() {
  if (setting() === 'off') return [];
  return loadItems().filter(function (item) {
    return !isExpired(item.t);
  });
}

export function clear() {
  saveItems([]);
  scheduleSync([]);
}

export function mergeRemote(remoteItems) {
  if (setting() === 'off') return;
  const local = loadItems();
  const map = new Map();
  local.forEach(function (item) {
    map.set(item.q, item);
  });
  (Array.isArray(remoteItems) ? remoteItems : []).forEach(function (item) {
    if (!item || typeof item.q !== 'string' || !item.q.trim()) return;
    const stamp = Number(item.t) || 0;
    const existing = map.get(item.q);
    if (!existing || stamp > (existing.t || 0)) {
      map.set(item.q.trim(), {
        q: item.q.trim(),
        t: stamp,
        type: VALID_TYPES.includes(item.type) ? item.type : 'web',
      });
    }
  });
  const merged = Array.from(map.values()).sort(function (a, b) {
    return (b.t || 0) - (a.t || 0);
  });
  const max = setting() === 'always' ? MAX_ITEMS_ALWAYS : MAX_ITEMS;
  saveItems(merged.slice(0, max));
}
