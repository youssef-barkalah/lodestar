import { all, clear, setting } from './history.js';
import { directionOf } from './direction.js';

const TYPE_LABELS = {
  web: 'Web',
  images: 'Images',
  news: 'News',
  videos: 'Videos',
};

function typeLabel(type) {
  return TYPE_LABELS[type] || 'Web';
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return (
    date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) +
    ' \u00b7 ' +
    date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
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

const list = document.getElementById('history-list');
const count = document.getElementById('history-count');
const clearButton = document.getElementById('history-clear');
const empty = document.getElementById('history-empty');
const emptyTitle = document.getElementById('history-empty-title');

function render() {
  const items = all();
  list.innerHTML = '';

  if (!items.length) {
    if (count) count.textContent = '';
    if (empty) {
      empty.hidden = false;
      if (emptyTitle) {
        emptyTitle.textContent =
          setting() === 'off'
            ? 'Search history is turned off.'
            : 'No search history yet.';
      }
    }
    if (clearButton) clearButton.hidden = true;
    return;
  }

  if (empty) empty.hidden = true;
  if (clearButton) clearButton.hidden = false;
  if (count) {
    count.textContent =
      items.length + (items.length === 1 ? ' search' : ' searches');
  }

  items.forEach(function (item) {
    const li = document.createElement('li');
    li.className = 'history__item';

    const link = document.createElement('a');
    link.className = 'history__query';
    link.href =
      'search.html?q=' +
      encodeURIComponent(item.q) +
      '&type=' +
      encodeURIComponent(item.type || 'web');
    link.textContent = item.q;
    link.title = item.q;
    link.setAttribute('dir', directionOf(item.q));

    const meta = document.createElement('span');
    meta.className = 'history__meta';
    meta.textContent = formatDate(item.t);

    const badge = document.createElement('span');
    badge.className = 'history__type';
    badge.textContent = typeLabel(item.type || 'web');

    li.appendChild(link);
    li.appendChild(meta);
    li.appendChild(badge);
    list.appendChild(li);
  });
}

if (clearButton) {
  clearButton.addEventListener('click', function () {
    clear();
    render();
  });
}

const backButton = document.getElementById('history-back');
if (backButton) {
  backButton.addEventListener('click', function () {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
  });
}

render();
