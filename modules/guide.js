const gameData = { starsFound: 0 };
const gameState = { comboMultiplier: 1.0, comboThreshold: 500 };
const guideState = { mode: 'Sage', isSilent: false };

let lastActionTime = Date.now();
let idleTimerId = null;

const ARCHIVIST_DIAGNOSTICS = {
  getMystery: () => {
    const clampedStars = Math.max(0, Math.min(7, gameData.starsFound));
    const progress = (clampedStars / 7) * 100;
    const filled = Math.round(progress / 10);
    const empty = 10 - filled;
    const bars = `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
    return `Celestial Sync: ${progress.toFixed(1)}% | [${bars}]`;
  },
  getStorage: () => {
    try {
      const bytes = new Blob([Object.values(localStorage).join('')]).size;
      return `Data Density: ${bytes} bytes. Fragment status: OPTIMAL.`;
    } catch (err) {
      return 'Data Density: unavailable. Fragment status: INSPECT MANUALLY.';
    }
  },
  getCombo: () => {
    const multiplier = Number.isFinite(gameState.comboMultiplier)
      ? gameState.comboMultiplier
      : 1;
    const threshold =
      Number.isFinite(gameState.comboThreshold) && gameState.comboThreshold >= 0
        ? gameState.comboThreshold
        : 500;
    return `Kinetic Flow: x${multiplier.toFixed(1)} | Threshold to next Tier: ${threshold}`;
  },
};

function guidePrint(message) {
  lastActionTime = Date.now();
  const log = document.getElementById('guide-log');

  if (!log) {
    console.info(`[Guide] ${message}`);
    return;
  }

  const line = document.createElement('div');
  line.className = 'guide-log-line';
  line.textContent = message;
  log.appendChild(line);

  while (log.children.length > 4) {
    log.removeChild(log.firstChild);
  }
  log.scrollTop = log.scrollHeight;
}

function updateGuideModeLabel() {
  const modeLabel = document.getElementById('guide-mode-label');
  if (modeLabel) modeLabel.textContent = `Mode: ${guideState.mode}`;
}

function guideIdleCheck() {
  if (guideState.isSilent) return;

  if (Date.now() - lastActionTime > 20000) {
    if (guideState.mode === 'Archivist') {
      const reports = [
        ARCHIVIST_DIAGNOSTICS.getMystery(),
        ARCHIVIST_DIAGNOSTICS.getStorage(),
        ARCHIVIST_DIAGNOSTICS.getCombo(),
      ];
      const randomReport = reports[Math.floor(Math.random() * reports.length)];

      guidePrint(`[DIAGNOSTIC] ${randomReport}`);
    } else {
      guidePrint('The constellation shifts. Can you feel the alignment?');
    }
    lastActionTime = Date.now();
  }
}

function switchGuideMode() {
  const avatar = document.getElementById('guide-avatar');
  guideState.mode = guideState.mode === 'Sage' ? 'Archivist' : 'Sage';

  if (guideState.mode === 'Archivist') {
    if (avatar) avatar.classList.add('archivist-glitch');
    guidePrint('Archivist Mode: Monitoring Mystery, Storage, and Kinetic Flow.');
  } else {
    if (avatar) avatar.classList.remove('archivist-glitch');
    guidePrint('Sage Mode: Lore protocols re-engaged.');
  }

  updateGuideModeLabel();
  lastActionTime = Date.now();
}

function markGuideActivity() {
  lastActionTime = Date.now();
}

function initGuide({ idleCheckMs = 5000 } = {}) {
  updateGuideModeLabel();
  const toggle = document.getElementById('guide-mode-toggle');
  if (toggle) toggle.addEventListener('click', switchGuideMode);

  if (!idleTimerId) idleTimerId = window.setInterval(guideIdleCheck, idleCheckMs);
  guidePrint('Sage Mode: Lore protocols re-engaged.');
}

function recordMysteryProgress(starsFound) {
  const stars = Number.isFinite(starsFound) ? starsFound : 0;
  gameData.starsFound = Math.max(0, Math.min(7, stars));
  markGuideActivity();
}

function recordComboState(multiplier, threshold) {
  if (Number.isFinite(multiplier)) {
    gameState.comboMultiplier = Math.max(1, multiplier);
  }
  if (Number.isFinite(threshold)) {
    gameState.comboThreshold = Math.max(0, threshold);
  }
  markGuideActivity();
}

export {
  ARCHIVIST_DIAGNOSTICS,
  gameData,
  gameState,
  guideIdleCheck,
  guidePrint,
  guideState,
  initGuide,
  markGuideActivity,
  recordComboState,
  recordMysteryProgress,
  switchGuideMode,
};
