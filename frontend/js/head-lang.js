(function () {
  try {
    var value = localStorage.getItem('lodestar.language') || 'en';
    var code = /^[a-z]{2}$/.test(value) ? value : 'en';
    document.documentElement.lang = code;
    document.documentElement.dir =
      code === 'ar' || code === 'he' ? 'rtl' : 'ltr';
  } catch (e) {}
})();
