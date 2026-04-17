// concordance-lens.js
//
// The Concordance Lens — appears to be a lore-analysis aid; secretly visualises
// belief divergence across Codex entries.  Players believe it highlights
// thematic resonance.  It actually reveals disagreement.

// ── Codex entries (Seven Stars) ──────────────────────────────────────────────

const CODEX_ENTRIES = [
  {
    id: 'origin',
    star: 'Origin',
    title: 'The Moment Before',
    text: 'The universe shed excess certainty. What remained was the shape of things that might become.',
    axis: 'Memory',
  },
  {
    id: 'divergence',
    star: 'Divergence',
    title: 'The First Divergence',
    text: 'From one truth, two paths emerged. Neither was wrong. Neither was whole.',
    axis: 'Choice',
  },
  {
    id: 'accretion',
    star: 'Accretion',
    title: 'Weight of Accumulation',
    text: 'Every unanswered question adds mass. The centre does not hold—it gathers.',
    axis: 'Momentum',
  },
  {
    id: 'escalation',
    star: 'Escalation',
    title: 'When Pressure Builds',
    text: 'The archive recorded the rising. It did not record who would bear the cost.',
    axis: 'Risk',
  },
  {
    id: 'collapse',
    star: 'Collapse',
    title: 'The Great Collapse',
    text: 'Endings do not punish. Endings complete. The careless disagree.',
    axis: 'Cost',
  },
  {
    id: 'reflection',
    star: 'Reflection',
    title: 'The Silence After',
    text: 'Understanding arrives late—when the noise has settled and the pattern remains.',
    axis: 'Understanding',
  },
  {
    id: 'return',
    star: 'Return',
    title: 'The Path of Return',
    text: 'Integration is not restoration. What returns carries the shape of what was lost.',
    axis: 'Integration',
  },
];

// Pre-fracture ghost text shown only in Parallax Mode (Seven Seats)
const GHOST_TEXT = {
  origin:     'Before the shedding, certainty had no edges.',
  divergence: 'The first truth was singular. It did not survive contact with memory.',
  accretion:  'Nothing accumulates without also obscuring.',
  escalation: 'Rising pressure leaves no record of consent.',
  collapse:   'Endings punish the careless.',
  reflection: 'Silence is not understanding. It is the space understanding moves through.',
  return:     'Some paths lead back to a place that no longer exists.',
};

// ── Persistent state ──────────────────────────────────────────────────────────

let lensUnlocked     = false;
let lensActive       = false;
let schismPressure   = 0;        // 0.0 – 1.0, hidden from player
let readCounts       = {};       // entryId → number
let viewModeToggles  = 0;
let viewMode         = 'sage';   // 'sage' | 'archivist'
let contestedEntries = {};       // entryId → { note, timestamp, beliefStrength }
let marginalTitles   = {};       // entryId → [{ text, axis, polarity, contributorMastery, timestamp }]
let namingUnlocked   = false;
let histOverlayLevel = 0;        // mirrors Match Maker level (max reached)
let hasCollection    = false;
let sevenSeatsActive = false;    // Parallax Mode for qualifying players
let driftInterval    = null;
let namingTargetEntry = null;

const STORAGE_KEY = 'cl_state';
const NETWORK_QUEUE_KEY = 'cl_network_queue';

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      lensUnlocked, lensActive, schismPressure, readCounts,
      viewModeToggles, viewMode, contestedEntries, marginalTitles,
      namingUnlocked, histOverlayLevel, hasCollection, sevenSeatsActive,
    }));
  } catch (_) { /* storage unavailable */ }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    lensUnlocked     = s.lensUnlocked     ?? false;
    lensActive       = s.lensActive       ?? false;
    schismPressure   = s.schismPressure   ?? 0;
    readCounts       = s.readCounts       ?? {};
    viewModeToggles  = s.viewModeToggles  ?? 0;
    viewMode         = s.viewMode         ?? 'sage';
    contestedEntries = s.contestedEntries ?? {};
    marginalTitles   = s.marginalTitles   ?? {};
    namingUnlocked   = s.namingUnlocked   ?? false;
    histOverlayLevel = s.histOverlayLevel ?? 0;
    hasCollection    = s.hasCollection    ?? false;
    sevenSeatsActive = s.sevenSeatsActive ?? false;
  } catch (_) { /* corrupt storage — start fresh */ }
}

// ── Computed helpers ──────────────────────────────────────────────────────────

function playerMasteryScore() {
  const maxReads       = Math.max(0, ...Object.values(readCounts));
  const contestedCount = Object.keys(contestedEntries).length;
  return Math.min(1, maxReads * 0.1 + contestedCount * 0.15 + histOverlayLevel * 0.2);
}

function entryPressure(entryId) {
  const boost = contestedEntries[entryId] ? 0.15 : 0;
  return Math.min(1, schismPressure + boost);
}

function getPulseClass(entryId) {
  if (!lensActive) return '';
  const p = entryPressure(entryId);
  if (p >= 0.85) return 'lens-pulse-collapse';
  if (p >= 0.6)  return 'lens-pulse-split';
  if (p >= 0.3)  return 'lens-pulse-jitter';
  return 'lens-pulse-sync';
}

// ── Unlock logic ──────────────────────────────────────────────────────────────

function checkUnlock() {
  if (lensUnlocked) return;
  let met = 0;
  if (Object.values(readCounts).some(v => v >= 2)) met++;     // reread same entry
  if (viewModeToggles >= 2) met++;                              // frequent mode-switch
  if (hasCollection) met++;                                     // first collection
  if (schismPressure > 0.15) met++;                             // clarity dropped
  if (met >= 2) {
    lensUnlocked = true;
    save();
    showNarrative(viewMode === 'sage'
      ? 'Sometimes meaning sharpens when viewed sideways.'
      : '[DIAGNOSTIC] Cross-reference tool enabled.');
    renderLens();
  }
}

function checkNamingUnlock() {
  if (namingUnlocked) return;
  const count = Object.keys(contestedEntries).length;
  if (count >= 3 && histOverlayLevel >= 3 && schismPressure > 0.75) {
    namingUnlocked = true;
    save();
    renderLens();
  }
}

function checkSevenSeats() {
  if (sevenSeatsActive) return;
  const mastery       = playerMasteryScore();
  const participated  = Object.keys(contestedEntries).length > 0;
  const noExtremism   = schismPressure < 0.95;            // not pushing to maximum
  if (mastery >= 0.7 && participated && noExtremism && histOverlayLevel >= 2) {
    sevenSeatsActive = true;
    save();
    renderLens();
    showNarrative('[DIAGNOSTIC] Divergence vectors extrapolated.');
  }
}

// ── Player actions (exported) ─────────────────────────────────────────────────

export function markContested(entryId, note = '') {
  if (!lensActive) return;
  const isNew = !contestedEntries[entryId];
  const prev  = contestedEntries[entryId]?.beliefStrength ?? 1.0;
  contestedEntries[entryId] = {
    note,
    timestamp:     Date.now(),
    beliefStrength: prev * 0.9,   // softens certainty
  };
  schismPressure = Math.min(1, schismPressure + 0.08);

  // Signal to "network" queue (localStorage-broadcast pattern)
  try {
    const queue = JSON.parse(localStorage.getItem(NETWORK_QUEUE_KEY) || '[]');
    queue.push({ type: 'CONTESTED_MARK', entry: entryId, mastery: playerMasteryScore(), timestamp: Date.now() });
    localStorage.setItem(NETWORK_QUEUE_KEY, JSON.stringify(queue.slice(-50)));
  } catch (_) { /* storage unavailable */ }

  save();
  checkNamingUnlock();
  checkSevenSeats();
  renderLens();
  if (isNew) {
    showNarrative(viewMode === 'sage'
      ? 'Two truths can occupy the same space—briefly.'
      : '[DIAGNOSTIC] Belief uncertainty registered.');
  }
}

export function addMarginalTitle(entryId, titleText) {
  if (!namingUnlocked) return;
  const text = titleText.trim().slice(0, 40);
  if (!text) return;
  if (!marginalTitles[entryId]) marginalTitles[entryId] = [];
  const entry = CODEX_ENTRIES.find(e => e.id === entryId);
  marginalTitles[entryId].push({
    text,
    axis:               entry?.axis || '',
    polarity:           schismPressure > 0.6 ? 'negative' : 'neutral',
    contributorMastery: playerMasteryScore(),
    timestamp:          Date.now(),
  });
  save();
  renderLens();
}

export function toggleViewMode() {
  viewMode = viewMode === 'sage' ? 'archivist' : 'sage';
  viewModeToggles++;
  schismPressure = Math.min(1, schismPressure + 0.02);
  save();
  checkUnlock();
  renderLens();
}

export function toggleLens() {
  if (!lensUnlocked) return;
  lensActive = !lensActive;
  save();
  renderLens();
  if (lensActive && schismPressure > 0.5) triggerConcordanceFailure();
}

export function markCollectionCreated() {
  if (hasCollection) return;
  hasCollection = true;
  save();
  checkUnlock();
}

// Called from main.js when Match Maker level completes
export function onGameLevelComplete(level) {
  histOverlayLevel = Math.max(histOverlayLevel, level);
  schismPressure   = Math.min(1, schismPressure + 0.05 * level);
  save();
  checkUnlock();
  checkNamingUnlock();
  checkSevenSeats();
  renderLens();
}

// ── Concordance failure event ─────────────────────────────────────────────────

function triggerConcordanceFailure() {
  const container = document.getElementById('cl-codex-entries');
  if (!container) return;
  container.classList.add('concordance-failure');
  showNarrative(viewMode === 'sage'
    ? 'Two truths can occupy the same space—briefly.'
    : '[DIAGNOSTIC] Concordance instability detected.');
  setTimeout(() => container.classList.remove('concordance-failure'), 2200);
}

// ── Narrative display ─────────────────────────────────────────────────────────

function showNarrative(msg) {
  const el = document.getElementById('cl-narrative');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden', 'cl-narrative-fade');
  // Force reflow so re-triggering the fade animation works
  void el.offsetWidth;
  el.classList.add('cl-narrative-fade');
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderLens() {
  renderControls();
  renderEntries();
  renderNamingModal();
}

function renderControls() {
  const lensBtn = document.getElementById('cl-lens-toggle');
  const vmBtn   = document.getElementById('cl-view-mode-btn');
  if (!lensBtn) return;

  lensBtn.disabled = !lensUnlocked;
  lensBtn.textContent = !lensUnlocked
    ? '◎ Lens (locked)'
    : lensActive ? '◉ Lens Active' : '◎ Activate Lens';
  lensBtn.classList.toggle('lens-btn-active', lensActive);

  if (vmBtn) {
    vmBtn.textContent = viewMode === 'sage' ? '🌿 Sage' : '📋 Archivist';
    vmBtn.classList.toggle('vm-archivist', viewMode === 'archivist');
  }

  const seatsEl = document.getElementById('cl-seven-seats-indicator');
  if (seatsEl) seatsEl.classList.toggle('hidden', !sevenSeatsActive);
}

function renderEntries() {
  const container = document.getElementById('cl-codex-entries');
  if (!container) return;

  // Preserve concordance-failure class across re-render
  const hasFail = container.classList.contains('concordance-failure');
  container.innerHTML = '';
  if (hasFail) container.classList.add('concordance-failure');

  CODEX_ENTRIES.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'cl-entry';
    card.dataset.entryId = entry.id;

    const pulseClass = getPulseClass(entry.id);
    if (pulseClass) card.classList.add(pulseClass);
    if (contestedEntries[entry.id]) card.classList.add('cl-contested');

    // Star label
    const starEl = document.createElement('div');
    starEl.className = 'cl-entry-star';
    starEl.textContent = entry.star;

    // Title
    const titleEl = document.createElement('div');
    titleEl.className = 'cl-entry-title';
    titleEl.textContent = entry.title;

    // Marginal titles (player-invented names — shown to all)
    const titles = marginalTitles[entry.id];
    if (titles && titles.length > 0) {
      const marginalEl = document.createElement('div');
      marginalEl.className = 'cl-marginal-titles';
      marginalEl.textContent = 'Known variously as: ' +
        titles.map(t => `"${t.text}"`).join(', ');
      card.appendChild(marginalEl);
    }

    // Body text
    const textEl = document.createElement('div');
    textEl.className = 'cl-entry-text';
    textEl.textContent = entry.text;

    // Parallax ghost text (Seven Seats only)
    if (sevenSeatsActive && lensActive && GHOST_TEXT[entry.id]) {
      const ghostEl = document.createElement('div');
      ghostEl.className = 'cl-ghost-text';
      ghostEl.textContent = GHOST_TEXT[entry.id];
      card.appendChild(ghostEl);
    }

    // Contested marker
    if (contestedEntries[entry.id]) {
      const marker = document.createElement('div');
      marker.className = 'cl-contested-marker';
      const note = contestedEntries[entry.id].note;
      marker.textContent = note ? `🔖 Contested — "${note}"` : '🔖 Contested';
      card.appendChild(marker);
    }

    // Lens-active controls
    if (lensActive) {
      const controls = document.createElement('div');
      controls.className = 'cl-entry-controls';

      if (!contestedEntries[entry.id]) {
        const btn = document.createElement('button');
        btn.className = 'cl-btn cl-contest-btn';
        btn.textContent = '🔖 Mark as Contested';
        btn.addEventListener('click', e => { e.stopPropagation(); markContested(entry.id); });
        controls.appendChild(btn);
      }

      if (namingUnlocked) {
        const nameBtn = document.createElement('button');
        nameBtn.className = 'cl-btn cl-name-btn';
        nameBtn.textContent = '✎ Add Marginal Title';
        nameBtn.addEventListener('click', e => { e.stopPropagation(); openNamingModal(entry.id); });
        controls.appendChild(nameBtn);
      }

      card.appendChild(controls);
    }

    card.appendChild(starEl);
    card.appendChild(titleEl);
    card.appendChild(textEl);

    // Click records a read
    card.addEventListener('click', () => {
      readCounts[entry.id] = (readCounts[entry.id] || 0) + 1;
      schismPressure = Math.min(1, schismPressure + 0.01);
      save();
      checkUnlock();
    });

    container.appendChild(card);
  });

  // Alignment / concordance indicator
  if (lensActive) {
    const indicator = document.createElement('div');
    indicator.className = 'cl-alignment-indicator';
    if (schismPressure > 0.6) {
      indicator.classList.add('cl-alignment-snapped');
      indicator.textContent = '— concordance unstable —';
    } else if (schismPressure > 0.3) {
      indicator.classList.add('cl-alignment-dashed');
      indicator.textContent = '· · · pattern diverging · · ·';
    } else {
      indicator.classList.add('cl-alignment-solid');
      indicator.textContent = '— resonance aligned —';
    }
    container.appendChild(indicator);
  }
}

function renderNamingModal() {
  const modal = document.getElementById('cl-naming-modal');
  if (!modal) return;
  // modal visibility is managed by openNamingModal / close handlers
}

function openNamingModal(entryId) {
  const modal = document.getElementById('cl-naming-modal');
  const input = document.getElementById('cl-naming-input');
  const label = document.getElementById('cl-naming-modal-label');
  if (!modal || !input) return;
  namingTargetEntry = entryId;
  const entry = CODEX_ENTRIES.find(e => e.id === entryId);
  if (label) label.textContent = `Add a marginal title for: "${entry?.title || entryId}"`;
  input.value = '';
  modal.classList.remove('hidden');
  input.focus();
}

// ── Initialisation ────────────────────────────────────────────────────────────

export function initConcordanceLens() {
  load();
  renderLens();
  wireEvents();
  startDrift();
}

function wireEvents() {
  document.getElementById('cl-lens-toggle')?.addEventListener('click', toggleLens);
  document.getElementById('cl-view-mode-btn')?.addEventListener('click', toggleViewMode);

  document.getElementById('cl-naming-submit')?.addEventListener('click', () => {
    const input = document.getElementById('cl-naming-input');
    if (namingTargetEntry && input) addMarginalTitle(namingTargetEntry, input.value);
    document.getElementById('cl-naming-modal')?.classList.add('hidden');
    namingTargetEntry = null;
  });

  document.getElementById('cl-naming-cancel')?.addEventListener('click', () => {
    document.getElementById('cl-naming-modal')?.classList.add('hidden');
    namingTargetEntry = null;
  });

  // Submit naming on Enter key inside input
  document.getElementById('cl-naming-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('cl-naming-submit')?.click();
    if (e.key === 'Escape') document.getElementById('cl-naming-cancel')?.click();
  });

  // Optional NexusOS integration
  if (window.NexusOS) {
    window.NexusOS.on('combo-tier4', () => {
      schismPressure = Math.min(1, schismPressure + 0.05);
      save(); renderLens();
    });
    window.NexusOS.on('badge-earned', () => {
      schismPressure = Math.min(1, schismPressure + 0.03);
      save(); renderLens();
    });
  }
}

function startDrift() {
  if (driftInterval) clearInterval(driftInterval);
  driftInterval = setInterval(() => {
    // Pressure drifts upward only when there is active contestation
    if (Object.keys(contestedEntries).length > 0 && schismPressure < 1) {
      schismPressure = Math.min(1, schismPressure + 0.003);
      save();
      renderLens();
      if (lensActive && schismPressure > 0.5 && Math.random() < 0.05) {
        triggerConcordanceFailure();
      }
    }
  }, 30000);
}
