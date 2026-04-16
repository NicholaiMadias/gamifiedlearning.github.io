/**
 * library-of-still-waters-ui.js — Library of Still Waters (Fourth Star: Wisdom).
 *
 * Decision-based encounters: each scenario presents a "wise" and an "unwise"
 * choice.  The player must choose wisely in all scenarios to unlock the star.
 * Scenarios are driven by the SCENARIOS array for easy future JSON migration.
 * Dispatches 'wisdom_star_complete' CustomEvent on window when finished.
 */

const SCENARIOS = [
  {
    prompt: 'A colleague shares information that contradicts your long-held belief. What do you do?',
    wise:   'Pause, consider the new information carefully before responding.',
    unwise: 'Dismiss it — your experience speaks for itself.',
  },
  {
    prompt: 'You hold a truth that could hurt someone but help them grow. When do you share it?',
    wise:   'Find a compassionate moment and speak it gently.',
    unwise: 'Say nothing — truth is a burden best kept to yourself.',
  },
  {
    prompt: 'You have power to act quickly and decisively. The situation is unclear. What do you do?',
    wise:   'Gather what clarity you can, then act deliberately.',
    unwise: 'Act immediately — hesitation is weakness.',
  },
];

let currentScenario = 0;
let wisdomScore = 0;
let lswCompleted = false;

function resetLSWUIState() {
  const retryBtn = document.getElementById('lsw-retry-btn');
  const choiceRow = document.getElementById('lsw-choice-row');

  if (retryBtn) retryBtn.classList.add('hidden');
  if (choiceRow) choiceRow.classList.remove('hidden');

  setLSWStatus('Your choices ripple across the surface of the pool.');
  updateProgress();
}

export function initLibraryOfStillWaters() {
  currentScenario = 0;
  wisdomScore = 0;
  lswCompleted = false;
  resetLSWUIState();
  renderScenario();
}

function renderScenario() {
  if (currentScenario >= SCENARIOS.length) {
    showOutcome();
    return;
  }

  const scene = SCENARIOS[currentScenario];

  setLSWPrompt(scene.prompt);
  setLSWStatus('Your choices ripple across the surface of the pool.');

  const wiseBtn   = document.getElementById('lsw-wise-btn');
  const unwiseBtn = document.getElementById('lsw-unwise-btn');
  const choiceRow = document.getElementById('lsw-choice-row');

  if (wiseBtn)   wiseBtn.textContent   = scene.wise;
  if (unwiseBtn) unwiseBtn.textContent = scene.unwise;
  if (choiceRow) choiceRow.classList.remove('hidden');

  updateProgress();
}

export function handleWisdomChoice(choice) {
  if (lswCompleted) return;

  if (choice === 'wise') {
    wisdomScore++;
    setLSWStatus('💧 The pool reflects clearly. A wise ripple spreads.');
  } else {
    setLSWStatus('🌊 The water distorts. Reflect before you act.');
  }

  currentScenario++;

  // Brief pause so the player can read the feedback before next scenario
  setTimeout(renderScenario, 900);
}

function showOutcome() {
  const choiceRow = document.getElementById('lsw-choice-row');
  if (choiceRow) choiceRow.classList.add('hidden');

  const allWise = wisdomScore === SCENARIOS.length;

  if (allWise) {
    lswCompleted = true;
    setLSWPrompt('The Fourth Star — Wisdom — descends toward you.');
    setLSWStatus(`✨ Perfect clarity. All ${SCENARIOS.length} choices were wise. The star is yours.`);
    window.dispatchEvent(new CustomEvent('wisdom_star_complete', { detail: { score: wisdomScore } }));
  } else {
    setLSWPrompt('The pool grows still. The star remains distant.');
    setLSWStatus(
      `You chose wisely ${wisdomScore} of ${SCENARIOS.length} times. ` +
      'Return when your discernment deepens.'
    );

    // Offer a retry
    const retryBtn = document.getElementById('lsw-retry-btn');
    if (retryBtn) retryBtn.classList.remove('hidden');
  }
}

function updateProgress() {
  const el = document.getElementById('lsw-progress');
  if (el) el.textContent = `Scenario ${currentScenario + 1} of ${SCENARIOS.length}`;
}

function setLSWPrompt(text) {
  const el = document.getElementById('lsw-prompt');
  if (el) el.textContent = text;
}

function setLSWStatus(text) {
  const el = document.getElementById('lsw-status');
  if (el) el.textContent = text;
}
