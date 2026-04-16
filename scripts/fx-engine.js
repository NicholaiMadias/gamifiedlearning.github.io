// fx-engine.js — Visual FX dispatcher

const FX_MAP = {
  'star-collected':     { type: 'sparkle',   color: '#ffd700', count: 12 },
  'combo-tier4':        { type: 'supernova',  color: '#ff4081', count: 30 },
  'revelation-achieved':{ type: 'reveal',     color: '#00e5ff', count: 25 },
  'badge-earned':       { type: 'burst',      color: '#ffd700', count: 20 },
};

function spawnFX({ type, color, count }) {
  const layer = document.getElementById('particle-layer');
  if (!layer) return;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.style.cssText = `
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${color};
      opacity: 0.9;
      left: ${20 + Math.random() * 60}vw;
      top: ${10 + Math.random() * 60}vh;
      animation: particle-fall ${1.5 + Math.random() * 2}s linear forwards;
      pointer-events: none;
    `;
    layer.appendChild(p);
    setTimeout(() => p.remove(), 3500);
  }
}

Object.entries(FX_MAP).forEach(([event, config]) => {
  NexusOS.on(event, () => spawnFX(config));
});
