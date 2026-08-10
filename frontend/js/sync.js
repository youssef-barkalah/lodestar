import { isLoggedIn, pullSync } from './account.js';
import { mergeRemote as mergeHistory } from './history.js';
import { mergeRemote as mergeBookmarks } from './bookmarks.js';
import { setTheme } from './theme.js';
import { setLanguage, LANGUAGES } from './languages.js';

const HISTORY_KEY = 'lodestar.searchHistory';
const THEME_KEY = 'lodestar.theme';
const SUGGESTIONS_KEY = 'lodestar.showSuggestions';
const VALID_HISTORY = ['off', '24h', 'always'];
const VALID_THEMES = ['light', 'dark', 'system'];
const VALID_SUGGESTIONS = ['on', 'off'];
const SYNC_INTERVAL = 60 * 1000;

function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {}
}

export function applyRemote(remote) {
  if (!remote || typeof remote !== 'object') return;
  if (Array.isArray(remote.history)) mergeHistory(remote.history);
  if (Array.isArray(remote.bookmarks)) mergeBookmarks(remote.bookmarks);
  if (VALID_HISTORY.indexOf(remote.historySetting) !== -1) {
    save(HISTORY_KEY, remote.historySetting);
  }
  if (VALID_THEMES.indexOf(remote.theme) !== -1) {
    save(THEME_KEY, remote.theme);
    setTheme(remote.theme);
  }
  if (VALID_SUGGESTIONS.indexOf(remote.suggestions) !== -1) {
    save(SUGGESTIONS_KEY, remote.suggestions);
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
    }
  }
}

export async function syncDown() {
  if (!isLoggedIn()) return;
  try {
    const remote = await pullSync();
    applyRemote(remote);
  } catch (err) {}
}

let started = false;

export function startAutoSync() {
  if (started) return;
  started = true;
  syncDown();
  setInterval(syncDown, SYNC_INTERVAL);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) syncDown();
  });
  window.addEventListener('online', function () {
    syncDown();
  });
}
