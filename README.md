# Nexus Arcade Gamified Learning System
[![Deploy GitHub Pages](https://github.com/NicholaiMadias/gamifiedlearning.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/NicholaiMadias/gamifiedlearning.github.io/actions/workflows/deploy.yml)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-purple)

Mobile-friendly educational gaming, Bible study, admin console, sandbox app and interactive simulations.

## Match Maker Game

A 7×7 gem-matching puzzle game that tracks a **Matrix of Conscience** (Empathy, Justice, Wisdom, Growth) as you play. Match three or more gems to score points and level up.

## What's live right now

- **Primary game:** a match‑3 puzzle (the "Nexus Arcade" core experience)
- **Progression:** 7‑level "Seven‑Star" track (level data is loaded via `levels/loadLevel.js`)
- **Deployment:** GitHub Pages to **[amazinggracehl.org](https://amazinggracehl.org)**

This repo is intentionally kept **static‑site simple** so Pages deploys are fast and reliable.

## Play / Run locally

This project uses ES modules, so it must be served via a local static server (browsers block `file://` ES module imports):

- `npx serve .` — recommended
- `python -m http.server 8080` — Python alternative
- Any static file server pointed at the repository root

## Deployment (GitHub Pages)

The site deploys automatically to **[amazinggracehl.org](https://amazinggracehl.org)** via GitHub Actions whenever code is pushed to the `main` branch.

- **Workflow:** `.github/workflows/deploy.yml`
- **Trigger:** Push to `main` (or manual `workflow_dispatch`)
- **Deploy target:** `github-pages` environment
- **Source:** Repository root (`/`)

Only one workflow deploys to Pages. The `concurrency: group: "pages"` setting prevents race conditions if two pushes happen quickly.

### Pull Request Checks

When a pull request is opened against `main`, the same workflow runs a **build-only** validation step:

- Checks that no Git merge conflict markers (`<<<<<<<`, `>>>>>>>`) remain in HTML files.
- Verifies all required game DOM element IDs are present in `index.html`.

No deployment happens for PRs—only for pushes to `main`.

### CNAME / Custom Domain

The `CNAME` file contains `amazinggracehl.org`. The `cname-auto-maintainer` workflow will open a PR to restore it if it ever changes.

## Tileset tile IDs

Current gem types used by the match-3 engine (see `matchMakerState.js`):

| Tile ID | Emoji | Description |
|---|---|---|
| `heart` | ❤️ | Heart gem |
| `star` | ⭐ | Star gem |
| `cross` | ✝️ | Cross gem |
| `flame` | 🔥 | Flame gem |
| `drop` | 💧 | Water drop gem |

## Level format

Levels are loaded dynamically via `levels/loadLevel.js`. A simple, shared schema:

```json
{
  "level": 1,
  "targetScore": 500,
  "moves": 20,
  "boardSize": 7,
  "gemTypes": ["heart", "star", "cross", "flame", "drop"]
}
```

## Sound hooks

| Game Event | File | Purpose |
|---|---|---|
| Match / Get Item | `get.mp3` | Short feedback for every 3-match |
| Badge Unlock | `badge.mp3` | Triggered when a level 7 star is earned |
| Level Clear | `course_clear.mp3` | Fanfare after the 7th level of a pack |
| Supernova / Chain | `storm.mp3` | Intense sound for large cascades |
| Game Over / Esc | `escape.mp3` | UI sound for backing out or failing |
| Ministry Screen | `ending.mp3` | Ambient music for the Seven-Star Ministry screen |

## Repo map (key files)

| File | Purpose |
|---|---|
| `index.html` | App shell / game mount point |
| `main.js` | Bootstrap — wires up the game |
| `match-maker-ui.js` | Game UI layer — renders board, handles input/swaps/cascades |
| `matchMakerState.js` | Pure game logic — grid, match detection, gravity |
| `badges.js` | Level-completion badge notifications |
| `progression.js` | Persistent progress tracking (`localStorage`) |
| `star-map.js` | 7-star progress map renderer |
| `levels/loadLevel.js` | Async level JSON loader |

## Roadmap (next)

- Add the second game mode (optional) using the same shared tileset/audio
- Add the "Seven‑Star Ministry" meta‑screen (star map + badges)
- Add quiz overlay mechanics after the core match‑3 loop is stable
