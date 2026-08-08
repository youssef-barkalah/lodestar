import { config } from './config.js';

export class UpstreamError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'UpstreamError';
    this.code = code;
  }
}

const CATEGORY_MAP = {
  web: 'general',
  images: 'images',
  news: 'news',
  videos: 'videos',
};

export async function searchSearXNG(query, type, page) {
  const params = new URLSearchParams({ q: query, format: 'json' });
  const category = CATEGORY_MAP[type];
  if (category) params.set('categories', category);
  if (page > 1) params.set('pageno', String(page));

  const url = config.searxngUrl + '/search?' + params.toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.searchTimeout);

  let response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'lodestar-backend/0.1 (local development)',
      },
      signal: controller.signal,
    });
  } catch (err) {
    throw new UpstreamError(
      'searxng_unreachable',
      "Lodestar couldn't reach the search service. Please try again."
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new UpstreamError(
      'searxng_error',
      "Lodestar couldn't reach the search service. Please try again."
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch (err) {
    throw new UpstreamError(
      'searxng_bad_response',
      'The search service returned an unreadable response.'
    );
  }
  return payload;
}
