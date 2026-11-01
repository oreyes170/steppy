# Steppy 👣

A cheerful, no-pressure step goal tracker, like StepBet without the money.

## Features

- **Calendar logging**: tap any past day and mark it as 🌟 Big goal, 👟 Hit my goal, 🎟️ Skip day, or 🌙 Not today. You can also type in a step count and Steppy picks the right goal for you.
- **Two goals**: a daily goal and a big goal.
- **Streaks**: shows the current and best streak. Days in a streak are linked together on the calendar, and there's a fireworks celebration at 3, 7, 14, 21, 30, 50, 100… days.
- **Skip days**: you start with one free. Goal days earn 1 point and big goal days earn 2; every 10 points earns another skip day. A skip day keeps the streak alive. If you mark a day as missed and it breaks a streak, Steppy offers to use a skip day instead.
- **Goal coach**: looks at the last 14 days (only days since the goals last changed, and only once there are at least 7 logged days) and suggests:
  - raising both goals if the big goal happens 60%+ of the time
  - raising the daily goal if it's hit 85%+ of the time
  - lowering it, gently, if it's hit less than half the time (using real step counts when you've entered them)
  - making the big goal more reachable if it never happens

  "Not now" snoozes the coach for a week.
- **Celebrations**: confetti for goal days. Big goal days get side cannons, emoji rain and a "BIG GOAL!" banner. Earned skip days get a flying ticket, and streak milestones get fireworks. Phones that support it also vibrate. All motion respects *Reduce Motion*.
- Works offline, can be installed to the home screen, supports dark mode, and has backup export/import (Settings ⚙️).

All data stays on the device (`localStorage`). There's no account and no server.

## Run locally

```sh
npm start        # serves on http://localhost:5173
npm test         # unit tests for streaks, skip days and the goal coach
```

No build step. It's plain HTML/CSS/JS modules.

## Put it on her phone

1. In the GitHub repo, go to **Settings → Pages**, set **Source: Deploy from a branch**, pick the branch and `/ (root)`, and save.
2. Open the Pages URL on her phone.
   - **iPhone (Safari)**: Share → **Add to Home Screen**.
   - **Android (Chrome)**: ⋮ → **Install app**.

It then opens full-screen like a normal app and works offline.

### Keeping her data safe

Data lives only on the phone. On iPhone, a home-screen web app has its **own** storage, separate from Safari. **Deleting the home-screen icon deletes the data**, and a new phone starts empty.

- Steppy shows a **backup reminder** once a week after a few days are logged. **Back up** opens the share sheet: pick **Save to Files** (iCloud Drive), or text the file to someone.
- To restore on a new phone or after re-adding the icon, tap **Restore from a backup** on the welcome screen (or **Settings → Restore**) and pick the file.

## Code map

| File | What it does |
| --- | --- |
| `logic.js` | Pure logic: dates, streaks, skip-day economy, goal coach (unit tested) |
| `app.js` | State, rendering, logging and the celebration sequence |
| `fx.js` | Confetti, fireworks, emoji rain, banners, flying tickets |
| `styles.css` | All styling, light and dark |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline support and home-screen install |

Tuning knobs (points per skip day, milestones, coach thresholds) are constants at the top of `logic.js`.
