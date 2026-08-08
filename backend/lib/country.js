import { COUNTRIES } from '../data/countries.js';

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function flagUrl(cca2) {
  const code = String(cca2 || '').toLowerCase().replace(/[^a-z]/g, '');
  if (code.length !== 2) return '';
  return 'https://flagcdn.com/w80/' + code + '.png';
}

function containsWord(query, token) {
  if (!token) return false;
  return new RegExp(
    '(^|[^\\p{L}])' + escapeRegExp(token) + '($|[^\\p{L}])',
    'iu'
  ).test(query);
}

function describe(country) {
  return {
    name: country.name,
    cca2: country.cca2,
    flagUrl: flagUrl(country.cca2),
    capital: country.capital,
    lat: country.lat,
    lon: country.lon,
    span: country.span || 8,
  };
}

export function lookupCountry(rawQuery) {
  const query = normalize(rawQuery);
  if (!query || query.length > 60) return null;

  for (const country of COUNTRIES) {
    const name = normalize(country.name);
    const aliases = (country.aliases || []).map(normalize);
    if (query === name || aliases.includes(query)) {
      return describe(country);
    }
  }

  const candidates = COUNTRIES.slice().sort(function (a, b) {
    return normalize(b.name).length - normalize(a.name).length;
  });
  for (const country of candidates) {
    const name = normalize(country.name);
    if (name.length >= 3 && containsWord(query, name)) {
      return describe(country);
    }
    for (const alias of (country.aliases || []).map(normalize)) {
      if (alias.length >= 3 && containsWord(query, alias)) {
        return describe(country);
      }
    }
  }

  return null;
}
