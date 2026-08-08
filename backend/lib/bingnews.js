import { config } from './config.js';

const RSS_URL = 'https://www.bing.com/news/search';
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
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function tagContent(xml, name) {
  const match = xml.match(
    new RegExp('<' + name + '>([\\s\\S]*?)<\\/' + name + '>')
  );
  return match ? match[1] : '';
}

function realUrl(link) {
  const clean = String(link || '').replace(/&amp;/g, '&').trim();
  try {
    const url = new URL(clean);
    if (url.hostname.endsWith('bing.com') && url.pathname.endsWith('.aspx')) {
      const target = url.searchParams.get('url');
      if (target) return target;
    }
    return url.href;
  } catch (err) {
    return clean;
  }
}

function parseItems(xml) {
  const results = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRe.exec(xml))) {
    const block = match[1];
    const title = stripTags(tagContent(block, 'title'));
    const link = realUrl(tagContent(block, 'link'));
    const description = stripTags(tagContent(block, 'description'));
    const rawDate = tagContent(block, 'pubDate').trim();
    const source = stripTags(tagContent(block, 'News:Source')) || 'bing';
    if (!title || !link) continue;

    const item = {
      title,
      url: link,
      content: description,
      engines: [source, 'bing'],
    };
    if (rawDate) {
      const date = new Date(rawDate);
      if (!isNaN(date.getTime())) item.publishedDate = date.toISOString();
    }
    results.push(item);
  }
  return results;
}

export async function searchNews(query) {
  const url =
    RSS_URL + '?q=' + encodeURIComponent(query) + '&format=rss&setlang=en';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.providerTimeout);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: controller.signal,
    });
    if (!res.ok) return { results: [] };
    const xml = await res.text();
    return { results: parseItems(xml) };
  } catch (err) {
    return { results: [] };
  } finally {
    clearTimeout(timer);
  }
}
