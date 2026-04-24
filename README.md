# Nexus Arcade — Gamified Learning

Mobile‑friendly educational games with Bible study elements, an admin console, and interactive simulations.

## What’s live right now

- **Primary game:** a match‑3 puzzle (the “Nexus Arcade” core experience)
- **Progression:** 7‑level “Seven‑Star” track (levels live under `levels/1.json` … `levels/7.json`)
- **Deployment:** GitHub Pages to **[nicholai.org](https://nicholai.org)**

This repo is intentionally kept **static‑site simple** so Pages deploys are fast and reliable.

## Play / Run locally

- Open `index.html` directly in a browser, **or**
- Run a static server (example):
  - `npx serve .`

## Deployment (GitHub Pages)

The site deploys automatically via GitHub Actions on pushes to **`main`**.

- **Workflow:** `.github/workflows/pages.yml`
- **Trigger:** Push to `main` (or manual `workflow_dispatch`)
- **Deploy target:** `github-pages` environment
- **Source:** Repository root (`/`)

### Pull request checks

Pull requests targeting `main` run **build / validation only** (no deployment). Typical checks include:

- Preventing merge‑conflict markers from shipping
- Verifying required DOM hooks exist for the game UI

## Custom domain

- `CNAME` is set to `www.nicholai.org`.
- Keep your GitHub Pages settings configured to build from the **root (`/`) of the `main` branch**.

## Shared assets (single tileset)

To avoid duplicating graphics/audio across future games, Nexus Arcade uses a shared tileset concept.

- **Recommended atlas:** `assets/games/shared/tileset_atlas.png`
- **Atlas metadata (optional):** `assets/games/shared/tileset.json`

## Level format

Levels are stored at:

- `levels/1.json` … `levels/7.json`

A simple, shared schema (example):

```json
{
  "level": 1,
  "targetScore": 500,
  "moves": 20,
  "boardSize": 8,
  "tileTypes": ["red_star", "yellow_star", "blue_star"]
}
```

## Repo map (key files)

| File | Purpose |
|---|---|
| `index.html` | App shell / game mount point |
| `main.js` | Bootstrap / entry point |
| `match-maker-ui.js` | UI rendering + input |
| `matchMakerState.js` | Core match‑3 logic (grid, matches, gravity) |
| `badges.js` | Level completion + star/badge notifications |

## Roadmap (next)

- Add the second game mode (optional) using the same shared tileset/audio
- Add the “Seven‑Star Ministry” meta‑screen (star map + badges)
- Add quiz overlay mechanics after the core match‑3 loop is stable
