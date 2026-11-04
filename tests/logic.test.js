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
  assert.equal(ids(2026, 12, 16), 'classic,christmas');
  assert.equal(ids(2026, 12, 17), 'classic,christmas,doomsday'); // Avengers: Doomsday unlocks
  assert.equal(ids(2026, 12, 29), 'classic,christmas,doomsday');
  assert.equal(ids(2026, 12, 30), 'classic,christmas,newyears,doomsday'); // New Year's unlocks
  assert.equal(ids(2026, 12, 31), 'classic,christmas,newyears,doomsday');
  assert.equal(ids(2027, 1, 1), 'classic,newyears,doomsday');
  assert.equal(ids(2027, 1, 8), 'classic,doomsday');
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
  assert.deepEqual(G.setProgress('taylor', ['ts-1989', 'ts-red']), { owned: 2, total: 13 });
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

test('restoring a backup never loses Theme Machine progress', () => {
  const remote = { settings: {}, days: { '2026-11-01': { status: 'big' } }, meta: { gumballs: { unlocked: true, introSeen: true, owned: ['ts-red', 'ts-1989'], spent: 2 }, holidaysAnnounced: ['halloween-2026'] } };
  // a new phone where she already logged a day before restoring
  const local = { settings: { onboarded: true }, days: { '2026-11-03': { status: 'regular' } }, meta: { gumballs: { unlocked: false, introSeen: false, owned: [], spent: 0 } } };
  const m = L.mergeBackup(local, remote);
  assert.deepEqual(m.meta.gumballs, { unlocked: true, introSeen: true, owned: ['ts-red', 'ts-1989'], spent: 2 });
  assert.deepEqual(m.meta.holidaysAnnounced, ['halloween-2026']);
  assert.equal(Object.keys(m.days).length, 2);
  // both sides won different themes: keep all of them
  const both = L.mergeGumballs({ owned: ['ts-lover'], spent: 1 }, { owned: ['ts-red'], spent: 1, unlocked: true });
  assert.deepEqual(both.owned.sort(), ['ts-lover', 'ts-red']);
  assert.equal(both.unlocked, true);
});

test('Broadway magnets 2026 collection is complete and separate', async () => {
  const G = await import('../gumballs.js');
  assert.deepEqual(G.setProgress('broadway-2026', []), { owned: 0, total: 10 });
  assert.deepEqual(G.setProgress('taylor', []), { owned: 0, total: 13 });
  assert.deepEqual(G.revealedSets(['bway26-heathers']).map((s) => s.id), ['broadway-2026']);
  assert.equal(G.hiddenSetsRemain(['bway26-heathers']), true); // Taylor Swift eras still a secret
  assert.ok(G.GUMBALLS.find((g) => g.id === 'bway26-allout').emojis.includes('🐎'));
});

test('Broadway magnets 2025 collection', async () => {
  const G = await import('../gumballs.js');
  assert.deepEqual(G.setProgress('broadway-2025', []), { owned: 0, total: 6 });
  assert.equal(G.GUMBALLS.length, 111);
  const sunset = G.GUMBALL_THEMES.find((t) => t.id === 'bway25-sunsetblvd');
  assert.equal(sunset.dark, true);
  assert.equal(sunset.vars.bg, '#0b0b0b');
  assert.equal(sunset.vars.primary, '#d7192e');
});

test('Broadway magnets 2024 collection (Sunset Blvd. moved here, id unchanged)', async () => {
  const G = await import('../gumballs.js');
  assert.deepEqual(G.setProgress('broadway-2024', []), { owned: 0, total: 7 });
  assert.equal(G.GUMBALLS.find((g) => g.id === 'bway25-sunsetblvd').set, 'broadway-2024');
  assert.deepEqual(G.revealedSets(['bway25-sunsetblvd']).map((s) => s.id), ['broadway-2024']);
  assert.equal(G.GUMBALL_THEMES.find((t) => t.id === 'bway24-kimberlyakimbo').confetti.length, 6);
});

test('Treat yourself collection, with Chip City marked RIP', async () => {
  const G = await import('../gumballs.js');
  assert.deepEqual(G.setProgress('treats', []), { owned: 0, total: 20 });
  const chip = G.GUMBALL_THEMES.find((t) => t.id === 'treat-chipcity');
  assert.equal(chip.rip, true);
  assert.equal(G.GUMBALL_THEMES.filter((t) => t.rip).length, 1);
  const emojis = G.GUMBALLS.filter((g) => g.set === 'treats').map((g) => g.emoji);
  assert.equal(new Set(emojis).size, emojis.length, 'every spot has its own gumball emoji');
});

test('Mario Kart collection plays the race countdown', async () => {
  const G = await import('../gumballs.js');
  assert.deepEqual(G.setProgress('mariokart', []), { owned: 0, total: 9 });
  assert.equal(G.setById('mariokart').intro, 'race');
  assert.equal(G.GUMBALL_THEMES.find((t) => t.id === 'mk-wario').dark, true);
  const emojis = G.GUMBALLS.filter((g) => g.set === 'mariokart').map((g) => g.emoji);
  assert.equal(new Set(emojis).size, 9);
});

test('holidays and events are permanent once unlocked', async () => {
  const T = await import('../themes.js');
  const march = new Date(2027, 2, 1);
  assert.equal(T.activeTheme('halloween', march, 'classic', ['halloween']).id, 'halloween');
  assert.equal(T.activeTheme('halloween', march, 'classic', []).id, 'classic');
  assert.deepEqual(T.pickable(march, ['halloween', 'doomsday']).map((t) => t.id), ['classic', 'halloween', 'doomsday']);
  assert.deepEqual(T.openOn(new Date(2026, 11, 20)).map((t) => t.id), ['christmas', 'doomsday']);
  assert.equal(T.seasonalTheme(new Date(2027, 0, 15)), null, 'doomsday is an event, not a holiday');
  assert.equal(T.seasonalTheme(new Date(2027, 0, 5)).id, 'newyears');
  const d = T.byId('doomsday');
  assert.equal(d.dark, true);
  assert.equal(d.vars.primary, '#6fcf5a');
});

test('The Black Parade sneaks into the Taylor Swift eras', async () => {
  const G = await import('../gumballs.js');
  const t = G.GUMBALL_THEMES.find((x) => x.id === 'ts-blackparade');
  assert.equal(t.set, 'taylor');
  assert.match(t.note, /how did that get here/);
});

test('For You Page memes show their quote when won', async () => {
  const G = await import('../gumballs.js');
  assert.deepEqual(G.setProgress('fyp', []), { owned: 0, total: 9 });
  for (const t of G.GUMBALL_THEMES.filter((x) => x.set === 'fyp')) assert.ok(t.note, `${t.id} has its quote`);
  assert.equal(G.GUMBALL_THEMES.find((x) => x.id === 'fyp-burntnugget').note, 'Because you love yourself! 🍗');
});

test('So Random collection', async () => {
  const G = await import('../gumballs.js');
  assert.deepEqual(G.setProgress('random', []), { owned: 0, total: 0 });
  assert.equal(G.setById('random').name, 'So Random');
});

test('heading fonts are assigned to the right themes', async () => {
  const T = await import('../themes.js');
  const heads = Object.fromEntries(T.ALL_THEMES.filter((t) => t.head).map((t) => [t.id, t.head]));
  assert.equal(heads['ts-ttpd'], 'typewriter');
  assert.equal(heads['bway25-sunsetblvd'], 'helvetica');
  assert.equal(heads['ts-reputation'], 'blackletter');
  assert.equal(heads['rand-chunk'], 'pixel');
  assert.equal(heads['halloween'], 'chalk');
  assert.equal(Object.keys(heads).length, 25);
});

test('sunrise and sunset for New York match published times (±3 min)', () => {
  const near = (actual, iso) => assert.ok(Math.abs(actual - new Date(iso)) < 3 * 60000, `${actual.toISOString()} vs ${iso}`);
  const lat = 40.7128, lng = -74.006;
  // Use dates built in UTC terms so the test works in any timezone.
  const june = L.sunTimes(new Date(2026, 5, 21), lat, lng);
  near(june.sunrise, '2026-06-21T09:25:00Z'); // 5:25 AM EDT
  near(june.sunset, '2026-06-22T00:31:00Z'); // 8:31 PM EDT
  const dec = L.sunTimes(new Date(2026, 11, 21), lat, lng);
  near(dec.sunrise, '2026-12-21T12:16:00Z'); // 7:16 AM EST
  near(dec.sunset, '2026-12-21T21:32:00Z'); // 4:32 PM EST
  assert.equal(L.sunTimes(new Date(2026, 5, 21), 89, 0), null, 'midnight sun: no sunset');
  assert.equal(L.formatDuration(72 * 60000), '1h 12m');
  assert.equal(L.formatDuration(5 * 60000), '5m');
});

test('in-progress days do not break or count toward streaks, skips or the coach', () => {
  const d = days('rrr.'); // three goal days, then today
  d[TODAY] = { status: 'progress', steps: 3000 };
  assert.equal(L.currentStreak(d, TODAY), 3); // today still open
  assert.equal(L.skipInfo(d).progress, 3);
  const s = { regularGoal: 7000, bigGoal: 10000 };
  const many = days('rrrrrrrrr');
  many[TODAY] = { status: 'progress', steps: 100 };
  assert.equal(L.suggestGoals({ days: many, settings: s }, TODAY).kind, 'raise'); // progress ignored
});

test('encouragement adapts to time left in the day', () => {
  const at = (h, m = 0) => new Date(2026, 10, 2, h, m);
  const morning = L.encouragement(4200, 7000, at(9));
  assert.equal(morning.left, 2800);
  assert.equal(morning.minutes, 28);
  assert.match(morning.msg, /Plenty of day left/);
  assert.match(L.encouragement(4200, 7000, at(19)).msg, /this evening/);
  assert.match(L.encouragement(4200, 7000, at(22)).msg, /house/);
  assert.match(L.encouragement(4200, 7000, at(23, 20)).msg, /tight/);
  assert.match(L.encouragement(4200, 7000, at(23, 50)).msg, /Every step counted/);
  assert.match(L.encouragement(6500, 7000, at(15)).msg, /So close/);
  assert.match(L.encouragement(1000, 9000, at(8)).msg, /1h 20m of walking/);
});

test('weather: describe codes and pick a walking tip', async () => {
  const W = await import('../weather.js');
  assert.deepEqual(W.describe(0, true), ['☀️', 'Sunny']);
  assert.deepEqual(W.describe(0, false), ['🌙', 'Clear']);
  assert.deepEqual(W.describe(63), ['🌧️', 'Rain']);
  assert.deepEqual(W.describe(73), ['🌨️', 'Snow']);
  const base = (current, hourly = []) => ({
    current: { time: '2026-11-02T10:00', temperature_2m: 50, weather_code: 2, ...current },
    hourly: {
      time: hourly.map((h) => h[0]),
      precipitation_probability: hourly.map((h) => h[1]),
      weather_code: hourly.map((h) => h[2]),
    },
  });
  assert.match(W.walkingTip(base({ weather_code: 61 })), /wet/);
  assert.match(W.walkingTip(base({}, [['2026-11-02T11:00', 10, 2], ['2026-11-02T15:00', 70, 61]])), /Rain likely around 3 PM/);
  assert.equal(W.walkingTip(base({}, [['2026-11-03T08:00', 90, 61]])), '', 'tomorrow’s rain is ignored');
  assert.match(W.walkingTip(base({ temperature_2m: 20 })), /Bundle up/);
  assert.match(W.walkingTip(base({ temperature_2m: 65, weather_code: 1 })), /Great walking weather/);
  assert.match(W.weatherUrl(40.71, -74.01), /temperature_unit=fahrenheit/);
});

test('Bookworm collection holds the book themes (old ids kept)', async () => {
  const G = await import('../gumballs.js');
  assert.deepEqual(G.setProgress('books', []), { owned: 0, total: 5 });
  assert.deepEqual(G.revealedSets(['rand-kindle']).map((s) => s.id), ['books']);
});

test('Game Day collection', async () => {
  const G = await import('../gumballs.js');
  assert.deepEqual(G.setProgress('sports', []), { owned: 0, total: 8 });
  assert.equal(G.GUMBALL_THEMES.find((t) => t.id === 'sport-patriots').dark, true);
});

test('Critters and Couch Time collections; Taylor renamed', async () => {
  const G = await import('../gumballs.js');
  assert.deepEqual(G.setProgress('animals', []), { owned: 0, total: 5 });
  assert.deepEqual(G.setProgress('tv', []), { owned: 0, total: 11 });
  // WandaVision: grayscale base, red only for big goals
  const wv = G.GUMBALL_THEMES.find((t) => t.id === 'tv-wandavision');
  assert.equal(wv.vars.big, '#c8203a');
  assert.equal(wv.vars.regular, '#6a6a6a');
  assert.equal(G.setById('taylor').name, 'The Eras Walking Tour');
  assert.deepEqual(G.revealedSets(['rand-chunk']).map((s) => s.id), ['animals']);
  assert.match(G.GUMBALL_THEMES.find((t) => t.id === 'treat-maddogbeans').note, /Where it all started/);
});

test('Co-op Mode and Puzzle Break; empty sets never count as hidden', async () => {
  const G = await import('../gumballs.js');
  assert.deepEqual(G.setProgress('games', []), { owned: 0, total: 8 });
  assert.equal(G.setById('games').name, 'Game Night');
  assert.equal(G.setById('puzzles'), undefined);
  assert.equal(G.GUMBALL_THEMES.find((t) => t.id === 'game-mariokart').intro, 'race');
  const oneOfEach = G.SETS.map((s) => G.GUMBALLS.find((g) => g.set === s.id)?.id).filter(Boolean);
  assert.equal(G.hiddenSetsRemain(oneOfEach), false); // So Random is empty, so it doesn't count
});

test('first spin is always a Taylor era (not the Black Parade); VisionQuest is held back', async () => {
  const G = await import('../gumballs.js');
  for (let i = 0; i < 50; i++) {
    const id = G.spin([], null, () => i / 50);
    assert.ok(id.startsWith('ts-') && id !== 'ts-blackparade', id);
  }
  // after the first, anything goes
  const later = new Set(Array.from({ length: 50 }, (_, i) => G.spin(['ts-red'], null, () => i / 50).split('-')[0]));
  assert.ok(later.size > 1);
  assert.ok(!G.GUMBALLS.some((g) => g.id === 'tv-visionquest'));
});
