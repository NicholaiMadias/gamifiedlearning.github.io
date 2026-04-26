// --- Updated within initLock() ---
function initLock() {
    const keypad = document.getElementById('lock-keypad');
    if (!keypad || keypad.children.length > 0) return; 
    
    // ... (keypad generation logic) ...
    
    // Ensure the execution button reflects the new branding
    const actionBtn = document.querySelector('#view-lock button');
    if (actionBtn) {
        actionBtn.innerText = "BREAK STATIC";
        actionBtn.classList.add('orbitron', 'tracking-[0.3em]');
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
  } else if (isAdjacent(selected.row, selected.col, row, col)) {
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
    showMsg('No moves left — restart to play again!');
    return;
  }

  locked = true;
  selected = null;
  grid = swapGems(grid, r1, c1, r2, c2);
  moves--;
  comboLevel = 0;
  updateHUD();
  renderBoard();

  const result = findMatches(grid);
  if (!result || !result.matches || result.matches.length === 0) {
    setTimeout(() => {
      grid = swapGems(grid, r1, c1, r2, c2);
      moves++;  // restore move — invalid swaps don't cost a turn
      streak = 0;
      globalMultiplier = 1.0;
      showMsg('No match — try again');
      updateHUD();
      renderBoard();
      setTimeout(() => showMsg(''), 1200);
      locked = false;
    }, CASCADE_DELAY);
  } else {
    processCascade(true);
  }
}

function processCascade(isFirstPass = false) {
  const result = findMatches(grid);
  if (!result || !result.matches || result.matches.length === 0) {
    if (isFirstPass) {
      streak = 0;
      globalMultiplier = 1.0;
    }
    checkLevelUp();
    locked = false;
    updateHUD();
    renderBoard();
    return;
  }

  comboLevel++;

  const comboBonus  = 1 + (comboLevel - 1) * 0.25;
  const streakBonus = 1 + streak * 0.1;
  const multiplier  = globalMultiplier * comboBonus * streakBonus;
  const gained      = result.matches.length * BASE_POINTS * multiplier;
  score += Math.floor(gained);

  if (comboLevel > 1) {
    showMsg('Combo x' + comboLevel + '! +' + Math.floor(gained));
  }

  bumpConscience(result.matches.length);
  highlightMatched(result.matches);

  setTimeout(() => {
    grid = applyMatches(grid, result, comboLevel);
    grid = applyGravity(grid);

    if (isFirstPass) {
      streak++;
      globalMultiplier = Math.min(globalMultiplier + 0.1, 3.0);
    }

    updateHUD();
    renderBoard();
    setTimeout(() => processCascade(false), CASCADE_DELAY);
  }, CASCADE_DELAY);
}

function highlightMatched(matches) {
  const cells = dom.board.querySelectorAll('.gem-cell');
  matches.forEach(({ row, col }) => {
    const idx = row * COLS + col;
    if (cells[idx]) cells[idx].classList.add('matched');
  });
}

function checkLevelUp() {
  const threshold = 500 * level;
  if (score >= threshold) {
    level++;
    updateHUD();
    showMsg('Level ' + level + ' — Keep going!');
    onLevelComplete(level - 1, score, null, null);
  }
}

export function initMatchMaker(db, user) {
  cacheDom();
  grid            = createGrid();
  score           = 0;
  moves           = 20;
  level           = 1;
  selected        = null;
  locked          = false;
  comboLevel      = 0;
  streak          = 0;
  globalMultiplier = 1.0;
  conscience      = { empathy: 0, justice: 0, wisdom: 0, growth: 0 };

  updateHUD();
  updateConscience();
  renderBoard();
  showMsg('Match the gems — align your conscience');
}
