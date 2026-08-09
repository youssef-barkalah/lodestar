const DEFAULT_TTL = 5 * 60 * 1000;
const MAX_ENTRIES = 500;
const store = new Map();

function prune() {
  const now = Date.now();
  if (store.size < MAX_ENTRIES) return;
  let oldest = now;
  let oldestKey = null;
  store.forEach(function (entry, key) {
    if (entry.at < oldest) {
      oldest = entry.at;
      oldestKey = key;
    }
  });
  if (oldestKey !== null) store.delete(oldestKey);
}

export function get(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.at > entry.ttl) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function set(key, value, ttl) {
  prune();
  store.set(key, { value, at: Date.now(), ttl: ttl || DEFAULT_TTL });
}

export function clear() {
  store.clear();
}
