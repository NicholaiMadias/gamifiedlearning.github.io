console.log('[NexusOS] seven-stars module loaded');

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'modules/seven-stars.css';
document.head.appendChild(link);

const STORAGE_KEY = 'nexus_seven_stars';
let collected = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

function updateUI() {
  const countEl = document.getElementById('ss-collected');
  if (countEl) countEl.textContent = collected.length;

  document.querySelectorAll('.ss-star').forEach(btn => {
    if (collected.includes(btn.dataset.star)) {
      btn.classList.add('ss-star--collected');
      btn.disabled = true;
    }
  });

  if (collected.length >= 7) {
    const banner = document.getElementById('ss-banner');
    if (banner) banner.classList.remove('hidden');
  }
}

document.getElementById('ss-grid').addEventListener('click', e => {
  const btn = e.target.closest('.ss-star');
  if (!btn || btn.disabled) return;

  const star = btn.dataset.star;
  collected.push(star);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collected));

  NexusOS.emit('star-collected', { star });
  NexusOS.emit(`star-collected:${star}`, { star });

  updateUI();

  const status = document.getElementById('ss-status');
  if (status) status.textContent = `✨ ${star} collected!`;
});

updateUI();
