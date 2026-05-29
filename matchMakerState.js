export const GRID_SIZE = 7;

const BASE_GEM_TYPES = ['heart', 'star', 'cross', 'flame', 'drop'];

export function makeGem(kind, special = null) {
  return { kind, type: kind, special, createdBy: null };
}

function cloneGrid(grid) {
  return grid.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

function randomGem() {
  return makeGem(BASE_GEM_TYPES[Math.floor(Math.random() * BASE_GEM_TYPES.length)]);
}

function sameKind(a, b) {
  if (!a || !b) return false;
  const aKind = a.kind ?? a.type;
  const bKind = b.kind ?? b.type;
  if (aKind === 'wild' || bKind === 'wild') return true;
  return aKind === bKind;
}

/**
 * Creates an initial 7×7 grid with no pre-existing matches.
 */
export function createInitialGrid() {
  const grid = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let gem;
      do {
        gem = randomGem();
      } while (
        (c >= 2 && sameKind(grid[r][c - 1], { kind: gem.kind }) && sameKind(grid[r][c - 2], { kind: gem.kind })) ||
        (r >= 2 && sameKind(grid[r - 1][c], { kind: gem.kind }) && sameKind(grid[r - 2][c], { kind: gem.kind }))
      );
      grid[r][c] = gem;
    }
  }
  return grid;
}

/**
 * Returns true if the two cells are adjacent (share an edge).
 */
export function canSwap(grid, r1, c1, r2, c2) {
  const rowDiff = Math.abs(r1 - r2);
  const colDiff = Math.abs(c1 - c2);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

export function isAdjacent(r1, c1, r2, c2) {
  return canSwap(null, r1, c1, r2, c2);
}

/**
 * Returns a new grid with the two cells swapped.
 */
export function applySwap(grid, r1, c1, r2, c2) {
  const next = cloneGrid(grid);
  const tmp = next[r1][c1];
  next[r1][c1] = next[r2][c2];
  next[r2][c2] = tmp;
  return next;
}

/**
 * Finds all horizontal and vertical matches of 3 or more.
 * Returns an array of match arrays, each match being an array of {r, c} objects.
 */
export function findMatches(grid) {
  const groups = [];
  const horizontalRuns = [];
  const verticalRuns = [];

  // Horizontal runs
  for (let r = 0; r < GRID_SIZE; r++) {
    let run = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      if (run.length === 0) {
        run.push({ r, c });
      } else {
        const prev = run[run.length - 1];
        if (grid[r][c] && grid[prev.r][prev.c] && sameKind(grid[r][c], grid[prev.r][prev.c])) {
          run.push({ r, c });
        } else {
          if (run.length >= 3) {
            groups.push(run);
            horizontalRuns.push(run);
          }
          run = [{ r, c }];
        }
      }
    }
    if (run.length >= 3) {
      groups.push(run);
      horizontalRuns.push(run);
    }
  }

  // Vertical runs
  for (let c = 0; c < GRID_SIZE; c++) {
    let run = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      if (run.length === 0) {
        run.push({ r, c });
      } else {
        const prev = run[run.length - 1];
        if (grid[r][c] && grid[prev.r][prev.c] && sameKind(grid[r][c], grid[prev.r][prev.c])) {
          run.push({ r, c });
        } else {
          if (run.length >= 3) {
            groups.push(run);
            verticalRuns.push(run);
          }
          run = [{ r, c }];
        }
      }
    }
    if (run.length >= 3) {
      groups.push(run);
      verticalRuns.push(run);
    }
  }

  const matchMap = new Map();
  groups.forEach(group => {
    group.forEach(({ r, c }) => {
      matchMap.set(`${r}:${c}`, { row: r, col: c });
    });
  });

  const hCells = new Set(horizontalRuns.flat().map(({ r, c }) => `${r}:${c}`));
  const vCells = new Set(verticalRuns.flat().map(({ r, c }) => `${r}:${c}`));
  const specialsMap = new Map();

  matchMap.forEach((cell, posKey) => {
    if (hCells.has(posKey) && vCells.has(posKey)) {
      specialsMap.set(posKey, { row: cell.row, col: cell.col, specialType: 'bomb' });
    }
  });

  const addMidpointSpecial = (run, specialType) => {
    if (run.length < 4) return;
    const mid = run[Math.floor(run.length / 2)];
    const posKey = `${mid.r}:${mid.c}`;
    if (!specialsMap.has(posKey)) {
      specialsMap.set(posKey, { row: mid.r, col: mid.c, specialType });
    }
  };
  horizontalRuns.forEach(run => addMidpointSpecial(run, run.length >= 5 ? 'supernova' : 'row'));
  verticalRuns.forEach(run => addMidpointSpecial(run, run.length >= 5 ? 'supernova' : 'col'));

  groups.matches = [...matchMap.values()];
  groups.specials = [...specialsMap.values()];
  return groups;
}

/**
 * Returns a new grid with matched cells set to null and optional replacements placed.
 */
export function clearMatches(grid, matchCells, replacements = []) {
  const next = cloneGrid(grid);
  matchCells.forEach(({ r, c }) => {
    next[r][c] = null;
  });
  replacements.forEach(repl => {
    next[repl.r][repl.c] = makeGem(repl.kind || randomGem().kind, repl.special || null);
  });
  return next;
}

export function applyMatches(grid, matchResult) {
  const matches = matchResult?.matches
    ? matchResult.matches.map(({ row, col }) => ({ r: row, c: col }))
    : (matchResult || []);
  const replacements = (matchResult?.specials || []).map(({ row, col, specialType }) => {
    const current = grid[row]?.[col];
    const isWild = specialType === 'supernova';
    return {
      r: row,
      c: col,
      kind: isWild ? 'wild' : (current?.kind ?? current?.type ?? 'star'),
      special: isWild ? 'wild' : specialType,
    };
  });
  return clearMatches(grid, matches, replacements);
}

export const createGrid = createInitialGrid;
export const swapGems = applySwap;

/**
 * Applies gravity: shifts non-null cells down, fills top with new random gems.
 */
export function applyGravity(grid) {
  const next = cloneGrid(grid);
  for (let c = 0; c < GRID_SIZE; c++) {
    const gems = [];
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      if (next[r][c] !== null) gems.push(next[r][c]);
    }
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      next[r][c] = gems.length > 0 ? gems.shift() : randomGem();
    }
  }
  return next;
}
