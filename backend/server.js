import { createServer } from 'node:http';
import { config } from './lib/config.js';
import { searchSearXNG, UpstreamError } from './lib/searxng.js';
import { buildFallbackPayload } from './lib/fallback.js';
import { normalizeResults } from './lib/normalize.js';
import { rankResults } from './lib/rank.js';
import { findOfficialSite, toApiSite } from './lib/websites.js';
import { getSuggestions } from './lib/suggest.js';
import { getIcon, clearIconCache } from './lib/icon.js';
import { lookupCountry } from './lib/country.js';
import * as auth from './lib/auth.js';

const VALID_TYPES = ['web', 'images', 'news', 'videos'];
const VALID_HISTORY = ['off', '24h', 'always'];
const VALID_THEMES = ['light', 'dark', 'system'];

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(payload);
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type, Authorization');
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
      data += chunk;
      if (data.length > 1e6) {
        req.destroy();
        reject(new Error('Request body too large.'));
      }
    });
    req.on('end', function () {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

function bearerToken(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+([A-Za-z0-9]+)$/);
  return match ? match[1] : null;
}

function authError(res, message) {
  sendJson(res, 401, { error: { code: 'auth_failed', message } });
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(function (item) {
      return item && typeof item.q === 'string' && item.q.trim();
    })
    .slice(0, 100)
    .map(function (item) {
      return {
        q: item.q.trim().slice(0, 100),
        t: Number(item.t) || 0,
        type: VALID_TYPES.includes(item.type) ? item.type : 'web',
      };
    });
}

function sanitizeSync(body) {
  const sync = {};
  if (body.historySetting !== undefined) {
    sync.historySetting = VALID_HISTORY.includes(body.historySetting)
      ? body.historySetting
      : '24h';
  }
  if (body.theme !== undefined) {
    sync.theme = VALID_THEMES.includes(body.theme) ? body.theme : 'system';
  }
  if (body.suggestions !== undefined) {
    sync.suggestions = body.suggestions === 'off' ? 'off' : 'on';
  }
  if (body.history !== undefined) {
    sync.history = sanitizeHistory(body.history);
  }
  return sync;
}

async function handleSearch(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const query = (url.searchParams.get('q') || '').trim();
  const type = url.searchParams.get('type') || 'web';
  const page = Math.max(
    1,
    Math.min(50, parseInt(url.searchParams.get('page') || '1', 10) || 1)
  );

  if (!query) {
    sendJson(res, 400, {
      error: { code: 'empty_query', message: 'Enter something to search.' },
    });
    return;
  }
  if (query.length > config.maxQueryLength) {
    sendJson(res, 400, {
      error: { code: 'query_too_long', message: 'That query is too long.' },
    });
    return;
  }
  if (!VALID_TYPES.includes(type)) {
    sendJson(res, 400, {
      error: { code: 'invalid_type', message: 'Unknown search category.' },
    });
    return;
  }

  let payload;
  let usingFallback = false;
  try {
    payload = await searchSearXNG(query, type, page);
  } catch (err) {
    if (err instanceof UpstreamError) {
      console.warn(
        '[lodestar] Search provider unreachable, using alternate providers.'
      );
      payload = await buildFallbackPayload(query, type, page);
      usingFallback = true;
    } else {
      throw err;
    }
  }

  let results = normalizeResults(payload);
  if (results.length === 0 && !usingFallback) {
    payload = await buildFallbackPayload(query, type, page);
    results = normalizeResults(payload);
  }
  const officialSite = findOfficialSite(query);
  const ranked = rankResults(results, query, officialSite);

  sendJson(res, 200, {
    query,
    type,
    page,
    count: ranked.length,
    official: officialSite ? toApiSite(officialSite) : null,
    results: ranked,
  });
}

async function handleSuggest(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const q = (url.searchParams.get('q') || '').trim().slice(0, 200);
  const suggestions = await getSuggestions(q);
  sendJson(res, 200, { suggestions });
}

function handleCountry(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const q = (url.searchParams.get('q') || '').trim().slice(0, 60);
  if (!q) {
    sendJson(res, 200, { found: false });
    return;
  }
  const country = lookupCountry(q);
  sendJson(res, 200, country ? { found: true, ...country } : { found: false });
}

async function handleIcon(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const domain = url.searchParams.get('domain') || '';
  try {
    const icon = await getIcon(domain);
    res.writeHead(200, {
      'Content-Type': icon.type,
      'Cache-Control': 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(icon.body);
  } catch (err) {
    console.error(err);
    sendJson(res, 500, {
      error: { code: 'icon_error', message: 'Icon unavailable.' },
    });
  }
}

async function handleRegister(req, res) {
  try {
    const body = await readBody(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const loggedIn = await auth.register(username, password);
    sendJson(res, 200, { username: loggedIn.username, token: loggedIn.token });
  } catch (err) {
    sendJson(res, 400, {
      error: { code: 'register_failed', message: err.message },
    });
  }
}

async function handleLogin(req, res) {
  try {
    const body = await readBody(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const loggedIn = await auth.login(username, password);
    sendJson(res, 200, { username: loggedIn.username, token: loggedIn.token });
  } catch (err) {
    authError(res, err.message);
  }
}

async function handleLogout(req, res) {
  await auth.logout(bearerToken(req));
  sendJson(res, 200, { ok: true });
}

async function handleSyncGet(req, res) {
  const session = await auth.session(bearerToken(req));
  if (!session) return authError(res, 'Not signed in.');
  sendJson(res, 200, session.sync);
}

async function handleSyncPost(req, res) {
  const session = await auth.session(bearerToken(req));
  if (!session) return authError(res, 'Not signed in.');
  const body = await readBody(req).catch(function () {
    return {};
  });
  const next = Object.assign({}, session.sync, sanitizeSync(body));
  const saved = await auth.setSync(bearerToken(req), next);
  if (!saved) {
    sendJson(res, 500, {
      error: {
        code: 'internal_error',
        message: 'Could not save your data. Please try again.',
      },
    });
    return;
  }
  sendJson(res, 200, { ok: true });
}

function handleCacheClear(req, res) {
  clearIconCache();
  sendJson(res, 200, { ok: true });
}

const server = createServer((req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (req.method === 'GET' && pathname === '/api/search') {
    handleSearch(req, res).catch((err) => {
      console.error(err);
      sendJson(res, 500, {
        error: {
          code: 'internal_error',
          message: 'Something went wrong. Please try again.',
        },
      });
    });
    return;
  }
  if (req.method === 'GET' && pathname === '/api/suggest') {
    handleSuggest(req, res).catch((err) => {
      console.error(err);
      sendJson(res, 500, {
        error: {
          code: 'internal_error',
          message: 'Something went wrong. Please try again.',
        },
      });
    });
    return;
  }
  if (req.method === 'GET' && pathname === '/api/country') {
    handleCountry(req, res);
    return;
  }
  if (req.method === 'GET' && pathname === '/api/icon') {
    handleIcon(req, res);
    return;
  }
  if (req.method === 'POST' && pathname === '/api/auth/register') {
    handleRegister(req, res);
    return;
  }
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    handleLogin(req, res);
    return;
  }
  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    handleLogout(req, res);
    return;
  }
  if (req.method === 'GET' && pathname === '/api/sync') {
    handleSyncGet(req, res).catch(function (err) {
      console.error(err);
      sendJson(res, 500, {
        error: {
          code: 'internal_error',
          message: 'Something went wrong. Please try again.',
        },
      });
    });
    return;
  }
  if (req.method === 'POST' && pathname === '/api/sync') {
    handleSyncPost(req, res).catch(function (err) {
      console.error(err);
      sendJson(res, 500, {
        error: {
          code: 'internal_error',
          message: 'Something went wrong. Please try again.',
        },
      });
    });
    return;
  }
  if (req.method === 'POST' && pathname === '/api/cache/clear') {
    handleCacheClear(req, res);
    return;
  }

  sendJson(res, 404, { error: { code: 'not_found', message: 'Not found.' } });
});

server.listen(config.port, () => {
  console.log('Lodestar backend listening on http://localhost:' + config.port);
  console.log('SearXNG: ' + config.searxngUrl);
});
