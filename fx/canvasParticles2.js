/**
 * canvasParticles2.js — V2 Canvas-Based Heavy Particle FX
 * (c) 2026 NicholaiMadias — MIT License
 */

const ELEMENT_COLORS = {
  radiant: ['#FFD700', '#FFA500', '#FFFACD'],
  tide:    ['#00BFFF', '#1E90FF', '#87CEEB'],
  verdant: ['#32CD32', '#228B22', '#98FB98'],
  forge:   ['#FF4500', '#FF6347', '#FF8C00'],
  aether:  ['#9370DB', '#8A2BE2', '#DA70D6'],
  umbra:   ['#4B0082', '#6A0DAD', '#9966CC'],
  void:    ['#FFFFFF', '#C0C0C0', '#E0E0E0'],
};

const DEFAULT_COLORS = ['#00FF41', '#00BFFF', '#FF6347'];

export class CanvasParticleSystem {
  constructor(canvas) {
    this._canvas    = canvas;
    this._ctx       = canvas ? canvas.getContext('2d') : null;
    this._particles = [];
    this._animFrame = null;
    this._running   = false;
  }

  start() {
    if (this._running || !this._ctx) return;
    this._running = true;
    this._tick();
  }

  stop() {
    this._running = false;
    if (this._animFrame !== null) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
  }

  _tick() {
    if (!this._running) return;
    const ctx = this._ctx;
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._particles = this._particles.filter(p => p.life > 0);
    this._particles.forEach(p => this._updateAndDraw(ctx, p));
    if (this._particles.length > 0) {
      this._animFrame = requestAnimationFrame(() => this._tick());
    } else {
      this._running   = false;
      this._animFrame = null;
    }
  }

  _updateAndDraw(ctx, p) {
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += 0.15;
    p.life -= 1;
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  explode(x, y, element = 'void', count = 20) {
    if (!this._ctx) return;
    const colors = ELEMENT_COLORS[element] || DEFAULT_COLORS;
    for (let i = 0; i < count; i++) {
      const angle   = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed   = 1.5 + Math.random() * 3;
      const maxLife = 30 + Math.floor(Math.random() * 20);
      this._particles.push({
        x, y,
        vx:      Math.cos(angle) * speed,
        vy:      Math.sin(angle) * speed,
        radius:  2 + Math.random() * 3,
        color:   colors[Math.floor(Math.random() * colors.length)],
        life:    maxLife,
        maxLife,
      });
    }
    if (!this._running) this.start();
  }

  resize() {
    if (!this._canvas) return;
    this._canvas.width  = this._canvas.offsetWidth;
    this._canvas.height = this._canvas.offsetHeight;
  }

  clearAll() {
    this._particles = [];
    if (this._ctx) {
      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
  }

  getParticleCount() {
    return this._particles.length;
  }
}
