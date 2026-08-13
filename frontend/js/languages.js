const KEY = 'lodestar.language';
const DEFAULT = 'en';

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ga', name: 'Gaeilge' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'ar', name: 'العربية' },
];

export function getLanguage() {
  try {
    const value = localStorage.getItem(KEY) || DEFAULT;
    return LANGUAGES.some(function (language) {
      return language.code === value;
    })
      ? value
      : DEFAULT;
  } catch (err) {
    return DEFAULT;
  }
}

export function setLanguage(code) {
  try {
    localStorage.setItem(KEY, code);
  } catch (err) {}
}

export function isRtl(code) {
  return code === 'ar';
}
