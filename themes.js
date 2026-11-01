// Holiday themes. Each one is only available inside its date window; "auto" (the
// default) picks whichever holiday is in season, otherwise the classic look.
// Pure and DOM-free so the date rules are unit tested.

/** Thanksgiving (US): the 4th Thursday of November. Returns a day-of-month. */
export function thanksgivingDay(year) {
  const firstDow = new Date(year, 10, 1).getDay(); // 0 = Sunday
  const firstThursday = 1 + ((4 - firstDow + 7) % 7);
  return firstThursday + 21;
}

const md = (d) => (d.getMonth() + 1) * 100 + d.getDate(); // e.g. Nov 6 → 1106

export const THEMES = [
  {
    id: 'classic',
    name: 'Classic',
    emoji: '👟',
    available: () => true,
    themeColor: '#ff6f91',
    confetti: null, // fx.js default palette
    rain: ['🌟', '🚀', '👟', '✨', '🎉', '💖'],
    ambient: null,
    greetingEmoji: '',
  },
  {
    id: 'halloween',
    name: 'Halloween',
    emoji: '🎃',
    // Oct 1 – Nov 5 (Thanksgiving takes over on Nov 6)
    available: (d) => md(d) >= 1001 && md(d) <= 1105,
    themeColor: '#1b1026',
    confetti: ['#ff7a1a', '#ffb347', '#8e44ff', '#b98cff', '#7ed957', '#f5f5f5'],
    rain: ['🎃', '👻', '🦇', '🍬', '🕷️', '🍭', '💀'],
    confettiEmoji: ['🎃', '🦇', '👻', '🍬', '🕸️'],
    ambient: { emojis: ['🦇', '👻', '🦇', '🕸️', '🎃'], motion: 'float', count: 10 },
    greetingEmoji: '🎃',
    bigSub: 'Spooktacular! 🎃',
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    emoji: '🦃',
    // Nov 6 – Thanksgiving Day
    available: (d) => d.getMonth() === 10 && d.getDate() >= 6 && d.getDate() <= thanksgivingDay(d.getFullYear()),
    themeColor: '#b5541c',
    confetti: ['#c4561d', '#e8a33d', '#8a3b12', '#d9b44a', '#7a8b3a', '#f3e2c0'],
    rain: ['🍂', '🍁', '🦃', '🥧', '🌽', '🍠'],
    confettiEmoji: ['🍂', '🍁', '🦃', '🥧', '🌽'],
    ambient: { emojis: ['🍂', '🍁', '🍂', '🍁'], motion: 'fall', count: 14 },
    greetingEmoji: '🍂',
    bigSub: 'Gobble gobble! 🦃',
  },
  {
    id: 'christmas',
    name: 'Christmas',
    emoji: '🎄',
    // Day after Thanksgiving – Dec 31
    available: (d) =>
      (d.getMonth() === 10 && d.getDate() > thanksgivingDay(d.getFullYear())) || d.getMonth() === 11,
    themeColor: '#b3202a',
    confetti: ['#d62839', '#1f8a4c', '#f4c542', '#ffffff', '#9be7c4', '#ff8fa3'],
    rain: ['🎄', '❄️', '🎁', '⭐', '🍪', '⛄', '🦌'],
    confettiEmoji: ['❄️', '⭐', '🎄', '🎁', '🍬'],
    ambient: { emojis: ['❄️', '❄', '❅', '❆'], motion: 'fall', count: 22 },
    greetingEmoji: '🎄',
    bigSub: 'Ho ho ho! 🎅',
  },
];

export const byId = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

/** Themes she can pick on this date (classic is always there). */
export function availableThemes(date) {
  return THEMES.filter((t) => t.available(date));
}

/** The holiday in season on this date, or null. */
export function seasonalTheme(date) {
  return THEMES.find((t) => t.id !== 'classic' && t.available(date)) || null;
}

/**
 * Which theme to show. `pref` is 'auto' or a theme id. A holiday she picked that has
 * gone out of season falls back to auto.
 */
export function activeTheme(pref, date) {
  if (pref && pref !== 'auto') {
    const t = byId(pref);
    if (t.id === pref && t.available(date)) return t;
  }
  return seasonalTheme(date) || byId('classic');
}
