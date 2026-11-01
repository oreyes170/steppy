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

## Holiday themes and monthly welcome

- **Holiday themes** unlock by date:
  - 🎃 Halloween: Oct 1 – Nov 5
  - 🦃 Thanksgiving: Nov 6 – Thanksgiving Day
  - 🎄 Christmas: day after Thanksgiving – Dec 31

  **Her pick always wins.** The first time she opens Steppy after a holiday unlocks, a popup says "New theme: Thanksgiving!" with **Try it!** or **Not now** (once per holiday per year). When a holiday she's wearing ends, she goes back to the theme she wore before it. Each theme has its own colours (light and dark), confetti colours and emoji, background decorations, header icon and big-goal emoji.
- **Preview any theme early** by adding `?theme=christmas` (or `halloween`, `thanksgiving`, `classic`) to the address. The preview isn't saved.
- **Welcome to <Month>:** the first time she opens Steppy in a new month, she gets "Welcome to November!" with *rabbit rabbit* in small letters and a recap of last month.

The date rules are in `themes.js` (unit tested).

## The Theme Machine 🍬

- **Unlocks** the first time she has **3 skip tickets** (the skip days), then stays unlocked. A "New unlocked!" card appears on the home screen, and tapping the 🎟️ counter opens the machine.
- **1 ticket**: a random new theme from any collection. **2 tickets**: a random new theme from a collection she's already discovered. No repeats. Tickets spent here come off her skip days.
- **Collections stay secret** until she wins something from them. Then the set appears in Settings with `?` spots for the rest. A "🔒 More collections are hiding…" note shows while undiscovered sets remain.
- The first collection is **🎤 Taylor Swift eras** (12 themes).
- **Adding themes**: add an entry to `GUMBALLS` in `gumballs.js` (and a new set to `SETS` if needed). Each theme needs an id, name, gumball emoji, four colours (`bg`, `primary`, `accent`, `ink`, plus `dark: true` for dark themes), 3–5 emoji, a cheer line and a one-line pitch. The rest of the palette and the header icon tint are worked out from those. Preview it with `?theme=<id>`.

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

### Keeping her data safe (Google Drive backup)

Data lives on the phone, and on iPhone a home-screen app has its **own** storage: deleting the icon deletes the data. To protect it, Steppy backs up to Google Drive automatically:

- **She signs in with Google once.** After that, every change is saved to `steppy-backup.json` in that Google Drive. Steppy can only see files it created itself (`drive.file` scope).
- Google sign-ins last about an hour. When she opens the app and the sign-in has expired, Steppy quietly renews it with a quick hop to Google and back, so there's nothing to tap. If Google ever wants her to confirm it's her, a "Tap to reconnect" card appears; her days are safe on the phone in the meantime.
- **New phone or re-added icon:** tap **Restore with Google** on the welcome screen.
- Connecting merges the phone and Drive. Nothing is dropped, and if both have the same day, the phone wins. An empty phone never overwrites the backup.

**Setup (one time):** put the OAuth client ID in `config.js`; the Web client the Rotation app uses works. In Google Cloud Console → Credentials → that client, add `https://oreyes170.github.io/steppy/` to **Authorised redirect URIs**. If the consent screen is in *Testing* mode, add her Google account under **Test users**.

Without a client ID the Google features are hidden, and Steppy falls back to manual backup files with a weekly reminder.

## Code map

| File | What it does |
| --- | --- |
| `logic.js` | Pure logic: dates, streaks, skip-day economy, goal coach (unit tested) |
| `app.js` | State, rendering, logging and the celebration sequence |
| `fx.js` | Confetti, fireworks, emoji rain, banners, flying tickets |
| `drive.js`, `config.js` | Google sign-in and Drive backup |
| `themes.js` | Holiday themes and their date windows |
| `gumballs.js` | Theme Machine: collections, gumball themes, spin rules |
| `styles.css` | All styling, light and dark |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline support and home-screen install |

The version shown at the top of the app lives in `version.js`. Bump it, and the cache name in `sw.js`, with each release.

Tuning knobs (points per skip day, milestones, coach thresholds) are constants at the top of `logic.js`.
