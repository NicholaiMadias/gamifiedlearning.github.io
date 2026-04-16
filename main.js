import { initMatchMaker } from './match-maker-ui.js';
import { initRavensMessage } from './ravens-message-ui.js';
import { initWhisperingPines, alignSymbols } from './whispering-pines-ui.js';
import { initThirdStarAltar, performRitual } from './third-star-altar-ui.js';
import { initLibraryOfStillWaters, handleWisdomChoice } from './library-of-still-waters-ui.js';

// ── Match Maker ──────────────────────────────────────
initMatchMaker(null, null);

document.getElementById('match-restart-btn').addEventListener('click', () => {
  document.getElementById('match-badge-banner').classList.add('hidden');
  initMatchMaker(null, null);
});

// ── Raven's Message ──────────────────────────────────
initRavensMessage();

document.getElementById('rm-restart-btn').addEventListener('click', initRavensMessage);

// ── Whispering Pines ─────────────────────────────────
initWhisperingPines();

document.getElementById('wp-align-btn').addEventListener('click', alignSymbols);

// ── Third-Star Altar ─────────────────────────────────
initThirdStarAltar();

document.getElementById('altar-ritual-btn').addEventListener('click', performRitual);

// ── Library of Still Waters ──────────────────────────
initLibraryOfStillWaters();

document.getElementById('lsw-wise-btn').addEventListener('click', () => handleWisdomChoice('wise'));
document.getElementById('lsw-unwise-btn').addEventListener('click', () => handleWisdomChoice('unwise'));

document.getElementById('lsw-retry-btn').addEventListener('click', () => {
  document.getElementById('lsw-retry-btn').classList.add('hidden');
  initLibraryOfStillWaters();
});

// ── Tab navigation ────────────────────────────────────
const TAB_SCREENS = {
  'match-maker':         'tab-match-maker',
  'ravens-message':      'tab-ravens-message',
  'whispering-pines':    'tab-whispering-pines',
  'third-star-altar':    'tab-third-star-altar',
  'library-still-waters':'tab-library-still-waters',
};

document.getElementById('tab-nav').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;

  const tabId = btn.dataset.tab;
  const screenId = TAB_SCREENS[tabId];
  if (!screenId) return;

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-btn--active'));
  btn.classList.add('tab-btn--active');

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('screen--active'));
  document.getElementById(screenId).classList.add('screen--active');
});
