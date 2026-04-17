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

const SCORE_PER_LEVEL = 500;
const CHAIN_REACTION_DELAY_MS = 300;

export function initMatchMaker(dbRef, userRef) {
  db = dbRef;
  user = userRef;
  score = 0;
  moves = 20;
  level = 1;
  combo = 0;
  activePowerUp = null;
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

function renderGrid() {
  const container = document.getElementById('match-grid');
  container.innerHTML = '';

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'match-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;

      const gemType = grid[r][c];
      const img = document.createElement('div');
      img.className = 'gem-icon';
      img.style.backgroundImage = `url(${getGemImage(gemType)})`;
      img.dataset.gemType = gemType;
      cell.appendChild(img);

      cell.onclick = () => onCellClick(r, c);
      container.appendChild(cell);
    }
  }
}

function getGemImage(type) {
  const gemMap = {
    'yellow': 'IMG_2669.png',    // Yellow star
    'white': 'IMG_2671.png',     // White/silver star
    'blue': 'IMG_2671.png',      // Blue star (using 2671 which has multiple colors)
    'green': 'IMG_2671.png',     // Green star (using 2671 which has multiple colors)
    'red': 'IMG_2673.png',       // Red star
    'purple': 'IMG_2673.png',    // Purple star (using 2673 which has red/purple)
    'bomb': 'IMG_2674.png',      // Explosion effect for bombs
    'lightning': 'IMG_2675.png', // Shooting star for lightning
    'rainbow': 'IMG_2676.png'    // Multi-star progression for rainbow
  };
  return gemMap[type] || 'IMG_2669.png';
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

function onCellClick(r, c) {
  if (moves <= 0) return;

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

  const { r: r1, c: c1 } = selected;
  if (r === r1 && c === c1) {
    highlightCell(r, c, false);
    selected = null;
    return;
  }

  if (!canSwap(grid, r1, c1, r, c)) {
    highlightCell(r1, c1, false);
    selected = { r, c };
    highlightCell(r, c, true);
    return;
  }

  const swapped = applySwap(grid, r1, c1, r, c);
  const matches = findMatches(swapped);

  if (matches.length === 0) {
    // Invalid swap — no match produced, revert selection
    highlightCell(r1, c1, false);
    selected = null;
    return;
  }

  grid = swapped;
  highlightCell(r1, c1, false);
  selected = null;
  moves--;
  combo = 0; // Reset combo on new move
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
    setTimeout(resolveMatches, CHAIN_REACTION_DELAY_MS);
  }, 400);
}

function highlightCell(r, c, on) {
  const cell = document.querySelector(`.match-cell[data-row="${r}"][data-col="${c}"]`);
  if (!cell) return;
  cell.style.outline = on ? '2px solid #00ff41' : 'none';
}

function resolveMatches() {
  const matches = findMatches(grid);
  if (matches.length === 0) {
    renderGrid();
    checkLevelUp();
    checkGameOver();
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

  grid = clearMatches(grid, matches);
  grid = applyGravity(grid);
  renderGrid();

  // chain reactions
  setTimeout(resolveMatches, CHAIN_REACTION_DELAY_MS);
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
}

function animateMatches(matches) {
  matches.forEach(group => {
    group.forEach(({ r, c }) => {
      const cell = document.querySelector(`.match-cell[data-row="${r}"][data-col="${c}"]`);
      if (cell) {
        cell.classList.add('match-explode');

        // Create particle effect
        createParticles(cell);
      }
    });
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

function checkLevelUp() {
  const threshold = level * SCORE_PER_LEVEL;
  if (score >= threshold) {
    onLevelComplete(level, score, db, user);
    level++;
    moves += 10;
    coins += 50; // Bonus coins on level up
    updateStats();
  }
}

function checkGameOver() {
  if (moves <= 0) {
    const banner = document.getElementById('match-badge-banner');
    if (banner) {
      banner.textContent = `Game Over! Final score: ${score}`;
      banner.classList.remove('hidden');
    }
  }
}

// Store functionality
export function toggleStore() {
  const storePanel = document.getElementById('match-store-panel');
  if (storePanel) {
    storePanel.classList.toggle('hidden');
  }
}

export function purchasePowerUp(type, cost) {
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

      btn.disabled = powerUps[type] <= 0;
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
}

// Make functions globally accessible
window.toggleStore = toggleStore;
window.purchasePowerUp = purchasePowerUp;
window.activatePowerUp = activatePowerUp;
