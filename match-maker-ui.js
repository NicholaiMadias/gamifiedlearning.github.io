// match-maker-ui.js
import {
  createInitialGrid,
  canSwap,
  applySwap,
  findMatches,
  clearMatches,
  applyGravity,
  GRID_SIZE,
} from './matchMakerState.js';
import { onLevelComplete } from './badges.js';

let grid;
let selected = null;
let score = 0;
let moves = 20;
let level = 1;
let shards = 0;
let comboChain = 0;
let comboMultiplier = 1;
let db = null;
let user = null;
let storeBound = false;

const SCORE_PER_LEVEL = 500;
const CHAIN_REACTION_DELAY_MS = 320;
const MAX_COMBO_MULTIPLIER = 5;

const STORE_ITEMS = [
  { id: 'moves', label: '+5 Moves Flask', cost: 4, detail: 'Refill your focus and gain +5 moves.', action: () => addMoves(5) },
  { id: 'line', label: 'Line Clear Rune', cost: 3, detail: 'Drop a rune that clears a whole line when matched.', action: () => injectSpecial('row') },
  { id: 'bomb', label: 'Crystal Bomb', cost: 5, detail: 'Place a radiant bomb for a 3×3 blast.', action: () => injectSpecial('bomb') },
  { id: 'wild', label: 'Rainbow Wild', cost: 4, detail: 'Adds a wild gem that links any combo.', action: () => injectSpecial('wild') },
];

// Gem image mapping
const GEM_IMAGES = {
  'heart': 'IMG_2669.png',
  'star': 'IMG_2670.png',
  'cross': 'IMG_2671.png',
  'flame': 'IMG_2673.png',
  'drop': 'IMG_2674.png',
  'wild': null // Will use emoji for wild
};

export function initMatchMaker(dbRef, userRef) {
  db = dbRef;
  user = userRef;
  score = 0;
  moves = 20;
  level = 1;
  shards = 0;
  comboChain = 0;
  comboMultiplier = 1;
  selected = null;
  grid = createInitialGrid();
  renderGrid();
  renderStore();
  updateStats();
  const banner = document.getElementById('match-badge-banner');
  if (banner) banner.classList.add('hidden');
}

function renderGrid(highlightSet = new Set()) {
  const container = document.getElementById('match-grid');
  if (!container) return;
  container.innerHTML = '';

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cellData = grid[r][c];
      const cell = document.createElement('div');
      cell.className = 'match-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.classList.add(`gem-${cellData.kind}`);
      if (cellData.special) cell.classList.add(`special-${cellData.special}`);
      if (highlightSet.has(key(r, c))) cell.classList.add('matching');
      if (selected && selected.r === r && selected.c === c) cell.classList.add('selected');

      const glyph = document.createElement('div');
      glyph.className = 'glyph';

      // Use PNG image for regular gems, emoji for wild
      if (GEM_IMAGES[cellData.kind]) {
        glyph.style.backgroundImage = `url('${GEM_IMAGES[cellData.kind]}')`;
      } else {
        glyph.classList.add('emoji');
        glyph.textContent = gemIcon(cellData);
      }

      cell.appendChild(glyph);

      if (cellData.special) {
        const badge = document.createElement('span');
        badge.className = 'special-chip';
        badge.textContent = specialBadge(cellData.special);
        cell.appendChild(badge);
      }

      cell.onclick = () => onCellClick(r, c);
      container.appendChild(cell);
    }
  }
}

function gemIcon(cell) {
  switch (cell.kind) {
    case 'heart': return '💖';
    case 'star': return '⭐';
    case 'cross': return '✝️';
    case 'flame': return '🔥';
    case 'drop': return '💧';
    case 'wild': return '🌈';
    default: return '⬛';
  }
}

function specialBadge(special) {
  if (special === 'row') return '─';
  if (special === 'col') return '│';
  if (special === 'bomb') return '✦';
  return '☆';
}

function onCellClick(r, c) {
  if (moves <= 0) return;

  if (!selected) {
    selected = { r, c };
    renderGrid();
    return;
  }

  const { r: r1, c: c1 } = selected;
  if (r === r1 && c === c1) {
    selected = null;
    renderGrid();
    return;
  }

  if (!canSwap(grid, r1, c1, r, c)) {
    selected = { r, c };
    renderGrid();
    return;
  }

  const swapped = applySwap(grid, r1, c1, r, c);
  const matches = findMatches(swapped);

  if (matches.length === 0) {
    selected = null;
    renderGrid();
    return;
  }

  grid = swapped;
  selected = null;
  moves--;
  updateStats();

  resolveMatches();
}

function resolveMatches() {
  const groups = findMatches(grid);
  if (groups.length === 0) {
    comboChain = 0;
    comboMultiplier = 1;
    renderGrid();
    checkLevelUp();
    checkGameOver();
    return;
  }

  comboChain++;
  comboMultiplier = Math.min(MAX_COMBO_MULTIPLIER, 1 + (comboChain - 1) * 0.4);

  const matchSet = collectMatchSet(groups);
  const explodedSet = expandSpecials(matchSet);
  const matchCells = [...explodedSet].map(fromKey);

  const spawns = deriveSpecialSpawns(groups);
  const shardGain = Math.max(1, Math.floor(matchCells.length / 4)) + (comboChain > 1 ? 1 : 0);

  shards += shardGain;
  score += Math.round(matchCells.length * 12 * comboMultiplier);
  flashStatus(`Chain x${comboChain}! +${shardGain} shards`);
  updateStats();
  renderGrid(explodedSet);

  // Create particle effects for matched gems
  createParticles(matchCells);

  grid = clearMatches(grid, matchCells, spawns);
  grid = applyGravity(grid);

  setTimeout(resolveMatches, CHAIN_REACTION_DELAY_MS);
}

function deriveSpecialSpawns(groups) {
  const spawns = [];
  groups.forEach(group => {
    if (group.length < 4) return;
    const anchor = group[Math.floor(group.length / 2)];
    const sameRow = group.every(p => p.r === group[0].r);
    const sameCol = group.every(p => p.c === group[0].c);
    const special = sameRow ? 'row' : sameCol ? 'col' : 'bomb';
    const kind = grid[anchor.r][anchor.c]?.kind || 'star';
    spawns.push({ r: anchor.r, c: anchor.c, kind, special });

    if (group.length >= 5) {
      const extra = group[0];
      spawns.push({ r: extra.r, c: extra.c, kind: 'wild', special: 'wild' });
    }
  });

  const unique = new Map();
  spawns.forEach(s => unique.set(key(s.r, s.c), s));
  return [...unique.values()];
}

function expandSpecials(matchSet) {
  const expanded = new Set(matchSet);
  matchSet.forEach(k => {
    const { r, c } = fromKey(k);
    const cell = grid[r][c];
    if (!cell || !cell.special) return;
    if (cell.special === 'wild') return;
    if (cell.special === 'row') {
      for (let col = 0; col < GRID_SIZE; col++) expanded.add(key(r, col));
    } else if (cell.special === 'col') {
      for (let row = 0; row < GRID_SIZE; row++) expanded.add(key(row, c));
    } else {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
            expanded.add(key(nr, nc));
          }
        }
      }
    }
  });
  return expanded;
}

function collectMatchSet(groups) {
  const set = new Set();
  groups.forEach(g => g.forEach(({ r, c }) => set.add(key(r, c))));
  return set;
}

function addMoves(amount) {
  moves += amount;
  flashStatus(`+${amount} moves restored`);
}

function injectSpecial(special) {
  const openCells = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      openCells.push({ r, c });
    }
  }
  const target = openCells[Math.floor(Math.random() * openCells.length)];
  const existingKind = grid[target.r][target.c]?.kind || 'star';
  grid[target.r][target.c] = { kind: special === 'wild' ? 'wild' : existingKind, special };
  flashStatus(`${specialLabel(special)} placed`);
  renderGrid();
}

function specialLabel(special) {
  if (special === 'row') return 'Line rune';
  if (special === 'col') return 'Column rune';
  if (special === 'bomb') return 'Crystal bomb';
  return 'Rainbow wild';
}

function purchase(item) {
  if (shards < item.cost) {
    flashStatus('Not enough shards');
    return;
  }
  shards -= item.cost;
  item.action();
  updateStats();
}

function renderStore() {
  if (storeBound) return;
  const container = document.getElementById('match-store-items');
  if (!container) return;
  container.innerHTML = '';
  STORE_ITEMS.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'store-item';
    btn.dataset.itemId = item.id;
    btn.innerHTML = `
      <div class="store-title">${item.label}</div>
      <div class="store-meta">Cost: ${item.cost} shards • ${item.detail}</div>
    `;
    btn.onclick = () => purchase(item);
    container.appendChild(btn);
  });
  storeBound = true;
}

function updateStats() {
  const scoreEl = document.getElementById('match-score');
  const movesEl = document.getElementById('match-moves');
  const levelEl = document.getElementById('match-level');
  const comboEl = document.getElementById('match-combo');
  const chainEl = document.getElementById('match-chain');
  const shardEl = document.getElementById('match-shards');

  if (scoreEl) scoreEl.textContent = score;
  if (movesEl) movesEl.textContent = moves;
  if (levelEl) levelEl.textContent = level;
  if (comboEl) comboEl.textContent = `${comboMultiplier.toFixed(1)}x`;
  if (chainEl) chainEl.textContent = comboChain > 0 ? `Chain ${comboChain}` : 'Chain 0';
  if (shardEl) shardEl.textContent = shards;
}

function checkLevelUp() {
  const threshold = level * SCORE_PER_LEVEL;
  if (score >= threshold) {
    onLevelComplete(level, score, db, user);
    level++;
    moves += 10;
    flashStatus(`Level up! Level ${level}`);
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

function flashStatus(text) {
  const banner = document.getElementById('match-badge-banner');
  if (banner) {
    banner.textContent = text;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 2000);
  }
}

function key(r, c) {
  return `${r}:${c}`;
}

function fromKey(k) {
  const [r, c] = k.split(':').map(Number);
  return { r, c };
}

function createParticles(matchCells) {
  const container = document.getElementById('match-grid');
  if (!container) return;

  matchCells.forEach(({ r, c }) => {
    const cellEl = container.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    if (!cellEl) return;

    const rect = cellEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Create 6-8 particles per gem
    const particleCount = 6 + Math.floor(Math.random() * 3);

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';

      // Random color based on gem type
      const cell = grid[r][c];
      const colors = {
        'heart': '#ff6b9d',
        'star': '#ffd700',
        'cross': '#7ea6ff',
        'flame': '#ff6347',
        'drop': '#4fc3f7',
        'wild': '#7effd8'
      };
      particle.style.background = colors[cell?.kind] || '#7effd8';

      // Position relative to cell
      const offsetX = rect.left - containerRect.left + rect.width / 2;
      const offsetY = rect.top - containerRect.top + rect.height / 2;
      particle.style.left = offsetX + 'px';
      particle.style.top = offsetY + 'px';

      // Random trajectory
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const distance = 30 + Math.random() * 40;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      particle.style.setProperty('--tx', tx + 'px');
      particle.style.setProperty('--ty', ty + 'px');

      container.appendChild(particle);

      // Remove after animation
      setTimeout(() => particle.remove(), 800);
    }
  });
}
