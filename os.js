/* ── Global Event Bus ──────────────────────────────── */
window.NexusOS = {
  events: {},

  on(event, fn) {
    (this.events[event] ||= []).push(fn);
  },

  emit(event, data) {
    (this.events[event] || []).forEach(fn => fn(data));
  }
};

/* ── Module Loader ─────────────────────────────────── */
async function loadModule(id) {
  const content = document.getElementById('main-content');
  content.innerHTML = '<p class="os-loading">Loading module…</p>';

  try {
    const html = await fetch(`modules/${id}.html`).then(r => {
      if (!r.ok) throw new Error(`Module "${id}" not found (${r.status})`);
      return r.text();
    });
    content.innerHTML = html;

    // Load accompanying module script if not already loaded
    if (!document.querySelector(`script[data-module="${id}"]`)) {
      const script = document.createElement('script');
      script.src = `modules/${id}.js`;
      script.dataset.module = id;
      document.body.appendChild(script);
    }

    NexusOS.emit('module-loaded', { id });
  } catch (err) {
    content.innerHTML = `<p class="os-loading">⚠ ${err.message}</p>`;
    console.error('[NexusOS] loadModule error:', err);
  }
}

/* ── Navigation ────────────────────────────────────── */
const navEl = document.getElementById('os-nav');
navEl.addEventListener('click', e => {
  const btn = e.target.closest('.os-nav-btn');
  if (!btn) return;

  navEl.querySelectorAll('.os-nav-btn').forEach(b => b.classList.remove('os-nav-btn--active'));
  btn.classList.add('os-nav-btn--active');

  loadModule(btn.dataset.module);
});

/* ── Particle Effects ──────────────────────────────── */
function spawnParticle() {
  const layer = document.getElementById('particle-layer');
  if (!layer) return;

  const p = document.createElement('div');
  p.className = 'particle';
  p.style.left = Math.random() * window.innerWidth + 'px';
  p.style.top = '-6px';
  layer.appendChild(p);
  setTimeout(() => p.remove(), 3000);
}

setInterval(spawnParticle, 200);

/* ── Reward Engine (inline listener) ─────────────────*/
NexusOS.on('reward-granted', reward => {
  console.info('[NexusOS] Reward granted:', reward);
  // Surface reward to UI if a handler is registered by the active module
  NexusOS.emit('reward-display', reward);
});

/* ── Boot: load default module ─────────────────────── */
loadModule('overworld');
