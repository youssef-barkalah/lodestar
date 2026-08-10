import { getSession, isLoggedIn, logout } from './account.js';
import { t } from './i18n.js';

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

export function initialsAvatar(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map(function (part) {
      return part.charAt(0);
    })
    .join('');
  return (letters || '?').toUpperCase();
}

export function avatarColor(name) {
  const text = String(name || 'account');
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return 'hsl(' + (hash % 360) + ' 45% 45%)';
}

function avatarMarkup(session) {
  if (session.avatar) {
    return (
      '<img class="account-chip__avatar" src="' +
      escapeHtml(session.avatar) +
      '" alt="">'
    );
  }
  const name = session.displayName || session.username;
  return (
    '<span class="account-chip__avatar account-chip__avatar--initials" style="background:' +
    avatarColor(name) +
    '">' +
    escapeHtml(initialsAvatar(name)) +
    '</span>'
  );
}

let initialized = false;

function closeMenu() {
  const menu = document.getElementById('account-menu');
  if (!menu) return;
  menu.hidden = true;
  const button = document.getElementById('account-chip-button');
  if (button) button.setAttribute('aria-expanded', 'false');
}

export function renderAccountChip() {
  const container = document.getElementById('account-chip');
  if (!container) return;

  if (isLoggedIn()) {
    const session = getSession();
    container.innerHTML =
      '<button class="account-chip" type="button" id="account-chip-button" aria-haspopup="true" aria-expanded="false" aria-label="' +
      t('account.menu.label') +
      '">' +
      avatarMarkup(session) +
      '</button>' +
      '<div class="account-menu" id="account-menu" hidden>' +
      '<p class="account-menu__name">' +
      escapeHtml(session.displayName || session.username) +
      '</p>' +
      '<p class="account-menu__username">@' +
      escapeHtml(session.username) +
      '</p>' +
      '<a class="account-menu__item" href="settings.html">' +
      escapeHtml(t('account.menu.settings')) +
      '</a>' +
      '<a class="account-menu__item" href="bookmarks.html">' +
      escapeHtml(t('account.menu.saved')) +
      '</a>' +
      '<button class="account-menu__item" type="button" id="account-menu-logout">' +
      escapeHtml(t('account.menu.signout')) +
      '</button>' +
      '</div>';
    const button = document.getElementById('account-chip-button');
    const menu = document.getElementById('account-menu');
    const logoutButton = document.getElementById('account-menu-logout');
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      menu.hidden = !menu.hidden;
      button.setAttribute(
        'aria-expanded',
        menu.hidden ? 'false' : 'true'
      );
    });
    logoutButton.addEventListener('click', function () {
      logout()
        .catch(function () {})
        .then(renderAccountChip);
    });
  } else {
    container.innerHTML =
      '<a class="account-chip account-chip--signin" href="settings.html">' +
      escapeHtml(t('nav.signin')) +
      '</a>';
  }

  if (!initialized) {
    initialized = true;
    document.addEventListener('click', function (event) {
      const wrap = document.getElementById('account-chip');
      if (!wrap) return;
      const menu = document.getElementById('account-menu');
      if (!menu || menu.hidden) return;
      if (!wrap.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });
    window.addEventListener('lodestar:lang', renderAccountChip);
  }
}

if (document.getElementById('account-chip')) renderAccountChip();
