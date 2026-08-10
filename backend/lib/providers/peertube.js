import { config } from '../config.js';

const INSTANCES = [
  'https://tube.tchncs.de',
  'https://peertube.uno',
  'https://tilvids.com',
  'https://video.blender.org',
  'https://framatube.org',
];
const PER_INSTANCE = 12;
const MAX_RESULTS = 24;
const TIMES = { day: 1, week: 7, month: 30, year: 365 };

function startDateFor(time) {
  const days = TIMES[time];
  if (!days) return '';
  return new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
}

async function fetchInstance(origin, params) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.providerTimeout);
  try {
    const res = await fetch(
      origin + '/api/v1/search/videos?' + params.toString(),
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function toItem(video, origin) {
  if (!video || !video.name) return null;
  let url = video.url;
  if (!url && video.uuid) url = origin + '/videos/watch/' + video.uuid;
  if (!url) return null;
  const thumbnail = video.thumbnailPath
    ? origin + video.thumbnailPath
    : video.previewPath
      ? origin + video.previewPath
      : '';
  const author =
    (video.channel && (video.channel.displayName || video.channel.name)) ||
    (video.account && video.account.displayName) ||
    '';
  const description = String(
    video.truncatedDescription || video.description || ''
  )
    .replace(/\s+/g, ' ')
    .trim();
  return {
    title: String(video.name).trim(),
    url,
    content: description,
    length: Number(video.duration) || null,
    views: Number(video.views) || null,
    author: String(author).trim(),
    publishedDate: video.publishedAt
      ? new Date(video.publishedAt).toISOString()
      : null,
    thumbnail,
    source: new URL(origin).hostname,
    instance: origin,
    language: video.language && video.language.id ? video.language.id : '',
    engines: ['PeerTube'],
  };
}

export async function searchVideos(query, options) {
  const opts = options || {};
  const safeSearch = !!opts.safeSearch;
  const params = {
    search: String(query || '').trim(),
    start: '0',
    count: String(PER_INSTANCE),
    nsfw: safeSearch ? 'false' : 'both',
  };
  if (opts.time && TIMES[opts.time]) {
    const startDate = startDateFor(opts.time);
    if (startDate) params.startDate = startDate;
  }

  const responses = await Promise.allSettled(
    INSTANCES.map((origin) =>
      fetchInstance(origin, new URLSearchParams(params))
    )
  );

  const seen = new Set();
  const merged = [];
  for (let i = 0; i < INSTANCES.length && merged.length < MAX_RESULTS; i++) {
    const outcome = responses[i];
    const json = outcome.status === 'fulfilled' ? outcome.value : null;
    if (!json || !Array.isArray(json.data)) continue;
    for (const video of json.data) {
      if (merged.length >= MAX_RESULTS) break;
      const item = toItem(video, INSTANCES[i]);
      if (!item) continue;
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      merged.push(item);
    }
  }

  let results = merged;
  if (opts.language && opts.language !== 'any') {
    const filtered = merged.filter((item) => item.language === opts.language);
    if (filtered.length >= 3) results = filtered;
  }

  return { results };
}
