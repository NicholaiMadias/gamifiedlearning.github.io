=== Gamified Learning – Match Maker ===
Contributors:      nicholaimadias
Tags:              game, match, shortcode, embed, gamification, learning
Requires at least: 5.8
Tested up to:      6.5
Requires PHP:      7.4
Stable tag:        1.0.0
License:           GPL-2.0+
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Embed the Match Maker gem-swap game anywhere on your WordPress site via the [gamified_learning] shortcode.

== Description ==

**Gamified Learning – Match Maker** is a zero-dependency WordPress plugin that embeds a fully playable gem-swap puzzle game on any page or post using a simple shortcode.

**Key features:**

* `[gamified_learning]` shortcode — drop the game into any page, post, or widget area.
* **Multiple instances per page** — each embed gets a unique DOM-ID prefix and runs in its own IIFE, so placing the shortcode more than once on the same page causes zero conflicts.
* **Shared CSS, deduped** — the plugin's stylesheet block is emitted only once per page load, no matter how many shortcode instances are on the page.
* **Three built-in page templates** selectable from *Page › Attributes › Template*:
  * **Gamified Learning – Index** — hero section + embedded game + About content + Blog CTA.
  * **Gamified Learning – Blog** — responsive paginated 3-column post grid with thumbnails and excerpts.
  * **Gamified Learning – Lightning Page** — minimal, theme-chrome-free standalone page with dark hero, inline game, feature grid, and Blog CTA. Ideal for landing pages and paid campaigns.
* **Self-contained** — no external JS or CSS files; everything is inlined. Works with any theme.

== Installation ==

1. Upload the `gamified-learning` folder to `wp-content/plugins/`.
2. Activate the plugin from *Plugins › Installed Plugins*.
3. Add `[gamified_learning]` to any page or post content.

To use the bundled page templates:

1. Create or edit a Page.
2. Under *Page › Attributes › Template*, select **Gamified Learning – Index**, **Gamified Learning – Blog**, or **Gamified Learning – Lightning Page**.
3. Publish / update the page.

== Frequently Asked Questions ==

= Can I embed the game more than once on a page? =

Yes. Each `[gamified_learning]` instance is fully isolated — it gets its own unique element IDs and runs in its own IIFE, so multiple instances on the same page will never conflict with each other.

= Does the plugin add scripts to every page? =

No. All CSS and JS are output only on pages where the shortcode (or a plugin page template) is actually rendered.

= What is the minimum PHP version? =

PHP 7.4. The plugin uses typed class properties which require PHP 7.4+. WordPress will prevent activation on older PHP versions when the `Requires PHP` header is respected.

= Does it work with page builders (Elementor, Divi, Beaver Builder…)? =

Yes. Use a **Shortcode** or **HTML** block and paste `[gamified_learning]` in. The game is fully self-contained and does not depend on any theme or builder styles.

= Is there a block (Gutenberg) version? =

Not yet — use the Shortcode block in the Gutenberg editor.

== Screenshots ==

1. The game embedded on a page via the `[gamified_learning]` shortcode.
2. The Gamified Learning – Index page template.
3. The Gamified Learning – Blog page template.
4. The Gamified Learning – Lightning Page template.

== Changelog ==

= 1.0.0 =
* Initial release.
* `[gamified_learning]` shortcode with per-instance IIFE isolation.
* Gamified Learning – Index, Gamified Learning – Blog, and Gamified Learning – Lightning Page templates.
* `resolveMatches()` safety cap (100 iterations) with `console.warn`.
* `bannerTimeout` management so badge/game-over banners never overlap.
* All three post-card permalink `href` attributes use `esc_url( get_permalink() )`.
* Pagination uses both `paged` and `page` query vars for reliable static-page pagination.
* Lightning Page CSS reset scoped to page wrapper classes to preserve WordPress admin bar.
* Lightning Page CTA blog URL safely validated before calling `get_permalink()`.

== Upgrade Notice ==

= 1.0.0 =
Initial public release.
