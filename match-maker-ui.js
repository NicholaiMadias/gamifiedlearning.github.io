<<<<<<< copilot/improve-gameplay
// match-maker-ui.js
import {
  createInitialGrid,
  canSwap,
  applySwap,
  findMatches,
  clearMatches,
  applyGravity,
  applyBombExplosion,
  applyRainbowClear,
  findMostCommonType,
  GEM_TYPES,
  SPECIAL_GEM_TYPES,
  GRID_SIZE,
} from './matchMakerState.js';
import { onLevelComplete } from './badges.js';

// ── State ────────────────────────────────────────────────
let grid;
let selected = null;
let score = 0;
let moves = 20;
let level = 1;
let coins = 0;
let chainDepth = 0;
let lastSwap = null;
let db = null;
let user = null;
let runId = 0;
let pendingTimeout = null;
let bannerHideTimer = null;

const SCORE_PER_LEVEL = 500;
// 350 ms matches the gem-pop animation duration (320 ms) plus a small buffer
const CHAIN_REACTION_DELAY_MS = 380;

const GEM_LABELS = {
  heart: 'Heart', star: 'Star', cross: 'Cross', flame: 'Flame',
  drop: 'Drop', gem: 'Gem', bomb: 'Bomb', rainbow: 'Crystal',
};

// ── Store catalogue ──────────────────────────────────────
const STORE_ITEMS = [
  { id: 'extra-moves', label: '+5 Moves', cost: 100, icon: '🎯' },
  { id: 'shuffle',     label: 'Shuffle',  cost: 150, icon: '🔀' },
  { id: 'place-bomb',  label: 'Bomb',     cost: 200, icon: '💣' },
];

// ── Init ─────────────────────────────────────────────────
export function initMatchMaker(dbRef, userRef) {
  db = dbRef;
  user = userRef;
  runId++;
  if (pendingTimeout) { clearTimeout(pendingTimeout); pendingTimeout = null; }

  score = 0;
  moves = 20;
  level = 1;
  coins = 0;
  chainDepth = 0;
  selected = null;
  lastSwap = null;
  grid = createInitialGrid();

  document.getElementById('match-score').textContent = score;
  document.getElementById('match-moves').textContent = moves;
  document.getElementById('match-level').textContent = level;
  document.getElementById('match-coins').textContent = coins;

  const banner = document.getElementById('match-badge-banner');
  if (banner) banner.classList.add('hidden');

  renderGrid();
  updateStoreButtons();
}

// ── Rendering ────────────────────────────────────────────
function renderGrid() {
  const container = document.getElementById('match-grid');
  container.innerHTML = '';

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'match-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      const type = grid[r][c];
      cell.innerHTML = type
        ? `<div class="gem gem-${type}" aria-label="${GEM_LABELS[type] || type}"></div>`
        : '';
      cell.onclick = () => onCellClick(r, c);
      container.appendChild(cell);
    }
  }
}

// ── Input ────────────────────────────────────────────────
function onCellClick(r, c) {
  if (moves <= 0) return;

  // Direct special-gem activation on first tap (no prior selection needed)
  if (!selected) {
    if (grid[r][c] === 'bomb')    { activateBomb(r, c);    return; }
    if (grid[r][c] === 'rainbow') { activateRainbow(r, c); return; }
    selected = { r, c };
    highlightCell(r, c, true);
    return;
  }
=======
/**
 * match-maker-ui.js — Game UI Layer for Match Maker
 * Renders the 7×7 grid, handles input (click, touch, keyboard),
 * animates cascades, manages levels, and updates the HUD + Conscience bars.
 * (c) 2026 NicholaiMadias — MIT License
 */

import { createGrid, isAdjacent, swapGems, findMatches, clearMatches, applyGravity } from './matchMakerState.js';
import { onLevelComplete } from './badges.js';

const COLS          = 7;
const ROWS          = 7;
const CASCADE_DELAY = 200;
const BASE_POINTS   = 50;
const CHAIN_BONUS   = 25;
const CONSCIENCE_KEYS = ['empathy', 'justice', 'wisdom', 'growth'];

const GEM_DISPLAY = {
  heart: { emoji: '❤️', cls: 'gem-heart', label: 'Heart' },
  star:  { emoji: '⭐', cls: 'gem-star',  label: 'Star'  },
  cross: { emoji: '✝️', cls: 'gem-cross', label: 'Cross' },
  flame: { emoji: '🔥', cls: 'gem-flame', label: 'Flame' },
  drop:  { emoji: '💧', cls: 'gem-drop',  label: 'Drop'  }
};

let grid       = [];
let score      = 0;
let moves      = 0;
let level      = 1;
let selected   = null;
let locked     = false;
let conscience = { empathy: 0, justice: 0, wisdom: 0, growth: 0 };

const dom = {};

function cacheDom() {
  dom.board      = document.getElementById('match-board');
  dom.score      = document.getElementById('hud-score');
  dom.level      = document.getElementById('hud-level');
  dom.moves      = document.getElementById('hud-moves');
  dom.msg        = document.getElementById('match-msg');
  dom.barEmpathy = document.getElementById('bar-empathy');
  dom.barJustice = document.getElementById('bar-justice');
  dom.barWisdom  = document.getElementById('bar-wisdom');
  dom.barGrowth  = document.getElementById('bar-growth');
  dom.pctEmpathy = document.getElementById('pct-empathy');
  dom.pctJustice = document.getElementById('pct-justice');
  dom.pctWisdom  = document.getElementById('pct-wisdom');
  dom.pctGrowth  = document.getElementById('pct-growth');
}

function updateHUD() {
  if (dom.score) dom.score.textContent = score;
  if (dom.level) dom.level.textContent = level;
  if (dom.moves) dom.moves.textContent = moves;
}

function showMsg(text) {
  if (dom.msg) dom.msg.textContent = text;
}

function updateConscience() {
  CONSCIENCE_KEYS.forEach(key => {
    const val  = Math.min(conscience[key], 100);
    const bar  = dom['bar' + key.charAt(0).toUpperCase() + key.slice(1)];
    const pct  = dom['pct' + key.charAt(0).toUpperCase() + key.slice(1)];
    if (bar) bar.style.width = val + '%';
    if (pct) pct.textContent = val + '%';
    const track = bar?.parentElement;
    if (track) track.setAttribute('aria-valuenow', val);
  });
}

function bumpConscience(matchCount) {
  const boost = Math.ceil(matchCount * 1.5);
  conscience.empathy = Math.min(100, conscience.empathy + boost + Math.floor(Math.random() * 3));
  conscience.justice = Math.min(100, conscience.justice + boost + Math.floor(Math.random() * 2));
  conscience.wisdom  = Math.min(100, conscience.wisdom  + Math.floor(boost * 0.8));
  conscience.growth  = Math.min(100, conscience.growth  + Math.floor(boost * 1.2));
  updateConscience();
}

function renderBoard() {
  if (!dom.board) return;
  dom.board.innerHTML = '';

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const gemType = grid[r][c];
      const info    = GEM_DISPLAY[gemType] || { emoji: '?', cls: '', label: gemType };
      const cell    = document.createElement('button');
      const idx     = r * COLS + c;
>>>>>>> main

      cell.className = 'gem-cell ' + info.cls;
      cell.textContent = info.emoji;
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', info.label + ', row ' + (r + 1) + ' column ' + (c + 1));
      cell.setAttribute('tabindex', idx === 0 ? '0' : '-1');

      if (selected && selected.row === r && selected.col === c) {
        cell.classList.add('selected');
      }

      cell.addEventListener('click', () => onCellClick(r, c));
      cell.addEventListener('keydown', (e) => onCellKey(e, r, c));
      dom.board.appendChild(cell);
    }
  }
}

<<<<<<< copilot/improve-gameplay
  if (matches.length === 0) {
    // No valid match — cancel selection without consuming a move
    highlightCell(r1, c1, false);
=======
function onCellClick(row, col) {
  if (locked) return;
  if (!selected) {
    selected = { row, col };
    renderBoard();
  } else if (selected.row === row && selected.col === col) {
>>>>>>> main
    selected = null;
    renderBoard();
  } else if (isAdjacent(selected.row, selected.col, row, col)) {
    attemptSwap(selected.row, selected.col, row, col);
  } else {
    selected = { row, col };
    renderBoard();
  }
}

<<<<<<< copilot/improve-gameplay
  grid = swapped;
  highlightCell(r1, c1, false);
  selected = null;
  moves--;
  chainDepth = 0;
  lastSwap = { r1, c1, r2: r, c2: c };
  document.getElementById('match-moves').textContent = moves;

  resolveMatches(runId);
}

function highlightCell(r, c, on) {
  const cell = document.querySelector(`.match-cell[data-row="${r}"][data-col="${c}"]`);
  if (!cell) return;
  cell.classList.toggle('selected', on);
}

// ── Special gem activation ───────────────────────────────
function activateBomb(r, c) {
  moves--;
  document.getElementById('match-moves').textContent = moves;

  // Visual flash on 3×3 explosion area
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const cell = document.querySelector(
        `.match-cell[data-row="${r + dr}"][data-col="${c + dc}"]`
      );
      if (cell) cell.classList.add('bomb-flash');
    }
  }

  const cleared = countBombArea(grid, r, c);
  grid = applyBombExplosion(grid, r, c);
  grid = applyGravity(grid);

  const pts = cleared * 15;
  score += pts;
  coins += Math.ceil(cleared / 2);
  chainDepth = 0;
  lastSwap = null;

  document.getElementById('match-score').textContent = score;
  document.getElementById('match-coins').textContent = coins;
  updateStoreButtons();

  showFloatingScore(pts, 1, { r, c });
  showBanner(`💣 Bomb! +${pts} pts`, 'banner--combo');

  const myRunId = runId;
  pendingTimeout = setTimeout(() => {
    if (myRunId !== runId) return;
    renderGrid();
    resolveMatches(myRunId);
  }, CHAIN_REACTION_DELAY_MS);
}

function activateRainbow(r, c) {
  moves--;
  document.getElementById('match-moves').textContent = moves;

  const targetType = findMostCommonType(grid);
  const cleared = countType(grid, targetType);

  grid[r][c] = null; // remove the rainbow gem itself first
  grid = applyRainbowClear(grid, targetType);
  grid = applyGravity(grid);

  const pts = cleared * 20;
  score += pts;
  coins += cleared;
  chainDepth = 0;
  lastSwap = null;

  document.getElementById('match-score').textContent = score;
  document.getElementById('match-coins').textContent = coins;
  updateStoreButtons();

  showFloatingScore(pts, 1, { r, c });
  showBanner(`🌈 Crystal cleared ${cleared} ${GEM_LABELS[targetType] || targetType}s! +${pts} pts`, 'banner--combo');

  const myRunId = runId;
  pendingTimeout = setTimeout(() => {
    if (myRunId !== runId) return;
    renderGrid();
    resolveMatches(myRunId);
  }, CHAIN_REACTION_DELAY_MS);
}

// ── Match resolution & chain reactions ───────────────────
function resolveMatches(myRunId) {
  if (myRunId !== runId) return;

  const groups = findMatches(grid);
  if (groups.length === 0) {
    renderGrid();
=======
function onCellKey(e, row, col) {
  let targetR = row;
  let targetC = col;

  switch (e.key) {
    case 'ArrowUp':    targetR = Math.max(0, row - 1); break;
    case 'ArrowDown':  targetR = Math.min(ROWS - 1, row + 1); break;
    case 'ArrowLeft':  targetC = Math.max(0, col - 1); break;
    case 'ArrowRight': targetC = Math.min(COLS - 1, col + 1); break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      onCellClick(row, col);
      return;
    case 'Escape':
      selected = null;
      renderBoard();
      return;
    default:
      return;
  }

  e.preventDefault();
  const idx = targetR * COLS + targetC;
  const cells = dom.board.querySelectorAll('.gem-cell');
  if (cells[idx]) cells[idx].focus();
}

function attemptSwap(r1, c1, r2, c2) {
  locked = true;
  selected = null;
  grid = swapGems(grid, r1, c1, r2, c2);
  moves++;
  updateHUD();
  renderBoard();

  const matches = findMatches(grid);
  if (matches.length === 0) {
    setTimeout(() => {
      grid = swapGems(grid, r1, c1, r2, c2);
      showMsg('No match — try again');
      renderBoard();
      setTimeout(() => showMsg(''), 1200);
      locked = false;
    }, CASCADE_DELAY);
  } else {
    processCascade(1);
  }
}

function processCascade(chain) {
  const matches = findMatches(grid);
  if (matches.length === 0) {
>>>>>>> main
    checkLevelUp();
    locked = false;
    return;
  }

<<<<<<< copilot/improve-gameplay
  const combo = chainDepth + 1;

  // Score: sum all group sizes × combo multiplier (overlapping cells in L/T shapes score twice as a bonus)
  let roundScore = 0;
  groups.forEach(g => { roundScore += g.length * 10; });
  roundScore *= combo;
  score += roundScore;

  // Coins: based on unique matched cells
  const uniqueKeys = new Set(groups.flatMap(g => g.map(({ r, c }) => `${r},${c}`)));
  coins += Math.max(1, Math.floor(uniqueKeys.size * combo / 4));

  document.getElementById('match-score').textContent = score;
  document.getElementById('match-coins').textContent = coins;
  updateStoreButtons();

  // Emit NexusOS arcade events if the shell is present
  if (typeof window !== 'undefined' && window.NexusOS) {
    window.NexusOS.emit('arcade-combo', { combo, score });
    if (combo >= 4) window.NexusOS.emit('combo-tier4', { combo, score });
  }

  // Combo notification
  if (combo > 1) showComboNotification(combo, roundScore);

  // Chain visual effects
  if (combo >= 3) showChainEffect(combo);

  // Detect largest group for potential special gem creation (first move only)
  let specialPlacement = null;
  if (chainDepth === 0 && lastSwap && groups.length > 0) {
    const largestGroup = groups.reduce((best, g) => g.length > best.length ? g : best, groups[0]);
    if (largestGroup.length >= 4) {
      // Place at the swap-destination cell if it's in the group; else group's midpoint
      const swapCell = largestGroup.find(
        ({ r, c }) => (r === lastSwap.r1 && c === lastSwap.c1) ||
                      (r === lastSwap.r2 && c === lastSwap.c2)
      ) || largestGroup[Math.floor(largestGroup.length / 2)];
      specialPlacement = {
        r: swapCell.r,
        c: swapCell.c,
        type: largestGroup.length >= 5 ? 'rainbow' : 'bomb',
      };
    }
  }

  // Animate matched cells
  groups.forEach(group => {
    group.forEach(({ r, c }) => {
      const cell = document.querySelector(`.match-cell[data-row="${r}"][data-col="${c}"]`);
      if (cell) cell.classList.add('popping');
    });
  });

  showFloatingScore(roundScore, combo, groups[0][0]);

  grid = clearMatches(grid, groups);

  // Special gem placement (before gravity so it falls naturally)
  if (specialPlacement && grid[specialPlacement.r][specialPlacement.c] === null) {
    grid[specialPlacement.r][specialPlacement.c] = specialPlacement.type;
  }

  grid = applyGravity(grid);
  chainDepth++;

  pendingTimeout = setTimeout(() => {
    if (myRunId !== runId) return;
    renderGrid();
    resolveMatches(myRunId);
  }, CHAIN_REACTION_DELAY_MS);
}

// ── Visual helpers ───────────────────────────────────────
function showFloatingScore(pts, combo, cell) {
  if (!cell) return;
  const gridEl = document.getElementById('match-grid');
  const cellEl = document.querySelector(
    `.match-cell[data-row="${cell.r}"][data-col="${cell.c}"]`
  );
  if (!cellEl || !gridEl) return;

  const gr = gridEl.getBoundingClientRect();
  const cr = cellEl.getBoundingClientRect();

  const el = document.createElement('div');
  el.className = 'float-score' + (combo > 1 ? ' float-score--combo' : '');
  el.textContent = combo > 1 ? `×${combo} +${pts}` : `+${pts}`;
  el.style.left = `${cr.left - gr.left + cr.width / 2}px`;
  el.style.top  = `${cr.top  - gr.top}px`;
  gridEl.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

function showComboNotification(combo, pts) {
  let tier;
  if (combo >= 5)      tier = '🌟 SUPERNOVA!';
  else if (combo >= 4) tier = '💥 MEGA COMBO!';
  else if (combo >= 3) tier = '🔥 CHAIN ×3!';
  else                 tier = `⚡ COMBO ×${combo}`;
  showBanner(`${tier}  +${pts} pts`, 'banner--combo');
}

function showChainEffect(combo) {
  const gridEl = document.getElementById('match-grid');
  if (!gridEl) return;

  // Shooting star — fires on every chain ≥ 3
  const star = document.createElement('div');
  star.className = 'shooting-star';
  gridEl.appendChild(star);
  star.addEventListener('animationend', () => star.remove(), { once: true });

  // Supernova burst on chain ≥ 5
  if (combo >= 5) {
    const nova = document.createElement('div');
    nova.className = 'supernova';
    gridEl.appendChild(nova);
    nova.addEventListener('animationend', () => nova.remove(), { once: true });
  }
=======
  const points = matches.length * (BASE_POINTS + CHAIN_BONUS * (chain - 1));
  score += points;

  if (chain > 1) {
    showMsg('Chain x' + chain + '! +' + points);
  }

  bumpConscience(matches.length);
  highlightMatched(matches);

  setTimeout(() => {
    grid = clearMatches(grid, matches);
    grid = applyGravity(grid);
    updateHUD();
    renderBoard();
    setTimeout(() => processCascade(chain + 1), CASCADE_DELAY);
  }, CASCADE_DELAY);
}

function highlightMatched(matches) {
  const cells = dom.board.querySelectorAll('.gem-cell');
  matches.forEach(({ row, col }) => {
    const idx = row * COLS + col;
    if (cells[idx]) cells[idx].classList.add('matched');
  });
>>>>>>> main
}

function showBanner(msg, cls) {
  const banner = document.getElementById('match-badge-banner');
  if (!banner) return;
  clearTimeout(bannerHideTimer);
  banner.textContent = msg;
  banner.className = `match-badge-banner ${cls}`;
  bannerHideTimer = setTimeout(() => banner.classList.add('hidden'), 2200);
}

// ── Level / game-over ────────────────────────────────────
function checkLevelUp() {
  const threshold = 500 * level;
  if (score >= threshold) {
    level++;
    updateHUD();
    showMsg('Level ' + level + ' — Keep going!');
    onLevelComplete(level - 1, score, null, null);
  }
}

<<<<<<< copilot/improve-gameplay
function checkGameOver() {
  if (moves <= 0) {
    const banner = document.getElementById('match-badge-banner');
    if (banner) {
      clearTimeout(bannerHideTimer);
      banner.textContent = `Game Over! Final score: ${score} 🏅`;
      banner.className = 'match-badge-banner banner--gameover';
    }
  }
}

// ── Store ────────────────────────────────────────────────
export function purchaseItem(itemId) {
  const item = STORE_ITEMS.find(i => i.id === itemId);
  if (!item || coins < item.cost) return;

  coins -= item.cost;
  document.getElementById('match-coins').textContent = coins;
  updateStoreButtons();

  switch (itemId) {
    case 'extra-moves':
      moves += 5;
      document.getElementById('match-moves').textContent = moves;
      showBanner('🎯 +5 Moves added!', 'banner--badge');
      break;

    case 'shuffle':
      grid = createInitialGrid();
      renderGrid();
      showBanner('🔀 Board shuffled!', 'banner--badge');
      break;

    case 'place-bomb': {
      const candidates = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (GEM_TYPES.includes(grid[r][c])) candidates.push({ r, c });
        }
      }
      if (candidates.length > 0) {
        const pos = candidates[Math.floor(Math.random() * candidates.length)];
        grid[pos.r][pos.c] = 'bomb';
        renderGrid();
        showBanner('💣 Bomb placed on the board!', 'banner--badge');
      }
      break;
    }
  }
}

export function updateStoreButtons() {
  STORE_ITEMS.forEach(item => {
    const btn = document.getElementById(`store-btn-${item.id}`);
    if (btn) btn.disabled = coins < item.cost;
  });
}

// ── Local helpers ─────────────────────────────────────────
function countBombArea(g, r, c) {
  let n = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && g[nr][nc] !== null) n++;
    }
  }
  return n;
}

function countType(g, type) {
  let n = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (g[r][c] === type) n++;
    }
  }
  return n;
=======
export function initMatchMaker(db, user) {
  cacheDom();
  grid       = createGrid(ROWS, COLS);
  score      = 0;
  moves      = 0;
  level      = 1;
  selected   = null;
  locked     = false;
  conscience = { empathy: 0, justice: 0, wisdom: 0, growth: 0 };

  updateHUD();
  updateConscience();
  renderBoard();
  showMsg('Match the gems — align your conscience');
>>>>>>> main
}
