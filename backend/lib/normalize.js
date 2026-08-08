import { displayUrl } from './url.js';

function cleanText(value, max) {
  if (!value) return '';
  const text = String(value)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return max && text.length > max ? text.slice(0, max) : text;
}

export function normalizeResults(payload) {
  const list =
    payload && Array.isArray(payload.results) ? payload.results : [];
  const results = [];

  for (const item of list) {
    const title = cleanText(item.title, 300);
    const url = typeof item.url === 'string' ? item.url.trim() : '';
    if (!title || !url) continue;

    const description = cleanText(item.content || item.description, 500);
    const source = Array.isArray(item.engines)
      ? item.engines[0]
      : item.engine || '';

    const result = {
      title,
      url,
      displayUrl: displayUrl(url, item.parsed_url),
      description,
      source: cleanText(source, 80),
    };

    if (item.category) result.category = cleanText(item.category, 60);
    if (item.publishedDate) result.publishedDate = item.publishedDate;
    if (item.length != null) result.duration = Number(item.length);
    if (item.author) result.author = cleanText(item.author, 80);
    if (item.views != null) result.views = item.views;
    if (item.sourceUrl) result.sourceUrl = item.sourceUrl;
    if (Array.isArray(item.related)) result.related = item.related;
    if (item.thumbnail || item.img_src) {
      result.thumbnail = item.thumbnail || item.img_src;
    }

    results.push(result);
  }

  return results;
}
