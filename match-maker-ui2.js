/**
 * match-maker-ui2.js — V2 Game UI for Nexus Arcade
 * Integrates the full V2 engine: 7-element grid, dual-layer FX,
 * conscience deltas, ley system, narrative bridge, and omen discovery.
 * (c) 2026 NicholaiMadias — MIT License
 */

import {
  GRID_SIZE, createInitialGrid, canSwap, applySwap,
  findMatches, clearMatches, applyGravity, makeGem, SPECIAL,
} from './matchMakerState2.js';
import { computeScore }                                from './scoring2.js';
import {
  createConscienceState, applyMatchDeltas, applyBoardClearBonus, CONSCIENCE_KEYS,
} from './conscienceEngine2.js';
import { getSpawnedSpecial, activateSpecial }          from './specialTiles2.js';
import { createLeyState, advanceLey, getMultiplier }   from './leySystem2.js';
import { NarrativeBridge2, BEAT_TYPE }                 from './narrativeBridge2.js';
import { SevenStarNarrative2 }                         from './sevenStarNarrative2.js';
import { CanvasParticleSystem }                        from './fx/canvasParticles2.js';
import { pulse, flashBoard }                           from './fx/domPulse2.js';

const CASCADE_DELAY = 220;

/** Visual display metadata for each element type */
const ELEMENT_DISPLAY = {
  radiant: { emoji: '☀️',  cls: 'gem-radiant', label: 'Radiant' },
  tide:    { emoji: '🌊',  cls: 'gem-tide',    label: 'Tide'    },
  verdant: { emoji: '🌿',  cls: 'gem-verdant', label: 'Verdant' },
  forge:   { emoji: '🔥',  cls: 'gem-forge',   label: 'Forge'   },
  aether:  { emoji: '✨',  cls: 'gem-aether',  label: 'Aether'  },
  umbra:   { emoji: '🌑',  cls: 'gem-umbra',   label: 'Umbra'   },
  void:    { emoji: '⬛', cls: 'gem-void',    label: 'Void'    },
};

/** Single-character overlay glyphs rendered on top of special tiles */
const SPECIAL_GLYPH = {
  [SPECIAL.LINE]:      '—',
  [SPECIAL.CROSS]:     '✚',
  [SPECIAL.NOVA]:      '✦',
  [SPECIAL.SUPERNOVA]: '★',
};

// ── Module-level state ────────────────────────────────────────────────────────
let grid            = [];
let score           = 0;
let moves           = 0;
let level           = 1;
let selected        = null;
let locked          = false;
let conscience      = createConscienceState();
let ley             = createLeyState();
let bridge          = null;
let sevenStar       = null;
let particles       = null;
let pendingTimeout  = null;

const dom = {};

// ── DOM helpers ───────────────────────────────────────────────────────────────

function cacheDom() {
  dom.board        = document.getElementById('v2-board');
  dom.score        = document.getElementById('v2-score');
  dom.level        = document.getElementById('v2-level');
  dom.moves        = document.getElementById('v2-moves');
  dom.msg          = document.getElementById('v2-msg');
  dom.narrative    = document.getElementById('v2-narrative');
  dom.banner       = document.getElementById('v2-badge-banner');
  dom.canvas       = document.getElementById('fx-overlay');
  dom.barKarma     = document.getElementById('v2-bar-karma');
  dom.barWisdom    = document.getElementById('v2-bar-wisdom');
  dom.barIntegrity = document.getElementById('v2-bar-integrity');
  dom.barCommunity = document.getElementById('v2-bar-community');
  dom.pctKarma     = document.getElementById('v2-pct-karma');
  dom.pctWisdom    = document.getElementById('v2-pct-wisdom');
  dom.pctIntegrity = document.getElementById('v2-pct-integrity');
  dom.pctCommunity = document.getElementById('v2-pct-community');
}

function updateHUD() {
  if (dom.score) dom.score.textContent = score;
  if (dom.level) dom.level.textContent = level;
  if (dom.moves) dom.moves.textContent = moves;
}

function showMsg(text, clearAfterMs = 0) {
  if (dom.msg) dom.msg.textContent = text;
  if (clearAfterMs > 0) {
    setTimeout(() => { if (dom.msg) dom.msg.textContent = ''; }, clearAfterMs);
  }
}

function showNarrative(beat) {
  if (!dom.narrative || !beat) return;
  dom.narrative.textContent = beat.message;
  dom.narrative.classList.remove('hidden', 'narrative-fade');
  void dom.narrative.offsetWidth; // trigger reflow for CSS animation restart
  dom.narrative.classList.add('narrative-fade');
}

function updateConscienceBars() {
  CONSCIENCE_KEYS.forEach(key => {
    const val    = Math.min(conscience[key], 100);
    const capKey = key.charAt(0).toUpperCase() + key.slice(1);
    const bar    = dom['bar' + capKey];
    const pct    = dom['pct' + capKey];
    if (bar) bar.style.width = val + '%';
    if (pct) pct.textContent = val + '%';
  });
}

// ── Canvas FX helpers ─────────────────────────────────────────────────────────

function getCellCanvasCenter(r, c) {
  if (!dom.board || !dom.canvas) return { x: 0, y: 0 };
  const cells      = dom.board.querySelectorAll('.gem-cell-v2');
  const idx        = r * GRID_SIZE + c;
  const cell       = cells[idx];
  if (!cell) return { x: 0, y: 0 };
  const cellRect   = cell.getBoundingClientRect();
  const canvasRect = dom.canvas.getBoundingClientRect();
  return {
    x: cellRect.left + cellRect.width  / 2 - canvasRect.left,
    y: cellRect.top  + cellRect.height / 2 - canvasRect.top,
  };
}

function spawnExplosion(r, c, element) {
  if (!particles) return;
  const { x, y } = getCellCanvasCenter(r, c);
  particles.explode(x, y, element, 14);
}

// ── Board rendering ───────────────────────────────────────────────────────────

function renderBoard() {
  if (!dom.board) return;
  dom.board.innerHTML = '';

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const gem  = grid[r][c];
      const info = (gem && ELEMENT_DISPLAY[gem.kind]) || { emoji: '?', cls: '', label: '?' };
      const idx  = r * GRID_SIZE + c;

      const cell = document.createElement('button');
      cell.className = `gem-cell gem-cell-v2 ${info.cls}`;
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `${info.label}, row ${r + 1}, col ${c + 1}`);
      cell.setAttribute('tabindex', idx === 0 ? '0' : '-1');

      const emoji = document.createElement('span');
      emoji.className   = 'gem-emoji';
      emoji.textContent = info.emoji;
      cell.appendChild(emoji);

      if (gem && gem.special) {
        const glyph = document.createElement('span');
        glyph.className   = 'gem-special-glyph';
        glyph.textContent = SPECIAL_GLYPH[gem.special] || '';
        cell.appendChild(glyph);
      }

      if (selected && selected.row === r && selected.col === c) {
        cell.classList.add('selected');
      }

      cell.addEventListener('click', () => onCellClick(r, c));
      cell.addEventListener('keydown', e => onCellKey(e, r, c));
      dom.board.appendChild(cell);
    }
  }
}

// ── Input handlers ────────────────────────────────────────────────────────────

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
  let tr = row, tc = col;
  switch (e.key) {
    case 'ArrowUp':    tr = Math.max(0, row - 1);            break;
    case 'ArrowDown':  tr = Math.min(GRID_SIZE - 1, row + 1); break;
    case 'ArrowLeft':  tc = Math.max(0, col - 1);            break;
    case 'ArrowRight': tc = Math.min(GRID_SIZE - 1, col + 1); break;
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
  const cells = dom.board && dom.board.querySelectorAll('.gem-cell-v2');
  const next  = cells && cells[tr * GRID_SIZE + tc];
  if (next) next.focus();
}

// ── Core game logic ───────────────────────────────────────────────────────────

function attemptSwap(r1, c1, r2, c2) {
  locked   = true;
  selected = null;

  grid = applySwap(grid, r1, c1, r2, c2);
  moves++;
  updateHUD();
  renderBoard();

  // Check if the moved-to cell holds a special tile to trigger immediately
  const movedGem = grid[r2][c2];
  if (movedGem && movedGem.special) {
    const { clearedCells } = activateSpecial(grid, r2, c2);
    bridge.emit(BEAT_TYPE.SPECIAL_TRIGGER, { special: movedGem.special });
    resolveCleared(clearedCells, 1);
    return;
  }

  const matches = findMatches(grid);
  if (matches.length === 0) {
    pendingTimeout = setTimeout(() => {
      grid = applySwap(grid, r1, c1, r2, c2);
      showMsg('No match — try again', 1200);
      renderBoard();
      locked = false;
    }, CASCADE_DELAY);
  } else {
    processCascade(1);
  }
}

/**
 * Resolves an arbitrary set of cleared cells (from special tile activation).
 * @param {Array<{r:number,c:number}>} clearedCells
 * @param {number} chain
 */
function resolveCleared(clearedCells, chain) {
  if (!clearedCells.length) {
    checkLevelUp();
    locked = false;
    return;
  }

  // Conscience deltas based on current grid before clearing
  conscience = applyMatchDeltas(conscience, clearedCells, grid);
  ley        = advanceLey(ley, clearedCells.length);

  clearedCells.forEach(({ r, c }) => {
    const gem = grid[r][c];
    if (gem) spawnExplosion(r, c, gem.kind);
  });

  const pts = computeScore({
    matchCount:    clearedCells.length,
    leyMultiplier: getMultiplier(ley),
    comboChain:    chain,
  });
  score += pts;

  setTimeout(() => {
    grid = clearMatches(grid, clearedCells);
    grid = applyGravity(grid);
    updateHUD();
    updateConscienceBars();
    renderBoard();
    sevenStar.checkThresholds(conscience);
    checkLevelUp();
    locked = false;
  }, CASCADE_DELAY);
}

/**
 * Recursively resolves cascade chains (standard match-3 flow).
 * @param {number} chain - Current cascade depth (starts at 1)
 */
function processCascade(chain) {
  const matches = findMatches(grid);
  if (!matches.length) {
    checkLevelUp();
    locked = false;
    return;
  }

  // V2 findMatches returns a single merged group
  const matchCells = matches[0];

  // Determine dominant element for narrative beat
  const elementCounts = {};
  matchCells.forEach(({ r, c }) => {
    const gem = grid[r][c];
    if (gem) elementCounts[gem.kind] = (elementCounts[gem.kind] || 0) + 1;
  });
  const dominantElement = Object.entries(elementCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  ley = advanceLey(ley, matchCells.length);
  const pts = computeScore({
    matchCount:    matchCells.length,
    leyMultiplier: getMultiplier(ley),
    comboChain:    chain,
  });
  score += pts;

  // Emit narrative beat
  if (chain > 1) {
    bridge.emit(BEAT_TYPE.CASCADE, { chain, score: pts });
  } else {
    bridge.emit(BEAT_TYPE.MATCH, { element: dominantElement, score: pts });
  }

  // Conscience deltas
  conscience = applyMatchDeltas(conscience, matchCells, grid);

  // Canvas particle explosions
  matchCells.forEach(({ r, c }) => {
    const gem = grid[r][c];
    if (gem) spawnExplosion(r, c, gem.kind);
  });

  // DOM pulse on matched cells
  const cells = dom.board && dom.board.querySelectorAll('.gem-cell-v2');
  const matchedEls = matchCells
    .map(({ r, c }) => cells && cells[r * GRID_SIZE + c])
    .filter(Boolean);
  pulse(matchedEls, 'match', CASCADE_DELAY);

  // Determine special tile spawn (4+ match)
  const spawnedSpecial = getSpawnedSpecial(matchCells);
  let replacements = [];
  if (spawnedSpecial) {
    const mid = matchCells[Math.floor(matchCells.length / 2)];
    replacements = [{ r: mid.r, c: mid.c, kind: dominantElement || 'aether', special: spawnedSpecial }];
    bridge.emit(BEAT_TYPE.SPECIAL_SPAWN, { special: spawnedSpecial });
  }

  setTimeout(() => {
    grid = clearMatches(grid, matchCells, replacements);
    grid = applyGravity(grid);
    updateHUD();
    updateConscienceBars();
    renderBoard();

    // Check for board-clear achievement (all matched → board refills automatically,
    // so detect by checking if entire pre-gravity board was null)
    const isBoardClear = grid.every(row => row.every(cell => cell !== null)) &&
                         matchCells.length === GRID_SIZE * GRID_SIZE;
    if (isBoardClear) {
      conscience = applyBoardClearBonus(conscience);
      bridge.emit(BEAT_TYPE.BOARD_CLEAR);
      flashBoard(dom.board, 'rgba(255,255,255,0.2)', 600);
      updateConscienceBars();
    }

    sevenStar.checkThresholds(conscience);
    setTimeout(() => processCascade(chain + 1), CASCADE_DELAY);
  }, CASCADE_DELAY);
}

function checkLevelUp() {
  const threshold = 500 * level;
  if (score >= threshold) {
    level++;
    updateHUD();
    bridge.emit(BEAT_TYPE.LEVEL_UP, { level });
    if (dom.banner) {
      dom.banner.textContent = `⭐ Level ${level} reached!`;
      dom.banner.classList.remove('hidden');
      setTimeout(() => dom.banner.classList.add('hidden'), 3000);
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initialises (or re-initialises) the V2 Match Maker.
 * @param {object|null} db   - Optional persistence reference
 * @param {object|null} user - Optional user object
 */
export function initMatchMakerV2(db, user) {
  cacheDom();

  if (pendingTimeout !== null) {
    clearTimeout(pendingTimeout);
    pendingTimeout = null;
  }

  grid       = createInitialGrid();
  score      = 0;
  moves      = 0;
  level      = 1;
  selected   = null;
  locked     = false;
  conscience = createConscienceState();
  ley        = createLeyState();

  bridge = new NarrativeBridge2(beat => showNarrative(beat));
  sevenStar = new SevenStarNarrative2(bridge);

  if (dom.canvas) {
    if (!particles) {
      particles = new CanvasParticleSystem(dom.canvas);
    } else {
      particles.clearAll();
    }
    particles.resize();
  }

  updateHUD();
  updateConscienceBars();
  renderBoard();
  showMsg('Align the elements — awaken the lattice');
}
