/**
 * match-maker-ui.js — Game UI Layer for Match Maker
 * Renders the 7×7 grid, handles input (click, touch, keyboard),
 * animates cascades, manages levels, and updates the HUD + Conscience bars.
 * (c) 2026 NicholaiMadias — MIT License
 */

import { createInitialGrid, canSwap, applySwap, findMatches, clearMatches, applyGravity } from './matchMakerState.js';
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
  dom.board      = document.getElementById('match-grid');
  dom.score      = document.getElementById('match-score');
  dom.level      = document.getElementById('match-level');
  dom.moves      = document.getElementById('match-moves');
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

function onCellClick(row, col) {
  if (locked) return;
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
  grid = applySwap(grid, r1, c1, r2, c2);
  moves++;
  updateHUD();
  renderBoard();

  const matches = findMatches(grid);
  if (matches.length === 0) {
    setTimeout(() => {
      grid = applySwap(grid, r1, c1, r2, c2);
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
    checkLevelUp();
    locked = false;
    return;
  }

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
  if (!dom.board) return;
  const cells = dom.board.querySelectorAll('.gem-cell');
  matches.flat().forEach(({ r, c }) => {
    const idx = r * COLS + c;
    if (cells[idx]) cells[idx].classList.add('matched');
  });
}

function checkLevelUp() {
  const threshold = 500 * level;
  if (score >= threshold) {
    level++;
    updateHUD();
    showMsg('Level ' + level + ' — Keep going!');
    onLevelComplete(level - 1, score, null, null);
  }
}

export function initMatchMaker(db, user) {
  cacheDom();
  grid       = createInitialGrid();
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
}
