import { config } from './config.js';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'lodestar-search/0.1 (local development; contact: example@example.com)';
const MIME_OK = /^image\/(jpeg|png|gif|webp)$/;
const RELATED_MAX = 6;
const SHOWN_WITH_RELATED = 7;

async function fetchJson(params, retries) {
  const tries = retries == null ? 2 : retries;
  let lastError = null;
  for (let attempt = 0; attempt <= tries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.providerTimeout);
    try {
      const res = await fetch(API + '?' + params.toString(), {
        headers: { 'User-Agent': UA },
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

function filePageUrl(fileTitle) {
  return (
    'https://commons.wikimedia.org/wiki/' +
    encodeURIComponent(String(fileTitle).replace(/ /g, '_'))
  );
}

function toItem(page) {
  const info = page.imageinfo && page.imageinfo[0];
  if (!info || !info.url) return null;
  if (info.mime && !MIME_OK.test(info.mime)) return null;
  return {
    title: String(page.title).replace(/^File:/, '').replace(/_/g, ' '),
    fileTitle: page.title,
    url: info.url,
    content: '',
    thumbnail: info.thumburl || info.url,
    sourceUrl: filePageUrl(page.title),
    source: 'Wikimedia Commons',
  };
}

async function fetchCategoriesFor(fileTitles) {
  const rows = await Promise.all(
    fileTitles.map(async function (title) {
      const json = await fetchJson(
        new URLSearchParams({
          action: 'query',
          format: 'json',
          prop: 'categories',
          cllimit: '10',
          titles: title,
        })
      );
      if (!json || !json.query || !json.query.pages) {
        return { title: title, categories: [] };
      }
      const page = Object.values(json.query.pages)[0];
      return {
        title: title,
        categories: (page.categories || [])
          .map(function (cat) {
            return String(cat.title || '').replace(/^Category:/, '');
          })
          .filter(Boolean),
      };
    })
  );
  return new Map(
    rows.map(function (row) {
      return [row.title, row.categories];
    })
  );
}

function computeRelated(items, categoriesByPage) {
  const related = [];
  for (let i = 0; i < items.length; i++) {
    const mine = categoriesByPage.get(items[i].fileTitle) || [];
    const scored = [];

    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const theirs = categoriesByPage.get(items[j].fileTitle) || [];
      let overlap = 0;
      for (const category of mine) {
        if (theirs.includes(category)) overlap++;
      }
      if (overlap > 0) scored.push({ index: j, overlap: overlap });
    }

    scored.sort(function (a, b) {
      return b.overlap - a.overlap;
    });

    related.push(
      scored.slice(0, RELATED_MAX).map(function (entry) {
        const item = items[entry.index];
        return {
          title: item.title,
          url: item.url,
          thumbnail: item.thumbnail,
          source: item.source,
        };
      })
    );
  }
  return related;
}

export async function searchImages(query) {
  const search = await fetchJson(
    new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrsearch: query,
      gsrnamespace: '6',
      gsrlimit: '24',
      prop: 'imageinfo',
      iiprop: 'url|mime',
      iiurlwidth: '480',
    })
  );
  if (!search) return { results: [] };

  const pages = search.query && search.query.pages ? search.query.pages : {};
  const items = [];
  for (const page of Object.values(pages)) {
    const item = toItem(page);
    if (item) items.push(item);
  }
  if (!items.length) return { results: [] };

  const shown = items.slice(0, SHOWN_WITH_RELATED);
  const categoriesByPage = await fetchCategoriesFor(
    shown.map(function (item) {
      return item.fileTitle;
    })
  );
  const related = computeRelated(items, categoriesByPage);

  return {
    results: items.map(function (item, index) {
      return {
        title: item.title,
        url: item.url,
        content: item.content,
        thumbnail: item.thumbnail,
        sourceUrl: item.sourceUrl,
        related: related[index],
        engines: [item.source],
      };
    }),
  };
}
