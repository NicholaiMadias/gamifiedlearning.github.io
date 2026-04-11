<?php
/**
 * Plugin Name:  Gamified Learning
 * Plugin URI:   https://github.com/NicholaiMadias/gamifiedlearning.github.io
 * Description:  Embeds the Match Maker gem-swap game via the [gamified_learning]
 *               shortcode. Multiple instances on the same page are fully scoped —
 *               each runs in its own IIFE with unique DOM IDs so there are no
 *               global-scope collisions. Also registers "Gamified Learning – Index"
 *               and "Gamified Learning – Blog" page templates selectable from
 *               Page › Attributes › Template.
 * Version:      1.0.0
 * Author:       NicholaiMadias
 * License:      GPL-2.0+
 * License URI:  https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:  gamified-learning
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Gamified_Learning {

	/** Incremented for every shortcode rendered; gives each instance unique IDs. */
	private static int $count = 0;

	/** Track whether the shared CSS block has already been emitted this request. */
	private static bool $css_done = false;

	// ── Bootstrap ─────────────────────────────────────────────────────────────

	public static function init(): void {
		add_shortcode( 'gamified_learning', [ __CLASS__, 'shortcode' ] );
		add_filter( 'theme_page_templates', [ __CLASS__, 'register_templates' ] );
		add_filter( 'template_include',     [ __CLASS__, 'load_template' ] );
	}

	// ── Shortcode ─────────────────────────────────────────────────────────────

	/**
	 * Usage: [gamified_learning]
	 * Safe to place on a page more than once — each instance is fully isolated.
	 */
	public static function shortcode( array $atts ): string {
		self::$count++;
		$pfx = 'gl-' . self::$count;
		$css = self::$css_done ? '' : self::render_css();
		self::$css_done = true;
		return $css . self::render_html( $pfx ) . self::render_js( $pfx );
	}

	// ── HTML ──────────────────────────────────────────────────────────────────

	private static function render_html( string $pfx ): string {
		/* phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped */
		return sprintf(
			'<div class="gl-wrap">'
			. '<section class="gl-match-card">'
			.   '<h2 class="gl-heading">Match Maker</h2>'
			.   '<div class="gl-match-stats">'
			.     '<div>Score: <span id="%1$s-score">0</span></div>'
			.     '<div>Moves: <span id="%1$s-moves">20</span></div>'
			.     '<div>Level: <span id="%1$s-level">1</span></div>'
			.   '</div>'
			.   '<div class="gl-match-grid" id="%1$s-grid"></div>'
			.   '<div id="%1$s-banner" class="gl-badge-banner gl-hidden"></div>'
			.   '<button class="gl-restart-btn" id="%1$s-restart">&#8635; Restart</button>'
			. '</section>'
			. '</div>',
			esc_attr( $pfx )
		);
		/* phpcs:enable */
	}

	// ── CSS (emitted once per page) ───────────────────────────────────────────

	private static function render_css(): string {
		return <<<'CSS'
<style id="gamified-learning-css">
.gl-wrap { font-family: 'Segoe UI', system-ui, sans-serif; color: #e0e0e0; }
.gl-match-card {
  background: #0d0d1a; border: 1px solid #1a1a2e; border-radius: 12px;
  padding: 1rem; width: 100%; max-width: 460px; margin: 0 auto;
}
.gl-heading {
  text-align: center; font-size: 1.1rem; letter-spacing: .1em;
  text-transform: uppercase; color: #00ff41; margin-bottom: .6rem;
}
.gl-match-stats {
  display: flex; justify-content: space-around; font-size: .85rem;
  color: #aaa; margin-bottom: .8rem;
}
.gl-match-stats span { color: #00ff41; font-weight: 700; }
.gl-match-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: .4rem; padding: .8rem; width: 100%; max-width: 420px; margin: 0 auto;
}
.gl-cell {
  aspect-ratio: 1/1; border-radius: 8px; display: flex;
  align-items: center; justify-content: center; font-size: 1.4rem;
  cursor: pointer; background: #111; box-shadow: 0 0 6px rgba(0,0,0,.6);
  transition: transform .1s, box-shadow .1s; user-select: none;
}
.gl-cell:hover  { transform: scale(1.08); box-shadow: 0 0 10px rgba(0,255,65,.3); }
.gl-cell:active { transform: scale(.94); }
.gl-badge-banner {
  text-align: center; font-size: .9rem; color: #00ff41; background: #001a00;
  border: 1px solid rgba(0,255,65,.38); border-radius: 8px;
  padding: .5rem 1rem; margin-top: .6rem;
}
.gl-hidden { display: none; }
.gl-restart-btn {
  display: block; margin: .8rem auto 0; background: transparent;
  border: 1px solid #00ff41; color: #00ff41; padding: .4rem 1.4rem;
  border-radius: 6px; cursor: pointer; font-size: .85rem;
  letter-spacing: .08em; transition: background .15s;
}
.gl-restart-btn:hover { background: rgba(0,255,65,.13); }
</style>
CSS;
	}

	// ── JS (IIFE per instance — zero globals) ─────────────────────────────────

	private static function render_js( string $pfx ): string {
		/*
		 * The JS template uses __PFX__ as a placeholder for the instance prefix.
		 * str_replace() injects the real value without any PHP heredoc interpolation
		 * risks (no stray $ expansion).
		 */
		$js = <<<'NOWDOC'
<script>
(function () {
  'use strict';

  var pfx = '__PFX__';
  function gid(s) { return document.getElementById(pfx + '-' + s); }

  /* ── constants ──────────────────────────────────────────────────────── */
  var GRID_SIZE     = 7;
  var GEM_TYPES     = ['heart', 'star', 'cross', 'flame', 'drop'];
  var SCORE_PER_LVL = 500;
  var BADGES = {
    1: '🌱 Seedling', 2: '⚡ Charged', 3: '🔥 On Fire',
    4: '💎 Diamond',  5: '👑 Champion'
  };
  var ICONS = { heart: '💖', star: '⭐', cross: '✝️', flame: '🔥', drop: '💧' };

  /* ── game state ─────────────────────────────────────────────────────── */
  var grid, selected, score, moves, level;

  /* ── grid logic ─────────────────────────────────────────────────────── */
  function randomGem() {
    return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
  }

  function createGrid() {
    var g = [];
    for (var r = 0; r < GRID_SIZE; r++) {
      g[r] = [];
      for (var c = 0; c < GRID_SIZE; c++) {
        var gem; var tries = 0;
        do { gem = randomGem(); tries++; } while (
          tries < 20 && (
            (c >= 2 && g[r][c - 1] === gem && g[r][c - 2] === gem) ||
            (r >= 2 && g[r - 1][c] === gem && g[r - 2][c] === gem)
          )
        );
        g[r][c] = gem;
      }
    }
    return g;
  }

  function canSwap(g, r1, c1, r2, c2) {
    return (Math.abs(r1 - r2) === 1 && c1 === c2) ||
           (r1 === r2 && Math.abs(c1 - c2) === 1);
  }

  function applySwap(g, r1, c1, r2, c2) {
    var n = g.map(function (row) { return row.slice(); });
    var t = n[r1][c1]; n[r1][c1] = n[r2][c2]; n[r2][c2] = t;
    return n;
  }

  function findMatches(g) {
    var matched = {};
    function key(r, c) { return r + ',' + c; }
    var r, c, run, k;
    for (r = 0; r < GRID_SIZE; r++) {
      for (run = 1, c = 1; c <= GRID_SIZE; c++) {
        if (c < GRID_SIZE && g[r][c] && g[r][c] === g[r][c - 1]) { run++; }
        else { if (run >= 3) { for (k = c - run; k < c; k++) matched[key(r, k)] = 1; } run = 1; }
      }
    }
    for (c = 0; c < GRID_SIZE; c++) {
      for (run = 1, r = 1; r <= GRID_SIZE; r++) {
        if (r < GRID_SIZE && g[r][c] && g[r][c] === g[r - 1][c]) { run++; }
        else { if (run >= 3) { for (k = r - run; k < r; k++) matched[key(k, c)] = 1; } run = 1; }
      }
    }
    var keys = Object.keys(matched);
    if (!keys.length) { return []; }
    return [keys.map(function (k) { var p = k.split(','); return { r: +p[0], c: +p[1] }; })];
  }

  function clearMatches(g, ms) {
    var n = g.map(function (row) { return row.slice(); });
    ms.forEach(function (grp) { grp.forEach(function (p) { n[p.r][p.c] = null; }); });
    return n;
  }

  function applyGravity(g) {
    var n = g.map(function (row) { return row.slice(); });
    for (var c = 0; c < GRID_SIZE; c++) {
      var gems = [];
      for (var r = GRID_SIZE - 1; r >= 0; r--) { if (n[r][c] !== null) { gems.push(n[r][c]); } }
      for (var row = GRID_SIZE - 1; row >= 0; row--) { n[row][c] = gems.length ? gems.shift() : randomGem(); }
    }
    return n;
  }

  /* ── rendering ──────────────────────────────────────────────────────── */
  function gemIcon(t) { return ICONS[t] || '⬛'; }

  function renderGrid() {
    var el = gid('grid');
    el.innerHTML = '';
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var cell = document.createElement('div');
        cell.className = 'gl-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.textContent = gemIcon(grid[r][c]);
        (function (rr, cc) {
          cell.onclick = function () { onCellClick(rr, cc); };
        }(r, c));
        el.appendChild(cell);
      }
    }
  }

  function highlight(r, c, on) {
    var cell = gid('grid').querySelector('[data-row="' + r + '"][data-col="' + c + '"]');
    if (cell) { cell.style.outline = on ? '2px solid #00ff41' : 'none'; }
  }

  /* ── game loop ──────────────────────────────────────────────────────── */
  function onCellClick(r, c) {
    if (moves <= 0) { return; }
    if (!selected) { selected = { r: r, c: c }; highlight(r, c, true); return; }
    var r1 = selected.r, c1 = selected.c;
    if (r === r1 && c === c1) { highlight(r, c, false); selected = null; return; }
    if (!canSwap(grid, r1, c1, r, c)) {
      highlight(r1, c1, false); selected = { r: r, c: c }; highlight(r, c, true); return;
    }
    var swapped = applySwap(grid, r1, c1, r, c);
    if (!findMatches(swapped).length) { highlight(r1, c1, false); selected = null; return; }
    grid = swapped; highlight(r1, c1, false); selected = null;
    moves--;
    gid('moves').textContent = moves;
    resolveMatches();
  }

  function resolveMatches() {
    var ms = findMatches(grid);
    var safety = 0;
    while (ms.length && safety < 100) {
      ms.forEach(function (m) { score += m.length * 10; });
      gid('score').textContent = score;
      grid = applyGravity(clearMatches(grid, ms));
      ms = findMatches(grid);
      safety++;
    }
    renderGrid();
    checkLevelUp();
    checkGameOver();
  }

  function checkLevelUp() {
    if (score >= level * SCORE_PER_LVL) {
      var label = BADGES[level] || ('🏅 Level ' + level);
      showBanner(label + ' badge unlocked! Score: ' + score, 3000);
      level++;
      moves += 10;
      gid('level').textContent = level;
      gid('moves').textContent = moves;
    }
  }

  function checkGameOver() {
    if (moves <= 0) { showBanner('Game Over! Final score: ' + score, 0); }
  }

  function showBanner(msg, hideAfter) {
    var b = gid('banner');
    b.textContent = msg;
    b.classList.remove('gl-hidden');
    if (hideAfter) { setTimeout(function () { b.classList.add('gl-hidden'); }, hideAfter); }
  }

  /* ── init ───────────────────────────────────────────────────────────── */
  function initMatchMaker() {
    score = 0; moves = 20; level = 1; selected = null;
    grid = createGrid();
    gid('score').textContent = score;
    gid('moves').textContent = moves;
    gid('level').textContent = level;
    renderGrid();
  }

  initMatchMaker();

  gid('restart').addEventListener('click', function () {
    gid('banner').classList.add('gl-hidden');
    initMatchMaker();
  });

}());
</script>
NOWDOC;

		return str_replace( '__PFX__', esc_js( $pfx ), $js );
	}

	// ── Page templates ────────────────────────────────────────────────────────

	/**
	 * Adds the plugin's templates to the Page Attributes › Template dropdown.
	 *
	 * @param array<string,string> $templates
	 * @return array<string,string>
	 */
	public static function register_templates( array $templates ): array {
		$templates['gl-page-index'] = __( 'Gamified Learning – Index', 'gamified-learning' );
		$templates['gl-page-blog']  = __( 'Gamified Learning – Blog',  'gamified-learning' );
		return $templates;
	}

	/**
	 * Serves the plugin-bundled template file when the page's _wp_page_template
	 * meta matches one of the plugin's registered template slugs.
	 */
	public static function load_template( string $template ): string {
		if ( ! is_page() ) {
			return $template;
		}
		$meta = (string) get_post_meta( get_the_ID(), '_wp_page_template', true );
		$map  = [
			'gl-page-index' => __DIR__ . '/templates/page-index.php',
			'gl-page-blog'  => __DIR__ . '/templates/page-blog.php',
		];
		if ( isset( $map[ $meta ] ) && file_exists( $map[ $meta ] ) ) {
			return $map[ $meta ];
		}
		return $template;
	}
}

Gamified_Learning::init();
