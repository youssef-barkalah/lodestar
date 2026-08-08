import { suggestSites } from './websites.js';

const DDG_URL = 'https://duckduckgo.com/ac/';
const CACHE_TTL = 60000;
const cache = new Map();

async function fromDuckDuckGo(query) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(
      DDG_URL + '?q=' + encodeURIComponent(query) + '&type=list',
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'lodestar-backend/0.1 (local development)',
        },
        signal: controller.signal,
      }
    );
    if (!res.ok) return [];
    const body = await res.json();
    const list = Array.isArray(body) && Array.isArray(body[1]) ? body[1] : [];
    return list.filter((x) => typeof x === 'string').slice(0, 10);
  } catch (err) {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function getSuggestions(query) {
  const q = String(query || '').trim();
  if (!q) return [];

  const key = q.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.list;

  let list = await fromDuckDuckGo(q);
  if (!list.length) list = suggestSites(q);

  cache.set(key, { list, at: Date.now() });
  return list;
}
