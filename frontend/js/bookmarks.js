import { isLoggedIn, pushSync } from './account.js';

const KEY = 'lodestar.bookmarks';
const MAX = 200;

let syncTimer = null;

function scheduleSync(items) {
  if (!isLoggedIn()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(function () {
    pushSync({ bookmarks: items }).catch(function () {});
  }, 600);
}

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch (err) {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (err) {}
}

function normalizeUrl(url) {
  try {
    return new URL(url).href;
  } catch (err) {
    return String(url || '');
  }
}

export function all() {
  return read();
}

export function isSaved(url) {
  const href = normalizeUrl(url);
  return read().some(function (item) {
    return item.url === href;
  });
}

export function toggle(url, title) {
  const href = normalizeUrl(url);
  let items = read();
  const existing = items.find(function (item) {
    return item.url === href;
  });
  if (existing) {
    items = items.filter(function (item) {
      return item.url !== href;
    });
    write(items);
    scheduleSync(items);
    return false;
  }
  items.unshift({
    url: href,
    title: String(title || href).slice(0, 200),
    added: Date.now(),
  });
  write(items.slice(0, MAX));
  scheduleSync(items.slice(0, MAX));
  return true;
}

export function remove(url) {
  const href = normalizeUrl(url);
  const items = read().filter(function (item) {
    return item.url !== href;
  });
  write(items);
  scheduleSync(items);
}

export function mergeRemote(remoteItems) {
  const local = read();
  const map = new Map();
  local.forEach(function (item) {
    map.set(item.url, item);
  });
  (Array.isArray(remoteItems) ? remoteItems : []).forEach(function (item) {
    if (!item || typeof item.url !== 'string' || !item.url) return;
    const href = normalizeUrl(item.url);
    const stamp = Number(item.added) || 0;
    const existing = map.get(href);
    if (!existing || stamp > (Number(existing.added) || 0)) {
      map.set(href, {
        url: href,
        title: String(item.title || href).slice(0, 200),
        added: stamp || Date.now(),
      });
    }
  });
  const merged = Array.from(map.values()).sort(function (a, b) {
    return (b.added || 0) - (a.added || 0);
  });
  write(merged.slice(0, MAX));
}
