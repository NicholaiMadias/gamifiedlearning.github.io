import { getProgress } from './progression.js';

/**
 * Render a star progress map.
 *
 * @param {HTMLElement} container - Container element for the star map
 * @param {Object} [options] - Optional configuration
 * @param {Function} [options.onNodeClick] - Optional click handler (index, completed) => void
 */
export function renderStarMap(container, options = {}) {
  container.innerHTML = '';

  const p = getProgress();
  const { onNodeClick } = options;

  const wrapper = document.createElement('div');
  wrapper.style.display = 'grid';
  wrapper.style.gridTemplateColumns = 'repeat(7, minmax(0, 1fr))';
  wrapper.style.gap = 'clamp(4px, 1.5vw, 12px)';
  wrapper.style.padding = 'clamp(8px, 3vw, 20px)';
  wrapper.style.color = '#fff';
  wrapper.style.textAlign = 'center';

  for (let i = 1; i <= 7; i++) {
    const completed = i <= p.total;
    const star = document.createElement('div');

    // When onNodeClick is provided, make the control keyboard-accessible
    if (onNodeClick) {
      star.setAttribute('role', 'button');
      star.setAttribute('tabindex', '0');
      star.style.cursor = 'pointer';

      const activate = () => onNodeClick(i, completed);

      star.addEventListener('click', activate);
      star.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    } else {
      // Display-only mode
      star.setAttribute('role', 'img');
    }

    star.setAttribute('aria-label', completed ? `Star ${i} — completed` : `Star ${i} — locked`);
    star.style.width = '100%';
    star.style.maxWidth = '64px';
    star.style.aspectRatio = '1 / 1';
    star.style.borderRadius = '50%';
    star.style.display = 'flex';
    star.style.alignItems = 'center';
    star.style.justifyContent = 'center';
    star.style.justifySelf = 'center';
    star.style.fontSize = 'clamp(18px, 4vw, 28px)';
    star.style.fontWeight = 'bold';
    star.style.background = completed
      ? 'radial-gradient(circle, gold, orange)'
      : 'radial-gradient(circle, #333, #111)';
    star.textContent = completed ? '★' : '☆';
    wrapper.appendChild(star);
  }

  container.appendChild(wrapper);
}
