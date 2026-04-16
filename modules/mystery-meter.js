console.log('[NexusOS] mystery-meter module loaded');

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'modules/mystery-meter.css';
document.head.appendChild(link);

const STORAGE_KEY = 'nexus_mystery_value';
let value = parseFloat(localStorage.getItem(STORAGE_KEY) || '0');

const INCREMENTS = {
  'star-collected':       5,
  'badge-earned':         15,
  'combo-tier4':          20,
  'revelation-achieved':  30,
  'lore-unlock':          5,
};

function updateGauge() {
  const pct = Math.min(100, value);
  const fill  = document.getElementById('mm-gauge-fill');
  const label = document.getElementById('mm-gauge-label');
  const wrap  = document.getElementById('mm-gauge-wrap');

  if (fill)  fill.style.width = pct + '%';
  if (label) label.textContent = Math.floor(pct) + '%';
  if (wrap)  wrap.setAttribute('aria-valuenow', Math.floor(pct));

  if (value >= 100) {
    const banner = document.getElementById('mm-banner');
    if (banner) banner.classList.remove('hidden');
    NexusOS.emit('mystery-meter-full', {});
  }
}

function addEvent(label) {
  const eventsEl = document.getElementById('mm-events');
  if (!eventsEl) return;
  const hint = eventsEl.querySelector('.mm-hint');
  if (hint) hint.remove();

  const item = document.createElement('div');
  item.className = 'mm-event-item';
  item.textContent = label;
  eventsEl.appendChild(item);
  if (eventsEl.children.length > 8) eventsEl.firstElementChild.remove();
}

Object.entries(INCREMENTS).forEach(([event, inc]) => {
  NexusOS.on(event, data => {
    value = Math.min(100, value + inc);
    localStorage.setItem(STORAGE_KEY, String(value));
    addEvent(`+${inc}% — ${event.replace(/-/g, ' ')}`);
    updateGauge();
  });
});

updateGauge();
