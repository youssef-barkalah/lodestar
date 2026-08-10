import { searchVideos } from './peertube.js';
import { searchImages } from './openverse.js';
import { searchNews } from './gdelt.js';

export const VERTICALS = {
  videos: searchVideos,
  images: searchImages,
  news: searchNews,
};

export async function searchVertical(type, query, options) {
  const search = VERTICALS[type];
  if (!search) return { results: [] };
  try {
    const payload = await search(query, options || {});
    if (!payload || !Array.isArray(payload.results)) return { results: [] };
    return payload;
  } catch (err) {
    console.warn(
      '[lodestar] ' + type + ' provider failed: ' + (err && err.message)
    );
    return { results: [] };
  }
}
