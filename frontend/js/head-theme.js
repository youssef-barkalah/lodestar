(function () {
  try {
    var theme = localStorage.getItem('lodestar.theme') || 'system';
    var dark =
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#12121a' : '#ffffff');
  } catch (e) {}
})();
