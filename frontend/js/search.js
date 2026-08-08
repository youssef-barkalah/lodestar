import { fetchResults, fetchCountry, API_URL } from './api.js';
import { record } from './history.js';
import { initSuggestions } from './suggestions.js';
import { directionOf } from './direction.js';

const VALID_TYPES = ['web', 'images', 'news', 'videos'];

const params = new URLSearchParams(window.location.search);
const query = (params.get('q') || '').trim();
const type = VALID_TYPES.includes(params.get('type'))
  ? params.get('type')
  : 'web';
const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

const root = document.getElementById('results-root');
const heading = document.getElementById('results-heading');
const input = document.getElementById('search-q');
const typeInput = document.getElementById('search-type');
const tabs = document.getElementById('search-tabs');

let countryCard = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (c) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c];
  });
}

function setLive(text) {
  const live = document.getElementById('results-live');
  if (live) live.textContent = text;
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname;
  } catch (err) {
    return '';
  }
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function formatDate(iso) {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function dirAttr(text) {
  return ' dir="' + directionOf(text) + '"';
}

function initControls() {
  if (input) input.value = query;
  if (typeInput) typeInput.value = type;
  if (tabs) {
    tabs.querySelectorAll('.search-tabs__link').forEach(function (link) {
      const linkType = link.getAttribute('data-type');
      link.href =
        'search.html?q=' + encodeURIComponent(query) + '&type=' + linkType;
      if (linkType === type) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }
  if (query && page === 1) record(query, type);
  if (input) initSuggestions(input);
}

function officialMarkup(official) {
  const links = (official.links || [])
    .map(function (link) {
      return (
        '<a href="' +
        escapeHtml(link.url) +
        '" target="_blank" rel="noopener">' +
        escapeHtml(link.label) +
        '</a>'
      );
    })
    .join('');
  const desc = official.tagline
    ? '<p class="official__desc">' + escapeHtml(official.tagline) + '</p>'
    : '';
  const nav = links
    ? '<nav class="official__links" aria-label="' +
      escapeHtml(official.name) +
      ' links">' +
      links +
      '</nav>'
    : '';

  return (
    '<section class="official" aria-label="Official website">' +
    '<span class="official__badge">' +
    '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M12 2 14.9 7.9 21.4 8.8 16.6 13.4 17.7 19.9 12 16.8 6.3 19.9 7.4 13.4 2.6 8.8 9.1 7.9Z"/></svg>' +
    'Official website</span>' +
    '<h2 class="official__title"><a href="' +
    escapeHtml(official.url) +
    '" target="_blank" rel="noopener">' +
    escapeHtml(official.name) +
    '</a></h2>' +
    '<p class="official__url">' +
    escapeHtml(official.domain) +
    '</p>' +
    desc +
    nav +
    '</section>'
  );
}

function faviconMarkup(result) {
  const host = hostnameOf(result.url);
  if (!host) return '';
  return (
    '<img class="result__favicon" src="' +
    escapeHtml(API_URL + '/api/icon?domain=' + encodeURIComponent(host)) +
    '" alt="" width="16" height="16" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">'
  );
}

function webItem(result, index) {
  return (
    '<li class="results__item" style="--i:' +
    index +
    '">' +
    '<article class="result">' +
    '<h2 class="result__title"' +
    dirAttr(result.title) +
    '>' +
    faviconMarkup(result) +
    '<a href="' +
    escapeHtml(result.url) +
    '" target="_blank" rel="noopener">' +
    escapeHtml(result.title) +
    '</a></h2>' +
    '<p class="result__url"' +
    dirAttr(result.displayUrl) +
    '>' +
    escapeHtml(result.displayUrl) +
    '</p>' +
    '<p class="result__desc"' +
    dirAttr(result.description) +
    '>' +
    escapeHtml(result.description) +
    '</p>' +
    '</article>' +
    '</li>'
  );
}

function formatViews(value) {
  const n = Number(value);
  if (!isFinite(n) || n <= 0) return '';
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function imageItem(result, index) {
  if (!result.thumbnail) return '';
  const source = hostnameOf(result.sourceUrl || result.url);
  const caption =
    result.title || source
      ? '<figcaption class="image-card__caption">' +
        (result.title
          ? '<span class="image-card__title"' +
            dirAttr(result.title) +
            '>' +
            escapeHtml(result.title) +
            '</span>'
          : '') +
        (source
          ? '<span class="image-card__source">' +
            escapeHtml(source) +
            '</span>'
          : '') +
        '</figcaption>'
      : '';
  const related = (result.related || []).filter(function (item) {
    return item && item.thumbnail;
  });
  const relatedRow = related.length
    ? '<span class="related">' +
      '<span class="related__label">Related</span>' +
      '<span class="related__row">' +
      related
        .map(function (item, i) {
          return (
            '<a class="related__thumb" href="' +
            escapeHtml(item.url) +
            '" target="_blank" rel="noopener" title="' +
            escapeHtml(item.title || '') +
            '" style="--r:' +
            i +
            '">' +
            '<img src="' +
            escapeHtml(item.thumbnail) +
            '" alt="" loading="lazy" referrerpolicy="no-referrer">' +
            '</a>'
          );
        })
        .join('') +
      '</span>' +
      '</span>'
    : '';
  return (
    '<li class="results__item" style="--i:' +
    index +
    '">' +
    '<figure class="image-card">' +
    '<a class="image-card__link" href="' +
    escapeHtml(result.sourceUrl || result.url) +
    '" target="_blank" rel="noopener">' +
    '<img class="image-card__img" src="' +
    escapeHtml(result.thumbnail) +
    '" alt="' +
    escapeHtml(result.title) +
    '" loading="lazy" referrerpolicy="no-referrer">' +
    '</a>' +
    caption +
    relatedRow +
    '</figure>' +
    '</li>'
  );
}

function newsItem(result, index) {
  const date = formatDate(result.publishedDate);
  const source = result.source ? escapeHtml(result.source) : '';
  const meta =
    date || source
      ? '<p class="result__meta">' +
        [date, source].filter(Boolean).join(' \u00b7 ') +
        '</p>'
      : '';
  return (
    '<li class="results__item" style="--i:' +
    index +
    '">' +
    '<article class="result">' +
    '<h2 class="result__title"' +
    dirAttr(result.title) +
    '><a href="' +
    escapeHtml(result.url) +
    '" target="_blank" rel="noopener">' +
    escapeHtml(result.title) +
    '</a></h2>' +
    meta +
    '<p class="result__desc"' +
    dirAttr(result.description) +
    '>' +
    escapeHtml(result.description) +
    '</p>' +
    '</article>' +
    '</li>'
  );
}

function videoItem(result, index) {
  if (!result.thumbnail) return '';
  const duration = result.duration
    ? '<span class="video-card__duration">' +
      formatDuration(result.duration) +
      '</span>'
    : '';
  const parts = [];
  if (result.author) parts.push(escapeHtml(result.author));
  if (result.views) {
    const views = formatViews(result.views);
    if (views) parts.push(views);
  }
  const date = formatDate(result.publishedDate);
  if (date) parts.push(date);
  const meta = parts.length
    ? '<span class="video-card__meta">' +
      parts.join(' \u00b7 ') +
      '</span>'
    : '';
  return (
    '<li class="results__item" style="--i:' +
    index +
    '">' +
    '<a class="video-card" href="' +
    escapeHtml(result.url) +
    '" target="_blank" rel="noopener">' +
    '<span class="video-card__media">' +
    '<img class="video-card__img" src="' +
    escapeHtml(result.thumbnail) +
    '" alt="" loading="lazy" referrerpolicy="no-referrer">' +
    duration +
    '</span>' +
    '<span class="video-card__body">' +
    '<span class="video-card__title"' +
    dirAttr(result.title) +
    '>' +
    escapeHtml(result.title) +
    '</span>' +
    meta +
    '</span>' +
    '</a>' +
    '</li>'
  );
}

const ARROW_LEFT =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>';
const ARROW_RIGHT =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';

function countryMapUrl(country) {
  const span = Math.max(0.4, Number(country.span) || 8);
  const minLat = country.lat - span * 0.6;
  const maxLat = country.lat + span * 0.6;
  const minLon = country.lon - span;
  const maxLon = country.lon + span;
  return (
    'https://www.openstreetmap.org/export/embed.html?bbox=' +
    encodeURIComponent(minLon + ',' + minLat + ',' + maxLon + ',' + maxLat) +
    '&layer=mapnik&marker=' +
    encodeURIComponent(country.lat + ',' + country.lon)
  );
}

function countryMarkup(country) {
  return (
    '<section class="country" aria-label="' +
    escapeHtml(country.name) +
    '">' +
    '<div class="country__head">' +
    (country.flagUrl
      ? '<img class="country__flag" src="' +
        escapeHtml(country.flagUrl) +
        '" alt="Flag of ' +
        escapeHtml(country.name) +
        '" width="80" height="56" loading="lazy" referrerpolicy="no-referrer">'
      : '') +
    '<div class="country__info">' +
    '<h2 class="country__name"' +
    dirAttr(country.name) +
    '>' +
    escapeHtml(country.name) +
    '</h2>' +
    '<p class="country__capital">Capital: ' +
    escapeHtml(country.capital) +
    '</p>' +
    '</div>' +
    '</div>' +
    '<div class="country__slideshow" data-slideshow hidden>' +
    '<div class="country__slides" data-slides></div>' +
    '<div class="country__slideshow-bar">' +
    '<button class="country__nav" type="button" data-prev aria-label="Previous image">' +
    ARROW_LEFT +
    '</button>' +
    '<span class="country__slide-count" data-count></span>' +
    '<button class="country__nav" type="button" data-next aria-label="Next image">' +
    ARROW_RIGHT +
    '</button>' +
    '</div>' +
    '</div>' +
    '<iframe class="country__map" loading="lazy" title="Map of ' +
    escapeHtml(country.name) +
    '" src="' +
    escapeHtml(countryMapUrl(country)) +
    '" referrerpolicy="no-referrer"></iframe>' +
    '</section>'
  );
}

async function loadCountrySlideshow(section, name) {
  if (!section) return;
  const slidesEl = section.querySelector('[data-slides]');
  const countEl = section.querySelector('[data-count]');
  if (!slidesEl) return;

  let data = null;
  try {
    data = await fetchResults(name, 'images', 1);
  } catch (err) {
    data = null;
  }
  const images = (data && data.results
    ? data.results
    : []
  ).filter(function (result) {
    return result && result.thumbnail;
  }).slice(0, 8);

  if (!images.length) return;
  section.querySelector('[data-slideshow]').hidden = false;

  slidesEl.innerHTML = images
    .map(function (result, i) {
      return (
        '<div class="country__slide' +
        (i === 0 ? ' is-active' : '') +
        '"' +
        dirAttr(result.title || '') +
        '>' +
        '<a href="' +
        escapeHtml(result.sourceUrl || result.url) +
        '" target="_blank" rel="noopener">' +
        '<img src="' +
        escapeHtml(result.thumbnail) +
        '" alt="' +
        escapeHtml(result.title || '') +
        '" loading="lazy" referrerpolicy="no-referrer">' +
        '</a>' +
        '<span class="country__slide-title">' +
        escapeHtml(result.title || '') +
        '</span>' +
        '</div>'
      );
    })
    .join('');

  const slides = slidesEl.children;
  let current = 0;
  let timer = null;

  function show(index) {
    current = (index + slides.length) % slides.length;
    for (let i = 0; i < slides.length; i++) {
      slides[i].classList.toggle('is-active', i === current);
    }
    if (countEl) countEl.textContent = current + 1 + ' / ' + slides.length;
  }

  function stop() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();
    timer = setInterval(function () {
      show(current + 1);
    }, 4000);
  }

  const prev = section.querySelector('[data-prev]');
  const next = section.querySelector('[data-next]');
  if (prev) prev.addEventListener('click', function () { show(current - 1); });
  if (next) next.addEventListener('click', function () { show(current + 1); });
  section.addEventListener('mouseenter', stop);
  section.addEventListener('mouseleave', start);
  section.addEventListener('touchstart', stop, { passive: true });
  section.addEventListener('touchend', start, { passive: true });

  show(0);
  start();
}

function paginationMarkup(data) {
  const pageUrl = function (p) {
    return (
      'search.html?q=' +
      encodeURIComponent(data.query) +
      '&type=' +
      data.type +
      '&page=' +
      p
    );
  };
  const prev =
    data.page > 1
      ? '<div class="pagination__side"><a class="btn" href="' +
        pageUrl(data.page - 1) +
        '">Previous</a></div>'
      : '<div class="pagination__side"></div>';
  const next =
    '<div class="pagination__side"><a class="btn" href="' +
    pageUrl(data.page + 1) +
    '">Next</a></div>';
  return (
    '<nav class="pagination" aria-label="Results pages">' + prev + next + '</nav>'
  );
}

function showLoading() {
  if (heading) heading.textContent = 'Searching for ' + query;
  setLive('Searching\u2026');
  root.innerHTML =
    '<div class="loading" role="status">' +
    '<span class="loading__dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
    '<span>Searching&hellip;</span>' +
    '</div>';
}

function renderResults(data) {
  document.title = data.query + ' \u2014 Lodestar';
  if (heading) heading.textContent = 'Search results for ' + data.query;
  setLive(data.results.length + ' results for ' + data.query);

  let html =
    '<p class="results__meta">' + data.results.length + ' results</p>';
  if (data.type === 'web' && page === 1 && countryCard) {
    html += countryMarkup(countryCard);
  }
  if (data.type === 'web' && data.official) html += officialMarkup(data.official);

  const renderer =
    data.type === 'images'
      ? imageItem
      : data.type === 'news'
        ? newsItem
        : data.type === 'videos'
          ? videoItem
          : webItem;

  const items = data.results
    .map(function (result, index) {
      return renderer(result, index);
    })
    .filter(Boolean)
    .join('');

  if (items) {
    html +=
      '<ul class="results__list results__list--' +
      data.type +
      '">' +
      items +
      '</ul>';
    html += paginationMarkup(data);
  } else if (!(data.type === 'web' && data.official)) {
    showNoResults();
    return;
  }

  root.innerHTML = html;
}

function showNoResults() {
  setLive('No results found.');
  root.innerHTML =
    '<div class="empty">' +
    '<h2 class="empty__title">No results found.</h2>' +
    '<p class="empty__text">Try another search.</p>' +
    '</div>';
}

function showNoQuery() {
  document.title = 'Search \u2014 Lodestar';
  if (heading) heading.textContent = 'Search Lodestar';
  setLive('');
  root.innerHTML =
    '<div class="empty">' +
    '<h2 class="empty__title">Enter something to search.</h2>' +
    '<p class="empty__text">Search the web privately with Lodestar.</p>' +
    '</div>';
}

function showError(message) {
  setLive(message);
  root.innerHTML =
    '<div class="empty">' +
    '<h2 class="empty__title">' +
    escapeHtml(message) +
    '</h2>' +
    '</div>';
}

async function runSearch() {
  showLoading();
  try {
    const wantCountry = type === 'web' && page === 1;
    const [data, country] = await Promise.all([
      fetchResults(query, type, page),
      wantCountry ? fetchCountry(query) : Promise.resolve(null),
    ]);
    countryCard = country;
    renderResults(data);
    if (countryCard) {
      loadCountrySlideshow(root.querySelector('.country'), countryCard.name);
    }
  } catch (err) {
    showError(err.message);
  }
}

initControls();

if (!query) {
  showNoQuery();
} else {
  runSearch();
}
