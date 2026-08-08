const STRONG_RTL =
  /[\u0590-\u05FF\u0600-\u06FF\uFB1D-\uFB4F\uFB50-\uFDFD\uFE70-\uFEFC]/;
const STRONG_LTR = /[A-Za-z]/;

export function directionOf(text) {
  for (const ch of String(text)) {
    if (STRONG_RTL.test(ch)) return 'rtl';
    if (STRONG_LTR.test(ch)) return 'ltr';
  }
  return 'ltr';
}

export function applyDirection(element, text) {
  if (!element) return;
  element.setAttribute('dir', directionOf(text));
}
