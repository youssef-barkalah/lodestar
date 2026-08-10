import { all, remove } from './bookmarks.js';
import { syncDown } from './sync.js';
import { t } from './i18n.js';

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (err) {
    return url;
  }
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

function formatDate(timestamp) {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const list = document.getElementById('bookmarks-list');
const count = document.getElementById('bookmarks-count');
const clearButton = document.getElementById('bookmarks-clear');
const empty = document.getElementById('bookmarks-empty');

function render() {
  const items = all();
  list.innerHTML = '';

  if (!items.length) {
    if (count) count.textContent = '';
    if (empty) empty.hidden = false;
    if (clearButton) clearButton.hidden = true;
    return;
  }

  if (empty) empty.hidden = true;
  if (clearButton) clearButton.hidden = false;
  if (count) {
    count.textContent = t('bookmarks.count', { n: items.length });
  }

  items.forEach(function (item) {
    const li = document.createElement('li');
    li.className = 'history__item';

    const link = document.createElement('a');
    link.className = 'history__query';
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = item.title || item.url;
    link.title = item.url;

    const host = document.createElement('span');
    host.className = 'history__meta';
    host.textContent = hostnameOf(item.url);

    const meta = document.createElement('span');
    meta.className = 'history__type';
    meta.textContent = formatDate(item.added);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'history__remove';
    removeButton.setAttribute(
      'aria-label',
      t('bookmarks.remove') + ': ' + (item.title || item.url)
    );
    removeButton.textContent = t('bookmarks.remove');
    removeButton.addEventListener('click', function () {
      remove(item.url);
      render();
    });

    li.appendChild(link);
    li.appendChild(host);
    li.appendChild(meta);
    li.appendChild(removeButton);
    list.appendChild(li);
  });
}

if (clearButton) {
  clearButton.addEventListener('click', function () {
    all().forEach(function (item) {
      remove(item.url);
    });
    render();
  });
}

const backButton = document.getElementById('bookmarks-back');
if (backButton) {
  backButton.addEventListener('click', function () {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
  });
}

syncDown().then(render);
document.addEventListener('visibilitychange', function () {
  if (!document.hidden) syncDown().then(render);
});

render();
