import { searchDuckDuckGo } from './ddg.js';
import { searchImages } from './wikimedia.js';
import { searchNews } from './bingnews.js';
import { searchVideos } from './youtube.js';

const PAGE_SIZE = 7;

export async function buildFallbackPayload(query, type, page) {
  let results = [];

  if (type === 'images') {
    const payload = await searchImages(query);
    results = payload.results;
  } else if (type === 'news') {
    const payload = await searchNews(query);
    results = payload.results;
  } else if (type === 'videos') {
    const payload = await searchVideos(query);
    results = payload.results;
  } else {
    const payload = await searchDuckDuckGo(query);
    results = payload.results;
  }

  const start = (page - 1) * PAGE_SIZE;
  return { results: results.slice(start, start + PAGE_SIZE) };
}
