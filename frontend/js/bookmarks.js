const KEY = 'lodestar.bookmarks';
const MAX = 200;

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
    return false;
  }
  items.unshift({
    url: href,
    title: String(title || href).slice(0, 200),
    added: Date.now(),
  });
  write(items.slice(0, MAX));
  return true;
}

export function remove(url) {
  const href = normalizeUrl(url);
  write(
    read().filter(function (item) {
      return item.url !== href;
    })
  );
}
