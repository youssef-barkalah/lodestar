import { fetchResults, fetchCountry, API_URL } from './api.js';
import { record } from './history.js';
import { initSuggestions } from './suggestions.js';
import { initVoice } from './voice.js';
import { applyBang } from './bangs.js';
import { directionOf } from './direction.js';
import { t } from './i18n.js';
import { isSaved, toggle as toggleSaved } from './bookmarks.js';

const VALID_TYPES = ['web', 'images', 'news', 'videos', 'maps'];
const VALID_TIMES = ['day', 'week', 'month', 'year'];

const params = new URLSearchParams(window.location.search);
const query = (params.get('q') || '').trim();
const type = VALID_TYPES.includes(params.get('type'))
  ? params.get('type')
  : 'web';
const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
const time = VALID_TIMES.includes(params.get('time'))
  ? params.get('time')
  : 'any';
const rawSafeSearch = params.get('safesearch');
const safeSearch =
  rawSafeSearch !== null ? rawSafeSearch === '1' : storedSafeSearch();

const root = document.getElementById('results-root');
const heading = document.getElementById('results-heading');
const input = document.getElementById('search-q');
const typeInput = document.getElementById('search-type');
const tabs = document.getElementById('search-tabs');

let countryCard = null;

function storedSafeSearch() {
  try {
    return localStorage.getItem('lodestar.safeSearch') === 'on';
  } catch (err) {
    return false;
  }
}

function setStoredSafeSearch(value) {
  try {
    localStorage.setItem('lodestar.safeSearch', value ? 'on' : 'off');
  } catch (err) {}
}

const ACTIVE_CLASS = 'is-key-active';

function resultLinks() {
  return Array.prototype.slice.call(
    root.querySelectorAll('.results__list .result__title a, .results__list .map-card__title a')
  );
}

function focusResult(links, index) {
  if (!links.length) return;
  const idx = Math.max(0, Math.min(links.length - 1, index));
  links.forEach(function (link, i) {
    const item = link.closest('.results__item');
    if (item) item.classList.toggle(ACTIVE_CLASS, i === idx);
  });
  links[idx].scrollIntoView({ block: 'center', behavior: 'smooth' });
  return idx;
}

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

function searchUrl(overrides) {
  const next = {
    q: query,
    type: type,
    time: time,
    safesearch: safeSearch ? '1' : '0',
  };
  if (overrides) {
    Object.keys(overrides).forEach(function (key) {
      if (overrides[key] === null || overrides[key] === undefined) {
        delete next[key];
      } else {
        next[key] = overrides[key];
      }
    });
  }
  return (
    'search.html?' +
    Object.keys(next)
      .map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(next[key]);
      })
      .join('&')
  );
}

function initControls() {
  if (input) {
    input.value = query;
    input.setAttribute('lang', document.documentElement.lang || 'en');
    initSuggestions(input);
    initVoice(input);
    const form = input.form;
    if (form) {
      form.addEventListener('submit', function (event) {
        const bang = applyBang(input.value);
        if (!bang) return;
        event.preventDefault();
        if (bang.redirect) {
          window.location.href = bang.redirect;
        } else {
          const current = new URLSearchParams(window.location.search);
          current.set('q', bang.query);
          current.set('type', bang.type);
          current.delete('page');
          window.location.href = 'search.html?' + current.toString();
        }
      });
    }
  }
  if (typeInput) typeInput.value = type;
  if (tabs) {
    tabs.querySelectorAll('.search-tabs__link').forEach(function (link) {
      const linkType = link.getAttribute('data-type');
      link.href = searchUrl({ type: linkType });
      if (linkType === type) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }
  if (query && page === 1) record(query, type);
}

function initShortcuts() {
  document.addEventListener('keydown', function (event) {
    const target = event.target;
    const typing =
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable);
    if (event.key === '/' && !typing) {
      event.preventDefault();
      if (input) input.focus();
      return;
    }
    if (event.key === 'Escape' && !typing) {
      if (input) {
        input.blur();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    if (typing || event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === 'j' || event.key === 'ArrowDown') {
      event.preventDefault();
      activeResult = focusResult(resultLinks(), activeResult + 1);
    } else if (event.key === 'k' || event.key === 'ArrowUp') {
      event.preventDefault();
      activeResult = focusResult(resultLinks(), activeResult - 1);
    } else if (event.key === 'Enter' && activeResult >= 0) {
      event.preventDefault();
      const links = resultLinks();
      if (links[activeResult]) links[activeResult].click();
    } else if (event.key === 'n' || event.key === 'p') {
      const isNext = event.key === 'n';
      const link = isNext
        ? document.querySelector('.pagination .pagination__side:last-child a')
        : document.querySelector('.pagination .pagination__side:first-child a');
      if (link) window.location.href = link.getAttribute('href');
    }
  });
}

let activeResult = -1;

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
    '<section class="official" aria-label="' +
    t('official.title') +
    '">' +
    '<span class="official__badge">' +
    '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M12 2 14.9 7.9 21.4 8.8 16.6 13.4 17.7 19.9 12 16.8 6.3 19.9 7.4 13.4 2.6 8.8 9.1 7.9Z"/></svg>' +
    escapeHtml(t('official.title')) +
    '</span>' +
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

function saveMarkup(url, title) {
  const saved = isSaved(url);
  return (
    '<button type="button" class="result__save' +
    (saved ? ' is-saved' : '') +
    '" data-save data-url="' +
    escapeHtml(url) +
    '" data-title="' +
    escapeHtml(title) +
    '" aria-label="' +
    t(saved ? 'result.unsave' : 'result.save') +
    '" title="' +
    t(saved ? 'result.unsave' : 'result.save') +
    '">' +
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"></path>' +
    '</svg>' +
    '</button>'
  );
}

function wireSaveButtons() {
  root.querySelectorAll('[data-save]').forEach(function (button) {
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      const url = button.getAttribute('data-url');
      const title = button.getAttribute('data-title');
      const saved = toggleSaved(url, title);
      button.classList.toggle('is-saved', saved);
      button.setAttribute(
        'aria-label',
        t(saved ? 'result.unsave' : 'result.save')
      );
      button.setAttribute(
        'title',
        t(saved ? 'result.unsave' : 'result.save')
      );
      const live = document.getElementById('results-live');
      if (live) {
        live.textContent = t(saved ? 'result.saved' : 'result.removed');
      }
    });
  });
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
    '</a>' +
    saveMarkup(result.url, result.title) +
    '</h2>' +
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
  const captionParts = [];
  if (result.title) {
    captionParts.push(
      '<span class="image-card__title"' +
        dirAttr(result.title) +
        '>' +
        escapeHtml(result.title) +
        '</span>'
    );
  }
  if (result.creator) {
    captionParts.push(
      '<span class="image-card__creator">by ' +
        escapeHtml(result.creator) +
        '</span>'
    );
  }
  if (source) {
    captionParts.push(
      '<span class="image-card__source">' + escapeHtml(source) + '</span>'
    );
  }
  if (result.license) {
    const label = escapeHtml(result.license);
    captionParts.push(
      result.licenseUrl
        ? '<a class="image-card__license" href="' +
            escapeHtml(result.licenseUrl) +
            '" target="_blank" rel="noopener nofollow">' +
            label +
            '</a>'
        : '<span class="image-card__license">' + label + '</span>'
    );
  }
  const caption = captionParts.length
    ? '<figcaption class="image-card__caption">' +
      captionParts.join('') +
      '</figcaption>'
    : '';
  const related = (result.related || []).filter(function (item) {
    return item && item.thumbnail;
  });
  const relatedRow = related.length
    ? '<span class="related">' +
      '<span class="related__label">' +
      escapeHtml(t('related.label')) +
      '</span>' +
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
    '>' +
    '<a href="' +
    escapeHtml(result.url) +
    '" target="_blank" rel="noopener">' +
    escapeHtml(result.title) +
    '</a>' +
    saveMarkup(result.url, result.title) +
    '</h2>' +
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

function mapsEmbed(results) {
  const first =
    results.filter(function (result) {
      return result.bbox && result.bbox.length === 4;
    })[0] ||
    results.filter(function (result) {
      return result.lat != null && result.lon != null;
    })[0];
  if (!first) return '';

  let src;
  if (first.bbox && first.bbox.length === 4) {
    const minLon = first.bbox[3];
    const minLat = first.bbox[0];
    const maxLon = first.bbox[2];
    const maxLat = first.bbox[1];
    src =
      'https://www.openstreetmap.org/export/embed.html?bbox=' +
      encodeURIComponent(minLon + ',' + minLat + ',' + maxLon + ',' + maxLat) +
      '&layer=mapnik';
    if (first.lat != null) {
      src +=
        '&marker=' + encodeURIComponent(first.lat + ',' + first.lon);
    }
  } else {
    const lon = first.lon;
    const lat = first.lat;
    src =
      'https://www.openstreetmap.org/export/embed.html?bbox=' +
      encodeURIComponent(
        (lon - 0.1) + ',' + (lat - 0.05) + ',' + (lon + 0.1) + ',' + (lat + 0.05)
      ) +
      '&layer=mapnik&marker=' +
      encodeURIComponent(lat + ',' + lon);
  }

  return (
    '<div class="maps">' +
    '<iframe class="maps__map" loading="lazy" title="' +
    t('map.title') +
    '" src="' +
    escapeHtml(src) +
    '" referrerpolicy="no-referrer"></iframe>' +
    '<a class="maps__open" href="https://www.openstreetmap.org/" target="_blank" rel="noopener">' +
    escapeHtml(t('map.openOsm')) +
    '</a>' +
    '</div>'
  );
}

function mapItem(result, index) {
  const meta = result.description
    ? '<p class="map-card__meta"' + dirAttr(result.description) + '>' +
      escapeHtml(result.description) +
      '</p>'
    : '';
  return (
    '<li class="results__item" style="--i:' +
    index +
    '">' +
    '<article class="map-card">' +
    '<h2 class="map-card__title"' +
    dirAttr(result.title) +
    '>' +
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"></path>' +
    '<circle cx="12" cy="10" r="3"></circle>' +
    '</svg>' +
    '<a href="' +
    escapeHtml(result.url) +
    '" target="_blank" rel="noopener">' +
    escapeHtml(result.title) +
    '</a></h2>' +
    meta +
    '</article>' +
    '</li>'
  );
}

function filterChips() {
  const chips = [];
  const labels = {
    day: t('filter.day'),
    week: t('filter.week'),
    month: t('filter.month'),
    year: t('filter.year'),
  };
  const showTime = type === 'web' || type === 'news';
  if (showTime) {
    const timeValues = ['any'].concat(VALID_TIMES);
    timeValues.forEach(function (value) {
      const label = value === 'any' ? t('filter.any') : labels[value];
      const className =
        'filter-chip' + (time === value ? ' is-active' : '');
      chips.push(
        '<a class="' +
          className +
          '" href="' +
          searchUrl({ time: value, page: null }) +
          '"' +
          (time === value ? ' aria-current="true"' : '') +
          '>' +
          label +
          '</a>'
      );
    });
  }
  const safeLabel = safeSearch ? t('filter.safeOn') : t('filter.safeOff');
  const targetSafe = safeSearch ? '0' : '1';
  chips.push(
    '<a class="filter-chip" data-safechip href="' +
      searchUrl({ safesearch: targetSafe, page: null }) +
      '" role="button" aria-pressed="' +
      (safeSearch ? 'true' : 'false') +
      '" title="' +
      t('filter.safeToggle') +
      '">' +
      safeLabel +
      '</a>'
  );
  return '<div class="filter-bar" role="group" aria-label="' + t('filter.results') + '">' + chips.join('') + '</div>';
}

function wireSafeChip() {
  const chip = root.querySelector('[data-safechip]');
  if (!chip) return;
  chip.addEventListener('click', function () {
    setStoredSafeSearch(!safeSearch);
  });
}

function instantMarkup(instant) {
  if (!instant) return '';
  const prefix =
    instant.kind === 'math'
      ? '<span class="instant__label">' +
        escapeHtml(t('instant.calculator')) +
        '</span>'
      : '<span class="instant__label">' +
        escapeHtml(t('instant.conversion')) +
        '</span>';
  return (
    '<section class="instant" aria-label="Instant answer">' +
    prefix +
    '<p class="instant__result">' +
    escapeHtml(instant.text) +
    '</p>' +
    '</section>'
  );
}

function shareMarkup() {
  if (typeof navigator.share !== 'function') return '';
  return (
    '<button type="button" class="results__share" id="results-share">' +
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="18" cy="5" r="3"></circle>' +
    '<circle cx="6" cy="12" r="3"></circle>' +
    '<circle cx="18" cy="19" r="3"></circle>' +
    '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>' +
    '<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>' +
    '</svg>' +
    '<span>' +
    escapeHtml(t('share.label')) +
    '</span>' +
    '</button>'
  );
}

function wireShare() {
  const button = document.getElementById('results-share');
  if (!button) return;
  button.addEventListener('click', function () {
    const url = window.location.href;
    navigator
      .share({ title: query + ' — Lodestar', text: query, url: url })
      .catch(function () {});
  });
}

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
        '" alt="' +
        escapeHtml(t('country.flag', { name: country.name })) +
        '" width="80" height="56" loading="lazy" referrerpolicy="no-referrer">'
      : '') +
    '<div class="country__info">' +
    '<h2 class="country__name"' +
    dirAttr(country.name) +
    '>' +
    escapeHtml(country.name) +
    '</h2>' +
    '<p class="country__capital">' +
    escapeHtml(t('country.capital', { name: country.capital })) +
    '</p>' +
    '</div>' +
    '</div>' +
    '<div class="country__slideshow" data-slideshow hidden>' +
    '<div class="country__slides" data-slides></div>' +
    '<div class="country__slideshow-bar">' +
    '<button class="country__nav" type="button" data-prev aria-label="' +
    t('country.prev') +
    '">' +
    ARROW_LEFT +
    '</button>' +
    '<span class="country__slide-count" data-count></span>' +
    '<button class="country__nav" type="button" data-next aria-label="' +
    t('country.next') +
    '">' +
    ARROW_RIGHT +
    '</button>' +
    '</div>' +
    '</div>' +
    '<iframe class="country__map" loading="lazy" title="' +
    escapeHtml(t('country.map', { name: country.name })) +
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
  const prev =
    data.page > 1
      ? '<div class="pagination__side"><a class="btn" href="' +
        searchUrl({ page: data.page - 1 }) +
        '">' +
        t('pagination.previous') +
        '</a></div>'
      : '<div class="pagination__side"></div>';
  const next =
    '<div class="pagination__side"><a class="btn" href="' +
    searchUrl({ page: data.page + 1 }) +
    '">' +
    t('pagination.next') +
    '</a></div>';
  return (
    '<nav class="pagination" aria-label="' +
    t('pagination.label') +
    '">' +
    prev +
    next +
    '</nav>'
  );
}

function showLoading() {
  if (heading) heading.textContent = t('results.searching', { q: query });
  setLive(t('loading.text'));
  root.innerHTML =
    '<div class="loading" role="status">' +
    '<span class="loading__dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
    '<span>' +
    escapeHtml(t('loading.text')) +
    '</span>' +
    '</div>';
}

function renderResults(data) {
  document.title = data.query + ' \u2014 Lodestar';
  if (heading) heading.textContent = t('results.heading', { q: data.query });
  setLive(t('results.live', { count: data.results.length, q: data.query }));

  let html =
    '<div class="results__head">' +
    '<p class="results__meta">' +
    escapeHtml(t('results.meta', { count: data.results.length })) +
    '</p>' +
    shareMarkup() +
    '</div>';
  html += filterChips();
  html += instantMarkup(data.instant);
  if (data.type === 'maps') html += mapsEmbed(data.results);
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
          : data.type === 'maps'
            ? mapItem
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
  wireSaveButtons();
  wireSafeChip();
  wireShare();
}

function showNoResults() {
  setLive(t('results.noResults'));
  root.innerHTML =
    '<div class="empty">' +
    '<h2 class="empty__title">' +
    escapeHtml(t('results.noResults')) +
    '</h2>' +
    '<p class="empty__text">' +
    escapeHtml(t('results.tryAnother')) +
    '</p>' +
    '</div>';
}

function showNoQuery() {
  document.title = t('title.search');
  if (heading) heading.textContent = t('home.tagline');
  setLive('');
  root.innerHTML =
    '<div class="empty">' +
    '<h2 class="empty__title">' +
    escapeHtml(t('results.noQuery')) +
    '</h2>' +
    '<p class="empty__text">' +
    escapeHtml(t('results.noQueryDesc')) +
    '</p>' +
    '</div>';
}

function showError(message) {
  setLive(message);
  root.innerHTML =
    '<div class="empty">' +
    '<h2 class="empty__title">' +
    escapeHtml(message) +
    '</h2>' +
    '<p class="empty__text">' +
    escapeHtml(t('error.connection')) +
    '</p>' +
    '<button type="button" class="btn empty__retry" id="retry-search">' +
    escapeHtml(t('error.retry')) +
    '</button>' +
    '</div>';
  const retry = document.getElementById('retry-search');
  if (retry) retry.addEventListener('click', runSearch);
}

async function runSearch() {
  showLoading();
  try {
    const wantCountry = type === 'web' && page === 1;
    const [data, country] = await Promise.all([
      fetchResults(query, type, page, {
        time: time,
        safeSearch: safeSearch,
      }),
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
initShortcuts();

if (!query) {
  showNoQuery();
} else {
  runSearch();
}
