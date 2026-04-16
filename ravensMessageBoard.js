/**
 * ravensMessageBoard.js — game-state logic for the Raven's Message match-3.
 * Framework-agnostic; mirrors the API shape of matchMakerState.js.
 */

export const BOARD_ROWS = 8;
export const BOARD_COLS = 8;

export const RAVEN_TYPES = ['perched', 'flying', 'diving', 'watching', 'calling'];

function randomRaven() {
  return RAVEN_TYPES[Math.floor(Math.random() * RAVEN_TYPES.length)];
}

/**
 * Creates an 8×8 board with no pre-existing matches.
 */
export function createBoard() {
  const board = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < BOARD_COLS; c++) {
      let raven;
      do {
        raven = randomRaven();
      } while (
        (c >= 2 && board[r][c - 1] === raven && board[r][c - 2] === raven) ||
        (r >= 2 && board[r - 1][c] === raven && board[r - 2][c] === raven)
      );
      board[r][c] = raven;
    }
  }
  return board;
}

/**
 * Returns true if the two cells are adjacent (share an edge).
 */
export function canSwap(board, r1, c1, r2, c2) {
  const rowDiff = Math.abs(r1 - r2);
  const colDiff = Math.abs(c1 - c2);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Returns a new board with the two cells swapped.
 */
export function applySwap(board, r1, c1, r2, c2) {
  const next = board.map(row => [...row]);
  const tmp = next[r1][c1];
  next[r1][c1] = next[r2][c2];
  next[r2][c2] = tmp;
  return next;
}

/**
 * Finds all horizontal and vertical matches of 3 or more.
 * Returns an array of match groups, each being an array of {r, c} objects.
 */
export function findMatches(board) {
  const matched = new Set();
  const key = (r, c) => `${r},${c}`;

  // Horizontal
  for (let r = 0; r < BOARD_ROWS; r++) {
    let run = 1;
    for (let c = 1; c <= BOARD_COLS; c++) {
      if (c < BOARD_COLS && board[r][c] && board[r][c] === board[r][c - 1]) {
        run++;
      } else {
        if (run >= 3) {
          for (let k = c - run; k < c; k++) matched.add(key(r, k));
        }
        run = 1;
      }
    }
  }

  // Vertical
  for (let c = 0; c < BOARD_COLS; c++) {
    let run = 1;
    for (let r = 1; r <= BOARD_ROWS; r++) {
      if (r < BOARD_ROWS && board[r][c] && board[r][c] === board[r - 1][c]) {
        run++;
      } else {
        if (run >= 3) {
          for (let k = r - run; k < r; k++) matched.add(key(k, c));
        }
        run = 1;
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
 * Returns a new board with matched cells set to null.
 */
export function clearMatches(board, matches) {
  const next = board.map(row => [...row]);
  matches.forEach(group => {
    group.forEach(({ r, c }) => {
      next[r][c] = null;
    });
  });
  return next;
}

/**
 * Applies gravity: shifts non-null cells down, fills top with new random ravens.
 */
export function applyGravity(board) {
  const next = board.map(row => [...row]);
  for (let c = 0; c < BOARD_COLS; c++) {
    const ravens = [];
    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
      if (next[r][c] !== null) ravens.push(next[r][c]);
    }
    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
      next[r][c] = ravens.length > 0 ? ravens.shift() : randomRaven();
    }
  }
  return next;
}
