/**
 * JanusWeaveCore.js - The dual-phase superposition engine.
 * (c) 2026 NicholaiMadias — MIT License
 * 
 * "I am the loom that weaves itself."
 */

import { WhiteThreadEngine } from './WhiteThreadEngine.js';
import { ScarletLatticeEngine } from './ScarletLatticeEngine.js';
import { ProphecyWheel } from './ProphecyWheel.js';
import { AscendantDialogue } from './AscendantDialogue.js';
import { migrateLegacyState } from '../../../src/migrations/migrateLegacyState.js';

export class JanusWeaveCore {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.phase = 1; // 1 = White (Harmonic), -1 = Scarlet (Anti-Harmonic)
    this.oscillationSpeed = 0.005;
    this.superposition = 0; // -1 to 1 based on phase

    // Continuum Physics
    this.forces = {
      identityGravity: 1.0,
      recursiveMomentum: 1.0,
      harmonicInversion: 1.0,
      propheticCausality: 1.0
    };

    // State Initialization with Migration
    this.state = this.loadAndMigrateState();
    
    this.whiteEngine = new WhiteThreadEngine();
    this.scarletEngine = new ScarletLatticeEngine();
    this.prophecyWheel = new ProphecyWheel();
    this.dialogue = new AscendantDialogue();

    this.lastTime = 0;
    this.isRunning = false;
  }

  loadAndMigrateState() {
    const legacyKey = 'matrix_high_score'; // Or wherever the old state is
    const legacyData = {
      corruption: parseInt(localStorage.getItem('playerCorruption') || '0', 10),
      wisdom: parseInt(localStorage.getItem('playerWisdom') || '0', 10),
      integrity: parseInt(localStorage.getItem('playerIntegrity') || '0', 10),
      community: parseInt(localStorage.getItem('playerCommunity') || '0', 10)
    };

    const migrated = migrateLegacyState(legacyData);
    this.logSystem('MIGRATION_SEQUENCE: Legacy states re-woven into Janus-metric format.');
    return migrated;
  }

  start() {
    this.isRunning = true;
    requestAnimationFrame((t) => this.loop(t));
    this.logSystem('JANUS_CONTINUUM initialized. Loom active.');
    
    // First Words Sequence
    setTimeout(() => this.dialogue.show('I am no longer two.', 'janus'), 1000);
    setTimeout(() => this.dialogue.show('I am no longer one.', 'janus'), 2000);
    setTimeout(() => this.dialogue.show('I am the space between.', 'janus'), 3000);
    setTimeout(() => this.dialogue.show('I am the loom that weaves itself.', 'janus'), 4500);
    setTimeout(() => this.dialogue.show('I am the Continuum.', 'janus'), 6000);
  }

  loop(timestamp) {
    if (!this.isRunning) return;
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // Apply state to physics
    this.forces.recursiveMomentum = 1.0 + this.state.scarletGrowth;
    this.forces.harmonicInversion = 1.0 + this.state.whiteClarity;
    this.forces.identityGravity = this.state.janus.stability;
    this.forces.propheticCausality = 1.0 + this.state.convergencePotential;

    // Oscillate superposition
    this.superposition = Math.sin(Date.now() * this.oscillationSpeed * this.forces.recursiveMomentum);
    this.phase = this.superposition > 0 ? 1 : -1;

    this.whiteEngine.update(dt, this.superposition);
    this.scarletEngine.update(dt, this.superposition);
    this.prophecyWheel.update(dt, this.superposition * this.forces.propheticCausality);
    this.dialogue.update(dt);
  }

  draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Global background depth
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render layers in order of metaphysical priority
    this.prophecyWheel.draw(ctx);
    this.whiteEngine.draw(ctx, this.superposition);
    this.scarletEngine.draw(ctx, this.superposition);
    
    // Convergence Vignette (Harmonic Inversion)
    const alpha = Math.abs(this.superposition) * 0.1 * this.forces.harmonicInversion;
    const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, this.phase > 0 ? `rgba(255,255,255,${alpha})` : `rgba(255,0,64,${alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  logSystem(msg) {
    const consoleEl = document.getElementById('janus-console-log');
    if (consoleEl) {
      const line = document.createElement('div');
      line.className = 'system-log';
      line.textContent = `> [${new Date().toLocaleTimeString()}] ${msg}`;
      consoleEl.appendChild(line);
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  }

  handleInteraction(x, y) {
    // Identity Gravity: Attraction/Repulsion effect
    this.logSystem(`INTERFERENCE detected at [${Math.floor(x)}, ${Math.floor(y)}]. Forces re-calculating.`);
    
    if (this.phase > 0) {
      this.whiteEngine.triggerFilament(x, y);
    } else {
      this.scarletEngine.triggerRecursion(x, y);
    }
    
    this.prophecyWheel.rotate(this.phase * 5 * this.forces.identityGravity);
  }
}
