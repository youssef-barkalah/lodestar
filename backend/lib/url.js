export function normalizeHost(host) {
  let h = String(host || '').toLowerCase();
  while (h.startsWith('www.')) h = h.slice(4);
  return h;
}

export function hostnameOf(input) {
  try {
    return normalizeHost(new URL(input).hostname);
  } catch (err) {
    return '';
  }
}

export function normalizeUrl(input) {
  try {
    const url = new URL(input);
    let host = normalizeHost(url.hostname);
    let path = url.pathname;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    let key = host + path;
    if (
      (host === 'youtube.com' && path === '/watch') ||
      host === 'openstreetmap.org'
    ) {
      key += url.search;
    }
    return key;
  } catch (err) {
    return String(input || '').toLowerCase().trim();
  }
}

export function displayUrl(input, parsed) {
  if (parsed && parsed.netloc) {
    let host = normalizeHost(parsed.netloc);
    const path = parsed.path || '/';
    return host + (path === '/' ? '' : path);
  }
  try {
    const url = new URL(input);
    let host = normalizeHost(url.hostname);
    let path = url.pathname;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    return host + path;
  } catch (err) {
    return String(input || '');
  }
}
