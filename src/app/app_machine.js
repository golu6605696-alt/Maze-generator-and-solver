/**
 * @file app_machine.js
 * High-level screen and mode navigation state machine.
 */

export const AppScreen = Object.freeze({
  LANDING: 'LANDING',
  CAMPAIGN: 'CAMPAIGN',
  DUEL: 'DUEL',
  EXPEDITION_BRIEFING: 'EXPEDITION_BRIEFING',
  EXPEDITION_PLAY: 'EXPEDITION_PLAY',
  EXPEDITION_RESULT: 'EXPEDITION_RESULT',
  LAB: 'LAB',
  BENCHMARK: 'BENCHMARK',
});

export class AppMachine {
  /**
   * @param {(screen: string, payload?: any) => void} onTransition
   */
  constructor(onTransition) {
    this._screen = AppScreen.LANDING;
    this._onTransition = onTransition;
    this._activeRun = false;
  }

  get screen() {
    return this._screen;
  }

  get hasActiveRun() {
    return this._activeRun;
  }

  setActiveRun(active) {
    this._activeRun = active;
  }

  transition(targetScreen, payload) {
    this._screen = targetScreen;
    this._onTransition(this._screen, payload);
  }

  toLanding() {
    this.transition(AppScreen.LANDING);
  }

  toCampaign() {
    this.transition(AppScreen.CAMPAIGN);
  }

  toDuel(code) {
    this.transition(AppScreen.DUEL, code);
  }

  toExpeditionBriefing(codeOrDifficulty) {
    this.transition(AppScreen.EXPEDITION_BRIEFING, codeOrDifficulty);
  }

  toExpeditionPlay(runConfig) {
    this.setActiveRun(true);
    this.transition(AppScreen.EXPEDITION_PLAY, runConfig);
  }

  toExpeditionResult(scoreReport) {
    this.setActiveRun(false);
    this.transition(AppScreen.EXPEDITION_RESULT, scoreReport);
  }

  toLab(mazeCode) {
    this.transition(AppScreen.LAB, mazeCode);
  }

  toBenchmark() {
    this.transition(AppScreen.BENCHMARK);
  }
}
