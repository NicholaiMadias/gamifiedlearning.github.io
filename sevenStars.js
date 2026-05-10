import stars from './stars.json' assert { type: 'json' };

export function unlockStar(id) {
  const unlocked = JSON.parse(localStorage.getItem('stars') || '[]');
  if (!unlocked.includes(id)) {
    unlocked.push(id);
    localStorage.setItem('stars', JSON.stringify(unlocked));
    showStarToast(id);
  }
}

function showStarToast(id) {
  const star = stars.find(s => s.id === id);
  const el = document.createElement('div');
  el.textContent = `⭐ ${star?.virtue || id} Star Unlocked!`;
  el.style.position = 'fixed';
  el.style.top = '20px';
  el.style.left = '50%';
  el.style.transform = 'translateX(-50%)';
  el.style.background = '#ffd700';
  el.style.color = '#000';
  el.style.padding = '10px 20px';
  el.style.borderRadius = '6px';
  el.style.fontWeight = 'bold';
  el.style.zIndex = 9999;
  document.body.appendChild(el);

  setTimeout(() => el.remove(), 2500);
}
