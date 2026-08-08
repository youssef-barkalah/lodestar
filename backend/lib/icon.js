import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICON_URL = 'https://www.google.com/s2/favicons';
const ICON_TIMEOUT = 4000;
const cache = new Map();

const CACHE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '.cache',
  'icons'
);

function cacheKey(clean) {
  return createHash('sha1').update(clean).digest('hex');
}

function loadFromDisk(clean) {
  try {
    const base = join(CACHE_DIR, cacheKey(clean));
    const bodyFile = base + '.bin';
    const typeFile = base + '.type';
    if (!existsSync(bodyFile) || !existsSync(typeFile)) return null;
    return {
      type: readFileSync(typeFile, 'utf8'),
      body: readFileSync(bodyFile),
    };
  } catch (err) {
    return null;
  }
}

function saveToDisk(clean, icon) {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    const base = join(CACHE_DIR, cacheKey(clean));
    writeFileSync(base + '.bin', icon.body);
    writeFileSync(base + '.type', icon.type);
  } catch (err) {}
}

export function clearIconCache() {
  cache.clear();
  try {
    rmSync(CACHE_DIR, { recursive: true, force: true });
  } catch (err) {}
}

export function fallbackIcon(domain) {
  const letter = (domain.replace(/^www\./i, '')[0] || '?').toUpperCase();
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">' +
    '<rect width="64" height="64" rx="14" fill="#7c5cf0"/>' +
    '<text x="32" y="45" font-family="Arial, sans-serif" font-size="34" font-weight="600" fill="#ffffff" text-anchor="middle">' +
    letter +
    '</text></svg>';
  return Buffer.from(svg);
}

export async function getIcon(domain) {
  const clean = String(domain || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.-]/g, '');
  if (!clean) return { type: 'image/svg+xml', body: fallbackIcon('') };

  const cached = cache.get(clean);
  if (cached) return cached;

  const fromDisk = loadFromDisk(clean);
  if (fromDisk) {
    cache.set(clean, fromDisk);
    return fromDisk;
  }

  let icon = null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ICON_TIMEOUT);
  try {
    const res = await fetch(
      ICON_URL + '?domain=' + encodeURIComponent(clean) + '&sz=64',
      { signal: controller.signal }
    );
    if (res.ok) {
      const body = Buffer.from(await res.arrayBuffer());
      icon = {
        type: res.headers.get('content-type') || 'image/png',
        body,
      };
    }
  } catch (err) {
  } finally {
    clearTimeout(timer);
  }

  if (!icon) icon = { type: 'image/svg+xml', body: fallbackIcon(clean) };
  cache.set(clean, icon);
  saveToDisk(clean, icon);
  return icon;
}
