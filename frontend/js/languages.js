const KEY = 'lodestar.language';
const FLAG_BASE = 'https://flagcdn.com/w40';
const DEFAULT = 'en';

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: 'us' },
  { code: 'ar', name: 'العربية', flag: 'eg' },
  { code: 'zh', name: '中文', flag: 'cn' },
  { code: 'hi', name: 'हिन्दी', flag: 'in' },
  { code: 'es', name: 'Español', flag: 'es' },
  { code: 'fr', name: 'Français', flag: 'fr' },
  { code: 'pt', name: 'Português', flag: 'br' },
  { code: 'ru', name: 'Русский', flag: 'ru' },
  { code: 'ja', name: '日本語', flag: 'jp' },
  { code: 'ko', name: '한국어', flag: 'kr' },
  { code: 'de', name: 'Deutsch', flag: 'de' },
  { code: 'it', name: 'Italiano', flag: 'it' },
  { code: 'tr', name: 'Türkçe', flag: 'tr' },
  { code: 'nl', name: 'Nederlands', flag: 'nl' },
  { code: 'pl', name: 'Polski', flag: 'pl' },
  { code: 'uk', name: 'Українська', flag: 'ua' },
  { code: 'sv', name: 'Svenska', flag: 'se' },
  { code: 'vi', name: 'Tiếng Việt', flag: 'vn' },
  { code: 'id', name: 'Bahasa Indonesia', flag: 'id' },
  { code: 'fa', name: 'فارسی', flag: 'ir' },
  { code: 'he', name: 'עברית', flag: 'il' },
  { code: 'el', name: 'Ελληνικά', flag: 'gr' },
  { code: 'th', name: 'ไทย', flag: 'th' },
  { code: 'cs', name: 'Čeština', flag: 'cz' },
];

export function getLanguage() {
  try {
    const value = localStorage.getItem(KEY) || DEFAULT;
    if (value === 'any') return 'any';
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

export function languageInfo(code) {
  if (code === 'any') {
    return { code: 'any', name: 'All languages', flag: '' };
  }
  for (const language of LANGUAGES) {
    if (language.code === code) return language;
  }
  return { code: DEFAULT, name: 'English', flag: 'us' };
}

export function flagUrl(flag) {
  return flag ? FLAG_BASE + '/' + flag + '.png' : '';
}
