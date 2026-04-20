/**
 * matchMakerState2.js — V2 Core Grid State Engine
 * 7-element lattice with {kind, special} gem objects.
 * Void acts as a universal wild element.
 * (c) 2026 NicholaiMadias — MIT License
 */

export const GRID_SIZE = 7;

/** All 7 V2 element types */
export const ELEMENT_TYPES = ['radiant', 'tide', 'verdant', 'forge', 'aether', 'umbra', 'void'];

/** The 6 regular elements placed randomly on the board */
export const REGULAR_ELEMENTS = ['radiant', 'tide', 'verdant', 'forge', 'aether', 'umbra'];

/** The universal wild element (reserved; not placed on the board during normal play) */
export const WILD_ELEMENT = 'void';

/** Special tile type constants */
export const SPECIAL = {
  LINE:      'line',
  CROSS:     'cross',
  NOVA:      'nova',
  SUPERNOVA: 'supernova',
};

/**
 * Creates a gem object.
 * @param {string} kind - Element type
 * @param {string|null} special - Special tile type, or null
 * @returns {{ kind: string, special: string|null }}
 */
export function makeGem(kind, special = null) {
  return { kind, special };
}

/**
 * Returns a random regular element (never void — void is reserved and not
 * placed on the board during normal play).
 * @returns {string}
 */
function randomElement() {
  return REGULAR_ELEMENTS[Math.floor(Math.random() * REGULAR_ELEMENTS.length)];
}

/**
 * Returns true if two gems are considered the same kind for match purposes.
 * Void matches any element (universal wild).
 * @param {{ kind: string }|null} a
 * @param {{ kind: string }|null} b
 * @returns {boolean}
 */
export function sameKind(a, b) {
  if (!a || !b) return false;
  if (a.kind === WILD_ELEMENT || b.kind === WILD_ELEMENT) return true;
  return a.kind === b.kind;
}

/**
 * Creates an initial 7×7 grid with no pre-existing matches.
 * @returns {Array<Array<{kind:string, special:string|null}>>}
 */
export function createInitialGrid() {
  const grid = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let gem;
      do {
        gem = makeGem(randomElement());
      } while (
        (c >= 2 && sameKind(grid[r][c - 1], gem) && sameKind(grid[r][c - 2], gem)) ||
        (r >= 2 && sameKind(grid[r - 1][c], gem) && sameKind(grid[r - 2][c], gem))
      );
      grid[r][c] = gem;
    }
  }
  return grid;
}

/**
 * Returns true if the two cells are adjacent (share an edge).
 * @param {Array} grid
 * @param {number} r1 @param {number} c1
 * @param {number} r2 @param {number} c2
 * @returns {boolean}
 */
export function canSwap(grid, r1, c1, r2, c2) {
  const rowDiff = Math.abs(r1 - r2);
  const colDiff = Math.abs(c1 - c2);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Returns a new grid with the two cells swapped.
 * @returns {Array}
 */
export function applySwap(grid, r1, c1, r2, c2) {
  const next = grid.map(row => [...row]);
  const tmp = next[r1][c1];
  next[r1][c1] = next[r2][c2];
  next[r2][c2] = tmp;
  return next;
}

/**
 * Finds all horizontal and vertical matches of 3 or more, respecting void as wild.
 * Returns a single merged match group: [[{r,c}, ...]] or [].
 * @param {Array} grid
 * @returns {Array<Array<{r:number, c:number}>>}
 */
export function findMatches(grid) {
  const matched = new Set();
  const key = (r, c) => `${r},${c}`;

  // Horizontal runs
  for (let r = 0; r < GRID_SIZE; r++) {
    let runStart = 0;
    for (let c = 1; c <= GRID_SIZE; c++) {
      const atEnd = c === GRID_SIZE;
      const prev  = grid[r][c - 1];
      const curr  = !atEnd ? grid[r][c] : null;
      if (atEnd || !curr || !prev || !sameKind(prev, curr)) {
        if (c - runStart >= 3) {
          for (let k = runStart; k < c; k++) matched.add(key(r, k));
        }
        runStart = c;
      }
    }
  }

  // Vertical runs
  for (let c = 0; c < GRID_SIZE; c++) {
    let runStart = 0;
    for (let r = 1; r <= GRID_SIZE; r++) {
      const atEnd = r === GRID_SIZE;
      const prev  = grid[r - 1][c];
      const curr  = !atEnd ? grid[r][c] : null;
      if (atEnd || !curr || !prev || !sameKind(prev, curr)) {
        if (r - runStart >= 3) {
          for (let k = runStart; k < r; k++) matched.add(key(k, c));
        }
        runStart = r;
      }
    }
  }

  if (matched.size === 0) return [];
  return [[...matched].map(k => {
    const [r, c] = k.split(',').map(Number);
    return { r, c };
  })];
}

/**
 * Returns a new grid with matchCells set to null (or replaced via replacements).
 * @param {Array} grid
 * @param {Array<{r:number, c:number}>} matchCells - Flat list of cells to clear
 * @param {Array<{r:number, c:number, kind:string, special:string|null}>} replacements
 * @returns {Array}
 */
export function clearMatches(grid, matchCells, replacements = []) {
  const next = grid.map(row => [...row]);
  const replMap = new Map(replacements.map(rep => [`${rep.r},${rep.c}`, rep]));
  matchCells.forEach(({ r, c }) => {
    const repl = replMap.get(`${r},${c}`);
    next[r][c] = repl ? makeGem(repl.kind, repl.special) : null;
  });
  return next;
}

/**
 * Applies gravity: shifts non-null cells down, fills top rows with new random gems.
 * @param {Array} grid
 * @returns {Array}
 */
export function applyGravity(grid) {
  const next = grid.map(row => [...row]);
  for (let c = 0; c < GRID_SIZE; c++) {
    const gems = [];
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      if (next[r][c] !== null) gems.push(next[r][c]);
    }
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      next[r][c] = gems.length > 0 ? gems.shift() : makeGem(randomElement());
    }
  }
  return next;
}
