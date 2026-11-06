import { GUMBALL_THEMES, cssVars } from './gumballs.js';

// Date-unlocked themes: holidays (unlock each year on their dates) and events like a
// movie premiere (unlock once, on a date). Once a theme has unlocked she keeps it
// forever; the app records that in meta.unlockedThemes.
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
    head: 'chalk',
    headerIcon: 'icons/header-halloween.png',
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
    holiday: true,
    pitch: 'Spooky purple and orange, floating bats and ghosts, and pumpkins on big goal days.',
  },
  {
    id: 'thanksgiving',
    headerIcon: 'icons/header-thanksgiving.png',
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
    // a personal line in the one-time "New theme" popup ({name} = her name)
    announceNote: 'I’m so thankful for you, {name}. 🧡 Love, Oliver',
    bigSub: 'Gobble gobble! 🦃',
    holiday: true,
    pitch: 'Warm harvest colors, falling leaves, and gobble-gobble big goal days.',
  },
  {
    id: 'christmas',
    headerIcon: 'icons/header-christmas.png',
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
    holiday: true,
    pitch: 'Red, green and gold, falling snow, and ho-ho-ho big goal days.',
  },
  {
    id: 'newyears',
    name: 'New Year’s',
    emoji: '🥂',
    head: 'deco',
    // Dec 30 – Jan 7 (so she gets it even if she opens Steppy after New Year's Day). Hers forever after.
    available: (d) => md(d) >= 1230 || md(d) <= 107,
    dark: true,
    vars: cssVars({ colors: { bg: '#0c1230', primary: '#e8c66a', accent: '#c9cfe0', ink: '#f6f1e2', blend: '#fff0b8' }, dark: true }),
    themeColor: '#0c1230',
    iconTint: '#1e2a66',
    confetti: ['#e8c66a', '#fff0b8', '#c9cfe0', '#ffffff', '#b58a2e'],
    confettiEmoji: ['🥂', '🎆', '✨', '🪩'],
    rain: ['🎆', '🥂', '🎉', '✨', '🪩'],
    ambient: { emojis: ['✨', '✨', '⭐', '✨'], motion: 'fall', count: 14 },
    greetingEmoji: '🥂',
    bigSub: 'Happy New Year! 🥂',
    holiday: true,
    entrance: 'fireworks',
    pitch: 'Midnight navy with champagne gold and silver sparkle.',
  },
  {
    // Avengers: Doomsday premieres Dec 18, 2026; unlocks on preview night.
    id: 'doomsday',
    name: 'Avengers: Doomsday',
    emoji: '🛡️',
    event: true,
    available: (d) => d >= new Date(2026, 11, 17),
    dark: true,
    vars: cssVars({ colors: { bg: '#0b140e', primary: '#6fcf5a', accent: '#b9c2bd', ink: '#e8f3e6', blend: '#b8f08a' }, dark: true }),
    themeColor: '#0b140e',
    iconTint: '#2a5a30',
    confetti: ['#6fcf5a', '#b8f08a', '#b9c2bd', '#2f6b3a', '#e8f3e6'],
    confettiEmoji: ['🛡️', '⚡', '💥'],
    rain: ['🛡️', '⚡', '🔨', '💥', '🟢'],
    ambient: { emojis: ['⚡', '✨', '⚡'], motion: 'fall', count: 12 },
    greetingEmoji: '🛡️',
    bigSub: 'Heroic! 🛡️',
    entrance: 'lightning',
    pitch: 'Doom green glowing through dark stained glass, with steel silver.',
  },
];

/** Every theme: classic, holidays and Theme Machine gumballs. */
export const ALL_THEMES = [...THEMES, ...GUMBALL_THEMES];

export const byId = (id) => ALL_THEMES.find((t) => t.id === id) || THEMES[0];

/** Themes she can pick on this date (classic is always there). */
export function availableThemes(date) {
  return THEMES.filter((t) => t.available(date));
}

/** The holiday in season on this date, or null. */
export function seasonalTheme(date) {
  return THEMES.find((t) => t.holiday && t.available(date)) || null;
}

/** Date-unlocked themes (holidays and events) that are open on this date. */
export function openOn(date) {
  return THEMES.filter((t) => t.id !== 'classic' && t.available(date));
}

/** Themes she can pick: classic, anything open today, and anything she's unlocked before. */
export function pickable(date, unlocked = []) {
  return THEMES.filter((t) => t.id === 'classic' || t.available(date) || unlocked.includes(t.id));
}

export const isHoliday = (id) => !!THEMES.find((t) => t.id === id)?.holiday;

/**
 * Which theme to show. Her pick always wins. If her pick is a holiday that has gone
 * out of season, she goes back to `fallback` (the theme she wore before the holiday).
 */
export function activeTheme(pref, date, fallback = 'classic', unlocked = []) {
  for (const id of [pref, fallback]) {
    const t = ALL_THEMES.find((x) => x.id === id);
    if (t && (t.available(date) || unlocked.includes(t.id))) return t;
  }
  return byId('classic');
}

/** Key for "this holiday, this year" — each holiday is announced once a year. */
export const seasonKey = (t, date) => `${t.id}-${date.getFullYear()}`;
