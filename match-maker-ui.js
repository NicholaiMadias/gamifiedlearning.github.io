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
}

function bumpConscience(matchCount) {
  const keys = ['empathy', 'justice', 'wisdom', 'growth'];
  const key  = keys[Math.floor(Math.random() * keys.length)];
  conscience[key] = Math.min(100, (conscience[key] || 0) + matchCount * 2);
  updateConscience();
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
    }
  }
}

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
  if (locked) return;
  if (!selected) {
    selected = { row, col };
    renderBoard();
  } else if (selected.row === row && selected.col === col) {
    selected = null;
    renderBoard();
  } else if (isAdjacent(selected.row, selected.col, row, col)) {
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
    case 'ArrowUp':    targetR = Math.max(0, row - 1);        break;
    case 'ArrowDown':  targetR = Math.min(ROWS - 1, row + 1); break;
    case 'ArrowLeft':  targetC = Math.max(0, col - 1);        break;
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
  const idx   = targetR * COLS + targetC;
  const cells = dom.board.querySelectorAll('.gem-cell');
  if (cells[idx]) cells[idx].focus();
}

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
  matches.forEach(({ row, col }) => {
    const idx = row * COLS + col;
    if (cells[idx]) cells[idx].classList.add('matched');
  });
}

function checkLevelUp() {
  const threshold = 500 * level;
  if (score >= threshold) {
    level++;
    updateHUD();
    window.dispatchEvent(new CustomEvent('matchmaker-level-complete', { detail: { level: level - 1 } }));
    if (level - 1 >= MAX_LEVEL) {
      showGameComplete();
    } else {
      showMsg('Level ' + level + ' — Keep going!');
      onLevelComplete(level - 1, score, null, null);
    }
  }
}

// ── Public API ───────────────────────────────────────────────────────────────
export function initMatchMaker(db, user) {
  if (pendingTimeout) { clearTimeout(pendingTimeout); pendingTimeout = null; }
  cacheDom();
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
  showMsg('Match the gems — align your conscience');
}
