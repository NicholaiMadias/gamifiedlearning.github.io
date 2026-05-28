/**
 * match-maker-ui.js — UI layer for the Match Maker game.
 * Renders the 7×7 board, handles player input, drives cascade logic,
 * and fires the `matchmaker-level-complete` custom event on each level-up.
 * When the final level is cleared a congratulations screen and downloadable
 * certificate are shown.
 */

import {
  createInitialGrid as createGrid,
  isAdjacent,
  swapGems,
  applyMatches,
  applyGravity,
  findMatches,
  GRID_SIZE,
} from './matchMakerState.js';
import { onLevelComplete } from './badges.js';
import { attachDragToConnect } from './ui/drag-to-connect.js';

<<<<<<< HEAD
let grid;
let selected = null;
let score = 0;
let moves = 20;
let level = 1;
let shards = 0;
let comboChain = 0;
let comboMultiplier = 1;
let db = null;
let user = null;
let resolveTimer = null;
let toastHideTimer = null;

const SCORE_PER_LEVEL = 500;
const CHAIN_REACTION_DELAY_MS = 320;
const MAX_COMBO_MULTIPLIER = 5;

const STORE_ITEMS = [
  { id: 'moves', label: '+5 Moves Flask', cost: 4, detail: 'Refill your focus and gain +5 moves.', action: () => addMoves(5) },
  { id: 'line', label: 'Line Clear Rune', cost: 3, detail: 'Drop a rune that clears a whole line when matched.', action: () => injectSpecial('row') },
  { id: 'bomb', label: 'Crystal Bomb', cost: 5, detail: 'Place a radiant bomb for a 3×3 blast.', action: () => injectSpecial('bomb') },
  { id: 'wild', label: 'Rainbow Wild', cost: 4, detail: 'Adds a wild gem that links any combo.', action: () => injectSpecial('wild') },
];

// Gem image mapping
const GEM_IMAGES = {
  'heart': 'IMG_2669.png',
  'star': 'IMG_2670.png',
  'cross': 'IMG_2671.png',
  'flame': 'IMG_2673.png',
  'drop': 'IMG_2674.png',
  'wild': null // Will use emoji for wild
};

export function initMatchMaker(dbRef, userRef) {
  if (resolveTimer) {
    clearTimeout(resolveTimer);
    resolveTimer = null;
  }
  if (toastHideTimer) {
    clearTimeout(toastHideTimer);
    toastHideTimer = null;
  }
  db = dbRef;
  user = userRef;
  score = 0;
  moves = 20;
  level = 1;
  shards = 0;
  comboChain = 0;
  comboMultiplier = 1;
  selected = null;
  grid = createInitialGrid();
  renderGrid();
  renderStore();
  updateStats();
  const banner = document.getElementById('match-badge-banner');
  if (banner) banner.classList.add('hidden');
  const toast = document.getElementById('match-toast');
  if (toast) toast.classList.add('hidden');
}

function renderGrid(highlightSet = new Set()) {
  const container = document.getElementById('match-grid');
  if (!container) return;
  container.innerHTML = '';

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cellData = grid[r][c];
      if (!cellData) continue;
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'match-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.setAttribute('aria-label', `Gem ${cellData.kind} at row ${r + 1}, column ${c + 1}`);
      cell.classList.add(`gem-${cellData.kind}`);
      if (cellData.special) cell.classList.add(`special-${cellData.special}`);
      if (highlightSet.has(key(r, c))) cell.classList.add('matching');
      if (selected && selected.r === r && selected.c === c) cell.classList.add('selected');

      const glyph = document.createElement('div');
      glyph.className = 'glyph';

      // Use PNG image for regular gems, emoji for wild
      if (GEM_IMAGES[cellData.kind]) {
        glyph.style.backgroundImage = `url('${GEM_IMAGES[cellData.kind]}')`;
      } else {
        glyph.classList.add('emoji');
        glyph.textContent = gemIcon(cellData);
      }

      cell.appendChild(glyph);

      if (cellData.special) {
        const badge = document.createElement('span');
        badge.className = 'special-chip';
        badge.textContent = specialBadge(cellData.special);
        cell.appendChild(badge);
      }

      cell.onclick = () => onCellClick(r, c);
      container.appendChild(cell);
=======
// ── Constants ────────────────────────────────────────────────────────────────
const ROWS          = GRID_SIZE;
const COLS          = GRID_SIZE;
const CASCADE_DELAY = 300;   // ms between cascade steps
const BASE_POINTS   = 10;    // base points per matched gem
const TOTAL_LEVELS  = 7;     // Match Maker is a 7-level mode
const MAX_LEVEL     = TOTAL_LEVELS; // final level — game complete when this level clears

const GEM_EMOJI = {
  heart: '❤️',
  star:  '⭐',
  cross: '✝️',
  flame: '🔥',
  drop:  '💧',
};

const SPECIAL_EMOJI = {
  lineH:    '↔',
  lineV:    '↕',
  bomb:     '💥',
  supernova:'✨',
};

// ── Mutable state ────────────────────────────────────────────────────────────
let dom = {};
let grid, score, moves, level, selected, locked;
let comboLevel, streak, globalMultiplier;
let conscience;
let pendingTimeout = null;
let _certDataUrl   = null;
let _certId        = null;
let _detachDrag    = null;

// ── DOM helpers ──────────────────────────────────────────────────────────────
function cacheDom() {
  dom = {
    board:          document.getElementById('match-grid'),
    score:          document.getElementById('match-score'),
    level:          document.getElementById('match-level'),
    moves:          document.getElementById('match-moves'),
    msg:            document.getElementById('match-msg'),
    empathy:        { bar: document.getElementById('mc-empathy-bar'),  pct: document.getElementById('mc-empathy')  },
    justice:        { bar: document.getElementById('mc-justice-bar'),  pct: document.getElementById('mc-justice')  },
    wisdom:         { bar: document.getElementById('mc-wisdom-bar'),   pct: document.getElementById('mc-wisdom')   },
    growth:         { bar: document.getElementById('mc-growth-bar'),   pct: document.getElementById('mc-growth')   },
    certOverlay:    document.getElementById('mm-cert-overlay'),
    certCanvas:     document.getElementById('mm-cert-canvas'),
    certNamePhase:  document.getElementById('mm-cert-name-phase'),
    certDisplayPhase:  document.getElementById('mm-cert-display-phase'),
    notification:   document.getElementById('mm-notification'),
  };
}

// ── Matrix buffs ───────────────────────────────────────────────────────────

/**
 * Returns which Matrix buffs are currently active based on conscience scores.
 *   empathy  > 70 → heartBoost   : Heart tiles spawn +10 % more often
 *   justice  > 60 → autoResolve  : Invalid swaps don't cost a move
 *   wisdom   > 40 → hintReady    : Hint system active
 *   growth   > 80 → xpBoost      : Score multiplier +20 %
 */
function getActiveBuffs() {
  return {
    heartBoost:  conscience.empathy > BUFF_EMPATHY_THRESHOLD,
    autoResolve: conscience.justice > BUFF_JUSTICE_THRESHOLD,
    hintReady:   conscience.wisdom  > BUFF_WISDOM_THRESHOLD,
    xpBoost:     conscience.growth  > BUFF_GROWTH_THRESHOLD,
  };
}

function updateBuffBadge() {
  if (!dom.buffBadge) return;
  const b = getActiveBuffs();
  const active = [];
  if (b.heartBoost)  active.push('💖 +Heart');
  if (b.autoResolve) active.push('⚖️ Free Miss');
  if (b.hintReady)   active.push('🧠 Hint');
  if (b.xpBoost)     active.push('🌱 +20% XP');
  if (active.length) {
    dom.buffBadge.textContent = active.join(' · ');
    dom.buffBadge.style.display = '';
  } else {
    dom.buffBadge.style.display = 'none';
  }
}

// ── HUD ───────────────────────────────────────────────────────────────────

function updateHUD() {
  if (dom.score) dom.score.textContent = score;
  if (dom.level) dom.level.textContent = level;
  if (dom.moves) dom.moves.textContent = moves;
}

function updateConscience() {
  ['empathy', 'justice', 'wisdom', 'growth'].forEach(k => {
    const pct = Math.round(Math.min(100, conscience[k] || 0));
    if (dom[k]?.bar) {
      const valueText = pct + '%';
      const progressbar = dom[k].bar.parentElement;

      dom[k].bar.style.width = valueText;
      dom[k].bar.setAttribute('aria-valuenow', String(pct));
      dom[k].bar.setAttribute('aria-valuetext', valueText);

      if (progressbar) {
        progressbar.setAttribute('aria-valuenow', String(pct));
        progressbar.setAttribute('aria-valuetext', valueText);
      }
    }
    if (dom[k]?.pct) dom[k].pct.textContent = pct + '%';
  });
  updateBuffBadge();
}

function pulseBuffRow(rowEl) {
  if (!rowEl) return;
  rowEl.classList.remove('buff-pulse');
  void rowEl.offsetWidth; // restart animation
  rowEl.classList.add('buff-pulse');
}

function bumpConscience(matchCount) {
  const keys = ['empathy', 'justice', 'wisdom', 'growth'];
  const key  = keys[Math.floor(Math.random() * keys.length)];
  conscience[key] = Math.min(100, (conscience[key] || 0) + matchCount * 2);
  updateConscience();

  // Pulse newly activated buff rows
  const curr = getActiveBuffs();
  if (curr.heartBoost  && !prevBuffs.heartBoost)  pulseBuffRow(dom.rowEmpathy);
  if (curr.autoResolve && !prevBuffs.autoResolve) pulseBuffRow(dom.rowJustice);
  if (curr.hintReady   && !prevBuffs.hintReady)   pulseBuffRow(dom.rowWisdom);
  if (curr.xpBoost     && !prevBuffs.xpBoost)     pulseBuffRow(dom.rowGrowth);
  prevBuffs = curr;
}

// ── Messages ──────────────────────────────────────────────────────────────

function showMsg(text, duration = 1500) {
  if (!dom.msg) return;
  dom.msg.textContent = text;
  clearTimeout(msgTimer);
  if (duration > 0) {
    msgTimer = setTimeout(() => { if (dom.msg) dom.msg.textContent = ''; }, duration);
  }
}

function showCombo(chain) {
  if (!dom.combo) return;
  const labels = ['', '', 'Combo!', 'Combo ×3!', 'Combo ×4!', 'Combo ×5!', '✨ Supernova!'];
  dom.combo.textContent = chain < labels.length ? labels[chain] : '✨ SUPERNOVA!';
  dom.combo.classList.remove('combo-pop');
  void dom.combo.offsetWidth; // restart animation
  dom.combo.classList.add('combo-pop');
  clearTimeout(comboTimer);
  comboTimer = setTimeout(() => {
    if (dom.combo) { dom.combo.textContent = ''; dom.combo.classList.remove('combo-pop'); }
  }, 900);
}

function showMsg(text) {
  if (dom.msg) dom.msg.textContent = text;
}

function showNotification(text) {
  if (!dom.notification) return;
  dom.notification.textContent = text;
  dom.notification.removeAttribute('hidden');
  dom.notification.classList.remove('hidden');
  setTimeout(() => {
    dom.notification.setAttribute('hidden', '');
    dom.notification.classList.add('hidden');
  }, 3500);
}

function renderBoard() {
  if (!dom.board) return;
  dom.board.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const gem  = grid[r][c];
      const cell = document.createElement('div');
      cell.className = 'gem-cell';
      cell.dataset.row = String(r);
      cell.dataset.col = String(c);
      if (gem) {
        cell.className += ' gem-' + gem.type;
        cell.textContent = gem.special
          ? (SPECIAL_EMOJI[gem.special] || '★')
          : (GEM_EMOJI[gem.type] || gem.type[0].toUpperCase());
      }
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-label', gem
        ? gem.type + ' gem' + (gem.special ? ' (' + gem.special + ')' : '')
        : 'empty cell');
      if (selected && selected.row === r && selected.col === c) {
        cell.classList.add('selected');
      }
      cell.onclick   = () => onCellClick(r, c);
      cell.onkeydown = (e) => onCellKey(e, r, c);
      dom.board.appendChild(cell);
>>>>>>> origin/main
    }
  }
}

<<<<<<< HEAD
function gemIcon(cell) {
  switch (cell.kind) {
    case 'heart': return '💖';
    case 'star': return '⭐';
    case 'cross': return '✝️';
    case 'flame': return '🔥';
    case 'drop': return '💧';
    case 'wild': return '🌈';
    default: return '⬛';
  }
}

function specialBadge(special) {
  if (special === 'row') return '─';
  if (special === 'col') return '│';
  if (special === 'bomb') return '✦';
  return '☆';
}

function onCellClick(r, c) {
  if (moves <= 0) return;

  if (!selected) {
    selected = { r, c };
    renderGrid();
    return;
  }

  const { r: r1, c: c1 } = selected;
  if (r === r1 && c === c1) {
    selected = null;
    renderGrid();
    return;
  }

  if (!canSwap(grid, r1, c1, r, c)) {
    selected = { r, c };
    renderGrid();
    return;
  }

  const swapped = applySwap(grid, r1, c1, r, c);
  const matches = findMatches(swapped);

  if (matches.length === 0) {
    selected = null;
    renderGrid();
    return;
  }

  grid = swapped;
  selected = null;
  moves--;
  updateStats();

  resolveMatches();
}

function resolveMatches() {
  const groups = findMatches(grid);
  if (groups.length === 0) {
    comboChain = 0;
    comboMultiplier = 1;
    renderGrid();
    checkLevelUp();
    checkGameOver();
    return;
  }

  comboChain++;
  comboMultiplier = Math.min(MAX_COMBO_MULTIPLIER, 1 + (comboChain - 1) * 0.4);

  const matchSet = collectMatchSet(groups);
  const explodedSet = expandSpecials(matchSet);
  const matchCells = [...explodedSet].map(fromKey);

  const spawns = deriveSpecialSpawns(groups);
  const shardGain = Math.max(1, Math.floor(matchCells.length / 4)) + (comboChain > 1 ? 1 : 0);

  shards += shardGain;
  score += Math.round(matchCells.length * 12 * comboMultiplier);
  flashStatus(`Chain x${comboChain}! +${shardGain} shards`);
  updateStats();
  renderGrid(explodedSet);

  // Create particle effects for matched gems
  createParticles(matchCells);

  grid = clearMatches(grid, matchCells, spawns);
  grid = applyGravity(grid);

  resolveTimer = setTimeout(() => {
    resolveTimer = null;
    resolveMatches();
  }, CHAIN_REACTION_DELAY_MS);
}

function deriveSpecialSpawns(groups) {
  const spawns = [];
  groups.forEach(group => {
    if (group.length < 4) return;
    const anchor = group[Math.floor(group.length / 2)];
    const sameRow = group.every(p => p.r === group[0].r);
    const special = sameRow ? 'row' : 'col';
    const kind = grid[anchor.r][anchor.c]?.kind || 'star';
    spawns.push({ r: anchor.r, c: anchor.c, kind, special });

    if (group.length >= 5) {
      const extra = group[0];
      spawns.push({ r: extra.r, c: extra.c, kind: 'wild', special: 'wild' });
    }
  });

  const unique = new Map();
  spawns.forEach(s => unique.set(key(s.r, s.c), s));
  return [...unique.values()];
}

function expandSpecials(matchSet) {
  const expanded = new Set(matchSet);
  matchSet.forEach(k => {
    const { r, c } = fromKey(k);
    const cell = grid[r][c];
    if (!cell || !cell.special) return;
    if (cell.special === 'wild') return;
    if (cell.special === 'row') {
      for (let col = 0; col < GRID_SIZE; col++) expanded.add(key(r, col));
    } else if (cell.special === 'col') {
      for (let row = 0; row < GRID_SIZE; row++) expanded.add(key(row, c));
    } else {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
            expanded.add(key(nr, nc));
          }
        }
      }
    }
  });
  return expanded;
}

function collectMatchSet(groups) {
  const set = new Set();
  groups.forEach(g => g.forEach(({ r, c }) => set.add(key(r, c))));
  return set;
}

function addMoves(amount) {
  moves += amount;
  flashStatus(`+${amount} moves restored`);
}

function injectSpecial(special) {
  const openCells = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]?.special) openCells.push({ r, c });
    }
  }
  if (openCells.length === 0) {
    flashStatus('No open cells available');
    return;
  }
  const target = openCells[Math.floor(Math.random() * openCells.length)];
  const existingKind = grid[target.r][target.c]?.kind || 'star';
  grid[target.r][target.c] = { kind: special === 'wild' ? 'wild' : existingKind, special };
  flashStatus(`${specialLabel(special)} placed`);
  renderGrid();
}

function specialLabel(special) {
  if (special === 'row') return 'Line rune';
  if (special === 'col') return 'Column rune';
  if (special === 'bomb') return 'Crystal bomb';
  return 'Rainbow wild';
}

function purchase(item) {
  if (shards < item.cost) {
    flashStatus('Not enough shards');
    return;
  }
  shards -= item.cost;
  item.action();
  updateStats();
}

function renderStore() {
  const container = document.getElementById('match-store-items');
  if (!container) return;
  container.innerHTML = '';
  STORE_ITEMS.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'store-item';
    btn.dataset.itemId = item.id;
    btn.innerHTML = `
      <div class="store-title">${item.label}</div>
      <div class="store-meta">Cost: ${item.cost} shards • ${item.detail}</div>
    `;
    btn.onclick = () => purchase(item);
    container.appendChild(btn);
  });
}

function updateStats() {
  const scoreEl = document.getElementById('match-score');
  const movesEl = document.getElementById('match-moves');
  const levelEl = document.getElementById('match-level');
  const comboEl = document.getElementById('match-combo');
  const chainEl = document.getElementById('match-chain');
  const shardEl = document.getElementById('match-shards');

  // Trigger score pop animation on significant score changes
  const prevScore = parseInt(scoreEl?.textContent || '0');
  const scoreChange = score - prevScore;

  if (scoreEl) {
    scoreEl.textContent = score;
    if (scoreChange > 20) {
      const scoreDiv = scoreEl.parentElement;
      scoreDiv?.classList.add('score-pop');
      setTimeout(() => scoreDiv?.classList.remove('score-pop'), 500);
    }
  }

  if (movesEl) movesEl.textContent = moves;
  if (levelEl) levelEl.textContent = level;
  if (comboEl) comboEl.textContent = `${comboMultiplier.toFixed(1)}x`;
  if (chainEl) chainEl.textContent = comboChain > 0 ? `Chain ${comboChain}` : 'Chain 0';
  if (shardEl) shardEl.textContent = shards;

  // Add visual feedback for active combos
  const comboChip = comboEl?.closest('.momentum-chip');
  const chainChip = chainEl?.closest('.momentum-chip');

  if (comboChip) {
    comboChip.classList.toggle('active', comboMultiplier > 1);
  }
  if (chainChip) {
    chainChip.classList.toggle('active', comboChain > 0);
  }
=======
// ── Certificate system ───────────────────────────────────────────────────────
function generateCertId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return 'MM-' + crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
    }
  } catch (_) { /* fall through to deterministic fallback */ }
  // Fallback for environments without crypto.randomUUID
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = (Date.now() ^ performance.now()).toString(36).slice(-4).toUpperCase();
  return 'MM-' + ts + '-' + rand;
}

async function drawCertificate(canvas, playerName, gameTitle, completionDate, certId, finalScore) {
  await document.fonts.ready;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context is unavailable');
  const W = 800, H = 560;
  canvas.width  = W;
  canvas.height = H;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#020617');
  bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Decorative star particles
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = 'rgba(255,255,255,' + (0.08 + (i % 5) * 0.04) + ')';
    ctx.fillRect(((i * 127 + 50) % (W - 60)) + 30, ((i * 97 + 30) % (H - 60)) + 30, 2, 2);
  }

  // Outer border
  ctx.strokeStyle = '#00f2ff';
  ctx.lineWidth   = 3;
  ctx.strokeRect(12, 12, W - 24, H - 24);

  // Inner border
  ctx.strokeStyle = 'rgba(188,19,254,0.3)';
  ctx.lineWidth   = 1;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  // Corner dots
  ctx.fillStyle = 'rgba(0,242,255,0.6)';
  [[16, 16], [W - 16, 16], [16, H - 16], [W - 16, H - 16]].forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.textAlign = 'center';

  // Title
  ctx.fillStyle = '#00f2ff';
  ctx.font      = 'bold 26px monospace';
  ctx.fillText('CERTIFICATE OF COMPLETION', W / 2, 76);

  // Rule
  ctx.strokeStyle = 'rgba(0,242,255,0.2)';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(80, 96); ctx.lineTo(W - 80, 96); ctx.stroke();

  // Org name
  ctx.fillStyle = '#bc13fe';
  ctx.font      = '11px monospace';
  ctx.fillText('MATCH MAKER  \u00b7  NEXUS ARCADE', W / 2, 118);

  // Body copy
  ctx.fillStyle = '#94a3b8';
  ctx.font      = '15px sans-serif';
  ctx.fillText('This certifies that', W / 2, 176);

  ctx.fillStyle = '#ffffff';
  ctx.font      = 'bold 40px monospace';
  ctx.fillText(playerName, W / 2, 236);

  ctx.fillStyle = '#94a3b8';
  ctx.font      = '15px sans-serif';
  ctx.fillText('has successfully completed all levels of', W / 2, 282);

  ctx.fillStyle = '#fbbf24';
  ctx.font      = 'bold 28px monospace';
  ctx.fillText(gameTitle, W / 2, 334);

  ctx.fillStyle = '#22d3ee';
  ctx.font      = '13px monospace';
  ctx.fillText('Final Score: ' + finalScore, W / 2, 374);

  // Rule
  ctx.strokeStyle = 'rgba(0,242,255,0.15)';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(80, 410); ctx.lineTo(W - 80, 410); ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font      = '13px sans-serif';
  ctx.fillText('Completed: ' + completionDate, W / 2, 440);

  ctx.fillStyle = '#334155';
  ctx.font      = '11px monospace';
  ctx.fillText('Certificate ID: ' + certId, W / 2, 468);
>>>>>>> origin/main
}

function showGameComplete() {
  locked = true;
  // Reset to name-input phase then reveal overlay
  if (dom.certNamePhase) dom.certNamePhase.classList.remove('hidden');
  if (dom.certDisplayPhase) dom.certDisplayPhase.classList.add('hidden');
  if (dom.certOverlay)   dom.certOverlay.classList.remove('hidden');
  window.dispatchEvent(new CustomEvent('matchmaker-game-complete', {
    detail: { level: MAX_LEVEL, score },
  }));
}

/**
 * Called by the host page when the player submits their name.
 * Draws the certificate and activates the download buttons.
 */
export async function generateCertificateFor(playerName) {
  const name           = (playerName || '').trim().slice(0, 30) || 'Player';
  const certId         = generateCertId();
  const gameTitle      = 'Match Maker';
  const completionDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  try {
    const cert  = { id: certId, player: name, game: gameTitle, date: completionDate, score };
    const certs = JSON.parse(localStorage.getItem('arcade-certificates') || '[]');
    certs.push(cert);
    localStorage.setItem('arcade-certificates', JSON.stringify(certs));
  } catch (_) { /* storage unavailable */ }

  if (dom.certCanvas) {
    try {
      await drawCertificate(dom.certCanvas, name, gameTitle, completionDate, certId, score);
      _certDataUrl = dom.certCanvas.toDataURL('image/png');
      _certId      = certId;
    } catch (err) {
      showNotification('Certificate could not be drawn: ' + err.message);
      throw err;
    }
  }

  // Switch overlay to certificate phase
  if (dom.certNamePhase) dom.certNamePhase.classList.add('hidden');
  if (dom.certDisplayPhase) dom.certDisplayPhase.classList.remove('hidden');

  return certId;
}

export function downloadMatchMakerCertPNG() {
  if (!_certDataUrl) return;
  const a    = document.createElement('a');
  a.download = 'match-maker-certificate-' + (_certId || 'nexus') + '.png';
  a.href     = _certDataUrl;
  a.click();
}

export function downloadMatchMakerCertPDF() {
  if (!_certDataUrl) return;
  const win = window.open('', '_blank', 'noopener');
  if (!win) {
    showNotification('Please allow pop-ups to save the certificate as PDF.');
    return;
  }
  win.opener = null;
  win.document.write(
    '<!DOCTYPE html><html><head><title>Certificate \u2014 Match Maker</title>' +
    '<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#020617;display:flex;' +
    'justify-content:center;align-items:center;min-height:100vh}img{width:100%;max-width:800px}' +
    '@media print{body{background:white}}</style></head><body>' +
    '<img src="' + _certDataUrl + '">' +
    '<script>setTimeout(function(){window.print()},400);<\/script></body></html>'
  );
  win.document.close();
}

// ── Input handlers ───────────────────────────────────────────────────────────
function onCellClick(row, col) {
  if (locked || gameOver) return;
  if (!selected) {
    selected = { row, col };
    renderBoard();
  } else if (selected.row === row && selected.col === col) {
    selected = null;
    renderBoard();
  } else if (canSwap(grid, selected.row, selected.col, row, col)) {
    attemptSwap(selected.row, selected.col, row, col);
  } else {
    selected = { row, col };
    renderBoard();
  }
}

function onCellKey(e, row, col) {
  let targetR = row, targetC = col;
  switch (e.key) {
    case 'ArrowUp':    targetR = Math.max(0, row - 1);        break;
    case 'ArrowDown':  targetR = Math.min(ROWS - 1, row + 1); break;
    case 'ArrowLeft':  targetC = Math.max(0, col - 1);        break;
    case 'ArrowRight': targetC = Math.min(COLS - 1, col + 1); break;
    case 'Enter': case ' ':
      e.preventDefault();
      onCellClick(row, col);
      return;
    case 'Escape':
      selected = null;
      renderBoard();
      return;
    default: return;
  }
  e.preventDefault();
  const idx   = targetR * COLS + targetC;
  const cells = dom.board.querySelectorAll('.gem-cell');
  if (cells[idx]) cells[idx].focus();
}

// ── Swap & cascade ────────────────────────────────────────────────────────

function attemptSwap(r1, c1, r2, c2) {
  if (moves <= 0) {
    locked = false;
    showMsg('No moves left — restart to play again!');
    return;
  }

  locked    = true;
  selected  = null;
  grid      = swapGems(grid, r1, c1, r2, c2);
  moves--;
  comboLevel = 0;
  updateHUD();
  renderBoard();

  const result = findMatches(grid);
  if (!result || !result.matches || result.matches.length === 0) {
    if (pendingTimeout) { clearTimeout(pendingTimeout); pendingTimeout = null; }
    pendingTimeout = setTimeout(() => {
      grid = swapGems(grid, r1, c1, r2, c2);
      moves++;   // restore move — invalid swaps don't cost a turn
      streak           = 0;
      globalMultiplier = 1.0;
      showMsg('No match — try again');
      updateHUD();
      renderBoard();
      pendingTimeout = setTimeout(() => { showMsg(''); pendingTimeout = null; }, 1200);
      locked = false;
      checkGameOver();
    }, CASCADE_DELAY);
  } else {
    processCascade(true);
  }
}

function processCascade(isFirstPass = false) {
  const result = findMatches(grid);
  if (!result || !result.matches || result.matches.length === 0) {
    if (isFirstPass) {
      streak           = 0;
      globalMultiplier = 1.0;
    }
    checkLevelUp();
    locked = false;
    updateHUD();
    renderBoard();
    return;
  }

  comboLevel++;

  const comboBonus  = 1 + (comboLevel - 1) * 0.25;
  const streakBonus = 1 + streak * 0.1;
  const multiplier  = globalMultiplier * comboBonus * streakBonus;
  const gained      = result.matches.length * BASE_POINTS * multiplier;
  score += Math.floor(gained);

  if (comboLevel > 1) {
    showMsg('Combo x' + comboLevel + '! +' + Math.floor(gained));
  }

  bumpConscience(result.matches.length);
  highlightMatched(result.matches);

  if (pendingTimeout) { clearTimeout(pendingTimeout); pendingTimeout = null; }
  pendingTimeout = setTimeout(() => {
    pendingTimeout = null;
    grid = applyMatches(grid, result, comboLevel);
    grid = applyGravity(grid);

    if (isFirstPass) {
      streak++;
      globalMultiplier = Math.min(globalMultiplier + 0.1, 3.0);
    }

    updateHUD();
    renderBoard();
    pendingTimeout = setTimeout(() => { pendingTimeout = null; processCascade(false); }, CASCADE_DELAY);
  }, CASCADE_DELAY);
}

function highlightMatched(matches) {
  if (!dom.board) return;
  const cells = dom.board.querySelectorAll('.gem-cell');
  matches.forEach(group => {
    group.forEach(({ r, c }) => {
      const idx = r * COLS + c;
      if (cells[idx]) cells[idx].classList.add('matched');
    });
  });
}

// ── Seven Stars — lavender clue system ────────────────────────────────────

function updateLavenderProgress() {
  const pct = Math.min(lavenderPending / LAVENDER_CLUE_THRESHOLD, 1) * 100;
  if (dom.lavPending) dom.lavPending.textContent = lavenderPending;
  if (dom.lavFill)    dom.lavFill.style.width = pct + '%';
}

function handleLavenderMatch(count) {
  lavenderPending += count;
  updateLavenderProgress();
  while (lavenderPending >= LAVENDER_CLUE_THRESHOLD) {
    lavenderPending -= LAVENDER_CLUE_THRESHOLD;
    clueFragments++;
    updateLavenderProgress();
    updateHUD();
    revealClue(clueFragments);
  }
}

const CLUE_TEXTS = [
  '🌸 Clue 1: "A lavender scent lingers near the Seven Stars lens…"',
  '🌸 Clue 2: "Dr. Reed keeps lavender sachets on her writing desk…"',
  '🌸 Clue 3: "Lord Blackwood wore lavender cologne at dinner that night…"',
];

function revealClue(n) {
  if (n <= CLUE_TEXTS.length) {
    const text = CLUE_TEXTS[n - 1];
    showMsg(text, 3500);
    // Append to clue history log
    if (dom.clueHistory) {
      const entry = document.createElement('p');
      entry.className = 'clue-entry';
      entry.textContent = text;
      dom.clueHistory.appendChild(entry);
    }
    // Shake the clue card
    if (dom.clueCard) {
      dom.clueCard.classList.remove('clue-shake');
      void dom.clueCard.offsetWidth;
      dom.clueCard.classList.add('clue-shake');
    }
  }
  // After 3 clues, show the suspect panel, then shake + glow it
  if (n === CLUE_TEXTS.length && !chosenSuspect && dom.suspect) {
    dom.suspect.style.display = '';
  }
  // Shake + glow only when the panel is actually visible
  if (dom.suspect && dom.suspect.style.display !== 'none') {
    dom.suspect.classList.remove('clue-shake');
    void dom.suspect.offsetWidth; // force reflow to restart animation
    dom.suspect.classList.add('clue-shake');
    dom.suspect.addEventListener('animationend', () => dom.suspect.classList.remove('clue-shake'), { once: true });
  }
}

function chooseSuspect(suspect) {
  chosenSuspect = suspect;
  if (suspect === 'reed') {
    conscience.wisdom = Math.min(100, conscience.wisdom + 15);
    showMsg('🧠 Dr. Reed — Wisdom +15!', 2500);
  } else {
    conscience.justice = Math.min(100, conscience.justice + 15);
    showMsg('⚖️ Lord Blackwood — Justice +15!', 2500);
  }
  updateConscience();
  if (dom.suspect) dom.suspect.style.display = 'none';
}

// ── Level & game-over ─────────────────────────────────────────────────────

function checkLevelUp() {
  const threshold = 500 * level;
  if (score >= threshold) {
    level++;
<<<<<<< HEAD
    moves += 10;
    flashStatus(`Level up! Level ${level}`);
    updateStats();
  }
}

function checkGameOver() {
  if (moves <= 0) {
    const banner = document.getElementById('match-badge-banner');
    if (banner) {
      banner.textContent = `Game Over! Final score: ${score}`;
      banner.classList.remove('hidden');
=======
    movesLeft += 5; // bonus moves for reaching a new level
    updateHUD();
    window.dispatchEvent(new CustomEvent('matchmaker-level-complete', { detail: { level: level - 1 } }));
    if (level - 1 >= MAX_LEVEL) {
      onLevelComplete(level - 1, score, null, null);
      showGameComplete();
    } else {
      showMsg('Level ' + level + ' — Keep going!');
      onLevelComplete(level - 1, score, null, null);
>>>>>>> origin/main
    }
  }
}

<<<<<<< HEAD
function flashStatus(text) {
  const toast = document.getElementById('match-toast');
  if (toast) {
    toast.textContent = text;
    toast.classList.remove('hidden');
    if (toastHideTimer) clearTimeout(toastHideTimer);
    toastHideTimer = setTimeout(() => {
      toast.classList.add('hidden');
      toastHideTimer = null;
    }, 2000);
  }
}

function key(r, c) {
  return `${r}:${c}`;
}

function fromKey(k) {
  const [r, c] = k.split(':').map(Number);
  return { r, c };
}

function createParticles(matchCells) {
  const container = document.getElementById('match-grid');
  if (!container) return;

  matchCells.forEach(({ r, c }) => {
    const cellEl = container.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    if (!cellEl) return;

    const rect = cellEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Create 6-8 particles per gem
    const particleCount = 6 + Math.floor(Math.random() * 3);

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';

      // Random color based on gem type
      const cell = grid[r][c];
      const colors = {
        'heart': '#ff6b9d',
        'star': '#ffd700',
        'cross': '#7ea6ff',
        'flame': '#ff6347',
        'drop': '#4fc3f7',
        'wild': '#7effd8'
      };
      particle.style.background = colors[cell?.kind] || '#7effd8';

      // Position relative to cell
      const offsetX = rect.left - containerRect.left + rect.width / 2;
      const offsetY = rect.top - containerRect.top + rect.height / 2;
      particle.style.left = offsetX + 'px';
      particle.style.top = offsetY + 'px';

      // Random trajectory
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const distance = 30 + Math.random() * 40;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      particle.style.setProperty('--tx', tx + 'px');
      particle.style.setProperty('--ty', ty + 'px');

      container.appendChild(particle);

      // Remove after animation
      setTimeout(() => particle.remove(), 800);
    }
  });
=======
// ── Public API ───────────────────────────────────────────────────────────────
export function initMatchMaker(db, user) {
  if (pendingTimeout) { clearTimeout(pendingTimeout); pendingTimeout = null; }
  cacheDom();
  if (dom.board) {
    if (_detachDrag) _detachDrag();
    _detachDrag = attachDragToConnect(dom.board, {
      cellSelector: '.gem-cell',
      getCoord: el => {
        const row = Number(el.dataset.row);
        const col = Number(el.dataset.col);
        if (!Number.isFinite(row) || !Number.isFinite(col)) return null;
        return { row, col };
      },
      canConnect: (from, to) => isAdjacent(from.row, from.col, to.row, to.col),
      onConnect: (from, to) => {
        if (locked) return;
        // Preserve click/keyboard semantics; drag simply performs the same adjacent swap action.
        attemptSwap(from.row, from.col, to.row, to.col);
      },
    });
  }
  grid             = createGrid();
  score            = 0;
  moves            = 20;
  level            = 1;
  selected         = null;
  locked           = false;
  comboLevel       = 0;
  streak           = 0;
  globalMultiplier = 1.0;
  conscience       = { empathy: 0, justice: 0, wisdom: 0, growth: 0 };
  _certDataUrl     = null;
  _certId          = null;

  if (dom.certOverlay) dom.certOverlay.classList.add('hidden');

  updateHUD();
  updateConscience();
  renderBoard();
  showMsg('Match the gems — align your conscience', 2000);
>>>>>>> origin/main
}
