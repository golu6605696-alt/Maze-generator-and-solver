/**
 * @file theme.js
 * Multi-theme management for Expedition Cartographer.
 * Supported themes:
 * - 'terminal': Golden Field Terminal (Dark CRT Amber)
 * - 'sheet': Treasure Parchment (Warm Aged Paper)
 * - 'cyber': Arcade Cyber Neon (Electric Cyan & Pink)
 * - 'jungle': Emerald Explorer (Lush Forest & Gold)
 */

export const Theme = Object.freeze({
  TERMINAL: 'terminal',
  SHEET: 'sheet',
  CYBER: 'cyber',
  JUNGLE: 'jungle',
});

export const THEME_SPECS = Object.freeze([
  { id: 'terminal', name: 'Golden Terminal', icon: '🟡', desc: 'Dark CRT with warm amber & brass' },
  { id: 'sheet', name: 'Treasure Map', icon: '📜', desc: 'Aged archival paper with sepia ink' },
  { id: 'cyber', name: 'Arcade Neon', icon: '🌌', desc: 'Midnight grid with glowing cyan & pink' },
  { id: 'jungle', name: 'Emerald Jungle', icon: '🌿', desc: 'Deep moss forest with gold sunlight' },
]);

export function getStoredTheme() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('expedition_theme');
    if (Object.values(Theme).includes(saved)) return saved;
  }
  return Theme.TERMINAL;
}

export function setTheme(theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('expedition_theme', theme);
    }
  }
}

export function cycleTheme() {
  const themes = [Theme.TERMINAL, Theme.SHEET, Theme.CYBER, Theme.JUNGLE];
  const current = getStoredTheme();
  const nextIdx = (themes.indexOf(current) + 1) % themes.length;
  const next = themes[nextIdx];
  setTheme(next);
  return next;
}
