/**
 * @file main.js
 * Main entry point for Maze Explorer Quest.
 * Wires AppMachine, ExpeditionController, DuelController, LabController, CampaignStore, Renderers, and UI components.
 */

import { AppMachine, AppScreen } from './app/app_machine.js';
import { ExpeditionController, ExpeditionState } from './app/expedition_controller.js';
import { LabController } from './app/lab_controller.js';
import { DuelController, DuelState } from './app/duel_controller.js';
import { campaignStore, CAMPAIGN_WORLDS } from './app/campaign_store.js';
import { CanvasRenderer } from './ui/renderer/canvas_renderer.js';
import { ClassicMazeRenderer } from './ui/renderer/classic_renderer.js';
import { setTheme, cycleTheme, getStoredTheme, THEME_SPECS } from './ui/theme.js';
import { sound } from './ui/audio.js';
import { formatCode, parseCode, randomSeed } from './core/code.js';
import { DIFFICULTIES, RelicKind, Wall } from './core/constants.js';
import { verifyRun } from './app/run_verifier.js';
import { exportMazeJson, importMazeJson, exportRunJson } from './app/maze_io.js';
import { runBenchmark } from './app/benchmark_runner.js';
import { Grid } from './core/grid.js';
import { Rng } from './structures/rng.js';
import { getGenerator } from './core/generators/index.js';
import { getSolver } from './core/solvers/index.js';
import { drain } from './core/iter.js';
import { braid } from './core/braid.js';

// Import Custom Elements
import './ui/components/mech_toggle.js';
import './ui/components/detent_dial.js';
import './ui/components/transport_bar.js';
import './ui/components/coord_readout.js';

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
  const labCanvas = document.getElementById('canvas-lab');
  const duelCanvas = document.getElementById('canvas-duel');

  const expRenderer = new ClassicMazeRenderer(expCanvas);
  const labRenderer = new CanvasRenderer(labCanvas);
  const duelRenderer = new CanvasRenderer(duelCanvas);

  function applyThemeToRenderers(theme) {
    expRenderer.setTheme(theme);
    labRenderer.setTheme(theme);
    duelRenderer.setTheme(theme);
  }
  applyThemeToRenderers(currentTheme);

  // App Machine & Screen Routing
  const screenLanding = document.getElementById('screen-landing');
  const screenExpedition = document.getElementById('screen-expedition');
  const screenCampaign = document.getElementById('screen-campaign');
  const screenDuel = document.getElementById('screen-duel');
  const screenLab = document.getElementById('screen-lab');
  const screenBench = document.getElementById('screen-bench');

  const expBriefing = document.getElementById('expedition-briefing');
  const expPlay = document.getElementById('expedition-play');
  const expResult = document.getElementById('expedition-result');

  const navLanding = document.getElementById('nav-landing');
  const navExpedition = document.getElementById('nav-expedition');
  const navCampaign = document.getElementById('nav-campaign');
  const navDuel = document.getElementById('nav-duel');
  const navLab = document.getElementById('nav-lab');
  const navBench = document.getElementById('nav-bench');

  const allScreens = [screenLanding, screenExpedition, screenCampaign, screenDuel, screenLab, screenBench];
  const allNavs = [navLanding, navExpedition, navCampaign, navDuel, navLab, navBench];

  let currentCampaignLevelId = null;

  function showScreen(screen) {
    allScreens.forEach(s => s && s.classList.remove('active'));
    allNavs.forEach(n => n && n.classList.remove('active'));

    if (screen === AppScreen.LANDING) {
      screenLanding.classList.add('active');
      navLanding.classList.add('active');
    } else if (screen === AppScreen.CAMPAIGN) {
      screenCampaign.classList.add('active');
      navCampaign.classList.add('active');
      renderCampaignUI();
    } else if (screen === AppScreen.DUEL) {
      screenDuel.classList.add('active');
      navDuel.classList.add('active');
      initDuelGame();
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
        expRenderer.resize();
        expRenderer.render();
      }
    } else if (screen === AppScreen.LAB) {
      screenLab.classList.add('active');
      navLab.classList.add('active');
      labRenderer.resize();
      labRenderer.render();
    } else if (screen === AppScreen.BENCHMARK) {
      screenBench.classList.add('active');
      navBench.classList.add('active');
    }
  }

  const app = new AppMachine((screen) => showScreen(screen));

  // Expedition Controller
  const expCtrl = new ExpeditionController({
    onUpdate: (data) => updateExpeditionUI(data),
    onSound: (snd) => sound.play(snd),
  });

  // Lab Controller
  const labCtrl = new LabController({
    onUpdate: (data) => updateLabUI(data),
    onEvent: (evt) => handleLabEvent(evt),
    onSound: (snd) => sound.play(snd),
  });

  // Duel Controller
  const duelCtrl = new DuelController({
    onUpdate: (data) => updateDuelUI(data),
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

  navDuel.addEventListener('click', () => {
    sound.play('click');
    app.toDuel();
  });

  navLab.addEventListener('click', () => {
    sound.play('click');
    app.toLab();
  });

  navBench.addEventListener('click', () => {
    sound.play('click');
    app.toBenchmark();
  });

  // -------------------------------------------------------------
  // Landing Page Hero & Interactive Preview
  // -------------------------------------------------------------
  const btnHeroPlayInstant = document.getElementById('btn-hero-play-instant');
  const cardGoAdventure = document.getElementById('card-go-adventure');
  const cardGoCampaign = document.getElementById('card-go-campaign');
  const cardGoDuel = document.getElementById('card-go-duel');
  const cardGoLab = document.getElementById('card-go-lab');

  if (btnHeroPlayInstant) {
    btnHeroPlayInstant.addEventListener('click', () => {
      sound.play('click');
      app.transition(AppScreen.EXPEDITION_PLAY);
      startSimpleMaze(simpleDifficulty);
    });
  }

  if (cardGoAdventure) {
    cardGoAdventure.addEventListener('click', () => {
      sound.play('click');
      app.transition(AppScreen.EXPEDITION_PLAY);
      startSimpleMaze(simpleDifficulty);
    });
  }
  if (cardGoCampaign) {
    cardGoCampaign.addEventListener('click', () => {
      sound.play('click');
      app.toCampaign();
    });
  }
  if (cardGoDuel) {
    cardGoDuel.addEventListener('click', () => {
      sound.play('click');
      app.toDuel();
    });
  }
  if (cardGoLab) {
    cardGoLab.addEventListener('click', () => {
      sound.play('click');
      app.toLab();
    });
  }

  // Also bind any direct button clicks inside cards
  document.querySelectorAll('.card-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.play('click');
      const card = btn.closest('.launch-card');
      if (!card) return;
      if (card.id === 'card-go-adventure') {
        app.transition(AppScreen.EXPEDITION_PLAY);
        startSimpleMaze(simpleDifficulty);
      } else if (card.id === 'card-go-campaign') {
        app.toCampaign();
      } else if (card.id === 'card-go-duel') {
        app.toDuel();
      } else if (card.id === 'card-go-lab') {
        app.toLab();
      }
    });
  });

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
          currentCampaignLevelId = lvlId;
          loadExpeditionCode(lvl.code);
          app.transition(AppScreen.EXPEDITION_PLAY);
          expRenderer.setGrid(expCtrl.grid);
          expRenderer.setEntities({ phantoms: expCtrl.phantoms, relics: expCtrl.relics });
          expCtrl.start();
        }
      });
    });
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
  // 2-Player Local Duel Race Logic
  // -------------------------------------------------------------
  const btnDuelStart = document.getElementById('btn-duel-start');
  const btnDuelNew = document.getElementById('btn-duel-new');
  const btnDuelRematch = document.getElementById('btn-duel-rematch');
  const btnDuelNext = document.getElementById('btn-duel-next');
  const btnDuelMenu = document.getElementById('btn-duel-menu');
  const duelWinnerOverlay = document.getElementById('duel-winner-overlay');
  const duelWinnerTitle = document.getElementById('duel-winner-title');
  const duelTimerVal = document.getElementById('duel-timer-val');
  const duelP1Steps = document.getElementById('duel-p1-steps');
  const duelP1Relics = document.getElementById('duel-p1-relics');
  const duelP2Steps = document.getElementById('duel-p2-steps');
  const duelP2Relics = document.getElementById('duel-p2-relics');

  let duelCurrentCode = 'v1/21x21/bkt/DUEL_SEED_1/b20/t10/srv';

  function initDuelGame(code = duelCurrentCode) {
    duelCurrentCode = code;
    duelWinnerOverlay.style.display = 'none';
    duelCtrl.load(code);
    duelRenderer.setGrid(duelCtrl.grid);
    duelRenderer.setDuelPlayers(duelCtrl.p1, duelCtrl.p2);
    duelRenderer.resize();
    duelRenderer.render();
  }

  function updateDuelUI(data) {
    if (!data) return;
    if (duelP1Steps) duelP1Steps.textContent = data.p1.steps;
    if (duelP1Relics) duelP1Relics.textContent = data.p1.relics;
    if (duelP2Steps) duelP2Steps.textContent = data.p2.steps;
    if (duelP2Relics) duelP2Relics.textContent = data.p2.relics;

    const s = Math.floor(data.elapsedSeconds);
    const ms = Math.floor((data.elapsedSeconds - s) * 10);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    if (duelTimerVal) {
      duelTimerVal.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
    }

    if (duelCtrl.grid) {
      duelRenderer.setFog(data.fog);
      duelRenderer.setDuelPlayers(data.p1, data.p2);
    }

    if (data.state === DuelState.FINISHED && data.winner) {
      duelWinnerOverlay.style.display = 'flex';
      duelWinnerTitle.textContent = `${data.winner.name.toUpperCase()} WINS THE DUEL!`;
      sound.play('win');
    }
  }

  if (btnDuelStart) {
    btnDuelStart.addEventListener('click', () => {
      sound.play('click');
      if (duelCtrl.state !== DuelState.READY) {
        initDuelGame();
      }
      duelCtrl.start();
    });
  }

  if (btnDuelNew) {
    btnDuelNew.addEventListener('click', () => {
      sound.play('click');
      initDuelGame(`v1/21x21/bkt/${randomSeed()}/b20/t10/srv`);
    });
  }

  if (btnDuelRematch) {
    btnDuelRematch.addEventListener('click', () => {
      sound.play('click');
      initDuelGame(duelCurrentCode);
      duelCtrl.start();
    });
  }

  if (btnDuelNext) {
    btnDuelNext.addEventListener('click', () => {
      sound.play('click');
      initDuelGame(`v1/21x21/bkt/${randomSeed()}/b20/t10/srv`);
      duelCtrl.start();
    });
  }

  if (btnDuelMenu) {
    btnDuelMenu.addEventListener('click', () => {
      sound.play('click');
      app.toLanding();
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
      if (mazeGuideBanner) {
        mazeGuideBanner.className = 'maze-guide-banner victory';
        if (guideIcon) guideIcon.textContent = '🎉';
        if (guideText) guideText.innerHTML = `<strong>CONGRATULATIONS!</strong> You reached the exit in <strong>${simpleSteps} steps</strong>! Click <strong>🎲 GENERATE MAZE</strong> to play again!`;
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
        }
      }
    }, 20);
  }

  function retryCurrentMaze() {
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

    expRenderer.resetPlayer();
    expRenderer.clearSolution();

    sound.play('click');
    if (mazeGuideBanner) {
      mazeGuideBanner.className = 'maze-guide-banner';
      if (guideIcon) guideIcon.textContent = '👉';
      if (guideText) guideText.innerHTML = 'Reset! Use <strong>Arrow Keys</strong> or <strong>WASD</strong> to reach the 🔴 Red Exit. Good luck!';
    }
  }

  // Buttons wiring
  if (btnGenerateMaze) {
    btnGenerateMaze.addEventListener('click', () => {
      sound.play('click');
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
    // 1. Duel mode
    if (app.screen === AppScreen.DUEL && duelCtrl.state === DuelState.RACING) {
      if (e.code === 'KeyW') { e.preventDefault(); duelCtrl.moveP1(Wall.N); }
      else if (e.code === 'KeyD') { e.preventDefault(); duelCtrl.moveP1(Wall.E); }
      else if (e.code === 'KeyS') { e.preventDefault(); duelCtrl.moveP1(Wall.S); }
      else if (e.code === 'KeyA') { e.preventDefault(); duelCtrl.moveP1(Wall.W); }

      if (e.code === 'ArrowUp') { e.preventDefault(); duelCtrl.moveP2(Wall.N); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); duelCtrl.moveP2(Wall.E); }
      else if (e.code === 'ArrowDown') { e.preventDefault(); duelCtrl.moveP2(Wall.S); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); duelCtrl.moveP2(Wall.W); }
      return;
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
    } else if (app.screen === AppScreen.DUEL) {
      duelRenderer.resize();
      duelRenderer.render();
    } else if (app.screen === AppScreen.LAB) {
      labRenderer.resize();
      labRenderer.render();
    }
  });

  // -------------------------------------------------------------
  // Cartographer Lab UI & Interactions
  // -------------------------------------------------------------
  const labDim = document.getElementById('lab-dim');
  const labDimVal = document.getElementById('lab-dim-val');
  const labGen = document.getElementById('lab-gen');
  const labSeed = document.getElementById('lab-seed');
  const btnLabRandomSeed = document.getElementById('btn-lab-random-seed');
  const labBraid = document.getElementById('lab-braid');
  const labBraidVal = document.getElementById('lab-braid-val');
  const labTerrain = document.getElementById('lab-terrain');
  const labTerrainVal = document.getElementById('lab-terrain-val');
  const btnLabGenerate = document.getElementById('btn-lab-generate');

  const labSolver = document.getElementById('lab-solver');
  const btnLabSolve = document.getElementById('btn-lab-solve');
  const btnLabRace = document.getElementById('btn-lab-race');
  const toggleHeat = document.getElementById('toggle-heat');
  const labDial = document.getElementById('lab-dial');
  const labTransport = document.getElementById('lab-transport');
  const labCodeDisplay = document.getElementById('lab-code-display');

  labDim.addEventListener('input', () => {
    labDimVal.textContent = `${labDim.value} x ${labDim.value}`;
  });

  labBraid.addEventListener('input', () => {
    labBraidVal.textContent = `${labBraid.value}%`;
  });

  labTerrain.addEventListener('input', () => {
    labTerrainVal.textContent = `${labTerrain.value}%`;
  });

  btnLabRandomSeed.addEventListener('click', () => {
    sound.play('click');
    labSeed.value = randomSeed();
  });

  btnLabGenerate.addEventListener('click', () => {
    sound.play('click');
    const dim = parseInt(labDim.value, 10);
    labCtrl.rows = dim;
    labCtrl.cols = dim;
    labCtrl.generator = labGen.value;
    labCtrl.seed = labSeed.value.trim() || randomSeed();
    labCtrl.braidPct = parseInt(labBraid.value, 10);
    labCtrl.terrainPct = parseInt(labTerrain.value, 10);
    labCtrl.generate();
    labRenderer.setGrid(labCtrl.grid);
  });

  btnLabSolve.addEventListener('click', () => {
    sound.play('click');
    labCtrl.solver = labSolver.value;
    labCtrl.solve();
  });

  btnLabRace.addEventListener('click', () => {
    sound.play('click');
    labCtrl.startLockstepRace(['dfs', 'bfs', 'dij', 'ast']);
  });

  toggleHeat.addEventListener('change', (e) => {
    labCtrl.heatMapMode = e.detail.checked;
  });

  labDial.addEventListener('change', (e) => {
    labCtrl.setSpeed(e.detail.speed);
  });

  labTransport.addEventListener('action', (e) => {
    const act = e.detail.action;
    if (act === 'play') labCtrl.play();
    else if (act === 'pause') labCtrl.pause();
    else if (act === 'step-forward') labCtrl.step();
    else if (act === 'stop') labCtrl.reset();
  });

  function updateLabUI(data) {
    if (!data) return;
    const labCodeDisp = document.getElementById('lab-code-display');
    if (labCodeDisp) labCodeDisp.textContent = data.code;
    renderIntegrityReport(data.validationReport);
    renderComplexityCard(data.complexity);
    renderTelemetryCard(data.telemetry);
  }

  function handleLabEvent(evt) {
    if (evt.t === 'VISIT') {
      labRenderer.recordVisit(evt.cell);
    } else if (evt.t === 'PATH') {
      labRenderer.path.push(evt.cell);
      labRenderer.render();
    }
  }

  function renderIntegrityReport(rep) {
    if (!rep) return;
    const setT = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setT('rep-sym', rep.symmetric ? 'YES' : 'NO');
    setT('rep-border', rep.bordersClosed ? 'CLOSED' : 'OPEN');
    setT('rep-conn', rep.connected ? 'YES' : 'NO');
    setT('rep-perfect', rep.isTree ? 'YES' : 'NO');
    setT('rep-loops', rep.loops);
    setT('rep-deadends', rep.deadEnds);
    setT('rep-solvable', rep.solvable ? 'YES' : 'NO');
  }

  function renderComplexityCard(comp) {
    const cEl = document.getElementById('complexity-card-content');
    if (!cEl || !comp) return;
    cEl.innerHTML = `
      <div style="font-size: 11px; margin-bottom: 4px;"><strong>TIME:</strong> ${comp.time || '-'}</div>
      <div style="font-size: 11px; margin-bottom: 4px;"><strong>SPACE:</strong> ${comp.space || '-'}</div>
      <div style="font-size: 10px; color: var(--text-dim);">${comp.note || ''}</div>
    `;
  }

  function renderTelemetryCard(telem) {
    if (!telem) return;
    const setT = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setT('stat-hops', telem.hops ?? '-');
    setT('stat-cost', telem.cost ?? '-');
    setT('stat-expanded', telem.expanded ?? '-');
    setT('stat-peak', telem.frontierPeak ?? '-');
  }

  // Lab Export Actions
  document.getElementById('btn-lab-export-png').addEventListener('click', () => {
    sound.play('click');
    const url = labRenderer.exportPngWithCartouche({ code: labCtrl.code });
    const a = document.createElement('a');
    a.href = url;
    a.download = `cartographer_${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('btn-lab-export-json').addEventListener('click', () => {
    sound.play('click');
    const json = exportMazeJson(labCtrl.grid, { code: labCtrl.code });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maze_${Date.now()}.maze.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const fileImportJson = document.getElementById('file-import-json');
  document.getElementById('btn-lab-import-json').addEventListener('click', () => {
    fileImportJson.click();
  });

  fileImportJson.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const imported = importMazeJson(text);
      labCtrl.grid = imported.grid;
      labCtrl.rows = imported.grid.rows;
      labCtrl.cols = imported.grid.cols;
      labDim.value = labCtrl.rows;
      labDimVal.textContent = `${labCtrl.rows} x ${labCtrl.cols}`;
      labRenderer.setGrid(imported.grid);
      alert('Maze successfully loaded!');
    } catch (err) {
      alert(`Import error: ${err.message}`);
    }
  });

  // Editor Mode Buttons
  const modeButtons = document.querySelectorAll('.btn-mode');
  let editorMode = 'view';
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.play('click');
      editorMode = btn.dataset.mode;
      modeButtons.forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  labCanvas.addEventListener('click', (e) => {
    if (editorMode === 'view' || !labCtrl.grid) return;
    const rect = labCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left - labRenderer.margin;
    const y = e.clientY - rect.top - labRenderer.margin;
    const c = Math.floor(x / labRenderer.cellPx);
    const r = Math.floor(y / labRenderer.cellPx);

    if (labCtrl.grid.inBounds(r, c)) {
      const idx = labCtrl.grid.index(r, c);
      if (editorMode === 'wall') {
        if (c < labCtrl.grid.cols - 1) {
          labCtrl.toggleWall(idx, idx + 1);
        }
      } else if (editorMode === 'mud') {
        labCtrl.paintTerrain(idx, 2);
      }
      labRenderer.rebuildL0();
      labRenderer.render();
    }
  });

  // -------------------------------------------------------------
  // Benchmark UI
  // -------------------------------------------------------------
  const btnRunBenchmark = document.getElementById('btn-run-benchmark');
  const benchProgressRow = document.getElementById('bench-progress-row');
  const benchProgressBar = document.getElementById('bench-progress-bar');
  const benchProgressText = document.getElementById('bench-progress-text');
  const benchTableBody = document.getElementById('bench-table-body');
  const btnBenchExportCsv = document.getElementById('btn-bench-export-csv');
  const btnBenchExportJson = document.getElementById('btn-bench-export-json');

  let benchmarkData = null;

  btnRunBenchmark.addEventListener('click', async () => {
    sound.play('click');
    btnRunBenchmark.disabled = true;
    benchProgressRow.style.display = 'block';

    benchmarkData = await runBenchmark({
      sizes: [20, 40, 60],
      solvers: ['dfs', 'bfs', 'dij', 'ast', 'wfl'],
      generator: 'bkt',
      trials: 5,
    }, ({ current, total, solver, size }) => {
      const pct = Math.round((current / total) * 100);
      benchProgressBar.style.width = `${pct}%`;
      benchProgressText.textContent = `BENCHMARKING ${solver.toUpperCase()} ON ${size}x${size} (${pct}%)...`;
    });

    benchProgressRow.style.display = 'none';
    btnRunBenchmark.disabled = false;
    btnBenchExportCsv.disabled = false;
    btnBenchExportJson.disabled = false;

    renderBenchmarkTable(benchmarkData.summary);
  });

  function renderBenchmarkTable(summary) {
    let html = '';
    for (const [solver, sizes] of Object.entries(summary)) {
      for (const [size, metrics] of Object.entries(sizes)) {
        html += `
          <tr>
            <td style="font-weight: 600; color: var(--brass);">${solver.toUpperCase()}</td>
            <td>${size}x${size}</td>
            <td class="td-num">${metrics.medianTimeMs} ms</td>
            <td class="td-num">&#177; ${metrics.iqrMs} ms</td>
            <td class="td-num">${metrics.avgExpanded}</td>
            <td class="td-num">${metrics.avgHops}</td>
            <td class="td-num">${metrics.avgCost}</td>
          </tr>
        `;
      }
    }
    benchTableBody.innerHTML = html;
  }

  btnBenchExportCsv.addEventListener('click', () => {
    if (!benchmarkData) return;
    let csv = 'Solver,Size,MedianTimeMs,IQRMs,AvgExpanded,AvgHops,AvgCost\n';
    for (const [solver, sizes] of Object.entries(benchmarkData.summary)) {
      for (const [size, m] of Object.entries(sizes)) {
        csv += `${solver},${size},${m.medianTimeMs},${m.iqrMs},${m.avgExpanded},${m.avgHops},${m.avgCost}\n`;
      }
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  btnBenchExportJson.addEventListener('click', () => {
    if (!benchmarkData) return;
    const blob = new Blob([JSON.stringify(benchmarkData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Initial Load: Landing Page Hero
  applyDifficulty('srv');
  app.toLanding();

  // Expose global app for debugging & manual navigation
  if (typeof window !== 'undefined') {
    window.app = app;
    window.expCtrl = expCtrl;
    window.duelCtrl = duelCtrl;
    window.labCtrl = labCtrl;
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
