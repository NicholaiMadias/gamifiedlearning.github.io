console.log('[NexusOS] arcade module loaded');

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'modules/arcade.css';
document.head.appendChild(link);

const GEMS = ['💎', '🔴', '💚', '💜', '🔵', '⚪', '🟡'];
const COLS = 7;
const ROWS = 7;

let board = [];
let selected = null;
let score = 0;
let combo = 1;
let charge = 0;

function initBoard() {
  board = Array.from({ length: ROWS * COLS }, () => GEMS[Math.floor(Math.random() * GEMS.length)]);
  selected = null;
  score = 0;
  combo = 1;
  charge = 0;
  renderBoard();
  updateStats();
  updateCharge();
}

function renderBoard() {
  const grid = document.getElementById('arcade-grid');
  if (!grid) return;
  grid.innerHTML = board.map((gem, i) => `
    <div class="arcade-gem${selected === i ? ' arcade-gem--selected' : ''}"
         data-index="${i}" role="gridcell" aria-label="${gem}">
      ${gem}
    </div>
  `).join('');
}

function updateStats() {
  const scoreEl = document.getElementById('arcade-score');
  const comboEl = document.getElementById('arcade-combo');
  const tierEl  = document.getElementById('arcade-tier');
  if (scoreEl) scoreEl.textContent = score;
  if (comboEl) comboEl.textContent = `x${combo}`;
  const tier = Math.min(4, Math.floor(combo / 2) + 1);
  if (tierEl) tierEl.textContent = tier;
}

function updateCharge() {
  const fill  = document.getElementById('charge-fill');
  const label = document.getElementById('charge-label');
  const pct   = Math.min(100, charge);
  if (fill)  fill.style.width = pct + '%';
  if (fill)  fill.parentElement.setAttribute('aria-valuenow', pct);
  if (label) label.textContent = `${Math.floor(pct)}% charged`;

  if (charge >= 100) {
    const banner = document.getElementById('arcade-banner');
    if (banner) banner.classList.remove('hidden');
    NexusOS.emit('revelation-achieved', {});
  }
}

function trySwap(a, b) {
  [board[a], board[b]] = [board[b], board[a]];
  const matches = findMatches();
  if (matches.length === 0) {
    [board[a], board[b]] = [board[b], board[a]];
    return;
  }
  resolveMatches(matches);
}

function findMatches() {
  const matched = new Set();
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 2; c++) {
      const i = r * COLS + c;
      if (board[i] && board[i] === board[i + 1] && board[i] === board[i + 2]) {
        matched.add(i); matched.add(i + 1); matched.add(i + 2);
      }
    }
  }
  // Vertical
  for (let r = 0; r < ROWS - 2; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      if (board[i] && board[i] === board[i + COLS] && board[i] === board[i + COLS * 2]) {
        matched.add(i); matched.add(i + COLS); matched.add(i + COLS * 2);
      }
    }
  }
  return [...matched];
}

function resolveMatches(matches) {
  const points = matches.length * 10 * combo;
  score += points;
  charge += matches.length * 5;
  combo++;

  const tier = Math.min(4, Math.floor(combo / 2) + 1);
  NexusOS.emit('arcade-combo', { combo, tier, score });
  if (tier >= 4) NexusOS.emit('combo-tier4', { combo, score });

  matches.forEach(i => { board[i] = null; });
  dropGems();
  renderBoard();
  updateStats();
  updateCharge();
}

function dropGems() {
  for (let c = 0; c < COLS; c++) {
    let empty = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      const i = r * COLS + c;
      if (board[i] !== null) {
        board[empty * COLS + c] = board[i];
        if (empty !== r) board[i] = null;
        empty--;
      }
    }
    for (let r = empty; r >= 0; r--) {
      board[r * COLS + c] = GEMS[Math.floor(Math.random() * GEMS.length)];
    }
  }
}

document.getElementById('arcade-grid').addEventListener('click', e => {
  const cell = e.target.closest('.arcade-gem');
  if (!cell) return;
  const idx = parseInt(cell.dataset.index, 10);

  if (selected === null) {
    selected = idx;
  } else {
    if (selected !== idx) trySwap(selected, idx);
    selected = null;
  }
  renderBoard();
});

document.getElementById('arcade-restart-btn').addEventListener('click', () => {
  document.getElementById('arcade-banner').classList.add('hidden');
  initBoard();
});

initBoard();
