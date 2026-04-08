export const GRID_SIZE = 7;
export const GEM_TYPES = ['heart', 'star', 'cross', 'flame', 'drop'];

const randomGem = () => GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];

export function createInitialGrid() {
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      let gem;
      do {
        gem = randomGem();
      } while (createsMatch(grid, r, c, gem));
      grid[r][c] = gem;
    }
  }

  return grid;
}

function createsMatch(grid, r, c, gem) {
  const left1 = c > 0 ? grid[r][c - 1] : null;
  const left2 = c > 1 ? grid[r][c - 2] : null;
  const up1 = r > 0 ? grid[r - 1][c] : null;
  const up2 = r > 1 ? grid[r - 2][c] : null;
  return (gem === left1 && gem === left2) || (gem === up1 && gem === up2);
}

export function canSwap(grid, r1, c1, r2, c2) {
  if (!isAdjacent(r1, c1, r2, c2)) return false;
  const swapped = applySwap(grid, r1, c1, r2, c2);
  const matches = findMatches(swapped);
  return matches.length > 0;
}

function isAdjacent(r1, c1, r2, c2) {
  return (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);
}

export function applySwap(grid, r1, c1, r2, c2) {
  const next = cloneGrid(grid);
  [next[r1][c1], next[r2][c2]] = [next[r2][c2], next[r1][c1]];
  return next;
}

export function findMatches(grid) {
  const toClear = new Set();

  // Horizontal matches
  for (let r = 0; r < GRID_SIZE; r++) {
    let runStart = 0;
    for (let c = 1; c <= GRID_SIZE; c++) {
      const same = c < GRID_SIZE && grid[r][c] === grid[r][runStart];
      if (!same) {
        const length = c - runStart;
        if (length >= 3 && grid[r][runStart]) {
          for (let i = runStart; i < c; i++) {
            toClear.add(`${r},${i}`);
          }
        }
        runStart = c;
      }
    }
  }

  // Vertical matches
  for (let c = 0; c < GRID_SIZE; c++) {
    let runStart = 0;
    for (let r = 1; r <= GRID_SIZE; r++) {
      const same = r < GRID_SIZE && grid[r][c] === grid[runStart][c];
      if (!same) {
        const length = r - runStart;
        if (length >= 3 && grid[runStart][c]) {
          for (let i = runStart; i < r; i++) {
            toClear.add(`${i},${c}`);
          }
        }
        runStart = r;
      }
    }
  }

  if (toClear.size === 0) return [];

  return clusterMatches(toClear);
}

function clusterMatches(toClear) {
  const visited = new Set();
  const groups = [];

  const neighbors = (r, c) => [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ];

  for (const key of toClear) {
    if (visited.has(key)) continue;
    const queue = [key];
    const group = [];

    while (queue.length) {
      const current = queue.pop();
      if (visited.has(current)) continue;
      visited.add(current);
      const [rStr, cStr] = current.split(',');
      const r = Number(rStr);
      const c = Number(cStr);
      group.push({ r, c });

      for (const [nr, nc] of neighbors(r, c)) {
        const nKey = `${nr},${nc}`;
        if (toClear.has(nKey) && !visited.has(nKey)) {
          queue.push(nKey);
        }
      }
    }

    groups.push(group);
  }

  return groups;
}

export function clearMatches(grid, matches) {
  const next = cloneGrid(grid);
  matches.forEach(group => {
    group.forEach(({ r, c }) => {
      next[r][c] = null;
    });
  });
  return next;
}

export function applyGravity(grid) {
  const next = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

  for (let c = 0; c < GRID_SIZE; c++) {
    let writeRow = GRID_SIZE - 1;
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      const gem = grid[r][c];
      if (gem) {
        next[writeRow][c] = gem;
        writeRow--;
      }
    }
    while (writeRow >= 0) {
      next[writeRow][c] = randomGem();
      writeRow--;
    }
  }

  return next;
}

function cloneGrid(grid) {
  return grid.map(row => [...row]);
}
