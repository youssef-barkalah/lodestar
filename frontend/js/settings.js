import { getTheme, setTheme } from './theme.js';
import {
  changePassword,
  deleteAccount,
  getAccount,
  getSession,
  isLoggedIn,
  listSessions,
  login,
  logout,
  pullSync,
  pushSync,
  refreshSession,
  register,
  removeAvatar,
  requestReset,
  resetPassword,
  revokeAllSessions,
  revokeSession,
  updateAccount,
  uploadAvatar,
} from './account.js';
import {
  all as loadHistoryItems,
  mergeRemote,
  setting as historySettingValue,
} from './history.js';
import {
  all as loadBookmarks,
  mergeRemote as mergeRemoteBookmarks,
} from './bookmarks.js';
import { initialsAvatar, avatarColor } from './account-ui.js';
import { LANGUAGES, getLanguage, setLanguage } from './languages.js';
import { t, applyLanguage } from './i18n.js';

const HISTORY_KEY = 'lodestar.searchHistory';
const DEFAULT_HISTORY = '24h';
const THEME_KEY = 'lodestar.theme';
const SUGGESTIONS_KEY = 'lodestar.showSuggestions';
const SAFE_SEARCH_KEY = 'lodestar.safeSearch';

const VALID_HISTORY = ['off', '24h', 'always'];
const VALID_THEMES = ['light', 'dark', 'system'];
const VALID_SUGGESTIONS = ['on', 'off'];

function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {}
}

function load(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (err) {
    return fallback;
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

function initRadioGroup(name, current) {
  const radios = document.querySelectorAll('input[name="' + name + '"]');
  radios.forEach(function (radio) {
    radio.checked = radio.value === current;
  });
  return radios;
}

function pushSetting(payload) {
  if (!isLoggedIn()) return;
  pushSync(payload).catch(function () {});
}

function initTheme() {
  const radios = initRadioGroup('theme', getTheme());
  radios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (radio.checked) {
        setTheme(radio.value);
        pushSetting({ theme: radio.value });
      }
    });
  });
}

function initHistory() {
  const radios = initRadioGroup(
    'history',
    load(HISTORY_KEY, DEFAULT_HISTORY)
  );
  radios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (radio.checked) {
        save(HISTORY_KEY, radio.value);
        pushSetting({ historySetting: radio.value });
      }
    });
  });
}

function initSuggestionsSetting() {
  const radios = initRadioGroup('suggestions', load(SUGGESTIONS_KEY, 'on'));
  radios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (radio.checked) {
        save(SUGGESTIONS_KEY, radio.value);
        pushSetting({ suggestions: radio.value });
      }
    });
  });
}

export function safeSearchEnabled() {
  return load(SAFE_SEARCH_KEY, 'off') === 'on';
}

function initSafeSearch() {
  const radios = initRadioGroup(
    'safesearch',
    safeSearchEnabled() ? 'on' : 'off'
  );
  radios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (radio.checked) save(SAFE_SEARCH_KEY, radio.value);
    });
  });
}

function initLanguage() {
  const select = document.getElementById('lang-select');
  if (!select) return;

  const current = getLanguage();
  select.innerHTML = LANGUAGES.map(function (language) {
    return (
      '<option value="' +
      escapeHtml(language.code) +
      '"' +
      (language.code === current ? ' selected' : '') +
      '>' +
      escapeHtml(language.name) +
      '</option>'
    );
  }).join('');

  select.addEventListener('change', function () {
    setLanguage(select.value);
    applyLanguage();
    pushSetting({ language: select.value });
    renderAccount();
  });
}

function accountMessage(message, isError) {
  const el = document.getElementById('account-message');
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('account__error', !!isError);
}

function syncDown() {
  return pullSync().then(function (remote) {
    if (!remote) return;
    if (Array.isArray(remote.history)) mergeRemote(remote.history);
    if (Array.isArray(remote.bookmarks)) mergeRemoteBookmarks(remote.bookmarks);
    if (VALID_HISTORY.indexOf(remote.historySetting) !== -1) {
      save(HISTORY_KEY, remote.historySetting);
      initRadioGroup('history', remote.historySetting);
    }
    if (VALID_THEMES.indexOf(remote.theme) !== -1) {
      save(THEME_KEY, remote.theme);
      setTheme(remote.theme);
      initRadioGroup('theme', remote.theme);
    }
    if (VALID_SUGGESTIONS.indexOf(remote.suggestions) !== -1) {
      save(SUGGESTIONS_KEY, remote.suggestions);
      initRadioGroup('suggestions', remote.suggestions);
    }
    if (remote.language !== undefined) {
      const value = remote.language;
      if (
        LANGUAGES.some(function (language) {
          return language.code === value;
        })
      ) {
        setLanguage(value);
        applyLanguage();
        initLanguage();
        renderAccount();
      }
    }
  });
}

function fullSyncPayload() {
  return {
    history: loadHistoryItems().slice(0, 100),
    historySetting: historySettingValue(),
    theme: getTheme(),
    suggestions: load(SUGGESTIONS_KEY, 'on'),
    language: getLanguage(),
    bookmarks: loadBookmarks().slice(0, 200),
  };
}

function syncNow() {
  const button = document.getElementById('account-sync');
  if (button) button.disabled = true;
  accountMessage('', false);
  syncDown()
    .then(function () {
      return pushSync(fullSyncPayload());
    })
    .then(function () {
      accountMessage(t('account.synced'));
    })
    .catch(function (err) {
      accountMessage(err.message || t('error.generic'), true);
    })
    .then(function () {
      if (button) button.disabled = false;
    });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function signIn(createAccount, fields) {
  const identifier = fields.username.value.trim();
  const email = (fields.email ? fields.email.value || '' : '').trim();
  const username = identifier;
  const password = fields.password.value || '';
  const confirm = fields.confirm ? fields.confirm.value || '' : '';
  const remember = fields.remember ? fields.remember.checked : true;
  accountMessage('', false);

  if (!username) {
    accountMessage(t('account.enterUsername'), true);
    fields.username.focus();
    return;
  }
  if (createAccount && !/^[A-Za-z0-9._-]{3,20}$/.test(username)) {
    accountMessage(t('account.usernameRules'), true);
    fields.username.focus();
    return;
  }
  if (createAccount) {
    if (!email) {
      accountMessage(t('account.enterEmail'), true);
      fields.email.focus();
      return;
    }
    if (!isValidEmail(email)) {
      accountMessage(t('account.emailInvalid'), true);
      fields.email.focus();
      return;
    }
  }
  if (password.length < 6) {
    accountMessage(t('account.passwordTooShort'), true);
    fields.password.focus();
    return;
  }
  if (createAccount && password !== confirm) {
    accountMessage(t('account.passwordsMismatch'), true);
    if (fields.confirm) fields.confirm.focus();
    return;
  }

  const action = createAccount
    ? register(username, email, password)
    : login(identifier, password, remember);
  action
    .then(function () {
      return syncDown();
    })
    .then(function () {
      renderAccount();
    })
    .catch(function (err) {
      accountMessage(err.message || t('error.generic'), true);
    });
}

function signOut() {
  logout()
    .catch(function () {})
    .then(renderAccount);
}

let currentBio = '';

function relativeTime(iso) {
  if (!iso) return '';
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return minutes + 'm';
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours + 'h';
  const days = Math.round(hours / 24);
  if (days < 30) return days + 'd';
  return new Date(then).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function memberSince(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return t('account.memberSince', {
    date: date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
  });
}

function avatarMarkup(session) {
  if (session.avatar) {
    return (
      '<img class="account__avatar-img" src="' +
      escapeHtml(session.avatar) +
      '" alt="">'
    );
  }
  const name = session.displayName || session.username;
  return (
    '<span class="account__avatar-img account__avatar-img--initials" style="background:' +
    avatarColor(name) +
    '">' +
    escapeHtml(initialsAvatar(name)) +
    '</span>'
  );
}

function profileMarkup(session) {
  const name = session.displayName || session.username;
  const removePhoto = session.avatar
    ? '<button class="account__link-btn" id="account-avatar-remove" type="button">' +
      escapeHtml(t('account.removePhoto')) +
      '</button>'
    : '';
  return (
    '<div class="account__profile">' +
    '<button class="account__avatar" id="account-avatar" type="button" aria-label="' +
    t('account.changePhoto') +
    '" title="' +
    t('account.changePhoto') +
    '">' +
    avatarMarkup(session) +
    '</button>' +
    '<div class="account__profile-text">' +
    '<p class="account__name" id="profile-name-text">' +
    escapeHtml(name) +
    '</p>' +
    '<p class="account__meta">@' +
    escapeHtml(session.username) +
    (removePhoto ? ' \u00b7 ' + removePhoto : '') +
    '</p>' +
    '<p class="account__meta" id="profile-since"></p>' +
    '<p class="account__bio" id="profile-bio"></p>' +
    '</div>' +
    '</div>' +
    '<div class="account__actions">' +
    '<button class="btn" type="button" id="account-edit-profile">' +
    escapeHtml(t('account.editProfile')) +
    '</button>' +
    '<button class="btn" type="button" id="account-password">' +
    escapeHtml(t('account.changePassword')) +
    '</button>' +
    '<button class="btn" type="button" id="account-sync">' +
    escapeHtml(t('account.syncNow')) +
    '</button>' +
    '<button class="btn" type="button" id="account-logout">' +
    escapeHtml(t('account.logout')) +
    '</button>' +
    '</div>' +
    '<div id="account-subpanel"></div>' +
    '<div id="account-devices"></div>' +
    '<div class="account__danger">' +
    '<h3>' +
    escapeHtml(t('account.delete')) +
    '</h3>' +
    '<p>' +
    escapeHtml(t('account.delete.desc')) +
    '</p>' +
    '<button class="btn btn--danger" type="button" id="account-delete">' +
    escapeHtml(t('account.delete')) +
    '</button>' +
    '<div class="account__card" id="delete-confirm" hidden>' +
    '<p>' +
    escapeHtml(t('account.delete.confirm', { username: session.username })) +
    '</p>' +
    '<input class="account__input" id="delete-username" type="text" autocomplete="off">' +
    '<div class="account__actions">' +
    '<button class="btn btn--danger" type="button" id="delete-confirm-btn" disabled>' +
    escapeHtml(t('account.delete.permanent')) +
    '</button>' +
    '<button class="btn" type="button" id="delete-cancel">' +
    escapeHtml(t('account.cancel')) +
    '</button>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<input id="account-avatar-input" type="file" accept="image/png,image/jpeg" hidden>' +
    '<p class="account__message" id="account-message" role="status"></p>'
  );
}

function confirmDelete() {
  accountMessage('', false);
  deleteAccount()
    .then(function () {
      renderAccount();
    })
    .catch(function (err) {
      accountMessage(err.message || t('error.generic'), true);
    });
}

function wireProfile() {
  const avatar = document.getElementById('account-avatar');
  const input = document.getElementById('account-avatar-input');
  if (avatar && input) {
    avatar.addEventListener('click', function () {
      input.click();
    });
    input.addEventListener('change', function () {
      handleAvatarFile(input.files && input.files[0]);
      input.value = '';
    });
  }
  const remove = document.getElementById('account-avatar-remove');
  if (remove) {
    remove.addEventListener('click', function () {
      removeAvatar()
        .then(function () {
          renderAccount();
          accountMessage(t('account.photoRemoved'));
        })
        .catch(function (err) {
          accountMessage(err.message || t('error.generic'), true);
        });
    });
  }
  const edit = document.getElementById('account-edit-profile');
  if (edit) edit.addEventListener('click', openEditProfile);
  const password = document.getElementById('account-password');
  if (password) password.addEventListener('click', openPasswordPanel);
  const sync = document.getElementById('account-sync');
  if (sync) sync.addEventListener('click', syncNow);
  const out = document.getElementById('account-logout');
  if (out) out.addEventListener('click', signOut);
  const del = document.getElementById('account-delete');
  const confirm = document.getElementById('delete-confirm');
  const confirmBtn = document.getElementById('delete-confirm-btn');
  const deleteUsername = document.getElementById('delete-username');
  const cancel = document.getElementById('delete-cancel');
  if (del && confirm) {
    del.addEventListener('click', function () {
      confirm.hidden = false;
    });
  }
  if (deleteUsername && confirmBtn) {
    deleteUsername.addEventListener('input', function () {
      confirmBtn.disabled =
        deleteUsername.value.trim() !== getSession().username;
    });
    deleteUsername.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !confirmBtn.disabled) confirmDelete();
    });
  }
  if (confirmBtn) {
    confirmBtn.addEventListener('click', confirmDelete);
  }
  if (cancel && confirm) {
    cancel.addEventListener('click', function () {
      confirm.hidden = true;
    });
  }
}

function handleAvatarFile(file) {
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    accountMessage(t('account.photoType'), true);
    return;
  }
  const reader = new FileReader();
  reader.onload = function () {
    const image = new Image();
    image.onload = function () {
      const size = 160;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      const scale = Math.max(size / image.width, size / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      uploadAvatar(dataUrl)
        .then(function () {
          renderAccount();
          accountMessage(t('account.photoUpdated'));
        })
        .catch(function (err) {
          accountMessage(err.message || t('error.generic'), true);
        });
    };
    image.onerror = function () {
      accountMessage(t('account.photoRead'), true);
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function openEditProfile() {
  const session = getSession();
  const box = document.getElementById('account-subpanel');
  if (!box) return;
  box.innerHTML =
    '<div class="account__card">' +
    '<h3>' +
    escapeHtml(t('account.editProfile')) +
    '</h3>' +
    '<label class="account__field"><span>' +
    escapeHtml(t('account.displayName')) +
    '</span>' +
    '<input class="account__input" id="profile-name" type="text" maxlength="40" value="' +
    escapeHtml(session.displayName || '') +
    '"></label>' +
    '<label class="account__field"><span>' +
    escapeHtml(t('account.bio')) +
    '</span>' +
    '<textarea class="account__input account__textarea" id="profile-bio-input" rows="3" maxlength="300">' +
    escapeHtml(currentBio || '') +
    '</textarea></label>' +
    '<div class="account__actions">' +
    '<button class="btn btn--primary" type="button" id="profile-save">' +
    escapeHtml(t('account.save')) +
    '</button>' +
    '<button class="btn" type="button" id="profile-cancel">' +
    escapeHtml(t('account.cancel')) +
    '</button>' +
    '</div>' +
    '</div>';
  const nameEl = document.getElementById('profile-name');
  const bioEl = document.getElementById('profile-bio-input');
  const save = document.getElementById('profile-save');
  const cancel = document.getElementById('profile-cancel');
  save.addEventListener('click', function () {
    const displayName = (nameEl.value || '').trim().slice(0, 40);
    const bio = (bioEl.value || '').trim().slice(0, 300);
    updateAccount({ displayName, bio })
      .then(function () {
        currentBio = bio;
        renderAccount();
        accountMessage(t('account.profileSaved'));
      })
      .catch(function (err) {
        accountMessage(err.message || t('error.generic'), true);
      });
  });
  cancel.addEventListener('click', renderAccount);
}

function openPasswordPanel() {
  const box = document.getElementById('account-subpanel');
  if (!box) return;
  box.innerHTML =
    '<div class="account__card">' +
    '<h3>' +
    escapeHtml(t('account.changePassword')) +
    '</h3>' +
    '<label class="account__field"><span>' +
    escapeHtml(t('account.currentPassword')) +
    '</span>' +
    '<input class="account__input" id="pw-current" type="password" autocomplete="current-password"></label>' +
    '<label class="account__field"><span>' +
    escapeHtml(t('account.newPassword')) +
    '</span>' +
    '<input class="account__input" id="pw-new" type="password" autocomplete="new-password" minlength="6"></label>' +
    '<label class="account__field"><span>' +
    escapeHtml(t('account.confirmNewPassword')) +
    '</span>' +
    '<input class="account__input" id="pw-confirm" type="password" autocomplete="new-password"></label>' +
    '<div class="account__actions">' +
    '<button class="btn btn--primary" type="button" id="pw-save">' +
    escapeHtml(t('account.updatePassword')) +
    '</button>' +
    '<button class="btn" type="button" id="pw-cancel">' +
    escapeHtml(t('account.cancel')) +
    '</button>' +
    '</div>' +
    '</div>';
  const current = document.getElementById('pw-current');
  const next = document.getElementById('pw-new');
  const confirm = document.getElementById('pw-confirm');
  const save = document.getElementById('pw-save');
  const cancel = document.getElementById('pw-cancel');
  save.addEventListener('click', function () {
    if ((next.value || '').length < 6) {
      accountMessage(t('account.passwordTooShort'), true);
      return;
    }
    if (next.value !== confirm.value) {
      accountMessage(t('account.passwordsMismatch'), true);
      return;
    }
    changePassword(current.value || '', next.value)
      .then(function () {
        accountMessage(t('account.passwordUpdated'));
        openPasswordPanel();
      })
      .catch(function (err) {
        accountMessage(err.message || t('error.generic'), true);
      });
  });
  cancel.addEventListener('click', renderAccount);
}

function renderDevices(sessions) {
  const box = document.getElementById('account-devices');
  if (!box || !Array.isArray(sessions) || !sessions.length) return;
  const currentToken = getSession().token;
  const items = sessions
    .map(function (item) {
      const isCurrent = item.token === currentToken;
      const meta = item.last_seen
        ? t('account.lastSeen', { time: relativeTime(item.last_seen) })
        : '';
      return (
        '<li class="account__device">' +
        '<span class="account__device-name">' +
        escapeHtml(isCurrent ? t('account.thisDevice') : t('account.otherDevice')) +
        '</span>' +
        '<span class="account__device-meta">' +
        escapeHtml(meta) +
        '</span>' +
        (isCurrent
          ? ''
          : '<button class="btn account__device-revoke" type="button" data-token="' +
            escapeHtml(item.token) +
            '">' +
            escapeHtml(t('account.revoke')) +
            '</button>') +
        '</li>'
      );
    })
    .join('');
  box.innerHTML =
    '<div class="account__devices-box">' +
    '<h3>' +
    escapeHtml(t('account.devices')) +
    '</h3>' +
    '<ul class="account__device-list">' +
    items +
    '</ul>' +
    '<button class="btn" type="button" id="devices-revoke-all">' +
    escapeHtml(t('account.signOutEverywhere')) +
    '</button>' +
    '</div>';
  box.querySelectorAll('.account__device-revoke').forEach(function (button) {
    button.addEventListener('click', function () {
      revokeSession(button.getAttribute('data-token'))
        .then(refreshDevices)
        .catch(function (err) {
          accountMessage(err.message || t('error.generic'), true);
        });
    });
  });
  const all = document.getElementById('devices-revoke-all');
  if (all) {
    all.addEventListener('click', function () {
      revokeAllSessions()
        .then(function () {
          return logout().catch(function () {});
        })
        .then(renderAccount);
    });
  }
}

function refreshDevices() {
  listSessions()
    .then(function (sessions) {
      renderDevices(sessions);
    })
    .catch(function () {});
}

function refreshProfile() {
  getAccount()
    .then(function (account) {
      if (!account) {
        renderAccount();
        return;
      }
      refreshSession({
        displayName: account.displayName || '',
        avatar: account.avatar || '',
      });
      currentBio = account.bio || '';
      const nameEl = document.getElementById('profile-name-text');
      if (nameEl) {
        nameEl.textContent = account.displayName || account.username;
      }
      const sinceEl = document.getElementById('profile-since');
      if (sinceEl) sinceEl.textContent = memberSince(account.created);
      const bioEl = document.getElementById('profile-bio');
      if (bioEl) {
        bioEl.textContent = currentBio || t('account.noBio');
      }
    })
    .catch(function () {
      if (!isLoggedIn()) renderAccount();
    });
  refreshDevices();
}

function loginFields() {
  return (
    '<label class="account__field"><span>' +
    escapeHtml(t('account.identifier')) +
    '</span>' +
    '<input class="account__input" id="account-username" type="text" autocomplete="username" required>' +
    '</label>' +
    '<label class="account__field"><span>' +
    escapeHtml(t('account.password')) +
    '</span>' +
    '<input class="account__input" id="account-password" type="password" autocomplete="current-password" minlength="6" required>' +
    '</label>'
  );
}

function registerFields() {
  return (
    '<label class="account__field"><span>' +
    escapeHtml(t('account.username')) +
    '</span>' +
    '<input class="account__input" id="account-username" type="text" autocomplete="username" maxlength="20" required>' +
    '</label>' +
    '<label class="account__field"><span>' +
    escapeHtml(t('account.email')) +
    '</span>' +
    '<input class="account__input" id="account-email" type="email" autocomplete="email" required>' +
    '</label>' +
    '<label class="account__field"><span>' +
    escapeHtml(t('account.password')) +
    '</span>' +
    '<input class="account__input" id="account-password" type="password" autocomplete="new-password" minlength="6" required>' +
    '</label>' +
    '<label class="account__field"><span>' +
    escapeHtml(t('account.confirmPassword')) +
    '</span>' +
    '<input class="account__input" id="account-confirm" type="password" autocomplete="new-password" minlength="6" required>' +
    '</label>' +
    '<label class="account__remember">' +
    '<input type="checkbox" id="account-remember" checked>' +
    '<span>' +
    escapeHtml(t('account.remember')) +
    '</span>' +
    '<small>' +
    escapeHtml(t('account.remember.desc')) +
    '</small>' +
    '</label>'
  );
}

function openResetPanel() {
  const panel = document.getElementById('account-panel');
  if (!panel) return;
  panel.innerHTML =
    '<div class="account__card">' +
    '<h3>' +
    escapeHtml(t('account.reset.title')) +
    '</h3>' +
    '<p class="account__hint">' +
    escapeHtml(t('account.reset.codeDesc')) +
    '</p>' +
    '<label class="account__field"><span>' +
    escapeHtml(t('account.username')) +
    '</span>' +
    '<input class="account__input" id="reset-username" type="text" autocomplete="username" required>' +
    '</label>' +
    '<label class="account__field"><span>' +
    escapeHtml(t('account.email')) +
    '</span>' +
    '<input class="account__input" id="reset-email" type="email" autocomplete="email" required>' +
    '</label>' +
    '<div class="account__actions">' +
    '<button class="btn btn--primary" type="button" id="reset-send">' +
    escapeHtml(t('account.reset.send')) +
    '</button>' +
    '<button class="btn" type="button" id="reset-back">' +
    escapeHtml(t('account.cancel')) +
    '</button>' +
    '</div>' +
    '<p class="account__message" id="account-message" role="status"></p>' +
    '</div>';

  const usernameEl = document.getElementById('reset-username');
  const emailEl = document.getElementById('reset-email');
  const send = document.getElementById('reset-send');
  const back = document.getElementById('reset-back');
  send.addEventListener('click', function () {
    const username = (usernameEl.value || '').trim();
    const email = (emailEl.value || '').trim();
    accountMessage('', false);
    if (!username) {
      accountMessage(t('account.enterUsername'), true);
      usernameEl.focus();
      return;
    }
    if (!email || !isValidEmail(email)) {
      accountMessage(t('account.emailInvalid'), true);
      emailEl.focus();
      return;
    }
    send.disabled = true;
    requestReset(username, email)
      .then(function (data) {
        const code = (data && data.code) || '';
        accountMessage(
          code
            ? t('account.reset.codeShown', { code: code })
            : t('account.reset.invalid'),
          !code
        );
        openResetCodePanel(username, code);
      })
      .catch(function (err) {
        accountMessage(err.message || t('error.generic'), true);
        send.disabled = false;
      });
  });
  back.addEventListener('click', renderAccount);
}

function openResetCodePanel(username, code) {
  const panel = document.getElementById('account-panel');
  if (!panel) return;
  panel.innerHTML =
    '<div class="account__card">' +
    '<h3>' +
    escapeHtml(t('account.reset.title')) +
    '</h3>' +
    '<p class="account__hint">' +
    escapeHtml(t('account.reset.code')) +
    '</p>' +
    '<label class="account__field"><span>' +
    escapeHtml(t('account.reset.code')) +
    '</span>' +
    '<input class="account__input" id="reset-code" type="text" autocomplete="one-time-code" required>' +
    '</label>' +
    '<label class="account__field"><span>' +
    escapeHtml(t('account.newPassword')) +
    '</span>' +
    '<input class="account__input" id="reset-password" type="password" autocomplete="new-password" minlength="6" required>' +
    '</label>' +
    '<label class="account__field"><span>' +
    escapeHtml(t('account.confirmNewPassword')) +
    '</span>' +
    '<input class="account__input" id="reset-confirm" type="password" autocomplete="new-password" minlength="6" required>' +
    '</label>' +
    '<div class="account__actions">' +
    '<button class="btn btn--primary" type="button" id="reset-submit">' +
    escapeHtml(t('account.reset.submit')) +
    '</button>' +
    '<button class="btn" type="button" id="reset-back">' +
    escapeHtml(t('account.cancel')) +
    '</button>' +
    '</div>' +
    '<p class="account__message" id="account-message" role="status"></p>' +
    '</div>';

  const codeEl = document.getElementById('reset-code');
  const passwordEl = document.getElementById('reset-password');
  const confirmEl = document.getElementById('reset-confirm');
  const submit = document.getElementById('reset-submit');
  const back = document.getElementById('reset-back');
  if (code) codeEl.value = code;
  submit.addEventListener('click', function () {
    accountMessage('', false);
    if ((passwordEl.value || '').length < 6) {
      accountMessage(t('account.passwordTooShort'), true);
      passwordEl.focus();
      return;
    }
    if (passwordEl.value !== confirmEl.value) {
      accountMessage(t('account.passwordsMismatch'), true);
      confirmEl.focus();
      return;
    }
    submit.disabled = true;
    resetPassword(username, (codeEl.value || '').trim(), passwordEl.value)
      .then(function () {
        accountMessage(t('account.reset.done'));
        renderLoginPanel();
      })
      .catch(function (err) {
        accountMessage(err.message || t('account.reset.invalid'), true);
        submit.disabled = false;
      });
  });
  back.addEventListener('click', renderAccount);
}

function renderLoginPanel() {
  const panel = document.getElementById('account-panel');
  if (!panel) return;
  panel.innerHTML =
    '<div class="account__card">' +
    loginFields() +
    '<label class="account__remember">' +
    '<input type="checkbox" id="account-remember" checked>' +
    '<span>' +
    escapeHtml(t('account.remember')) +
    '</span>' +
    '</label>' +
    '<div class="account__actions">' +
    '<button class="btn btn--primary" type="button" id="account-login">' +
    escapeHtml(t('account.login')) +
    '</button>' +
    '<button class="btn" type="button" id="account-register">' +
    escapeHtml(t('account.register')) +
    '</button>' +
    '</div>' +
    '<p class="account__message" id="account-message" role="status"></p>' +
    '<p class="account__hint">' +
    escapeHtml(t('account.hint')) +
    '</p>' +
    '</div>';

  const fields = {
    username: document.getElementById('account-username'),
    email: null,
    password: document.getElementById('account-password'),
    confirm: null,
    remember: document.getElementById('account-remember'),
  };
  const loginButton = document.getElementById('account-login');
  const registerButton = document.getElementById('account-register');
  if (loginButton) {
    loginButton.addEventListener('click', function () {
      signIn(false, fields);
    });
  }
  if (registerButton) {
    registerButton.addEventListener('click', function () {
      openRegisterPanel();
    });
  }
  if (fields.password) {
    fields.password.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') signIn(false, fields);
    });
  }
  const forgot = document.createElement('button');
  forgot.type = 'button';
  forgot.className = 'account__link-btn';
  forgot.id = 'account-forgot';
  forgot.textContent = t('account.forgotPassword');
  forgot.addEventListener('click', openResetPanel);
  panel.querySelector('.account__hint').after(forgot);
}

function openRegisterPanel() {
  const panel = document.getElementById('account-panel');
  if (!panel) return;
  panel.innerHTML =
    '<div class="account__card">' +
    registerFields() +
    '<div class="account__actions">' +
    '<button class="btn" type="button" id="account-login">' +
    escapeHtml(t('account.login')) +
    '</button>' +
    '<button class="btn btn--primary" type="button" id="account-register">' +
    escapeHtml(t('account.register')) +
    '</button>' +
    '</div>' +
    '<p class="account__message" id="account-message" role="status"></p>' +
    '<p class="account__hint">' +
    escapeHtml(t('account.hint')) +
    '</p>' +
    '</div>';

  const fields = {
    username: document.getElementById('account-username'),
    email: document.getElementById('account-email'),
    password: document.getElementById('account-password'),
    confirm: document.getElementById('account-confirm'),
    remember: document.getElementById('account-remember'),
  };
  const loginButton = document.getElementById('account-login');
  const registerButton = document.getElementById('account-register');
  if (loginButton) {
    loginButton.addEventListener('click', function () {
      renderLoginPanel();
    });
  }
  if (registerButton) {
    registerButton.addEventListener('click', function () {
      signIn(true, fields);
    });
  }
  if (fields.confirm) {
    fields.confirm.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') signIn(true, fields);
    });
  }
}

function renderAccount() {
  const panel = document.getElementById('account-panel');
  if (!panel) return;

  if (isLoggedIn()) {
    const session = getSession();
    panel.innerHTML = profileMarkup(session);
    wireProfile();
    refreshProfile();
    return;
  }

  renderLoginPanel();
}

function initBack() {
  const back = document.getElementById('settings-back');
  if (!back) return;
  back.addEventListener('click', function () {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
  });
}

initTheme();
initHistory();
initSuggestionsSetting();
initSafeSearch();
initLanguage();
renderAccount();
initBack();
syncDown();
