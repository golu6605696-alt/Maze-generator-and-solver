/**
 * @file stats_panel.js
 * Updates and renders real-time execution metrics and run statistics
 * (algorithm, visited cells, path length, cost, time, and status).
 *
 * Complexity: O(1) DOM updates per event.
 */

export class StatsPanel {
  /**
   * @param {import('../app/controller.js').Controller} controller
   * @param {object} elements
   */
  constructor(controller, elements = {}) {
    this.controller = controller;
    this.elements = elements;

    this.controller.onStatsUpdate((stats) => this.update(stats));
  }

  /**
   * Updates stats panel DOM elements with current run metrics.
   *
   * @param {object} stats
   */
  update(stats) {
    const {
      statAlgorithm,
      statVisited,
      statPath,
      statCost,
      statTime,
      statStatus,
    } = this.elements;

    if (statAlgorithm && stats.algorithm) {
      statAlgorithm.textContent = stats.algorithm;
    }

    if (statVisited && stats.visitedCount !== undefined) {
      const total = this.controller.grid?.totalCells || 1;
      const pct = Math.round((stats.visitedCount / total) * 100);
      statVisited.textContent = stats.visitedCount > 0
        ? `${stats.visitedCount} (${pct}%)`
        : '-';
    }

    if (statPath && stats.pathLength !== undefined) {
      statPath.textContent = stats.pathLength > 0 ? stats.pathLength : '-';
    }

    if (statCost && stats.cost !== undefined) {
      statCost.textContent = stats.cost > 0 ? stats.cost : '-';
    }

    if (statTime && stats.timeMs !== undefined) {
      statTime.textContent = stats.timeMs > 0 ? `${stats.timeMs} ms` : '-';
    }

    if (statStatus && stats.status) {
      statStatus.textContent = stats.status;
    }
  }
}
