import { API_URL } from './api.js';
import { directionOf } from './direction.js';
import { recent, removeItem } from './history.js';
import { t } from './i18n.js';

const X_ICON =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

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

function highlight(suggestion, typed) {
  const text = String(suggestion);
  const term = String(typed || '').toLowerCase();
  if (!term) return escapeHtml(text);
  const index = text.toLowerCase().indexOf(term);
  if (index === -1) return escapeHtml(text);
  return (
    escapeHtml(text.slice(0, index)) +
    '<b>' +
    escapeHtml(text.slice(index, index + term.length)) +
    '</b>' +
    escapeHtml(text.slice(index + term.length))
  );
}

function suggestionsEnabled() {
  try {
    return (localStorage.getItem('lodestar.showSuggestions') || 'on') !== 'off';
  } catch (err) {
    return true;
  }
}

export function initSuggestions(input) {
  if (!suggestionsEnabled()) return;
  const box = input.closest('.search-box');
  if (!box) return;

  const list = document.createElement('ul');
  list.className = 'suggest';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', t('suggest.aria'));
  list.hidden = true;
  box.appendChild(list);

  function syncDirection() {
    const dir = directionOf(input.value);
    input.setAttribute('dir', dir);
    list.setAttribute('dir', dir);
  }
  syncDirection();

  let items = [];
  let recents = [];
  let mode = 'none';
  let active = -1;
  let timer = null;
  let requestId = 0;

  function submit() {
    if (input.form) input.form.submit();
  }

  function renderSuggestions() {
    mode = 'suggest';
    list.innerHTML = '';
    if (!items.length) {
      list.hidden = true;
      active = -1;
      return;
    }
    items.forEach(function (suggestion, index) {
      const li = document.createElement('li');
      li.className = 'suggest__item';
      li.id = 'suggest-' + index;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.innerHTML = highlight(suggestion, input.value);
      li.addEventListener('mousedown', function (event) {
        event.preventDefault();
        input.value = suggestion;
        syncDirection();
        submit();
      });
      list.appendChild(li);
    });
    list.hidden = false;
    active = -1;
  }

  function showRecents() {
    recents = recent();
    if (!recents.length) {
      close();
      return;
    }
    mode = 'recent';
    list.innerHTML = '';

    const header = document.createElement('li');
    header.className = 'suggest__header';
    header.textContent = t('suggest.recent');
    list.appendChild(header);

    recents.forEach(function (item, index) {
      const li = document.createElement('li');
      li.className = 'suggest__item suggest__item--recent';
      li.id = 'recent-' + index;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.setAttribute('dir', directionOf(item.q));

      const text = document.createElement('span');
      text.className = 'suggest__text';
      text.textContent = item.q;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'suggest__remove';
      remove.setAttribute(
        'aria-label',
        t('suggest.remove', { q: item.q })
      );
      remove.innerHTML = X_ICON;
      remove.addEventListener('mousedown', function (event) {
        event.preventDefault();
        event.stopPropagation();
      });
      remove.addEventListener('click', function (event) {
        event.stopPropagation();
        removeItem(item.q);
        showRecents();
      });

      li.appendChild(text);
      li.appendChild(remove);
      li.addEventListener('mousedown', function (event) {
        event.preventDefault();
        input.value = item.q;
        syncDirection();
        submit();
      });
      list.appendChild(li);
    });

    list.hidden = false;
    active = -1;
  }

  function highlightActive() {
    const entries = list.querySelectorAll('.suggest__item');
    entries.forEach(function (li, index) {
      if (index === active) {
        li.classList.add('suggest__item--active');
        li.setAttribute('aria-selected', 'true');
      } else {
        li.classList.remove('suggest__item--active');
        li.setAttribute('aria-selected', 'false');
      }
    });
  }

  function close() {
    list.hidden = true;
    items = [];
    recents = [];
    mode = 'none';
    active = -1;
  }

  function choose(index) {
    if (mode === 'recent') {
      const item = recents[index];
      if (!item) return;
      input.value = item.q;
      syncDirection();
      submit();
      return;
    }
    const suggestion = items[index];
    if (!suggestion) return;
    input.value = suggestion;
    syncDirection();
    submit();
  }

  function query(term) {
    const id = ++requestId;
    fetch(API_URL + '/api/suggest?q=' + encodeURIComponent(term))
      .then(function (response) {
        return response.json();
      })
      .then(function (body) {
        if (id !== requestId) return;
        items = ((body && body.suggestions) || []).filter(function (item) {
          return typeof item === 'string' && item.trim().length > 0;
        });
        renderSuggestions();
      })
      .catch(function () {
        if (id === requestId) items = [];
      });
  }

  input.addEventListener('input', function () {
    syncDirection();
    const value = input.value.trim();
    clearTimeout(timer);
    if (value.length < 1) {
      close();
      return;
    }
    timer = setTimeout(function () {
      query(value);
    }, 150);
  });

  input.addEventListener('focus', function () {
    const value = input.value.trim();
    if (value.length < 1) {
      showRecents();
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(function () {
      query(value);
    }, 100);
  });

  input.addEventListener('keydown', function (event) {
    if (list.hidden) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const length = mode === 'recent' ? recents.length : items.length;
      active = Math.min(active + 1, length - 1);
      highlightActive();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      active = Math.max(active - 1, 0);
      highlightActive();
    } else if (event.key === 'Enter') {
      if (active >= 0) {
        event.preventDefault();
        choose(active);
      }
    } else if (event.key === 'Escape') {
      close();
    }
  });

  input.addEventListener('blur', function () {
    setTimeout(close, 120);
  });
}
