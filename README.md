# Nexus Arcade Gamified Learning System
[![Deploy GitHub Pages](https://github.com/NicholaiMadias/gamifiedlearning.github.io/actions/workflows/pages.yml/badge.svg)](https://github.com/NicholaiMadias/gamifiedlearning.github.io/actions/workflows/pages.yml)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-purple)


Mobile-friendly educational gaming, Bible study, admin console, sandbox app and interactive simulations.

## Match Maker Game

A 7×7 gem-matching puzzle game that tracks a **Matrix of Conscience** (Empathy, Justice, Wisdom, Growth) as you play. Match three or more gems to score points and level up.

## Deployment
1. Single tileset design (shared across games)

Use one atlas for all core tiles (planets, stars, comets, supernovae, black hole, nebula), based on your 4×4 “Mystery of the Seven Stars” grid.

Recommended atlas

File: assets/games/shared/tileset_atlas.png

Grid: 4×4

Tile size: 192×192 (or 128×128 if you prefer smaller)

Mapping (example):

{
  "name": "Shared_Tileset",
  "tileSize": 192,
  "columns": 4,
  "rows": 4,
  "tiles": [
    { "id": "planet_mars",   "x": 0,   "y": 0   },
    { "id": "planet_earth",  "x": 192, "y": 0   },
    { "id": "planet_saturn", "x": 384, "y": 0   },
    { "id": "planet_nebula", "x": 576, "y": 0   },

    { "id": "red_star",      "x": 0,   "y": 192 },
    { "id": "yellow_star",   "x": 192, "y": 192 },
    { "id": "blue_star",     "x": 384, "y": 192 },
    { "id": "blue_star_alt", "x": 576, "y": 192 },

    { "id": "comet_red",     "x": 0,   "y": 384 },
    { "id": "comet_blue",    "x": 192, "y": 384 },
    { "id": "comet_white",   "x": 384, "y": 384 },
    { "id": "supernova_red", "x": 576, "y": 384 },

    { "id": "supernova_blue","x": 0,   "y": 576 },
    { "id": "supernova_white","x":192, "y":576 },
    { "id": "black_hole",    "x": 384, "y": 576 },
    { "id": "nebula",        "x": 576, "y": 576 }
  ]
}

All three games can load this same tileset_atlas.png + tileset.json.

Your explosion sequence image can be a separate FX atlas (for supernova/black‑hole animations) later.

2. Level packs (A) — 7 levels per vanilla game

Shared level format for Match Master and Mystery of the Seven Stars:

Level JSON schema

{
  "level": 1,
  "targetScore": 500,
  "moves": 20,
  "boardSize": 8,
  "tileTypes": ["red_star", "yellow_star", "blue_star", "planet_mars", "planet_earth"]
}

Example pack for Match Master

src/arcade/games/match_master/levels/level1.json → level7.json:

// level1.json
{
  "level": 1,
  "targetScore": 500,
  "moves": 20,
  "boardSize": 8,
  "tileTypes": ["red_star", "yellow_star", "blue_star"]
}

// level4.json
{
  "level": 4,
  "targetScore": 2000,
  "moves": 25,
  "boardSize": 8,
  "tileTypes": ["red_star", "yellow_star", "blue_star", "planet_mars"]
}

// level7.json
{
  "level": 7,
  "targetScore": 4000,
  "moves": 30,
  "boardSize": 9,
  "tileTypes": ["red_star", "yellow_star", "blue_star", "planet_mars", "planet_earth", "planet_saturn"]
}

Mystery can reuse the same pattern but ramp difficulty slightly faster.

Shared loader

export async function loadLevel(gameId, levelNumber) {
  const res = await fetch(`src/arcade/games/${gameId}/levels/level${levelNumber}.json`);
  return res.json();
}

3. Revelation quiz UI (B) — overlay, not prompt

Questions file

src/arcade/games/mystery_seven_stars/quiz/revelation_questions.json (you already saw the content earlier).

Quiz overlay UI

export class QuizOverlay {
  constructor(container, questions, onCorrect, onIncorrect) {
    this.container = container;
    this.questions = questions;
    this.onCorrect = onCorrect;
    this.onIncorrect = onIncorrect;
    this.root = document.createElement('div');
    this.root.style.position = 'absolute';
    this.root.style.inset = '0';
    this.root.style.background = 'rgba(0,0,0,0.8)';
    this.root.style.display = 'flex';
    this.root.style.alignItems = 'center';
    this.root.style.justifyContent = 'center';
    this.root.style.color = '#fff';
    this.root.style.zIndex = '1000';
    container.appendChild(this.root);
  }

  ask(questionIndex) {
    const q = this.questions[questionIndex];
    this.root.innerHTML = '';

    const box = document.createElement('div');
    box.style.background = '#111';
    box.style.padding = '20px';
    box.style.borderRadius = '8px';
    box.style.maxWidth = '480px';

    const title = document.createElement('h2');
    title.textContent = `Mystery of the Seven Stars`;
    const text = document.createElement('p');
    text.textContent = q.question;

    const options = document.createElement('div');
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.style.display = 'block';
      btn.style.margin = '8px 0';
      btn.onclick = () => {
        if (i === q.correct) this.onCorrect();
        else this.onIncorrect();
        this.hide();
      };
      options.appendChild(btn);
    });

    box.appendChild(title);
    box.appendChild(text);
    box.appendChild(options);
    this.root.appendChild(box);
  }

  hide() {
    this.root.style.display = 'none';
  }

  destroy() {
    this.root.remove();
  }
}

Mystery engine calls quizOverlay.ask(currentChurchIndex) at level end or after N matches.

4. Badge art (C) — spec for 7 badges

You can generate these as a single badge atlas later, but here’s a clean spec:

File: assets/ui/badges_star.png

Grid: 7×1 (horizontal strip)

Size: 128×128 per badge

Badges:

Star 1 — simple gold star

Star 2 — star with faint halo

Star 3 — star with double halo

Star 4 — star + small planet

Star 5 — star + two orbiting sparks

Star 6 — star + laurel wreath

Star 7 — radiant starburst (Seven‑Star Ministry crest)

Badge mapping JSON

{
  "name": "Badge_Stars",
  "badgeSize": 128,
  "badges": [
    { "id": "star_1", "x": 0 },
    { "id": "star_2", "x": 128 },
    { "id": "star_3", "x": 256 },
    { "id": "star_4", "x": 384 },
    { "id": "star_5", "x": 512 },
    { "id": "star_6", "x": 640 },
    { "id": "star_7", "x": 768 }
  ]
}

Your existing “Mystery of the Seven Stars” title art can visually echo badge 7.

5. Star map with constellations (D)

Extend the earlier star map to show constellation lines and per‑game progress.

import { getProgress } from './progression.js';

export function renderStarMap(container) {
  container.innerHTML = '';

  const p = getProgress();

  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.width = '600px';
  wrapper.style.height = '200px';
  wrapper.style.margin = '20px auto';
  wrapper.style.background = 'radial-gradient(circle at top, #1a2340, #050814)';
  wrapper.style.borderRadius = '12px';
  wrapper.style.boxShadow = '0 0 30px rgba(0,0,0,0.7)';

  // constellation line
  const line = document.createElement('div');
  line.style.position = 'absolute';
  line.style.top = '50%';
  line.style.left = '5%';
  line.style.right = '5%';
  line.style.height = '2px';
  line.style.background = 'linear-gradient(to right, #555, #aaa, #555)';
  wrapper.appendChild(line);

  for (let i = 1; i <= 7; i++) {
    const star = document.createElement('div');
    star.style.position = 'absolute';
    const t = 5 + (90 / 6) * (i - 1);
    star.style.left = `${t}%`;
    star.style.top = '50%';
    star.style.transform = 'translate(-50%, -50%)';
    star.style.width = '40px';
    star.style.height = '40px';
    star.style.borderRadius = '50%';
    star.style.display = 'flex';
    star.style.alignItems = 'center';
    star.style.justifyContent = 'center';
    star.style.fontSize = '22px';
    star.style.color = '#000';
    star.style.background = i <= p.total
      ? 'radial-gradient(circle, gold, orange)'
      : 'radial-gradient(circle, #333, #111)';
    star.textContent = i <= p.total ? '★' : '☆';
    wrapper.appendChild(star);
  }

  container.appendChild(wrapper);
}

You can add per‑game progress text below:

const info = document.createElement('div');
info.style.color = '#fff';
info.style.textAlign = 'center';
info.textContent = `Match Master: ${p.match_master}/7 • Mystery: ${p.mystery}/7 • Total: ${p.total}/7`;
container.appendChild(info);

6. Sound hooks (E) — optional, non‑blocking

Create a tiny helper that fails gracefully if files are missing or audio is blocked.

export function createSound(src, { loop = false, volume = 0.5 } = {}) {
  try {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = volume;
    return {
      play: () => { audio.currentTime = 0; audio.play().catch(() => {}); },
      stop: () => audio.pause()
    };
  } catch {
    return { play: () => {}, stop: () => {} };
  }
}

Usage in Match Master:

import { createSound } from '../../core/sound.js';

const sfxMatch = createSound('assets/audio/sfx/match.wav');
const sfxStar  = createSound('assets/audio/sfx/star_collect.wav');

this.resolveMatches = (matches) => {
  sfxMatch.play();
  // existing logic...
};

onLevelComplete(level) {
  sfxStar.play();
  this.onWin(level);
}

If the files don’t exist yet, the game still runs.

7. Seven‑Star Ministry progression screen (F)

A dedicated “meta‑screen” that combines:

Star map

Badge list

Per‑game progress

Star_Match lock status

import { getProgress, isStarMatchUnlocked } from './progression.js';
import { renderStarMap } from './starMap.js';

export function renderSevenStarMinistry(container) {
  container.innerHTML = '';
  container.style.position = 'relative';
  container.style.padding = '20px';
  container.style.color = '#fff';
  container.style.background = '#050814';

  const title = document.createElement('h1');
  title.textContent = 'Seven-Star Ministry';
  title.style.textAlign = 'center';
  container.appendChild(title);

  renderStarMap(container);

  const p = getProgress();

  const summary = document.createElement('div');
  summary.style.textAlign = 'center';
  summary.style.marginTop = '16px';
  summary.textContent =
    `Match Master: ${p.match_master}/7 • Mystery: ${p.mystery}/7 • Total: ${p.total}/7`;
  container.appendChild(summary);

  const status = document.createElement('div');
  status.style.textAlign = 'center';
  status.style.marginTop = '8px';
  status.textContent = isStarMatchUnlocked()
    ? 'Star Match: UNLOCKED'
    : 'Star Match: Locked — collect 7 stars.';
  container.appendChild(status);
}

Wire a button in your launcher:

launcher.addButton('Seven-Star Ministry', () => {
  const mount = document.getElementById('arcade-root');
  renderSevenStarMinistry(mount);
});

What you can do right now

Export a single tileset atlas matching the mapping above.

Drop in:

tileset_atlas.png

tileset.json

Add:

progression.js, starMap.js, badges.js

Wire Match Master to:

load level1.json

call addStar('match_master') and arcadeApi.unlockBadge(...) on level win

You’ll immediately see:

Stars filling in the star map

Badge popups

Seven‑Star Ministry screen reflecting progress

Once that’s live, we can tighten:

Full 7‑level packs

Mystery quiz flow per level

Star_Match using the same shared tileset.
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
1. Asset Mapping (Audio & Visual)
We will map your uploaded audio files to the "Sound Hooks" (Section 6) of your plan:

Game Event	File Name	Purpose
Match/Get Item	get.mp3	Short feedback for every 3-match.
Badge Unlock	badge.mp3	Triggered when a level 7 star is earned.
Level Clear	course_clear.mp3	Fanfare after the 7th level of a pack.
Supernova/Chain	storm.mp3	Intense sound for large cascades.
Game Over/Esc	escape.mp3	UI sound for backing out or failing.
Ministry Screen	ending.mp3	Ambient music for the Seven-Star Ministry screen.
2. Implementation: The Master Git Commit
Push this to your repository to align the directory structure with your new organization plan.

refactor(arcade): implement unified tileset, level packs, and Ministry progression

Assets: Migrated to 4x4 tileset_atlas.jpg for shared game rendering.

Engine: Added QuizOverlay.js to handle Revelation Quiz UI without browser prompts.

Progression: Integrated renderStarMap to track Match Master and Mystery of the Seven Stars progress.

Audio: Wired get.mp3, badge.mp3, and storm.mp3 into core game hooks.

UI: Swapped legacy toolbox for the Seven-Star Ministry meta-screen.

3. Integrated Progression Logic
This snippet combines your Section 5 (Star Map) and Section 7 (Ministry Screen) with the audio hooks to create the "Juicy" feedback loop you're looking for.

JavaScript
import { getProgress } from './progression.js';
import { playSound } from './soundHooks.js'; // Helper for your uploaded MP3s

export function renderSevenStarMinistry(container) {
  const p = getProgress();
  
  // Play ambient 'ending.mp3' when entering the Ministry Screen
  playSound('ending');

  container.innerHTML = `
    <div class="ministry-wrap" style="background: #050814; color: gold; font-family: 'Cinzel', serif;">
      <h1>Seven-Star Ministry</h1>
      <div id="star-map-anchor"></div>
      <div class="badge-display">
         ${p.total >= 1 ? '<img src="badge1.png" class="unlock">' : '<div class="lock">?</div>'}
      </div>
      <div class="unlock-status">
        ${p.total >= 7 ? '✨ STAR MATCH UNLOCKED ✨' : `Collect ${7 - p.total} more stars to unlock.`}
      </div>
    </div>
  `;
  
  renderStarMap(document.getElementById('star-map-anchor'));
}
4. Next Steps to Go Live
Tileset Deployment: Ensure tileset_atlas.jpg is in your assets/games/shared/ folder.

Level JSONs: Create the 7 .json files for each game in their respective levels/ folders.

The Fix: Since this organization removes the complex "dual deployment" scripts and uses a clean loadLevel fetch, the grid on Nicholai.org should render instantly.

Should I generate the 7 level JSON files for "Mystery of the Seven Stars" now so you can drop them straight into your repository?
| File | Purpose |
|---|---|
| `main.js` | Bootstrap — wires up the game and service worker |
| `match-maker-ui.js` | Game UI layer — renders board, handles input/swaps/cascades |
| `matchMakerState.js` | Pure game logic — grid, match detection, gravity |
| `badges.js` | Level-completion badge notifications |
<img width="1536" height="1024" alt="tileset_atlas" src="https://github.com/user-attachments/assets/53217097-14c8-4ad0-94c4-8fb0c8942f0f" /><img width="1264" height="843" alt="tileset" src="https://github.com/user-attachments/assets/2ae6ee10-0743-4207-a0be-0fc5fcd06827" />


