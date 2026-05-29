/**
 * AscendantDialogue.js - Psionic communication system.
 */

export class AscendantDialogue {
  constructor() {
    this.messages = [];
  }

  update(dt) {
    // Optional: add text typewriter effects or similar
  }

  show(text, origin = 'arachne') {
    const log = document.getElementById('janus-console-log');
    if (!log) return;

    const entry = document.createElement('div');
    entry.className = `dialogue-entry origin-${origin}`;
    entry.textContent = `[${origin.toUpperCase()}] ${text}`;
    
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }
}
