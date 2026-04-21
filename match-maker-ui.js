// matchMakerState.js

const ROWS = 7;
const COLS = 7;
const GEM_TYPES = [0, 1, 2, 3, 4, 5]; // adjust as needed

function randomGemType() {
  return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
}

function createGem(type = randomGemType()) {
  return {
    type,
    special: null,      // 'supernova' | 'lineH' | 'lineV' | 'bomb'
    createdBy: null,    // 'tShape' | 'lShape' | 'fiveLine' | 'combo'
  };
}

export function createInitialGrid(rows = ROWS, cols = COLS) {
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => createGem())
  );

  // Optional: ensure no initial matches
  let changed = true;
  while (changed) {
    changed = false;
    const result = findMatches(grid);
    if (result.matches.length > 0) {
      for (const { row, col } of result.matches) {
        grid[row][col] = createGem();
        changed = true;
      }
    }
  }

  return grid;
}

export function canSwap(grid, r1, c1, r2, c2) {
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  if (dr + dc !== 1) return false;

  const clone = cloneGrid(grid);
  swapInPlace(clone, r1, c1, r2, c2);
  const result = findMatches(clone);
  return result.matches.length > 0;
}

export function swapGems(grid, r1, c1, r2, c2) {
  const clone = cloneGrid(grid);
  swapInPlace(clone, r1, c1, r2, c2);
  return clone;
}

function swapInPlace(grid, r1, c1, r2, c2) {
  const tmp = grid[r1][c1];
  grid[r1][c1] = grid[r2][c2];
  grid[r2][c2] = tmp;
}

export function applyGravity(grid) {
  const rows = grid.length;
  const cols = grid[0].length;

  for (let c = 0; c < cols; c++) {
    let writeRow = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      if (grid[r][c] !== null) {
        grid[writeRow][c] = grid[r][c];
        if (writeRow !== r) {
          grid[r][c] = null;
        }
        writeRow--;
      }
    }
    for (let r = writeRow; r >= 0; r--) {
      grid[r][c] = createGem();
    }
  }

  return grid;
}

// ---------- MATCH DETECTION (LINES + T/L SHAPES) ----------

export function findMatches(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const matches = new Set(); // "r,c"

  // Horizontal segments
  for (let r = 0; r < rows; r++) {
    let runStart = 0;
    for (let c = 1; c <= cols; c++) {
      const prev = grid[r][c - 1];
      const curr = c < cols ? grid[r][c] : null;
      if (!curr || !prev || curr.type !== prev.type) {
        const len = c - runStart;
        if (len >= 3) {
          for (let k = runStart; k < c; k++) {
            matches.add(`${r},${k}`);
          }
        }
        runStart = c;
      }
    }
  }

  // Vertical segments
  for (let c = 0; c < cols; c++) {
    let runStart = 0;
    for (let r = 1; r <= rows; r++) {
      const prev = grid[r - 1][c];
      const curr = r < rows ? grid[r][c] : null;
      if (!curr || !prev || curr.type !== prev.type) {
        const len = r - runStart;
        if (len >= 3) {
          for (let k = runStart; k < r; k++) {
            matches.add(`${k},${c}`);
          }
        }
        runStart = r;
      }
    }
  }

  const basicMatches = Array.from(matches).map(s => {
    const [row, col] = s.split(',').map(Number);
    return { row, col };
  });

  return classifyShapes(grid, basicMatches);
}

function classifyShapes(grid, basicMatches) {
  const byCell = new Map(); // "r,c" -> { row, col, neighbors }

  for (const m of basicMatches) {
    const key = `${m.row},${m.col}`;
    byCell.set(key, { ...m, neighbors: [] });
  }

  // Build adjacency (4-neighbors)
  for (const cell of byCell.values()) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dr, dc] of dirs) {
      const nr = cell.row + dr;
      const nc = cell.col + dc;
      const key = `${nr},${nc}`;
      if (byCell.has(key)) cell.neighbors.push(byCell.get(key));
    }
  }

  const specials = [];
  const visited = new Set();

  for (const cell of byCell.values()) {
    const key = `${cell.row},${cell.col}`;
    if (visited.has(key)) continue;

    const comp = [];
    const queue = [cell];
    visited.add(key);

    while (queue.length) {
      const cur = queue.pop();
      comp.push(cur);
      for (const n of cur.neighbors) {
        const nk = `${n.row},${n.col}`;
        if (!visited.has(nk)) {
          visited.add(nk);
          queue.push(n);
        }
      }
    }

    const shapeInfo = classifyComponent(grid, comp);
    specials.push(...shapeInfo.specials);
  }

  return {
    matches: basicMatches,
    specials, // [{ row, col, specialType }]
  };
}

function classifyComponent(grid, comp) {
  const specials = [];
  if (comp.length < 3) return { specials };

  const rows = comp.map(c => c.row);
  const cols = comp.map(c => c.col);
  const minR = Math.min(...rows), maxR = Math.max(...rows);
  const minC = Math.min(...cols), maxC = Math.max(...cols);

  const height = maxR - minR + 1;
  const width = maxC - minC + 1;

  // 5-in-a-row → supernova
  if (comp.length >= 5 && (height === 1 || width === 1)) {
    const center = comp[Math.floor(comp.length / 2)];
    specials.push({
      row: center.row,
      col: center.col,
      specialType: 'supernova',
    });
    return { specials };
  }

  // T / L shape: bounding box > 2x2 and not pure line
  if (comp.length >= 5 && height >= 2 && width >= 2) {
    const center = comp[Math.floor(comp.length / 2)];
    specials.push({
      row: center.row,
      col: center.col,
      specialType: 'bomb',
    });
    return { specials };
  }

  // 4-in-a-row → line clear
  if (comp.length === 4 && (height === 1 || width === 1)) {
    const center = comp[1];
    specials.push({
      row: center.row,
      col: center.col,
      specialType: height === 1 ? 'lineH' : 'lineV',
    });
  }

  return { specials };
}

// ---------- APPLY MATCHES + SPECIALS ----------

export function applyMatches(grid, matchResult, comboLevel) {
  const { matches, specials } = matchResult;
  const toClear = new Set(matches.map(m => `${m.row},${m.col}`));

  // Place specials
  for (const s of specials) {
    const key = `${s.row},${s.col}`;
    if (toClear.has(key)) {
      toClear.delete(key);
      const cell = grid[s.row][s.col];
      grid[s.row][s.col] = {
        ...cell,
        special: s.specialType,
        createdBy: 'shape',
      };
    }
  }

  // Clear normal matched cells
  for (const key of toClear) {
    const [r, c] = key.split(',').map(Number);
    grid[r][c] = null;
  }

  // Trigger specials
  for (const s of specials) {
    triggerSpecial(grid, s.row, s.col, s.specialType, comboLevel);
  }

  return grid;
}

export function triggerSpecial(grid, row, col, type, comboLevel) {
  const rows = grid.length;
  const cols = grid[0].length;

  const mark = (r, c) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (!grid[r][c]) return;
    grid[r][c] = null;
  };

  if (type === 'lineH') {
    for (let c = 0; c < cols; c++) mark(row, c);
  } else if (type === 'lineV') {
    for (let r = 0; r < rows; r++) mark(r, col);
  } else if (type === 'bomb') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        mark(row + dr, col + dc);
      }
    }
  } else if (type === 'supernova') {
    const targetType = grid[row][col]?.type;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c]?.type === targetType) {
          mark(r, c);
        }
      }
    }
  }
}

function cloneGrid(grid) {
  return grid.map(row => row.map(cell => (cell ? { ...cell } : null)));
}
