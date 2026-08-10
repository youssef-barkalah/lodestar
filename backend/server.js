import { createServer } from 'node:http';
import { config } from './lib/config.js';
import { searchSearXNG, UpstreamError } from './lib/searxng.js';
import { buildFallbackPayload } from './lib/fallback.js';
import { searchVertical, VERTICALS } from './lib/providers/index.js';
import { normalizeResults } from './lib/normalize.js';
import { rankResults } from './lib/rank.js';
import { findOfficialSite, toApiSite } from './lib/websites.js';
import { getSuggestions } from './lib/suggest.js';
import { getIcon } from './lib/icon.js';
import { lookupCountry } from './lib/country.js';
import { searchMaps } from './lib/nominatim.js';
import { instantAnswer } from './lib/instant.js';
import * as auth from './lib/auth.js';
import * as cache from './lib/cache.js';
import * as rateLimit from './lib/rate-limit.js';

const VALID_TYPES = ['web', 'images', 'news', 'videos', 'maps'];
const VALID_HISTORY = ['off', '24h', 'always'];
const VALID_THEMES = ['light', 'dark', 'system'];
const VALID_TIMES = ['day', 'week', 'month', 'year'];
const SEARCH_TTL = 5 * 60 * 1000;
const startedAt = Date.now();

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
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
  if (body.language !== undefined) {
    const lang = String(body.language);
    if (/^[a-z]{2}$/.test(lang)) sync.language = lang;
  }
  if (body.history !== undefined) {
    sync.history = sanitizeHistory(body.history);
  }
  return sync;
}

function sendRateLimited(res, rate) {
  const body = JSON.stringify({
    error: {
      code: 'rate_limited',
      message: 'Too many attempts. Please wait a moment and try again.',
    },
  });
  res.writeHead(429, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Retry-After': String(rate.retryAfter),
  });
  res.end(body);
}

async function handleSearch(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const query = (url.searchParams.get('q') || '').trim();
  const type = url.searchParams.get('type') || 'web';
  const rawLang = String(url.searchParams.get('lang') || 'any').toLowerCase();
  const language = /^[a-z]{2}$/.test(rawLang) ? rawLang : 'any';
  const rawTime = String(url.searchParams.get('time') || 'any').toLowerCase();
  const time = VALID_TIMES.includes(rawTime) ? rawTime : 'any';
  const safeSearch = url.searchParams.get('safesearch') === '1';
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

  const cacheKey = ['search', query, type, page, language, time, safeSearch].join(
    '|'
  );
  const cached = cache.get(cacheKey);
  if (cached) {
    sendJson(res, 200, cached);
    return;
  }

  let payload;
  let usingFallback = false;
  const options = { time, safeSearch };
  if (type === 'maps') {
    payload = await searchMaps(query, language);
  } else if (VERTICALS[type]) {
    payload = await searchVertical(type, query, {
      page,
      language,
      time,
      safeSearch,
    });
    if (payload.results.length === 0) {
      try {
        payload = await searchSearXNG(query, type, page, language, options);
      } catch (err) {
        if (err instanceof UpstreamError) {
          console.warn(
            '[lodestar] Search provider unreachable, using alternate providers.'
          );
          payload = await buildFallbackPayload(query, type, page, language);
          usingFallback = true;
        } else {
          throw err;
        }
      }
    }
  } else {
    try {
      payload = await searchSearXNG(query, type, page, language, options);
    } catch (err) {
      if (err instanceof UpstreamError) {
        console.warn(
          '[lodestar] Search provider unreachable, using alternate providers.'
        );
        payload = await buildFallbackPayload(query, type, page, language);
        usingFallback = true;
      } else {
        throw err;
      }
    }
  }

  let results = normalizeResults(payload);
  if (results.length === 0 && !usingFallback && type !== 'maps') {
    payload = await buildFallbackPayload(query, type, page, language);
    results = normalizeResults(payload);
  }
  const officialSite = type === 'maps' ? null : findOfficialSite(query);
  const ranked = rankResults(results, query, officialSite);
  const responseBody = {
    query,
    type,
    page,
    count: ranked.length,
    time,
    safeSearch,
    official: officialSite ? toApiSite(officialSite) : null,
    results: ranked,
  };
  if (type === 'web' && page === 1) {
    const instant = instantAnswer(query);
    if (instant) responseBody.instant = instant;
  }
  cache.set(cacheKey, responseBody, SEARCH_TTL);
  sendJson(res, 200, responseBody);
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
  const rate = rateLimit.limit(req);
  if (!rate.allowed) return sendRateLimited(res, rate);
  try {
    const body = await readBody(req);
    const username = String(body.username || '').trim();
    const email = String(body.email || '').trim();
    const password = String(body.password || '');
    const loggedIn = await auth.register(username, email, password);
    sendJson(res, 200, {
      username: loggedIn.username,
      displayName: loggedIn.displayName,
      avatar: loggedIn.avatar,
      token: loggedIn.token,
    });
  } catch (err) {
    sendJson(res, 400, {
      error: { code: 'register_failed', message: err.message },
    });
  }
}

async function handleLogin(req, res) {
  const rate = rateLimit.limit(req);
  if (!rate.allowed) return sendRateLimited(res, rate);
  try {
    const body = await readBody(req);
    const identifier = String(body.identifier || '').trim();
    const password = String(body.password || '');
    const loggedIn = await auth.login(identifier, password);
    sendJson(res, 200, {
      username: loggedIn.username,
      displayName: loggedIn.displayName,
      avatar: loggedIn.avatar,
      token: loggedIn.token,
    });
  } catch (err) {
    authError(res, err.message);
  }
}

async function handleForgot(req, res) {
  const rate = rateLimit.limit(req);
  if (!rate.allowed) return sendRateLimited(res, rate);
  try {
    const body = await readBody(req);
    const username = String(body.username || '').trim();
    const email = String(body.email || '').trim();
    const result = await auth.requestReset(username, email);
    sendJson(res, 200, result);
  } catch (err) {
    sendJson(res, 400, {
      error: { code: 'reset_request_failed', message: err.message },
    });
  }
}

async function handleReset(req, res) {
  const rate = rateLimit.limit(req);
  if (!rate.allowed) return sendRateLimited(res, rate);
  try {
    const body = await readBody(req);
    const username = String(body.username || '').trim();
    const code = String(body.code || '').trim();
    const password = String(body.password || '');
    await auth.resetPassword(username, code, password);
    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 400, {
      error: { code: 'reset_failed', message: err.message },
    });
  }
}

function handleHealth(req, res) {
  sendJson(res, 200, {
    ok: true,
    service: 'lodestar-backend',
    uptime: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  });
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

function accountPayload(session) {
  return {
    username: session.username,
    displayName: session.displayName,
    bio: session.bio,
    avatar: session.avatar,
    created: session.created,
  };
}

async function handleAccountGet(req, res) {
  const session = await auth.session(bearerToken(req));
  if (!session) return authError(res, 'Not signed in.');
  sendJson(res, 200, accountPayload(session));
}

async function handleAccountPatch(req, res) {
  const session = await auth.session(bearerToken(req));
  if (!session) return authError(res, 'Not signed in.');
  const body = await readBody(req).catch(function () {
    return {};
  });
  const displayName = String(body.displayName || '').trim().slice(0, 40);
  const bio = String(body.bio || '').trim().slice(0, 300);
  const saved = await auth.updateProfile(bearerToken(req), {
    displayName,
    bio,
  });
  if (!saved) {
    sendJson(res, 500, {
      error: {
        code: 'internal_error',
        message: 'Could not update your profile. Please try again.',
      },
    });
    return;
  }
  sendJson(res, 200, { ok: true, displayName, bio });
}

function isValidAvatar(value) {
  if (typeof value !== 'string') return false;
  const match = value.match(
    /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=\s]+)$/
  );
  if (!match) return false;
  return match[2].replace(/\s+/g, '').length <= 220 * 1024;
}

async function handleAvatarPut(req, res) {
  const session = await auth.session(bearerToken(req));
  if (!session) return authError(res, 'Not signed in.');
  const body = await readBody(req).catch(function () {
    return {};
  });
  const data = typeof body.data === 'string' ? body.data.trim() : '';
  if (!isValidAvatar(data)) {
    sendJson(res, 400, {
      error: {
        code: 'invalid_avatar',
        message: 'Choose a PNG or JPEG photo under 200 KB.',
      },
    });
    return;
  }
  const saved = await auth.setAvatar(bearerToken(req), data);
  if (!saved) {
    sendJson(res, 500, {
      error: {
        code: 'internal_error',
        message: 'Could not save your photo. Please try again.',
      },
    });
    return;
  }
  sendJson(res, 200, { ok: true });
}

async function handleAvatarDelete(req, res) {
  const session = await auth.session(bearerToken(req));
  if (!session) return authError(res, 'Not signed in.');
  await auth.clearAvatar(bearerToken(req));
  sendJson(res, 200, { ok: true });
}

async function handlePassword(req, res) {
  const rate = rateLimit.limit(req);
  if (!rate.allowed) return sendRateLimited(res, rate);
  const session = await auth.session(bearerToken(req));
  if (!session) return authError(res, 'Not signed in.');
  const body = await readBody(req).catch(function () {
    return {};
  });
  const current = String(body.current || '');
  const next = String(body.next || '');
  if (next.length < 6) {
    sendJson(res, 400, {
      error: {
        code: 'weak_password',
        message: 'New password must be at least 6 characters.',
      },
    });
    return;
  }
  try {
    await auth.changePassword(bearerToken(req), current, next);
    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 400, {
      error: { code: 'wrong_password', message: err.message },
    });
  }
}

async function handleDeleteAccount(req, res) {
  const rate = rateLimit.limit(req);
  if (!rate.allowed) return sendRateLimited(res, rate);
  const session = await auth.session(bearerToken(req));
  if (!session) return authError(res, 'Not signed in.');
  await auth.deleteAccount(bearerToken(req));
  sendJson(res, 200, { ok: true });
}

async function handleSessionsGet(req, res) {
  const session = await auth.session(bearerToken(req));
  if (!session) return authError(res, 'Not signed in.');
  const sessions = await auth.listSessions(bearerToken(req));
  sendJson(res, 200, { sessions });
}

async function handleSessionsDeleteAll(req, res) {
  const session = await auth.session(bearerToken(req));
  if (!session) return authError(res, 'Not signed in.');
  await auth.revokeAllSessions(bearerToken(req));
  sendJson(res, 200, { ok: true });
}

async function handleSessionRevoke(req, res, sessionToken) {
  const session = await auth.session(bearerToken(req));
  if (!session) return authError(res, 'Not signed in.');
  await auth.revokeSession(bearerToken(req), sessionToken);
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
  if (req.method === 'GET' && pathname === '/api/health') {
    handleHealth(req, res);
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
  if (req.method === 'POST' && pathname === '/api/auth/forgot') {
    handleForgot(req, res);
    return;
  }
  if (req.method === 'POST' && pathname === '/api/auth/reset') {
    handleReset(req, res);
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
  if (req.method === 'GET' && pathname === '/api/account') {
    handleAccountGet(req, res).catch(function (err) {
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
  if (req.method === 'PATCH' && pathname === '/api/account') {
    handleAccountPatch(req, res).catch(function (err) {
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
  if (req.method === 'PUT' && pathname === '/api/account/avatar') {
    handleAvatarPut(req, res).catch(function (err) {
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
  if (req.method === 'DELETE' && pathname === '/api/account/avatar') {
    handleAvatarDelete(req, res).catch(function (err) {
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
  if (req.method === 'POST' && pathname === '/api/auth/password') {
    handlePassword(req, res).catch(function (err) {
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
  if (req.method === 'DELETE' && pathname === '/api/auth/account') {
    handleDeleteAccount(req, res).catch(function (err) {
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
  if (req.method === 'GET' && pathname === '/api/sessions') {
    handleSessionsGet(req, res).catch(function (err) {
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
  if (req.method === 'DELETE' && pathname === '/api/sessions') {
    handleSessionsDeleteAll(req, res).catch(function (err) {
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
  if (
    req.method === 'DELETE' &&
    pathname.indexOf('/api/sessions/') === 0
  ) {
    const sessionToken = decodeURIComponent(pathname.slice('/api/sessions/'.length));
    handleSessionRevoke(req, res, sessionToken).catch(function (err) {
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

  sendJson(res, 404, { error: { code: 'not_found', message: 'Not found.' } });
});

server.listen(config.port, () => {
  console.log('Lodestar backend listening on http://localhost:' + config.port);
  console.log('SearXNG: ' + config.searxngUrl);
});
