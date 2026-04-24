// match-maker-ui.js
import {
  createInitialGrid,
  canSwap,
  applySwap,
  findMatches,
  clearMatches,
  applyGravity,
  applySpecialGem,
  GRID_SIZE,
  SPECIAL_GEM_TYPES,
} from './matchMakerState.js';
import { onLevelComplete } from './badges.js';
import { saveGame, loadGame } from './saveSystem.js';
import { getLevelConfig, checkLevelUp } from './levelSystem.js';
import { updateDailyProgress, checkDailyCompletion } from './daily.js';
import { unlockStar } from './sevenStars.js';

let grid;
let selected = null;
let score = 0;
let moves = 20;
let level = 1;
let db = null;
let user = null;
let combo = 0;
let coins = 100; // Starting coins for the store
let powerUps = { bomb: 0, lightning: 0, rainbow: 0 };
let activePowerUp = null; // Currently selected power-up to use
let lastSupernovaCombo = 0;

const SCORE_PER_LEVEL = 500;
const CHAIN_REACTION_DELAY_MS = 300;

const spriteCache = {
  ready: false,
  tileSprites: null,
  lockedSprite: null,
  shootingFrames: [],
  supernovaFrames: [],
};

const TILE_SPRITE_CENTERS = {
  yellow: { x: 390, y: 76 },
  white: { x: 316, y: 316 },
  blue: { x: 1108, y: 172 },
  green: { x: 598, y: 71 },
  red: { x: 1013, y: 71 },
  purple: { x: 939, y: 791 },
  locked: { x: 396, y: 371 },
};

const SUPERNOVA_BOXES = [
  { src: '1-2.PNG', x: 103, y: 248, w: 567, h: 511 },
  { src: '1-2.PNG', x: 956, y: 248, w: 544, h: 510 },
  { src: '3-5.PNG', x: 36, y: 241, w: 458, h: 469 },
  { src: '3-5.PNG', x: 527, y: 240, w: 463, h: 487 },
  { src: '3-5.PNG', x: 1008, y: 243, w: 461, h: 479 },
  { src: 'star_crystal.PNG', x: 82, y: 267, w: 610, h: 492 },
  { src: 'star_crystal.PNG', x: 783, y: 165, w: 697, h: 660 },
];

const SHOOTING_BOXES = [
  { src: 'star_shooting.PNG', x: 31, y: 373, w: 740, h: 189 },
  { src: 'star_shooting.PNG', x: 820, y: 157, w: 229, h: 217 },
  { src: 'star_shooting.PNG', x: 1055, y: 156, w: 441, h: 217 },
  { src: 'star_shooting.PNG', x: 818, y: 373, w: 231, h: 210 },
  { src: 'star_shooting.PNG', x: 1055, y: 374, w: 218, h: 206 },
  { src: 'star_shooting.PNG', x: 1276, y: 374, w: 220, h: 206 },
  { src: 'star_shooting.PNG', x: 816, y: 583, w: 233, h: 195 },
  { src: 'star_shooting.PNG', x: 1054, y: 582, w: 218, h: 194 },
  { src: 'star_shooting.PNG', x: 1274, y: 584, w: 222, h: 192 },
];

const spritePromise = loadStarSprites();
const GEM_GLOW_COLORS = {
  yellow: '#ffd447',
  white: '#d7e7ff',
  blue: '#5ab6ff',
  green: '#7ddf81',
  red: '#ff7b6b',
  purple: '#d68bff',
  bomb: '#ffbb33',
  lightning: '#4dd0e1',
  rainbow: '#ff9ff3',
};

const POWER_UP_REQUIREMENTS = {
  lightning: 2,
  rainbow: 3,
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function cropToDataURL(image, x, y, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, x, y, w, h, 0, 0, w, h);
  return canvas.toDataURL('image/png');
}

function cropCentered(image, center, size) {
  const half = Math.floor(size / 2);
  const sx = Math.max(0, Math.min(image.width - size, center.x - half));
  const sy = Math.max(0, Math.min(image.height - size, center.y - half));
  return cropToDataURL(image, sx, sy, size, size);
}

async function loadStarSprites() {
  if (spriteCache.ready) return spriteCache;

  const [tiles, oneTwo, threeFive, starCrystal, shooting] = await Promise.all([
    loadImage('tiles.PNG'),
    loadImage('1-2.PNG'),
    loadImage('3-5.PNG'),
    loadImage('star_crystal.PNG'),
    loadImage('star_shooting.PNG'),
  ]);

  const tileSprites = {};
  Object.entries(TILE_SPRITE_CENTERS).forEach(([key, center]) => {
    tileSprites[key] = cropCentered(tiles, center, 220);
  });

  if (tileSprites.locked) {
    document.documentElement.style.setProperty('--locked-star', `url(${tileSprites.locked})`);
  }

  const supernovaFrames = SUPERNOVA_BOXES.map(({ src, x, y, w, h }) => {
    const source = src === '1-2.PNG' ? oneTwo : src === '3-5.PNG' ? threeFive : starCrystal;
    return cropToDataURL(source, x, y, w, h);
  });

  const shootingFrames = SHOOTING_BOXES
    .slice()
    .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y))
    .map(({ x, y, w, h }) => cropToDataURL(shooting, x, y, w, h));

  spriteCache.tileSprites = tileSprites;
  spriteCache.lockedSprite = tileSprites.locked;
  spriteCache.supernovaFrames = supernovaFrames;
  spriteCache.shootingFrames = shootingFrames;
  spriteCache.ready = true;

  // Re-render once art is ready so the board uses the new sprites.
  if (grid) {
    renderGrid();
  }
  return spriteCache;
}

export function initMatchMaker(dbRef, userRef) {
  db = dbRef;
  user = userRef;
  score = 0;
  moves = 20;
  level = 1;
  combo = 0;
  activePowerUp = null;
  lastSupernovaCombo = 0;
  selected = null;
  grid = createInitialGrid();
  renderGrid();
  updateStats();
  updateStoreDisplay();
  updatePowerUpButtons();
}

function updateStats() {
  document.getElementById('match-score').textContent = score;
  document.getElementById('match-moves').textContent = moves;
  document.getElementById('match-level').textContent = level;
  document.getElementById('match-combo').textContent = combo > 0 ? `${combo}x` : '-';
  document.getElementById('match-coins').textContent = coins;
}

function maybeUnlock(key) {
  if (typeof window !== 'undefined' && typeof window.unlock === 'function') {
    window.unlock(key);
  }
}

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'match-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;

      const gemType = grid[r][c];
      const img = document.createElement('div');
      img.className = 'gem-icon';
      const gemStyle = getGemStyle(gemType);
      img.style.backgroundImage = gemStyle.backgroundImage;
      img.style.backgroundSize = gemStyle.backgroundSize;
      img.style.backgroundPosition = gemStyle.backgroundPosition;
      if (gemStyle.glow) {
        img.style.filter = `drop-shadow(0 0 10px ${gemStyle.glow})`;
      }
      img.dataset.gemType = gemType;
      cell.appendChild(img);

      cell.onclick = () => onCellClick(r, c);
      container.appendChild(cell);
    }
    daysPlayed = streak;
    localStorage.setItem('mm-streak', JSON.stringify({ date: today, streak }));
  } catch (e) {
    daysPlayed = 1;
  }
}

// IMG_2671.png contains 3 stars side-by-side (white, blue, green).
// IMG_2673.png contains 2 stars side-by-side (red, purple).
// IMG_2674.png contains 2 explosion graphics; show only the first (left half).
// IMG_2675.png has one large star in the left half (~pixels 32-770 of 1536) and
//   three smaller stars in the right half; backgroundSize 200% shows only the large star.
// All other images contain a single graphic and use normal contain sizing.
function getGemStyle(type) {
  if (spriteCache.tileSprites && spriteCache.tileSprites[type]) {
    return {
      backgroundImage: `url(${spriteCache.tileSprites[type]})`,
      backgroundSize: 'contain',
      backgroundPosition: '50% 50%',
      glow: GEM_GLOW_COLORS[type] || '#00ff41',
    };
  }

  const styleMap = {
    'yellow':    { backgroundImage: 'url(IMG_2669.png)', backgroundSize: 'contain',   backgroundPosition: '50% 50%', glow: GEM_GLOW_COLORS.yellow },
    'white':     { backgroundImage: 'url(IMG_2671.png)', backgroundSize: '300% 100%', backgroundPosition: '0% 50%', glow: GEM_GLOW_COLORS.white },
    'blue':      { backgroundImage: 'url(IMG_2671.png)', backgroundSize: '300% 100%', backgroundPosition: '50% 50%', glow: GEM_GLOW_COLORS.blue },
    'green':     { backgroundImage: 'url(IMG_2671.png)', backgroundSize: '300% 100%', backgroundPosition: '100% 50%', glow: GEM_GLOW_COLORS.green },
    'red':       { backgroundImage: 'url(IMG_2673.png)', backgroundSize: '200% 100%', backgroundPosition: '0% 50%', glow: GEM_GLOW_COLORS.red },
    'purple':    { backgroundImage: 'url(IMG_2673.png)', backgroundSize: '200% 100%', backgroundPosition: '100% 50%', glow: GEM_GLOW_COLORS.purple },
    'bomb':      { backgroundImage: 'url(IMG_2674.png)', backgroundSize: '200% 100%', backgroundPosition: '0% 50%', glow: GEM_GLOW_COLORS.bomb },
    'lightning': { backgroundImage: 'url(IMG_2675.png)', backgroundSize: '200% 100%', backgroundPosition: '0% 50%', glow: GEM_GLOW_COLORS.lightning },
    'rainbow':   { backgroundImage: 'url(IMG_2676.png)', backgroundSize: 'contain',   backgroundPosition: '50% 50%', glow: GEM_GLOW_COLORS.rainbow },
  };
  return styleMap[type] || styleMap['yellow'];
}

function gemIcon(type) {
  // Keeping as fallback
  const iconMap = {
    'yellow': '⭐',
    'white': '💎',
    'blue': '💧',
    'green': '🍀',
    'red': '❤️',
    'purple': '💜',
    'bomb': '💣',
    'lightning': '⚡',
    'rainbow': '🌈'
  };
  return iconMap[type] || '⭐';
}

function showMsg(text) {
  if (dom.msg) dom.msg.textContent = text;
}

  // If a power-up is active, use it on this cell
  if (activePowerUp) {
    usePowerUp(r, c);
    return;
  }

  if (!selected) {
    selected = { r, c };
    highlightCell(r, c, true);
    return;
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
  if (moves <= 0) {
    showMsg('No moves left');
    return;
  }

  locked = true;
  selected = null;
  moves--;
  combo = 0; // Reset combo on new move
  lastSupernovaCombo = 0;
  updateStats();

  resolveMatches();
}

function usePowerUp(r, c) {
  if (!activePowerUp || powerUps[activePowerUp] <= 0) {
    activePowerUp = null;
    updatePowerUpButtons();
    return;
  }

  // Apply the special gem effect
  const result = applySpecialGem(grid, SPECIAL_GEM_TYPES[activePowerUp.toUpperCase()], r, c);
  grid = result.grid;

  // Animate the cleared cells
  if (result.clearedCells.length > 0) {
    const matches = [result.clearedCells];
    animateMatches(matches);

    // Award points for special gem usage
    score += result.clearedCells.length * 15; // Bonus points for power-ups
    coins += Math.floor(result.clearedCells.length / 3); // Earn some coins back
  }

  // Consume the power-up
  powerUps[activePowerUp]--;
  activePowerUp = null;
  updateStats();
  updateStoreDisplay();
  updatePowerUpButtons();

  // Apply gravity and resolve any new matches
  setTimeout(() => {
    grid = applyGravity(grid);
    renderGrid();
    combo = 0; // Power-ups start fresh combo
    lastSupernovaCombo = 0;
    setTimeout(resolveMatches, CHAIN_REACTION_DELAY_MS);
  }, 400);
}

function highlightCell(r, c, on) {
  const cell = document.querySelector(`.match-cell[data-row="${r}"][data-col="${c}"]`);
  if (!cell) return;
  cell.style.outline = on ? '2px solid #00ff41' : 'none';
}

function processCascade(chain) {
  const matches = findMatches(grid);
  if (matches.length === 0) {
    locked = false;
    finalizeMove();
    return;
  }

  // Increment combo
  combo++;
  const comboMultiplier = Math.min(combo, 10); // Cap at 10x

  // Calculate score with combo bonus
  matches.forEach(m => {
    const baseScore = m.length * 10;
    const bonusScore = baseScore * comboMultiplier;
    score += bonusScore;

    // Earn coins based on combo
    if (combo >= 3) {
      coins += Math.floor(combo / 2);
    }
  });

  updateStats();

  // Show combo visual feedback
  if (combo >= 2) {
    showComboEffect(combo);
  }

  // Animate matched cells
  animateMatches(matches);

  if (chain > 1) {
    showMsg('Chain x' + chain + '! +' + points);
  }

  bumpConscience(clearedCells);
  highlightMatched(matches);
  afterScoring();
  updateHUD();

  setTimeout(() => {
    grid = clearMatches(grid, matches);
    grid = applyGravity(grid);
    renderBoard();
    setTimeout(() => processCascade(chain + 1), CASCADE_DELAY);
  }, CASCADE_DELAY);
}

function highlightMatched(matches) {
  const cells = dom.board?.querySelectorAll('.gem-cell') || [];
  matches.forEach(group => {
    group.forEach(({ r, c }) => {
      const idx = r * COLS + c;
      if (cells[idx]) cells[idx].classList.add('matched');
    });
  });
}

function showComboEffect(comboCount) {
  const banner = document.getElementById('match-combo-banner');
  if (banner) {
    let comboText = `${comboCount}x COMBO!`;
    if (comboCount >= 5) comboText = `🔥 ${comboCount}x MEGA COMBO! 🔥`;
    if (comboCount >= 8) comboText = `⚡ ${comboCount}x SUPER COMBO! ⚡`;

    banner.textContent = comboText;
    banner.classList.remove('hidden');
    banner.classList.add('combo-pulse');

    setTimeout(() => {
      banner.classList.add('hidden');
      banner.classList.remove('combo-pulse');
    }, 800);
  }

  if (comboCount >= 5 && comboCount % 5 === 0 && comboCount > lastSupernovaCombo) {
    lastSupernovaCombo = comboCount;
    triggerSupernovaBurst();
  }
}

function animateMatches(matches) {
  matches.forEach(group => {
    const first = group[0];
    group.forEach(({ r, c }) => {
      const cell = document.querySelector(`.match-cell[data-row="${r}"][data-col="${c}"]`);
      if (cell) {
        cell.classList.add('match-explode');

        // Create particle effect
        createParticles(cell);
      }
    });

    if (first) {
      const cell = document.querySelector(`.match-cell[data-row="${first.r}"][data-col="${first.c}"]`);
      if (cell) playShootingStarFromCell(cell);
    }
  });
}

function createParticles(cell) {
  const rect = cell.getBoundingClientRect();
  const container = document.getElementById('match-grid');
  const containerRect = container.getBoundingClientRect();

  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const angle = (Math.PI * 2 * i) / 8;
    const distance = 30 + Math.random() * 20;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    particle.style.left = (rect.left - containerRect.left + rect.width / 2) + 'px';
    particle.style.top = (rect.top - containerRect.top + rect.height / 2) + 'px';
    particle.style.setProperty('--dx', dx + 'px');
    particle.style.setProperty('--dy', dy + 'px');

    container.appendChild(particle);

    setTimeout(() => particle.remove(), 600);
  }
}

function getEffectsLayer() {
  return document.getElementById('match-effects-layer');
}

function playShootingStarFromCell(cell) {
  if (!cell || !spriteCache.shootingFrames.length) return;
  const layer = getEffectsLayer();
  const scoreTarget = document.getElementById('match-score');
  if (!layer || !scoreTarget) return;

  const layerRect = layer.getBoundingClientRect();
  const startRect = cell.getBoundingClientRect();
  const targetRect = scoreTarget.getBoundingClientRect();

  const star = document.createElement('div');
  star.className = 'shooting-star';
  star.style.backgroundImage = `url(${spriteCache.shootingFrames[0]})`;
  layer.appendChild(star);

  const duration = 850;
  const frames = spriteCache.shootingFrames;
  let frameIndex = 0;
  const frameTimer = setInterval(() => {
    frameIndex++;
    if (frameIndex >= frames.length) return;
    star.style.backgroundImage = `url(${frames[frameIndex]})`;
  }, duration / frames.length);

  star.animate([
    {
      transform: `translate(${startRect.left - layerRect.left + startRect.width / 2}px, ${startRect.top - layerRect.top + startRect.height / 2}px) scale(0.6) rotate(-8deg)`,
      opacity: 1
    },
    {
      transform: `translate(${targetRect.left - layerRect.left + targetRect.width / 2}px, ${targetRect.top - layerRect.top + targetRect.height / 2}px) scale(1.05) rotate(-2deg)`,
      opacity: 0.25
    }
  ], {
    duration,
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)'
  });

  setTimeout(() => {
    clearInterval(frameTimer);
    star.remove();
  }, duration + 80);
}

function triggerSupernovaBurst(sourceEl) {
  if (!spriteCache.supernovaFrames.length) return;
  const layer = getEffectsLayer();
  const grid = document.getElementById('match-grid');
  if (!layer || !grid) return;

  const layerRect = layer.getBoundingClientRect();
  const originRect = (sourceEl || grid).getBoundingClientRect();
  const cx = originRect.left - layerRect.left + originRect.width / 2;
  const cy = originRect.top - layerRect.top + originRect.height / 2;

  const burst = document.createElement('div');
  burst.className = 'supernova-burst';
  burst.style.left = `${cx - 110}px`;
  burst.style.top = `${cy - 110}px`;
  burst.style.backgroundImage = `url(${spriteCache.supernovaFrames[0]})`;
  layer.appendChild(burst);

  const frames = spriteCache.supernovaFrames;
  const duration = 900;
  let frameIndex = 0;
  const frameTimer = setInterval(() => {
    frameIndex++;
    if (frameIndex >= frames.length) return;
    burst.style.backgroundImage = `url(${frames[frameIndex]})`;
  }, duration / frames.length);

  burst.animate([
    { transform: 'scale(0.5)', opacity: 0.2 },
    { transform: 'scale(1)', opacity: 0.9 },
    { transform: 'scale(1.2)', opacity: 0 }
  ], {
    duration,
    easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)'
  });

  setTimeout(() => {
    clearInterval(frameTimer);
    burst.remove();
  }, duration + 120);
}

function checkLevelUp() {
  const threshold = level * SCORE_PER_LEVEL;
  if (score >= threshold) {
    onLevelComplete(level, score, db, user);
    level++;
    moves += 10;
    coins += 50; // Bonus coins on level up
    triggerSupernovaBurst();
    updateStats();
    updateStoreDisplay();
  }
}

function finalizeMove() {
  updateDailyProgress('score', score);
  updateDailyProgress('level', level);
  updateDailyProgress('clears', totalClears);

  const dailyDone = checkDailyCompletion({ score, level, clears: totalClears });
  if (dailyDone) {
    maybeUnlock('daily_complete');
    unlockStar('silver');
  }

  if (level >= 3) unlockStar('gold');
  if (score >= 1000) unlockStar('sapphire');
  if (totalClears >= 50) unlockStar('emerald');
  if (combo >= 5) unlockStar('ruby');
  if (explosions >= 10) unlockStar('amethyst');
  if (daysPlayed >= 7) unlockStar('obsidian');

  saveState();
}

export function initMatchMaker(db, user) {
  cacheDom();
  updateDayStreak();

  grid         = createInitialGrid();
  score        = 0;
  level        = 1;
  totalClears  = 0;
  combo        = 0;
  explosions   = 0;
  selected     = null;
  locked       = false;
  conscience   = { empathy: 0, justice: 0, wisdom: 0, growth: 0 };

  initLevel();
  if (!loadState()) {
    renderBoard();
    updateConscience();
    showMsg('Match the gems — align your conscience');
    saveState();
  } else {
    renderBoard();
    showMsg('Loaded your save slot');
  }
}

function isPowerUpLocked(type) {
  const required = POWER_UP_REQUIREMENTS[type] || 0;
  return required > 0 && level < required;
}

// Store functionality
export function toggleStore() {
  const storePanel = document.getElementById('match-store-panel');
  if (storePanel) {
    storePanel.classList.toggle('hidden');
  }
}

export function purchasePowerUp(type, cost) {
  if (isPowerUpLocked(type)) {
    alert(`Reach level ${POWER_UP_REQUIREMENTS[type]} to unlock ${type} challenges!`);
    return;
  }

  if (coins < cost) {
    alert('Not enough coins!');
    return;
  }

  coins -= cost;
  powerUps[type]++;
  updateStats();
  updateStoreDisplay();
  updatePowerUpButtons();

  const storeItem = document.getElementById(`store-${type}`);
  if (storeItem) {
    storeItem.classList.add('purchase-flash');
    setTimeout(() => storeItem.classList.remove('purchase-flash'), 300);
  }
}

export function activatePowerUp(type) {
  if (isPowerUpLocked(type)) {
    alert(`Locked: reach level ${POWER_UP_REQUIREMENTS[type]} to unlock this power-up.`);
    return;
  }

  if (powerUps[type] <= 0) {
    alert(`No ${type} power-ups available! Purchase from the store.`);
    return;
  }

  activePowerUp = type;
  updatePowerUpButtons();

  // Show instruction banner
  const banner = document.getElementById('match-combo-banner');
  if (banner) {
    banner.textContent = `Click any gem to use ${type.toUpperCase()} power-up!`;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 2000);
  }
}

function updatePowerUpButtons() {
  const gridContainer = document.getElementById('match-grid');

  // Update visual state of power-up buttons
  ['bomb', 'lightning', 'rainbow'].forEach(type => {
    const btn = document.getElementById(`use-${type}`);
    if (btn) {
      if (activePowerUp === type) {
        btn.classList.add('power-up-active');
      } else {
        btn.classList.remove('power-up-active');
      }

      btn.disabled = powerUps[type] <= 0 || isPowerUpLocked(type);
    }
  });

  // Update grid cursor style
  if (gridContainer) {
    if (activePowerUp) {
      gridContainer.classList.add('power-up-mode');
    } else {
      gridContainer.classList.remove('power-up-mode');
    }
  }
}

function updateStoreDisplay() {
  const elements = {
    bomb: document.getElementById('store-bomb-count'),
    lightning: document.getElementById('store-lightning-count'),
    rainbow: document.getElementById('store-rainbow-count'),
  };

  Object.keys(elements).forEach(type => {
    if (elements[type]) {
      elements[type].textContent = powerUps[type];
    }
  });

  // Also update use button counts
  ['bomb', 'lightning', 'rainbow'].forEach(type => {
    const countElem = document.getElementById(`use-${type}-count`);
    if (countElem) {
      countElem.textContent = powerUps[type];
    }
  });

  ['bomb', 'lightning', 'rainbow'].forEach(type => {
    const storeItem = document.getElementById(`store-${type}`);
    const lockMsg = document.getElementById(`store-${type}-lock`);
    const locked = isPowerUpLocked(type);
    if (storeItem) {
      storeItem.classList.toggle('locked', locked);
      storeItem.dataset.locked = locked ? 'true' : 'false';
    }
    if (lockMsg) {
      lockMsg.textContent = locked ? `Locked until level ${POWER_UP_REQUIREMENTS[type]}` : '';
    }
  });
}

// Make functions globally accessible
window.toggleStore = toggleStore;
window.purchasePowerUp = purchasePowerUp;
window.activatePowerUp = activatePowerUp;
