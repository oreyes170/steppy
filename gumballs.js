// The Theme Machine: themes she wins from a gumball machine with skip tickets.
//
// ─── Adding a theme ────────────────────────────────────────────────────────────
// Add an entry to GUMBALLS below. Only these fields are needed:
//   id         unique, lowercase, no spaces (never change it once she might own it)
//   set        which collection it belongs to (an id from SETS; add a new set there)
//   name       shown in the app
//   emoji      the emoji inside the gumball
//   colors     { bg, primary, accent, ink }: page background, main colour, second
//              colour, and text colour. Set `dark: true` for a dark theme.
//   emojis     3–5 emoji for confetti, big-goal rain and background decorations
//   cheer      short line under "BIG GOAL!"
//   pitch      one sentence describing it (shown when she wins it)
//   motion     optional: 'fall' makes the background emoji drift down instead of float
//   colors.blend  optional: second colour for the title/button gradient, when blending
//                 primary into accent would go muddy (e.g. red into green)
// Everything else (cards, borders, buttons, status colours, the header icon tint)
// is worked out from those colours.
// ──────────────────────────────────────────────────────────────────────────────

export const SPIN_COST = 1; // a random theme from any collection
export const SET_SPIN_COST = 2; // a random theme from a collection she picks
export const UNLOCK_AT = 3; // the machine appears the first time she has this many tickets

export const SETS = [
  { id: 'taylor', name: 'Taylor Swift eras', emoji: '🎤' },
  { id: 'broadway-2025', name: 'Broadway magnets · 2025', emoji: '🧲' },
  { id: 'broadway-2026', name: 'Broadway magnets · 2026', emoji: '🧲' },
];

export const GUMBALLS = [
  {
    id: 'ts-debut', set: 'taylor', name: 'Debut', revealName: 'The Debut era', emoji: '🦋',
    colors: { bg: '#e8f5f0', primary: '#2f9e8f', accent: '#e9b949', ink: '#1f3b35' },
    emojis: ['🦋', '🎸', '💚', '🌼'], cheer: 'Butterflies! 🦋',
    pitch: 'Teal and sunshine gold, with butterflies and guitars.',
  },
  {
    id: 'ts-fearless', set: 'taylor', name: 'Fearless', revealName: 'The Fearless era', emoji: '✨',
    colors: { bg: '#fbf4de', primary: '#b8901a', accent: '#e9c46a', ink: '#3d3214' },
    emojis: ['✨', '👑', '💛', '🎻'], cheer: 'Fearless! ✨',
    pitch: 'All gold and sparkle, with crowns and fiddles.',
  },
  {
    id: 'ts-speaknow', set: 'taylor', name: 'Speak Now', revealName: 'The Speak Now era', emoji: '🏰',
    colors: { bg: '#f3eafa', primary: '#7b3fa0', accent: '#d08be8', ink: '#2e1840' },
    emojis: ['💜', '🏰', '🎆', '👗'], cheer: 'Fireworks! 🎆',
    pitch: 'Royal purple, castles, ball gowns and fireworks.',
  },
  {
    id: 'ts-red', set: 'taylor', name: 'Red', revealName: 'The Red era', emoji: '🧣',
    colors: { bg: '#fcecec', primary: '#b3122e', accent: '#e8735f', ink: '#3a0b13' },
    emojis: ['❤️', '🧣', '🍁', '🍂'], cheer: 'Red-hot! ❤️',
    pitch: 'Deep reds, cozy scarves and falling maple leaves.',
  },
  {
    id: 'ts-1989', set: 'taylor', name: '1989', revealName: 'The 1989 era', emoji: '🕊️',
    colors: { bg: '#ebf5fc', primary: '#3f95cf', accent: '#e8c58a', ink: '#163247' },
    emojis: ['🕊️', '📸', '🌊', '✨'], cheer: 'Picture perfect! 📸',
    pitch: 'Sky blue and sand, with polaroids, waves and birds.',
  },
  {
    id: 'ts-reputation', set: 'taylor', name: 'Reputation', revealName: 'The Reputation era', emoji: '🐍',
    colors: { bg: '#111111', primary: '#cfcfcf', accent: '#7a7a7a', ink: '#f2f2f2' }, dark: true,
    emojis: ['🐍', '🖤', '⛓️', '🌑'], cheer: 'Legendary! 🐍',
    pitch: 'Black and silver, with snakes and chains. Very dramatic.',
  },
  {
    id: 'ts-lover', set: 'taylor', name: 'Lover', revealName: 'The Lover era', emoji: '💖',
    colors: { bg: '#fdecf4', primary: '#e8619f', accent: '#6cc3ea', ink: '#4a1d33' },
    emojis: ['💖', '🌈', '🦋', '💌'], cheer: 'So much love! 💖',
    pitch: 'Cotton-candy pink and blue, hearts and rainbows.',
  },
  {
    id: 'ts-folklore', set: 'taylor', name: 'Folklore', revealName: 'The Folklore era', emoji: '🌲',
    colors: { bg: '#efefed', primary: '#6d6d68', accent: '#9aa392', ink: '#2b2b28' },
    emojis: ['🌲', '🤍', '🌫️', '🍃'], cheer: 'Woodland wonder! 🌲',
    pitch: 'Soft greys and misty forest greens.',
  },
  {
    id: 'ts-evermore', set: 'taylor', name: 'Evermore', revealName: 'The Evermore era', emoji: '🍂',
    colors: { bg: '#f6ede1', primary: '#a8571f', accent: '#6b4a2b', ink: '#3a2414' },
    emojis: ['🍂', '🧥', '🌾', '🕯️'], cheer: 'Cozy season! 🍂',
    pitch: 'Burnt orange and brown, flannel, candles and wheat.',
  },
  {
    id: 'ts-midnights', set: 'taylor', name: 'Midnights', revealName: 'The Midnights era', emoji: '🌙',
    colors: { bg: '#121833', primary: '#a397f5', accent: '#e6c068', ink: '#ece8ff' }, dark: true,
    emojis: ['🌙', '⭐', '🕰️', '💎'], cheer: 'Midnight magic! 🌙',
    pitch: 'Midnight blue and lavender, with moons, stars and clocks.',
  },
  {
    id: 'ts-ttpd', set: 'taylor', name: 'The Tortured Poets Department', revealName: 'The Tortured Poets Department era', emoji: '✒️',
    colors: { bg: '#f5f1e9', primary: '#5e564e', accent: '#b8ab97', ink: '#2f2b27' },
    emojis: ['🤍', '✒️', '📜', '🕊️'], cheer: 'Poetic! ✒️',
    pitch: 'Parchment and ink, with quills and scrolls.',
  },
  {
    id: 'ts-showgirl', set: 'taylor', name: 'The Life of a Showgirl', revealName: 'The Life of a Showgirl era', emoji: '🪩',
    colors: { bg: '#fff3e8', primary: '#ec6417', accent: '#3fc4a2', ink: '#3d1d08' },
    emojis: ['💃', '🪩', '✨', '🧡'], cheer: 'Showstopper! 🪩',
    pitch: 'Bright orange and mint, glitter and disco balls.',
  },

  // ── 🧲 Broadway magnets · 2025: shows we saw together ──
  {
    id: 'bway25-roblake', set: 'broadway-2025', name: 'Rob Lake Magic', emoji: '🐸',
    colors: { bg: '#fdf1ee', primary: '#c8202f', accent: '#4cb944', ink: '#3a1215', blend: '#ef5b5b' },
    emojis: ['🐸', '🎩', '🪄', '🃏', '✨'], cheer: 'Pure magic! 🪄',
    pitch: 'Theater-curtain red, Muppet green and spotlight gold. Magic, with special guests.',
  },
  {
    id: 'bway25-outsiders', set: 'broadway-2025', name: 'The Outsiders', emoji: '🌅',
    colors: { bg: '#fbf0e1', primary: '#d9762b', accent: '#3d5a80', ink: '#3a2614', blend: '#f2b04a' },
    emojis: ['🌅', '🏎️', '🥊', '📖'], cheer: 'Golden day! 🌅',
    pitch: 'Golden-hour orange, dusty sepia and denim blue. Sunsets in 1960s Tulsa.',
  },
  {
    id: 'bway25-realwomen', set: 'broadway-2025', name: 'Real Women Have Curves', emoji: '🧵',
    colors: { bg: '#fff0f6', primary: '#e0287d', accent: '#2bb5a8', ink: '#3a1430', blend: '#f7a23b' },
    emojis: ['🧵', '🪡', '👗', '💃', '🌵'], cheer: 'Sew fabulous! 👗',
    pitch: 'Hot pink, sunshine yellow and turquoise, with thread, needles and dresses.',
  },
  {
    id: 'bway25-deadoutlaw', set: 'broadway-2025', name: 'Dead Outlaw', emoji: '💀',
    colors: { bg: '#141110', primary: '#c8322b', accent: '#d9b77e', ink: '#f4ece0', blend: '#e0703a' }, dark: true,
    emojis: ['💀', '🤠', '🌵', '🎸'], cheer: 'Wanted: one big goal! 🤠',
    pitch: 'Black, outlaw red and desert sand. A rock-and-roll Wild West.',
  },
  {
    id: 'bway25-sunsetblvd', set: 'broadway-2025', name: 'Sunset Blvd.', emoji: '🎬',
    colors: { bg: '#0b0b0b', primary: '#d7192e', accent: '#f2f2f2', ink: '#f5f5f5', blend: '#ff5a6a' }, dark: true,
    emojis: ['🎬', '🎞️', '🌴', '❤️'], cheer: 'Ready for your close-up! 🎬',
    pitch: 'Stark black and blood red. Lights, camera, Hollywood.',
  },
  {
    id: 'bway25-cursedchild', set: 'broadway-2025', name: 'Harry Potter and the Cursed Child', emoji: '⚡',
    colors: { bg: '#0d0d12', primary: '#c9a443', accent: '#7a6a4a', ink: '#f3ead6', blend: '#f0d27a' }, dark: true,
    emojis: ['⚡', '🪄', '🦉', '🧹'], cheer: 'Magical! ⚡',
    pitch: 'Midnight black and burnished gold, with wands, owls and broomsticks.',
  },
  {
    id: 'bway25-mindplay', set: 'broadway-2025', name: 'Mindplay', emoji: '🔮',
    colors: { bg: '#1c1029', primary: '#9b6bd6', accent: '#e2b858', ink: '#f2e9ff', blend: '#c9a2ff' }, dark: true,
    emojis: ['🔮', '🧠', '🃏', '👁️'], cheer: 'I knew you’d do it! 🔮',
    pitch: 'Deep plum, mysterious violet and candlelight gold. Vinny already knows what you’re thinking.',
  },

  // ── 🧲 Broadway magnets · 2026: shows we saw together ──
  {
    id: 'bway26-schmigadoon', set: 'broadway-2026', name: 'Schmigadoon!', emoji: '🧺',
    colors: { bg: '#eef6fd', primary: '#d63a3a', accent: '#5aa846', ink: '#2b2a3a', blend: '#f08a4b' },
    emojis: ['🧺', '🌈', '🌸', '🏡'], cheer: 'A musical miracle! 🌈',
    pitch: 'Sky blue, red gingham and green grass. A picnic in a magical town.',
  },
  {
    id: 'bway26-allout', set: 'broadway-2026', name: 'All Out', emoji: '🏆',
    colors: { bg: '#f7e7bd', primary: '#b8862b', accent: '#3a8fb7', ink: '#3b2414', blend: '#7a4a1e' },
    emojis: ['🏆', '🐎', '🎤', '😂', '✨'], cheer: 'Going all out! 🏆',
    pitch: 'Mustard gold and chocolate brown, with trophies, laughs and a horse.',
  },
  {
    id: 'bway26-hellskitchen', set: 'broadway-2026', name: 'Hell’s Kitchen', emoji: '🎹',
    colors: { bg: '#fff1d6', primary: '#e2701a', accent: '#2f5fae', ink: '#3a1c08', blend: '#f2a93b' },
    emojis: ['🎹', '🗽', '🌆', '🎶'], cheer: 'Keys to the city! 🎹',
    pitch: 'Sunset orange and denim blue, with pianos over the New York skyline.',
  },
  {
    id: 'bway26-twostrangers', set: 'broadway-2026', name: 'Two Strangers', emoji: '🎂',
    colors: { bg: '#eaf3fb', primary: '#3d7cc9', accent: '#f2a7b8', ink: '#1e2f45' },
    emojis: ['🎂', '📦', '🏙️', '✈️'], cheer: 'Piece of cake! 🎂',
    pitch: 'Sky blue and cake-box pink. Carrying a cake across New York.',
  },
  {
    id: 'bway26-burnout', set: 'broadway-2026', name: 'Burnout Paradise', emoji: '🏃',
    colors: { bg: '#fff8c4', primary: '#2b5cc9', accent: '#ff5fa2', ink: '#1d2340' },
    emojis: ['🏃', '🎈', '🎉', '💦'], cheer: 'Keep running! 🏃',
    pitch: 'Bright yellow, graffiti blue and tutu pink, with balloons and treadmills.',
  },
  {
    id: 'bway26-ohmary', set: 'broadway-2026', name: 'Oh, Mary!', emoji: '🎩',
    colors: { bg: '#f8eab0', primary: '#c8282b', accent: '#2a2a2a', ink: '#2a1a12' },
    emojis: ['🎩', '🍸', '🎭', '🖤'], cheer: 'Oh, Mary! 🎩',
    pitch: 'Vintage mustard, poster red and black, with top hats and cocktails.',
  },
  {
    id: 'bway26-everybrilliantthing', set: 'broadway-2026', name: 'Every Brilliant Thing', emoji: '📝',
    colors: { bg: '#e9ecf5', primary: '#3c4a7a', accent: '#f29a2e', ink: '#1e2440', blend: '#7083c4' },
    emojis: ['📝', '☀️', '🍦', '✨'], motion: 'fall', cheer: 'Another brilliant thing! ✨',
    pitch: 'Slate blue and orange tape, with little notes drifting down like a list of brilliant things.',
  },
  {
    id: 'bway26-cats', set: 'broadway-2026', name: 'Cats: The Jellicle Ball', emoji: '🐈‍⬛',
    colors: { bg: '#fff6a6', primary: '#1c1c1c', accent: '#a8a8a8', ink: '#1c1c1c' },
    emojis: ['🐈‍⬛', '🪩', '💃', '✨'], cheer: 'A purr-fect day! 🐈‍⬛',
    pitch: 'Highlighter yellow, black and disco silver. Time for the ball.',
  },
  {
    id: 'bway26-heathers', set: 'broadway-2026', name: 'Heathers', emoji: '🎀',
    colors: { bg: '#0e1a3a', primary: '#e0222f', accent: '#f5d03b', ink: '#f3f1ff' }, dark: true,
    emojis: ['🎀', '❤️', '💚', '💛'], cheer: 'Totally iconic! 🎀',
    pitch: 'Deep spotlight blue with red, green and yellow, one for each Heather.',
  },
  {
    id: 'bway26-intheheights', set: 'broadway-2026', name: 'In the Heights', emoji: '🌉',
    colors: { bg: '#fbf6ea', primary: '#e0402a', accent: '#f5d63a', ink: '#2a3e9e' },
    emojis: ['🎆', '✨', '🌉', '⭐', '🍧'], cheer: 'Lighting up the sky! 🎆',
    pitch: 'Cream paper, brushy red and royal blue, with fireworks over the bridge. (City Center)',
  },
];

// ---------- colour helpers ----------

const hex = (h) => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
/** Blend a toward b by t (0..1). */
export const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
const luminance = (h) => {
  const [r, g, b] = hex(h).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Full set of CSS colour variables, worked out from a theme's four colours. */
export function cssVars({ colors: c, dark }) {
  const status = { regular: '#4ecdc4', big: '#ffb627', skip: '#a78bfa' };
  const tint = (col) => mix(col, c.primary, 0.2);
  const v = dark
    ? {
        bg: c.bg,
        'bg-2': mix(c.bg, c.primary, 0.14),
        card: mix(c.bg, '#ffffff', 0.07),
        text: c.ink,
        muted: mix(c.ink, c.bg, 0.4),
        line: mix(c.bg, '#ffffff', 0.14),
        'regular-soft': mix(c.bg, status.regular, 0.25),
        'big-soft': mix(c.bg, status.big, 0.25),
        'skip-soft': mix(c.bg, status.skip, 0.25),
        missed: mix(c.bg, '#ffffff', 0.3),
        'missed-soft': mix(c.bg, '#ffffff', 0.1),
        shadow: '0 6px 22px rgba(0, 0, 0, 0.45)',
      }
    : {
        bg: c.bg,
        'bg-2': mix(c.bg, c.primary, 0.1),
        card: mix('#ffffff', c.bg, 0.25),
        text: c.ink,
        muted: mix(c.ink, c.bg, 0.45),
        line: mix(c.bg, c.primary, 0.18),
        'regular-soft': mix(c.bg, tint(status.regular), 0.22),
        'big-soft': mix(c.bg, tint(status.big), 0.25),
        'skip-soft': mix(c.bg, tint(status.skip), 0.2),
        missed: mix(c.bg, c.ink, 0.25),
        'missed-soft': mix(c.bg, c.ink, 0.07),
        shadow: `0 6px 22px ${mix(c.bg, c.primary, 0.5)}33, 0 1px 3px rgba(0, 0, 0, 0.06)`,
      };
  return {
    ...v,
    primary: c.primary,
    'primary-2': c.blend || c.accent,
    'primary-ink': luminance(c.primary) > 0.45 ? '#1b1b1b' : '#ffffff',
    regular: tint(status.regular),
    big: tint(status.big),
    skip: tint(status.skip),
  };
}

/** Turn a gumball definition into a full theme object (same shape as themes.js). */
export function buildTheme(g) {
  const c = g.colors;
  return {
    id: g.id,
    name: g.name,
    revealName: g.revealName || g.name,
    emoji: g.emoji,
    set: g.set,
    gumball: true,
    available: () => true,
    dark: !!g.dark,
    vars: cssVars(g),
    themeColor: c.bg,
    ball: c.primary,
    iconTint: g.dark ? mix(c.primary, c.bg, 0.55) : mix(c.primary, '#000000', 0.25),
    confetti: [c.primary, c.accent, mix(c.primary, '#ffffff', 0.45), mix(c.accent, '#ffffff', 0.4), mix(c.primary, c.ink, 0.4)],
    confettiEmoji: g.emojis,
    rain: g.emojis,
    ambient: { emojis: g.emojis, motion: g.motion || 'float', count: g.motion === 'fall' ? 12 : 9 },
    greetingEmoji: g.emoji,
    bigSub: g.cheer,
    pitch: g.pitch,
  };
}

export const GUMBALL_THEMES = GUMBALLS.map(buildTheme);

// ---------- machine rules ----------

export const setById = (id) => SETS.find((s) => s.id === id);

/** Collections she has discovered (owns at least one theme from). */
export function revealedSets(owned) {
  return SETS.filter((s) => GUMBALLS.some((g) => g.set === s.id && owned.includes(g.id)));
}

export function setProgress(setId, owned) {
  const inSet = GUMBALLS.filter((g) => g.set === setId);
  return { owned: inSet.filter((g) => owned.includes(g.id)).length, total: inSet.length };
}

export const hiddenSetsRemain = (owned) => revealedSets(owned).length < SETS.length;

/** Themes she can still win (optionally from one collection). */
export function pool(owned, setId = null) {
  return GUMBALLS.filter((g) => !owned.includes(g.id) && (!setId || g.set === setId));
}

/** Pick the next gumball. Never a repeat. Returns a gumball id, or null if none are left. */
export function spin(owned, setId = null, rand = Math.random) {
  const p = pool(owned, setId);
  if (!p.length) return null;
  return p[Math.floor(rand() * p.length)].id;
}
