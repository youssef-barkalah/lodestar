import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeHost } from './url.js';

const dataFile = join(
  dirname(fileURLToPath(import.meta.url)),
  '../data/websites.json'
);

const sites = JSON.parse(readFileSync(dataFile, 'utf8'));

const byDomain = new Map();
const byName = new Map();

for (const site of Object.values(sites)) {
  for (const domain of site.domains) {
    byDomain.set(normalizeHost(domain), site);
  }
  const names = [site.name, site.domain, ...(site.aliases || [])];
  for (const name of names) {
    const key = String(name).toLowerCase().trim();
    if (key && !byName.has(key)) byName.set(key, site);
  }
}

export function findOfficialSite(query) {
  const key = String(query || '').toLowerCase().trim();
  if (!key) return null;
  return byName.get(key) || byDomain.get(key) || null;
}

export function siteForHost(host) {
  const normalized = normalizeHost(host);
  const direct = byDomain.get(normalized);
  if (direct) return direct;
  for (const [domain, site] of byDomain) {
    if (normalized.endsWith('.' + domain)) return site;
  }
  return null;
}

export function suggestSites(prefix) {
  const key = String(prefix || '').toLowerCase().trim();
  if (!key) return [];
  const out = [];
  for (const site of Object.values(sites)) {
    const names = [site.name, site.domain, ...(site.aliases || [])];
    for (const name of names) {
      const value = String(name);
      if (value.toLowerCase().includes(key)) out.push(value);
    }
  }
  return Array.from(new Set(out)).slice(0, 8);
}

export function toApiSite(site) {
  return {
    name: site.name,
    domain: site.domain,
    url: site.url,
    tagline: site.tagline || '',
    links: (site.services || []).map((service) => ({
      label: service.label,
      url: service.url,
    })),
  };
}
