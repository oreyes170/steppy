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
//   confetti   optional: exact confetti colours (otherwise made from the theme colours)
//   ball       optional: gumball colour (otherwise the main colour)
//   intro      optional: 'race' plays the 🚦 3-2-1-GO countdown before the reveal
//   note       optional: an extra line shown under the title when she wins it
//   head       optional: a heading font from styles.css (typewriter, hand, slab, deco, didot,
//              bodoni, storybook, sign, script, chalk, blackletter, pixel)
//   style      optional: a special look defined in styles.css (html[data-style='…'])
//   rip        optional: true for a place that's closed. Winning it gets a quiet candle-lit moment
//   colors.blend  optional: second colour for the title/button gradient, when blending
//                 primary into accent would go muddy (e.g. red into green)
// Everything else (cards, borders, buttons, status colours, the header icon tint)
// is worked out from those colours.
// ──────────────────────────────────────────────────────────────────────────────

export const SPIN_COST = 1; // a random theme from any collection
export const SET_SPIN_COST = 2; // a random theme from a collection she picks
export const UNLOCK_AT = 3; // the machine appears if she ever holds this many tickets at once…
// …or as soon as she earns her next ticket (see checkMachineUnlock in app.js)

export const SETS = [
  { id: 'taylor', name: 'The Eras Walking Tour', emoji: '🎤' },
  { id: 'broadway-2024', name: 'Broadway magnets · 2024', emoji: '🧲' },
  { id: 'broadway-2025', name: 'Broadway magnets · 2025', emoji: '🧲' },
  { id: 'broadway-2026', name: 'Broadway magnets · 2026', emoji: '🧲' },
  { id: 'live', name: 'Live & in Person', emoji: '🎙️' },
  { id: 'concerts', name: 'Encore', emoji: '🎸' },
  { id: 'treats', name: 'Treat yourself', emoji: '🍟' },
  // intro: 'race' plays a 🚦 3-2-1-GO countdown before the reveal
  { id: 'mariokart', name: 'Mario Kart', emoji: '🏁', intro: 'race' },
  { id: 'fyp', name: 'For You Page', emoji: '📱' },
  { id: 'random', name: 'So Random', emoji: '🎲' },
  { id: 'games', name: 'Game Night', emoji: '🎮' },
  { id: 'books', name: 'Bookworm', emoji: '📚' },
  { id: 'animals', name: 'Critters', emoji: '🐾' },
  { id: 'sports', name: 'Game Day', emoji: '🏟️' },
  { id: 'tv', name: 'Couch Time', emoji: '📺' },
];

// `held: true` keeps a theme out of the machine (and out of the app) until it's released.
const ALL_GUMBALLS = [
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
    id: 'ts-1989', head: 'hand', set: 'taylor', name: '1989', revealName: 'The 1989 era', emoji: '🕊️',
    colors: { bg: '#ebf5fc', primary: '#3f95cf', accent: '#e8c58a', ink: '#163247' },
    emojis: ['🕊️', '📸', '🌊', '✨'], cheer: 'Picture perfect! 📸',
    pitch: 'Sky blue and sand, with polaroids, waves and birds.',
  },
  {
    id: 'ts-reputation', head: 'blackletter', set: 'taylor', name: 'Reputation', revealName: 'The Reputation era', emoji: '🐍',
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
    id: 'ts-folklore', head: 'storybook', set: 'taylor', name: 'Folklore', revealName: 'The Folklore era', emoji: '🌲',
    colors: { bg: '#efefed', primary: '#6d6d68', accent: '#9aa392', ink: '#2b2b28' },
    emojis: ['🌲', '🤍', '🌫️', '🍃'], cheer: 'Woodland wonder! 🌲',
    pitch: 'Soft greys and misty forest greens.',
  },
  {
    id: 'ts-evermore', head: 'storybook', set: 'taylor', name: 'Evermore', revealName: 'The Evermore era', emoji: '🍂',
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
    id: 'ts-ttpd', head: 'typewriter', style: 'mono', set: 'taylor', name: 'The Tortured Poets Department', revealName: 'The Tortured Poets Department era', emoji: '✒️',
    colors: { bg: '#f6f6f4', primary: '#1a1a1a', accent: '#8a8a8a', ink: '#111111', blend: '#4a4a4a' },
    confetti: ['#111111', '#ffffff', '#8a8a8a', '#d0d0d0', '#4a4a4a'],
    emojis: ['🤍', '✒️', '⌨️', '📜', '🕊️'], cheer: 'Poetic! ✒️',
    pitch: 'Fully black and white, like ink on a typed page.',
  },
  {
    id: 'ts-showgirl', head: 'bodoni', set: 'taylor', name: 'The Life of a Showgirl', revealName: 'The Life of a Showgirl era', emoji: '🪩',
    colors: { bg: '#fff3e8', primary: '#ec6417', accent: '#3fc4a2', ink: '#3d1d08' },
    emojis: ['💃', '🪩', '✨', '🧡'], cheer: 'Showstopper! 🪩',
    pitch: 'Bright orange and mint, glitter and disco balls.',
  },
  {
    // A stowaway in the Taylor Swift eras. 👀
    id: 'ts-blackparade', set: 'taylor', name: 'The Black Parade', revealName: 'The Black Parade era', emoji: '🥁', ball: '#1a1a1a',
    colors: { bg: '#0d0d0d', primary: '#e8e8e8', accent: '#8a8a8a', ink: '#f2f2f2', blend: '#b0b0b0' }, dark: true,
    emojis: ['🥁', '🎺', '💀', '🖤'], cheer: 'Marching on! 🥁',
    note: 'Hey… how did that get here? 👀',
    pitch: 'Black, bone white and smoky grey, with a marching band.',
  },

  // ── 🧲 Broadway magnets · 2024: shows we saw together (Sunset Blvd. is further down) ──
  {
    id: 'bway24-maybehappyending', set: 'broadway-2024', name: 'Maybe Happy Ending', emoji: '🤖',
    colors: { bg: '#1a1438', primary: '#ff9e6b', accent: '#2fd0d6', ink: '#f6efff', blend: '#e46fd0' }, dark: true,
    emojis: ['🤖', '💡', '✨', '💌', '🎶'], cheer: 'Beep boop, big goal! 🤖',
    pitch: 'Deep violet night with a neon glow and cyan circuitry.',
  },
  {
    id: 'bway24-backtothefuture', set: 'broadway-2024', name: 'Back to the Future', emoji: '🕰️',
    colors: { bg: '#10172e', primary: '#ff7a1a', accent: '#36c5f0', ink: '#f2f4ff', blend: '#ffb53a' }, dark: true,
    emojis: ['⚡', '🚗', '🕰️', '🔥', '🎸'], cheer: 'Up to 88 mph! 🚗',
    pitch: 'Night-sky navy, flame orange and lightning blue. Mind the clock tower.',
  },
  {
    id: 'bway24-waterforelephants', set: 'broadway-2024', name: 'Water for Elephants', emoji: '🐘',
    colors: { bg: '#f8efdd', primary: '#b82a2a', accent: '#d4a537', ink: '#3a2416', blend: '#e0503a' },
    emojis: ['🐘', '🎪', '🎠', '🤹'], cheer: 'Under the big top! 🎪',
    pitch: 'Vintage cream, circus-tent red and gold. Run away with the circus.',
  },
  {
    id: 'bway24-illinoise', set: 'broadway-2024', name: 'Illinoise', emoji: '🦋',
    colors: { bg: '#0f2236', primary: '#f2e23a', accent: '#33c3e0', ink: '#eaf2f8', blend: '#f7f08a' }, dark: true,
    emojis: ['🦋', '💡', '⭐', '🎺'], cheer: 'Dancing through the Midwest! 🎺',
    pitch: 'Dusky navy, glowing yellow and moth-wing cyan.',
  },
  {
    id: 'bway24-kimberlyakimbo', set: 'broadway-2024', name: 'Kimberly Akimbo', emoji: '🌈',
    colors: { bg: '#e2f5f5', primary: '#0f9ea3', accent: '#f2c531', ink: '#1d2f6e', blend: '#1d3a9e' },
    confetti: ['#e8382e', '#f5862b', '#f2c531', '#2e9e4f', '#2c5fc4', '#0f9ea3'],
    emojis: ['🌈', '⭐', '⛸️', '🎂'], cheer: 'Totally rad! ⛸️',
    pitch: 'Bright teal, navy and a rainbow of stars. The confetti is a rainbow too.',
  },
  {
    id: 'bway24-gatsby', head: 'deco', set: 'broadway-2024', name: 'The Great Gatsby', emoji: '🥂',
    colors: { bg: '#0c0c0c', primary: '#d4af37', accent: '#2fa36b', ink: '#f5ecd8', blend: '#f2d77a' }, dark: true,
    emojis: ['🥂', '🍾', '💚', '✨', '🎷'], cheer: 'Roaring success! 🥂',
    pitch: 'Art-deco black and gold, with a green light across the bay.',
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
    id: 'bway25-deadoutlaw', head: 'slab', set: 'broadway-2025', name: 'Dead Outlaw', emoji: '💀',
    colors: { bg: '#141110', primary: '#c8322b', accent: '#d9b77e', ink: '#f4ece0', blend: '#e0703a' }, dark: true,
    emojis: ['💀', '🤠', '🌵', '🎸'], cheer: 'Wanted: one big goal! 🤠',
    pitch: 'Black, outlaw red and desert sand. A rock-and-roll Wild West.',
  },
  {
    // Seen in 2024. The id keeps '25' on purpose: ids never change once she might own one.
    id: 'bway25-sunsetblvd', head: 'helvetica', title: 'STEPPY BLVD.', set: 'broadway-2024', name: 'Sunset Blvd.', emoji: '🎬',
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
    id: 'bway25-mindplay', head: 'condensed', style: 'mindplay', set: 'broadway-2025', name: 'Mindplay', emoji: '🧠', ball: '#d4a63a', iconTint: '#3a3a3a',
    colors: { bg: '#0d0d0d', primary: '#d4a63a', accent: '#8a8a8a', ink: '#f2f2f2', blend: '#f0d27a', wash: '#808080' }, dark: true,
    confetti: ['#d4a63a', '#f0d27a', '#ffffff', '#8a8a8a', '#2a2a2a'],
    emojis: ['🧠', '💭', '👁️', '✨'], cheer: 'Called it! 🧠', note: 'I predicted you’d meet your goal. 🧠',
    pitch: 'Black-and-white noir in a single spotlight, with gold lettering. What are you thinking?',
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
    id: 'bway26-everybrilliantthing', head: 'hand', set: 'broadway-2026', name: 'Every Brilliant Thing', emoji: '📝',
    colors: { bg: '#e9ecf5', primary: '#3c4a7a', accent: '#f29a2e', ink: '#1e2440', blend: '#7083c4' },
    emojis: ['📝', '☀️', '🍦', '✨'], motion: 'fall', cheer: 'Another brilliant thing! ✨',
    pitch: 'Slate blue and orange tape, with little notes drifting down like a list of brilliant things.',
  },
  {
    id: 'bway26-cats', set: 'broadway-2026', name: 'Cats: The Jellicle Ball', emoji: '🪩', style: 'disco', ball: '#b9bec8',
    colors: { bg: '#fff6a6', primary: '#1c1c1c', accent: '#a8a8a8', ink: '#1c1c1c' },
    confetti: ['#c8ccd4', '#ffffff', '#1c1c1c', '#f2e600', '#8a8f99'],
    emojis: ['🪩', '🐈‍⬛', '🪩', '💃', '✨'], cheer: 'A purr-fect day! 🪩',
    pitch: 'Highlighter yellow, black and a giant mirror ball throwing light everywhere. Time for the ball.',
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
  // ── 🍟 Treat yourself: spots we go to a lot (and ones she loves) ──
  {
    id: 'treat-dairyqueen', set: 'treats', name: 'Dairy Queen', emoji: '🍦',
    colors: { bg: '#fff3f2', primary: '#e2231a', accent: '#1e5aa8', ink: '#2a1a1a', blend: '#ff6b5e' },
    emojis: ['🍦', '🍒', '🍫'], cheer: 'Blizzard of steps! 🍦',
    pitch: 'Cherry red and ice-cream-truck blue.',
  },
  {
    id: 'treat-traderjoes', set: 'treats', name: 'Trader Joe’s', emoji: '🌺',
    colors: { bg: '#f7efe3', primary: '#c8202f', accent: '#1f3a68', ink: '#2b1e14', blend: '#e85a3a' },
    emojis: ['🛒', '🌺', '🥟', '🌻'], cheer: 'Ahoy, big goal! ⚓',
    pitch: 'Red, nautical navy and kraft paper, with flowers and dumplings.',
  },
  {
    id: 'treat-tacobell', set: 'treats', name: 'Taco Bell', emoji: '🌮',
    colors: { bg: '#f5ecfa', primary: '#702082', accent: '#a77bca', ink: '#2a0f35', blend: '#c04fd0' },
    emojis: ['🌮', '🔔', '🌯', '🔥'], cheer: 'Taco ’bout a big day! 🌮',
    pitch: 'Late-night purple and magenta. Tacos, bells and fire sauce.',
  },
  {
    id: 'treat-mcdonalds', set: 'treats', name: 'McDonald’s', emoji: '🍟',
    colors: { bg: '#fff7e0', primary: '#da291c', accent: '#ffc72c', ink: '#27251f' },
    emojis: ['🍟', '🍔', '🥤'], cheer: 'Fry-day feeling! 🍟',
    pitch: 'Ketchup red and golden-fry yellow.',
  },
  {
    id: 'treat-chipcity', set: 'treats', name: 'Chip City', emoji: '🍪', rip: true, ball: '#8fcbed',
    colors: { bg: '#cfe9f7', primary: '#1c1c1c', accent: '#f4ead0', ink: '#1c1c1c', blend: '#4a4a4a' },
    emojis: ['🍪', '🕯️', '🥛'], cheer: 'Gone but not forgotten 🍪',
    pitch: 'Sky blue and cookie-dough cream. Gone but never forgotten.',
  },
  {
    id: 'treat-shakeshack', set: 'treats', name: 'Shake Shack', emoji: '🍔',
    colors: { bg: '#eef6ea', primary: '#1f8c3b', accent: '#1c1c1c', ink: '#1c2a1c', blend: '#6cc04a' },
    emojis: ['🍔', '🥤', '🌭'], cheer: 'Shake it! 🥤',
    pitch: 'Shack green and black, with burgers and shakes.',
  },
  {
    id: 'treat-fiveguys', set: 'treats', name: 'Five Guys', emoji: '🥜',
    colors: { bg: '#fbf5f0', primary: '#d22030', accent: '#ffffff', ink: '#2a1414', blend: '#ff5a5a' },
    confetti: ['#d22030', '#ffffff', '#d22030', '#f2f2f2', '#b51a28'],
    emojis: ['🍔', '🥜', '🍟'], cheer: 'Five stars! 🥜',
    pitch: 'Red-and-white checkerboard. Bring the peanuts.',
  },
  {
    id: 'treat-popeyes', set: 'treats', name: 'Popeyes', emoji: '🍗',
    colors: { bg: '#fff2e8', primary: '#f15a22', accent: '#c8102e', ink: '#3a1a0a', blend: '#ff9a3c' },
    emojis: ['🍗', '🌶️', '🧈'], cheer: 'Spicy! 🌶️',
    pitch: 'Fiery orange and red, with chicken, spice and biscuits.',
  },
  {
    id: 'treat-aldi', set: 'treats', name: 'Aldi', emoji: '🪙',
    colors: { bg: '#eef1fb', primary: '#00005f', accent: '#f37021', ink: '#0f1440', blend: '#2f3fbf' },
    confetti: ['#00005f', '#f37021', '#fcc016', '#2f9fd9', '#d6271b'],
    emojis: ['🛒', '🪙', '🥨'], cheer: 'Quarter well spent! 🪙',
    pitch: 'Navy, orange and yellow. Don’t forget the cart quarter.',
  },
  {
    id: 'treat-misterdips', set: 'treats', name: 'Mister Dips', emoji: '😛', ball: '#f6d54a',
    colors: { bg: '#fbe47a', primary: '#1a1a1a', accent: '#ffffff', ink: '#1a1a1a', blend: '#4a4a4a' },
    confetti: ['#1a1a1a', '#ffffff', '#f6d54a', '#7a4a2a', '#ffffff'],
    emojis: ['🍦', '😛', '🍔', '🍫'], cheer: 'Dip dip hooray! 🍦',
    pitch: 'Sunny yellow, black and white, with a cheeky soft-serve grin.',
  },
  {
    id: 'treat-dominos', set: 'treats', name: 'Domino’s', emoji: '🍕',
    colors: { bg: '#eef5fa', primary: '#006491', accent: '#e31837', ink: '#10283a', blend: '#2b8fc7' },
    emojis: ['🍕', '🎲', '📦'], cheer: 'Delivered! 🍕',
    pitch: 'Domino blue and red. Pizza’s here!',
  },
  {
    id: 'treat-olivegarden', set: 'treats', name: 'Olive Garden', emoji: '🍝',
    colors: { bg: '#f5f1e4', primary: '#5c7a29', accent: '#7a1f2b', ink: '#2e2a18', blend: '#8fa848' },
    emojis: ['🫒', '🍝', '🥖', '🍷'], cheer: 'Breadstick-tacular! 🥖',
    pitch: 'Olive green, burgundy and warm tan. Unlimited breadsticks energy.',
  },
  {
    id: 'treat-juniors', set: 'treats', name: 'Junior’s', emoji: '🍰',
    colors: { bg: '#fff3e6', primary: '#e2531b', accent: '#c8102e', ink: '#3a1a0a', blend: '#ff8a3a' },
    emojis: ['🍰', '🍒', '🌃'], cheer: 'Worth every bite! 🍰',
    pitch: 'Neon orange and red. Cheesecake under the Brooklyn lights.',
  },
  {
    id: 'treat-littlecupcake', set: 'treats', name: 'Little Cupcake Bakeshop', emoji: '🧁',
    colors: { bg: '#fff0f5', primary: '#ef5e9e', accent: '#1a1a1a', ink: '#1a1a1a', blend: '#ff9cc5' },
    confetti: ['#ef5e9e', '#ffffff', '#1a1a1a', '#ffb3d1', '#ffffff'],
    emojis: ['🧁', '🎂', '🍰'], cheer: 'Sweet! 🧁',
    pitch: 'Pink, white and black, with cupcakes and cake.',
  },
  {
    id: 'treat-wholefoods', set: 'treats', name: 'Whole Foods', emoji: '🥑',
    colors: { bg: '#eef5ef', primary: '#00674b', accent: '#c9a978', ink: '#1a2e22', blend: '#3a9a6e' },
    emojis: ['🥑', '🥬', '🌿'], cheer: 'Fresh! 🥑',
    pitch: 'Deep green and kraft tan, with avocados and greens.',
  },
  {
    id: 'treat-target', set: 'treats', name: 'Target', emoji: '🎯',
    colors: { bg: '#ffffff', primary: '#cc0000', accent: '#ffffff', ink: '#2a1010', blend: '#ff4d4d' },
    confetti: ['#cc0000', '#ffffff', '#cc0000', '#ff6b6b', '#ffffff'],
    emojis: ['🎯', '🛒', '🐶'], cheer: 'Bullseye! 🎯',
    pitch: 'Bright red and crisp white. You came in for one thing…',
  },
  {
    id: 'treat-cvs', set: 'treats', name: 'CVS', emoji: '🧾',
    colors: { bg: '#fbf6ea', primary: '#cc0000', accent: '#6b6b6b', ink: '#2a2a2a', blend: '#e84a4a' },
    emojis: ['🧾', '💊', '🧴'], cheer: 'A streak longer than the receipt! 🧾',
    pitch: 'Red and receipt-paper cream. Very long receipts included.',
  },
  {
    id: 'treat-dunkin', set: 'treats', name: 'Dunkin’', emoji: '🍩',
    colors: { bg: '#fff3ea', primary: '#ff671f', accent: '#da1884', ink: '#3a1a10' },
    emojis: ['🍩', '☕', '🧁'], cheer: 'Donut stop now! 🍩',
    pitch: 'Orange and hot pink, with donuts and iced coffee.',
  },
  {
    id: 'treat-7eleven', set: 'treats', name: '7-Eleven', emoji: '🥤',
    colors: { bg: '#eef7f2', primary: '#008163', accent: '#f47b20', ink: '#10281e', blend: '#2fb07f' },
    confetti: ['#008163', '#f47b20', '#ee2526', '#ffffff'],
    emojis: ['🥤', '🌭', '🍕'], cheer: 'Slurp-tacular! 🥤',
    pitch: 'Green, orange and red stripes. Grab a giant slushie.',
  },
  {
    // where we got to know each other 💕
    id: 'treat-maddogbeans', set: 'treats', name: 'Mad Dog & Beans', emoji: '🤠', head: 'slab',
    colors: { bg: '#fbf1e2', primary: '#b8321f', accent: '#2a9d8f', ink: '#3a1f12', blend: '#e0602a' },
    confetti: ['#b8321f', '#2a9d8f', '#e0a050', '#f6e2c0', '#6b3a1f'],
    emojis: ['🤠', '🌮', '🌵', '🫘', '🐶'], cheer: 'Yeehaw! 🤠', note: 'Where it all started 💕🤠',
    pitch: 'Chili red, turquoise and desert tan. Tacos with a little cowboy swagger.',
  },
  // ── 🏁 Mario Kart racers ──
  {
    id: 'mk-mario', set: 'mariokart', name: 'Mario', emoji: '⭐',
    colors: { bg: '#fff1f0', primary: '#e52521', accent: '#0047bb', ink: '#2a1414', blend: '#ff5a4f' },
    confetti: ['#e52521', '#0047bb', '#ffd23f', '#ffffff', '#1a1a1a'],
    emojis: ['⭐', '🍄', '🏎️', '🪙', '🏁'], cheer: 'Wahoo! ⭐',
    pitch: 'Mario red, overall blue and coin gold. Grab a star!',
  },
  {
    id: 'mk-luigi', set: 'mariokart', name: 'Luigi', emoji: '👻',
    colors: { bg: '#eef8ef', primary: '#1b9a3e', accent: '#1f2e6b', ink: '#12261a', blend: '#4cc46a' },
    confetti: ['#1b9a3e', '#1f2e6b', '#ffffff', '#4cc46a', '#1a1a1a'],
    emojis: ['💚', '👻', '🔦', '⭐', '🏁'], cheer: 'Green machine! 💚',
    pitch: 'Luigi green and navy, with a flashlight for the haunted mansion.',
  },
  {
    id: 'mk-yoshi', set: 'mariokart', name: 'Yoshi', emoji: '🥚',
    colors: { bg: '#f1fbe9', primary: '#4cb02e', accent: '#e2312d', ink: '#1a2e12', blend: '#8fd640' },
    confetti: ['#4cb02e', '#ffffff', '#e2312d', '#f28c28', '#8fd640'],
    emojis: ['🥚', '🦖', '🍎', '🍉', '🏁'], cheer: 'Egg-cellent! 🥚',
    pitch: 'Lime green, white and red, with spotted eggs and fruit.',
  },
  {
    id: 'mk-toad', set: 'mariokart', name: 'Toad', emoji: '🍄', ball: '#e8202a',
    colors: { bg: '#f3f6ff', primary: '#2a5bd7', accent: '#e8202a', ink: '#14203f', blend: '#5b8cff' },
    confetti: ['#e8202a', '#ffffff', '#e8202a', '#ffffff', '#2a5bd7'],
    emojis: ['🍄', '🔴', '⚪', '🏎️', '🏁'], cheer: 'Fun-gi! 🍄',
    pitch: 'White with red spots and a blue vest.',
  },
  {
    id: 'mk-peach', set: 'mariokart', name: 'Peach', emoji: '👑',
    colors: { bg: '#fff0f6', primary: '#d9548a', accent: '#f2c14e', ink: '#4a1d33', blend: '#f58bb5' },
    confetti: ['#f9b6cf', '#f2c14e', '#3fa9f5', '#ffffff', '#f27aa8'],
    emojis: ['👑', '💗', '🍑', '🏰', '🏁'], cheer: 'Royally done! 👑',
    pitch: 'Soft pastel pink, crown gold and a sparkle of blue.',
  },
  {
    id: 'mk-toadette', set: 'mariokart', name: 'Toadette', emoji: '🌸',
    colors: { bg: '#fff0f8', primary: '#e8288a', accent: '#ff9ccc', ink: '#3a0f2a', blend: '#ff6fb5' },
    confetti: ['#e8288a', '#ffffff', '#e8288a', '#ffffff', '#ff9ccc'],
    emojis: ['🌸', '🍄', '💗', '✨', '🏁'], cheer: 'Pink power! 💗',
    pitch: 'Hot magenta with white polka dots.',
  },
  {
    id: 'mk-daisy', set: 'mariokart', name: 'Daisy', emoji: '🌼',
    colors: { bg: '#fff6e0', primary: '#f08a1c', accent: '#4caf50', ink: '#3a2208', blend: '#ffc93a' },
    emojis: ['🌼', '🧡', '👑', '🎾', '🏁'], cheer: 'Flower power! 🌼',
    pitch: 'Sunny orange and yellow with a leaf-green sparkle.',
  },
  {
    id: 'mk-donkeykong', set: 'mariokart', name: 'Donkey Kong', emoji: '🍌',
    colors: { bg: '#f6ecdf', primary: '#8b4a1c', accent: '#d32f2f', ink: '#2e1a0c', blend: '#c27a3a' },
    confetti: ['#8b4a1c', '#d32f2f', '#ffd23f', '#5aa846', '#c27a3a'],
    emojis: ['🍌', '🦍', '🛢️', '🌴', '🏁'], cheer: 'Banana-rama! 🍌',
    pitch: 'Jungle brown, red tie and banana yellow, with barrels.',
  },
  {
    id: 'mk-wario', set: 'mariokart', name: 'Wario', emoji: '🧄', ball: '#ffd400',
    colors: { bg: '#1e0f2e', primary: '#ffd400', accent: '#8e44ad', ink: '#fff6cc', blend: '#fff07a' }, dark: true,
    confetti: ['#ffd400', '#8e44ad', '#ffffff', '#fff07a', '#b57edc'],
    emojis: ['🧄', '💰', '💜', '⚡', '🏁'], cheer: 'Ka-ching! 💰',
    pitch: 'Deep purple and loud yellow. Extra garlic, extra coins.',
  },
  // ── 📱 For You Page: memes we quote (each one's quote shows when she wins it) ──
  {
    id: 'fyp-avocadothanks', set: 'fyp', name: 'An avocado? Thanks', emoji: '🥑',
    colors: { bg: '#f3f6e8', primary: '#5a7d2a', accent: '#7a4a2a', ink: '#22301a', blend: '#8fb04a' },
    emojis: ['🥑', '🙂', '👍'], cheer: 'An avocado… thanks 🥑', note: 'An avocado… thanks 🥑',
    pitch: 'Avocado green and pit brown. Very polite.',
  },
  {
    id: 'fyp-roadwork', head: 'sign', set: 'fyp', name: 'Road work ahead', emoji: '🚧',
    colors: { bg: '#fff4e0', primary: '#e07a00', accent: '#1c1c1c', ink: '#1f1f1f', blend: '#ffb627' },
    confetti: ['#f28c00', '#1c1c1c', '#ffffff', '#8a8a8a', '#ffb627'],
    emojis: ['🚧', '🚗', '🦺'], cheer: 'Road work ahead? I sure hope it does 🚧', note: 'Road work ahead? Uh, yeah, I sure hope it does 🚧',
    pitch: 'Caution orange, black and asphalt grey.',
  },
  {
    id: 'fyp-burntnugget', set: 'fyp', name: 'Burnt chicken nugget', emoji: '🍗',
    colors: { bg: '#fbf0dc', primary: '#b8741f', accent: '#3a2414', ink: '#2e1d0e', blend: '#e0a03a' },
    confetti: ['#b8741f', '#e0a03a', '#3a2414', '#f5d58a', '#6b3a1a'],
    emojis: ['🍗', '🔥', '🥲'], cheer: 'Because you love yourself! 🍗', note: 'Because you love yourself! 🍗',
    pitch: 'Toasty golden brown with a charred edge.',
  },
  {
    id: 'fyp-chickens', set: 'fyp', name: 'Look at all those chickens', emoji: '🐔',
    colors: { bg: '#eef7fd', primary: '#c8322b', accent: '#f2c94c', ink: '#2a1c14', blend: '#e86a4a' },
    emojis: ['🐔', '🐓', '🐣', '🌾'], cheer: 'Look at all those chickens! 🐔', note: 'Look at all those chickens! 🐔',
    pitch: 'Barnyard red, straw yellow and big blue sky. So many chickens.',
  },
  {
    id: 'fyp-freshavocado', set: 'fyp', name: 'Freeesh avocado', emoji: '✨',
    colors: { bg: '#fff8e6', primary: '#d71920', accent: '#ffc425', ink: '#2a1410', blend: '#f26a2a' },
    confetti: ['#d71920', '#ffc425', '#5aa846', '#ffffff', '#f26a2a'],
    emojis: ['🥑', '✨', '🌮'], cheer: 'Freeeesh avocado! ✨', note: 'Freeeesh avocado! ✨',
    pitch: 'Del Taco red and sunshine gold, with a fresh avocado.',
  },
  {
    id: 'fyp-hurricanetortilla', set: 'fyp', name: 'Hurricane tortilla', emoji: '🌀',
    colors: { bg: '#e9eef3', primary: '#4a6a8a', accent: '#e3c58f', ink: '#1c2a38', blend: '#7a9ec0' },
    emojis: ['🌀', '🫓', '💨', '🌧️'], motion: 'fall', cheer: 'Hurricane tortilla! 🌀', note: 'Hurricane tortilla! 🌀',
    pitch: 'Stormy grey-blue with flying tortillas.',
  },
  {
    id: 'fyp-roommates', set: 'fyp', name: 'They were roommates', emoji: '😱',
    colors: { bg: '#fff0f5', primary: '#e8338a', accent: '#f2d4b8', ink: '#3a1028', blend: '#ff7ab8' },
    emojis: ['😱', '🏠', '🛏️', '💕'], cheer: 'Oh my god, they were roommates 😱', note: 'Oh my god, they were roommates 😱',
    pitch: 'Gasp-worthy hot pink and cozy apartment cream.',
  },
  {
    id: 'fyp-bagagwa', set: 'fyp', name: 'Bagagwa', emoji: '😼', ball: '#1a1a22',
    colors: { bg: '#0a0a0f', primary: '#f5d020', accent: '#7a3fbf', ink: '#f2eee0', blend: '#fff07a' }, dark: true,
    emojis: ['🐈‍⬛', '🕯️', '👁️', '🌑'], cheer: 'You summoned Bagagwa 🕯️', note: 'You summoned Bagagwa 🕯️',
    pitch: 'Pitch black, glowing cat eyes and candlelight purple.',
  },
  {
    id: 'fyp-weeweewee', set: 'fyp', name: 'Wee wee wee', emoji: '🐱',
    colors: { bg: '#fff5ee', primary: '#e0607e', accent: '#f6c9a8', ink: '#4a2a2a', blend: '#f59ab0' },
    emojis: ['🐱', '🐾', '🍼', '💕'], cheer: 'Wee wee wee! 🐱', note: 'Wee wee wee! 🐱',
    pitch: 'Soft kitten peach and little pink nose.',
  },
  {
    id: 'fyp-chillybean', set: 'fyp', name: 'Chilly bean potato', emoji: '🥔', ball: '#a9dcf2',
    colors: { bg: '#eef8fd', primary: '#2f86c4', accent: '#a9dcf2', ink: '#1b3244', blend: '#6cc2ec' },
    confetti: ['#2f86c4', '#a9dcf2', '#ffffff', '#c9a26a', '#6cc2ec'],
    emojis: ['🥔', '🥶', '❄️', '🧊'], motion: 'fall', cheer: 'Chilly bean potato! 🥶', note: 'Chilly bean potato! 🥔🥶',
    pitch: 'Frosty blue, snowflakes falling and one very cold little potato.',
  },
  // ── 🎲 So Random: one-offs that don't fit anywhere else ──
  // (Kindle, Bookshelf, The Library and Libby live in 📚 Bookworm; ids keep their old 'rand-' prefix)
  {
    id: 'rand-kindle', set: 'books', name: 'Kindle', emoji: '📖', style: 'kindle',
    colors: { bg: '#f4f1ea', primary: '#1f1d1a', accent: '#8a867e', ink: '#1f1d1a', blend: '#4a4741' },
    confetti: ['#2b2b2b', '#f2f0ea', '#8a8a8a', '#d9d6cc', '#ffffff'],
    emojis: ['📖', '📚', '☕', '🔖'], cheer: 'Page turner! 📖', note: 'Just one more chapter… 📖',
    pitch: 'True black and white e-ink, warm paper, book fonts and crisp shadows.',
  },
  {
    id: 'rand-chunk', head: 'pixel', style: 'gigapet', set: 'animals', name: 'Chunk', emoji: '🐶', ball: '#6a2fb8', iconTint: '#4a1f8a',
    colors: { bg: '#5b2a96', primary: '#2f8a1a', accent: '#ffd23a', ink: '#1c2414', blend: '#5ccf3a' },
    confetti: ['#6a2fb8', '#5ccf3a', '#ffd23a', '#ff6fb5', '#cfd6c0'],
    emojis: ['🐶', '🦴', '💜', '🐾'], cheer: 'Chunk is so proud of you! 🐶', note: 'Chunk missed you! 🐶💜',
    pitch: 'The real Giga Pet: purple 90s shell, LCD screens with pixel shadows, and green buttons.',
  },
  {
    id: 'rand-chunk-og', head: 'pixel', style: 'tamagotchi', set: 'animals', name: 'Original Chunk', revealName: 'The original Chunk',
    emoji: '🥚', ball: '#1e3a9a', iconTint: '#16286e',
    colors: { bg: '#14246a', primary: '#2a4fb0', accent: '#e6b84a', ink: '#23261a', blend: '#5a7ad8' },
    confetti: ['#1e3a9a', '#e6b84a', '#cfe4f4', '#8fd0c8', '#ffffff'],
    emojis: ['🥚', '👽', '🛸', '⭐', '🌙'], cheer: 'Chunk is all grown up! 👽', note: 'Before the Giga Pet, there was a little egg. Hi again, Chunk! 🥚',
    pitch: 'The first Chunk: a glittery night-sky shell with gold stars, and a gold-framed LCD screen.',
  },
  {
    id: 'rand-animalcrossing', set: 'animals', name: 'Animal Crossing', emoji: '🍃',
    colors: { bg: '#f6f4e4', primary: '#3f9a52', accent: '#7cc6e8', ink: '#4a3420', blend: '#8fd06a' },
    confetti: ['#3f9a52', '#7cc6e8', '#f2c94c', '#e8655a', '#8fd06a'],
    emojis: ['🍃', '🍎', '🐟', '🦝', '🔔'], cheer: 'Ka-ching, bells! 🔔', note: 'Welcome to your island! 🏝️',
    pitch: 'Leafy green, island sky blue and cozy cream, with warm brown text.',
  },
  {
    id: 'rand-stitch', set: 'animals', name: 'Stitch', emoji: '🌺',
    colors: { bg: '#eef5ff', primary: '#3f6fd8', accent: '#ff7eb3', ink: '#14254a', blend: '#7aa2ff' },
    confetti: ['#3f6fd8', '#7aa2ff', '#ff7eb3', '#2fbfa8', '#ffd25e'],
    emojis: ['🌺', '🏄', '🌊', '🍍', '💙'], cheer: 'Ohana means you never quit! 💙', note: 'Aloha, little blue alien 🌺',
    pitch: 'Stitch blue and hibiscus pink, with surfboards, waves and pineapples.',
  },
  {
    id: 'rand-bookshelf', set: 'books', name: 'Bookshelf', emoji: '📚', head: 'storybook',
    colors: { bg: '#f6efe1', primary: '#7a1f2b', accent: '#2f5a3e', ink: '#2e1e14', blend: '#b0874a' },
    confetti: ['#7a1f2b', '#2f5a3e', '#c9a24a', '#f6efe1', '#4a2a1a'],
    emojis: ['📚', '📖', '🕯️', '☕', '🔖'], cheer: 'Another chapter conquered! 📖', note: 'Ahh… that new-book smell 📚',
    pitch: 'A cozy reading nook: oxblood leather, forest green, cream pages and gold foil.',
  },
  {
    id: 'rand-library', set: 'books', name: 'The Library', emoji: '🤫', head: 'typewriter', ball: '#a8743f',
    colors: { bg: '#f7ecd2', primary: '#8a5a2b', accent: '#c8322b', ink: '#33230f', blend: '#c08a52' },
    confetti: ['#8a5a2b', '#f2e2b8', '#c8322b', '#5a3a1a', '#e8d29a'],
    emojis: ['📚', '🤫', '🗂️', '🪪', '📕'], cheer: 'Overdue for a celebration! 📚', note: 'Shhh… you found the library 🤫',
    pitch: 'Warm oak shelves, manila library cards and a red due-date stamp.',
  },
  {
    id: 'rand-libby', set: 'books', name: 'Libby', emoji: '🎧',
    colors: { bg: '#eaf6f5', primary: '#1f8a8a', accent: '#f0745a', ink: '#123536', blend: '#4cc0b5' },
    confetti: ['#1f8a8a', '#4cc0b5', '#f0745a', '#ffffff', '#ffd27a'],
    emojis: ['📱', '📚', '🎧', '🔖'], cheer: 'Checked out and crushed it! 📚', note: 'Your hold is ready! 📚',
    pitch: 'Soft teal and warm coral. Audiobooks for the walk!',
  },
  {
    id: 'books-goodreads', set: 'books', name: 'Goodreads', emoji: '⭐',
    colors: { bg: '#f4f1ea', primary: '#382110', accent: '#409d69', ink: '#2a1a0c', blend: '#7a5a3a' },
    confetti: ['#382110', '#409d69', '#f4c542', '#e9e5cd', '#8a6a4a'],
    emojis: ['⭐', '📚', '📈', '🔖'], cheer: 'Reading challenge: on track! 📈', note: 'Added to Want to Read ⭐',
    pitch: 'Cozy beige and coffee brown, with that green Want to Read button.',
  },
  {
    id: 'rand-bronxzoo', set: 'animals', name: 'Bronx Zoo', emoji: '🦁',
    colors: { bg: '#f3f1e2', primary: '#2f6b3a', accent: '#e0a52a', ink: '#23301c', blend: '#6a9a3a' },
    confetti: ['#2f6b3a', '#e0a52a', '#a86a3a', '#6a9a3a', '#f3e2b0'],
    emojis: ['🦁', '🦒', '🐘', '🦍', '🐧'], cheer: 'Roar-some! 🦁', note: 'Welcome to the wild side! 🦁',
    pitch: 'Jungle green and savanna gold, with lions, giraffes, gorillas and penguins.',
  },

  // ── 🏟️ Game Day: teams we root for ──
  {
    id: 'sport-curacao', set: 'sports', name: 'Curaçao', emoji: '⚽', ball: '#1f4fbf',
    colors: { bg: '#eef3ff', primary: '#1f4fbf', accent: '#f5c518', ink: '#0f1f4a', blend: '#4a7cf0' },
    confetti: ['#1f4fbf', '#f5c518', '#ffffff', '#4a7cf0', '#ffe27a'],
    emojis: ['⚽', '🇨🇼', '🌴', '💙'], cheer: 'GOOOOL! ⚽', note: 'Bon bini! ⚽',
    pitch: 'Caribbean royal blue and sunshine yellow, like the flag.',
  },
  {
    id: 'sport-patriots', set: 'sports', name: 'Patriots', emoji: '🏈', ball: '#c60c30',
    colors: { bg: '#0b1a33', primary: '#e0263f', accent: '#b0b7bc', ink: '#f1f4f8', blend: '#ff6a7a' }, dark: true,
    confetti: ['#c60c30', '#ffffff', '#b0b7bc', '#1f3a6a', '#e0263f'],
    emojis: ['🏈', '⭐', '🇺🇸', '🏆'], cheer: 'Touchdown! 🏈', note: 'Go Pats! 🏈',
    pitch: 'Patriots navy, red and silver.',
  },
  {
    id: 'sport-uconn', head: 'varsity', set: 'sports', name: 'UConn', emoji: '🏀', ball: '#0e1a4a',
    colors: { bg: '#f4f6fb', primary: '#0e1a4a', accent: '#9aa3b5', ink: '#0e1a4a', blend: '#3a4f9a' },
    confetti: ['#0e1a4a', '#ffffff', '#9aa3b5', '#3a4f9a', '#e8ecf5'],
    emojis: ['🏀', '🐺', '🏆', '🐾'], cheer: 'Nothing but net! 🏀', note: 'Go Huskies! 🐾',
    pitch: 'Crisp white with Husky navy and silver.',
  },
  {
    id: 'sport-fordham', head: 'varsity', set: 'sports', name: 'Fordham', emoji: '🐏',
    colors: { bg: '#fbf1f4', primary: '#860038', accent: '#b8a07a', ink: '#33101c', blend: '#c2335e' },
    confetti: ['#860038', '#ffffff', '#c2335e', '#e8d5dc', '#5a0026'],
    emojis: ['🐏', '🏈', '🏟️', '🍂'], cheer: 'Ram tough! 🏈', note: 'Go Rams! 🐏',
    pitch: 'Fordham maroon and white. Bronx football Saturdays.',
  },
  {
    id: 'sport-dartmouth', head: 'varsity', set: 'sports', name: 'Dartmouth', emoji: '🌲',
    colors: { bg: '#eef6f1', primary: '#00693e', accent: '#a7c4b3', ink: '#0d2a1c', blend: '#2f9a64' },
    confetti: ['#00693e', '#ffffff', '#2f9a64', '#cfe4d7', '#004d2d'],
    emojis: ['🌲', '🏈', '🏟️', '❄️'], cheer: 'Touchdown, Big Green! 🏈', note: 'Go Big Green! 🌲',
    pitch: 'Dartmouth green and white, straight from the North Woods.',
  },
  {
    id: 'sport-tunesquad', set: 'sports', name: 'Tune Squad', emoji: '🥕', ball: '#f47b20',
    colors: { bg: '#fff4ea', primary: '#e8661a', accent: '#2a6fd6', ink: '#3a1c08', blend: '#ffa04a' },
    confetti: ['#f47b20', '#ffffff', '#2a6fd6', '#ffc28a', '#ffd84a'],
    emojis: ['🏀', '🐰', '🥕', '🪐', '🚀'], cheer: 'Out of this world! 🪐', note: 'Tune Squad, assemble! 🐰🏀',
    pitch: 'Tune Squad orange and white with a dash of blue. Basketball from outer space.',
  },
  {
    id: 'sport-globetrotters', set: 'sports', name: 'Harlem Globetrotters', emoji: '🌍', ball: '#d21f32',
    colors: { bg: '#f5f8ff', primary: '#d21f32', accent: '#1f4fbf', ink: '#14203f', blend: '#ff5a6a' },
    confetti: ['#d21f32', '#ffffff', '#1f4fbf', '#ff8a96', '#7aa2ff'],
    emojis: ['🏀', '🌍', '⭐', '🤹'], cheer: 'Trick shot! 🏀✨', note: 'Showtime! 🌍🏀',
    pitch: 'Stars-and-stripes red, white and royal blue. Pure showtime.',
  },
  {
    id: 'sport-bananas', set: 'sports', name: 'Savannah Bananas', emoji: '🍌', ball: '#ffd21f',
    colors: { bg: '#fffbe0', primary: '#9a7400', accent: '#2f8f3a', ink: '#2a2408', blend: '#e0b300' },
    confetti: ['#ffd21f', '#2f8f3a', '#ffffff', '#ffe98a', '#1a1a1a'],
    emojis: ['🍌', '⚾', '🕺', '🎉'], cheer: 'Home run, bananas! 🍌', note: 'Banana Ball time! 🍌⚾',
    pitch: 'Banana yellow and leaf green. Baseball, but make it a party.',
  },
  {
    id: 'sport-liberty', set: 'sports', name: 'New York Liberty', emoji: '🗽', ball: '#6ecdb2',
    colors: { bg: '#0f1412', primary: '#6ecdb2', accent: '#c8743a', ink: '#eefaf6', blend: '#a8ead6',
      status: { regular: '#6ecdb2', big: '#c8743a', skip: '#8a9a94' } }, dark: true,
    confetti: ['#6ecdb2', '#c8743a', '#ffffff', '#1a1a1a', '#a8ead6'],
    emojis: ['🗽', '🏀', '🐘', '🏆'], cheer: 'Nothing but net! 🏀', note: 'Go Libs! 🗽🏀',
    pitch: 'Seafoam green, black and a touch of copper, straight from Brooklyn.',
  },

  // ── 🎮 Game Night: NYT games (ids keep their old 'rand-'/'puz-' prefixes) ──
  {
    id: 'rand-wordle', set: 'games', name: 'Wordle', emoji: '🟩', ball: '#6aaa64',
    colors: { bg: '#ffffff', primary: '#538d4e', accent: '#c9b458', ink: '#121213', blend: '#6aaa64' },
    confetti: ['#6aaa64', '#c9b458', '#787c7e', '#ffffff', '#538d4e'],
    emojis: ['🟩', '🟨', '⬜', '🔤'], cheer: 'Magnificent! 🟩', note: '🟩🟩🟩🟩🟩 Got it!',
    pitch: 'Green, yellow and grey tiles. Five letters, six tries.',
  },
  {
    id: 'rand-crossword', set: 'games', name: 'Crossword', emoji: '✏️', head: 'didot', ball: '#1a1a1a',
    colors: { bg: '#fafaf7', primary: '#111111', accent: '#8a8a8a', ink: '#111111', blend: '#4a4a4a' },
    confetti: ['#111111', '#ffffff', '#8a8a8a', '#d6d6d0', '#111111'],
    emojis: ['✏️', '📰', '🧩', '☕'], cheer: 'Puzzle solved! ✏️', note: '1 Across: you. (3 letters) ✏️',
    pitch: 'Black and white squares and newspaper headlines, with a pencil and coffee.',
  },

  // ── 📺 Couch Time: shows we watch together ──
  {
    id: 'tv-marbleruns', set: 'tv', name: 'Jelle’s Marble Runs', emoji: '🟣', ball: '#7b3fd8',
    colors: { bg: '#f1f6ff', primary: '#6a3fd8', accent: '#ff7a3a', ink: '#1c1640', blend: '#3fa0ff' },
    confetti: ['#e8344e', '#3fa0ff', '#2fbf6a', '#ffcc33', '#7b3fd8', '#ff7a3a'],
    emojis: ['🔴', '🔵', '🟢', '🟡', '🏁', '🏆'], cheer: 'Marble-ous! 🏆', note: 'And they’re off! 🏁',
    pitch: 'Rainbow marbles racing down the track.',
  },
  {
    id: 'tv-thefloor', set: 'tv', name: 'The Floor', emoji: '⏱️', ball: '#1f8fe0',
    colors: { bg: '#0a0f24', primary: '#3fd0ff', accent: '#ffcc33', ink: '#eef6ff', blend: '#8ae6ff' }, dark: true,
    confetti: ['#3fd0ff', '#ffcc33', '#ffffff', '#1f6fd6', '#8ae6ff'],
    emojis: ['🟦', '⏱️', '🏆', '🎤'], cheer: 'Duel won! ⏱️', note: 'You’ve conquered the Floor! 🟦',
    pitch: 'A dark stage with glowing blue tiles and a ticking clock.',
  },
  {
    id: 'tv-bakeoff', set: 'tv', name: 'Bake Off', revealName: 'The Great British Bake Off', emoji: '🎂',
    colors: { bg: '#fdf6f0', primary: '#d8577a', accent: '#5aaac8', ink: '#3a1f2a', blend: '#f08aa8' },
    confetti: ['#f4a7bd', '#9fd3e8', '#fff1a8', '#c8e6c0', '#ffffff', '#d8577a'],
    emojis: ['🎂', '🧁', '🍰', '⛺', '🇬🇧'], cheer: 'Star Baker! ⭐', note: 'On your marks, get set… BAKE! 🧁',
    pitch: 'Pastel bunting, a white tent and lots of cake.',
  },
  {
    id: 'tv-taskmaster', set: 'tv', name: 'Taskmaster', emoji: '✉️', head: 'typewriter', style: 'taskmaster', ball: '#c8102e', iconTint: '#8a0c1c',
    colors: { bg: '#141414', primary: '#d6a93e', accent: '#c8102e', ink: '#f6f1e8', blend: '#f2d27e', wash: '#8a0c1c',
      status: { regular: '#e0485a', big: '#d6a93e', skip: '#9a9a9a' } }, dark: true,
    confetti: ['#d6a93e', '#c8102e', '#ffffff', '#141414', '#f2d27e'],
    emojis: ['✉️', '👑', '🏆', '⏱️'], cheer: 'Five points! 🏆', note: 'Your task: hit your step goal. Your time starts now. ✉️',
    pitch: 'A red studio, black suits and two gold thrones. The tasks are absurd.',
  },
  {
    id: 'tv-dwts', set: 'tv', name: 'Dancing with the Stars', emoji: '🪩', style: 'ballroom', head: 'dwts', ball: '#7a4cff',
    colors: { bg: '#120a36', primary: '#9a6bff', accent: '#3d7bff', ink: '#f2eeff', blend: '#4f8bff',
      status: { regular: '#3d7bff', big: '#c56bff', skip: '#8a8fb0' } }, dark: true,
    confetti: ['#9a6bff', '#3d7bff', '#e0d6ff', '#ffffff', '#ff6bd8'],
    emojis: ['🪩', '💃', '🕺', '✨', '🏆'], cheer: 'Perfect 10s across the board! 🪩',
    note: 'The mirror ball is spinning. Grab a partner and hit the floor. 💃',
    pitch: 'A purple and blue ballroom full of stars, chrome lettering and the mirror ball spinning overhead.',
  },
  {
    id: 'tv-savedbythebell', set: 'tv', name: 'Saved by the Bell', emoji: '🔔', ball: '#f2c230',
    colors: { bg: '#fff6e0', primary: '#d6338a', accent: '#1aa6a6', ink: '#2a1840', blend: '#7a3fd0' },
    confetti: ['#d6338a', '#1aa6a6', '#f2c230', '#7a3fd0', '#ffffff'],
    emojis: ['🔔', '📟', '🏫', '📼'], cheer: 'Straight A’s! 🔔', note: 'The bell rang. Class is out. Go walk. 🔔',
    pitch: 'Bayside in the 90s: hot pink, teal and squiggly yellow.',
  },
  {
    id: 'tv-pluribus', set: 'tv', name: 'Pluribus', emoji: '🌵', ball: '#e0a040',
    colors: { bg: '#fbf1e2', primary: '#c4571f', accent: '#2f8fa8', ink: '#2b1e14', blend: '#e0a040' },
    confetti: ['#c4571f', '#e0a040', '#2f8fa8', '#f6d9a8', '#ffffff'],
    emojis: ['🌵', '☀️', '🏜️', '😊'], cheer: 'Everyone agrees: big day! 😊', note: 'Albuquerque sun, desert sky. Out of many, one walk. 🌵',
    pitch: 'New Mexico desert at golden hour, under a big blue sky.',
  },
  {
    id: 'tv-wandavision', set: 'tv', name: 'WandaVision', emoji: '📺', head: 'script', ball: '#c8203a',
    colors: {
      bg: '#ececec', primary: '#c8203a', accent: '#5a5a5a', ink: '#1a1a1a', blend: '#8e1226', wash: '#7a7a7a',
      status: { regular: '#6a6a6a', big: '#c8203a', skip: '#a8a8a8' },
    }, iconTint: '#3a3a3a',
    confetti: ['#2a2a2a', '#6e6e6e', '#a8a8a8', '#dcdcdc', '#c8203a'],
    emojis: ['📺', '🎞️', '❤️', '🏡'], cheer: 'A very special episode! 📺', note: 'Black and white, then colour. Welcome to Westview. 📺',
    pitch: 'A black-and-white sitcom set, with scarlet magic breaking through.',
  },
  {
    id: 'tv-agatha', set: 'tv', name: 'Agatha All Along', emoji: '🔮', head: 'chalk', ball: '#5b2a86',
    colors: { bg: '#15101c', primary: '#a46ad8', accent: '#5fbf6a', ink: '#efe6f6', blend: '#c9a0f0' }, dark: true,
    confetti: ['#a46ad8', '#5fbf6a', '#3a1f55', '#efe6f6', '#c9a0f0'],
    emojis: ['🔮', '🧙‍♀️', '🌙', '🛣️'], cheer: 'Witchy big day! 🔮', note: 'The Road is long. Good thing you love a walk. 🔮',
    pitch: 'Midnight purple with a witchy green glow.',
  },
  {
    id: 'tv-visionquest', held: true, set: 'tv', name: 'VisionQuest', emoji: '👓', head: 'pixel', style: 'edith', ball: '#c23ab8', iconTint: '#1a8a9a',
    colors: { bg: '#2a0f4a', primary: '#3ad6e0', accent: '#e0553a', ink: '#f6e8ff', blend: '#ff7ad9' }, dark: true,
    confetti: ['#3ad6e0', '#ff7ad9', '#e0553a', '#8a5cff', '#ffffff'],
    emojis: ['👓', '✈️', '💾', '✨', '💜'], cheer: 'E.D.I.T.H. approves! 👓', note: 'E.D.I.T.H. is online. Today’s mission: your steps. 👓',
    pitch: 'E.D.I.T.H.’s screen: glowing magenta pixels and streams of tiny 0s and 1s, with her cyan suit and red hair.',
  },
  {
    id: 'tv-colin', set: 'tv', name: 'Colin from Accounts', emoji: '🐕', ball: '#c49a5a',
    colors: { bg: '#f3f8fb', primary: '#2a7fb8', accent: '#e07a3a', ink: '#1d2a33', blend: '#5bb0e0' },
    confetti: ['#2a7fb8', '#e07a3a', '#c49a5a', '#5bb0e0', '#ffffff'],
    emojis: ['🐕', '🦽', '🍺', '☀️'], cheer: 'Good dog, big day! 🐕', note: 'Sunny Sydney, and a scruffy dog who wants his walk. 🐕',
    pitch: 'Sydney sky blue with a sunburnt orange, and Colin.',
  },
  {
    id: 'tv-snl', set: 'tv', name: 'Saturday Night Live', emoji: '🎙️', head: 'deco', ball: '#e2b04a',
    colors: { bg: '#0e1424', primary: '#e2b04a', accent: '#e8475f', ink: '#f2ecdf', blend: '#f5d68a' }, dark: true,
    confetti: ['#e2b04a', '#e8475f', '#f2ecdf', '#3a4a7a', '#ffffff'],
    emojis: ['🎙️', '🌃', '🎭', '⭐'], cheer: 'Tonight’s host: you! ⭐', note: 'Studio 8H lights up. You’re hosting this week. 🎙️',
    pitch: 'Midnight in Manhattan: marquee gold, stage red and city lights.',
  },
  {
    id: 'puz-connections', set: 'games', name: 'Connections', emoji: '🟪', ball: '#ba81c5',
    colors: { bg: '#ffffff', primary: '#7a4a96', accent: '#a0c35a', ink: '#121212', blend: '#ba81c5' },
    confetti: ['#f9df6d', '#a0c35a', '#b0c4ef', '#ba81c5'],
    emojis: ['🟨', '🟩', '🟦', '🟪'], cheer: 'Perfect puzzle! 🟨🟩🟦🟪', note: 'One away… no wait, you got it! 🟪',
    pitch: 'Yellow, green, blue and purple: four groups of four.',
  },
  {
    id: 'puz-spellingbee', set: 'games', name: 'Spelling Bee', emoji: '🐝', ball: '#f7da21',
    colors: { bg: '#fffbea', primary: '#8a6d00', accent: '#9a9a9a', ink: '#1a1a1a', blend: '#d9b800' },
    confetti: ['#f7da21', '#e6e6e6', '#1a1a1a', '#ffe97a', '#ffffff'],
    emojis: ['🐝', '🍯', '🔠', '⭐'], cheer: 'Genius! 🐝', note: 'Queen Bee! 🐝',
    pitch: 'Honeycomb yellow and grey. How many words can you make?',
  },

  // ── 🎮 Game Night: games we played together ──
  {
    id: 'game-ittakestwo', set: 'games', name: 'It Takes Two', emoji: '💞',
    colors: { bg: '#fdf0f6', primary: '#b0408a', accent: '#5aa86a', ink: '#3a1430', blend: '#e07ab8' },
    confetti: ['#e07ab8', '#8a5ad8', '#5aa86a', '#ffd27a', '#ffffff'],
    emojis: ['💞', '📖', '🔨', '🌸'], cheer: 'Teamwork! 💞', note: 'Player 2 has joined 💞',
    pitch: 'Cozy pink and purple with leafy green. Better together.',
  },
  {
    id: 'game-awayout', set: 'games', name: 'A Way Out', emoji: '🔓', ball: '#e0702a',
    colors: { bg: '#11161c', primary: '#f08a3a', accent: '#6a8aa8', ink: '#eef2f6', blend: '#ffb06a' }, dark: true,
    confetti: ['#f08a3a', '#6a8aa8', '#c9d2dc', '#3a4a5a', '#ffffff'],
    emojis: ['🔓', '🚪', '🌲', '🚗'], cheer: 'We made it out! 🚪', note: 'Escape complete! 🔓',
    pitch: 'Gritty steel blue and jumpsuit orange. You can’t do it alone.',
  },
  {
    id: 'game-woollyworld', set: 'games', name: 'Yoshi’s Woolly World', emoji: '🧶', ball: '#7cc46a',
    colors: { bg: '#f3fbef', primary: '#3f9a3a', accent: '#f08ab0', ink: '#1f3a1c', blend: '#8ad46a' },
    confetti: ['#7cc46a', '#f08ab0', '#ffd27a', '#8ac8f0', '#ffffff'],
    emojis: ['🧶', '🥚', '🦖', '🧵'], cheer: 'Yarn-tastic! 🧶', note: 'Knit together with love 🧶',
    pitch: 'Soft yarn greens and pastels, all stitched by hand.',
  },
  {
    id: 'game-mariokart', set: 'games', name: 'Mario Kart', emoji: '🏁', intro: 'race', ball: '#1a1a1a',
    colors: { bg: '#fff5f2', primary: '#d8202a', accent: '#1a1a1a', ink: '#1f1414', blend: '#ff5a3a' },
    confetti: ['#d8202a', '#1a1a1a', '#ffffff', '#ffd23f', '#3fa0ff', '#2fbf6a', '#b06aff'],
    emojis: ['🏁', '🍄', '🍌', '🐢', '⭐'], cheer: 'First place! 🏆', note: 'Ready, set, GO! 🏁',
    pitch: 'Racing red and checkered flags, with a rainbow road of confetti.',
  },

  // ── 🎙️ Live & in Person: podcasts and shows we've seen live ──
  {
    id: 'live-mfm', set: 'live', name: 'My Favorite Murder', emoji: '🔦', head: 'typewriter', ball: '#1c1c1c',
    colors: { bg: '#141414', primary: '#e8476a', accent: '#f2c94c', ink: '#f4f0ec', blend: '#ff7a96' }, dark: true,
    confetti: ['#e8476a', '#f2c94c', '#ffffff', '#5a5a5a', '#ff7a96'],
    emojis: ['🔦', '🕵️‍♀️', '🐈', '🎙️'], cheer: 'Case closed! 🔦', note: 'Our favorite murder podcast, live! 🔦',
    pitch: 'True-crime black with a flashlight glow, crime-scene yellow and a hot pink twist.',
  },
  {
    id: 'live-blankcheck', set: 'live', name: 'Blank Check', emoji: '🎬', head: 'slab', ball: '#2f7a4f',
    colors: { bg: '#eef6ee', primary: '#2f7a4f', accent: '#1e3a6a', ink: '#1b2a22', blend: '#5aa874' },
    confetti: ['#2f7a4f', '#1e3a6a', '#cfe6d4', '#ffffff', '#5aa874'],
    emojis: ['🎬', '📝', '🍿', '💚'], cheer: 'Cash that blank check! 💸', note: 'Where it all started: our very first date! 🎬💚',
    pitch: 'Bank-check mint and fountain-pen navy, with a bucket of popcorn.',
  },
  {
    id: 'live-hdtgm', set: 'live', name: 'How Did This Get Made?', emoji: '📼', head: 'sign', ball: '#29b8ff',
    colors: { bg: '#0a1430', primary: '#29c4ff', accent: '#ff3d7f', ink: '#eef6ff', blend: '#7ae0ff' }, dark: true,
    confetti: ['#ff3d7f', '#29d4ff', '#ffe14a', '#ffffff', '#9a5cff'],
    emojis: ['📼', '🍿', '🤦', '🎞️'], cheer: 'How did you do that?! 📼', note: 'A truly terrible movie, live. We loved every minute. 📼',
    pitch: 'Late-night VHS glow: electric blue, a flash of hot pink and a lot of questions.',
  },
  {
    id: 'live-ringling', set: 'live', name: 'Ringling', emoji: '🎪', head: 'sign', ball: '#ff2bd6',
    colors: { bg: '#0d0a1f', primary: '#ff2bd6', accent: '#2bffe6', ink: '#ffffff', blend: '#ffe62b' }, dark: true,
    confetti: ['#ff2bd6', '#2bffe6', '#ffe62b', '#7a5cff', '#ffffff'],
    emojis: ['🎪', '🤸', '✨', '🎉'], cheer: 'Center ring! 🎪', note: 'Neon, acrobats and a whole lot of wow. 🎪',
    pitch: 'The new neon circus: glowing pink, cyan and yellow under the big top.',
  },

  // ── 🎸 Encore: concerts we've been to ──
  {
    id: 'concert-noahkahan', set: 'concerts', name: 'Noah Kahan', emoji: '🌲', head: 'hand', ball: '#4f6b3a',
    colors: { bg: '#f3efe6', primary: '#4f6b3a', accent: '#b5562a', ink: '#2a2a20', blend: '#7a9a5a' },
    confetti: ['#4f6b3a', '#b5562a', '#e6d8b8', '#7a9a5a', '#3a4a6a'],
    emojis: ['🌲', '🎸', '🍁', '🏔️'], cheer: 'New England strong! 🌲', note: 'The Great Divide tour! 🌲🎸',
    pitch: 'Flannel, pine green and a chilly Vermont autumn.',
  },
  {
    id: 'concert-shakira', set: 'concerts', name: 'Shakira', emoji: '💃', ball: '#ff3fa4',
    colors: { bg: '#2a0a3a', primary: '#ff3fa4', accent: '#8a3fff', ink: '#fff0fa', blend: '#ff8ad1' }, dark: true,
    confetti: ['#ff3fa4', '#8a3fff', '#ffd23a', '#ffffff', '#3fd0ff'],
    emojis: ['💃', '🐺', '💜', '✨'], cheer: '¡Qué bárbara! 💃', note: 'Las Mujeres Ya No Lloran tour! 💃',
    pitch: 'Hot pink and violet stage lights. Dance break!',
  },
  {
    id: 'concert-maggierogers', set: 'concerts', name: 'Maggie Rogers', emoji: '🌼', head: 'script', ball: '#b8402e',
    colors: { bg: '#fbf3ea', primary: '#b8402e', accent: '#3a5a8a', ink: '#2a1c18', blend: '#e07a52' },
    confetti: ['#b8402e', '#3a5a8a', '#f2d7a8', '#ffffff', '#e07a52'],
    emojis: ['🌼', '🎤', '🤠', '❤️'], cheer: 'Encore! 🎤', note: 'Maggie Rogers, live! 🌼',
    pitch: 'Sunbaked red, worn denim and wildflowers.',
  },
  {
    id: 'concert-poorunfortunatesouls', set: 'concerts', name: 'Poor Unfortunate Souls', emoji: '🧜‍♀️', ball: '#2fd0c0',
    colors: { bg: '#0c2a3a', primary: '#2fd0c0', accent: '#9a4fd0', ink: '#e8fbff', blend: '#7ae8dc' }, dark: true,
    confetti: ['#2fd0c0', '#9a4fd0', '#ffffff', '#ffb0d8', '#7ae8dc'],
    emojis: ['🧜‍♀️', '🐚', '🔱', '🫧'], motion: 'float', cheer: 'Making waves! 🌊', note: 'A Disney cover band, all dressed as mermaids! 🧜‍♀️',
    pitch: 'Deep sea teal and sea-witch purple, with bubbles rising.',
  },
  {
    id: 'concert-greenday', set: 'concerts', name: 'Green Day', emoji: '💣', head: 'helvetica', ball: '#d41a1a',
    colors: { bg: '#0e0e0e', primary: '#d41a1a', accent: '#ffffff', ink: '#f2f2f2', blend: '#ff4a4a' }, dark: true,
    confetti: ['#d41a1a', '#ffffff', '#1a1a1a', '#ff4a4a', '#8a8a8a'],
    emojis: ['💣', '❤️', '🎸', '🖤'], cheer: 'Rock on! 🎸', note: 'American Idiot, 20 years later! ❤️💣',
    pitch: 'Black, white and blood red. Turn it up.',
  },
  {
    id: 'concert-blink182', set: 'concerts', name: 'blink-182', emoji: '🐰', ball: '#e0307a',
    colors: { bg: '#fff3f8', primary: '#e0307a', accent: '#1a1a1a', ink: '#1a1a1a', blend: '#ff6fa8' },
    confetti: ['#e0307a', '#1a1a1a', '#ffffff', '#ff6fa8', '#3fd0ff'],
    emojis: ['🐰', '🎸', '🤘', '💗'], cheer: 'Pop punk power! 🤘', note: 'The One More Time tour! 🎸',
    pitch: 'Pop-punk pink and black. Skate shoes on.',
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
  // Optional: `wash` is the colour blended into backgrounds (defaults to primary);
  // `status` overrides the goal colours (e.g. a grayscale theme).
  const status = { regular: '#4ecdc4', big: '#ffb627', skip: '#a78bfa', ...(c.status || {}) };
  const wash = c.wash || c.primary;
  const tint = (col) => (c.status ? col : mix(col, c.primary, 0.2));
  const v = dark
    ? {
        bg: c.bg,
        'bg-2': mix(c.bg, wash, 0.14),
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
        'bg-2': mix(c.bg, wash, 0.1),
        card: mix('#ffffff', c.bg, 0.25),
        text: c.ink,
        muted: mix(c.ink, c.bg, 0.45),
        line: mix(c.bg, wash, 0.18),
        'regular-soft': mix(c.bg, tint(status.regular), 0.22),
        'big-soft': mix(c.bg, tint(status.big), 0.25),
        'skip-soft': mix(c.bg, tint(status.skip), 0.2),
        missed: mix(c.bg, c.ink, 0.25),
        'missed-soft': mix(c.bg, c.ink, 0.07),
        shadow: `0 6px 22px ${mix(c.bg, wash, 0.5)}33, 0 1px 3px rgba(0, 0, 0, 0.06)`,
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
    ball: g.ball || c.primary,
    iconTint: g.iconTint || (g.dark ? mix(c.primary, c.bg, 0.55) : mix(c.primary, '#000000', 0.25)),
    confetti: g.confetti || [c.primary, c.accent, mix(c.primary, '#ffffff', 0.45), mix(c.accent, '#ffffff', 0.4), mix(c.primary, c.ink, 0.4)],
    confettiEmoji: g.emojis,
    rain: g.emojis,
    ambient: { emojis: g.emojis, motion: g.motion || 'float', count: g.motion === 'fall' ? 12 : 9 },
    greetingEmoji: g.emoji,
    bigSub: g.cheer,
    pitch: g.pitch,
    rip: !!g.rip,
    intro: g.intro || '',
    note: g.note || '',
    style: g.style || '',
    head: g.head || '',
    title: g.title || '', // replaces the "Steppy" title while it's on
  };
}

export const GUMBALLS = ALL_GUMBALLS.filter((g) => !g.held);
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

// only collections that actually have themes in them count (So Random can be empty between additions)
export const hiddenSetsRemain = (owned) =>
  revealedSets(owned).length < SETS.filter((s) => GUMBALLS.some((g) => g.set === s.id)).length;

/** Themes she can still win (optionally from one collection). */
export function pool(owned, setId = null) {
  return GUMBALLS.filter((g) => !owned.includes(g.id) && (!setId || g.set === setId));
}

/** Her very first gumball is always a Taylor era (never the Black Parade stowaway), so the
 *  machine looks Eras-only until a second collection turns up as a surprise. */
export const FIRST_SET = 'taylor';
function firstPool(owned, setId) {
  if (owned.length || setId) return null;
  const p = pool(owned, FIRST_SET).filter((g) => g.id !== 'ts-blackparade');
  return p.length ? p : null;
}

/** Pick the next gumball. Never a repeat. Returns a gumball id, or null if none are left. */
export function spin(owned, setId = null, rand = Math.random) {
  const p = firstPool(owned, setId) || pool(owned, setId);
  if (!p.length) return null;
  return p[Math.floor(rand() * p.length)].id;
}
