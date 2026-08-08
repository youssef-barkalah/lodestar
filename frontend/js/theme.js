const THEME_KEY = 'lodestar.theme';
const MQL = window.matchMedia('(prefers-color-scheme: dark)');

function resolve(pref) {
  if (pref === 'light' || pref === 'dark') return pref;
  return MQL.matches ? 'dark' : 'light';
}

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {}
}

export function getTheme() {
  return read(THEME_KEY) || 'system';
}

export function setTheme(pref) {
  write(THEME_KEY, pref);
  document.documentElement.dataset.theme = resolve(pref);
}

export function initTheme() {
  document.documentElement.dataset.theme = resolve(getTheme());
  MQL.addEventListener('change', function () {
    if (getTheme() === 'system') {
      document.documentElement.dataset.theme = resolve('system');
    }
  });
}

initTheme();
