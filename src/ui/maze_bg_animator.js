/**
 * @file maze_bg_animator.js
 * Interactive dynamic maze background with 3D parallax scroll responsiveness
 * and an immersive "Entering the Maze World" portal entrance experience.
 */

export class MazeBgAnimator {
  constructor(canvasId = 'bg-maze-canvas') {
    this.canvas = typeof document !== 'undefined' ? document.getElementById(canvasId) : null;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.running = false;
    this.rafId = null;

    // Viewport dimensions
    this.width = 0;
    this.height = 0;
    this.dpr = 1;

    // Scroll & Mouse Parallax State
    this.scrollY = 0;
    this.targetScrollY = 0;
    this.scrollVelocity = 0;
    this.lastScrollTime = performance.now();
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;

    // Geometric entities
    this.mazeBlocks = [];
    this.particles = [];
    this.pulses = [];

    this._onResize = this._onResize.bind(this);
    this._onScroll = this._onScroll.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);
    this._loop = this._loop.bind(this);

    if (this.canvas) {
      this.init();
    }
  }

  init() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._onResize();
    this._initEntities();

    window.addEventListener('resize', this._onResize, { passive: true });
    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('mousemove', this._onMouseMove, { passive: true });
    document.addEventListener('visibilitychange', this._onVisibilityChange);

    this.start();
  }

  _onResize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);
    }
  }

  _onScroll() {
    const current = window.scrollY || document.documentElement.scrollTop || 0;
    const now = performance.now();
    const dt = Math.max(1, now - this.lastScrollTime);
    this.scrollVelocity = (current - this.scrollY) / dt;
    this.targetScrollY = current;
    this.lastScrollTime = now;
  }

  _onMouseMove(e) {
    this.targetMouseX = (e.clientX / this.width - 0.5) * 60;
    this.targetMouseY = (e.clientY / this.height - 0.5) * 60;
  }

  _onVisibilityChange() {
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  }

  _initEntities() {
    // 1. Floating 3D Isometric Maze Corridor Blocks
    this.mazeBlocks = [];
    const blockCount = 18;
    for (let i = 0; i < blockCount; i++) {
      this.mazeBlocks.push({
        x: (Math.random() - 0.1) * 1.2 * this.width,
        y: Math.random() * (this.height * 2.5),
        z: 0.25 + Math.random() * 0.75, // Depth layer: 0.25 (far) to 1.0 (near)
        size: 32 + Math.random() * 48,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.003,
        type: Math.floor(Math.random() * 4), // 0: Corner, 1: T-Junction, 2: Cross, 3: Isometric Box
        phase: Math.random() * Math.PI * 2,
        driftSpeedX: (Math.random() - 0.5) * 0.15,
      });
    }

    // 2. Drifting Labyrinth Embers / Stardust Particles
    this.particles = [];
    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 1 + Math.random() * 2.2,
        alpha: 0.2 + Math.random() * 0.6,
        speedY: 0.2 + Math.random() * 0.6,
        speedX: (Math.random() - 0.5) * 0.3,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // 3. Algorithmic Energy Pulses (Pathfinding Waves across the Grid)
    this.pulses = [];
    const pulseCount = 8;
    for (let i = 0; i < pulseCount; i++) {
      this.pulses.push({
        progress: Math.random(),
        speed: 0.002 + Math.random() * 0.003,
        colIndex: Math.floor(Math.random() * 24),
        isCross: Math.random() > 0.5,
        length: 40 + Math.random() * 60,
      });
    }
  }

  _getThemePalette() {
    const theme = document.documentElement.getAttribute('data-theme') || 'terminal';
    switch (theme) {
      case 'cyber':
        return {
          wall: 'rgba(0, 245, 255, 0.45)',
          wallGlow: 'rgba(0, 245, 255, 0.15)',
          grid: 'rgba(35, 45, 90, 0.3)',
          gridActive: 'rgba(0, 245, 255, 0.22)',
          pulse: 'rgba(0, 245, 255, 0.85)',
          pulseSecondary: 'rgba(255, 0, 127, 0.8)',
          particle: 'rgba(0, 245, 255, 0.7)',
          horizon: 'rgba(255, 0, 127, 0.1)',
        };
      case 'jungle':
        return {
          wall: 'rgba(16, 185, 129, 0.4)',
          wallGlow: 'rgba(16, 185, 129, 0.12)',
          grid: 'rgba(12, 36, 27, 0.35)',
          gridActive: 'rgba(16, 185, 129, 0.2)',
          pulse: 'rgba(16, 185, 129, 0.85)',
          pulseSecondary: 'rgba(245, 158, 11, 0.8)',
          particle: 'rgba(52, 211, 153, 0.65)',
          horizon: 'rgba(16, 185, 129, 0.08)',
        };
      case 'sheet':
        return {
          wall: 'rgba(217, 119, 6, 0.48)',
          wallGlow: 'rgba(245, 158, 11, 0.22)',
          grid: 'rgba(160, 105, 50, 0.35)',
          gridActive: 'rgba(245, 158, 11, 0.32)',
          pulse: 'rgba(245, 158, 11, 0.92)',
          pulseSecondary: 'rgba(239, 68, 68, 0.85)',
          particle: 'rgba(251, 191, 36, 0.78)',
          horizon: 'rgba(245, 158, 11, 0.18)',
        };
      case 'terminal':
      default:
        return {
          wall: 'rgba(245, 158, 11, 0.42)',
          wallGlow: 'rgba(245, 158, 11, 0.12)',
          grid: 'rgba(48, 54, 61, 0.35)',
          gridActive: 'rgba(245, 158, 11, 0.22)',
          pulse: 'rgba(245, 158, 11, 0.85)',
          pulseSecondary: 'rgba(56, 189, 248, 0.8)',
          particle: 'rgba(251, 191, 36, 0.65)',
          horizon: 'rgba(245, 158, 11, 0.08)',
        };
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.rafId = requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _loop(time) {
    if (!this.running) return;

    // Smooth scroll interpolation (lerp)
    this.scrollY += (this.targetScrollY - this.scrollY) * 0.12;
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.08;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.08;

    // Decay scroll velocity
    this.scrollVelocity *= 0.92;

    this._draw(time);

    this.rafId = requestAnimationFrame(this._loop);
  }

  _draw(time) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const palette = this._getThemePalette();

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Vanishing Perspective Floor Grid with Parallax
    this._drawPerspectiveFloor(ctx, w, h, palette);

    // 2. Draw Floating 3D Isometric Labyrinth Segments (Parallax Multi-Layer)
    this._drawFloatingMazeBlocks(ctx, w, h, time, palette);

    // 3. Draw Traveling Algorithmic Pulses (BFS/DFS Energy Waves)
    this._drawAlgorithmPulses(ctx, w, h, palette);

    // 4. Draw Ambient Labyrinth Particles (Reacting to Scroll Wind)
    this._drawParticles(ctx, w, h, time, palette);
  }

  _drawPerspectiveFloor(ctx, w, h, palette) {
    const horizonY = h * 0.28 + this.mouseY * 0.3;
    const fovY = h - horizonY;
    if (fovY <= 0) return;

    // Ambient Horizon Radial Glow
    const radGlow = ctx.createRadialGradient(w * 0.5 + this.mouseX * 0.5, horizonY, 10, w * 0.5, horizonY + fovY * 0.5, w * 0.6);
    radGlow.addColorStop(0, palette.horizon);
    radGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = radGlow;
    ctx.fillRect(0, horizonY - 40, w, h - horizonY + 40);

    // Parallax depth offset based on scroll position
    const scrollOffset = (this.scrollY * 0.35) % 80;

    // Transverse lines (lines parallel to horizon, spaced exponentially in perspective)
    ctx.lineWidth = 1;
    const numH = 14;
    for (let i = 1; i <= numH; i++) {
      const t = (i / numH);
      const curveT = Math.pow(t, 2.2); // Exponential perspective
      const lineY = horizonY + curveT * fovY;

      // Subtle parallax vibration
      const shiftedY = lineY + (curveT * scrollOffset * 0.4);
      if (shiftedY > h) continue;

      const alpha = Math.min(0.35, t * 0.4);
      ctx.strokeStyle = palette.grid;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(0, shiftedY);
      ctx.lineTo(w, shiftedY);
      ctx.stroke();
    }

    // Longitudinal rays converging to vanishing point
    const vpX = w * 0.5 + this.mouseX * 0.6;
    const numRays = 18;
    ctx.strokeStyle = palette.grid;
    for (let i = 0; i <= numRays; i++) {
      const bottomX = (i / numRays) * w * 1.6 - w * 0.3;
      const distFromCenter = Math.abs(bottomX - vpX) / (w * 0.5);
      ctx.globalAlpha = Math.max(0.04, 0.22 - distFromCenter * 0.08);
      ctx.beginPath();
      ctx.moveTo(vpX, horizonY);
      ctx.lineTo(bottomX, h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }

  _drawFloatingMazeBlocks(ctx, w, h, time, palette) {
    const totalVirtualHeight = h * 2.2;

    for (let i = 0; i < this.mazeBlocks.length; i++) {
      const b = this.mazeBlocks[i];

      // Update rotation & drift
      b.rot += b.rotSpeed;
      b.x += b.driftSpeedX;
      if (b.x < -100) b.x = w + 80;
      if (b.x > w + 100) b.x = -80;

      // Parallax Y calculation: near blocks (higher z) move faster with scroll!
      const parallaxSpeed = 0.25 + b.z * 0.85;
      const virtualY = (b.y - this.scrollY * parallaxSpeed) % totalVirtualHeight;
      const screenY = virtualY < -120 ? virtualY + totalVirtualHeight : virtualY;
      const screenX = b.x + Math.sin(time * 0.001 + b.phase) * (14 * b.z) + (this.mouseX * b.z * 0.3);

      if (screenY < -100 || screenY > h + 100) continue;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(b.rot);
      ctx.scale(b.z, b.z);

      const size = b.size;
      const half = size * 0.5;

      // Outer Glow Aura
      ctx.shadowColor = palette.wall;
      ctx.shadowBlur = 8 * b.z;

      ctx.strokeStyle = palette.wall;
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';

      // Draw specialized maze pattern block
      if (b.type === 0) {
        // L-Corridor (Corner)
        ctx.beginPath();
        ctx.moveTo(-half, -half);
        ctx.lineTo(-half, half);
        ctx.lineTo(half, half);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-half * 0.3, -half);
        ctx.lineTo(-half * 0.3, half * 0.3);
        ctx.lineTo(half, half * 0.3);
        ctx.stroke();
      } else if (b.type === 1) {
        // T-Junction
        ctx.beginPath();
        ctx.moveTo(-half, 0);
        ctx.lineTo(half, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, half);
        ctx.stroke();

        // Corner node studs
        ctx.fillStyle = palette.pulse;
        ctx.fillRect(-half - 2, -2, 4, 4);
        ctx.fillRect(half - 2, -2, 4, 4);
        ctx.fillRect(-2, half - 2, 4, 4);
      } else if (b.type === 2) {
        // 3D Isometric Labyrinth Cube
        const isoW = size * 0.65;
        const isoH = size * 0.38;
        const wallH = size * 0.45;

        // Top diamond (maze roof)
        ctx.fillStyle = palette.wallGlow;
        ctx.beginPath();
        ctx.moveTo(0, -isoH);
        ctx.lineTo(isoW, 0);
        ctx.lineTo(0, isoH);
        ctx.lineTo(-isoW, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Left wall
        ctx.beginPath();
        ctx.moveTo(-isoW, 0);
        ctx.lineTo(0, isoH);
        ctx.lineTo(0, isoH + wallH);
        ctx.lineTo(-isoW, wallH);
        ctx.closePath();
        ctx.stroke();

        // Right wall
        ctx.beginPath();
        ctx.moveTo(isoW, 0);
        ctx.lineTo(0, isoH);
        ctx.lineTo(0, isoH + wallH);
        ctx.lineTo(isoW, wallH);
        ctx.closePath();
        ctx.stroke();
      } else {
        // Cross Maze Intersection (+) with interior island
        ctx.strokeRect(-half, -half, size, size);
        ctx.beginPath();
        ctx.arc(0, 0, half * 0.35, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  _drawAlgorithmPulses(ctx, w, h, palette) {
    const horizonY = h * 0.28 + this.mouseY * 0.3;
    const fovY = h - horizonY;
    if (fovY <= 0) return;

    const vpX = w * 0.5 + this.mouseX * 0.6;
    const numRays = 18;

    for (let i = 0; i < this.pulses.length; i++) {
      const p = this.pulses[i];
      p.progress += p.speed * (1 + Math.abs(this.scrollVelocity) * 2.5);
      if (p.progress > 1) {
        p.progress = 0;
        p.colIndex = Math.floor(Math.random() * numRays);
      }

      const t = p.progress;
      const curveT = Math.pow(t, 2.2);
      const y = horizonY + curveT * fovY;

      const bottomX = (p.colIndex / numRays) * w * 1.6 - w * 0.3;
      const x = vpX + (bottomX - vpX) * curveT;

      const pulseSize = 2 + t * 4.5;
      const pulseColor = i % 2 === 0 ? palette.pulse : palette.pulseSecondary;

      ctx.save();
      ctx.shadowColor = pulseColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = pulseColor;

      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      // Motion streak
      const prevT = Math.max(0, t - 0.05);
      const prevCurveT = Math.pow(prevT, 2.2);
      const prevY = horizonY + prevCurveT * fovY;
      const prevX = vpX + (bottomX - vpX) * prevCurveT;

      ctx.strokeStyle = pulseColor;
      ctx.lineWidth = pulseSize * 0.6;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawParticles(ctx, w, h, time, palette) {
    const scrollBoost = Math.max(-3, Math.min(6, this.scrollVelocity * 4));

    for (let i = 0; i < this.particles.length; i++) {
      const pt = this.particles[i];

      // Particle movement with scroll inertia
      pt.y -= (pt.speedY + scrollBoost);
      pt.x += pt.speedX;

      if (pt.y < -20) {
        pt.y = h + 20;
        pt.x = Math.random() * w;
      } else if (pt.y > h + 20) {
        pt.y = -20;
        pt.x = Math.random() * w;
      }

      const pulse = Math.sin(time * pt.pulseSpeed + pt.pulsePhase);
      const alpha = Math.max(0.1, pt.alpha + pulse * 0.25);

      ctx.save();
      ctx.fillStyle = palette.particle;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = palette.particle;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Triggers the fancy "Entering the Maze World" 3D portal sequence.
   * Runs the dimensional warp tunnel, plays entrance audio, and initiates staggered hero element reveal.
   */
  triggerEntrancePortal() {
    const portalEl = document.getElementById('maze-portal-intro');
    const heroBox = document.querySelector('.hero-header-box');
    const previewCard = document.querySelector('.hero-preview-card');
    const cards = document.querySelectorAll('.launch-card');
    const guideBox = document.querySelector('.how-to-play-box');

    if (!portalEl) return;

    // Reset visibility
    portalEl.classList.remove('portal-fade-out', 'portal-complete');
    portalEl.style.display = 'flex';
    portalEl.style.opacity = '1';

    // Add entrance class to landing elements
    if (heroBox) heroBox.classList.add('portal-item-enter');
    if (previewCard) previewCard.classList.add('portal-item-enter');
    cards.forEach((card) => card.classList.add('portal-item-enter'));
    if (guideBox) guideBox.classList.add('portal-item-enter');

    const dismissPortal = () => {
      portalEl.classList.add('portal-fade-out');
      setTimeout(() => {
        portalEl.classList.add('portal-complete');
        portalEl.style.display = 'none';

        // Staggered reveal of landing page cards
        if (heroBox) heroBox.classList.add('revealed');
        setTimeout(() => { if (previewCard) previewCard.classList.add('revealed'); }, 140);
        cards.forEach((card, idx) => {
          setTimeout(() => card.classList.add('revealed'), 260 + idx * 120);
        });
        setTimeout(() => { if (guideBox) guideBox.classList.add('revealed'); }, 520);
      }, 550);
    };

    // Auto-dismiss after portal fly-through (~1.3s)
    const timer = setTimeout(dismissPortal, 1250);

    // Instant skip on user click or touch
    const onSkip = () => {
      clearTimeout(timer);
      portalEl.removeEventListener('click', onSkip);
      window.removeEventListener('keydown', onKey);
      dismissPortal();
    };

    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        onSkip();
      }
    };

    portalEl.addEventListener('click', onSkip, { once: true });
    window.addEventListener('keydown', onKey, { once: true });
  }
}
