console.log('[NexusOS] overworld module loaded');

// Inject module stylesheet
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'modules/overworld.css';
document.head.appendChild(link);

const statusEl = document.getElementById('overworld-status');

// Handle node clicks
document.getElementById('overworld-map').addEventListener('click', e => {
  const node = e.target.closest('.ow-node');
  if (!node) return;
  if (node.classList.contains('ow-locked')) {
    if (statusEl) statusEl.textContent = `🔒 "${node.dataset.label}" is locked. Keep progressing!`;
    return;
  }
  const moduleId = node.dataset.node;
  if (statusEl) statusEl.textContent = `Traveling to ${node.dataset.label}…`;
  NexusOS.emit('navigate', { module: moduleId });
  loadModule(moduleId);
});

// Unlock nodes via OS events
NexusOS.on('unlock', ({ node }) => {
  const el = document.querySelector(`.ow-node[data-node="${node}"]`);
  if (el) {
    el.classList.remove('ow-locked');
    el.querySelector('.ow-circle').classList.add('ow-unlocked');
  }
});
