import { config } from './config.js';

const DDG_URL = 'https://html.duckduckgo.com/html/';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function stripTags(value) {
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function realUrl(href) {
  try {
    const url = new URL(href, 'https://duckduckgo.com');
    if (url.hostname.endsWith('duckduckgo.com') && url.pathname === '/l/') {
      const target = url.searchParams.get('uddg');
      if (target) return target;
    }
    return url.href;
  } catch (err) {
    return href;
  }
}

function attr(tag, name) {
  const match = tag.match(new RegExp(name + '="([^"]*)"'));
  return match ? match[1] : '';
}

function parseResults(html) {
  const results = [];

  const anchorRe = /<a\b[^>]*class="[^"]*result__a[^"]*"[^>]*>/g;
  const snippetRe =
    /<a\b[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;

  const anchors = [];
  let match;
  while ((match = anchorRe.exec(html))) {
    const tag = match[0];
    const href = attr(tag, 'href');
    if (!href) continue;
    const close = html.indexOf('</a>', match.index + tag.length);
    if (close === -1) continue;
    const title = stripTags(html.slice(match.index + tag.length, close));
    if (!title) continue;
    anchors.push({ url: realUrl(href), title });
  }

  const snippets = [];
  while ((match = snippetRe.exec(html))) {
    snippets.push(stripTags(match[1]));
  }

  for (let i = 0; i < anchors.length; i++) {
    results.push({
      title: anchors[i].title,
      url: anchors[i].url,
      content: snippets[i] || '',
      engines: ['duckduckgo'],
    });
  }

  return results;
}

export async function searchDuckDuckGo(query) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.providerTimeout);
  try {
    const res = await fetch(DDG_URL + '?q=' + encodeURIComponent(query), {
      headers: { 'User-Agent': UA },
      signal: controller.signal,
    });
    if (!res.ok) return { results: [] };
    const html = await res.text();
    return { results: parseResults(html) };
  } catch (err) {
    return { results: [] };
  } finally {
    clearTimeout(timer);
  }
}
