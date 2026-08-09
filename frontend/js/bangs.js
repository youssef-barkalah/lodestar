const BANGS = {
  yt: { type: 'videos' },
  youtube: { type: 'videos' },
  i: { type: 'images' },
  img: { type: 'images' },
  n: { type: 'news' },
  news: { type: 'news' },
  m: { type: 'maps' },
  map: { type: 'maps' },
  w: { url: 'https://en.wikipedia.org/wiki/Special:Search?search=' },
  wiki: { url: 'https://en.wikipedia.org/wiki/Special:Search?search=' },
  d: { url: 'https://duckduckgo.com/?q=' },
  ddg: { url: 'https://duckduckgo.com/?q=' },
  g: { url: 'https://www.google.com/search?q=' },
};

export function applyBang(query) {
  const text = String(query || '').trim();
  const match = text.match(/^!([A-Za-z]+)\s*:\s*(.*)$/) ||
    text.match(/^!([A-Za-z]+)\s+(.+)$/) ||
    text.match(/^!([A-Za-z]+)$/);
  if (!match) return null;
  const name = match[1].toLowerCase();
  const rest = (match[2] || '').trim();
  const bang = BANGS[name];
  if (!bang) return null;
  if (bang.url) {
    if (!rest) return null;
    return { redirect: bang.url + encodeURIComponent(rest) };
  }
  return { type: bang.type, query: rest };
}
