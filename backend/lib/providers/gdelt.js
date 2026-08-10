import { config } from '../config.js';

const API = 'https://api.gdeltproject.org/api/v2/doc/doc';
const PAGE_SIZE = 7;
const MAX_RECORDS = 50;
const TTL = 5 * 60 * 1000;
const TIMESPAN = { day: '1d', week: '7d', month: '30d', year: '1y' };
const LANG_MAP = {
  en: 'eng', ar: 'ara', fr: 'fra', de: 'deu', es: 'spa', pt: 'por',
  ru: 'rus', zh: 'zho', ja: 'jpn', hi: 'hin', it: 'ita', nl: 'nld',
  tr: 'tur', el: 'ell', he: 'heb', uk: 'ukr', fa: 'fas', ko: 'kor',
};

const memo = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseSeendate(value) {
  if (!value) return null;
  const text = String(value);
  const match = text.match(
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/
  );
  if (match) {
    return new Date(
      Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6])
    ).toISOString();
  }
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

async function fetchArticles(query, language, time) {
  const params = {
    query: String(query || '').trim(),
    format: 'json',
    mode: 'artlist',
    maxrecords: String(MAX_RECORDS),
    sort: 'hybridrel',
  };
  if (TIMESPAN[time]) params.timespan = TIMESPAN[time];
  if (language && language !== 'any' && LANG_MAP[language]) {
    params.query += ' sourcelang:' + LANG_MAP[language];
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.providerTimeout);
    try {
      const res = await fetch(API + '?' + params.toString(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (res.status === 429) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      if (!res.ok) return null;
      const json = await res.json();
      return json && Array.isArray(json.articles) ? json.articles : [];
    } catch (err) {
      await sleep(500 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

function toItem(article) {
  if (!article || !article.url || !article.title) return null;
  const source = article.sitename || article.domain || 'GDELT';
  return {
    title: String(article.title).trim(),
    url: article.url,
    content: '',
    source: String(source).slice(0, 80),
    publishedDate: parseSeendate(article.seendate),
    language: article.language ? String(article.language).slice(0, 30) : '',
    thumbnail: article.image || article.socialimage || '',
    sourceUrl: article.url,
    engines: ['GDELT'],
  };
}

export async function searchNews(query, options) {
  const opts = options || {};
  const language = opts.language || 'any';
  const time = opts.time || 'any';
  const page = Math.max(1, Number(opts.page) || 1);
  const key = [String(query || '').trim(), language, time].join('|');

  let entry = memo.get(key);
  if (!entry || Date.now() - entry.at > TTL) {
    const articles = await fetchArticles(query, language, time);
    if (!articles) return { results: [] };
    const items = articles.map(toItem).filter(Boolean);
    entry = { at: Date.now(), items };
    memo.set(key, entry);
  }

  const start = (page - 1) * PAGE_SIZE;
  return { results: entry.items.slice(start, start + PAGE_SIZE) };
}
