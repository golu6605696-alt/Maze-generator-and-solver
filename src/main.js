/**
 * @file main.js
 * Main entry point for Maze Explorer Quest.
 * Wires AppMachine, ExpeditionController, CampaignStore, ClassicMazeRenderer, and UI components.
 */

import { AppMachine, AppScreen } from './app/app_machine.js';
import { ExpeditionController, ExpeditionState } from './app/expedition_controller.js';
import { campaignStore, CAMPAIGN_WORLDS } from './app/campaign_store.js';
import { ClassicMazeRenderer } from './ui/renderer/classic_renderer.js';
import { setTheme, cycleTheme, getStoredTheme, THEME_SPECS } from './ui/theme.js';
import { sound } from './ui/audio.js';
import { MazeBgAnimator } from './ui/maze_bg_animator.js';
import { formatCode, parseCode, randomSeed } from './core/code.js';
import { DIFFICULTIES, RelicKind, Wall } from './core/constants.js';
import { verifyRun } from './app/run_verifier.js';
import { exportRunJson } from './app/maze_io.js';
import { Grid } from './core/grid.js';
import { Rng } from './structures/rng.js';
import { getGenerator } from './core/generators/index.js';
import { getSolver } from './core/solvers/index.js';
import { drain } from './core/iter.js';
import { braid } from './core/braid.js';
import { buildMaze } from './core/pipeline.js';

let isAppInitialized = false;

function initApp() {
  if (isAppInitialized) return;
  isAppInitialized = true;
  console.log('[MazeQuest] Initializing application...');

  // Init Theme
  const currentTheme = getStoredTheme();
  setTheme(currentTheme);

  // Canvases & Renderers
  const expCanvas = document.getElementById('canvas-expedition');
  const expRenderer = new ClassicMazeRenderer(expCanvas);

  function applyThemeToRenderers(theme) {
    expRenderer.setTheme(theme);
  }
  applyThemeToRenderers(currentTheme);

  // Background Parallax & Scroll Animator
  let bgAnimator = null;
  try {
    bgAnimator = new MazeBgAnimator('bg-maze-canvas');
  } catch (err) {
    console.warn('[MazeQuest] Background animator setup note:', err);
  }

  // App Machine & Screen Routing
  const screenLanding = document.getElementById('screen-landing');
  const screenExpedition = document.getElementById('screen-expedition');
  const screenCampaign = document.getElementById('screen-campaign');

  const expBriefing = document.getElementById('expedition-briefing');
  const expPlay = document.getElementById('expedition-play');
  const expResult = document.getElementById('expedition-result');

  const navLanding = document.getElementById('nav-landing');
  const navExpedition = document.getElementById('nav-expedition');
  const navCampaign = document.getElementById('nav-campaign');

  const allScreens = [screenLanding, screenExpedition, screenCampaign];
  const allNavs = [navLanding, navExpedition, navCampaign];

  let currentCampaignLevelId = null;
  let campaignLevelStartTime = 0;

  function showScreen(screen) {
    allScreens.forEach(s => s && s.classList.remove('active'));
    allNavs.forEach(n => n && n.classList.remove('active'));

    if (screen === AppScreen.LANDING) {
      screenLanding.classList.add('active');
      navLanding.classList.add('active');
      requestAnimationFrame(repositionPortalHotspot);
    } else if (screen === AppScreen.CAMPAIGN) {
      screenCampaign.classList.add('active');
      navCampaign.classList.add('active');
      renderCampaignUI();
    } else if (screen === AppScreen.EXPEDITION_BRIEFING || screen === AppScreen.EXPEDITION_PLAY || screen === AppScreen.EXPEDITION_RESULT) {
      screenExpedition.classList.add('active');
      navExpedition.classList.add('active');

      expBriefing.style.display = 'none';
      expPlay.style.display = 'flex';
      expResult.style.display = screen === AppScreen.EXPEDITION_RESULT ? 'flex' : 'none';

      expPlay.style.flexDirection = 'column';
      if (!simpleGrid) {
        startSimpleMaze(simpleDifficulty);
      } else {
        requestAnimationFrame(() => {
          expRenderer.resize();
          expRenderer.render();
        });
      }
    }
  }

  const app = new AppMachine((screen) => showScreen(screen));

  // Expedition Controller
  const expCtrl = new ExpeditionController({
    onUpdate: (data) => updateExpeditionUI(data),
    onSound: (snd) => sound.play(snd),
  });

  // Theme Cycler Button
  const btnThemeCycle = document.getElementById('btn-theme-cycle');
  const themeIcon = document.getElementById('theme-icon');
  const themeName = document.getElementById('theme-name');

  function updateThemeButtonDisplay(themeId) {
    const spec = THEME_SPECS.find(s => s.id === themeId) || THEME_SPECS[0];
    if (themeIcon) themeIcon.textContent = spec.icon;
    if (themeName) themeName.textContent = spec.name;
  }
  updateThemeButtonDisplay(currentTheme);

  if (btnThemeCycle) {
    btnThemeCycle.addEventListener('click', () => {
      sound.play('click');
      const next = cycleTheme();
      updateThemeButtonDisplay(next);
      applyThemeToRenderers(next);
    });
  }

  // Audio Toggle Button
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  let soundEnabled = true;

  if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      sound.setEnabled(soundEnabled);
      if (soundIcon) soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
      sound.play('click');
    });
  }

  // Navigation Links
  const brandHomeBtn = document.getElementById('brand-home-btn');
  if (brandHomeBtn) {
    brandHomeBtn.addEventListener('click', () => {
      sound.play('click');
      app.toLanding();
      if (bgAnimator) {
        bgAnimator.triggerEntrancePortal();
      }
    });
  }

  navLanding.addEventListener('click', () => {
    sound.play('click');
    app.toLanding();
  });

  navExpedition.addEventListener('click', () => {
    sound.play('click');
    app.transition(AppScreen.EXPEDITION_PLAY);
    if (!simpleGrid) {
      startSimpleMaze(simpleDifficulty);
    } else {
      expRenderer.resize();
      expRenderer.render();
    }
  });

  navCampaign.addEventListener('click', () => {
    sound.play('click');
    app.toCampaign();
  });

  // -------------------------------------------------------------
  // Fantasy Landing Page Hero & Interactive Portal
  // -------------------------------------------------------------
  const btnEnterWorldMain = document.getElementById('btn-enter-world-main');
  const portalHotspot = document.getElementById('portal-hotspot');
  const btnBeginTrial = document.getElementById('btn-begin-trial');
  const btnOpenQuestMap = document.getElementById('btn-open-quest-map');
  const linkExploreLabyrinth = document.getElementById('link-explore-labyrinth');

  function triggerPortalTransitionAndEnter() {
    sound.play('win');
    const overlay = document.getElementById('portal-transition-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.classList.remove('fade-out');
      overlay.classList.add('active');

      setTimeout(() => {
        app.transition(AppScreen.EXPEDITION_PLAY);
        if (!simpleGrid) {
          startSimpleMaze(simpleDifficulty);
        } else {
          requestAnimationFrame(() => {
            expRenderer.resize();
            expRenderer.render();
          });
        }
        overlay.classList.add('fade-out');
        setTimeout(() => {
          overlay.classList.remove('active', 'fade-out');
          overlay.style.display = 'none';
        }, 550);
      }, 650);
    } else {
      app.transition(AppScreen.EXPEDITION_PLAY);
      if (!simpleGrid) {
        startSimpleMaze(simpleDifficulty);
      } else {
        requestAnimationFrame(() => {
          expRenderer.resize();
          expRenderer.render();
        });
      }
    }
  }

  // Primary CTA click & hover
  if (btnEnterWorldMain) {
    btnEnterWorldMain.addEventListener('click', () => {
      triggerPortalTransitionAndEnter();
    });

    if (portalHotspot) {
      btnEnterWorldMain.addEventListener('mouseenter', () => {
        portalHotspot.classList.add('cta-hovered');
      });
      btnEnterWorldMain.addEventListener('mouseleave', () => {
        portalHotspot.classList.remove('cta-hovered');
      });
      btnEnterWorldMain.addEventListener('focus', () => {
        portalHotspot.classList.add('cta-hovered');
      });
      btnEnterWorldMain.addEventListener('blur', () => {
        portalHotspot.classList.remove('cta-hovered');
      });
    }
  }

  // Portal Hotspot direct click
  if (portalHotspot) {
    portalHotspot.addEventListener('click', () => {
      triggerPortalTransitionAndEnter();
    });
    portalHotspot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerPortalTransitionAndEnter();
      }
    });
  }

  // Section 2 scroll link
  if (linkExploreLabyrinth) {
    linkExploreLabyrinth.addEventListener('click', (e) => {
      e.preventDefault();
      sound.play('click');
      const targetSec = document.getElementById('section-labyrinth');
      if (targetSec) {
        targetSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Section 3 CTA buttons
  if (btnBeginTrial) {
    btnBeginTrial.addEventListener('click', () => {
      triggerPortalTransitionAndEnter();
    });
  }

  if (btnOpenQuestMap) {
    btnOpenQuestMap.addEventListener('click', () => {
      sound.play('click');
      app.toCampaign();
    });
  }

  // -------------------------------------------------------------
  // Precise Portal Hotspot Positioning (Locked to Artwork Vortex)
  // -------------------------------------------------------------
  function repositionPortalHotspot() {
    const gateway = document.getElementById('section-gateway');
    const hotspot = document.getElementById('portal-hotspot');
    if (!gateway || !hotspot) return;

    const w = gateway.clientWidth;
    const h = gateway.clientHeight;
    if (!w || !h) return;

    // Exact geometric center of the circular portal opening in portal_realm.jpg (1024 x 576):
    // Horizontal center: 713 / 1024 = 69.6289%
    // Vertical center: 280 / 576 = 48.6111%
    // Inner circular aperture diameter: 230px in 1024x576 resolution
    const normX = 713 / 1024;
    const normY = 280 / 576;

    // Responsive scaling matching background-size: cover
    const scale = Math.max(w / 1024, h / 576);
    const diameter = Math.round(230 * scale);

    // With background-position: 69.63% 48.61%, the target on screen is locked at (w * normX, h * normY)
    const portalX = w * normX;
    const portalY = h * normY;

    hotspot.style.left = `${portalX.toFixed(2)}px`;
    hotspot.style.top = `${portalY.toFixed(2)}px`;
    hotspot.style.width = `${diameter}px`;
    hotspot.style.height = `${diameter}px`;
    hotspot.style.right = 'auto';
    hotspot.style.bottom = 'auto';
  }

  window.addEventListener('resize', repositionPortalHotspot);
  window.addEventListener('orientationchange', repositionPortalHotspot);
  requestAnimationFrame(repositionPortalHotspot);
  setTimeout(repositionPortalHotspot, 100);

  // Mini Animated Preview on Landing Page
  function startHeroMiniMaze() {
    const previewCanvas = document.getElementById('canvas-hero-preview');
    if (!previewCanvas) return;
    const ctx = previewCanvas.getContext('2d');
    const size = 11;
    const grid = new Grid(size, size, true);
    const rng = new Rng('hero_mini_preview');
    drain(getGenerator('bkt').generate(grid, rng));

    const cp = 24;
    const m = 8;
    previewCanvas.width = size * cp + m * 2;
    previewCanvas.height = size * cp + m * 2;

    let scoutStep = 0;
    const path = [];
    let curr = grid.start;
    const visited = new Set([curr]);
    path.push(curr);

    // Simple DFS path finding to goal
    const stack = [[curr, [curr]]];
    const nBuf = new Int32Array(4);
    let solutionPath = [grid.start, grid.end];

    while (stack.length > 0) {
      const [topCell, curPath] = stack.pop();
      if (topCell === grid.end) {
        solutionPath = curPath;
        break;
      }
      const count = grid.openNeighbors(topCell, nBuf);
      for (let i = 0; i < count; i++) {
        const nb = nBuf[i];
        if (!visited.has(nb)) {
          visited.add(nb);
          stack.push([nb, [...curPath, nb]]);
        }
      }
    }

    let frame = 0;
    function renderPreview() {
      ctx.fillStyle = '#0f1416';
      ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

      // Walls
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const i = r * size + c;
          const x = m + c * cp;
          const y = m + r * cp;
          const w = grid.walls[i];
          if (w & Wall.N) { ctx.moveTo(x, y); ctx.lineTo(x + cp, y); }
          if (w & Wall.W) { ctx.moveTo(x, y); ctx.lineTo(x, y + cp); }
          if (r === size - 1 && (w & Wall.S)) { ctx.moveTo(x, y + cp); ctx.lineTo(x + cp, y + cp); }
          if (c === size - 1 && (w & Wall.E)) { ctx.moveTo(x + cp, y); ctx.lineTo(x + cp, y + cp); }
        }
      }
      ctx.stroke();

      // Golden Star at exit
      const endX = m + (grid.colOf(grid.end) + 0.5) * cp;
      const endY = m + (grid.rowOf(grid.end) + 0.5) * cp;
      ctx.fillStyle = '#facc15';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', endX, endY);

      // Solved trace
      const pathIdx = Math.min(solutionPath.length - 1, Math.floor(frame / 6) % (solutionPath.length + 15));
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= pathIdx; i++) {
        const cIdx = solutionPath[i];
        const px = m + (grid.colOf(cIdx) + 0.5) * cp;
        const py = m + (grid.rowOf(cIdx) + 0.5) * cp;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Glowing dot
      if (pathIdx < solutionPath.length) {
        const headCell = solutionPath[pathIdx];
        const hx = m + (grid.colOf(headCell) + 0.5) * cp;
        const hy = m + (grid.rowOf(headCell) + 0.5) * cp;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(hx, hy, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      frame++;
      requestAnimationFrame(renderPreview);
    }
    requestAnimationFrame(renderPreview);
  }
  startHeroMiniMaze();

  // -------------------------------------------------------------
  // World Quest Campaign Logic
  // -------------------------------------------------------------
  const campWorldsContainer = document.getElementById('campaign-worlds-container');
  const campConqueredVal = document.getElementById('camp-conquered-val');
  const campStarsVal = document.getElementById('camp-stars-val');
  const btnCampReset = document.getElementById('btn-camp-reset');

  function renderCampaignUI() {
    if (!campWorldsContainer) return;
    const completed = campaignStore.completedCount;
    const total = campaignStore.totalLevels;
    const stars = campaignStore.totalStars;
    const pct = Math.round((completed / total) * 100);

    campConqueredVal.textContent = `${completed} / ${total} (${pct}%)`;
    campStarsVal.textContent = `${stars} ⭐`;

    let html = '';
    for (const world of CAMPAIGN_WORLDS) {
      html += `
        <div class="world-island-card">
          <div class="world-island-header">
            <span class="world-island-icon">${world.icon}</span>
            <div>
              <h3 class="world-island-title">${world.name}</h3>
              <p class="world-island-desc">${world.desc}</p>
            </div>
          </div>
          <div class="levels-track-row">
      `;

      for (const lvl of world.levels) {
        const unlocked = campaignStore.isUnlocked(lvl.id);
        const record = campaignStore.getLevelRecord(lvl.id);
        const earnedStars = record ? record.stars : 0;
        let starStr = '☆☆☆';
        if (earnedStars === 3) starStr = '⭐⭐⭐';
        else if (earnedStars === 2) starStr = '⭐⭐☆';
        else if (earnedStars === 1) starStr = '⭐☆☆';

        html += `
          <div class="level-stage-card ${unlocked ? 'unlocked' : 'locked'}" data-level-id="${lvl.id}">
            <div class="lvl-top-row">
              <span class="lvl-num-badge">LEVEL ${lvl.id}</span>
              <span class="lvl-stars">${unlocked ? starStr : '🔒'}</span>
            </div>
            <h4 class="lvl-name">${lvl.name}</h4>
            <div class="lvl-info">Size: ${lvl.size} • Par: ${lvl.parTime}s</div>
            <button class="lvl-btn ${unlocked ? '' : 'disabled'}" type="button" ${unlocked ? '' : 'disabled'}>
              ${unlocked ? (record ? 'REPLAY ➔' : 'START ➔') : 'LOCKED 🔒'}
            </button>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    }

    campWorldsContainer.innerHTML = html;

    // Attach level card click handlers
    campWorldsContainer.querySelectorAll('.level-stage-card.unlocked').forEach(card => {
      card.addEventListener('click', () => {
        const lvlId = parseInt(card.dataset.levelId, 10);
        const lvl = campaignStore.findLevel(lvlId);
        if (lvl) {
          sound.play('click');
          app.transition(AppScreen.EXPEDITION_PLAY);
          startCampaignLevel(lvlId);
        }
      });
    });
  }

  function startCampaignLevel(lvlId) {
    const lvl = campaignStore.findLevel(lvlId);
    if (!lvl) return;

    hideMazeVictoryModal();
    if (simpleSolveTimer) {
      clearInterval(simpleSolveTimer);
      simpleSolveTimer = null;
    }

    currentCampaignLevelId = lvlId;
    campaignLevelStartTime = performance.now();
    simpleWon = false;
    simpleSolving = false;
    simpleSteps = 0;
    if (playStepsCounter) playStepsCounter.textContent = '0';

    // Build the authentic level maze from its pipeline code
    const buildResult = buildMaze(lvl.code);
    simpleGrid = buildResult.grid;
    simpleScout = simpleGrid.start;
    simpleHeading = Wall.E;

    // Show Quest Map back button
    const btnBackToCampaign = document.getElementById('btn-back-to-campaign');
    if (btnBackToCampaign) btnBackToCampaign.style.display = 'inline-block';

    // Deselect difficulty pills when in campaign mode
    document.querySelectorAll('.sp-diff-btn, .sp-size-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Render on classic canvas
    expRenderer.setGrid(simpleGrid);
    expRenderer.clearSolution();
    expRenderer.resetPlayer();
    expRenderer.resize();
    expRenderer.render();

    // Set banner info
    if (mazeGuideBanner) {
      mazeGuideBanner.className = 'maze-guide-banner';
      if (guideIcon) guideIcon.textContent = '🗺️';
      if (guideText) {
        guideText.innerHTML = `<strong>LEVEL ${lvl.id}: ${lvl.name.toUpperCase()} (${lvl.size})</strong> • Par Time: <strong>${lvl.parTime}s</strong>. Reach the exit to earn ⭐⭐⭐!`;
      }
    }
  }

  if (btnCampReset) {
    btnCampReset.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset your adventure quest progress back to Level 1?')) {
        campaignStore.reset();
        sound.play('click');
        renderCampaignUI();
      }
    });
  }



  // -------------------------------------------------------------
  // Solo Expedition UI & Interactions
  // -------------------------------------------------------------
  const inputExpCode = document.getElementById('input-expedition-code');
  const btnStartExpedition = document.getElementById('btn-start-expedition');
  const btnDaily = document.getElementById('btn-daily');
  const btnNewCode = document.getElementById('btn-new-code');
  const diffButtons = document.querySelectorAll('.diff-btn');

  let activeDifficulty = 'srv';

  function applyDifficulty(diffKey) {
    activeDifficulty = diffKey;
    diffButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.diff === diffKey);
    });

    const diffSpec = DIFFICULTIES[diffKey] || DIFFICULTIES.srv;
    const seed = randomSeed();
    const code = formatCode({
      rows: diffSpec.rows,
      cols: diffSpec.cols,
      generator: 'bkt',
      seed,
      braidPct: diffSpec.braidPct,
      terrainPct: diffSpec.terrainPct,
      difficulty: diffKey,
    });
    inputExpCode.value = code;
    loadExpeditionCode(code);
  }

  function loadExpeditionCode(code) {
    try {
      expCtrl.load(code);
      document.getElementById('brief-budget').textContent = `${expCtrl.budget} STEPS`;
      document.getElementById('brief-radius').textContent = `${expCtrl.baseLanternRadius} SPACES`;
      document.getElementById('brief-relics').textContent = `${expCtrl.relics.length} TREASURES`;
      document.getElementById('brief-phantoms').textContent = expCtrl.phantoms.map(p => p.name).join(', ') || 'NONE';
    } catch (err) {
      console.error('Failed to load code:', err);
    }
  }

  diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.play('click');
      applyDifficulty(btn.dataset.diff);
    });
  });

  btnDaily.addEventListener('click', () => {
    sound.play('click');
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const diffSpec = DIFFICULTIES[activeDifficulty] || DIFFICULTIES.srv;
    const code = formatCode({
      rows: diffSpec.rows,
      cols: diffSpec.cols,
      generator: 'bkt',
      seed: `DAY_${today}`,
      braidPct: diffSpec.braidPct,
      terrainPct: diffSpec.terrainPct,
      difficulty: activeDifficulty,
    });
    inputExpCode.value = code;
    loadExpeditionCode(code);
  });

  btnNewCode.addEventListener('click', () => {
    sound.play('click');
    const diffSpec = DIFFICULTIES[activeDifficulty] || DIFFICULTIES.srv;
    const code = formatCode({
      rows: diffSpec.rows,
      cols: diffSpec.cols,
      generator: 'bkt',
      seed: randomSeed(),
      braidPct: diffSpec.braidPct,
      terrainPct: diffSpec.terrainPct,
      difficulty: activeDifficulty,
    });
    inputExpCode.value = code;
    loadExpeditionCode(code);
  });

  inputExpCode.addEventListener('change', () => {
    loadExpeditionCode(inputExpCode.value.trim());
  });

  btnStartExpedition.addEventListener('click', () => {
    sound.play('click');
    const code = inputExpCode.value.trim() || 'v1/31x31/bkt/7K3Q9M2D/b20/t15/srv';
    if (expCtrl.state !== ExpeditionState.BRIEFING) {
      loadExpeditionCode(code);
    }
    expRenderer.setGrid(expCtrl.grid);
    expRenderer.setEntities({ phantoms: expCtrl.phantoms, relics: expCtrl.relics });
    app.transition(AppScreen.EXPEDITION_PLAY);
    expRenderer.resize();
    expRenderer.render();
    expCtrl.start();
  });

  // HUD Elements
  const hudStaminaDigits = document.getElementById('hud-stamina-digits');
  const hudStaminaBar = document.getElementById('hud-stamina-bar');
  const hudLanternVal = document.getElementById('hud-lantern-val');
  const hudRelicsVal = document.getElementById('hud-relics-val');
  const hudTicksVal = document.getElementById('hud-ticks-val');
  const hudTimeVal = document.getElementById('hud-time-val');
  const raceStripLanes = document.getElementById('race-strip-lanes');

  function updateExpeditionUI(data) {
    if (!data) return;

    // Stamina Gauge
    const rem = data.remainingStamina;
    if (hudStaminaDigits) {
      hudStaminaDigits.textContent = `${String(rem).padStart(3, '0')} / ${String(data.budget).padStart(3, '0')}`;
    }
    const pct = data.budget > 0 ? (rem / data.budget) * 100 : 0;
    if (hudStaminaBar) {
      hudStaminaBar.style.width = `${pct}%`;
      hudStaminaBar.classList.toggle('low', pct < 25);
    }

    if (hudLanternVal) hudLanternVal.textContent = `${data.lanternRadius} R${data.oilActive ? ' [OIL]' : ''}`;
    const totalGems = (data.relicsCollected || 0) + (data.relics ? data.relics.length : 0);
    if (hudRelicsVal) hudRelicsVal.textContent = `${data.relicsCollected || 0} / ${totalGems} GEMS`;
    if (hudTicksVal) hudTicksVal.textContent = String(data.ticks).padStart(5, '0');

    // Wall Clock
    const s = Math.floor(data.elapsedSeconds);
    const ms = Math.floor((data.elapsedSeconds - s) * 10);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    if (hudTimeVal) hudTimeVal.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;

    // Update Renderer
    if (expCtrl.grid) {
      expRenderer.setFog(data.fog);
      expRenderer.setScout(data.scoutCell, data.heading);
      expRenderer.setEntities({ phantoms: data.phantoms, relics: data.relics });
    }

    // Race Strip
    renderRaceStrip(data);

    // If game resolved
    if (data.state === ExpeditionState.WON || data.state === ExpeditionState.LOST) {
      showExpeditionResult(data);
    }
  }

  function renderRaceStrip(data) {
    if (!raceStripLanes) return;
    const maxTick = Math.max(data.ticks, ...data.phantoms.map(p => (isFinite(p.finishTick) ? p.finishTick : 100)), 50);

    let html = `
      <div class="race-lane">
        <span class="race-lane-name" style="color: var(--brass);">SCOUT (YOU)</span>
        <div class="race-lane-bar-wrap">
          <div class="race-lane-bar" style="width: ${Math.min(100, (data.ticks / maxTick) * 100)}%; background: #e5a93b;"></div>
        </div>
      </div>
    `;

    for (const p of data.phantoms) {
      const isFin = isFinite(p.finishTick);
      const curTick = isFin ? Math.min(data.ticks, p.finishTick) : data.ticks * 0.8;
      const pct = Math.min(100, (curTick / maxTick) * 100);
      const col = p.colorTerminal || '#38bdf8';
      html += `
        <div class="race-lane">
          <span class="race-lane-name" style="color: ${col};">${p.name.toUpperCase()}</span>
          <div class="race-lane-bar-wrap">
            <div class="race-lane-bar" style="width: ${pct}%; background: ${col};"></div>
          </div>
        </div>
      `;
    }

    raceStripLanes.innerHTML = html;
  }

  // Result Handling
  function showExpeditionResult(data) {
    app.toExpeditionResult(data.scoreReport);

    const won = data.state === ExpeditionState.WON;
    const tag = document.getElementById('result-status-tag');
    const title = document.getElementById('result-outcome-title');
    const gradeChar = document.getElementById('result-grade-char');
    const totalScore = document.getElementById('result-total-score');

    tag.textContent = won ? '🎉 MISSION ACCOMPLISHED!' : '⚠️ OUT OF ENERGY / DEFEATED';
    title.textContent = won ? 'EXPEDITION COMPLETE!' : 'ADVENTURE FAILED';
    title.style.color = won ? 'var(--brass)' : 'var(--danger)';

    const rep = data.scoreReport;
    if (rep) {
      gradeChar.textContent = rep.grade;
      totalScore.textContent = rep.total;

      document.getElementById('res-stat-e').textContent = (rep.breakdown?.E ?? 0).toFixed(2);
      document.getElementById('res-stat-t').textContent = (rep.breakdown?.T ?? 0).toFixed(2);
      document.getElementById('res-stat-x').textContent = (rep.breakdown?.X ?? 0).toFixed(2);
      document.getElementById('res-stat-base').textContent = rep.breakdown?.base ?? 0;
      document.getElementById('res-stat-mult').textContent = `x ${(rep.breakdown?.M ?? 1).toFixed(1)}`;
      document.getElementById('res-stat-relics').textContent = `+ ${rep.breakdown?.relics ?? 0}`;
      document.getElementById('res-stat-phantoms').textContent = `+ ${rep.breakdown?.phantoms ?? 0}`;

      // Record to campaign store if this was a campaign level
      if (won && currentCampaignLevelId !== null) {
        campaignStore.recordLevelCompletion(currentCampaignLevelId, rep.total, data.elapsedSeconds);
      }
    }
  }

  // -------------------------------------------------------------
  // Simple Maze Player & Auto-Solver (15x15 with Easy, Medium, Hard Difficulties)
  // -------------------------------------------------------------
  let simpleGrid = null;
  let simpleScout = -1;
  let simpleHeading = Wall.E;
  let simpleSteps = 0;
  let simpleDifficulty = 'easy'; // 'easy', 'medium', or 'hard'
  const SIMPLE_MAZE_SIZE = 15; // Strictly locked to 15x15
  let simpleSolving = false;
  let simpleSolveTimer = null;
  let simpleWon = false;

  const btnGenerateMaze = document.getElementById('btn-generate-maze');
  const btnSolveMaze = document.getElementById('btn-solve-maze');
  const selectSolveAlgo = document.getElementById('select-solve-algo');
  const btnRetryMaze = document.getElementById('btn-retry-maze');
  const playStepsCounter = document.getElementById('play-steps-counter');
  const mazeGuideBanner = document.getElementById('maze-guide-banner');
  const guideIcon = document.getElementById('guide-icon');
  const guideText = document.getElementById('guide-text');
  const btnHomeFromPlay = document.getElementById('btn-home-from-play');

  // Maze Victory / Game Completed Modal Elements
  const mazeVictoryOverlay = document.getElementById('maze-victory-overlay');
  const btnVictoryClose = document.getElementById('btn-victory-close');
  const btnVictoryNew = document.getElementById('btn-victory-new');
  const btnVictoryRetry = document.getElementById('btn-victory-retry');
  const btnVictoryInspect = document.getElementById('btn-victory-inspect');
  const victoryBadge = document.getElementById('victory-badge');
  const victoryModalTitle = document.getElementById('victory-modal-title');
  const victoryModalDesc = document.getElementById('victory-modal-desc');
  const victoryStatSteps = document.getElementById('victory-stat-steps');
  const victoryStatDiff = document.getElementById('victory-stat-diff');
  const victoryStatRating = document.getElementById('victory-stat-rating');
  const victoryConfettiCanvas = document.getElementById('victory-confetti-canvas');

  let confettiAnimId = null;

  function launchVictoryConfetti() {
    if (!victoryConfettiCanvas) return;
    const canvas = victoryConfettiCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement || canvas;
    canvas.width = parent.clientWidth || 450;
    canvas.height = parent.clientHeight || 450;

    const colors = ['#f59e0b', '#facc15', '#38bdf8', '#34d399', '#f43f5e', '#a855f7', '#ffffff'];
    const particles = [];
    const count = 75;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width * 0.5 + (Math.random() - 0.5) * 80,
        y: canvas.height * 0.42 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 9 - 4,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        opacity: 1,
        drag: 0.96,
        gravity: 0.28,
      });
    }

    if (confettiAnimId) cancelAnimationFrame(confettiAnimId);

    let frames = 0;
    function renderConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of particles) {
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        if (frames > 40) {
          p.opacity -= 0.015;
        }

        if (p.opacity > 0 && p.y < canvas.height + 20) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }

      frames++;
      if (alive && frames < 180) {
        confettiAnimId = requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettiAnimId = null;
      }
    }

    confettiAnimId = requestAnimationFrame(renderConfetti);
  }

  function stopVictoryConfetti() {
    if (confettiAnimId) {
      cancelAnimationFrame(confettiAnimId);
      confettiAnimId = null;
    }
    if (victoryConfettiCanvas) {
      const ctx = victoryConfettiCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, victoryConfettiCanvas.width, victoryConfettiCanvas.height);
    }
  }

  function showMazeVictoryModal(options = {}) {
    if (!mazeVictoryOverlay) return;
    const isCampaign = options.type === 'campaign';
    const isPlayer = options.type === 'player';
    const diffUpper = (options.difficulty || simpleDifficulty || 'EASY').toUpperCase();

    const btnVictoryCampaign = document.getElementById('btn-victory-campaign');
    if (btnVictoryCampaign) {
      btnVictoryCampaign.style.display = isCampaign ? 'inline-block' : 'none';
    }

    if (isCampaign) {
      const lvl = campaignStore.findLevel(options.levelId);
      const lvlName = lvl ? lvl.name : `Level ${options.levelId}`;
      if (victoryBadge) victoryBadge.textContent = `🌟 STAGE ${options.levelId} CONQUERED`;
      if (victoryModalTitle) victoryModalTitle.textContent = `${lvlName.toUpperCase()} CLEARED!`;
      if (victoryModalDesc) {
        victoryModalDesc.innerHTML = `Sensational! You conquered <strong>${lvlName}</strong> in <strong>${options.steps} steps</strong> and <strong>${options.time}s</strong> (Par: ${options.parTime}s)! ⭐ Rating: <strong>${options.stars}</strong>`;
      }
      if (victoryStatSteps) victoryStatSteps.textContent = String(options.steps || 0);
      if (victoryStatDiff) victoryStatDiff.textContent = `PAR ${options.parTime}s`;
      if (victoryStatRating) victoryStatRating.textContent = options.stars || '⭐⭐⭐';
      if (btnVictoryNew) btnVictoryNew.textContent = 'NEXT LEVEL ▶';
    } else if (isPlayer) {
      if (btnVictoryNew) btnVictoryNew.textContent = '🎲 NEW MAZE';
      if (victoryBadge) victoryBadge.textContent = '🏆 GOAL REACHED';
      if (victoryModalTitle) victoryModalTitle.textContent = 'GAME COMPLETED!';
      if (victoryModalDesc) {
        victoryModalDesc.innerHTML = `Magnificent! You successfully navigated through the <strong>${diffUpper}</strong> maze and reached the goal in <strong>${options.steps} steps</strong>!`;
      }
      if (victoryStatSteps) victoryStatSteps.textContent = String(options.steps || 0);
      if (victoryStatDiff) victoryStatDiff.textContent = diffUpper;
      if (victoryStatRating) victoryStatRating.textContent = 'VICTORY 🥇';
    } else {
      if (btnVictoryNew) btnVictoryNew.textContent = '🎲 NEW MAZE';
      if (victoryBadge) victoryBadge.textContent = '🤖 MAZE SOLVED';
      if (victoryModalTitle) victoryModalTitle.textContent = 'MAZE SOLVED!';
      const algo = options.algoName || 'Algorithm';
      if (victoryModalDesc) {
        victoryModalDesc.innerHTML = `<strong>${algo}</strong> successfully computed the optimal path of <strong>${options.steps} steps</strong> after exploring ${options.explored || 0} cells!`;
      }
      if (victoryStatSteps) victoryStatSteps.textContent = String(options.steps || 0);
      if (victoryStatDiff) victoryStatDiff.textContent = diffUpper;
      if (victoryStatRating) victoryStatRating.textContent = 'OPTIMAL 🎯';
    }

    mazeVictoryOverlay.style.display = 'flex';
    sound.play('win');
    launchVictoryConfetti();
  }

  function hideMazeVictoryModal() {
    if (!mazeVictoryOverlay) return;
    mazeVictoryOverlay.style.display = 'none';
    stopVictoryConfetti();
  }

  /**
   * Generates a 15x15 maze where difficulty controls the number of confusing choices,
   * forks, deceptive branches, and loops the player encounters.
   */
  function generateDifficultyMaze(difficulty, rng) {
    const size = SIMPLE_MAZE_SIZE;
    const grid = new Grid(size, size, true);
    grid.start = 0;
    grid.end = size * size - 1;

    if (difficulty === 'easy') {
      // 🟢 EASY (15x15):
      // Clean, straightforward path using Recursive Backtracker.
      // Has fewer forks (6-10 junctions on path) with short, obvious dead ends (2-4 steps).
      drain(getGenerator('bkt').generate(grid, rng));
      // Give the player an immediate choice right at entrance (cell 0): East (1) or South (15)
      if (grid.hasWall(0, Wall.E) || grid.hasWall(0, Wall.S)) {
        const nb = grid.hasWall(0, Wall.E) ? 1 : 15;
        grid.carve(0, nb);
      }
    } else if (difficulty === 'medium') {
      // 🟡 MEDIUM (15x15):
      // Many more confusing forks using Kruskal's algorithm (~18-24 junctions on path).
      // 55+ total dead ends that branch deeper to tempt and confuse the player.
      drain(getGenerator('krk').generate(grid, rng));
      if (grid.hasWall(0, Wall.E) || grid.hasWall(0, Wall.S)) {
        const nb = grid.hasWall(0, Wall.E) ? 1 : 15;
        grid.carve(0, nb);
      }
      // 5% braid introduces subtle alternate pathways
      braid(grid, 5, rng);
    } else {
      // 🔴 HARD (15x15):
      // Maximum confusion! Prim's algorithm with dense branching (60+ junctions).
      // Forks at almost every turn, long deceptive dead ends that travel deep towards the exit,
      // plus 15% braiding to create tricky loops that deceive the player!
      drain(getGenerator('prm').generate(grid, rng));
      if (grid.hasWall(0, Wall.E) || grid.hasWall(0, Wall.S)) {
        const nb = grid.hasWall(0, Wall.E) ? 1 : 15;
        grid.carve(0, nb);
      }
      // 15% braid creates misleading cycles & loops
      braid(grid, 15, rng);
    }

    return grid;
  }

  function startSimpleMaze(difficulty = simpleDifficulty) {
    hideMazeVictoryModal();
    if (simpleSolveTimer) {
      clearInterval(simpleSolveTimer);
      simpleSolveTimer = null;
    }
    simpleDifficulty = difficulty;
    simpleWon = false;
    simpleSolving = false;
    simpleSteps = 0;
    if (playStepsCounter) playStepsCounter.textContent = '0';

    // Highlight active difficulty pill in UI
    document.querySelectorAll('.sp-diff-btn, .sp-size-btn').forEach(btn => {
      const bDiff = btn.dataset.diff || (btn.dataset.size === '10' ? 'easy' : (btn.dataset.size === '25' ? 'hard' : 'medium'));
      btn.classList.toggle('active', bDiff === difficulty);
    });

    // 1. Create fresh 15x15 procedural maze based on selected difficulty
    const rng = new Rng(randomSeed());
    const grid = generateDifficultyMaze(difficulty, rng);

    simpleGrid = grid;
    simpleScout = grid.start;
    simpleHeading = Wall.E;

    // 2. Configure Classic Renderer (100% visible, crisp walls, green & red arrows)
    expRenderer.setGrid(grid);
    expRenderer.clearSolution();
    expRenderer.resetPlayer();
    expRenderer.resize();
    expRenderer.render();

    // 3. Update Banner with clear difficulty description
    const diffDescriptions = {
      easy: '🟢 <strong>EASY (15×15):</strong> Simple path with few confusing branches. Can you find your way to the 🔴 Exit?',
      medium: '🟡 <strong>MEDIUM (15×15):</strong> Moderate confusion with more forks and deceptive dead ends!',
      hard: '🔴 <strong>HARD (15×15):</strong> High-confusion labyrinth! Deceptive paths and tricky loops everywhere!'
    };

    if (mazeGuideBanner) {
      mazeGuideBanner.className = 'maze-guide-banner';
      if (guideIcon) guideIcon.textContent = '👉';
      if (guideText) guideText.innerHTML = diffDescriptions[difficulty] || diffDescriptions.easy;
    }
  }

  function moveSimplePlayer(dirKey) {
    if (!simpleGrid || simpleSolving) return;
    if (simpleWon) return;

    let dir = Wall.E;
    if (dirKey === 'N') dir = Wall.N;
    else if (dirKey === 'E') dir = Wall.E;
    else if (dirKey === 'S') dir = Wall.S;
    else if (dirKey === 'W') dir = Wall.W;

    if (simpleGrid.hasWall(simpleScout, dir)) {
      sound.play('thud');
      return;
    }

    const nextCell = simpleGrid.neighbor(simpleScout, dir);
    if (nextCell < 0) return;

    simpleScout = nextCell;
    simpleHeading = dir;
    simpleSteps++;
    if (playStepsCounter) playStepsCounter.textContent = String(simpleSteps);

    expRenderer.setPlayer(simpleScout);
    sound.play('step');

    // Check if reached exit
    if (simpleScout === simpleGrid.end) {
      simpleWon = true;
      sound.play('win');

      if (currentCampaignLevelId !== null) {
        const elapsedSec = Math.max(1, Math.round((performance.now() - campaignLevelStartTime) / 100) / 10);
        const lvl = campaignStore.findLevel(currentCampaignLevelId);
        const parTime = lvl ? lvl.parTime : 30;

        // Base score calculation for campaign
        const score = Math.max(200, Math.round(1000 - Math.max(0, elapsedSec - parTime) * 20 - Math.max(0, simpleSteps - simpleGrid.size * 1.5) * 5));
        const rec = campaignStore.recordLevelCompletion(currentCampaignLevelId, score, elapsedSec);
        const starsNum = rec ? rec.stars : 1;
        const starStr = starsNum === 3 ? '⭐⭐⭐' : (starsNum === 2 ? '⭐⭐☆' : '⭐☆☆');

        if (mazeGuideBanner) {
          mazeGuideBanner.className = 'maze-guide-banner victory';
          if (guideIcon) guideIcon.textContent = '🌟';
          if (guideText) {
            guideText.innerHTML = `<strong>STAGE ${currentCampaignLevelId} CONQUERED!</strong> Cleared in <strong>${elapsedSec}s</strong> (${simpleSteps} steps) • Rating: <strong>${starStr}</strong>!`;
          }
        }

        setTimeout(() => {
          showMazeVictoryModal({
            type: 'campaign',
            levelId: currentCampaignLevelId,
            steps: simpleSteps,
            time: elapsedSec,
            parTime,
            stars: starStr,
          });
        }, 250);
      } else {
        if (mazeGuideBanner) {
          mazeGuideBanner.className = 'maze-guide-banner victory';
          if (guideIcon) guideIcon.textContent = '🎉';
          if (guideText) guideText.innerHTML = `<strong>CONGRATULATIONS!</strong> You reached the exit in <strong>${simpleSteps} steps</strong>! Click <strong>🎲 GENERATE MAZE</strong> to play again!`;
        }
        setTimeout(() => {
          showMazeVictoryModal({
            type: 'player',
            steps: simpleSteps,
            difficulty: simpleDifficulty,
          });
        }, 250);
      }
    }
  }

  function solveCurrentMaze() {
    if (!simpleGrid) return;
    if (simpleSolveTimer) {
      clearInterval(simpleSolveTimer);
      simpleSolveTimer = null;
    }
    simpleSolving = true;
    sound.play('click');

    const algoId = selectSolveAlgo ? selectSolveAlgo.value : 'bfs';
    const algoNames = {
      bfs: 'Breadth-First Search (BFS)',
      dfs: 'Depth-First Search (DFS)',
      wfl: 'Backtracking',
    };
    const algoName = algoNames[algoId] || 'Solver';

    // Clear previous search and paths
    expRenderer.clearSolution();

    if (mazeGuideBanner) {
      mazeGuideBanner.className = 'maze-guide-banner solving';
      if (guideIcon) guideIcon.textContent = '🤖';
      if (guideText) guideText.innerHTML = `Running <strong>${algoName}</strong>... Exploring maze corridors to find the exit!`;
    }

    let solver;
    try {
      solver = getSolver(algoId);
    } catch {
      solver = getSolver('bfs');
    }

    const iterator = solver.solve(simpleGrid, { weighted: false });
    const exploredCells = [];
    let exploredCount = 0;

    // Animate smoothly
    const stepsPerTick = simpleSize <= 15 ? 3 : (simpleSize <= 25 ? 6 : 12);

    simpleSolveTimer = setInterval(() => {
      let isDone = false;
      let finalResult = null;

      for (let s = 0; s < stepsPerTick; s++) {
        const res = iterator.next();
        if (res.done) {
          isDone = true;
          finalResult = res.value;
          break;
        }
        const step = res.value;
        if (step && typeof step.cell === 'number') {
          exploredCells.push(step.cell);
          exploredCount++;
        }
      }

      expRenderer.setSolution([], exploredCells);

      if (isDone) {
        clearInterval(simpleSolveTimer);
        simpleSolveTimer = null;
        simpleSolving = false;

        if (finalResult && finalResult.found && Array.isArray(finalResult.path)) {
          // Draw the red solution path like Image 2!
          expRenderer.setSolution(finalResult.path, exploredCells);
          sound.play('relic');

          if (mazeGuideBanner) {
            mazeGuideBanner.className = 'maze-guide-banner solved';
            if (guideIcon) guideIcon.textContent = '✨';
            if (guideText) guideText.innerHTML = `<strong>${algoName} Solution:</strong> Found path of <strong>${finalResult.path.length} steps</strong> (explored ${exploredCount} cells). Red solution path revealed! Click <strong>↺ RETRY</strong> to walk it yourself!`;
          }

          setTimeout(() => {
            showMazeVictoryModal({
              type: 'solver',
              algoName,
              steps: finalResult.path.length,
              explored: exploredCount,
              difficulty: simpleDifficulty,
            });
          }, 450);
        }
      }
    }, 20);
  }

  function retryCurrentMaze() {
    hideMazeVictoryModal();
    if (!simpleGrid) return;
    if (simpleSolveTimer) {
      clearInterval(simpleSolveTimer);
      simpleSolveTimer = null;
    }
    simpleSolving = false;
    simpleWon = false;
    simpleScout = simpleGrid.start;
    simpleHeading = Wall.E;
    simpleSteps = 0;
    if (playStepsCounter) playStepsCounter.textContent = '0';

    if (currentCampaignLevelId !== null) {
      campaignLevelStartTime = performance.now();
    }

    expRenderer.resetPlayer();
    expRenderer.clearSolution();

    sound.play('click');
    if (mazeGuideBanner) {
      mazeGuideBanner.className = 'maze-guide-banner';
      if (guideIcon) guideIcon.textContent = '👉';
      if (guideText) guideText.innerHTML = 'Reset! Use <strong>Arrow Keys</strong> or <strong>WASD</strong> to reach the 🔴 Red Exit. Good luck!';
    }
  }

  // Victory Modal Button wiring
  if (btnVictoryClose) {
    btnVictoryClose.addEventListener('click', () => {
      sound.play('click');
      hideMazeVictoryModal();
    });
  }

  if (btnVictoryInspect) {
    btnVictoryInspect.addEventListener('click', () => {
      sound.play('click');
      hideMazeVictoryModal();
    });
  }

  if (btnVictoryRetry) {
    btnVictoryRetry.addEventListener('click', () => {
      hideMazeVictoryModal();
      retryCurrentMaze();
    });
  }

  if (btnVictoryNew) {
    btnVictoryNew.addEventListener('click', () => {
      hideMazeVictoryModal();
      if (currentCampaignLevelId !== null) {
        const nextId = currentCampaignLevelId + 1;
        if (nextId <= campaignStore.totalLevels) {
          startCampaignLevel(nextId);
        } else {
          app.toCampaign();
        }
      } else {
        startSimpleMaze(simpleDifficulty);
      }
    });
  }

  const btnVictoryCampaign = document.getElementById('btn-victory-campaign');
  if (btnVictoryCampaign) {
    btnVictoryCampaign.addEventListener('click', () => {
      sound.play('click');
      hideMazeVictoryModal();
      app.toCampaign();
    });
  }

  const btnBackToCampaign = document.getElementById('btn-back-to-campaign');
  if (btnBackToCampaign) {
    btnBackToCampaign.addEventListener('click', () => {
      sound.play('click');
      hideMazeVictoryModal();
      app.toCampaign();
    });
  }

  // Buttons wiring
  if (btnGenerateMaze) {
    btnGenerateMaze.addEventListener('click', () => {
      sound.play('click');
      currentCampaignLevelId = null;
      if (btnBackToCampaign) btnBackToCampaign.style.display = 'none';
      startSimpleMaze(simpleDifficulty);
    });
  }

  if (btnSolveMaze) {
    btnSolveMaze.addEventListener('click', () => solveCurrentMaze());
  }

  if (btnRetryMaze) {
    btnRetryMaze.addEventListener('click', () => retryCurrentMaze());
  }

  if (btnHomeFromPlay) {
    btnHomeFromPlay.addEventListener('click', () => {
      sound.play('click');
      if (simpleSolveTimer) {
        clearInterval(simpleSolveTimer);
        simpleSolveTimer = null;
      }
      app.toLanding();
    });
  }

  // Difficulty buttons (15x15: Easy, Medium, Hard)
  document.querySelectorAll('.sp-diff-btn, .sp-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sp-diff-btn, .sp-size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const diff = btn.dataset.diff || (btn.dataset.size === '10' ? 'easy' : (btn.dataset.size === '25' ? 'hard' : 'medium'));
      sound.play('click');
      startSimpleMaze(diff);
    });
  });

  // Fallback handlers for legacy buttons
  const btnPauseExpedition = document.getElementById('btn-pause-expedition');
  if (btnPauseExpedition) {
    btnPauseExpedition.addEventListener('click', () => {
      sound.play('click');
      if (expCtrl.state === ExpeditionState.PLAYING) {
        expCtrl.pause();
        btnPauseExpedition.textContent = '▶ RESUME';
      } else if (expCtrl.state === ExpeditionState.PAUSED) {
        expCtrl.resume();
        btnPauseExpedition.textContent = '⏸️ PAUSE';
      }
    });
  }

  const btnAbandonExpedition = document.getElementById('btn-abandon-expedition');
  if (btnAbandonExpedition) {
    btnAbandonExpedition.addEventListener('click', () => {
      sound.play('thud');
      expCtrl.abandon();
    });
  }

  const btnResultReplay = document.getElementById('btn-result-replay');
  if (btnResultReplay) {
    btnResultReplay.addEventListener('click', () => {
      sound.play('click');
      loadExpeditionCode(expCtrl.code);
      app.transition(AppScreen.EXPEDITION_PLAY);
      expRenderer.setGrid(expCtrl.grid);
      expRenderer.setEntities({ phantoms: expCtrl.phantoms, relics: expCtrl.relics });
      expCtrl.start();
    });
  }

  const btnResultNew = document.getElementById('btn-result-new');
  if (btnResultNew) {
    btnResultNew.addEventListener('click', () => {
      sound.play('click');
      currentCampaignLevelId = null;
      app.transition(AppScreen.EXPEDITION_BRIEFING);
      applyDifficulty(activeDifficulty);
    });
  }

  const btnResultCampaign = document.getElementById('btn-result-campaign');
  if (btnResultCampaign) {
    btnResultCampaign.addEventListener('click', () => {
      sound.play('click');
      app.toCampaign();
    });
  }

  const btnResultExport = document.getElementById('btn-result-export');
  if (btnResultExport) {
    btnResultExport.addEventListener('click', () => {
      sound.play('click');
      const json = exportRunJson({
        code: expCtrl.code,
        moves: expCtrl.movesString,
        score: expCtrl.scoreReport,
      });
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `run_${Date.now()}.run.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const btnResultLab = document.getElementById('btn-result-lab');
  if (btnResultLab) {
    btnResultLab.addEventListener('click', () => {
      sound.play('click');
      app.toLab(expCtrl.code);
    });
  }

  // Global Keyboard Controls (WASD / Arrows for Simple Maze and 2-Player Duel)
  window.addEventListener('keydown', (e) => {
    // 0. Victory Modal active
    if (mazeVictoryOverlay && mazeVictoryOverlay.style.display !== 'none') {
      if (e.code === 'Escape') {
        e.preventDefault();
        hideMazeVictoryModal();
        return;
      }
      if (e.code === 'Enter') {
        e.preventDefault();
        hideMazeVictoryModal();
        startSimpleMaze(simpleDifficulty);
        return;
      }
    }


    // 2. Simple Maze Play Controls
    if (app.screen === AppScreen.EXPEDITION_PLAY) {
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'KeyK') {
        e.preventDefault();
        moveSimplePlayer('N');
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight' || e.code === 'KeyL') {
        e.preventDefault();
        moveSimplePlayer('E');
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown' || e.code === 'KeyJ') {
        e.preventDefault();
        moveSimplePlayer('S');
      } else if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.code === 'KeyH') {
        e.preventDefault();
        moveSimplePlayer('W');
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        retryCurrentMaze();
      } else if (e.code === 'KeyG') {
        e.preventDefault();
        startSimpleMaze(simpleDifficulty);
      }
    }
  });

  // Touch D-Pad for Mobile
  const dpadUp = document.getElementById('dpad-up');
  const dpadRight = document.getElementById('dpad-right');
  const dpadDown = document.getElementById('dpad-down');
  const dpadLeft = document.getElementById('dpad-left');
  if (dpadUp) dpadUp.addEventListener('click', () => moveSimplePlayer('N'));
  if (dpadRight) dpadRight.addEventListener('click', () => moveSimplePlayer('E'));
  if (dpadDown) dpadDown.addEventListener('click', () => moveSimplePlayer('S'));
  if (dpadLeft) dpadLeft.addEventListener('click', () => moveSimplePlayer('W'));

  // Window Resize Responsiveness
  window.addEventListener('resize', () => {
    if (app.screen === AppScreen.EXPEDITION_PLAY) {
      expRenderer.resize();
      expRenderer.render();
    }
  });
  // Initial Load: Landing Page Hero with Entering-the-Maze Portal Warp
  applyDifficulty('srv');
  app.toLanding();
  if (bgAnimator) {
    bgAnimator.triggerEntrancePortal();
  }

  // Expose global app for debugging & manual navigation
  if (typeof window !== 'undefined') {
    window.app = app;
    window.expCtrl = expCtrl;
  }
}

// Ensure initApp runs reliably whether script loads before or after DOMContentLoaded
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
  window.addEventListener('load', initApp);
}
