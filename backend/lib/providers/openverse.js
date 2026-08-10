import { config } from '../config.js';

const API = 'https://api.openverse.org/v1/images/';
const PAGE_SIZE = 20;

const LICENSES = {
  by: 'CC BY',
  'by-sa': 'CC BY-SA',
  'by-nc': 'CC BY-NC',
  'by-nc-sa': 'CC BY-NC-SA',
  'by-nd': 'CC BY-ND',
  'by-nc-nd': 'CC BY-NC-ND',
  zero: 'CC0',
  pdm: 'Public Domain',
  other: 'CC',
};

function licenseLabel(code, version) {
  const base = LICENSES[code] || (code ? 'CC ' + code : '');
  if (!base) return '';
  return version ? base + ' ' + version : base;
}

async function fetchJson(params, retries) {
  const tries = retries == null ? 2 : retries;
  let lastError = null;
  for (let attempt = 0; attempt <= tries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.providerTimeout);
    try {
      const headers = {};
      if (config.openverseToken) {
        headers.Authorization = 'Bearer ' + config.openverseToken;
      }
      const res = await fetch(API + '?' + params.toString(), {
        headers,
        signal: controller.signal,
      });
      if (!res.ok) {
        lastError = new Error('status ' + res.status);
        if (res.status === 429 || res.status >= 500) {
          await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
          continue;
        }
        return null;
      }
      return await res.json();
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export async function searchImages(query, options) {
  const opts = options || {};
  const page = Math.max(1, Math.min(100, Number(opts.page) || 1));
  const json = await fetchJson(
    new URLSearchParams({
      q: String(query || '').trim(),
      page: String(page),
      page_size: String(PAGE_SIZE),
    })
  );
  if (!json || !Array.isArray(json.results)) return { results: [] };

  const seen = new Set();
  const results = [];
  for (const item of json.results) {
    if (!item || !item.url) continue;
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    const creator = String(item.creator || '').trim();
    results.push({
      title: String(item.title || '').trim(),
      url: item.url,
      thumbnail: item.thumbnail || item.url,
      sourceUrl: item.foreign_landing_url || item.url,
      source: item.source || 'Openverse',
      creator,
      license: licenseLabel(item.license, item.license_version),
      licenseUrl: item.license_url || '',
      content: creator ? 'Creator: ' + creator : '',
      engines: ['Openverse'],
    });
  }

  return { results };
}
