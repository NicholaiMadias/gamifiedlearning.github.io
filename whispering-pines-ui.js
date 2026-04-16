/**
 * whispering-pines-ui.js — Whispering Pines location page.
 * The player selects all three symbol stones (triangle, circle, diamond)
 * and clicks "Align the Symbols" to complete the puzzle.
 * Dispatches a 'whispering_pines_complete' CustomEvent on window when done.
 */

const STONES = [
  { id: 'triangle', label: '△', name: 'Triangle Stone' },
  { id: 'circle',   label: '○', name: 'Circle Stone'   },
  { id: 'diamond',  label: '◇', name: 'Diamond Stone'  },
];

let activeStones = new Set();
let wpCompleted = false;

export function initWhisperingPines() {
  activeStones = new Set();
  wpCompleted = false;
  renderStones();
  setWPStatus('Select each symbol stone, then align them.');
}

function renderStones() {
  const ring = document.getElementById('wp-stone-ring');
  if (!ring) return;
  ring.innerHTML = '';

  STONES.forEach(({ id, label, name }) => {
    const btn = document.createElement('button');
    btn.className = 'wp-stone';
    btn.id = `wp-stone-${id}`;
    btn.title = name;
    btn.textContent = label;
    btn.onclick = () => toggleStone(id);
    ring.appendChild(btn);
  });
}

function toggleStone(id) {
  if (wpCompleted) return;

  if (activeStones.has(id)) {
    activeStones.delete(id);
  } else {
    activeStones.add(id);
  }

  STONES.forEach(({ id: sid }) => {
    const btn = document.getElementById(`wp-stone-${sid}`);
    if (!btn) return;
    btn.classList.toggle('wp-stone--active', activeStones.has(sid));
  });

  const allSelected = STONES.every(s => activeStones.has(s.id));
  setWPStatus(
    allSelected
      ? 'All stones resonate. You may now align them.'
      : 'Select each symbol stone, then align them.'
  );
}

export function alignSymbols() {
  if (wpCompleted) return;

  const allSelected = STONES.every(s => activeStones.has(s.id));
  if (!allSelected) {
    setWPStatus('You must select all three stones first.');
    return;
  }

  wpCompleted = true;
  setWPStatus('✨ The pines whisper their secret. Puzzle complete!');
  window.dispatchEvent(new CustomEvent('whispering_pines_complete'));
}

function setWPStatus(msg) {
  const el = document.getElementById('wp-status');
  if (el) el.textContent = msg;
}
