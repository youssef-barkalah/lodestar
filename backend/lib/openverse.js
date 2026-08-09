import { config } from './config.js';

const API = 'https://api.openverse.org/v1/images/';
const PAGE_SIZE = 20;

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

export async function searchImages(query) {
  const json = await fetchJson(
    new URLSearchParams({
      q: query,
      page_size: String(PAGE_SIZE),
    })
  );
  if (!json || !Array.isArray(json.results)) return { results: [] };

  const results = json.results
    .filter((item) => item && item.url)
    .map((item) => ({
      title: String(item.title || '').trim(),
      url: item.url,
      thumbnail: item.thumbnail || item.url,
      sourceUrl: item.foreign_landing_url || item.url,
      content: item.creator ? 'Creator: ' + item.creator : '',
      source: item.source || 'Openverse',
      engines: [item.source || 'Openverse'],
    }));

  return { results };
}
