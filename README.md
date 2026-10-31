# 🍪 Cookie Clicker

A complete incremental game built with **Vue 3**, **Pinia** and **Vite**. Click the cookie, buy buildings and upgrades, catch golden cookies and ascend for permanent bonuses. It saves in your browser, needs no account and works offline once loaded.

## Features

- **12 buildings** from Cursor to Time machine. Prices grow 15% per building owned. Buy 1, 10, 100 or as many as you can afford.
- **70+ upgrades** that unlock as you play: stronger clicks, "thousand fingers" (clicks scale with production), five efficiency tiers for every building, global production boosts and golden cookie perks.
- **Golden cookies** appear every 1 to 3 minutes and vanish after 13 seconds. Click one for a Frenzy (production x7), a Click frenzy (clicks x777) or a Lucky payout.
- **75+ achievements**, each adding +1% production permanently.
- **Ascension**: reset the run for heavenly chips (+2% production each, forever).
- **Offline progress**: bakers keep working at 50% for up to 8 hours while the tab is closed.
- **Save tools**: autosave, export and import as text, wipe. Saves from the original version of this game (a plain score) are carried over.
- Responsive layout, keyboard support (<kbd>Space</kbd> or <kbd>Enter</kbd> on the focused cookie), reduced-motion support.

## Develop

```bash
npm install
npm run dev      # start the dev server
npm test         # unit tests for the game engine
npm run build    # production build into dist/
```

## How it is organised

| Path | What it does |
| --- | --- |
| `src/game/engine.js` | All game rules as pure functions (costs, production, upgrades, achievements, golden cookies, prestige, save format). No Vue or DOM, so it is unit-tested with `node --test`. |
| `src/store/cookieStore.js` | Pinia store. Owns the game loop (10 ticks a second), autosave, offline progress and toasts. |
| `src/components/` | UI: the cookie, golden cookie, shop tabs (buildings, upgrades, achievements, stats and ascension, options), toasts. |
| `test/engine.test.js` | Tests for the engine, including a scripted playthrough. |

## Analytics

The hosted version uses [Vercel Web Analytics](https://vercel.com/docs/analytics) to count anonymous page views. No cookies, no accounts. Game data never leaves your browser.
