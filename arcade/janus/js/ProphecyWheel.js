/**
 * ProphecyWheel.js - Multi-ring timeline visualization.
 */

export class ProphecyWheel {
  constructor() {
    this.rotation = 0;
    this.rings = [
      { radius: 100, speed: 0.01, glyphs: 8 },
      { radius: 180, speed: -0.005, glyphs: 12 },
      { radius: 260, speed: 0.002, glyphs: 16 }
    ];
  }

  update(dt, superposition) {
    this.rotation += 0.001 * dt;
  }

  draw(ctx) {
    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.lineWidth = 1;

    this.rings.forEach((ring, i) => {
      ctx.save();
      ctx.rotate(this.rotation * ring.speed * 100);
      
      // Draw Ring
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Glyphs
      for (let j = 0; j < ring.glyphs; j++) {
        const angle = (j / ring.glyphs) * Math.PI * 2;
        const x = Math.cos(angle) * ring.radius;
        const y = Math.sin(angle) * ring.radius;
        
        ctx.fillStyle = 'rgba(126, 255, 216, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    ctx.restore();
  }

  rotate(amount) {
    this.rotation += amount * 0.01;
  }
}
