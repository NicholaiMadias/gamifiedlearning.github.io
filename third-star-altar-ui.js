/**
 * third-star-altar-ui.js — Third-Star Altar ritual interface.
 * The player drags the three artifact slots into the correct order
 * (Ledger Seal → Pines Echo → Raven Emblem) then clicks "Perform Ritual".
 * Any order is accepted in this shell (order validation hook left as TODO).
 * Dispatches a 'third_star_complete' CustomEvent on window when the ritual fires.
 */

const ARTIFACTS = [
  { id: 'ledger',  label: '🔏 Ledger Seal'   },
  { id: 'pines',   label: '🌲 Pines Echo'     },
  { id: 'raven',   label: '🪶 Raven Emblem'   },
];

let slotOrder = [...ARTIFACTS];
let dragSrcIndex = null;
let altarCompleted = false;

export function initThirdStarAltar() {
  slotOrder = [...ARTIFACTS];
  dragSrcIndex = null;
  altarCompleted = false;
  renderSlots();
  setAltarStatus('Arrange the artifacts in their proper order, then perform the ritual.');
}

function renderSlots() {
  const container = document.getElementById('altar-slots');
  if (!container) return;
  container.innerHTML = '';

  slotOrder.forEach((artifact, index) => {
    const slot = document.createElement('div');
    slot.className = 'altar-slot';
    slot.id = `altar-slot-${artifact.id}`;
    slot.draggable = true;
    slot.textContent = artifact.label;
    slot.dataset.index = index;

    slot.addEventListener('dragstart', () => {
      dragSrcIndex = index;
      slot.classList.add('altar-slot--dragging');
    });

    slot.addEventListener('dragend', () => {
      slot.classList.remove('altar-slot--dragging');
      dragSrcIndex = null;
    });

    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      slot.classList.add('altar-slot--over');
    });

    slot.addEventListener('dragleave', () => {
      slot.classList.remove('altar-slot--over');
    });

    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      slot.classList.remove('altar-slot--over');
      if (dragSrcIndex === null || dragSrcIndex === index) return;

      // Swap positions
      const next = [...slotOrder];
      [next[dragSrcIndex], next[index]] = [next[index], next[dragSrcIndex]];
      slotOrder = next;
      dragSrcIndex = null;
      renderSlots();
    });

    container.appendChild(slot);
  });
}

export function performRitual() {
  if (altarCompleted) return;

  altarCompleted = true;
  setAltarStatus('🌟 The altar glows. The Third Star shines bright!');

  const slots = document.getElementById('altar-slots');
  if (slots) slots.classList.add('altar-slots--complete');

  window.dispatchEvent(new CustomEvent('third_star_complete', {
    detail: { order: slotOrder.map(a => a.id) },
  }));
}

function setAltarStatus(msg) {
  const el = document.getElementById('altar-status');
  if (el) el.textContent = msg;
}
