/**
 * match-maker-ui.js — Enhanced Game UI Layer
 * 7x7 grid with power-ups, supernova chains, score streaks,
 * cosmic trails, conscience telemetry, and full keyboard/touch support.
 * (c) 2026 NicholaiMadias — MIT License
 */

import {
  createGrid, isAdjacent, swapGems, findMatches,
  findPowerUpSpawns, supernovaBlast, clearMatches,
  applyGravity, placePowerUp, isPowerUp, POWER_UP
} from './matchMakerState.js';
import { onLevelComplete } from './badges.js';

const COLS = 7, ROWS = 7, CASCADE_DELAY = 220;
const BASE_POINTS = 50, CHAIN_BONUS = 25;
const SUPERNOVA_BONUS = 500, SUPERNOVA_RADIUS = 2;
const STREAK_WINDOW = 3000, STREAK_MULT = 1.5;
const CONSCIENCE_KEYS = ['empathy', 'justice', 'wisdom', 'growth'];

const GEM_DISPLAY = {
  heart:    { emoji: '\u2764\uFE0F', cls: 'gem-heart',    label: 'Heart'    },
  star:     { emoji: '\u2B50',       cls: 'gem-star',     label: 'Star'     },
  cross:    { emoji: '\u271D\uFE0F', cls: 'gem-cross',    label: 'Cross'    },
  flame:    { emoji: '\uD83D\uDD25', cls: 'gem-flame',    label: 'Flame'    },
  drop:     { emoji: '\uD83D\uDCA7', cls: 'gem-drop',     label: 'Drop'     },
  supernova:{ emoji: '\uD83D\uDC8E', cls: 'gem-supernova',label: 'Supernova'}
};

let grid = [], score = 0, moves = 0, level = 1;
let selected = null, locked = false;
let conscience = { empathy: 0, justice: 0, wisdom: 0, growth: 0 };
let lastMatchTime = 0, streakCount = 0, streakActive = false;
const dom = {};

function cacheDom() {
  dom.board = document.getElementById('match-board');
  dom.score = document.getElementById('hud-score');
  dom.level = document.getElementById('hud-level');
  dom.moves = document.getElementById('hud-moves');
  dom.msg   = document.getElementById('match-msg');
  dom.badge = document.getElementById('match-badge-banner');
  CONSCIENCE_KEYS.forEach(k => {
    const cap = k.charAt(0).toUpperCase() + k.slice(1);
    dom['bar' + cap] = document.getElementById('bar-' + k);
    dom['pct' + cap] = document.getElementById('pct-' + k);
  });
}

function updateHUD() {
  if (dom.score) dom.score.textContent = score;
  if (dom.level) dom.level.textContent = level;
  if (dom.moves) dom.moves.textContent = moves;
}

function showMsg(text) { if (dom.msg) dom.msg.textContent = text; }

function tickStreak() {
  const now = Date.now();
  if (now - lastMatchTime < STREAK_WINDOW) {
    streakCount++;
    if (streakCount >= 3 && !streakActive) {
      streakActive = true;
      dom.board?.classList.add('cosmic-trail');
      showMsg('COSMIC STREAK x' + streakCount + '!');
    }
  } else { streakCount = 1; streakActive = false; dom.board?.classList.remove('cosmic-trail'); }
  lastMatchTime = now;
}

function getScoreMultiplier() { return streakActive ? STREAK_MULT : 1; }

function updateConscience() {
  CONSCIENCE_KEYS.forEach(key => {
    const val = Math.min(conscience[key], 100);
    const cap = key.charAt(0).toUpperCase() + key.slice(1);
    const bar = dom['bar' + cap], pct = dom['pct' + cap];
    if (bar) bar.style.width = val + '%';
    if (pct) pct.textContent = val + '%';
    const track = bar?.parentElement;
    if (track) track.setAttribute('aria-valuenow', val);
  });
}

function bumpConscience(matchCount, hasPowerUp) {
  const boost = Math.ceil(matchCount * 1.5);
  const p = hasPowerUp ? 8 : 0;
  conscience.empathy = Math.min(100, conscience.empathy + boost + Math.floor(Math.random() * 3) + p);
  conscience.justice = Math.min(100, conscience.justice + boost + Math.floor(Math.random() * 2) + p);
  conscience.wisdom  = Math.min(100, conscience.wisdom  + Math.floor(boost * 0.8) + p);
  conscience.growth  = Math.min(100, conscience.growth  + Math.floor(boost * 1.2) + p);
  updateConscience();
}

function renderBoard() {
  if (!dom.board) return;
  dom.board.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const gemType = grid[r][c];
      const info = GEM_DISPLAY[gemType] || { emoji: '?', cls: '', label: gemType || 'empty' };
      const cell = document.createElement('button');
      const idx = r * COLS + c;
      cell.className = 'gem-cell ' + info.cls;
      cell.textContent = info.emoji;
      cell.dataset.row = r; cell.dataset.col = c;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', info.label + ', row ' + (r+1) + ' column ' + (c+1));
      cell.setAttribute('tabindex', idx === 0 ? '0' : '-1');
      if (selected && selected.row === r && selected.col === c) cell.classList.add('selected');
      cell.addEventListener('click', () => onCellClick(r, c));
      cell.addEventListener('keydown', (e) => onCellKey(e, r, c));
      dom.board.appendChild(cell);
    }
  }
}

function onCellClick(row, col) {
  if (locked) return;
  if (!selected) { selected = { row, col }; renderBoard(); }
  else if (selected.row === row && selected.col === col) { selected = null; renderBoard(); }
  else if (isAdjacent(selected.row, selected.col, row, col)) { attemptSwap(selected.row, selected.col, row, col); }
  else { selected = { row, col }; renderBoard(); }
}

function onCellKey(e, row, col) {
  let tR = row, tC = col;
  switch (e.key) {
    case 'ArrowUp':    tR = Math.max(0, row-1); break;
    case 'ArrowDown':  tR = Math.min(ROWS-1, row+1); break;
    case 'ArrowLeft':  tC = Math.max(0, col-1); break;
    case 'ArrowRight': tC = Math.min(COLS-1, col+1); break;
    case 'Enter': case ' ': e.preventDefault(); onCellClick(row, col); return;
    case 'Escape': selected = null; renderBoard(); return;
    default: return;
  }
  e.preventDefault();
  const cells = dom.board.querySelectorAll('.gem-cell');
  const idx = tR * COLS + tC;
  if (cells[idx]) cells[idx].focus();
}

function attemptSwap(r1, c1, r2, c2) {
  locked = true; selected = null;
  const gem1 = grid[r1][c1], gem2 = grid[r2][c2];
  grid = swapGems(grid, r1, c1, r2, c2);
  moves++; updateHUD(); renderBoard();

  if (isPowerUp(gem1) || isPowerUp(gem2)) {
    const bR = isPowerUp(gem1) ? r2 : r1;
    const bC = isPowerUp(gem1) ? c2 : c1;
    triggerSupernova(bR, bC); return;
  }

  const matches = findMatches(grid);
  if (matches.length === 0) {
    setTimeout(() => {
      grid = swapGems(grid, r1, c1, r2, c2);
      showMsg('No match — try again'); renderBoard();
      setTimeout(() => showMsg(''), 1200); locked = false;
    }, CASCADE_DELAY);
  } else { tickStreak(); processCascade(1); }
}

function triggerSupernova(row, col) {
  const blasted = supernovaBlast(grid, row, col, SUPERNOVA_RADIUS);
  const cells = dom.board.querySelectorAll('.gem-cell');
  blasted.forEach(({ row: r, col: c }) => {
    const idx = r * COLS + c;
    if (cells[idx]) cells[idx].classList.add('supernova-blast');
  });
  score += Math.floor(SUPERNOVA_BONUS * getScoreMultiplier());
  bumpConscience(blasted.length, true);
  showMsg('SUPERNOVA! +' + SUPERNOVA_BONUS); updateHUD();
  setTimeout(() => {
    grid = clearMatches(grid, blasted);
    grid = applyGravity(grid); renderBoard(); updateHUD();
    setTimeout(() => processCascade(1), CASCADE_DELAY);
  }, 450);
}

function processCascade(chain) {
  const matches = findMatches(grid);
  if (matches.length === 0) {
    if (streakActive && chain <= 1) setTimeout(() => { streakActive = false; dom.board?.classList.remove('cosmic-trail'); }, 1500);
    checkLevelUp(); locked = false; return;
  }
  const powerUpSpawns = findPowerUpSpawns(grid, matches);
  const hasPowerUp = powerUpSpawns.length > 0;
  const mult = getScoreMultiplier();
  const points = Math.floor(matches.length * (BASE_POINTS + CHAIN_BONUS * (chain-1)) * mult);
  score += points;
  if (chain > 1) showMsg('Chain x' + chain + '! +' + points + (streakActive ? ' [COSMIC]' : ''));
  else if (hasPowerUp) showMsg('T/L MATCH — Supernova created!');
  bumpConscience(matches.length, hasPowerUp);
  highlightMatched(matches);
  setTimeout(() => {
    grid = clearMatches(grid, matches);
    powerUpSpawns.forEach(s => { grid = placePowerUp(grid, s.row, s.col); });
    grid = applyGravity(grid); updateHUD(); renderBoard();
    setTimeout(() => processCascade(chain + 1), CASCADE_DELAY);
  }, CASCADE_DELAY);
}

function highlightMatched(matches) {
  const cells = dom.board.querySelectorAll('.gem-cell');
  matches.forEach(({ row, col }) => { const i = row * COLS + col; if (cells[i]) cells[i].classList.add('matched'); });
}

function checkLevelUp() {
  const threshold = 500 * level;
  if (score >= threshold) {
    level++; updateHUD();
    showMsg('Level ' + level + ' — Keep going!');
    onLevelComplete(level - 1, score, null, null);
  }
}

export function initMatchMaker(db, user) {
  cacheDom();
  grid = createGrid(ROWS, COLS);
  score = 0; moves = 0; level = 1;
  selected = null; locked = false;
  conscience = { empathy: 0, justice: 0, wisdom: 0, growth: 0 };
  lastMatchTime = 0; streakCount = 0; streakActive = false;
  updateHUD(); updateConscience(); renderBoard();
  showMsg('Match the gems — align your conscience');
  dom.board?.classList.remove('cosmic-trail', 'board-complete');
}
