import { normalizeUrl, hostnameOf } from './url.js';
import { siteForHost } from './websites.js';

function tokenize(query) {
  return String(query || '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

export function rankResults(results, query, officialSite) {
  const tokens = tokenize(query);

  const seen = new Map();
  for (const result of results) {
    const key = normalizeUrl(result.url);
    if (seen.has(key)) continue;
    seen.set(key, result);
  }

  const scored = [];
  for (const result of seen.values()) {
    const host = hostnameOf(result.url);
    const title = (result.title || '').toLowerCase();
    const url = result.url.toLowerCase();
    const desc = (result.description || '').toLowerCase();

    let score = 0;

    const site = siteForHost(host);
    if (site) {
      result.isOfficial = true;
      score += 200;
      if (officialSite && site === officialSite) score += 1200;
    }

    if (tokens.length) {
      const allInTitle = tokens.every((t) => title.includes(t));
      const anyInTitle = tokens.some((t) => title.includes(t));
      const anyInUrl = tokens.some((t) => url.includes(t));
      const anyInDesc = tokens.some((t) => desc.includes(t));
      if (allInTitle) score += 400;
      else if (anyInTitle) score += 250;
      if (anyInUrl) score += 150;
      if (anyInDesc) score += 50;
    }

    scored.push({ result, score });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.map((entry) => entry.result);
}
