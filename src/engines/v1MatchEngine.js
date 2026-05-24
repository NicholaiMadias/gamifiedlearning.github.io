function findPowerUpSpawns(matchCoordinates = []) {
  if (!Array.isArray(matchCoordinates) || matchCoordinates.length !== 4) return null;

  // Match orientation maps to the opposite line clear direction by design.
  const isHorizontalMatch = matchCoordinates.every(({ row }) => row === matchCoordinates[0].row);
  if (isHorizontalMatch) return 'LINE_V';

  const isVerticalMatch = matchCoordinates.every(({ col }) => col === matchCoordinates[0].col);
  if (isVerticalMatch) return 'LINE_H';

  return null;
}

function placePowerUp(grid, row, col, powerType) {
  if (!grid?.matrix?.[row]?.[col]) return;
  grid.matrix[row][col].special = powerType;
  grid.matrix[row][col].type = 'SPECIAL';
}

function supernovaBlast(grid, row, col, powerType, clearCallback) {
  if (typeof clearCallback !== 'function') return;

  if (powerType === 'LINE_H') {
    for (let c = 0; c < (grid?.cols ?? 0); c++) clearCallback(row, c);
    return;
  }

  if (powerType === 'LINE_V') {
    for (let r = 0; r < (grid?.rows ?? 0); r++) clearCallback(r, col);
  }
}

module.exports = { findPowerUpSpawns, supernovaBlast, placePowerUp };
