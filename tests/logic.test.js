import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../logic.js';

const TODAY = '2026-11-10';

/** Build a days map from a string, oldest → newest, ending on `end`. r=regular b=big m=missed s=skip .=unlogged */
function days(pattern, end = TODAY, steps = null) {
  const out = {};
  const chars = [...pattern];
  chars.forEach((c, i) => {
    const k = L.addDays(end, i - (chars.length - 1));
    const status = { r: 'regular', b: 'big', m: 'missed', s: 'skip' }[c];
    if (status) out[k] = steps ? { status, steps: steps[i] } : { status };
  });
  return out;
}

test('date helpers handle month and year boundaries', () => {
  assert.equal(L.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(L.addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(L.dateKey(L.parseKey('2026-07-04')), '2026-07-04');
});

test('current streak counts goal and skip days, ignores unlogged today', () => {
  assert.equal(L.currentStreak(days('rrbsr'), TODAY), 5);
  assert.equal(L.currentStreak(days('rrbr.'), TODAY), 4); // today not logged yet
  assert.equal(L.currentStreak(days('rmrr'), TODAY), 2);
  assert.equal(L.currentStreak(days('rrrm'), TODAY), 0);
  assert.equal(L.currentStreak(days('rr..'), TODAY), 0); // gap yesterday breaks it
  assert.equal(L.currentStreak({}, TODAY), 0);
});

test('best streak finds the longest run anywhere', () => {
  assert.equal(L.bestStreak(days('rrrrmrr.r')), 4);
  assert.equal(L.bestStreak({}), 0);
});

test('milestones', () => {
  assert.equal(L.crossedMilestone(2, 3), 3);
  assert.equal(L.crossedMilestone(3, 4), null);
  assert.equal(L.crossedMilestone(6, 14), 14);
  assert.equal(L.nextMilestone(7), 14);
});

test('skip days: starter skip, big days count double, used skips subtract', () => {
  assert.deepEqual(L.skipInfo({}), { earned: 1, used: 0, spent: 0, available: 1, progress: 0, pointsPerSkip: 10 });
  const s = L.skipInfo(days('rrrrrrrrbb')); // 8 + 4 = 12 points
  assert.equal(s.earned, 2);
  assert.equal(s.progress, 2);
  const used = L.skipInfo(days('ssr'));
  assert.equal(used.available, 0);
});

test('classifySteps', () => {
  const g = { regularGoal: 7000, bigGoal: 10000 };
  assert.equal(L.classifySteps(12000, g), 'big');
  assert.equal(L.classifySteps(7000, g), 'regular');
  assert.equal(L.classifySteps(6999, g), 'missed');
});

const settings = { regularGoal: 7000, bigGoal: 10000 };

test('coach stays quiet with too little data', () => {
  assert.equal(L.suggestGoals({ days: days('mmmmm'), settings }, TODAY), null);
});

test('coach suggests lowering when she is struggling', () => {
  const s = L.suggestGoals({ days: days('mmmrmmmrmm'), settings }, TODAY);
  assert.equal(s.kind, 'lower');
  assert.equal(s.regularGoal, 6000);
  assert.ok(s.bigGoal >= s.regularGoal + 1000);
});

test('coach uses real step counts when lowering', () => {
  const steps = [5000, 5200, 4800, 7100, 5100, 4900, 5300];
  const s = L.suggestGoals({ days: days('mmmrmmm', TODAY, steps), settings }, TODAY);
  assert.equal(s.regularGoal, 5100); // median step count, to the nearest 100
});

test('coach suggests raising when she is consistent', () => {
  const s = L.suggestGoals({ days: days('rrrrrrrrrr'), settings }, TODAY);
  assert.equal(s.kind, 'raise');
  assert.equal(s.regularGoal, 7500);
  assert.equal(s.bigGoal, 10000);
});

test('coach levels up both goals when big goal is routine', () => {
  const s = L.suggestGoals({ days: days('bbbbbrbb'), settings }, TODAY);
  assert.equal(s.kind, 'raise');
  assert.equal(s.bigGoal, 11000);
  assert.equal(s.regularGoal, 7500);
});

test('coach makes the big goal reachable if it never happens', () => {
  const s = L.suggestGoals({ days: days('rrrmrrrrmrrr'), settings }, TODAY);
  assert.equal(s.kind, 'lower-big');
  assert.equal(s.regularGoal, 7000);
  assert.equal(s.bigGoal, 9000);
});

test('coach is quiet in the comfortable middle', () => {
  assert.equal(L.suggestGoals({ days: days('rrmrbrmrrm'), settings }, TODAY), null);
});

test('coach respects snooze and only counts days since last goal change', () => {
  const d = days('mmmmmmmmmm');
  assert.equal(L.suggestGoals({ days: d, settings, meta: { suggestionSnoozedUntil: '2026-11-12' } }, TODAY), null);
  assert.equal(L.suggestGoals({ days: d, settings, meta: { goalsChangedOn: '2026-11-07' } }, TODAY), null);
  assert.ok(L.suggestGoals({ days: d, settings, meta: { goalsChangedOn: '2026-11-01' } }, TODAY));
});

test('coach ignores skip days', () => {
  assert.equal(L.suggestGoals({ days: days('ssssssmm'), settings }, TODAY), null);
});

test('month summary', () => {
  const d = { '2026-11-01': { status: 'big' }, '2026-11-02': { status: 'regular' }, '2026-10-31': { status: 'big' } };
  assert.deepEqual(L.monthSummary(d, 2026, 10), { goal: 2, big: 1 });
});

test('mergeBackup keeps every day and prefers this device on conflicts', () => {
  const local = { settings: { name: 'A', regularGoal: 8000, onboarded: true }, days: { '2026-11-02': { status: 'big' } }, meta: { startedOn: '2026-11-02' } };
  const remote = { settings: { name: 'B', regularGoal: 6000 }, days: { '2026-11-01': { status: 'regular' }, '2026-11-02': { status: 'missed' } }, meta: { startedOn: '2026-10-01' } };
  const m = L.mergeBackup(local, remote);
  assert.deepEqual(m.days, { '2026-11-01': { status: 'regular' }, '2026-11-02': { status: 'big' } });
  assert.equal(m.settings.name, 'A');
  assert.equal(m.meta.startedOn, '2026-10-01');
});

test('mergeBackup on a fresh device takes the backup settings', () => {
  const local = { settings: { name: '', regularGoal: 7000, onboarded: false }, days: {}, meta: {} };
  const remote = { settings: { name: 'Sam', regularGoal: 6500, bigGoal: 9000, onboarded: true }, days: { '2026-11-01': { status: 'big' } }, meta: { startedOn: '2026-10-20' } };
  const m = L.mergeBackup(local, remote);
  assert.equal(m.settings.name, 'Sam');
  assert.equal(m.settings.regularGoal, 6500);
  assert.equal(m.settings.onboarded, true);
  assert.equal(Object.keys(m.days).length, 1);
});

test('version number matches the offline cache name', async () => {
  const { readFileSync } = await import('node:fs');
  const { APP_VERSION } = await import('../version.js');
  assert.match(APP_VERSION, /^\d+\.\d+\.\d+$/);
  assert.ok(readFileSync(new URL('../sw.js', import.meta.url), 'utf8').includes(`'steppy-${APP_VERSION}'`));
});

test('thanksgiving is the 4th Thursday of November', async () => {
  const T = await import('../themes.js');
  assert.equal(T.thanksgivingDay(2026), 26);
  assert.equal(T.thanksgivingDay(2025), 27);
  assert.equal(T.thanksgivingDay(2024), 28);
  assert.equal(T.thanksgivingDay(2029), 22);
});

test('holiday themes appear only in their windows', async () => {
  const T = await import('../themes.js');
  const ids = (y, m, d) => T.availableThemes(new Date(y, m - 1, d)).map((t) => t.id).join(',');
  assert.equal(ids(2026, 9, 30), 'classic');
  assert.equal(ids(2026, 10, 1), 'classic,halloween');
  assert.equal(ids(2026, 11, 5), 'classic,halloween');
  assert.equal(ids(2026, 11, 6), 'classic,thanksgiving'); // thanksgiving hidden until Nov 6
  assert.equal(ids(2026, 11, 26), 'classic,thanksgiving'); // Thanksgiving Day
  assert.equal(ids(2026, 11, 27), 'classic,christmas'); // christmas starts the day after
  assert.equal(ids(2026, 12, 31), 'classic,christmas');
  assert.equal(ids(2027, 1, 1), 'classic');
  assert.equal(ids(2025, 11, 27), 'classic,thanksgiving'); // 2025's Thanksgiving is the 27th
  assert.equal(ids(2025, 11, 28), 'classic,christmas');
});

test('activeTheme: her pick wins; an expired holiday falls back to her previous theme', async () => {
  const T = await import('../themes.js');
  const nov1 = new Date(2026, 10, 1);
  assert.equal(T.activeTheme('classic', nov1).id, 'classic'); // no auto-switching to Halloween
  assert.equal(T.activeTheme('halloween', nov1).id, 'halloween');
  assert.equal(T.activeTheme('halloween', new Date(2026, 10, 6), 'classic').id, 'classic'); // season over
  assert.equal(T.activeTheme('christmas', nov1).id, 'classic'); // not unlocked yet
  assert.equal(T.isHoliday('thanksgiving'), true);
  assert.equal(T.isHoliday('classic'), false);
  assert.equal(T.seasonKey(T.byId('christmas'), new Date(2026, 11, 1)), 'christmas-2026');
});

test('coach suggestions land on steps of 100, even for odd goals', () => {
  const s = L.suggestGoals({ days: days('rrrrrrrrrr'), settings: { regularGoal: 6789, bigGoal: 12345 } }, TODAY);
  assert.equal(s.regularGoal, 7300);
  assert.equal(s.bigGoal, 12345); // untouched goals keep her exact number
  const b = L.suggestGoals({ days: days('bbbbbbbb'), settings: { regularGoal: 6789, bigGoal: 12345 } }, TODAY);
  assert.equal(b.bigGoal, 13300);
  assert.equal(b.regularGoal, 7300);
});

test('skip tickets spent in the Theme Machine come off what is available', () => {
  const d = days('rrrrrrrrrr'); // 10 points → 1 earned + 1 starter = 2
  assert.equal(L.skipInfo(d).available, 2);
  assert.equal(L.skipInfo(d, 1).available, 1);
  assert.equal(L.skipInfo(d, 5).available, 0);
});

test('gumball machine: no repeats, set spins stay in the set, sets hidden until found', async () => {
  const G = await import('../gumballs.js');
  const all = G.GUMBALLS.map((g) => g.id);
  assert.equal(new Set(all).size, all.length, 'ids are unique');
  let owned = [];
  for (let i = 0; i < all.length; i++) {
    const id = G.spin(owned, null, () => 0.5);
    assert.ok(id && !owned.includes(id));
    owned.push(id);
  }
  assert.equal(G.spin(owned), null, 'nothing left once she owns everything');
  assert.deepEqual(G.revealedSets([]), []);
  assert.deepEqual(G.revealedSets(['ts-1989']).map((s) => s.id), ['taylor']);
  assert.deepEqual(G.setProgress('taylor', ['ts-1989', 'ts-red']), { owned: 2, total: 12 });
  for (let i = 0; i < 20; i++) {
    const id = G.spin(['ts-red'], 'taylor');
    assert.equal(G.GUMBALLS.find((g) => g.id === id).set, 'taylor');
    assert.notEqual(id, 'ts-red');
  }
  assert.equal(G.SPIN_COST, 1);
  assert.equal(G.SET_SPIN_COST, 2);
});

test('every gumball theme gets a full, readable palette', async () => {
  const G = await import('../gumballs.js');
  const T = await import('../themes.js');
  for (const t of G.GUMBALL_THEMES) {
    for (const k of ['bg', 'bg-2', 'card', 'text', 'muted', 'line', 'primary', 'primary-2', 'primary-ink', 'regular', 'big', 'skip'])
      assert.ok(t.vars[k], `${t.id} has --${k}`);
    assert.equal(T.byId(t.id).id, t.id);
    assert.equal(T.activeTheme(t.id, new Date(2026, 5, 1)).id, t.id, 'gumball themes never expire');
  }
});
