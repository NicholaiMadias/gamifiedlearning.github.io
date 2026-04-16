/**
 * ravens-message-ui.js — interactive UI for the Raven's Message match-3.
 * Renders an 8×8 board of raven tiles; supports cell-click swapping
 * and chain-reaction resolution.  Dispatches a 'ravens_message_complete'
 * CustomEvent on window when the puzzle is solved (score ≥ threshold).
 */

import {
  createBoard,
  canSwap,
  applySwap,
  findMatches,
  clearMatches,
  applyGravity,
  BOARD_ROWS,
  BOARD_COLS,
} from './ravensMessageBoard.js';

const SCORE_TO_COMPLETE = 150;
const CHAIN_DELAY_MS = 220;

let board;
let selected = null;
let rmScore = 0;
let rmMoves = 25;
let rmCompleted = false;

const RAVEN_ICONS = {
  perched:  '🐦',
  flying:   '🦅',
  diving:   '🐧',
  watching: '🦉',
  calling:  '🐤',
};

export function initRavensMessage() {
  board = createBoard();
  selected = null;
  rmScore = 0;
  rmMoves = 25;
  rmCompleted = false;

  updateStats();
  renderBoard();
  setStatus('Solve the pattern to reveal the message.');
}

function renderBoard() {
  const container = document.getElementById('rm-grid');
  if (!container) return;
  container.innerHTML = '';

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'rm-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.textContent = RAVEN_ICONS[board[r][c]] ?? '⬛';
      cell.onclick = () => onRavenClick(r, c);
      container.appendChild(cell);
    }
  }
}

function onRavenClick(r, c) {
  if (rmMoves <= 0 || rmCompleted) return;

  if (!selected) {
    selected = { r, c };
    highlightRavenCell(r, c, true);
    return;
  }

  const { r: r1, c: c1 } = selected;
  if (r === r1 && c === c1) {
    highlightRavenCell(r, c, false);
    selected = null;
    return;
  }

  if (!canSwap(board, r1, c1, r, c)) {
    highlightRavenCell(r1, c1, false);
    selected = { r, c };
    highlightRavenCell(r, c, true);
    return;
  }

  const swapped = applySwap(board, r1, c1, r, c);
  const matches = findMatches(swapped);

  if (matches.length === 0) {
    highlightRavenCell(r1, c1, false);
    selected = null;
    return;
  }

  board = swapped;
  highlightRavenCell(r1, c1, false);
  selected = null;
  rmMoves--;
  updateStats();
  resolveRavenMatches();
}

function highlightRavenCell(r, c, on) {
  const cell = document.querySelector(`.rm-cell[data-row="${r}"][data-col="${c}"]`);
  if (!cell) return;
  cell.style.outline = on ? '2px solid #9b59b6' : 'none';
}

function resolveRavenMatches() {
  const matches = findMatches(board);
  if (matches.length === 0) {
    renderBoard();
    checkRavenComplete();
    checkRavenGameOver();
    return;
  }

  matches.forEach(m => { rmScore += m.length * 10; });
  updateStats();

  board = clearMatches(board, matches);
  board = applyGravity(board);
  renderBoard();

  setTimeout(resolveRavenMatches, CHAIN_DELAY_MS);
}

function checkRavenComplete() {
  if (!rmCompleted && rmScore >= SCORE_TO_COMPLETE) {
    rmCompleted = true;
    setStatus('🦅 The ravens align. The message is revealed!');
    window.dispatchEvent(new CustomEvent('ravens_message_complete', { detail: { score: rmScore } }));
  }
}

function checkRavenGameOver() {
  if (!rmCompleted && rmMoves <= 0) {
    setStatus(`The pattern is wrong. No moves remain. Score: ${rmScore}`);
  }
}

function updateStats() {
  const scoreEl = document.getElementById('rm-score');
  const movesEl = document.getElementById('rm-moves');
  if (scoreEl) scoreEl.textContent = rmScore;
  if (movesEl) movesEl.textContent = rmMoves;
}

function setStatus(msg) {
  const el = document.getElementById('rm-status');
  if (el) el.textContent = msg;
}
