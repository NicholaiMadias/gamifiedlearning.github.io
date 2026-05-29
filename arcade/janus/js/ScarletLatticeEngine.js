/**
 * ScarletLatticeEngine.js - Recursive anti-harmonic geometry (Red Queen's architecture).
 */

export class ScarletLatticeEngine {
  constructor() {
    this.recursions = [];
  }

  update(dt, superposition) {
    const corruptionPotential = Math.max(0, -superposition);
    if (Math.random() < 0.1 * corruptionPotential) {
      this.spawnRecursion();
    }

    this.recursions.forEach((r, i) => {
      r.scale += 0.05;
      r.alpha -= 0.02;
      if (r.alpha <= 0) this.recursions.splice(i, 1);
    });
  }

  spawnRecursion() {
    this.recursions.push({
      x: Math.random() * 800,
      y: Math.random() * 600,
      scale: 1,
      alpha: 1.0,
      rotation: Math.random() * Math.PI
    });
  }

  draw(ctx, superposition) {
    if (superposition >= 0) return;
    const alphaMult = Math.abs(superposition);
    
    ctx.save();
    ctx.strokeStyle = `rgba(255, 0, 64, ${alphaMult * 0.6})`;
    ctx.lineWidth = 2;

    this.recursions.forEach(r => {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rotation);
      ctx.globalAlpha = r.alpha * alphaMult;
      
      // Draw recursive triangle/lattice
      ctx.beginPath();
      ctx.moveTo(0, -20 * r.scale);
      ctx.lineTo(20 * r.scale, 20 * r.scale);
      ctx.lineTo(-20 * r.scale, 20 * r.scale);
      ctx.closePath();
      ctx.stroke();
      
      ctx.restore();
    });
    ctx.restore();
  }

  triggerRecursion(x, y) {
    this.recursions.push({ x, y, scale: 1, alpha: 1.0, rotation: 0 });
  }
}
