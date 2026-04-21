# Gamified Learning

Mobile-friendly educational gaming, Bible study, admin console, sandbox app and interactive simulations.

## Match Maker Game

A 7×7 gem-matching puzzle game that tracks a **Matrix of Conscience** (Empathy, Justice, Wisdom, Growth) as you play. Match three or more gems to score points and level up.

## Deployment

### GitHub Pages (Production)

The site is deployed automatically to **[nicholai.org](https://nicholai.org)** via GitHub Actions whenever code is pushed to the `main` branch.

**Workflow:** `.github/workflows/pages.yml`

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

The `CNAME` file contains `nicholai.org`. The `cname-auto-maintainer` workflow will open a PR to restore it if it ever changes.

## Development

Open `index.html` directly in a browser, or use any static file server (e.g. `npx serve .`).

**JavaScript modules:**

| File | Purpose |
|---|---|
| `main.js` | Bootstrap — wires up the game and service worker |
| `match-maker-ui.js` | Game UI layer — renders board, handles input/swaps/cascades |
| `matchMakerState.js` | Pure game logic — grid, match detection, gravity |
| `badges.js` | Level-completion badge notifications |
