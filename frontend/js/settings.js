import { getTheme, setTheme } from './theme.js';
import {
  getSession,
  isLoggedIn,
  login,
  logout,
  pullSync,
  pushSync,
  register,
} from './account.js';
import {
  all as loadHistoryItems,
  mergeRemote,
  setting as historySettingValue,
} from './history.js';
import {
  LANGUAGES,
  getLanguage,
  setLanguage,
  flagUrl,
  applyLanguageDirection,
} from './languages.js';

const HISTORY_KEY = 'lodestar.searchHistory';
const DEFAULT_HISTORY = '24h';
const THEME_KEY = 'lodestar.theme';
const SUGGESTIONS_KEY = 'lodestar.showSuggestions';

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

function initLanguage() {
  const grid = document.getElementById('lang-grid');
  if (!grid) return;

  const current = getLanguage();
  applyLanguageDirection(current);
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
          applyLanguageDirection(radio.value);
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
        applyLanguageDirection(value);
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

function renderAccount() {
  const panel = document.getElementById('account-panel');
  if (!panel) return;
  if (isLoggedIn()) {
    const session = getSession();
    panel.innerHTML =
      '<p class="account__status">Signed in as <strong>' +
      escapeHtml(session.username) +
      '</strong></p>' +
      '<div class="account__actions">' +
      '<button class="btn" type="button" id="account-sync">Sync now</button>' +
      '<button class="btn" type="button" id="account-logout">Sign out</button>' +
      '</div>' +
      '<p class="account__message" id="account-message" role="status"></p>';
    const sync = document.getElementById('account-sync');
    if (sync) sync.addEventListener('click', syncNow);
    const out = document.getElementById('account-logout');
    if (out) out.addEventListener('click', signOut);
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
initLanguage();
renderAccount();
initBack();
