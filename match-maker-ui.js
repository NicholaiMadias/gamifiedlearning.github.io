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
let resolving = false;
const BASE_MOVES = 20;

export function initMatchMaker() {
  grid = createInitialGrid();
  selected = null;
  score = 0;
  moves = BASE_MOVES;
  level = 1;
  resolving = false;
  renderGrid();
  updateHud();
  setStatus('Match gems to charge the conduit.');
  attachControls();
}

function renderGrid() {
  const container = document.getElementById('match-grid');
  if (!container) return;
  container.innerHTML = '';

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'match-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.dataset.gem = grid[r][c];
      cell.textContent = gemIcon(grid[r][c]);
      cell.onclick = () => onCellClick(r, c);
      container.appendChild(cell);
    }
  }
}

function gemIcon(type) {
  switch (type) {
    case 'heart':
      return '💖';
    case 'star':
      return '⭐';
    case 'cross':
      return '✝️';
    case 'flame':
      return '🔥';
    case 'drop':
      return '💧';
    default:
      return '⬛';
  }
}

function onCellClick(r, c) {
  if (resolving) return;
  if (moves <= 0) {
    setStatus('Out of moves. Restart to keep playing.');
    return;
  }

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
    setStatus('Only swaps that create a match are allowed.');
    highlightCell(r1, c1, false);
    selected = null;
    return;
  }

  grid = applySwap(grid, r1, c1, r, c);
  moves--;
  resolving = true;
  highlightCell(r1, c1, false);
  selected = null;
  updateHud();

  resolveMatches(() => {
    resolving = false;
    checkLevelProgress();
  });
}

function highlightCell(r, c, on) {
  const cell = document.querySelector(`.match-cell[data-row="${r}"][data-col="${c}"]`);
  if (!cell) return;
  cell.classList.toggle('selected', Boolean(on));
}

function resolveMatches(done) {
  const matches = findMatches(grid);
  if (matches.length === 0) {
    renderGrid();
    done?.();
    return;
  }

  matches.forEach(group => {
    score += group.length * 10;
  });
  updateHud();

  grid = clearMatches(grid, matches);
  grid = applyGravity(grid);
  renderGrid();

  setTimeout(() => resolveMatches(done), 200);
}

function checkLevelProgress() {
  const targetScore = level * 450;
  if (score >= targetScore) {
    level++;
    moves = BASE_MOVES + level * 2;
    setStatus(`Level ${level - 1} complete. Level ${level} unlocked!`);
    onLevelComplete(level, score);
    updateHud();
    return;
  }

  if (moves <= 0) {
    setStatus('No moves left. Tap restart to try again.');
  }
}

function updateHud() {
  const scoreEl = document.getElementById('match-score');
  const movesEl = document.getElementById('match-moves');
  const levelEl = document.getElementById('match-level');

  if (scoreEl) scoreEl.textContent = score;
  if (movesEl) movesEl.textContent = moves;
  if (levelEl) levelEl.textContent = level;
}

function setStatus(message) {
  const statusEl = document.getElementById('match-status');
  if (statusEl) statusEl.textContent = message;
}

function attachControls() {
  const restartBtn = document.getElementById('match-restart');
  const shuffleBtn = document.getElementById('match-shuffle');

  if (restartBtn) {
    restartBtn.onclick = () => {
      grid = createInitialGrid();
      score = 0;
      moves = BASE_MOVES;
      level = 1;
      selected = null;
      resolving = false;
      renderGrid();
      updateHud();
      setStatus('New run initialized.');
    };
  }

  if (shuffleBtn) {
    shuffleBtn.onclick = () => {
      if (resolving) return;
      grid = createInitialGrid();
      selected = null;
      renderGrid();
      setStatus('Grid refreshed.');
    };
  }
}

window.addEventListener('DOMContentLoaded', initMatchMaker);
