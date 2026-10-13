/**
 * @file main.js
 * Application entry point wiring CanvasRenderer, Controller, ControlsPanel,
 * and StatsPanel with the web DOM.
 */

import { CanvasRenderer } from './ui/renderer.js';
import { Controller } from './app/controller.js';
import { ControlsPanel } from './ui/controls.js';
import { StatsPanel } from './ui/stats_panel.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('maze-canvas');
  if (!canvas) {
    console.error('Maze canvas element #maze-canvas not found.');
    return;
  }

  // 1. Initialize Renderer
  const renderer = new CanvasRenderer(canvas, { theme: 'dark' });

  // 2. Initialize Controller
  const controller = new Controller({
    renderer,
    initialSize: 25,
    initialSpeed: 50,
  });

  // 3. Collect UI Elements
  const elements = {
    btnGenerate: document.getElementById('btn-generate'),
    btnSolve: document.getElementById('btn-solve'),
    btnPause: document.getElementById('btn-pause'),
    btnStep: document.getElementById('btn-step'),
    btnReset: document.getElementById('btn-reset'),
    btnRandomSeed: document.getElementById('btn-random-seed'),
    btnTheme: document.getElementById('btn-theme'),
    inputSize: document.getElementById('input-size'),
    inputSeed: document.getElementById('input-seed'),
    selectGenerator: document.getElementById('select-generator'),
    selectSolver: document.getElementById('select-solver'),
    sliderSpeed: document.getElementById('slider-speed'),
    valSize: document.getElementById('val-size'),
    valSpeed: document.getElementById('val-speed'),
    statAlgorithm: document.getElementById('stat-algorithm'),
    statVisited: document.getElementById('stat-visited'),
    statPath: document.getElementById('stat-path'),
    statCost: document.getElementById('stat-cost'),
    statTime: document.getElementById('stat-time'),
    statStatus: document.getElementById('stat-status'),
    btnBraid: document.getElementById('btn-braid'),
    btnCompare: document.getElementById('btn-compare'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    compareModal: document.getElementById('compare-modal'),
    compareTbody: document.getElementById('benchmark-tbody'),
    btnEditMode: document.getElementById('btn-edit-mode'),
    btnSave: document.getElementById('btn-save'),
    inputLoad: document.getElementById('input-load'),
    btnRace: document.getElementById('btn-race'),
    btnAnalytics: document.getElementById('btn-analytics'),
    raceModal: document.getElementById('race-modal'),
    btnCloseRaceModal: document.getElementById('btn-close-race-modal'),
    raceSolverA: document.getElementById('race-solver-a'),
    raceSolverB: document.getElementById('race-solver-b'),
    btnStartRace: document.getElementById('btn-start-race'),
    raceResultContainer: document.getElementById('race-result-container'),
    analyticsModal: document.getElementById('analytics-modal'),
    btnCloseAnalyticsModal: document.getElementById('btn-close-analytics-modal'),
    analyticsContent: document.getElementById('analytics-content'),
  };

  // 4. Initialize Controls & Stats
  new ControlsPanel(controller, renderer, elements);
  new StatsPanel(controller, elements);

  // 5. Handle Responsive Window Resizing
  window.addEventListener('resize', () => {
    renderer.resize();
  });

  // Initial resize and render
  renderer.resize();

  // Initial maze generation to wow user immediately
  controller.generate('backtracker', 25, '');
});
