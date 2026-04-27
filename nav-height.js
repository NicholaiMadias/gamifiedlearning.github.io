/* Dynamically keeps --site-nav-height in sync with the actual rendered nav.
   Include this script at the end of <body> on every page that uses .site-nav. */
(function () {
  function updateNavHeight() {
    var nav = document.querySelector('.site-nav');
    if (!nav) return;
    document.documentElement.style.setProperty('--site-nav-height', nav.offsetHeight + 'px');
  }
  updateNavHeight();
  window.addEventListener('load', updateNavHeight);
  window.addEventListener('resize', updateNavHeight);
})();
