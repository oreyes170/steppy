// Pure, DOM-free logic for Steppy. Everything here is unit-tested in tests/.

export const STATUS = Object.freeze({
  REGULAR: 'regular',
  BIG: 'big',
  MISSED: 'missed',
  SKIP: 'skip',
  // today, steps entered but not at the goal yet: counts like an unlogged day until it's over
  PROGRESS: 'progress',
});

/** Streak lengths that get a big celebration. */
export const MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 250, 300, 365, 500, 730, 1000];

/** Points: a regular-goal day is worth 1, a big-goal day is worth 2. */
export const POINTS = { regular: 1, big: 2 };
/** Points needed to earn one skip day. */
export const POINTS_PER_SKIP = 10;
/** Free skip days given when starting out. */
export const STARTER_SKIPS = 1;

/** How many recent days the goal coach looks at. */
export const COACH_WINDOW = 14;
/** Minimum logged days (since the last goal change) before the coach speaks up. */
export const COACH_MIN_DAYS = 7;

// ---------- dates (always local time, keyed as YYYY-MM-DD) ----------

export function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

// ---------- streaks ----------

export function keepsStreak(status) {
  return status === STATUS.REGULAR || status === STATUS.BIG || status === STATUS.SKIP;
}

/**
 * Current streak ending today. If today isn't logged yet it doesn't break the
 * streak (the day isn't over) — we count back from yesterday instead.
 */
export function currentStreak(days, todayKey) {
  let k = todayKey;
  if (!days[k] || days[k].status === STATUS.PROGRESS) k = addDays(k, -1);
  let n = 0;
  while (days[k] && keepsStreak(days[k].status)) {
    n++;
    k = addDays(k, -1);
  }
  return n;
}

export function bestStreak(days) {
  const keys = Object.keys(days)
    .filter((k) => keepsStreak(days[k].status))
    .sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const k of keys) {
    run = prev && addDays(prev, 1) === k ? run + 1 : 1;
    if (run > best) best = run;
    prev = k;
  }
  return best;
}

/** The milestone (if any) reached by moving from `before` to `after`. */
export function crossedMilestone(before, after) {
  let hit = null;
  for (const m of MILESTONES) {
    if (before < m && after >= m) hit = m;
  }
  return hit;
}

export function nextMilestone(streak) {
  return MILESTONES.find((m) => m > streak) ?? null;
}

// ---------- skip days ----------

export function skipInfo(days, spent = 0) {
  let points = 0;
  let used = 0;
  let bonus = 0;
  for (const v of Object.values(days)) {
    if (v.status === STATUS.SKIP) used++;
    else {
      points += POINTS[v.status] ?? 0;
      if (v.status === STATUS.REGULAR || v.status === STATUS.BIG) bonus += Math.max(0, Math.floor(v.bonus) || 0);
    }
  }
  const earned = STARTER_SKIPS + Math.floor(points / POINTS_PER_SKIP) + bonus;
  return {
    earned,
    bonus,
    used,
    spent,
    available: Math.max(0, earned - used - spent),
    progress: points % POINTS_PER_SKIP,
    pointsPerSkip: POINTS_PER_SKIP,
  };
}

// ---------- steps ----------

/**
 * Bonus skip tickets for going way past a goal: one for every extra multiple of each goal
 * (2× the goal = +1, 3× = +2, …), counted for the daily goal and the big goal separately.
 * Saved on the day when it's logged, so changing goals later never changes old bonuses.
 */
export function goalMultiples(steps, { regularGoal, bigGoal }) {
  const x = (goal) => (goal > 0 && steps > 0 ? Math.floor(steps / goal) : 0);
  return { regular: x(regularGoal), big: x(bigGoal) };
}
export function bonusTickets(steps, goals) {
  const m = goalMultiples(steps, goals);
  return Math.max(0, m.regular - 1) + Math.max(0, m.big - 1);
}

export function classifySteps(steps, { regularGoal, bigGoal }) {
  if (steps >= bigGoal) return STATUS.BIG;
  if (steps >= regularGoal) return STATUS.REGULAR;
  return STATUS.MISSED;
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** The goal coach suggests goals in steps of 100 (e.g. 7,300). */
const round100 = (n) => Math.round(n / 100) * 100;
const floor100 = (n) => Math.floor(n / 100) * 100;

// ---------- goal coach ----------

/**
 * Looks at the last COACH_WINDOW days and suggests friendlier or bigger goals.
 * Returns null when there's nothing to say (not enough data, snoozed, or she's
 * in a comfortable groove).
 */
export function suggestGoals({ days, settings, meta = {} }, todayKey) {
  const reg = settings.regularGoal;
  const big = settings.bigGoal;
  if (meta.suggestionSnoozedUntil && todayKey < meta.suggestionSnoozedUntil) return null;

  const since = meta.goalsChangedOn || null;
  const entries = [];
  for (let i = 0; i < COACH_WINDOW; i++) {
    const k = addDays(todayKey, -i);
    if (since && k < since) break;
    const d = days[k];
    if (d && d.status !== STATUS.SKIP && d.status !== STATUS.PROGRESS) entries.push(d);
  }
  const n = entries.length;
  if (n < COACH_MIN_DAYS) return null;

  const bigHits = entries.filter((d) => d.status === STATUS.BIG).length;
  const regHits = entries.filter((d) => d.status === STATUS.REGULAR).length + bigHits;
  const regRate = regHits / n;
  const bigRate = bigHits / n;
  const steps = entries.map((d) => d.steps).filter((s) => Number.isFinite(s) && s > 0);
  const med = steps.length >= 5 ? median(steps) : null;
  const stats = { days: n, regHits, bigHits };

  const finish = (kind, regularGoal, bigGoal, title, message) => {
    // Only goals the coach is changing get rounded; her own exact numbers stay as they are.
    if (regularGoal !== reg) regularGoal = Math.max(1000, round100(regularGoal));
    if (bigGoal !== big || bigGoal < regularGoal + 1000) bigGoal = Math.max(regularGoal + 1000, round100(bigGoal));
    if (regularGoal === reg && bigGoal === big) return null;
    return { kind, regularGoal, bigGoal, title, message, stats };
  };

  // Crushing the big goal → level everything up.
  if (bigRate >= 0.6) {
    const newBig = big + 1000;
    const newReg = Math.min(newBig - 1000, reg + (med && med >= reg + 2000 ? 1000 : 500));
    return finish(
      'raise',
      newReg,
      newBig,
      'You’re on fire! 🔥',
      `You hit your BIG goal ${bigHits} of the last ${n} days. Ready to level up?`,
    );
  }

  // Reliably hitting the regular goal → nudge it up.
  if (regRate >= 0.85) {
    const bump = med && med >= reg + 1500 ? 1000 : 500;
    return finish(
      'raise',
      reg + bump,
      big,
      'You make it look easy ✨',
      `You hit your goal ${regHits} of the last ${n} days. Want to try a little more?`,
    );
  }

  // Struggling → make the goal friendlier. No shame, just momentum.
  if (regRate < 0.5) {
    let newReg = reg - 1000;
    if (med && med < reg) newReg = Math.max(reg - 2000, Math.min(reg - 500, floor100(med)));
    const newBig = bigRate === 0 ? Math.max(newReg + 2000, big - 1000) : big;
    return finish(
      'lower',
      newReg,
      newBig,
      'Let’s make it feel good 💛',
      `Life’s been busy — you hit your goal ${regHits} of the last ${n} days. A goal you can hit builds the habit faster. Try this for a bit?`,
    );
  }

  // Doing fine on regular, but the big goal never happens → make it reachable.
  if (bigRate === 0 && n >= 10 && regRate >= 0.7) {
    const target = med ? round100(Math.max(med * 1.2, reg + 1500)) : big - 1000;
    return finish(
      'lower-big',
      reg,
      Math.min(big - 500, target),
      'Big goal, within reach 🌟',
      `You’re hitting your goal consistently, but the big goal hasn’t happened in ${n} days. Make it a little more reachable?`,
    );
  }

  return null;
}

// ---------- summaries ----------

export function monthSummary(days, year, month) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
  let goal = 0;
  let big = 0;
  for (const [k, v] of Object.entries(days)) {
    if (!k.startsWith(prefix)) continue;
    if (v.status === STATUS.BIG) big++;
    if (v.status === STATUS.BIG || v.status === STATUS.REGULAR) goal++;
  }
  return { goal, big };
}

// ---------- backup merge ----------

/**
 * Combine what's on this device with a backup. Nothing is dropped: days from both are
 * kept, and where both have the same day, this device wins. If this device is fresh
 * (no days logged yet), the backup's settings and goals are used.
 */
export function mergeBackup(local, remote) {
  const localDays = local?.days || {};
  const remoteDays = remote?.days || {};
  const fresh = Object.keys(localDays).length === 0;
  const pick = fresh ? remote : local;
  const starts = [local?.meta?.startedOn, remote?.meta?.startedOn].filter(Boolean).sort();
  return {
    ...pick,
    settings: { ...(local?.settings || {}), ...(fresh ? remote?.settings || {} : {}), onboarded: true },
    meta: {
      ...(local?.meta || {}),
      ...(fresh ? remote?.meta || {} : {}),
      startedOn: starts[0] || null,
      gumballs: mergeGumballs(local?.meta?.gumballs, remote?.meta?.gumballs),
      allUnlocked: !!(local?.meta?.allUnlocked || remote?.meta?.allUnlocked),
      holidaysAnnounced: [...new Set([...(remote?.meta?.holidaysAnnounced || []), ...(local?.meta?.holidaysAnnounced || [])])],
      unlockedThemes: [...new Set([...(remote?.meta?.unlockedThemes || []), ...(local?.meta?.unlockedThemes || [])])],
      themesAnnounced: [...new Set([...(remote?.meta?.themesAnnounced || []), ...(local?.meta?.themesAnnounced || [])])],
    },
    days: { ...remoteDays, ...localDays },
  };
}

/** Theme Machine progress from two places: keep every theme from both, never refund tickets. */
export function mergeGumballs(a = {}, b = {}) {
  return {
    unlocked: !!(a.unlocked || b.unlocked),
    introSeen: !!(a.introSeen || b.introSeen),
    owned: [...new Set([...(b.owned || []), ...(a.owned || [])])],
    spent: Math.max(a.spent || 0, b.spent || 0),
  };
}

// ---------- sunrise & sunset ----------
// The standard NOAA/SunCalc solar position formulas. Runs on the phone, no internet.

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = RAD * 23.4397;

const toDays = (date) => date.valueOf() / DAY_MS - 0.5 + J1970 - J2000;
const fromJulian = (j) => new Date((j + 0.5 - J1970) * DAY_MS);

/**
 * Sunrise and sunset for the calendar day of `date` at latitude/longitude (degrees).
 * Returns { sunrise, sunset } as Dates, or null when the sun doesn't rise or set
 * (polar day/night).
 */
export function sunTimes(date, lat, lng) {
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const lw = RAD * -lng;
  const phi = RAD * lat;
  const d = toDays(noon);
  const n = Math.round(d - 0.0009 - lw / (2 * Math.PI));
  const ds = 0.0009 + lw / (2 * Math.PI) + n;
  const M = RAD * (357.5291 + 0.98560028 * ds);
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const L = M + C + RAD * 102.9372 + Math.PI;
  const dec = Math.asin(Math.sin(OBLIQUITY) * Math.sin(L));
  const transit = (ha) => J2000 + 0.0009 + (ha + lw) / (2 * Math.PI) + n + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const cosH = (Math.sin(RAD * -0.833) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  if (cosH < -1 || cosH > 1) return null;
  const jNoon = transit(0);
  const jSet = transit(Math.acos(cosH));
  return { sunrise: fromJulian(jNoon - (jSet - jNoon)), sunset: fromJulian(jSet) };
}

/** "1h 12m" style duration. */
export function formatDuration(ms) {
  const mins = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

// ---------- in-progress encouragement ----------

/** Brisk walking is roughly 100 steps a minute. */
export const STEPS_PER_MINUTE = 100;

/**
 * How far she is from today's goal, as steps and walking minutes, plus a friendly nudge
 * that depends on how much of the day is left (until midnight, sunset doesn't matter).
 */
export function encouragement(steps, goal, now = new Date()) {
  const left = Math.max(0, goal - steps);
  const minutes = Math.max(1, Math.ceil(left / STEPS_PER_MINUTE));
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const minsLeft = Math.max(0, Math.round((midnight - now) / 60000));
  const walk = minutes >= 60 ? `about ${formatDuration(minutes * 60000)} of walking` : `about a ${minutes}-minute walk`;
  const pct = Math.min(100, Math.round((steps / goal) * 100));
  let msg;
  if (pct >= 90) msg = `So close! Just ${walk}. 🏁`;
  else if (minsLeft > 6 * 60) msg = `Plenty of day left. ${cap(walk)} gets you there! 👟`;
  else if (minsLeft > 3 * 60) msg = `${cap(walk)} this evening and you’ve got it. 🌆`;
  else if (minsLeft > minutes + 30) msg = `Still time! ${cap(walk)}. Laps around the house count too. 🏠`;
  else if (minsLeft > minutes) msg = `It’s tight, but ${walk} still makes it. Pace while you watch TV! 📺`;
  else msg = 'Every step counted today. Proud of you for moving! 💛';
  return { left, minutes, minsLeft, pct, msg };
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
