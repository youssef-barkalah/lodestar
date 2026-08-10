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
import {
  LANGUAGES,
  getLanguage,
  setLanguage,
  flagUrl,
} from './languages.js';

const HISTORY_KEY = 'lodestar.searchHistory';
const DEFAULT_HISTORY = '24h';
const THEME_KEY = 'lodestar.theme';
const SUGGESTIONS_KEY = 'lodestar.showSuggestions';
const SAFE_SEARCH_KEY = 'lodestar.safeSearch';

const VALID_HISTORY = ['off', '24h', 'always'];
const VALID_THEMES = ['light', 'dark', 'system'];
const VALID_SUGGESTIONS = ['on', 'off'];

const GLOBE_ICON =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="9"></circle>' +
  '<path d="M3 12h18"></path>' +
  '<path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"></path>' +
  '</svg>';

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
  const grid = document.getElementById('lang-grid');
  if (!grid) return;

  const current = getLanguage();
  const options = [{ code: 'any', name: 'All languages', flag: '' }].concat(
    LANGUAGES
  );

  grid.innerHTML = options
    .map(function (option) {
      const icon = option.flag
        ? '<img class="lang-option__flag" src="' +
          escapeHtml(flagUrl(option.flag)) +
          '" alt="" width="40" height="30" loading="lazy" referrerpolicy="no-referrer">'
        : GLOBE_ICON;
      return (
        '<label class="lang-option' +
        (option.code === current ? ' is-active' : '') +
        '">' +
        '<input type="radio" name="language" value="' +
        escapeHtml(option.code) +
        '"' +
        (option.code === current ? ' checked' : '') +
        '>' +
        '<span class="lang-option__icon" aria-hidden="true">' +
        icon +
        '</span>' +
        '<span class="lang-option__name">' +
        escapeHtml(option.name) +
        '</span>' +
        '</label>'
      );
    })
    .join('');

  grid
    .querySelectorAll('input[name="language"]')
    .forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (radio.checked) {
          setLanguage(radio.value);
          pushSetting({ language: radio.value });
          grid.querySelectorAll('.lang-option').forEach(function (label) {
            const input = label.querySelector('input');
            label.classList.toggle('is-active', input.value === radio.value);
          });
        }
      });
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
        value === 'any' ||
        LANGUAGES.some(function (language) {
          return language.code === value;
        })
      ) {
        setLanguage(value);
        initLanguage();
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
      accountMessage('Synced.');
    })
    .catch(function (err) {
      accountMessage(err.message || 'Something went wrong.', true);
    })
    .then(function () {
      if (button) button.disabled = false;
    });
}

function signIn(createAccount, usernameEl, passwordEl) {
  const username = (usernameEl.value || '').trim();
  const password = passwordEl.value || '';
  accountMessage('', false);
  if (!username) {
    accountMessage('Enter a username.', true);
    usernameEl.focus();
    return;
  }
  if (password.length < 6) {
    accountMessage('Password must be at least 6 characters.', true);
    passwordEl.focus();
    return;
  }
  const action = createAccount ? register(username, password) : login(username, password);
  action
    .then(function () {
      return syncDown();
    })
    .then(function () {
      renderAccount();
    })
    .catch(function (err) {
      accountMessage(err.message || 'Something went wrong.', true);
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
  if (minutes < 1) return 'just now';
  if (minutes < 60) return minutes + 'm ago';
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.round(hours / 24);
  if (days < 30) return days + 'd ago';
  return new Date(then).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function memberSince(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return (
    'Member since ' +
    date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  );
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
    ? '<button class="account__link-btn" id="account-avatar-remove" type="button">Remove photo</button>'
    : '';
  return (
    '<div class="account__profile">' +
    '<button class="account__avatar" id="account-avatar" type="button" aria-label="Change profile photo" title="Change profile photo">' +
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
    '<button class="btn" type="button" id="account-edit-profile">Edit profile</button>' +
    '<button class="btn" type="button" id="account-password">Change password</button>' +
    '<button class="btn" type="button" id="account-sync">Sync now</button>' +
    '<button class="btn" type="button" id="account-logout">Sign out</button>' +
    '</div>' +
    '<div id="account-subpanel"></div>' +
    '<div id="account-devices"></div>' +
    '<div class="account__danger">' +
    '<h3>Delete account</h3>' +
    '<p>This permanently removes your account and all synced data from Lodestar.</p>' +
    '<button class="btn btn--danger" type="button" id="account-delete">Delete account</button>' +
    '<div class="account__card" id="delete-confirm" hidden>' +
    '<p>Type <strong>' +
    escapeHtml(session.username) +
    '</strong> to confirm.</p>' +
    '<input class="account__input" id="delete-username" type="text" autocomplete="off">' +
    '<div class="account__actions">' +
    '<button class="btn btn--danger" type="button" id="delete-confirm-btn" disabled>Delete permanently</button>' +
    '<button class="btn" type="button" id="delete-cancel">Cancel</button>' +
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
      accountMessage(err.message || 'Could not delete your account.', true);
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
          accountMessage('Profile photo removed.');
        })
        .catch(function (err) {
          accountMessage(err.message || 'Could not remove your photo.', true);
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
    accountMessage('Choose a PNG or JPEG photo.', true);
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
          accountMessage('Profile photo updated.');
        })
        .catch(function (err) {
          accountMessage(err.message || 'Could not save your photo.', true);
        });
    };
    image.onerror = function () {
      accountMessage('Could not read that image.', true);
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
    '<h3>Edit profile</h3>' +
    '<label class="account__field"><span>Display name</span>' +
    '<input class="account__input" id="profile-name" type="text" maxlength="40" value="' +
    escapeHtml(session.displayName || '') +
    '"></label>' +
    '<label class="account__field"><span>Bio</span>' +
    '<textarea class="account__input account__textarea" id="profile-bio-input" rows="3" maxlength="300">' +
    escapeHtml(currentBio || '') +
    '</textarea></label>' +
    '<div class="account__actions">' +
    '<button class="btn btn--primary" type="button" id="profile-save">Save</button>' +
    '<button class="btn" type="button" id="profile-cancel">Cancel</button>' +
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
        accountMessage('Profile saved.');
      })
      .catch(function (err) {
        accountMessage(err.message || 'Could not save your profile.', true);
      });
  });
  cancel.addEventListener('click', renderAccount);
}

function openPasswordPanel() {
  const box = document.getElementById('account-subpanel');
  if (!box) return;
  box.innerHTML =
    '<div class="account__card">' +
    '<h3>Change password</h3>' +
    '<label class="account__field"><span>Current password</span>' +
    '<input class="account__input" id="pw-current" type="password" autocomplete="current-password"></label>' +
    '<label class="account__field"><span>New password</span>' +
    '<input class="account__input" id="pw-new" type="password" autocomplete="new-password" minlength="6"></label>' +
    '<label class="account__field"><span>Confirm new password</span>' +
    '<input class="account__input" id="pw-confirm" type="password" autocomplete="new-password"></label>' +
    '<div class="account__actions">' +
    '<button class="btn btn--primary" type="button" id="pw-save">Update password</button>' +
    '<button class="btn" type="button" id="pw-cancel">Cancel</button>' +
    '</div>' +
    '</div>';
  const current = document.getElementById('pw-current');
  const next = document.getElementById('pw-new');
  const confirm = document.getElementById('pw-confirm');
  const save = document.getElementById('pw-save');
  const cancel = document.getElementById('pw-cancel');
  save.addEventListener('click', function () {
    if ((next.value || '').length < 6) {
      accountMessage('New password must be at least 6 characters.', true);
      return;
    }
    if (next.value !== confirm.value) {
      accountMessage('New passwords do not match.', true);
      return;
    }
    changePassword(current.value || '', next.value)
      .then(function () {
        accountMessage('Password updated.');
        openPasswordPanel();
      })
      .catch(function (err) {
        accountMessage(err.message || 'Something went wrong.', true);
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
        ? 'Last seen ' + relativeTime(item.last_seen)
        : '';
      return (
        '<li class="account__device">' +
        '<span class="account__device-name">' +
        (isCurrent ? 'This device' : 'Another device') +
        '</span>' +
        '<span class="account__device-meta">' +
        escapeHtml(meta) +
        '</span>' +
        (isCurrent
          ? ''
          : '<button class="btn account__device-revoke" type="button" data-token="' +
            escapeHtml(item.token) +
            '">Revoke</button>') +
        '</li>'
      );
    })
    .join('');
  box.innerHTML =
    '<div class="account__devices-box">' +
    '<h3>Devices</h3>' +
    '<ul class="account__device-list">' +
    items +
    '</ul>' +
    '<button class="btn" type="button" id="devices-revoke-all">Sign out everywhere</button>' +
    '</div>';
  box.querySelectorAll('.account__device-revoke').forEach(function (button) {
    button.addEventListener('click', function () {
      revokeSession(button.getAttribute('data-token'))
        .then(refreshDevices)
        .catch(function (err) {
          accountMessage(err.message || 'Something went wrong.', true);
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
        bioEl.textContent = currentBio || 'No bio yet.';
      }
    })
    .catch(function () {
      if (!isLoggedIn()) renderAccount();
    });
  refreshDevices();
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

  panel.innerHTML =
    '<div class="account__fields">' +
    '<label class="account__field">' +
    '<span>Username</span>' +
    '<input class="account__input" id="account-username" type="text" autocomplete="username" maxlength="20" required>' +
    '</label>' +
    '<label class="account__field">' +
    '<span>Password</span>' +
    '<input class="account__input" id="account-password" type="password" autocomplete="current-password" minlength="6" required>' +
    '</label>' +
    '</div>' +
    '<div class="account__actions">' +
    '<button class="btn" type="button" id="account-login">Log in</button>' +
    '<button class="btn btn--primary" type="button" id="account-register">Create account</button>' +
    '</div>' +
    '<p class="account__message" id="account-message" role="status"></p>' +
    '<p class="account__hint">Your search history, theme and settings sync between your devices.</p>';

  const usernameEl = document.getElementById('account-username');
  const passwordEl = document.getElementById('account-password');
  const loginButton = document.getElementById('account-login');
  const registerButton = document.getElementById('account-register');
  if (loginButton) {
    loginButton.addEventListener('click', function () {
      signIn(false, usernameEl, passwordEl);
    });
  }
  if (registerButton) {
    registerButton.addEventListener('click', function () {
      signIn(true, usernameEl, passwordEl);
    });
  }
  if (passwordEl) {
    passwordEl.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') signIn(false, usernameEl, passwordEl);
    });
  }
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
