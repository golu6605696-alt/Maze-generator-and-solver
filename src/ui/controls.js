/**
 * @file controls.js
 * Manages UI controls, user interaction bindings, input validation,
 * state-based button enabling/disabling, and keyboard accessibility shortcuts.
 *
 * Complexity: O(1) event dispatching.
 */

import { CONTROLLER_STATES } from '../app/controller.js';

export class ControlsPanel {
  /**
   * @param {import('../app/controller.js').Controller} controller
   * @param {import('./renderer.js').CanvasRenderer} renderer
   * @param {object} elements - Map of DOM elements by role
   */
  constructor(controller, renderer, elements = {}) {
    this.controller = controller;
    this.renderer = renderer;
    this.elements = elements;

    this._bindEvents();
    this._bindKeyboard();

    // Listen to controller state transitions
    this.controller.onStateChange((state) => this._onStateChange(state));
  }

  /**
   * Attaches click and change listeners to interactive DOM elements.
   * @private
   */
  _bindEvents() {
    const {
      btnGenerate,
      btnSolve,
      btnPause,
      btnStep,
      btnReset,
      btnRandomSeed,
      btnTheme,
      inputSize,
      inputSeed,
      selectGenerator,
      selectSolver,
      sliderSpeed,
      valSize,
      valSpeed,
    } = this.elements;

    if (btnGenerate) {
      btnGenerate.addEventListener('click', () => {
        const size = parseInt(inputSize?.value, 10) || 25;
        const seed = inputSeed?.value?.trim() || '';
        const algo = selectGenerator?.value || 'backtracker';
        this.controller.generate(algo, size, seed);
      });
    }

    if (btnSolve) {
      btnSolve.addEventListener('click', () => {
        const algo = selectSolver?.value || 'bfs';
        this.controller.solve(algo);
      });
    }

    if (btnPause) {
      btnPause.addEventListener('click', () => {
        if (this.controller.state === CONTROLLER_STATES.PAUSED) {
          this.controller.resume();
        } else {
          this.controller.pause();
        }
      });
    }

    if (btnStep) {
      btnStep.addEventListener('click', () => {
        this.controller.step();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.controller.reset();
      });
    }

    if (btnRandomSeed && inputSeed) {
      btnRandomSeed.addEventListener('click', () => {
        const randomSeed = Math.floor(Math.random() * 900000 + 100000).toString();
        inputSeed.value = randomSeed;
      });
    }

    if (sliderSpeed) {
      sliderSpeed.addEventListener('input', () => {
        const speed = parseInt(sliderSpeed.value, 10);
        this.controller.setSpeed(speed);
        if (valSpeed) valSpeed.textContent = speed === 100 ? 'Instant' : `${speed}%`;
      });
    }

    if (inputSize) {
      inputSize.addEventListener('input', () => {
        if (valSize) valSize.textContent = `${inputSize.value}x${inputSize.value}`;
      });
    }

    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('light-theme');
        const newTheme = isDark ? 'light' : 'dark';
        this.renderer.setTheme(newTheme);
        btnTheme.textContent = isDark ? '🌙 Dark Mode' : '☀️ Light Mode';
      });
    }

    // Phase 6: Braid Mode
    const { btnBraid, btnCompare, btnCloseModal, compareModal, compareTbody, btnEditMode, btnSave, inputLoad } = this.elements;

    if (btnBraid) {
      btnBraid.addEventListener('click', () => {
        this.controller.braid(0.5);
      });
    }

    // Phase 6: Benchmark Comparison Dashboard
    if (btnCompare && compareModal && compareTbody) {
      btnCompare.addEventListener('click', () => {
        const results = this.controller.compareAll();
        compareTbody.innerHTML = results.map((r) => `
          <tr>
            <td><strong>${r.name}</strong></td>
            <td><span class="${r.found ? 'badge-success' : 'badge-danger'}">${r.found ? 'Solved' : 'No Path'}</span></td>
            <td>${r.visitedCount}</td>
            <td>${r.pathLength}</td>
            <td>${r.cost}</td>
            <td>${r.timeMs} ms</td>
          </tr>
        `).join('');
        compareModal.style.display = 'flex';
      });
    }

    if (btnCloseModal && compareModal) {
      btnCloseModal.addEventListener('click', () => {
        compareModal.style.display = 'none';
      });
      compareModal.addEventListener('click', (e) => {
        if (e.target === compareModal) compareModal.style.display = 'none';
      });
    }

    // Phase 7: Race Mode
    const {
      btnRace,
      btnCloseRaceModal,
      raceModal,
      raceSolverA,
      raceSolverB,
      btnStartRace,
      raceResultContainer,
      btnAnalytics,
      analyticsModal,
      btnCloseAnalyticsModal,
      analyticsContent,
    } = this.elements;

    if (btnRace && raceModal) {
      btnRace.addEventListener('click', () => {
        raceModal.style.display = 'flex';
      });
    }

    if (btnCloseRaceModal && raceModal) {
      btnCloseRaceModal.addEventListener('click', () => {
        raceModal.style.display = 'none';
      });
      raceModal.addEventListener('click', (e) => {
        if (e.target === raceModal) raceModal.style.display = 'none';
      });
    }

    if (btnStartRace && raceResultContainer && raceSolverA && raceSolverB) {
      btnStartRace.addEventListener('click', () => {
        const keyA = raceSolverA.value;
        const keyB = raceSolverB.value;
        const outcome = this.controller.race(keyA, keyB);

        const isWinnerA = outcome.winner === outcome.solverA.name;
        const isWinnerB = outcome.winner === outcome.solverB.name;

        raceResultContainer.innerHTML = `
          <div class="duel-verdict">
            <div class="duel-winner-title">🏆 ${outcome.winner === 'Tie' ? "It's a Tie!" : `Winner: ${outcome.winner}`}</div>
            <div class="duel-reason">${outcome.reason}</div>
          </div>
          <div class="duel-grid">
            <div class="racer-card ${isWinnerA ? 'is-winner' : ''}">
              <div class="racer-header">
                <span>${outcome.solverA.name}</span>
                ${isWinnerA ? '<span class="badge-success">VICTOR</span>' : ''}
              </div>
              <div class="racer-stat-row">
                <span>Cells Visited</span>
                <span class="racer-stat-val">${outcome.solverA.visited}</span>
              </div>
              <div class="racer-stat-row">
                <span>Path Length</span>
                <span class="racer-stat-val">${outcome.solverA.pathLength}</span>
              </div>
              <div class="racer-stat-row">
                <span>Compute Time</span>
                <span class="racer-stat-val">${outcome.solverA.timeMs.toFixed(2)} ms</span>
              </div>
            </div>
            <div class="racer-card ${isWinnerB ? 'is-winner' : ''}">
              <div class="racer-header">
                <span>${outcome.solverB.name}</span>
                ${isWinnerB ? '<span class="badge-success">VICTOR</span>' : ''}
              </div>
              <div class="racer-stat-row">
                <span>Cells Visited</span>
                <span class="racer-stat-val">${outcome.solverB.visited}</span>
              </div>
              <div class="racer-stat-row">
                <span>Path Length</span>
                <span class="racer-stat-val">${outcome.solverB.pathLength}</span>
              </div>
              <div class="racer-stat-row">
                <span>Compute Time</span>
                <span class="racer-stat-val">${outcome.solverB.timeMs.toFixed(2)} ms</span>
              </div>
            </div>
          </div>
        `;
        raceResultContainer.style.display = 'flex';
      });
    }

    // Phase 7: Maze Analytics
    if (btnAnalytics && analyticsModal && analyticsContent) {
      btnAnalytics.addEventListener('click', () => {
        const stats = this.controller.analyze();
        let ratingLabel = 'Balanced';
        if (stats.difficultyScore < 30) ratingLabel = 'Beginner / Gentle';
        else if (stats.difficultyScore < 60) ratingLabel = 'Balanced / Moderate';
        else if (stats.difficultyScore < 85) ratingLabel = 'Complex / Challenging';
        else ratingLabel = 'Extreme / Labyrinth';

        analyticsContent.innerHTML = `
          <div class="analytics-dashboard">
            <div class="difficulty-card">
              <div class="difficulty-header">
                <div>
                  <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Composite Difficulty Rating</div>
                  <div style="font-weight: 700; color: var(--text-primary); font-size: 1.15rem;">${ratingLabel}</div>
                </div>
                <div class="difficulty-score-val">${stats.difficultyScore} / 100</div>
              </div>
              <div class="progress-track">
                <div class="progress-bar" style="width: ${stats.difficultyScore}%;"></div>
              </div>
            </div>

            <div class="analytics-grid">
              <div class="metric-box">
                <span class="metric-label">Dimensions & Size</span>
                <span class="metric-value">${this.controller.size}x${this.controller.size} (${stats.totalCells})</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Dead Ends</span>
                <span class="metric-value">${stats.deadEnds} <span style="font-size: 0.8rem; color: var(--text-secondary);">(${stats.deadEndPct}%)</span></span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Junctions (Degree &ge; 3)</span>
                <span class="metric-value">${stats.junctions}</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Corridors (Degree 2)</span>
                <span class="metric-value">${stats.corridors}</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Solution Path</span>
                <span class="metric-value" style="color: var(--accent-success);">${stats.solutionLength} steps</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Diameter (Longest Path)</span>
                <span class="metric-value" style="color: #38BDF8;">${stats.longestPath} steps</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">River Factor (Windingness)</span>
                <span class="metric-value">${stats.riverFactor}x</span>
              </div>
            </div>
          </div>
        `;
        analyticsModal.style.display = 'flex';
      });
    }

    if (btnCloseAnalyticsModal && analyticsModal) {
      btnCloseAnalyticsModal.addEventListener('click', () => {
        analyticsModal.style.display = 'none';
      });
      analyticsModal.addEventListener('click', (e) => {
        if (e.target === analyticsModal) analyticsModal.style.display = 'none';
      });
    }


    // Phase 6: Save & Load
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        this.controller.saveMaze(true);
      });
    }

    if (inputLoad) {
      inputLoad.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          try {
            const text = await file.text();
            this.controller.loadMaze(text);
          } catch (err) {
            alert(`Error loading maze: ${err.message}`);
          }
          inputLoad.value = '';
        }
      });
    }

    // Phase 6: Manual Editing Mode
    if (btnEditMode) {
      btnEditMode.addEventListener('click', () => {
        this.controller.isEditMode = !this.controller.isEditMode;
        btnEditMode.classList.toggle('btn-active', this.controller.isEditMode);
        btnEditMode.textContent = this.controller.isEditMode ? '✏️ Editing Active' : '✏️ Edit Mode';
        const container = document.querySelector('.canvas-container');
        if (container) {
          container.classList.toggle('editing', this.controller.isEditMode);
        }
      });
    }

    // Canvas click listener for editing
    if (this.renderer?.canvas) {
      const canvas = this.renderer.canvas;
      canvas.addEventListener('click', (e) => {
        if (!this.controller.isEditMode) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.controller.handleCanvasClick(x, y, false);
      });

      canvas.addEventListener('contextmenu', (e) => {
        if (!this.controller.isEditMode) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.controller.handleCanvasClick(x, y, true);
      });
    }
  }

  /**
   * Registers global keyboard shortcuts per DESIGN.md Section 7.
   * Space: Pause/Resume, Right Arrow: Step, 'R': Reset
   * @private
   */
  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Ignore key events when typing inside inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (this.controller.state === CONTROLLER_STATES.PAUSED) {
          this.controller.resume();
        } else if (
          this.controller.state === CONTROLLER_STATES.GENERATING ||
          this.controller.state === CONTROLLER_STATES.SOLVING
        ) {
          this.controller.pause();
        }
      } else if (e.code === 'ArrowRight') {
        if (this.controller.state === CONTROLLER_STATES.PAUSED) {
          e.preventDefault();
          this.controller.step();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        this.controller.reset();
      }
    });
  }

  /**
   * Syncs UI element disabled and active states with application state.
   * @private
   */
  _onStateChange(state) {
    const {
      btnGenerate,
      btnSolve,
      btnPause,
      btnStep,
      btnReset,
      inputSize,
      inputSeed,
      selectGenerator,
      selectSolver,
    } = this.elements;

    const isRunning =
      state === CONTROLLER_STATES.GENERATING ||
      state === CONTROLLER_STATES.SOLVING;
    const isPaused = state === CONTROLLER_STATES.PAUSED;
    const isIdle = state === CONTROLLER_STATES.IDLE;

    if (btnGenerate) btnGenerate.disabled = !isIdle;
    if (btnSolve) btnSolve.disabled = !isIdle;
    if (inputSize) inputSize.disabled = !isIdle;
    if (inputSeed) inputSeed.disabled = !isIdle;
    if (selectGenerator) selectGenerator.disabled = !isIdle;
    if (selectSolver) selectSolver.disabled = !isIdle;

    if (btnPause) {
      btnPause.disabled = isIdle;
      btnPause.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
    }

    if (btnStep) {
      btnStep.disabled = !isPaused;
    }

    if (btnReset) {
      btnReset.disabled = false;
    }
  }
}
