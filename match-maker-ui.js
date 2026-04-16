// match-maker-ui.js
import {
  createInitialGrid,
  canSwap,
  applySwap,
  findMatches,
  clearMatches,
  applyGravity,
  GRID_SIZE,
} from './matchMakerState.js';
import { onLevelComplete } from './badges.js';

let grid;
let selected = null;
let score = 0;
let moves = 20;
let level = 1;
let db = null;
let user = null;
let comboChain = 0;
const DEFAULT_HOOKS = {
  onCombo: null,
  onGameOver: null,
};
let hooks = { ...DEFAULT_HOOKS };

const SCORE_PER_LEVEL = 500;
const CHAIN_REACTION_DELAY_MS = 200;

export function initMatchMaker(dbRef, userRef, hookOverrides = {}) {
  db = dbRef;
  user = userRef;
  hooks = { ...DEFAULT_HOOKS, ...hookOverrides };
  score = 0;
  moves = 20;
  level = 1;
  selected = null;
  comboChain = 0;
  grid = createInitialGrid();
  renderGrid();

  document.getElementById('match-score').textContent = score;
  document.getElementById('match-moves').textContent = moves;
  document.getElementById('match-level').textContent = level;
}

function renderGrid() {
  const container = document.getElementById('match-grid');
  container.innerHTML = '';

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'match-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.textContent = gemIcon(grid[r][c]);
      cell.onclick = () => onCellClick(r, c);
      container.appendChild(cell);
    }
  }
}

function gemIcon(type) {
  switch (type) {
    case 'heart': return '💖';
    case 'star':  return '⭐';
    case 'cross': return '✝️';
    case 'flame': return '🔥';
    case 'drop':  return '💧';
    default:      return '⬛';
  }
}

function onCellClick(r, c) {
  if (moves <= 0) return;

  if (!selected) {
    selected = { r, c };
    highlightCell(r, c, true);
    return;
  }

  const { r: r1, c: c1 } = selected;
  if (r === r1 && c === c1) {
    highlightCell(r, c, false);
    selected = null;
    return;
  }

  if (!canSwap(grid, r1, c1, r, c)) {
    highlightCell(r1, c1, false);
    selected = { r, c };
    highlightCell(r, c, true);
    return;
  }

  const swapped = applySwap(grid, r1, c1, r, c);
  const matches = findMatches(swapped);

  if (matches.length === 0) {
    // Invalid swap — no match produced, revert selection
    highlightCell(r1, c1, false);
    selected = null;
    return;
  }

  grid = swapped;
  highlightCell(r1, c1, false);
  selected = null;
  moves--;
  document.getElementById('match-moves').textContent = moves;

  resolveMatches();
}

function highlightCell(r, c, on) {
  const cell = document.querySelector(`.match-cell[data-row="${r}"][data-col="${c}"]`);
  if (!cell) return;
  cell.style.outline = on ? '2px solid #00ff41' : 'none';
}

function resolveMatches() {
  const matches = findMatches(grid);
  if (matches.length === 0) {
    comboChain = 0;
    renderGrid();
    checkLevelUp();
    checkGameOver();
    return;
  }

  comboChain += 1;
  const largestMatch = Math.max(...matches.map(m => m.length));
  const tier = determineTier(largestMatch, comboChain);
  emitCombo(comboChain, tier, null);

  matches.forEach(m => {
    score += m.length * 10;
  });
  document.getElementById('match-score').textContent = score;

  grid = clearMatches(grid, matches);
  grid = applyGravity(grid);
  renderGrid();

  // chain reactions
  setTimeout(resolveMatches, CHAIN_REACTION_DELAY_MS);
}

function checkLevelUp() {
  const threshold = level * SCORE_PER_LEVEL;
  if (score >= threshold) {
    onLevelComplete(level, score, db, user);
    level++;
    moves += 10;
    document.getElementById('match-level').textContent = level;
    document.getElementById('match-moves').textContent = moves;
  }
}

function checkGameOver() {
  if (moves <= 0) {
    const banner = document.getElementById('match-badge-banner');
    if (banner) {
      banner.textContent = `Game Over! Final score: ${score}`;
      banner.classList.remove('hidden');
    }

    if (hooks.onGameOver) {
      hooks.onGameOver({ score });
    }
    if (window.NexusOS && typeof window.NexusOS.emit === 'function') {
      window.NexusOS.emit('arcade-gameover', { score });
    }
  }
}

function determineTier(matchSize, chainCount) {
  if (matchSize >= 7 || chainCount >= 4) return 4;
  if (matchSize >= 6 || chainCount >= 3) return 3;
  if (matchSize >= 4) return 2;
  return 1;
}

function emitCombo(chain, tier, powerUp) {
  if (hooks.onCombo) {
    hooks.onCombo({ chain, tier, powerUp });
  }
  if (window.NexusOS && typeof window.NexusOS.emit === 'function') {
    window.NexusOS.emit('arcade-combo', { chain, tier, powerUp });
    if (tier >= 4) {
      window.NexusOS.emit('combo-tier4', {});
    }
  }
}
