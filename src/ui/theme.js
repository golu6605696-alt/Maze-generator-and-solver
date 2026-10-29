/**
 * @file theme.js
 * Multi-theme management for Expedition Cartographer.
 * Supported themes:
 * - 'sheet': Treasure Parchment (Warm Aged Paper)
 * - 'cyber': Arcade Cyber Neon (Electric Cyan & Pink)
 * - 'jungle': Emerald Explorer (Lush Forest & Gold)
 */

export const Theme = Object.freeze({
  SHEET: 'sheet',
  CYBER: 'cyber',
  JUNGLE: 'jungle',
});

export const THEME_SPECS = Object.freeze([
  { id: 'sheet', name: 'Treasure Map', icon: '📜', desc: 'Aged archival paper with sepia ink' },
  { id: 'cyber', name: 'Arcade Neon', icon: '🌌', desc: 'Midnight grid with glowing cyan & pink' },
  { id: 'jungle', name: 'Emerald Jungle', icon: '🌿', desc: 'Deep moss forest with gold sunlight' },
]);

export function getStoredTheme() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('expedition_theme');
    if (saved && saved !== 'terminal' && Object.values(Theme).includes(saved)) return saved;
  }
  return Theme.SHEET;
}

export function setTheme(theme) {
  if (typeof document !== 'undefined') {
    const validTheme = (theme === 'terminal' || !Object.values(Theme).includes(theme)) ? Theme.SHEET : theme;
    document.documentElement.setAttribute('data-theme', validTheme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('expedition_theme', validTheme);
    }
  }
}

export function cycleTheme() {
  const themes = [Theme.SHEET, Theme.CYBER, Theme.JUNGLE];
  const current = getStoredTheme();
  const nextIdx = (themes.indexOf(current) + 1) % themes.length;
  const next = themes[nextIdx];
  setTheme(next);
  return next;
}
