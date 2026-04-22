/**
 * match-maker-ui.js — Game UI Layer for Match Maker
 * Renders the 7×7 grid, handles input (click, touch, keyboard),
 * animates cascades, manages levels, Matrix-of-Conscience buffs,
 * Seven Stars lavender clue system, combos, and adaptive difficulty.
 * (c) 2026 NicholaiMadias — MIT License
 */

import { createInitialGrid, canSwap, applySwap, findMatches, clearMatches, applyGravityWithBuffs } from './matchMakerState.js';
import { onLevelComplete } from './badges.js';

const COLS                    = 7;
const ROWS                    = 7;
const MAX_MOVES               = 20;
const CASCADE_DELAY           = 200;
const BASE_POINTS             = 50;
const CHAIN_BONUS             = 25;
const LAVENDER_CLUE_THRESHOLD = 3; // lavender tiles cleared per clue fragment
const BONUS_MOVE_CASCADE_INTERVAL = 3; // every Nth cascade level awards a bonus move

// Matrix-of-Conscience buff thresholds
const BUFF_EMPATHY_THRESHOLD  = 70; // heartBoost   — Heart tiles spawn +10% more often
const BUFF_JUSTICE_THRESHOLD  = 60; // autoResolve  — Invalid swaps don't cost a move
const BUFF_WISDOM_THRESHOLD   = 40; // hintReady    — Hint system active
const BUFF_GROWTH_THRESHOLD   = 80; // xpBoost      — Score multiplier +20%

const GEM_DISPLAY = {
  heart:    { emoji: '❤️',  cls: 'gem-heart',    label: 'Heart'    },
  star:     { emoji: '⭐',  cls: 'gem-star',     label: 'Star'     },
  cross:    { emoji: '✝️',  cls: 'gem-cross',    label: 'Cross'    },
  flame:    { emoji: '🔥',  cls: 'gem-flame',    label: 'Flame'    },
  drop:     { emoji: '💧',  cls: 'gem-drop',     label: 'Drop'     },
  lavender: { emoji: '🌸',  cls: 'gem-lavender', label: 'Lavender' },
};

// Game state
let grid            = [];
let score           = 0;
let movesLeft       = MAX_MOVES;
let level           = 1;
let selected        = null;
let locked          = false;
let gameOver        = false;
let runId           = 0; // invalidates stale cascade callbacks on restart

// Combo / cascade state
let cascadeChain    = 0;

// Seven Stars narrative state
let lavenderPending = 0; // accumulates toward next clue fragment
let clueFragments   = 0; // total clue fragments discovered
let chosenSuspect   = null; // 'reed' | 'blackwood' | null

// Matrix of Conscience — start with the page's initial display values
let conscience = { empathy: 72, justice: 58, wisdom: 45, growth: 83 };

// Timers
let msgTimer   = null;
let comboTimer = null;

// Previous buff state — used to detect newly-activated buffs for pulse animation
let prevBuffs = { heartBoost: false, autoResolve: false, hintReady: false, xpBoost: false };

const dom = {};

// ── DOM cache ──────────────────────────────────────────────────────────────

function cacheDom() {
  dom.board      = document.getElementById('match-grid');
  dom.score      = document.getElementById('match-score');
  dom.level      = document.getElementById('match-level');
  dom.moves      = document.getElementById('match-moves');
  dom.clues      = document.getElementById('match-clues');
  dom.msg        = document.getElementById('match-msg');
  dom.combo      = document.getElementById('match-combo');
  dom.buffBadge  = document.getElementById('match-buffs');
  dom.banner     = document.getElementById('match-badge-banner');
  dom.suspect    = document.getElementById('match-suspect');
  dom.clueCard   = document.getElementById('clue-card');
  dom.clueHistory = document.getElementById('clue-history');
  dom.lavPending  = document.getElementById('clue-lavender-pending');
  dom.lavFill     = document.getElementById('clue-progress-fill');
  dom.restartModal = document.getElementById('restart-modal-overlay');

  // Matrix of Conscience
  dom.mcEmpathy  = document.getElementById('mc-empathy');
  dom.mcJustice  = document.getElementById('mc-justice');
  dom.mcWisdom   = document.getElementById('mc-wisdom');
  dom.mcGrowth   = document.getElementById('mc-growth');
  dom.barEmpathy = document.getElementById('mc-empathy-bar');
  dom.barJustice = document.getElementById('mc-justice-bar');
  dom.barWisdom  = document.getElementById('mc-wisdom-bar');
  dom.barGrowth  = document.getElementById('mc-growth-bar');

  // Matrix stat rows (for pulse animation)
  dom.rowEmpathy = document.getElementById('mc-row-empathy');
  dom.rowJustice = document.getElementById('mc-row-justice');
  dom.rowWisdom  = document.getElementById('mc-row-wisdom');
  dom.rowGrowth  = document.getElementById('mc-row-growth');
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
  if (dom.moves) {
    dom.moves.textContent = movesLeft;
    dom.moves.classList.toggle('moves-warn',     movesLeft <= 10 && movesLeft > 5);
    dom.moves.classList.toggle('moves-critical', movesLeft <= 5);
  }
  if (dom.clues) dom.clues.textContent = clueFragments;
  updateBuffBadge();
}

function updateConscience() {
  const map = {
    empathy: { val: dom.mcEmpathy, bar: dom.barEmpathy, row: dom.rowEmpathy },
    justice: { val: dom.mcJustice, bar: dom.barJustice, row: dom.rowJustice },
    wisdom:  { val: dom.mcWisdom,  bar: dom.barWisdom,  row: dom.rowWisdom  },
    growth:  { val: dom.mcGrowth,  bar: dom.barGrowth,  row: dom.rowGrowth  },
  };
  Object.entries(map).forEach(([key, el]) => {
    const v = Math.min(conscience[key], 100);
    if (el.val) el.val.textContent = v;
    if (el.bar) el.bar.style.width = v + '%';
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
  const boost = Math.ceil(matchCount * 1.5);
  conscience.empathy = Math.min(100, conscience.empathy + boost + Math.floor(Math.random() * 3));
  conscience.justice = Math.min(100, conscience.justice + boost + Math.floor(Math.random() * 2));
  conscience.wisdom  = Math.min(100, conscience.wisdom  + Math.floor(boost * 0.8));
  conscience.growth  = Math.min(100, conscience.growth  + Math.floor(boost * 1.2));
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

// ── Rendering ─────────────────────────────────────────────────────────────

function renderBoard() {
  if (!dom.board) return;
  dom.board.innerHTML = '';

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const gemType = grid[r][c];
      const info    = GEM_DISPLAY[gemType] || { emoji: '?', cls: '', label: gemType };
      const cell    = document.createElement('button');
      const idx     = r * COLS + c;

      cell.className = 'match-cell ' + info.cls;
      cell.textContent = info.emoji;
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', info.label + ', row ' + (r + 1) + ' column ' + (c + 1));
      cell.setAttribute('tabindex', idx === 0 ? '0' : '-1');
      cell.disabled = locked || gameOver;

      if (selected && selected.row === r && selected.col === c) {
        cell.classList.add('selected');
      }

      cell.addEventListener('click', () => onCellClick(r, c));
      cell.addEventListener('keydown', (e) => onCellKey(e, r, c));
      dom.board.appendChild(cell);
    }
  }
}

// ── Input ─────────────────────────────────────────────────────────────────

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
    case 'ArrowUp':    targetR = Math.max(0, row - 1); break;
    case 'ArrowDown':  targetR = Math.min(ROWS - 1, row + 1); break;
    case 'ArrowLeft':  targetC = Math.max(0, col - 1); break;
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
  const cells = dom.board.querySelectorAll('.match-cell');
  if (cells[targetR * COLS + targetC]) cells[targetR * COLS + targetC].focus();
}

// ── Swap & cascade ────────────────────────────────────────────────────────

function attemptSwap(r1, c1, r2, c2) {
  locked = true;
  selected = null;
  grid = applySwap(grid, r1, c1, r2, c2);
  renderBoard();

  const matches = findMatches(grid);
  if (matches.length === 0) {
    // Revert invalid swap
    setTimeout(() => {
      grid = applySwap(grid, r1, c1, r2, c2);
      // Justice buff: free miss doesn't cost a move
      if (!getActiveBuffs().autoResolve) {
        movesLeft = Math.max(0, movesLeft - 1);
        updateHUD();
      }
      showMsg('No match — try again');
      renderBoard();
      locked = false;
      checkGameOver();
    }, CASCADE_DELAY);
  } else {
    movesLeft = Math.max(0, movesLeft - 1);
    updateHUD();
    cascadeChain = 0;
    const rid = runId;
    processCascade(1, rid);
  }
}

function processCascade(chain, rid) {
  if (rid !== runId) return; // stale callback after restart

  const matches = findMatches(grid);
  if (matches.length === 0) {
    checkLevelUp();
    locked = false;
    checkGameOver();
    return;
  }

  const flatCells  = matches[0]; // single merged match group — guaranteed by matches.length > 0 check above
  const matchCount = flatCells.length;

  // Count lavender tiles before clearing
  const lavenderCount = flatCells.filter(({ r, c }) => grid[r][c] === 'lavender').length;

  // Score — Growth buff gives +20 % XP
  let points = matchCount * (BASE_POINTS + CHAIN_BONUS * (chain - 1));
  if (getActiveBuffs().xpBoost) points = Math.floor(points * 1.2);
  score += points;

  // Combo feedback
  cascadeChain = chain;
  if (chain >= 2) showCombo(chain);

  // Adaptive difficulty — bonus move every Nth cascade level
  if (chain > 1 && chain % BONUS_MOVE_CASCADE_INTERVAL === 0) {
    movesLeft++;
    showMsg('+1 Bonus Move!', 1200);
  }

  bumpConscience(matchCount);
  highlightMatched(flatCells);

  setTimeout(() => {
    if (rid !== runId) return;

    if (lavenderCount > 0) handleLavenderMatch(lavenderCount);

    grid = clearMatches(grid, matches);
    grid = applyGravityWithBuffs(grid, getActiveBuffs());
    updateHUD();
    renderBoard();
    setTimeout(() => processCascade(chain + 1, rid), CASCADE_DELAY);
  }, CASCADE_DELAY);
}

function highlightMatched(cells) {
  const boardCells = dom.board.querySelectorAll('.match-cell');
  cells.forEach(({ r, c }) => {
    const idx = r * COLS + c;
    if (boardCells[idx]) {
      boardCells[idx].classList.add('matched');
      if (grid[r][c] === 'lavender') boardCells[idx].classList.add('lavender-match');
    }
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
    dom.suspect.style.animation = 'none';
    void dom.suspect.offsetWidth; // force reflow to restart animation
    dom.suspect.style.animation = 'clue-shake 0.45s ease';
    dom.suspect.addEventListener('animationend', () => { dom.suspect.style.animation = ''; }, { once: true });
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
    movesLeft += 5; // bonus moves for reaching a new level
    updateHUD();
    showMsg('🌟 Level ' + level + ' unlocked — +5 Moves!', 2500);
    onLevelComplete(level - 1, score, null, null);
  }
}

function checkGameOver() {
  if (movesLeft <= 0 && !gameOver) {
    gameOver = true;
    locked   = true;
    showMsg('Game Over — Score: ' + score, 0);
    if (dom.banner) {
      dom.banner.textContent = '🎮 Game Over · Score: ' + score + ' · Level: ' + level;
      dom.banner.classList.remove('hidden');
    }
    renderBoard(); // re-render to disable all cells
  }
}

// ── Init ──────────────────────────────────────────────────────────────────

export function initMatchMaker(db, user) {
  runId++; // invalidate any in-flight cascade callbacks
  cacheDom();

  grid            = createInitialGrid();
  score           = 0;
  movesLeft       = MAX_MOVES;
  level           = 1;
  cascadeChain    = 0;
  selected        = null;
  locked          = false;
  gameOver        = false;
  lavenderPending = 0;
  clueFragments   = 0;
  chosenSuspect   = null;
  conscience      = { empathy: 72, justice: 58, wisdom: 45, growth: 83 };
  prevBuffs       = { heartBoost: false, autoResolve: false, hintReady: false, xpBoost: false };

  if (dom.banner)  dom.banner.classList.add('hidden');
  if (dom.suspect) dom.suspect.style.display = 'none';
  if (dom.combo)   { dom.combo.textContent = ''; dom.combo.classList.remove('combo-pop'); }
  if (dom.msg)     dom.msg.textContent = '';
  if (dom.clueHistory) dom.clueHistory.innerHTML = '';
  updateLavenderProgress();
  if (dom.moves)       { dom.moves.classList.remove('moves-warn', 'moves-critical'); }
  if (dom.restartModal) dom.restartModal.classList.add('hidden');

  // Wire suspect-choice buttons
  const reedBtn       = document.getElementById('suspect-reed');
  const blackwoodBtn  = document.getElementById('suspect-blackwood');
  if (reedBtn)      reedBtn.onclick      = () => chooseSuspect('reed');
  if (blackwoodBtn) blackwoodBtn.onclick = () => chooseSuspect('blackwood');

  // Wire restart button — show confirmation modal instead of immediately restarting
  const restartBtn    = document.getElementById('match-restart-btn');
  const confirmYes    = document.getElementById('restart-confirm-yes');
  const confirmNo     = document.getElementById('restart-confirm-no');
  const modalInner    = dom.restartModal ? dom.restartModal.querySelector('[tabindex="-1"]') : null;

  const handleRestartModalKeydown = (e) => {
    if (e.key === 'Escape') closeRestartModal();
  };
  const closeRestartModal = () => {
    if (!dom.restartModal) return;
    dom.restartModal.classList.add('hidden');
    document.removeEventListener('keydown', handleRestartModalKeydown);
    if (restartBtn) restartBtn.focus();
  };
  const openRestartModal = () => {
    if (!dom.restartModal) return;
    dom.restartModal.classList.remove('hidden');
    document.addEventListener('keydown', handleRestartModalKeydown);
    if (modalInner) modalInner.focus();
  };

  if (restartBtn && dom.restartModal) {
    restartBtn.onclick = () => openRestartModal();
    dom.restartModal.onclick = (e) => {
      if (e.target === dom.restartModal) closeRestartModal();
    };
  }
  if (confirmYes) {
    confirmYes.onclick = () => {
      closeRestartModal();
      initMatchMaker(db, user);
    };
  }
  if (confirmNo && dom.restartModal) {
    confirmNo.onclick = () => closeRestartModal();
  }

  updateHUD();
  updateConscience();
  renderBoard();
  showMsg('Match the gems — align your conscience', 2000);
}
