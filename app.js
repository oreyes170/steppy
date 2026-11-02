import * as L from './logic.js';
import * as fx from './fx.js';
import * as Drive from './drive.js';
import { APP_VERSION } from './version.js';
import * as Themes from './themes.js';
import * as Gumballs from './gumballs.js';
import * as Weather from './weather.js';

// ---------------------------------------------------------------------------
// State & persistence
// ---------------------------------------------------------------------------

const STORE_KEY = 'steppy:v1';

// ---------------------------------------------------------------------------
// Cheat code: save the goals as 1683 / 3289680 in Settings to unlock everything;
// save any other numbers to turn it off. It's a layer on top of her real data that
// lives only on this device: it never changes her collection, theme or goals, and is
// never backed up to Google or a backup file.
// ---------------------------------------------------------------------------
const CHEAT = { regularGoal: 1683, bigGoal: 3289680 };
const CHEAT_KEY = 'steppy:cheat';
const CHEAT_THEME_KEY = 'steppy:cheat-theme';
const Cheat = {
  on() {
    try {
      return localStorage.getItem(CHEAT_KEY) === '1';
    } catch {
      return false;
    }
  },
  set(on) {
    try {
      if (on) localStorage.setItem(CHEAT_KEY, '1');
      else {
        localStorage.removeItem(CHEAT_KEY);
        localStorage.removeItem(CHEAT_THEME_KEY);
      }
    } catch {
      /* ignore */
    }
  },
  theme() {
    try {
      return localStorage.getItem(CHEAT_THEME_KEY);
    } catch {
      return null;
    }
  },
  setTheme(id) {
    try {
      localStorage.setItem(CHEAT_THEME_KEY, id);
    } catch {
      /* ignore */
    }
  },
};

/** Themes she owns (all of them while the cheat is on). */
const ownedIds = () => (Cheat.on() ? Gumballs.GUMBALLS.map((g) => g.id) : state.meta.gumballs.owned);
const machineUnlocked = () => Cheat.on() || state.meta.gumballs.unlocked;

const defaultState = () => ({
  version: 1,
  settings: {
    name: '',
    regularGoal: 7000,
    bigGoal: 10000,
    onboarded: false,
    theme: 'classic',
    // sunrise/sunset on the Today card: New York unless she taps "Use my location"
    sun: { show: true, mode: 'nyc', lat: 40.71, lon: -74.01 }, // also the weather location
    weather: { show: true },
  },
  days: {}, // { 'YYYY-MM-DD': { status: 'regular'|'big'|'missed'|'skip', steps?: number } }
  meta: {
    startedOn: null,
    goalsChangedOn: null,
    suggestionSnoozedUntil: null,
    celebrated: null,
    lastBackupOn: null,
    backupSnoozedUntil: null,
    themeBeforeHoliday: 'classic', // where she goes back to when a holiday theme ends
    holidaysAnnounced: [], // older versions: e.g. 'thanksgiving-2026'
    unlockedThemes: [], // holidays/events she's unlocked: hers forever
    themesAnnounced: [], // "New theme!" popups already shown (once each, ever)
    lastMonthSeen: null, // 'YYYY-MM' — for the "Welcome to <Month>" greeting
    changedAt: 0, // last time anything changed (ms) — compared with google.lastSyncAt
    gumballs: { unlocked: false, introSeen: false, owned: [], spent: 0 }, // the Theme Machine
    google: { connected: false, email: '', fileId: null, lastSyncAt: 0, needsReconnect: false, snoozedUntil: null },
  },
});

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    return normalize(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

function normalize(s) {
  const d = defaultState();
  return migrate({
    ...d,
    ...s,
    settings: { ...d.settings, ...(s.settings || {}), sun: { ...d.settings.sun, ...(s.settings?.sun || {}) }, weather: { ...d.settings.weather, ...(s.settings?.weather || {}) } },
    meta: {
      ...d.meta,
      ...(s.meta || {}),
      google: { ...d.meta.google, ...(s.meta?.google || {}) },
      gumballs: { ...d.meta.gumballs, ...(s.meta?.gumballs || {}) },
    },
    days: s.days && typeof s.days === 'object' ? s.days : {},
  });
}

/** One-off upgrades for data saved by older versions. */
function migrate(s) {
  if (s.settings.sun?.mode === 'nh') Object.assign(s.settings.sun, { lat: 44.05, lon: -71.13 });
  // v1.14: holidays are permanent once unlocked. Carry over what she's already seen.
  for (const key of s.meta.holidaysAnnounced || []) {
    const id = String(key).replace(/-\d{4}$/, '');
    if (!s.meta.unlockedThemes.includes(id)) s.meta.unlockedThemes = [...s.meta.unlockedThemes, id];
    if (!s.meta.themesAnnounced.includes(id)) s.meta.themesAnnounced = [...s.meta.themesAnnounced, id];
  }
  // v1.8.3 wrote the cheat code into her real data (and could sync it). Undo that: the
  // cheat now lives only on the device (see Cheat below), so move it there.
  if (s.meta.allUnlocked) {
    delete s.meta.allUnlocked;
    s.meta.gumballs = { ...s.meta.gumballs, owned: [] };
    try {
      localStorage.setItem(CHEAT_KEY, '1');
    } catch {
      /* ignore */
    }
  }
  // v1.6: 'auto' switched themes by date. Now her pick wins, so lock in what she was seeing.
  if (s.settings.theme === 'auto' || !s.settings.theme) {
    const now = new Date();
    const seasonal = Themes.seasonalTheme(now);
    s.settings.theme = seasonal ? seasonal.id : 'classic';
    s.meta.themeBeforeHoliday = 'classic';
    if (seasonal) s.meta.holidaysAnnounced = [...(s.meta.holidaysAnnounced || []), Themes.seasonKey(seasonal, now)];
  }
  return s;
}

function save({ dirty = true } = {}) {
  if (dirty) state.meta.changedAt = Date.now();
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    toast('Couldn’t save — is storage full or in private mode?');
  }
  if (dirty) scheduleSync();
}

let state = load();
const todayKey = () => L.dateKey(new Date());
const now = new Date();
let view = { y: now.getFullYear(), m: now.getMonth() };

// Ask the browser not to evict our data (helps on iOS home-screen apps).
navigator.storage?.persist?.().catch(() => {});

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

const STATUS_INFO = {
  big: { emoji: '🌟', label: 'Big goal!', short: 'Big goal smashed' },
  regular: { emoji: '👟', label: 'Hit my goal', short: 'Goal met' },
  skip: { emoji: '🎟️', label: 'Use a skip day', short: 'Skip day' },
  missed: { emoji: '🌙', label: 'Not today', short: 'Rest day' },
  progress: { emoji: '🚶', label: 'In progress', short: 'In progress' },
};

const MSG = {
  regular: [
    'Look at you go! 👟',
    'Goal: crushed. 💪',
    'Another one in the books! 📖',
    'Those legs are legendary. ✨',
    'Step by step, you’re unstoppable!',
    'Proud of you! 💕',
    'You did the thing! 🎉',
  ],
  big: [
    'You absolute legend.',
    'That’s a BIG day!',
    'Your feet deserve a spa day.',
    'Main character energy.',
    'The sidewalk will remember this.',
  ],
  missed: [
    'Rest is part of it. Tomorrow’s a fresh start 🌙',
    'No stress — every day is a new chance 💛',
    'Bodies need rest too. You’ve got this 🌷',
    'Totally okay! Be kind to yourself today 💕',
  ],
  skip: ['Skip day used — your streak is safe 💜', 'Streak protected! Enjoy the rest 🛋️'],
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fmt = (n) => Number(n).toLocaleString();
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const $ = (sel) => document.querySelector(sel);

function prettyDate(key, opts = { weekday: 'long', month: 'short', day: 'numeric' }) {
  return L.parseKey(key).toLocaleDateString(undefined, opts);
}

function relativeLabel(key) {
  const t = todayKey();
  if (key === t) return 'Today';
  if (key === L.addDays(t, -1)) return 'Yesterday';
  return prettyDate(key);
}

// ---------------------------------------------------------------------------
// Derived snapshot
// ---------------------------------------------------------------------------

function snapshot() {
  const t = todayKey();
  return {
    streak: L.currentStreak(state.days, t),
    best: L.bestStreak(state.days),
    skips: L.skipInfo(state.days, state.meta.gumballs.spent),
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** Days left "in progress" from before yesterday quietly become rest days (steps kept). */
function finalizeOldProgress() {
  const y = L.addDays(todayKey(), -1);
  let changed = false;
  for (const [k, v] of Object.entries(state.days)) {
    if (v.status === 'progress' && k < y) {
      state.days[k] = { ...v, status: 'missed' };
      changed = true;
    }
  }
  if (changed) save();
}

function render() {
  finalizeOldProgress();
  applyTheme();
  renderHeader();
  renderToday();
  renderCatchup();
  renderStats();
  checkMachineUnlock();
  if (state.settings.onboarded) syncUnlocks();
  renderSuggestion();
  renderMachineCard();
  renderBackupReminder();
  renderCalendar();
  renderGoals();
}

function renderHeader() {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const name = state.settings.name.trim();
  const deco = theme.greetingEmoji ? ` ${theme.greetingEmoji}` : '';
  $('#greeting').textContent = (name ? `${part}, ${name}!` : `${part}!`) + deco;
}

// ---------------------------------------------------------------------------
// Holiday themes
// ---------------------------------------------------------------------------

// ?theme=christmas previews a theme on any date (handy for checking them early).
const previewTheme = new URLSearchParams(location.search).get('theme');
let theme = Themes.byId('classic');
let ambientFor = null;
let appliedVars = [];

// Recolour the teal background of the sneaker icon for gumball themes (done once per colour).
const iconCache = {};
async function tintedIcon(color) {
  if (iconCache[color]) return iconCache[color];
  try {
    const img = new Image();
    img.src = 'icons/icon-192.png';
    await img.decode();
    const c = document.createElement('canvas');
    c.width = c.height = 192;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0, 192, 192);
    const d = x.getImageData(0, 0, 192, 192);
    const p = d.data;
    const [bh, bs, bv] = rgbToHsv(38, 124, 139); // the icon's teal background
    const n = parseInt(color.slice(1), 16);
    const [th, ts, tv] = rgbToHsv((n >> 16) & 255, (n >> 8) & 255, n & 255);
    for (let i = 0; i < p.length; i += 4) {
      const [h, s, v] = rgbToHsv(p[i], p[i + 1], p[i + 2]);
      if (Math.abs(h - bh) > 0.07 || s < 0.25) continue;
      const w = Math.max(0, Math.min(1, (0.615 - v) / 0.04)); // leave the bright sneaker alone
      if (!w) continue;
      const [r, g, b] = hsvToRgb(th, Math.min(1, s * (ts / bs)), Math.min(1, v * (tv / bv)));
      p[i] += (r - p[i]) * w;
      p[i + 1] += (g - p[i + 1]) * w;
      p[i + 2] += (b - p[i + 2]) * w;
    }
    x.putImageData(d, 0, 0);
    return (iconCache[color] = c.toDataURL());
  } catch {
    return null;
  }
}

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const dd = max - Math.min(r, g, b);
  let h = 0;
  if (dd) h = max === r ? ((g - b) / dd + 6) % 6 : max === g ? (b - r) / dd + 2 : (r - g) / dd + 4;
  return [h / 6, max ? dd / max : 0, max];
}

function hsvToRgb(h, s, v) {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const p = v * (1 - s);
  const [r, g, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6];
  return [r * 255, g * 255, b * 255];
}

function applyTheme() {
  const t = previewTheme && Themes.ALL_THEMES.some((x) => x.id === previewTheme)
    ? Themes.byId(previewTheme)
    : currentTheme(new Date());
  theme = t;
  const root = document.documentElement;
  root.dataset.theme = t.gumball ? 'gumball' : t.id;
  if (t.style) root.dataset.style = t.style; // a special look (see styles.css)
  else delete root.dataset.style;
  if (t.head) root.dataset.head = t.head; // a heading font (see styles.css)
  else delete root.dataset.head;
  // Gumball themes set their colours directly; other themes use the CSS in styles.css.
  for (const k of appliedVars) root.style.removeProperty(`--${k}`);
  appliedVars = [];
  if (t.vars) {
    for (const [k, v] of Object.entries(t.vars)) root.style.setProperty(`--${k}`, v);
    appliedVars = Object.keys(t.vars);
    root.style.colorScheme = t.dark ? 'dark' : 'light';
  } else root.style.removeProperty('color-scheme');
  $('#theme-color')?.setAttribute('content', t.themeColor);
  const logo = $('#logo-icon');
  if (t.iconTint) {
    tintedIcon(t.iconTint).then((url) => {
      if (theme === t && logo && url) logo.setAttribute('src', url);
    });
  } else {
    const logoSrc = t.headerIcon || 'icons/icon-192.png';
    if (logo && logo.getAttribute('src') !== logoSrc) logo.setAttribute('src', logoSrc);
  }
  fx.setPalette(t.confetti, t.confettiEmoji);
  if (ambientFor !== t.id) renderAmbient(t);
}

function renderAmbient(t) {
  ambientFor = t.id;
  const el = $('#ambient');
  if (!el) return;
  const a = t.ambient;
  if (!a) {
    el.innerHTML = '';
    return;
  }
  let html = '';
  for (let i = 0; i < a.count; i++) {
    const e = a.emojis[i % a.emojis.length];
    const size = 14 + Math.random() * 18;
    const dur = a.motion === 'fall' ? 12 + Math.random() * 14 : 22 + Math.random() * 18;
    const style = [
      `left:${(Math.random() * 100).toFixed(1)}vw`,
      `font-size:${size.toFixed(0)}px`,
      `--d:${dur.toFixed(1)}s`,
      `--delay:${(-Math.random() * dur).toFixed(1)}s`,
      `--sway:${(10 + Math.random() * 40).toFixed(0)}px`,
      `--top:${(22 + Math.random() * 70).toFixed(0)}vh`, // below the header, so they never drift behind the greeting
      `--o:${(0.25 + Math.random() * 0.4).toFixed(2)}`,
    ].join(';');
    html += `<span class="amb ${a.motion}" style="${style}">${e}</span>`;
  }
  el.innerHTML = html;
}

/** The theme she's wearing. With the cheat on, holiday themes work any day. */
function currentTheme(date) {
  if (Cheat.on()) {
    const pick = Themes.ALL_THEMES.find((t) => t.id === (Cheat.theme() || state.settings.theme));
    if (pick) return pick;
  }
  return Themes.activeTheme(state.settings.theme, date, state.meta.themeBeforeHoliday, state.meta.unlockedThemes);
}

function themePickerHtml() {
  const now = new Date();
  const current = currentTheme(now);
  const isOn = (id) => current.id === id;
  const chip = (id, emoji, name, sub) =>
    `<button class="theme-chip ${isOn(id) ? 'on' : ''}" data-theme-pick="${id}" type="button"><span>${emoji}</span><span>${name}${sub ? `<small>${sub}</small>` : ''}</span></button>`;
  return `
    <h3>Theme</h3>
    <div class="theme-picker">
      ${(Cheat.on() ? Themes.THEMES : Themes.pickable(now, state.meta.unlockedThemes)).map((t) => chip(t.id, t.emoji, t.name, '')).join('')}
    </div>
    ${collectionHtml(current)}`;
}

// ---------------------------------------------------------------------------
// The Theme Machine (gumballs bought with skip tickets)
// ---------------------------------------------------------------------------

function checkMachineUnlock() {
  const gb = state.meta.gumballs;
  if (gb.unlocked || Cheat.on()) return;
  if (snapshot().skips.available >= Gumballs.UNLOCK_AT) {
    gb.unlocked = true;
    save();
  }
}

function renderMachineCard() {
  const el = $('#machine-card');
  const gb = state.meta.gumballs;
  if (!gb.unlocked || gb.introSeen || Cheat.on()) {
    el.innerHTML = '';
    return;
  }
  const n = snapshot().skips.available;
  el.innerHTML = `
    <div class="card unlock-card">
      <div class="unlock-text">
        <p class="eyebrow">✨ New unlocked!</p>
        <h3>The Theme Machine</h3>
        <p class="small muted">You’ve saved up ${n} skip tickets! Trade 1 for a gumball, and every gumball is a brand-new theme to collect. 🍬</p>
        <button class="btn primary" data-open-machine>Take me there 🍬</button>
      </div>
      <div class="unlock-art">${machineSvg()}</div>
    </div>`;
}

/** The gumball machine drawing. Gumball colours are the themes still inside it. */
function machineSvg() {
  const owned = ownedIds();
  const left = Gumballs.GUMBALL_THEMES.filter((t) => !owned.includes(t.id)).map((t) => t.ball);
  const colors = left.length ? left : ['#f3d9e2', '#e6dcf7', '#d9efe9'];
  const spots = [
    [70, 130, 17], [105, 138, 17], [140, 132, 17], [168, 116, 15], [52, 104, 15], [86, 104, 17], [121, 106, 17],
    [155, 88, 16], [66, 76, 15], [100, 72, 16], [134, 66, 15], [92, 42, 14], [124, 38, 13], [60, 50, 12], [158, 58, 12],
  ];
  const count = Math.min(spots.length, Math.max(4, left.length + 3));
  const balls = spots
    .slice(0, count)
    .map(
      ([x, y, r], i) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="${colors[i % colors.length]}"/><circle cx="${x - r / 3}" cy="${y - r / 3}" r="${r / 4}" fill="#fff" opacity=".45"/>`,
    )
    .join('');
  return `
    <svg class="machine" viewBox="0 0 220 300" aria-hidden="true">
      <g class="globe">
        <circle cx="110" cy="100" r="88" fill="#eef8ff" stroke="#cfe3ef" stroke-width="4"/>
        ${balls}
        <path d="M48 52 A88 88 0 0 1 120 14" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".7"/>
      </g>
      <rect x="86" y="2" width="48" height="16" rx="8" fill="var(--primary)"/>
      <rect x="62" y="180" width="96" height="16" rx="6" fill="var(--primary)" opacity=".85"/>
      <path d="M40 196 H180 L170 290 H50 Z" fill="var(--primary)"/>
      <path d="M40 196 H180 L178 214 H42 Z" fill="#fff" opacity=".18"/>
      <g class="knob"><circle cx="110" cy="236" r="21" fill="#fff"/><rect x="106" y="220" width="8" height="32" rx="4" fill="#d9c3cc"/></g>
      <path d="M92 262 h36 v22 h-36 z" fill="#000" opacity=".25"/>
      <rect x="96" y="266" width="28" height="14" rx="4" fill="#000" opacity=".45"/>
      <rect x="44" y="286" width="132" height="10" rx="5" fill="var(--primary)" opacity=".85"/>
    </svg>`;
}

function openMachine() {
  const gb = state.meta.gumballs;
  if (!machineUnlocked()) return;
  if (!gb.introSeen && !Cheat.on()) {
    gb.introSeen = true;
    save({ dirty: false });
    renderMachineCard();
  }
  const { available } = snapshot().skips;
  const owned = ownedIds();
  const left = Gumballs.pool(owned).length;
  // Picking a collection (2 tickets) only appears once she's discovered more than one.
  const found = Gumballs.revealedSets(owned);
  const sets = found.length >= 2 ? found.filter((st) => Gumballs.pool(owned, st.id).length) : [];
  const spinBtn = (cost, label, setId = '') => {
    const can = available >= cost && left > 0;
    return `<button class="btn ${setId ? 'ghost set-spin' : 'primary spin-btn'}" data-spin="${setId || 'any'}" ${can ? '' : 'disabled'}>${label} · ${cost} 🎟️</button>`;
  };
  const warn =
    left && available === Gumballs.SPIN_COST
      ? '<p class="small muted center">This uses your last skip ticket, so your streak won’t have a backup for a bit.</p>'
      : left && available < Gumballs.SPIN_COST
        ? '<p class="small muted center">You need a skip ticket to spin. Keep stepping! 👟</p>'
        : '';
  openSheet(`
    <div class="center">
      <p class="eyebrow">Theme Machine</p>
      <h2>${left ? 'Spin for a new theme! 🍬' : 'You collected them all! 🏆'}</h2>
      <div class="ticket-pill">🎟️ ${available} skip ticket${available === 1 ? '' : 's'}</div>
    </div>
    <div class="machine-wrap" id="machine-wrap">${machineSvg()}</div>
    ${left ? spinBtn(Gumballs.SPIN_COST, 'Turn the knob') : '<p class="center muted">New gumballs get added over time. Check back soon! ✨</p>'}
    ${warn}
    ${
      sets.length
        ? `<p class="small muted machine-sub">Or pick a collection:</p>
           <div class="set-spins">${sets.map((st) => spinBtn(Gumballs.SET_SPIN_COST, `${st.emoji} ${st.name}`, st.id)).join('')}</div>`
        : ''
    }
    <p class="small muted center machine-count"><b>${owned.length} theme${owned.length === 1 ? '' : 's'}</b> collected · no repeats${left ? ' · what’s next? 👀' : ''}</p>
  `);
}

let spinning = false;
async function doSpin(setId) {
  if (spinning) return;
  const gb = state.meta.gumballs;
  const cost = setId ? Gumballs.SET_SPIN_COST : Gumballs.SPIN_COST;
  if (snapshot().skips.available < cost) return toast('Not enough skip tickets yet. Keep stepping! 👟');
  if (Cheat.on()) return toast('Cheat mode is on, so you already have everything! 🔓');
  const id = Gumballs.spin(gb.owned, setId);
  if (!id) return toast('Nothing left in there, you’ve got them all! 🏆');
  const setOf = Gumballs.GUMBALLS.find((g) => g.id === id).set;
  const newSet = !Gumballs.revealedSets(gb.owned).some((st) => st.id === setOf);
  spinning = true;
  gb.owned = [...gb.owned, id];
  gb.spent += cost;
  save();
  renderStats();
  const t = Themes.byId(id);

  // knob turns, globe wobbles, a gumball rolls out
  const wrap = $('#machine-wrap');
  fx.vibrate([20, 60, 20, 60, 40]);
  wrap?.classList.add('spinning');
  await wait(fx.reducedMotion() ? 0 : 1100);
  if (wrap) {
    const drop = document.createElement('div');
    drop.className = 'gumball-drop';
    drop.style.background = t.ball;
    wrap.appendChild(drop);
  }
  await wait(fx.reducedMotion() ? 0 : 1000);
  closeSheet();
  await wait(260);
  spinning = false;

  const set = Gumballs.setById(t.set);
  if (set?.intro === 'race') await raceCountdown();
  await showModal({
    emoji: '',
    title: t.rip ? `${t.name} 🕯️` : /[!?]$/.test(t.revealName) ? t.revealName : `${t.revealName}!`,
    html: `
      <div class="reveal-ball ${t.rip ? 'rip' : ''}" style="background:${t.ball}">${t.emoji}</div>
      ${t.rip ? '<p class="rip-line">Rest in peace</p>' : ''}
      ${t.note ? `<p class="reveal-note">${t.note}</p>` : ''}
      ${newSet ? `<p class="new-set">New collection discovered: <b>${set.emoji} ${set.name}</b>!</p>` : ''}
      <p>${t.pitch}</p>
      <div class="reveal-swatches">${t.confetti
        .slice(0, 4)
        .map((c) => `<i style="background:${c}"></i>`)
        .join('')}<span>${t.confettiEmoji.join(' ')}</span></div>
      <div class="row modal-row">
        <button class="btn primary" data-try-theme="${t.id}" style="background:linear-gradient(135deg, ${t.vars.primary}, ${t.vars['primary-2']});color:${t.vars['primary-ink']}">Wear it now ✨</button>
        <button class="btn ghost" data-close-modal>Save for later</button>
      </div>`,
    cta: null,
    fx: () => {
      if (t.rip) {
        fx.emojiRain(['🍪', '🕯️', '🍪', '🤍'], 14); // a quiet moment instead of a party
        return;
      }
      fx.confetti({ count: 140, colors: t.confetti, emojis: t.confettiEmoji });
      fx.vibrate([40, 30, 80]);
    },
  });
  if (Themes.byId(state.settings.theme).id !== t.id) toast(`${t.name} is in your collection 🍬`);
}

/** 🚦 3… 2… 1… GO! before revealing a Mario Kart gumball. */
async function raceCountdown() {
  if (fx.reducedMotion()) return;
  const el = document.createElement('div');
  el.className = 'race-countdown';
  document.body.appendChild(el);
  for (const [text, light] of [['3', '🔴'], ['2', '🟡'], ['1', '🟡'], ['GO!', '🟢']]) {
    el.innerHTML = `<div class="race-light">${light}</div><div class="race-num ${text === 'GO!' ? 'go' : ''}">${text}</div>`;
    fx.vibrate(text === 'GO!' ? [70] : [20]);
    await wait(text === 'GO!' ? 450 : 600);
  }
  const kart = document.createElement('div');
  kart.className = 'race-kart';
  kart.textContent = '🏎️💨';
  document.body.appendChild(kart);
  await wait(350);
  el.remove();
  setTimeout(() => kart.remove(), 1300);
}

function collectionHtml(current) {
  const gb = state.meta.gumballs;
  if (!machineUnlocked()) return '';
  const owned = ownedIds();
  const sets = Gumballs.revealedSets(owned);
  const tile = (t) =>
    `<button class="ball-tile ${current.id === t.id ? 'on' : ''}" data-theme-pick="${t.id}" type="button"><span class="ball" style="background:${t.ball}">${t.emoji}</span><span class="nm">${esc(t.name)}${t.rip ? ' 🕯️' : ''}</span>${t.rip ? '<span class="rip-tag">RIP</span>' : ''}</button>`;
  const locked = '<div class="ball-tile locked"><span class="ball">?</span><span class="nm">???</span></div>';
  const body = sets.length
    ? sets
        .map((st) => {
          const pr = Gumballs.setProgress(st.id, owned);
          const tiles = Gumballs.GUMBALL_THEMES.filter((t) => t.set === st.id)
            .map((t) => (owned.includes(t.id) ? tile(t) : locked))
            .join('');
          return `<p class="set-title"><span>${st.emoji} ${st.name}</span><span>${pr.owned} / ${pr.total}</span></p><div class="ball-grid">${tiles}</div>`;
        })
        .join('')
    : `<div class="collection-empty">
        <div class="mini">${machineSvg()}</div>
        <b>No gumballs yet!</b>
        <p class="small muted">Every gumball is a surprise theme. Who knows what’s inside? 👀</p>
      </div>`;
  return `
    <h3 class="collection-head"><span>Gumball collection</span>${owned.length ? `<span class="small muted">${owned.length} found</span>` : ''}</h3>
    ${body}
    ${sets.length && Gumballs.hiddenSetsRemain(owned) ? '<div class="hidden-sets">🔒 More collections are hiding in the machine…</div>' : ''}
    <button class="btn ${owned.length ? 'ghost' : 'primary'} wide" data-open-machine type="button">🍬 ${owned.length ? 'Visit the Theme Machine' : `Spin the Theme Machine · ${Gumballs.SPIN_COST} 🎟️`}</button>`;
}


// ---------------------------------------------------------------------------
// New month welcome ("rabbit rabbit")
// ---------------------------------------------------------------------------

function maybeWelcomeMonth() {
  if (!state.settings.onboarded || !$('#modal').hidden) return null;
  const now = new Date();
  const ym = todayKey().slice(0, 7);
  if (state.meta.lastMonthSeen === ym) return null;
  state.meta.lastMonthSeen = ym;
  save({ dirty: false });
  const month = now.toLocaleDateString(undefined, { month: 'long' });
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sum = L.monthSummary(state.days, prev.getFullYear(), prev.getMonth());
  const prevName = prev.toLocaleDateString(undefined, { month: 'long' });
  const recap = sum.goal
    ? `<p class="recap">In ${prevName} you hit your goal on <b>${sum.goal}</b> day${sum.goal === 1 ? '' : 's'}${
        sum.big ? `, including <b>${sum.big}</b> big one${sum.big === 1 ? '' : 's'} 🌟` : ''
      }. Let’s make ${month} great!</p>`
    : `<p class="recap">A fresh month, a fresh start. Let’s make it a great one!</p>`;
  const done = showModal({
    emoji: '🐇',
    title: `Welcome to ${month}!`,
    html: `<p class="rabbit">rabbit rabbit</p>${recap}`,
    cta: 'Hop to it! 🐾',
    fx: () => fx.confetti({ count: 110 }),
  });
  $('#modal .modal-emoji')?.classList.add('hop');
  return done;
}

// ---------------------------------------------------------------------------
// "New theme!" when a holiday unlocks (once per holiday per year)
// ---------------------------------------------------------------------------

/** Record any holiday/event that's open today as unlocked for good. */
function syncUnlocks() {
  const fresh = Themes.openOn(new Date())
    .map((t) => t.id)
    .filter((id) => !state.meta.unlockedThemes.includes(id));
  if (!fresh.length) return;
  state.meta.unlockedThemes = [...state.meta.unlockedThemes, ...fresh];
  save();
}

async function maybeAnnounceHoliday() {
  if (!state.settings.onboarded || !$('#modal').hidden) return null;
  syncUnlocks();
  const t = Themes.openOn(new Date()).find((x) => !state.meta.themesAnnounced.includes(x.id));
  if (!t) return null;
  state.meta.themesAnnounced = [...state.meta.themesAnnounced, t.id];
  save({ dirty: false });
  if (theme.id === t.id) return null; // already wearing it
  if (t.entrance === 'lightning') await lightningFlash();
  const done = showModal({
    emoji: t.emoji,
    title: `New theme: ${t.name}!`,
    html: `
      <p>${t.pitch} Want to try it?</p>
      <div class="row modal-row">
        <button class="btn primary" data-try-theme="${t.id}" ${t.vars ? `style="background:linear-gradient(135deg, ${t.vars.primary}, ${t.vars['primary-2']});color:${t.vars['primary-ink']}"` : ''}>Try it! ${t.emoji}</button>
        <button class="btn ghost" data-close-modal>Not now</button>
      </div>
      <p class="muted small modal-foot">You can switch anytime in Settings ⚙️</p>`,
    cta: null,
    fx: () => fx.confetti({ count: 110, colors: t.confetti, emojis: t.confettiEmoji }),
  });
  return { done };
}

/** ⚡ Two flashes of green lightning (Avengers: Doomsday's entrance). */
async function lightningFlash() {
  if (fx.reducedMotion()) return;
  const el = document.createElement('div');
  el.className = 'lightning';
  document.body.appendChild(el);
  fx.vibrate([30, 80, 60]);
  await wait(900);
  el.remove();
  fx.emojiRain(['⚡', '⚡', '🛡️'], 10);
}

/** Pick a theme. Remembers her non-holiday pick so an expired holiday can hand it back. */
function chooseTheme(id) {
  if (Cheat.on()) {
    Cheat.setTheme(id); // cheat-mode picks never touch her real theme
    return render();
  }
  if (!Themes.isHoliday(id)) state.meta.themeBeforeHoliday = id;
  else if (!Themes.isHoliday(state.settings.theme)) state.meta.themeBeforeHoliday = state.settings.theme;
  state.settings.theme = id;
  save();
  render();
}

/** Month welcome first, then any holiday news — one popup at a time. */
let announcing = false;
async function runAnnouncements() {
  if (announcing) return;
  announcing = true;
  try {
    const month = maybeWelcomeMonth();
    if (month) {
      await month;
      await wait(350); // let the first popup finish closing
    }
    for (let i = 0; i < 4; i++) {
      const shown = await maybeAnnounceHoliday();
      if (!shown) break;
      await shown.done;
      await wait(350);
    }
  } finally {
    announcing = false;
  }
}

// ---------------------------------------------------------------------------
// Sunrise & sunset (worked out on the phone, no internet needed)
// ---------------------------------------------------------------------------

const clock = (d) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

function sunLine() {
  const sun = state.settings.sun;
  if (!sun?.show) return '';
  const now = new Date();
  const times = L.sunTimes(now, sun.lat, sun.lon);
  if (!times) return '';
  const { sunrise, sunset } = times;
  const extra =
    now < sunrise
      ? `sunrise in ${L.formatDuration(sunrise - now)}`
      : now < sunset
        ? `${L.formatDuration(sunset - now)} of daylight left`
        : 'the sun’s down 🌙';
  return `<p class="sun-line">🌅 ${clock(sunrise)} · 🌇 ${clock(sunset)} <span>· ${extra}</span></p>`;
}

// ---------------------------------------------------------------------------
// Live weather (Open-Meteo, no account needed). Shares the location with sunrise/sunset.
// ---------------------------------------------------------------------------

const WEATHER_KEY = 'steppy:weather'; // device-only cache, never backed up
const WEATHER_FRESH_MS = 30 * 60000; // refresh every 30 minutes
const WEATHER_STALE_MS = 3 * 3600000; // hide if older than 3 hours (e.g. long offline)
let weatherLoading = false;

const placeKey = () => `${state.settings.sun.lat},${state.settings.sun.lon}`;

function cachedWeather() {
  try {
    const c = JSON.parse(localStorage.getItem(WEATHER_KEY) || 'null');
    if (c && c.place === placeKey() && Date.now() - c.at < WEATHER_STALE_MS) return c;
  } catch {
    /* ignore */
  }
  return null;
}

async function refreshWeather(force = false) {
  if (!state.settings.weather?.show || weatherLoading || !navigator.onLine) return;
  const c = cachedWeather();
  if (!force && c && Date.now() - c.at < WEATHER_FRESH_MS) return;
  weatherLoading = true;
  try {
    const { lat, lon } = state.settings.sun;
    const data = await Weather.fetchWeather(lat, lon);
    try {
      localStorage.setItem(WEATHER_KEY, JSON.stringify({ place: placeKey(), at: Date.now(), data }));
    } catch {
      /* ignore */
    }
    renderToday(); // the Today card sits under any open sheet, so this is always safe
  } catch {
    /* offline or service down: keep whatever we had */
  } finally {
    weatherLoading = false;
  }
}

function weatherLine() {
  if (!state.settings.weather?.show) return '';
  const c = cachedWeather();
  if (!c?.data?.current) {
    refreshWeather();
    return '';
  }
  const { current, daily } = c.data;
  const [emoji, words] = Weather.describe(current.weather_code, current.is_day !== 0);
  const hi = daily?.temperature_2m_max?.[0];
  const lo = daily?.temperature_2m_min?.[0];
  const tip = Weather.walkingTip(c.data);
  return `
    <p class="weather-line">${emoji} <b>${Math.round(current.temperature_2m)}°</b> · ${words}${
      hi != null ? ` <span>· H ${Math.round(hi)}° L ${Math.round(lo)}°</span>` : ''
    }</p>
    ${tip ? `<p class="weather-tip">${tip}</p>` : ''}`;
}

/** Weather + sunrise/sunset lines for the Today card. */
const skyLines = () => weatherLine() + sunLine();

function locationName() {
  const sun = state.settings.sun;
  return sun.mode === 'here' ? 'Your location' : (Weather.PLACES[sun.mode] || Weather.PLACES.nyc).name;
}

function sunSettingsHtml() {
  const { sun, weather } = state.settings;
  const place = (mode, label) =>
    `<button class="btn ghost loc-btn ${sun.mode === mode ? 'on' : ''}" data-sun="${mode}" type="button">${label}</button>`;
  return `
    <h3>📍 Location</h3>
    <p class="muted small">For the weather and sunrise & sunset on the Today card. Now: <b>${locationName()}</b>.</p>
    <div class="loc-row">
      ${place('nyc', '🗽 New York')}
      ${place('nh', '🌲 North Conway')}
      ${place('here', '📍 Use my location')}
    </div>
    <div class="row toggle-row">
      <button class="btn ghost" data-sun="weather" type="button">${weather.show ? '✓ ' : ''}🌤️ Weather</button>
      <button class="btn ghost" data-sun="${sun.show ? 'hide' : 'show'}" type="button">${sun.show ? '✓ ' : ''}🌅 Sunrise & sunset</button>
    </div>`;
}

function setSun(action) {
  const { sun, weather } = state.settings;
  if (action === 'hide' || action === 'show') {
    sun.show = action === 'show';
  } else if (action === 'weather') {
    weather.show = !weather.show;
  } else if (Weather.PLACES[action]) {
    Object.assign(sun, { mode: action, lat: Weather.PLACES[action].lat, lon: Weather.PLACES[action].lon });
    refreshWeather(true);
  } else if (action === 'here') {
    if (!navigator.geolocation) return toast('Location isn’t available on this device.');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // rounded to ~1 km: plenty for weather and sunrise times, and less precise to store
        Object.assign(sun, { mode: 'here', lat: +pos.coords.latitude.toFixed(2), lon: +pos.coords.longitude.toFixed(2) });
        save();
        render();
        openSettings();
        refreshWeather(true);
        toast('Weather and sunrise & sunset now use your location 📍');
      },
      () => toast('Couldn’t get your location. You can allow it in Settings → Privacy → Location.'),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 3600000 },
    );
    return;
  }
  save();
  render();
  openSettings();
  if (weather.show) refreshWeather();
}

function quickButtons(key) {
  return `
    <div class="quick">
      <button class="btn big-btn" data-log="big" data-key="${key}"><span>🌟</span>Big goal!</button>
      <button class="btn regular-btn" data-log="regular" data-key="${key}"><span>👟</span>Hit my goal</button>
      <button class="btn missed-btn" data-log="missed" data-key="${key}"><span>🌙</span>Not today</button>
    </div>`;
}

function renderToday() {
  const t = todayKey();
  const d = state.days[t];
  const { regularGoal, bigGoal } = state.settings;
  const el = $('#today');
  if (d?.status === 'progress') {
    const e = L.encouragement(d.steps || 0, regularGoal);
    el.className = 'card today-card progress';
    el.innerHTML = `
      <p class="eyebrow">Today · in progress 🚶</p>
      <h2>${fmt(d.steps || 0)} <span class="of-goal">/ ${fmt(regularGoal)} steps</span></h2>
      <div class="goal-meter" aria-label="${e.pct}% of your goal"><i style="width:${e.pct}%"></i></div>
      <p class="encourage"><b>${fmt(e.left)} to go.</b> ${e.msg}</p>
      ${skyLines()}
      <div class="row progress-actions">
        <button class="btn primary" data-open-day="${t}">Update steps</button>
        <button class="btn regular-btn" data-log="regular" data-key="${t}">👟 Hit my goal</button>
      </div>
      <button class="link-btn" data-log="missed" data-key="${t}">Call it a rest day 🌙</button>`;
    return;
  }
  if (d) {
    const info = STATUS_INFO[d.status];
    const sub =
      d.status === 'big'
        ? 'You went above and beyond today!'
        : d.status === 'regular'
          ? `${fmt(bigGoal - (d.steps || regularGoal))} more steps would make it a big day 👀`
          : d.status === 'skip'
            ? 'Enjoy your day off — your streak is safe.'
            : 'Rest up. Tomorrow’s a fresh start.';
    el.className = `card today-card done ${d.status}`;
    el.innerHTML = `
      <div class="today-done">
        <div class="today-emoji bounce">${info.emoji}</div>
        <div>
          <p class="eyebrow">Today</p>
          <h2>${info.short}${d.steps ? ` · ${fmt(d.steps)} steps` : ''}</h2>
          <p class="muted">${sub}</p>
          ${skyLines()}
        </div>
      </div>
      <button class="link-btn" data-open-day="${t}">Change</button>`;
  } else {
    el.className = 'card today-card';
    el.innerHTML = `
      <p class="eyebrow">Today · ${prettyDate(t, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
      <h2>How did your steps go?</h2>
      <p class="muted">Goal <b>${fmt(regularGoal)}</b> · Big goal <b>${fmt(bigGoal)}</b></p>
      ${skyLines()}
      ${quickButtons(t)}
      <button class="link-btn" data-open-day="${t}">Enter step count or use a skip day →</button>`;
  }
}

function renderCatchup() {
  const t = todayKey();
  const y = L.addDays(t, -1);
  const el = $('#catchup');
  const started = state.meta.startedOn;
  if (!started || y < started || (state.days[y] && state.days[y].status !== 'progress')) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `
    <div class="card catchup-card">
      <p class="eyebrow">Catch up</p>
      <h3>How did yesterday go?</h3>
      ${state.days[y]?.steps ? `<p class="muted small">Last you said: ${fmt(state.days[y].steps)} steps</p>` : ''}
      ${quickButtons(y)}
      <button class="link-btn" data-open-day="${y}">More options →</button>
    </div>`;
}

function renderStats() {
  const { streak, best, skips } = snapshot();
  const next = L.nextMilestone(streak);
  const flameSize = Math.min(1 + streak / 30, 1.8);
  $('#stats').innerHTML = `
    <div class="stat card streak ${streak >= 3 ? 'hot' : ''}" id="stat-streak">
      <div class="stat-emoji flame" style="--s:${flameSize}">🔥</div>
      <div class="stat-num">${streak}</div>
      <div class="stat-label">day streak</div>
      ${next ? `<div class="stat-hint">${next - streak} to ${next}</div>` : ''}
    </div>
    <div class="stat card" id="stat-best">
      <div class="stat-emoji">🏆</div>
      <div class="stat-num">${best}</div>
      <div class="stat-label">best streak</div>
    </div>
    <div class="stat card skips ${machineUnlocked() ? 'tappable' : ''}" id="stat-skips" ${machineUnlocked() ? 'data-open-machine role="button" tabindex="0" aria-label="Open the Theme Machine"' : ''}>
      ${machineUnlocked() ? '<span class="stat-badge" aria-hidden="true">🍬</span>' : ''}
      <div class="stat-emoji">🎟️</div>
      <div class="stat-num">${skips.available}</div>
      <div class="stat-label">skip day${skips.available === 1 ? '' : 's'}</div>
      <div class="meter" title="${skips.progress}/${skips.pointsPerSkip} points to your next skip day">
        <i style="width:${(skips.progress / skips.pointsPerSkip) * 100}%"></i>
      </div>
      <div class="stat-hint">${skips.pointsPerSkip - skips.progress} pts to next</div>
    </div>`;
}

const BACKUP_EVERY_DAYS = 7;

function backupDue() {
  const t = todayKey();
  const { lastBackupOn, backupSnoozedUntil } = state.meta;
  if (Object.keys(state.days).length < 3) return false;
  if (backupSnoozedUntil && t < backupSnoozedUntil) return false;
  return !lastBackupOn || L.addDays(lastBackupOn, BACKUP_EVERY_DAYS) <= t;
}

function renderBackupReminder() {
  const el = $('#backup');
  renderSyncStatus();
  if (Drive.enabled()) {
    const g = state.meta.google;
    const snoozed = g.snoozedUntil && todayKey() < g.snoozedUntil;
    if (!state.settings.onboarded || snoozed || (g.connected && !g.needsReconnect)) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = g.needsReconnect
      ? `
      <div class="card backup-card">
        <p class="eyebrow">Google backup</p>
        <h3>Tap to reconnect ☁️</h3>
        <p class="muted small">Google asked to confirm it’s you. Your days are safe on this phone. Reconnect so they keep backing up.</p>
        <div class="row">
          <button class="btn primary" data-google-connect>Reconnect</button>
          <button class="btn ghost" data-snooze-google>Later</button>
        </div>
      </div>`
      : `
      <div class="card backup-card">
        <p class="eyebrow">Keep your streak safe</p>
        <h3>Back up to Google ☁️</h3>
        <p class="muted small">Sign in once and every day you log is saved to Google Drive automatically. New phone? Everything comes right back.</p>
        <div class="row">
          <button class="btn primary" data-google-connect>Sign in with Google</button>
          <button class="btn ghost" data-snooze-google>Later</button>
        </div>
      </div>`;
    return;
  }
  if (!backupDue()) {
    el.innerHTML = '';
    return;
  }
  const n = Object.keys(state.days).length;
  el.innerHTML = `
    <div class="card backup-card">
      <p class="eyebrow">Keep your progress safe</p>
      <h3>Time for a quick backup 💾</h3>
      <p class="muted small">You’ve logged ${n} days! Save a backup to iCloud Drive (Save to Files) or text it to someone, so a new phone or a deleted icon never loses your streak.</p>
      <div class="row">
        <button class="btn primary" data-export>Back up now</button>
        <button class="btn ghost" data-snooze-backup>Later</button>
      </div>
    </div>`;
}

function agoText(ms) {
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function syncStatusText() {
  const g = state.meta.google;
  if (!Drive.enabled() || !g.connected) return '';
  if (syncing) return '☁️ Saving to Google…';
  if (g.needsReconnect) return '☁️ Google backup paused — tap Reconnect above';
  if (g.lastSyncAt >= state.meta.changedAt) return `☁️ Backed up to Google · ${agoText(g.lastSyncAt)}`;
  return '☁️ Saves to Google next time you open Steppy';
}

function renderSyncStatus() {
  const el = $('#sync-status');
  if (el) el.textContent = syncStatusText();
}

function lastBackupText() {
  const d = state.meta.lastBackupOn;
  if (!d) return 'You haven’t made a backup yet.';
  const t = todayKey();
  if (d === t) return 'Last backup: today ✅';
  if (d === L.addDays(t, -1)) return 'Last backup: yesterday';
  return `Last backup: ${prettyDate(d, { month: 'short', day: 'numeric' })}`;
}

function renderSuggestion() {
  const s = L.suggestGoals(state, todayKey());
  const el = $('#suggestion');
  if (!s) {
    el.innerHTML = '';
    return;
  }
  const { regularGoal, bigGoal } = state.settings;
  const arrow = (a, b) =>
    `<span class="val">${a === b ? `<b>${fmt(a)}</b>` : `<s>${fmt(a)}</s> → <b class="${b > a ? 'up' : 'down'}">${fmt(b)}</b>`}</span>`;
  el.innerHTML = `
    <div class="card suggestion-card ${s.kind}">
      <p class="eyebrow">Goal coach</p>
      <h3>${s.title}</h3>
      <p>${s.message}</p>
      <div class="goal-change">
        <div><span class="muted">Goal</span>${arrow(regularGoal, s.regularGoal)}</div>
        <div><span class="muted">Big goal</span>${arrow(bigGoal, s.bigGoal)}</div>
      </div>
      <div class="row">
        <button class="btn primary" data-accept-suggestion>Let’s do it!</button>
        <button class="btn ghost" data-snooze-suggestion>Not now</button>
      </div>
    </div>`;
  el.dataset.regular = s.regularGoal;
  el.dataset.big = s.bigGoal;
}

function renderCalendar() {
  const { y, m } = view;
  const t = todayKey();
  const first = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  $('#month-label').textContent = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const curr = new Date();
  $('#next-month').disabled = y > curr.getFullYear() || (y === curr.getFullYear() && m >= curr.getMonth());

  let html = '';
  for (let i = 0; i < first.getDay(); i++) html += '<span class="cell empty"></span>';
  for (let day = 1; day <= daysInMonth; day++) {
    const key = L.dateKey(new Date(y, m, day));
    const d = state.days[key];
    const future = key > t;
    const prevKeeps = d && L.keepsStreak(d.status) && state.days[L.addDays(key, -1)] && L.keepsStreak(state.days[L.addDays(key, -1)].status);
    const nextKeeps = d && L.keepsStreak(d.status) && state.days[L.addDays(key, 1)] && L.keepsStreak(state.days[L.addDays(key, 1)].status);
    const cls = [
      'cell',
      d ? d.status : '',
      key === t ? 'is-today' : '',
      future ? 'future' : '',
      prevKeeps ? 'chain-left' : '',
      nextKeeps ? 'chain-right' : '',
    ]
      .filter(Boolean)
      .join(' ');
    const label = `${prettyDate(key)}${d ? `: ${STATUS_INFO[d.status].short}` : ''}`;
    html += `<button class="${cls}" data-day="${key}" ${future ? 'disabled' : ''} aria-label="${esc(label)}">
      <span class="num">${day}</span>
      <span class="mark">${d ? STATUS_INFO[d.status].emoji : ''}</span>
    </button>`;
  }
  $('#cal-grid').innerHTML = html;

  const sum = L.monthSummary(state.days, y, m);
  $('#month-summary').innerHTML = sum.goal
    ? `<b>${sum.goal}</b> goal day${sum.goal === 1 ? '' : 's'} this month${sum.big ? `, including <b>${sum.big}</b> big one${sum.big === 1 ? '' : 's'} 🌟` : ''}`
    : '';
}

function renderGoals() {
  const { regularGoal, bigGoal } = state.settings;
  $('#goals').innerHTML = `
    <div class="goals-row">
      <div class="goal-pill regular"><span>👟 Goal</span><b>${fmt(regularGoal)}</b></div>
      <div class="goal-pill big"><span>🌟 Big goal</span><b>${fmt(bigGoal)}</b></div>
    </div>
    <p class="muted small">Goal days earn 1 point, big goal days earn 2. Every ${L.POINTS_PER_SKIP} points earns a skip day 🎟️ — use it on a day off to keep your streak going.</p>
    <button class="link-btn" data-open-settings>Edit goals</button>`;
}

// ---------------------------------------------------------------------------
// Logging a day (+ celebrations)
// ---------------------------------------------------------------------------

const RANK = { missed: 0, progress: 0.5, skip: 1, regular: 2, big: 3 };

async function setDay(key, status, steps) {
  const before = snapshot();
  const old = state.days[key];
  if (status === 'skip' && old?.status !== 'skip' && before.skips.available < 1) {
    toast('No skip days yet — keep stepping to earn one! 🎟️');
    return;
  }
  if (status === null) delete state.days[key];
  else {
    const entry = { status };
    if (Number.isFinite(steps) && steps > 0) entry.steps = Math.round(steps);
    state.days[key] = entry;
  }
  if (!state.meta.startedOn || key < state.meta.startedOn) state.meta.startedOn = key;
  save();
  closeSheet();
  render();
  popCell(key);

  if (status === 'progress') {
    const e = L.encouragement(steps || 0, state.settings.regularGoal);
    toast(`${fmt(Math.round(steps || 0))} steps saved! ${fmt(e.left)} to go, about ${L.formatDuration(e.minutes * 60000)} of walking 💪`, { duration: 4500 });
    return;
  }
  if (!status || status === old?.status) return;
  const after = snapshot();
  const improved = RANK[status] > (old ? RANK[old.status] : -1);

  // 1. The day itself
  if (status === 'big' && improved) {
    fx.vibrate([30, 40, 30, 40, 80]);
    fx.cannons();
    fx.emojiRain(theme.rain);
    fx.banner('BIG GOAL!', theme.bigSub || pick(MSG.big));
    await wait(1600);
  } else if (status === 'regular' && improved) {
    fx.vibrate(40);
    fx.confetti();
    toast(pick(MSG.regular));
    await wait(900);
  } else if (status === 'skip') {
    fx.flyTo('🎟️', $('#stat-skips'), document.querySelector(`[data-day="${key}"]`));
    toast(pick(MSG.skip));
  } else if (status === 'missed') {
    const broke = after.streak < before.streak;
    if (broke && after.skips.available > 0) {
      toast(`Want to use a skip day to keep your ${before.streak}-day streak? 🎟️`, {
        action: 'Use skip day',
        onAction: () => setDay(key, 'skip', steps),
        duration: 7000,
      });
    } else {
      toast(pick(MSG.missed));
    }
  }

  // 2. Earned a skip day
  if (after.skips.earned > before.skips.earned) {
    await fx.flyTo('🎟️', null, $('#stat-skips'));
    await showModal({
      emoji: '🎟️',
      title: 'You earned a skip day!',
      body: `Save it for a busy or lazy day — it keeps your streak alive. You have <b>${after.skips.available}</b> now.`,
      cta: 'Nice!',
      fx: () => fx.confetti({ count: 80, colors: ['#a78bfa', '#c4b5fd', '#f0abfc', '#ffffff'] }),
    });
  }

  // 3. Streak milestone / personal best
  let milestone = L.crossedMilestone(before.streak, after.streak);
  if (milestone) {
    // Celebrate each milestone once per streak (e.g. not again after a missed day is rescued by a skip).
    const t = todayKey();
    const end = state.days[t] ? t : L.addDays(t, -1);
    const start = L.addDays(end, -(after.streak - 1));
    const prev = state.meta.celebrated;
    if (prev && prev.start === start && prev.milestone >= milestone) milestone = null;
    else {
      state.meta.celebrated = { start, milestone };
      save();
    }
  }
  if (milestone) {
    fx.vibrate([60, 40, 60, 40, 120]);
    await showModal({
      emoji: '🔥',
      title: `${milestone}-day streak!`,
      body: milestoneMessage(milestone),
      cta: 'Keep it going!',
      big: true,
      fx: () => fx.fireworks(milestone >= 30 ? 10 : 6),
    });
  } else if (after.best > before.best && after.best >= 3 && after.streak === after.best) {
    toast(`New personal best: ${after.best} days! 🏆`);
  }
}

function milestoneMessage(m) {
  const name = state.settings.name.trim();
  const you = name ? `${esc(name)}, you’ve` : 'You’ve';
  if (m <= 3) return `${you} hit your goal 3 days in a row. The habit is forming! 🌱`;
  if (m <= 7) return `A whole week! ${you} officially got momentum. 💪`;
  if (m <= 14) return `Two weeks strong! ${you} made this a real habit. 🌷`;
  if (m <= 30) return `${you} been at it for ${m} days. That’s seriously impressive. 🏅`;
  return `${m} days. ${you} become a walking legend. 👑`;
}

function popCell(key) {
  const el = document.querySelector(`[data-day="${key}"]`);
  if (el) fx.pulse(el, 'pop');
}

// ---------------------------------------------------------------------------
// Sheets (day editor, settings)
// ---------------------------------------------------------------------------

function openSheet(html) {
  const sheet = $('#sheet');
  sheet.innerHTML = `<div class="sheet-handle"></div>${html}`;
  sheetGen++;
  sheet.hidden = false;
  $('#backdrop').hidden = false;
  requestAnimationFrame(() => {
    sheet.classList.add('open');
    $('#backdrop').classList.add('open');
  });
}

let sheetGen = 0; // guards against a closing sheet's delayed hide hiding a newly opened one

function closeSheet() {
  const sheet = $('#sheet');
  if (sheet.hidden) return;
  sheet.classList.remove('open');
  $('#backdrop').classList.remove('open');
  const gen = ++sheetGen;
  setTimeout(() => {
    if (gen !== sheetGen) return;
    sheet.hidden = true;
    if ($('#modal').hidden) $('#backdrop').hidden = true;
  }, 250);
}

// Swipe the sheet down to close it (like a native iPhone sheet). It only starts when
// the sheet is scrolled to the top, so scrolling inside a long sheet still works.
(function enableSheetSwipe() {
  const sheet = $('#sheet');
  const backdrop = $('#backdrop');
  let startY = 0;
  let lastY = 0;
  let lastT = 0;
  let velocity = 0;
  let dragging = false;
  let tracking = false;

  sheet.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || sheet.scrollTop > 0) return;
    tracking = true;
    dragging = false;
    startY = lastY = e.touches[0].clientY;
    lastT = e.timeStamp;
    velocity = 0;
  }, { passive: true });

  sheet.addEventListener('touchmove', (e) => {
    if (!tracking) return;
    const y = e.touches[0].clientY;
    const dy = y - startY;
    if (!dragging) {
      if (dy < -4 || sheet.scrollTop > 0) {
        tracking = false; // swiping up: let the sheet scroll normally
        return;
      }
      if (dy < 8) return;
      dragging = true;
      sheet.style.transition = 'none';
      backdrop.style.transition = 'none';
      document.activeElement?.blur?.(); // tuck the keyboard away
    }
    e.preventDefault();
    const dt = Math.max(1, e.timeStamp - lastT);
    velocity = (y - lastY) / dt; // px per ms
    lastY = y;
    lastT = e.timeStamp;
    const offset = Math.max(0, dy);
    sheet.style.transform = `translateY(${offset}px)`;
    backdrop.style.opacity = String(Math.max(0, 1 - offset / (sheet.offsetHeight || 1)));
  }, { passive: false });

  const end = () => {
    if (!tracking) return;
    tracking = false;
    if (!dragging) return;
    dragging = false;
    const offset = lastY - startY;
    const shouldClose = offset > sheet.offsetHeight * 0.3 || velocity > 0.6;
    sheet.style.transition = '';
    backdrop.style.transition = '';
    sheet.style.transform = '';
    backdrop.style.opacity = '';
    if (shouldClose) closeSheet();
  };
  sheet.addEventListener('touchend', end);
  sheet.addEventListener('touchcancel', end);
})();

function openDaySheet(key) {
  const d = state.days[key];
  const { skips } = snapshot();
  const canSkip = skips.available > 0 || d?.status === 'skip';
  const btn = (status) => {
    const info = STATUS_INFO[status];
    const active = d?.status === status ? 'active' : '';
    const disabled = status === 'skip' && !canSkip ? 'disabled' : '';
    return `<button class="btn ${status}-btn ${active}" data-log="${status}" data-key="${key}" ${disabled}><span>${info.emoji}</span>${info.label}</button>`;
  };
  openSheet(`
    <p class="eyebrow">${relativeLabel(key) === prettyDate(key) ? '' : relativeLabel(key)}</p>
    <h2>${prettyDate(key)}</h2>
    <form class="steps-form" data-steps-form="${key}">
      <label for="steps-input">Step count <span class="muted">(optional)</span></label>
      <div class="row">
        <input id="steps-input" type="number" inputmode="numeric" min="0" step="1" placeholder="e.g. 8,200" value="${d?.steps ?? ''}" />
        <button class="btn primary" type="submit">Save</button>
      </div>
      <p class="muted small">We’ll figure out which goal you hit. Step counts also help the goal coach.</p>
    </form>
    <div class="sheet-buttons">
      ${btn('big')}
      ${btn('regular')}
      ${btn('skip')}
      ${btn('missed')}
    </div>
    <p class="muted small center">${
      canSkip
        ? `You have ${skips.available} skip day${skips.available === 1 ? '' : 's'} 🎟️`
        : `No skip days yet — ${skips.pointsPerSkip - skips.progress} more points to earn one!`
    }</p>
    ${d ? `<button class="link-btn danger center-block" data-clear-day="${key}">Clear this day</button>` : ''}
  `);
}

function openSettings() {
  const { name } = state.settings;
  const cheat = Cheat.on();
  const { regularGoal, bigGoal } = cheat ? CHEAT : state.settings;
  openSheet(`
    <h2>Settings</h2>
    <form class="settings-form" data-settings-form>
      <label>Your name<input name="name" type="text" maxlength="30" value="${esc(name)}" placeholder="So we can cheer for you" /></label>
      <label>👟 Daily goal (steps)<input name="regularGoal" type="number" inputmode="numeric" min="1" step="1" value="${regularGoal}" required /></label>
      <label>🌟 Big goal (steps)<input name="bigGoal" type="number" inputmode="numeric" min="1" step="1" value="${bigGoal}" required /></label>
      ${cheat ? '<p class="small cheat-note">🔓 Cheat mode is on, on this phone only. Save any other goals to turn it off.</p>' : ''}
      <button class="btn primary" type="submit">Save</button>
    </form>
    <hr />
    ${sunSettingsHtml()}
    <hr />
    ${themePickerHtml()}
    <hr />
    <h3>Backup</h3>
    ${Drive.enabled() ? googleSettingsHtml() : ''}
    ${Drive.enabled() ? '<details class="file-backup"><summary>Backup file (optional)</summary>' : ''}
    <p class="muted small">${
      Drive.enabled()
        ? 'You can also save a copy as a file (Save to Files, or text it to someone).'
        : 'Your days are saved only on this phone. Deleting the Steppy icon from your home screen erases them, so back up now and then. Choose <b>Save to Files</b> (iCloud Drive) or send the file to someone you trust.'
    }</p>
    ${Drive.enabled() ? '' : `<p class="small"><b>${lastBackupText()}</b></p>`}
    <div class="row">
      <button class="btn ghost" data-export>Save file</button>
      <label class="btn ghost file-btn">Restore file<input type="file" accept=".json,application/json,text/plain" data-import hidden /></label>
    </div>
    ${Drive.enabled() ? '</details>' : ''}
    <button class="link-btn danger center-block" data-reset>Reset everything</button>
  `);
}

function googleSettingsHtml() {
  const g = state.meta.google;
  if (!g.connected) {
    return `
      <p class="muted small">Sign in with Google once and Steppy saves your days to Google Drive automatically.</p>
      <button class="btn primary wide" data-google-connect>Sign in with Google</button>`;
  }
  return `
    <p class="small">☁️ Backing up automatically${g.email ? ` to <b>${esc(g.email)}</b>` : ''}.</p>
    <p class="muted small">${g.lastSyncAt ? `Last saved ${agoText(g.lastSyncAt)}.` : 'Not saved yet.'}</p>
    <div class="row">
      <button class="btn ghost" data-google-sync>Back up now</button>
      <button class="btn ghost" data-google-disconnect>Sign out</button>
    </div>`;
}

function unlockEverything() {
  if (!Cheat.on()) Cheat.set(true);
  closeSheet();
  render();
  fx.vibrate([50, 40, 50, 40, 150]);
  fx.fireworks(8);
  showModal({
    emoji: '🔓',
    title: 'Cheat code accepted!',
    body: `Every theme is unlocked: all ${Gumballs.GUMBALLS.length} gumballs, plus every holiday theme any day of the year. Pick one in Settings ⚙️`,
    cta: 'Let’s see them! 🍬',
    big: true,
  });
}

function saveSettings(form) {
  const data = new FormData(form);
  const regularGoal = Math.round(Number(data.get('regularGoal')));
  const bigGoal = Math.round(Number(data.get('bigGoal')));
  if (regularGoal === CHEAT.regularGoal && bigGoal === CHEAT.bigGoal) {
    if (Cheat.on()) {
      state.settings.name = String(data.get('name') || '').trim();
      save();
      closeSheet();
      return render();
    }
    return unlockEverything();
  }
  if (!(regularGoal >= 1)) return toast('Enter a daily goal 👟');
  if (!(bigGoal > regularGoal)) return toast('Big goal should be bigger than the daily goal 🙂');
  const wasCheating = Cheat.on();
  if (wasCheating) Cheat.set(false);
  const changed = regularGoal !== state.settings.regularGoal || bigGoal !== state.settings.bigGoal;
  state.settings.name = String(data.get('name') || '').trim();
  state.settings.regularGoal = regularGoal;
  state.settings.bigGoal = bigGoal;
  if (changed) {
    state.meta.goalsChangedOn = todayKey();
    state.meta.suggestionSnoozedUntil = null;
  }
  save();
  closeSheet();
  render();
  toast(wasCheating ? 'Cheat mode off. Everything’s back to normal ✅' : 'Saved! ✅');
}

async function exportBackup() {
  const prev = state.meta.lastBackupOn;
  state.meta.lastBackupOn = todayKey();
  const filename = `steppy-backup-${todayKey()}.json`;
  const json = JSON.stringify(backupPayload(), null, 2);
  const file = new File([json], filename, { type: 'application/json' });
  try {
    // On phones this opens the share sheet: Save to Files (iCloud Drive), Messages, Mail, AirDrop…
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Steppy backup' });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
  } catch (err) {
    state.meta.lastBackupOn = prev; // share sheet was cancelled
    if (err?.name !== 'AbortError') toast('Couldn’t create the backup. Please try again.');
    return;
  }
  state.meta.backupSnoozedUntil = null;
  save();
  render();
  if (!$('#sheet').hidden) openSettings();
  toast('Backup saved! Your streak is safe 💾');
}

async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data || typeof data.days !== 'object' || !data.settings) throw new Error('bad file');
    const hasData = Object.keys(state.days).length > 0;
    if (hasData && !confirm('Replace what’s on this phone with this backup?')) return;
    const google = state.meta.google;
    state = normalize(data);
    state.meta.google = google;
    state.settings.onboarded = true;
    save();
    closeSheet();
    closeModal();
    render();
    const n = Object.keys(state.days).length;
    fx.confetti({ count: 90 });
    toast(`Welcome back! ${n} day${n === 1 ? '' : 's'} restored 🎉`);
  } catch {
    toast('That doesn’t look like a Steppy backup file.');
  }
}

// ---------------------------------------------------------------------------
// Modal & toast
// ---------------------------------------------------------------------------

let modalResolve = null;
let modalGen = 0; // guards against a closing modal's delayed hide hiding the next one

function showModal({ emoji, title, body, cta = 'Yay!', big = false, fx: effect, html = '' }) {
  return new Promise((resolve) => {
    const m = $('#modal');
    modalGen++;
    m.classList.remove('open');
    m.innerHTML = `
      <div class="modal-card ${big ? 'big' : ''}">
        <div class="modal-emoji">${emoji}</div>
        <h2>${title}</h2>
        ${body ? `<p>${body}</p>` : ''}
        ${html}
        ${cta ? `<button class="btn primary wide" data-close-modal>${cta}</button>` : ''}
      </div>`;
    m.hidden = false;
    $('#backdrop').hidden = false;
    requestAnimationFrame(() => {
      m.classList.add('open');
      $('#backdrop').classList.add('open');
    });
    effect?.();
    modalResolve = resolve;
  });
}

function closeModal() {
  const m = $('#modal');
  if (m.hidden) return;
  m.classList.remove('open');
  if ($('#sheet').hidden) $('#backdrop').classList.remove('open');
  const gen = modalGen;
  setTimeout(() => {
    if (gen !== modalGen) return; // a new modal opened meanwhile
    m.hidden = true;
    if ($('#sheet').hidden) $('#backdrop').hidden = true;
  }, 200);
  const r = modalResolve;
  modalResolve = null;
  r?.();
}

let toastTimer = null;
function toast(msg, { action, onAction, duration = 3200 } = {}) {
  const el = $('#toast');
  el.innerHTML = `<span></span>${action ? `<button class="toast-action"></button>` : ''}`;
  el.querySelector('span').textContent = msg;
  if (action) {
    const b = el.querySelector('button');
    b.textContent = action;
    b.onclick = () => {
      el.classList.remove('show');
      onAction();
    };
  }
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

function onboard() {
  showModal({
    emoji: '👣',
    title: 'Welcome to Steppy!',
    body: 'Hit your step goal, build streaks, earn skip days — no money, no pressure. Just cheering. 📣',
    cta: null,
    html: `
      <form class="settings-form" data-onboard-form>
        <label>What should we call you?<input name="name" type="text" maxlength="30" placeholder="Your name" /></label>
        <div class="row two">
          <label>👟 Daily goal<input name="regularGoal" type="number" inputmode="numeric" min="1" step="1" value="${state.settings.regularGoal}" required /></label>
          <label>🌟 Big goal<input name="bigGoal" type="number" inputmode="numeric" min="1" step="1" value="${state.settings.bigGoal}" required /></label>
        </div>
        <p class="muted small">Not sure? Start easy — the goal coach will suggest changes as you go.</p>
        <button class="btn primary wide" type="submit">Let’s go! 🎉</button>
      </form>
      ${
        Drive.enabled()
          ? `<p class="muted small restore-hint">Used Steppy before?
        <button class="link-btn" type="button" data-google-restore>Restore with Google</button></p>`
          : `<p class="muted small restore-hint">Used Steppy before?
        <label class="link-btn file-btn">Restore from a backup<input type="file" accept=".json,application/json,text/plain" data-import hidden /></label>
      </p>`
      }`,
  });
}

function finishOnboarding(form) {
  const data = new FormData(form);
  const regularGoal = Math.round(Number(data.get('regularGoal')));
  const bigGoal = Math.round(Number(data.get('bigGoal')));
  if (!(regularGoal >= 1)) return toast('Enter a daily goal 👟');
  if (!(bigGoal > regularGoal)) return toast('Big goal should be bigger than the daily goal 🙂');
  state.settings = { ...state.settings, name: String(data.get('name') || '').trim(), regularGoal, bigGoal, onboarded: true };
  state.meta.startedOn = todayKey();
  state.meta.lastMonthSeen = todayKey().slice(0, 7); // no "welcome to <month>" right after signing up
  const seasonal = Themes.seasonalTheme(new Date());
  if (seasonal) {
    state.settings.theme = seasonal.id; // start in the holiday that's on now
    state.meta.themeBeforeHoliday = 'classic';
    state.meta.holidaysAnnounced = [...(state.meta.holidaysAnnounced || []), Themes.seasonKey(seasonal, new Date())];
  }
  state.meta.themesAnnounced = Themes.openOn(new Date()).map((t) => t.id); // no popups for what she starts with
  syncUnlocks();
  state.meta.goalsChangedOn = todayKey();
  save();
  closeModal();
  render();
  setTimeout(async () => {
    await fx.flyTo('🎟️', null, $('#stat-skips'));
    toast('Here’s a free skip day to get you started 🎟️');
  }, 350);
  fx.confetti({ count: 90 });
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

document.addEventListener('click', (e) => {
  const t = e.target.closest('button, [data-day], label.file-btn, [data-open-machine]');
  if (!t) return;
  if ('openMachine' in t.dataset) {
    if (!$('#modal').hidden) closeModal();
    return openMachine();
  }
  if (t.dataset.spin) return doSpin(t.dataset.spin === 'any' ? null : t.dataset.spin);

  if (t.dataset.log) return setDay(t.dataset.key, t.dataset.log, readStepsInput(t.dataset.key));
  if (t.dataset.day) return openDaySheet(t.dataset.day);
  if (t.dataset.openDay) return openDaySheet(t.dataset.openDay);
  if ('clearDay' in t.dataset) return setDay(t.dataset.clearDay, null);
  if ('openSettings' in t.dataset || t.id === 'settings-btn') return openSettings();
  if ('closeModal' in t.dataset) return closeModal();
  if ('export' in t.dataset) return exportBackup();
  if ('googleConnect' in t.dataset) return Drive.signIn({ after: 'connect', hint: state.meta.google.email });
  if ('googleRestore' in t.dataset) return Drive.signIn({ after: 'restore' });
  if ('googleSync' in t.dataset) {
    state.meta.changedAt = Date.now();
    save({ dirty: false });
    if (!Drive.token()) return Drive.signIn({ after: 'sync', hint: state.meta.google.email });
    return syncNow({ announce: true });
  }
  if ('googleDisconnect' in t.dataset) {
    if (!confirm('Stop backing up to Google? Your days stay on this phone.')) return;
    Drive.forgetToken();
    state.meta.google = { ...defaultState().meta.google };
    save({ dirty: false });
    closeSheet();
    render();
    return toast('Signed out of Google.');
  }
  if ('snoozeGoogle' in t.dataset) {
    state.meta.google.snoozedUntil = L.addDays(todayKey(), 7);
    save({ dirty: false });
    return render();
  }
  if ('snoozeBackup' in t.dataset) {
    state.meta.backupSnoozedUntil = L.addDays(todayKey(), 3);
    save();
    render();
    return;
  }
  if ('reset' in t.dataset) {
    if (confirm('Erase all your days and settings? This can’t be undone.') && confirm('Really sure? 🥺')) {
      localStorage.removeItem(STORE_KEY);
      Drive.forgetToken(); // never let an empty phone overwrite the Google backup
      state = defaultState();
      closeSheet();
      render();
      setTimeout(onboard, 300);
    }
    return;
  }
  if ('acceptSuggestion' in t.dataset) {
    const s = $('#suggestion');
    state.settings.regularGoal = Number(s.dataset.regular);
    state.settings.bigGoal = Number(s.dataset.big);
    state.meta.goalsChangedOn = todayKey();
    state.meta.suggestionSnoozedUntil = null;
    save();
    render();
    fx.confetti({ count: 70 });
    toast('New goals set! You’ve got this 💪');
    return;
  }
  if ('snoozeSuggestion' in t.dataset) {
    state.meta.suggestionSnoozedUntil = L.addDays(todayKey(), 7);
    save();
    render();
    toast('No problem — I’ll check back in a week 💕');
    return;
  }
  if (t.dataset.sun) return setSun(t.dataset.sun);
  if (t.dataset.tryTheme) {
    chooseTheme(t.dataset.tryTheme);
    closeModal();
    fx.confetti({ count: 110 });
    toast(`${theme.name} theme on! ${theme.emoji}`);
    return;
  }
  if (t.dataset.themePick) {
    chooseTheme(t.dataset.themePick);
    openSettings();
    fx.confetti({ count: 90 });
    return;
  }
  if (t.id === 'prev-month') {
    view = view.m === 0 ? { y: view.y - 1, m: 11 } : { y: view.y, m: view.m - 1 };
    return renderCalendar();
  }
  if (t.id === 'next-month' && !t.disabled) {
    view = view.m === 11 ? { y: view.y + 1, m: 0 } : { y: view.y, m: view.m + 1 };
    return renderCalendar();
  }
});

function readStepsInput(key) {
  const form = document.querySelector(`[data-steps-form="${key}"]`);
  if (!form || $('#sheet').hidden) return undefined;
  const v = Number(form.querySelector('input').value);
  return Number.isFinite(v) && v > 0 ? v : undefined;
}

document.addEventListener('submit', (e) => {
  const f = e.target;
  e.preventDefault();
  if (f.dataset.stepsForm) {
    const key = f.dataset.stepsForm;
    const steps = Number(f.querySelector('input').value);
    if (!(steps > 0)) return toast('Type in your step count first 👟');
    let status = L.classifySteps(steps, state.settings);
    if (status === 'missed' && key === todayKey()) status = 'progress'; // the day isn't over yet!
    return setDay(key, status, steps);
  }
  if ('settingsForm' in f.dataset) return saveSettings(f);
  if ('onboardForm' in f.dataset) return finishOnboarding(f);
});

document.addEventListener('change', (e) => {
  if ('import' in e.target.dataset && e.target.files[0]) importBackup(e.target.files[0]);
});

$('#backdrop').addEventListener('click', () => {
  if (!$('#modal').hidden && state.settings.onboarded) return closeModal();
  closeSheet();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#modal').hidden && state.settings.onboarded) closeModal();
  else closeSheet();
});

// No zooming. iPhone Safari ignores the viewport's user-scalable=no, so cancel pinch
// gestures directly (Safari's gesture events, plus any two-finger touch move).
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
}
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length > 1) e.preventDefault();
  },
  { passive: false },
);

// iPhone keeps a home-screen app paused in memory, so it may never reload on its own.
// Whenever Steppy comes back on screen, ask the website which version is live and
// refresh if it's newer (at most once per version, so it can never loop).
async function checkForUpdate() {
  if (location.protocol === 'file:' || !navigator.onLine) return false;
  if (spinning || !$('#sheet').hidden) return false; // don't interrupt her mid-action
  try {
    const res = await fetch(`version.js?check=${Date.now()}`, { cache: 'no-store' });
    const live = (await res.text()).match(/APP_VERSION = '([^']+)'/)?.[1];
    if (!live || live === APP_VERSION) return false;
    const key = 'steppy:reloaded-for';
    if (sessionStorage.getItem(key) === live) return false;
    sessionStorage.setItem(key, live);
    await navigator.serviceWorker?.getRegistration().then((r) => r?.update()).catch(() => {});
    location.reload();
    return true;
  } catch {
    return false;
  }
}

// Re-render when coming back to the app (the date may have changed overnight).
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible') return;
  if (await checkForUpdate()) return;
  render();
  if (maybeRenewGoogle()) return;
  syncNow();
  refreshWeather();
  runAnnouncements();
});
addEventListener('online', () => syncNow());

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Google Drive sync
// ---------------------------------------------------------------------------

let syncTimer = null;
let syncing = false;

/** What goes into a backup (sign-in details stay on the device). */
function backupPayload() {
  const { google, ...meta } = state.meta;
  return { ...state, meta, app: 'steppy', exportedAt: new Date().toISOString() };
}

function scheduleSync(delay = 1500) {
  if (!Drive.enabled() || !state.meta.google?.connected) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncNow(), delay);
  renderSyncStatus();
}

async function syncNow({ announce = false } = {}) {
  const g = state.meta.google;
  if (syncing || !Drive.enabled() || !g.connected || !navigator.onLine) return;
  if (!Drive.token()) return renderSyncStatus(); // renewed next time the app opens
  if (g.lastSyncAt >= state.meta.changedAt) return renderSyncStatus();
  if (Object.keys(state.days).length === 0) return; // never overwrite a backup with an empty phone
  syncing = true;
  renderSyncStatus();
  const startedAt = Date.now();
  try {
    g.fileId = await Drive.upload(backupPayload(), g.fileId);
    g.lastSyncAt = startedAt;
    save({ dirty: false });
    if (announce) toast('Backed up to Google ☁️');
  } catch (e) {
    if (announce) toast(e.code === 'auth' ? 'Google sign-in expired — reopen Steppy to reconnect.' : 'Couldn’t reach Google. Will try again later.');
  } finally {
    syncing = false;
    renderSyncStatus();
  }
  if (state.meta.changedAt > g.lastSyncAt && g.lastSyncAt === startedAt) scheduleSync(); // changes made mid-upload
}

/** Quietly get a fresh Google token (leaves the page briefly). Returns true if it navigated away. */
function maybeRenewGoogle() {
  const g = state.meta.google;
  if (!Drive.enabled() || !g.connected || g.needsReconnect || Drive.token() || !navigator.onLine) return false;
  if (Date.now() - Drive.lastSilentAttempt() < 5 * 60 * 1000) return false; // avoid loops
  Drive.silentRenew(g.email);
  return true;
}

async function handleGoogleReturn(r) {
  const g = state.meta.google;
  if (r.error) {
    if (r.silent) {
      g.needsReconnect = true;
      save({ dirty: false });
      render();
    } else if (r.error !== 'access_denied') {
      toast('Google sign-in didn’t work. Please try again.');
    }
    return;
  }
  if (r.after === 'sync') {
    g.needsReconnect = false;
    save({ dirty: false });
    return syncNow({ announce: !r.silent });
  }
  // 'connect' or 'restore': combine this phone with whatever is already in Drive.
  try {
    renderSyncStatus();
    const [me, remote] = await Promise.all([Drive.whoAmI().catch(() => ({})), Drive.download()]);
    const before = Object.keys(state.days).length;
    const wasOnboarded = state.settings.onboarded;
    const google = { ...g, connected: true, needsReconnect: false, email: me.emailAddress || g.email, fileId: remote?.id || g.fileId };
    if (remote?.data?.days) {
      const merged = normalize(L.mergeBackup(state, remote.data));
      merged.meta.google = google;
      state = merged;
    } else {
      state.meta.google = google;
      if (r.after === 'restore' && !wasOnboarded) {
        save({ dirty: false });
        toast('No Steppy backup in that Google account yet — let’s start fresh! 👟', { duration: 5000 });
        return;
      }
    }
    state.meta.changedAt = Date.now();
    save({ dirty: false });
    closeModal();
    render();
    const restored = Object.keys(state.days).length - before;
    if (restored > 0) {
      fx.confetti({ count: 100 });
      toast(`Welcome back! ${restored} day${restored === 1 ? '' : 's'} restored from Google 🎉`, { duration: 4500 });
    } else {
      fx.confetti({ count: 60, colors: ['#4ecdc4', '#7dd3fc', '#a78bfa', '#ffffff'] });
      toast('All set! Steppy now backs up to Google automatically ☁️', { duration: 4500 });
    }
    await syncNow();
  } catch {
    toast('Couldn’t reach Google Drive. Please try again in a bit.');
  }
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

$('#app-version').textContent = `v${APP_VERSION}`;
setInterval(() => {
  if (document.visibilityState === 'visible' && $('#sheet').hidden && $('#modal').hidden) renderToday();
  refreshWeather();
}, 60000);
render();
(async () => {
  const ret = Drive.enabled() ? Drive.fromRedirect() : null;
  if (ret) await handleGoogleReturn(ret);
  else if (maybeRenewGoogle()) return;
  if (!state.settings.onboarded) setTimeout(onboard, 250);
  else setTimeout(runAnnouncements, 500);
  syncNow();
  setTimeout(checkForUpdate, 3000); // in case a slow connection served an older saved copy
})();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // When a new version takes over, reload once so it shows up immediately.
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    location.reload();
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
