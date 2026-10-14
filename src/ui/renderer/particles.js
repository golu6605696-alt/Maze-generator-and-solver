/**
 * @file particles.js
 * Chalk dust particle trail buffer (64 entries ring buffer).
 * Defined in DESIGN.md section 4.3.
 */

export class ParticleSystem {
  constructor(maxParticles = 64) {
    this._max = maxParticles;
    this._particles = [];
    this._cursor = 0;
  }

  /**
   * Spawns chalk trail particles at cell center.
   * @param {number} x Pixel x
   * @param {number} y Pixel y
   * @param {number} vx Velocity x
   * @param {number} vy Velocity y
   */
  spawn(x, y, vx = 0, vy = 0) {
    const p = {
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      vx: -vx * 2 + (Math.random() - 0.5) * 2,
      vy: -vy * 2 + (Math.random() - 0.5) * 2,
      angle: Math.random() * Math.PI,
      birth: performance.now(),
      lifeMs: 1400,
    };

    if (this._particles.length < this._max) {
      this._particles.push(p);
    } else {
      this._particles[this._cursor] = p;
      this._cursor = (this._cursor + 1) % this._max;
    }
  }

  /**
   * Draws and updates active particles on canvas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} color
   */
  draw(ctx, color = 'rgba(230, 226, 216, 0.7)') {
    const now = performance.now();
    ctx.save();

    for (let i = 0; i < this._particles.length; i++) {
      const p = this._particles[i];
      const age = now - p.birth;
      if (age >= p.lifeMs) continue;

      const progress = age / p.lifeMs;
      const alpha = (1 - progress) * 0.7;

      ctx.save();
      ctx.translate(p.x + p.vx * progress * 8, p.y + p.vy * progress * 8);
      ctx.rotate(p.angle);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(-1.5, -0.75, 3, 1.5);
      ctx.restore();
    }

    ctx.restore();
  }
}
