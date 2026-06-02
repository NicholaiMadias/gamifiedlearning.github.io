/**
 * WhiteThreadEngine.js - Harmonic identity filaments (Arachne's architecture).
 */

export class WhiteThreadEngine {
  constructor() {
    this.filaments = [];
    this.spawnRate = 0.05;
  }

  update(dt, superposition) {
    const harmonicPotential = Math.max(0, superposition);
    if (Math.random() < this.spawnRate * harmonicPotential) {
      this.spawnFilament();
    }

    this.filaments.forEach((f, i) => {
      f.life -= 0.01;
      if (f.life <= 0) this.filaments.splice(i, 1);
    });
  }

  spawnFilament() {
    this.filaments.push({
      x: Math.random() * 800,
      y: Math.random() * 600,
      life: 1.0,
      size: 50 + Math.random() * 100
    });
  }

  draw(ctx, superposition) {
    if (superposition <= 0) return;
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.strokeStyle = `rgba(255,255,255,${superposition * 0.4})`;
    ctx.lineWidth = 1;

    this.filaments.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size * (1 - f.life), 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  }

  triggerFilament(x, y) {
    this.filaments.push({ x, y, life: 1.0, size: 200 });
  }
}
