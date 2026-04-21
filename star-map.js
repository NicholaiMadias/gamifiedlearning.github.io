import { getProgress } from './progression.js';

export function renderStarMap(container) {
  container.innerHTML = '';

  const p = getProgress();

  const wrapper = document.createElement('div');
  wrapper.style.display = 'grid';
  wrapper.style.gridTemplateColumns = 'repeat(7, 1fr)';
  wrapper.style.gap = '12px';
  wrapper.style.padding = '20px';
  wrapper.style.color = '#fff';
  wrapper.style.textAlign = 'center';

  for (let i = 1; i <= 7; i++) {
    const star = document.createElement('div');
    star.style.width = '64px';
    star.style.height = '64px';
    star.style.borderRadius = '50%';
    star.style.display = 'flex';
    star.style.alignItems = 'center';
    star.style.justifyContent = 'center';
    star.style.fontSize = '28px';
    star.style.fontWeight = 'bold';
    star.style.background = i <= p.total
      ? 'radial-gradient(circle, gold, orange)'
      : 'radial-gradient(circle, #333, #111)';
    star.textContent = i <= p.total ? '★' : '☆';
    wrapper.appendChild(star);
  }

  container.appendChild(wrapper);
}
