const CACHE_NAME = 'lodestar-v1';
const PRECACHE = [
  './',
  'index.html',
  'search.html',
  'settings.html',
  'history.html',
  'bookmarks.html',
  '404.html',
  'css/tokens.css',
  'css/base.css',
  'css/home.css',
  'css/results.css',
  'css/settings.css',
  'js/head-theme.js',
  'js/head-lang.js',
  'js/api.js',
  'js/account.js',
  'js/account-ui.js',
  'js/bangs.js',
  'js/bookmarks.js',
  'js/bookmarks-page.js',
  'js/direction.js',
  'js/history-page.js',
  'js/history.js',
  'js/home.js',
  'js/languages.js',
  'js/search.js',
  'js/settings.js',
  'js/suggestions.js',
  'js/sync.js',
  'js/theme.js',
  'js/voice.js',
  'manifest.json',
  '../assets/icon.svg',
  '../assets/purple-logo.svg',
  '../assets/white-logo.svg',
  '../assets/icon-192.png',
  '../assets/icon-512.png',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(PRECACHE);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key !== CACHE_NAME;
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

function inScope(url) {
  return (
    url.origin === self.location.origin &&
    url.pathname.indexOf(self.registration.scope) === 0
  );
}

function navigateWithNetworkFirst(request) {
  const cacheRequest = request.mode === 'navigate' ? './index.html' : request;
  return fetch(request)
    .then(function (response) {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(cacheRequest, copy);
        });
      }
      return response;
    })
    .catch(function () {
      return caches.match(cacheRequest).then(function (hit) {
        return (
          hit ||
          caches.match('./index.html').then(function (fallback) {
            return fallback || Response.error();
          })
        );
      });
    });
}

self.addEventListener('fetch', function (event) {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !inScope(url)) return;
  if (url.pathname.indexOf('/api/') !== -1) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(navigateWithNetworkFirst(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (hit) {
      return (
        hit ||
        fetch(event.request).then(function (response) {
          if (response.ok && inScope(new URL(event.request.url))) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, copy);
            });
          }
          return response;
        })
      );
    })
  );
});
