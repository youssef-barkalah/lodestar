(function () {
  try {
    var value = localStorage.getItem('lodestar.language') || 'en';
    var code = value === 'any' ? 'en' : value;
    if (/^[a-z]{2}$/.test(code)) {
      document.documentElement.lang = code;
    }
  } catch (e) {}
})();
