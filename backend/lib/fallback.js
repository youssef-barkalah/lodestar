import { searchDuckDuckGo } from './ddg.js';
import { searchBing } from './bing.js';
import { searchImages as searchOpenverse } from './openverse.js';
import { searchImages as searchWikimedia } from './wikimedia.js';
import { searchNews } from './bingnews.js';
import { searchVideos } from './youtube.js';

const PAGE_SIZE = 7;

export async function buildFallbackPayload(query, type, page, language) {
  let results = [];

  if (type === 'images') {
    const openversePayload = await searchOpenverse(query);
    results = openversePayload.results;
    if (!results.length) {
      const wikimediaPayload = await searchWikimedia(query);
      results = wikimediaPayload.results;
    }
  } else if (type === 'news') {
    const payload = await searchNews(query, language);
    results = payload.results;
  } else if (type === 'videos') {
    const payload = await searchVideos(query, language);
    results = payload.results;
  } else {
    const bingPayload = await searchBing(query, language);
    results = bingPayload.results;
    if (!results.length) {
      const ddgPayload = await searchDuckDuckGo(query);
      results = ddgPayload.results;
    }
  }

  const start = (page - 1) * PAGE_SIZE;
  return { results: results.slice(start, start + PAGE_SIZE) };
}
