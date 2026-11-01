// Pure, DOM-free logic for Steppy. Everything here is unit-tested in tests/.

export const STATUS = Object.freeze({
  REGULAR: 'regular',
  BIG: 'big',
  MISSED: 'missed',
  SKIP: 'skip',
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
  if (!days[k]) k = addDays(k, -1);
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

export function skipInfo(days) {
  let points = 0;
  let used = 0;
  for (const v of Object.values(days)) {
    if (v.status === STATUS.SKIP) used++;
    else points += POINTS[v.status] ?? 0;
  }
  const earned = STARTER_SKIPS + Math.floor(points / POINTS_PER_SKIP);
  return {
    earned,
    used,
    available: Math.max(0, earned - used),
    progress: points % POINTS_PER_SKIP,
    pointsPerSkip: POINTS_PER_SKIP,
  };
}

// ---------- steps ----------

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

const round500 = (n) => Math.round(n / 500) * 500;
const floor500 = (n) => Math.floor(n / 500) * 500;

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
    if (d && d.status !== STATUS.SKIP) entries.push(d);
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
    regularGoal = Math.max(1000, regularGoal);
    bigGoal = Math.max(regularGoal + 1000, bigGoal);
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
    if (med && med < reg) newReg = Math.max(reg - 2000, Math.min(reg - 500, floor500(med)));
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
    const target = med ? round500(Math.max(med * 1.2, reg + 1500)) : big - 1000;
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
    meta: { ...(local?.meta || {}), ...(fresh ? remote?.meta || {} : {}), startedOn: starts[0] || null },
    days: { ...remoteDays, ...localDays },
  };
}
