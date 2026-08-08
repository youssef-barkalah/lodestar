import { config } from './config.js';

const API = 'https://www.googleapis.com/youtube/v3/search';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const CONVERTED = {
  T: 6e13,
  B: 1e9,
  M: 1e6,
  K: 1e3,
};

function parseViews(value) {
  const str = String(value || '')
    .trim()
    .toUpperCase();
  const match = str.match(/([\d.]+)\s*([TBMK])?/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (Number.isNaN(amount)) return null;
  const unit = match[2];
  return unit && CONVERTED[unit]
    ? Math.round(amount * CONVERTED[unit])
    : Math.round(amount);
}

function parseDuration(value) {
  const match = String(value || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  if (!hours && !minutes && !seconds) return null;
  return (hours ? hours + ':' : '') + String(minutes).padStart(hours ? 2 : 1, '0') + ':' + String(seconds).padStart(2, '0');
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.providerTimeout);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPage(videoId) {
  const params = new URLSearchParams({
    format: 'json',
    url: 'https://www.youtube.com/watch?v=' + videoId,
  });
  const json = await fetchJson('https://www.youtube.com/oembed?' + params.toString());
  if (!json) return null;
  return {
    title: json.title,
    author: json.author_name,
  };
}

async function fetchStatistics(ids) {
  if (!ids.length) return {};
  const params = new URLSearchParams({
    part: 'statistics,contentDetails',
    key: config.youtubeApiKey || '',
    id: ids.join(','),
  });
  const json = await fetchJson(API.replace('/search', '/videos') + '?' + params.toString());
  if (!json || !json.items) return {};

  const map = {};
  for (const item of json.items) {
    map[item.id] = {
      views: parseViews(item.statistics && item.statistics.viewCount),
      duration: parseDuration(item.contentDetails && item.contentDetails.duration),
    };
  }
  return map;
}

export async function searchVideos(query) {
  if (!config.youtubeApiKey) return { results: [] };

  const params = new URLSearchParams({
    part: 'snippet',
    maxResults: '24',
    type: 'video',
    safeSearch: 'strict',
    q: query,
    key: config.youtubeApiKey,
  });
  const json = await fetchJson(API + '?' + params.toString());
  if (!json || !json.items) return { results: [] };

  const snippets = json.items.filter(function (item) {
    return item.id && item.id.kind === 'youtube#video';
  });
  const stats = await fetchStatistics(
    snippets.map(function (item) {
      return item.id.videoId;
    })
  );

  const results = [];
  for (const item of snippets) {
    const id = item.id.videoId;
    const snippet = item.snippet || {};
    const videoUrl = 'https://www.youtube.com/watch?v=' + id;
    const page = await fetchPage(id);
    results.push({
      title: page ? page.title : snippet.title,
      url: videoUrl,
      sourceUrl: videoUrl,
      author: page ? page.author : (snippet.channelTitle || 'YouTube'),
      views: stats[id] ? stats[id].views : null,
      duration: stats[id] ? stats[id].duration : null,
      publishedDate: snippet.publishedAt ? new Date(snippet.publishedAt).toISOString() : null,
      thumbnail: snippet.thumbnails && snippet.thumbnails.medium
        ? snippet.thumbnails.medium.url
        : null,
    });
  }

  return { results: results };
}
