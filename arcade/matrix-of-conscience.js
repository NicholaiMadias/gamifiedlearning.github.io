// MATRIX OF CONSCIENCE — MONOLITHIC ENGINE
// Sections 1–10: Init → Background → Board → Tiles → Gravity →
//                Matches → Swap → Combos → AC-Hybrid Effects → CERT System
// Pure JavaScript — no dependencies, no frameworks.

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — AUTO‑REPLACE INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────
(function () {

  function removeOldLoader() {
    const candidates = [
      '#matchmaker-root', '.matchmaker-container', '#game-root',
      '#arcade-root', 'canvas#matchmaker', 'div[data-game="matchmaker"]'
    ];
    candidates.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) el.remove();
    });
    [...document.querySelectorAll('div,section,article')]
      .filter(el => el.innerHTML.trim() === '')
      .forEach(el => el.remove());
  }

  removeOldLoader();

  const matrixRoot = document.createElement('div');
  matrixRoot.id = 'matrix-of-conscience-root';
  matrixRoot.style.cssText =
    'position:fixed;inset:0;overflow:hidden;background:#000;';
  document.body.appendChild(matrixRoot);

})();


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — COSMIC BACKGROUND RENDERER
// ─────────────────────────────────────────────────────────────────────────────
(function () {

  const root = document.getElementById('matrix-of-conscience-root');

  const canvas = document.createElement('canvas');
  canvas.id = 'cosmic-canvas';
  canvas.style.cssText =
    'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;';
  root.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const STAR_COUNT = 250;
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x:       Math.random() * canvas.width,
    y:       Math.random() * canvas.height,
    size:    Math.random() * 1.5 + 0.5,
    twinkle: Math.random() * Math.PI * 2
  }));

  let shootingStar = null;
  function spawnShootingStar() {
    if (!shootingStar && Math.random() < 0.002) {
      shootingStar = {
        x:    Math.random() * canvas.width,
        y:    Math.random() * canvas.height * 0.3,
        vx:   -8 - Math.random() * 4,
        vy:   3  + Math.random() * 2,
        life: 0
      };
    }
  }

  // Use a live MediaQueryList so the check stays correct if input mode changes
  // (e.g., a tablet docking a keyboard/mouse after page load).
  const coarsePointerMQ = window.matchMedia('(pointer: coarse)');
  function isMobile() { return coarsePointerMQ.matches; }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isMobile()) {
      const g = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.4, 50,
        canvas.width * 0.5, canvas.height * 0.4, canvas.width * 0.9
      );
      g.addColorStop(0, 'rgba(80,20,120,0.25)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const now = Date.now() * 0.002;
    stars.forEach(s => {
      const tw = (Math.sin(now + s.twinkle) + 1) / 2;
      ctx.fillStyle = `rgba(255,255,255,${0.5 + tw * 0.5})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    spawnShootingStar();
    if (shootingStar) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shootingStar.x, shootingStar.y);
      ctx.lineTo(
        shootingStar.x + shootingStar.vx * 3,
        shootingStar.y + shootingStar.vy * 3
      );
      ctx.stroke();

      shootingStar.x   += shootingStar.vx;
      shootingStar.y   += shootingStar.vy;
      shootingStar.life++;
      if (shootingStar.life > 60) shootingStar = null;
    }

    requestAnimationFrame(render);
  }

  render();

})();


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — BOARD ENGINE (8×8 GRID)
// ─────────────────────────────────────────────────────────────────────────────
(function () {

  const root = document.getElementById('matrix-of-conscience-root');

  const boardCanvas = document.createElement('canvas');
  boardCanvas.id = 'matrix-board';
  boardCanvas.style.cssText =
    'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:5;';
  root.appendChild(boardCanvas);

  const bctx  = boardCanvas.getContext('2d');
  const ROWS  = 8;
  const COLS  = 8;
  let   TILE  = 64;

  function resizeBoard() {
    // Measure the actual HUD and CERT bar heights rather than using a fixed constant.
    const hudEl  = document.getElementById('hud');
    const certEl = document.getElementById('cert-bar');
    const reserved = (hudEl  ? hudEl.getBoundingClientRect().height  : 44) +
                     (certEl ? certEl.getBoundingClientRect().height : 6) + 8;
    // Divide by COLS to get the largest square tiles that fit, with a 1-tile
    // margin on each side (COLS + 2) so the board doesn't touch the screen edge.
    // Minimum tile size of 28px keeps the board usable on very small screens.
    const usable = Math.min(window.innerWidth, window.innerHeight - reserved);
    TILE = Math.max(28, Math.floor(usable / (COLS + 2)));
    boardCanvas.width  = COLS * TILE;
    boardCanvas.height = ROWS * TILE;
    window.MatrixBoard.TILE = TILE;
  }

  window.addEventListener('resize', resizeBoard);

  const board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  window.MatrixBoard = { board, ROWS, COLS, TILE, boardCanvas, bctx, resizeBoard };

  resizeBoard();

})();


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — TILE ENGINE (CERT GEMS)
// ─────────────────────────────────────────────────────────────────────────────
(function () {

  const { board, ROWS, COLS, boardCanvas, bctx } = window.MatrixBoard;

  const TILE_TYPES = [
    { id: 'C', color: '#A060FF', label: 'Creativity' },
    { id: 'E', color: '#4DB8FF', label: 'Empathy'    },
    { id: 'R', color: '#4DFF88', label: 'Relief'     },
    { id: 'T', color: '#FFD84D', label: 'Trust'      }
  ];

  function randomTile(avoidTypes) {
    let pool = TILE_TYPES;
    if (avoidTypes && avoidTypes.length) {
      pool = TILE_TYPES.filter(t => !avoidTypes.includes(t.id));
      if (!pool.length) pool = TILE_TYPES;
    }
    const t = pool[Math.floor(Math.random() * pool.length)];
    return { type: t.id, color: t.color, special: null, xOffset: 0, yOffset: 0 };
  }

  function fillBoard() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        // Avoid instant matches on init
        const avoid = [];
        if (c >= 2 && board[r][c-1] && board[r][c-2] &&
            board[r][c-1].type === board[r][c-2].type) {
          avoid.push(board[r][c-1].type);
        }
        if (r >= 2 && board[r-1][c] && board[r-2][c] &&
            board[r-1][c].type === board[r-2][c].type) {
          avoid.push(board[r-1][c].type);
        }
        board[r][c] = randomTile(avoid);
      }
    }
  }

  function drawTile(tile, r, c, tileSize) {
    const x = c * tileSize + tile.xOffset;
    const y = r * tileSize + tile.yOffset;
    const rad = tileSize * 0.18;
    const pad = tileSize * 0.06;

    // Shadow glow for specials
    if (tile.special === 'bomb') {
      bctx.shadowColor = '#fff';
      bctx.shadowBlur  = 12;
    }

    // Gem body
    bctx.fillStyle = tile.color;
    bctx.beginPath();
    bctx.moveTo(x + pad + rad, y + pad);
    bctx.lineTo(x + tileSize - pad - rad, y + pad);
    bctx.quadraticCurveTo(x + tileSize - pad, y + pad, x + tileSize - pad, y + pad + rad);
    bctx.lineTo(x + tileSize - pad, y + tileSize - pad - rad);
    bctx.quadraticCurveTo(x + tileSize - pad, y + tileSize - pad, x + tileSize - pad - rad, y + tileSize - pad);
    bctx.lineTo(x + pad + rad, y + tileSize - pad);
    bctx.quadraticCurveTo(x + pad, y + tileSize - pad, x + pad, y + tileSize - pad - rad);
    bctx.lineTo(x + pad, y + pad + rad);
    bctx.quadraticCurveTo(x + pad, y + pad, x + pad + rad, y + pad);
    bctx.closePath();
    bctx.fill();

    bctx.shadowBlur = 0;

    // Gloss
    bctx.fillStyle = 'rgba(255,255,255,0.22)';
    bctx.beginPath();
    bctx.arc(x + tileSize * 0.35, y + tileSize * 0.35, tileSize * 0.22, 0, Math.PI * 2);
    bctx.fill();

    // Bomb marker
    if (tile.special === 'bomb') {
      bctx.fillStyle = 'rgba(255,255,255,0.9)';
      bctx.font = `${tileSize * 0.42}px serif`;
      bctx.textAlign = 'center';
      bctx.textBaseline = 'middle';
      bctx.fillText('✦', x + tileSize / 2, y + tileSize / 2);
    }
  }

  function renderBoard() {
    const tileSize = window.MatrixBoard.TILE;
    bctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);

    // Board background
    bctx.fillStyle = 'rgba(10,5,25,0.6)';
    bctx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = board[r][c];
        if (tile) drawTile(tile, r, c, tileSize);
      }
    }

    requestAnimationFrame(renderBoard);
  }

  fillBoard();
  renderBoard();

  window.MatrixTiles = { TILE_TYPES, randomTile, drawTile };

})();


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — GRAVITY ENGINE
// ─────────────────────────────────────────────────────────────────────────────
(function () {

  const { board, ROWS, COLS } = window.MatrixBoard;
  const { randomTile }        = window.MatrixTiles;

  function applyGravity() {
    let moved = false;

    for (let r = ROWS - 2; r >= 0; r--) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] && !board[r + 1][c]) {
          board[r + 1][c] = board[r][c];
          board[r][c]     = null;
          moved = true;
        }
      }
    }

    for (let c = 0; c < COLS; c++) {
      if (!board[0][c]) {
        board[0][c] = randomTile([]);
        moved = true;
      }
    }

    return moved;
  }

  window.MatrixGravity = { applyGravity };

})();


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — MATCH DETECTION ENGINE
// ─────────────────────────────────────────────────────────────────────────────
(function () {

  const { board, ROWS, COLS } = window.MatrixBoard;

  function findMatches() {
    const matched = new Set();

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      let streak = 1;
      for (let c = 1; c < COLS; c++) {
        const cur  = board[r][c];
        const prev = board[r][c - 1];
        if (cur && prev && cur.type === prev.type) {
          streak++;
        } else {
          if (streak >= 3) {
            for (let k = 0; k < streak; k++) matched.add(`${r},${c - 1 - k}`);
          }
          streak = 1;
        }
      }
      if (streak >= 3) {
        for (let k = 0; k < streak; k++) matched.add(`${r},${COLS - 1 - k}`);
      }
    }

    // Vertical
    for (let c = 0; c < COLS; c++) {
      let streak = 1;
      for (let r = 1; r < ROWS; r++) {
        const cur  = board[r][c];
        const prev = board[r - 1][c];
        if (cur && prev && cur.type === prev.type) {
          streak++;
        } else {
          if (streak >= 3) {
            for (let k = 0; k < streak; k++) matched.add(`${r - 1 - k},${c}`);
          }
          streak = 1;
        }
      }
      if (streak >= 3) {
        for (let k = 0; k < streak; k++) matched.add(`${ROWS - 1 - k},${c}`);
      }
    }

    return [...matched].map(key => {
      const [r, c] = key.split(',').map(Number);
      return { r, c };
    });
  }

  window.MatrixMatches = { findMatches };

})();


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — SWAP SYSTEM + ANIMATIONS (incl. snap‑back)
// ─────────────────────────────────────────────────────────────────────────────
(function () {

  const { board, boardCanvas }    = window.MatrixBoard;
  const { findMatches }           = window.MatrixMatches;
  const { applyGravity }          = window.MatrixGravity;

  let selected     = null;
  let isAnimating  = false;

  boardCanvas.addEventListener('mousedown', onClick);
  boardCanvas.addEventListener('touchstart', e => {
    e.preventDefault();
    onClick(e.touches[0]);
  }, { passive: false });

  function onClick(e) {
    if (isAnimating) return;
    if (window.MatrixCERT && window.MatrixCERT.movesLeft() <= 0) return;

    const rect = boardCanvas.getBoundingClientRect();
    const TILE = window.MatrixBoard.TILE;
    const r = Math.floor((e.clientY - rect.top)  / TILE);
    const c = Math.floor((e.clientX - rect.left) / TILE);

    if (r < 0 || r >= window.MatrixBoard.ROWS ||
        c < 0 || c >= window.MatrixBoard.COLS) return;

    if (!selected) {
      selected = { r, c };
      highlightSelected(r, c);
      return;
    }

    clearHighlight();

    const dr = Math.abs(selected.r - r);
    const dc = Math.abs(selected.c - c);

    if (dr + dc !== 1) {
      selected = { r, c };
      highlightSelected(r, c);
      return;
    }

    attemptSwap(selected, { r, c });
    selected = null;
  }

  function highlightSelected(r, c) {
    const TILE = window.MatrixBoard.TILE;
    const bctx = window.MatrixBoard.bctx;
    const tile = board[r][c];
    if (!tile) return;
    tile._sel = true;
  }

  function clearHighlight() {
    for (let r = 0; r < window.MatrixBoard.ROWS; r++) {
      for (let c = 0; c < window.MatrixBoard.COLS; c++) {
        if (board[r][c]) board[r][c]._sel = false;
      }
    }
  }

  function swapTiles(a, b) {
    const tmp   = board[a.r][a.c];
    board[a.r][a.c] = board[b.r][b.c];
    board[b.r][b.c] = tmp;
  }

  function attemptSwap(a, b) {
    swapTiles(a, b);
    const matches = findMatches();

    if (matches.length === 0) {
      swapTiles(a, b);          // revert
      animateSnap(a, b);
    } else {
      if (window.MatrixCERT) window.MatrixCERT.useMove();
      animateSwap(a, b, () => {
        if (window.MatrixResolve) window.MatrixResolve.resolve(matches, 1);
      });
    }
  }

  function animateSwap(a, b, onComplete) {
    isAnimating = true;
    const TILE  = window.MatrixBoard.TILE;
    const tileA = board[b.r][b.c];
    const tileB = board[a.r][a.c];

    let t = 0;
    const FRAMES = 10;

    (function frame() {
      t++;
      const p  = t / FRAMES;
      const dx = (b.c - a.c) * TILE * p;
      const dy = (b.r - a.r) * TILE * p;

      if (tileA) { tileA.xOffset = -dx * (1 - p); tileA.yOffset = -dy * (1 - p); }
      if (tileB) { tileB.xOffset =  dx * (1 - p); tileB.yOffset =  dy * (1 - p); }

      if (t < FRAMES) {
        requestAnimationFrame(frame);
      } else {
        if (tileA) { tileA.xOffset = 0; tileA.yOffset = 0; }
        if (tileB) { tileB.xOffset = 0; tileB.yOffset = 0; }
        isAnimating = false;
        onComplete();
      }
    })();
  }

  function animateSnap(a, b) {
    isAnimating = true;
    const TILE  = window.MatrixBoard.TILE;
    const tileA = board[a.r][a.c];
    const tileB = board[b.r][b.c];

    let t = 0;
    const FRAMES   = 10;
    const MAX_DIST = TILE * 0.18;

    (function frame() {
      t++;
      const p  = Math.sin(t / FRAMES * Math.PI);   // 0 → 1 → 0 bounce
      const dx = (b.c - a.c) * MAX_DIST * p;
      const dy = (b.r - a.r) * MAX_DIST * p;

      if (tileA) { tileA.xOffset =  dx; tileA.yOffset =  dy; }
      if (tileB) { tileB.xOffset = -dx; tileB.yOffset = -dy; }

      if (t < FRAMES) {
        requestAnimationFrame(frame);
      } else {
        if (tileA) { tileA.xOffset = 0; tileA.yOffset = 0; }
        if (tileB) { tileB.xOffset = 0; tileB.yOffset = 0; }
        isAnimating = false;
      }
    })();
  }

  window.MatrixSwap = { isAnimating: () => isAnimating };

})();


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — COMBO + CASCADE RESOLUTION ENGINE
// ─────────────────────────────────────────────────────────────────────────────
(function () {

  const { board }      = window.MatrixBoard;
  const { findMatches } = window.MatrixMatches;
  const { applyGravity } = window.MatrixGravity;
  const { randomTile }  = window.MatrixTiles;

  const CASCADE_DELAY = 180;   // ms between cascades

  function clearMatchedTiles(matches, chain) {
    const tileTypes = {};

    matches.forEach(({ r, c }) => {
      const tile = board[r][c];
      if (!tile) return;

      // Tally CERT types
      tileTypes[tile.type] = (tileTypes[tile.type] || 0) + 1;

      // 5‑in‑a‑row creates bomb tile — mark centre
      board[r][c] = null;
    });

    // Award score
    const base   = matches.length * 50;
    const bonus  = (chain - 1) * 25;
    const points = base + bonus;

    if (window.MatrixCERT) window.MatrixCERT.addScore(points, tileTypes, chain);
  }

  function resolve(matches, chain) {
    clearMatchedTiles(matches, chain);

    // Spawn bomb on 5+ match
    if (matches.length >= 5) spawnBombAt(matches);

    // Gravity + cascade after delay
    setTimeout(() => {
      let dropped = true;
      while (dropped) dropped = applyGravity();

      const next = findMatches();
      if (next.length > 0) {
        resolve(next, chain + 1);
      }
    }, CASCADE_DELAY);
  }

  function spawnBombAt(matches) {
    // Place a bomb at the centre of the match group
    const midIdx = Math.floor(matches.length / 2);
    const { r, c } = matches[midIdx];
    if (!board[r][c]) {
      const newTile = randomTile([]);
      newTile.special = 'bomb';
      board[r][c] = newTile;
    }
  }

  window.MatrixResolve = { resolve };

})();


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — AC‑HYBRID SPECIAL EFFECTS (BOMB DETONATION)
// ─────────────────────────────────────────────────────────────────────────────
(function () {

  const { board, ROWS, COLS, bctx, boardCanvas } = window.MatrixBoard;
  const { randomTile }  = window.MatrixTiles;
  const { applyGravity } = window.MatrixGravity;
  const { findMatches } = window.MatrixMatches;

  function detonateBombs(matches) {
    const bombs = matches.filter(({ r, c }) => board[r][c] && board[r][c].special === 'bomb');
    if (!bombs.length) return false;

    bombs.forEach(({ r, c }) => {
      // Clear 3×3 area
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            board[nr][nc] = null;
          }
        }
      }
      flashExplosion(r, c);
    });

    setTimeout(() => {
      let dropped = true;
      while (dropped) dropped = applyGravity();
      const next = findMatches();
      if (next.length > 0 && window.MatrixResolve) window.MatrixResolve.resolve(next, 1);
    }, 250);

    return true;
  }

  function flashExplosion(r, c) {
    const TILE = window.MatrixBoard.TILE;
    const px = c * TILE + TILE / 2;
    const py = r * TILE + TILE / 2;

    let alpha = 0.9;
    (function flash() {
      if (alpha <= 0) return;
      bctx.save();
      bctx.globalAlpha = alpha;
      bctx.fillStyle = '#fff';
      bctx.beginPath();
      bctx.arc(px, py, TILE * 1.5 * (1 - alpha), 0, Math.PI * 2);
      bctx.fill();
      bctx.restore();
      alpha -= 0.1;
      requestAnimationFrame(flash);
    })();
  }

  window.MatrixBombs = { detonateBombs };

})();


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — CERT SYSTEM (SCORE · MOVES · LEVELS · WIN/LOSE)
// ─────────────────────────────────────────────────────────────────────────────
(function () {

  const LEVELS = [
    { level: 1, target: 500,  moves: 30 },
    { level: 2, target: 1200, moves: 28 },
    { level: 3, target: 2200, moves: 26 },
    { level: 4, target: 3500, moves: 24 },
    { level: 5, target: 5000, moves: 22 }
  ];

  let currentLevel = 0;
  let score   = 0;
  let moves   = LEVELS[currentLevel].moves;
  let cert    = { C: 0, E: 0, R: 0, T: 0 };
  let gameOver = false;

  // DOM refs
  const hudScore = document.getElementById('hud-score');
  const hudLevel = document.getElementById('hud-level');
  const hudMoves = document.getElementById('hud-moves');
  const certSegs = { C: document.getElementById('cert-c'), E: document.getElementById('cert-e'), R: document.getElementById('cert-r'), T: document.getElementById('cert-t') };
  const toast       = document.getElementById('toast');
  const endscreen   = document.getElementById('endscreen');
  const endTitle    = document.getElementById('end-title');
  const endScoreEl  = document.getElementById('end-score');
  const endRestart  = document.getElementById('end-restart');

  function updateHUD() {
    if (hudScore) hudScore.textContent = score;
    if (hudLevel) hudLevel.textContent = LEVELS[currentLevel].level;
    if (hudMoves) hudMoves.textContent = moves;
  }

  function updateCertBar() {
    const total = cert.C + cert.E + cert.R + cert.T || 1;
    ['C','E','R','T'].forEach(id => {
      if (certSegs[id]) {
        certSegs[id].style.opacity = 0.3 + (cert[id] / total) * 0.7;
      }
    });
  }

  function showToast(msg, duration) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), duration || 1800);
  }

  function showEndScreen(won) {
    if (!endscreen) return;
    gameOver = true;
    if (endTitle)   endTitle.textContent  = won ? '🌌 You Win!' : 'Game Over';
    if (endScoreEl) endScoreEl.textContent = `Score: ${score}`;
    endscreen.classList.add('visible');
  }

  function nextLevel() {
    if (currentLevel < LEVELS.length - 1) {
      currentLevel++;
      moves = LEVELS[currentLevel].moves;
      showToast(`Level ${LEVELS[currentLevel].level}!`, 2200);
      updateHUD();
    } else {
      showEndScreen(true);
    }
  }

  function addScore(points, tileTypes, chain) {
    if (gameOver) return;
    score += points;
    if (tileTypes) {
      Object.keys(tileTypes).forEach(t => { cert[t] = (cert[t] || 0) + tileTypes[t]; });
    }
    if (chain > 1) showToast(`${chain}× Cascade! +${points}`, 1400);
    updateHUD();
    updateCertBar();

    // Level‑up check
    const lvlData = LEVELS[currentLevel];
    if (score >= lvlData.target) nextLevel();
  }

  function useMove() {
    if (gameOver) return;
    moves = Math.max(0, moves - 1);
    updateHUD();
    if (moves === 0) {
      const lvlData = LEVELS[currentLevel];
      if (score >= lvlData.target) {
        nextLevel();
      } else {
        showEndScreen(false);
      }
    }
  }

  function resetGame() {
    currentLevel = 0;
    score  = 0;
    moves  = LEVELS[0].moves;
    cert   = { C: 0, E: 0, R: 0, T: 0 };
    gameOver = false;

    // Rebuild board
    const { board, ROWS, COLS } = window.MatrixBoard;
    const { randomTile }        = window.MatrixTiles;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        board[r][c] = randomTile([]);
      }
    }

    if (endscreen) endscreen.classList.remove('visible');
    updateHUD();
    updateCertBar();
    showToast('New Game', 1400);
  }

  if (endRestart) endRestart.addEventListener('click', resetGame);

  updateHUD();
  updateCertBar();

  window.MatrixCERT = {
    addScore,
    useMove,
    movesLeft: () => moves,
    score:     () => score
  };

})();
