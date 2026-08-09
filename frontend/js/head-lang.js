(function () {
  try {
    var RTL = ['ar', 'he', 'fa'];
    var value = localStorage.getItem('lodestar.language') || 'en';
    var code = value === 'any' ? 'en' : value;
    if (/^[a-z]{2}$/.test(code)) {
      document.documentElement.lang = code;
      if (RTL.indexOf(code) !== -1) {
        document.documentElement.dir = 'rtl';
      }
    }
  } catch (e) {}
})();
