export function onLevelComplete(level, score) {
  const banner = document.getElementById('match-banner');
  if (!banner) return;
  banner.textContent = `Level ${level - 1} cleared! Total score: ${score}`;
  banner.classList.add('visible');
  setTimeout(() => banner.classList.remove('visible'), 2000);
}
