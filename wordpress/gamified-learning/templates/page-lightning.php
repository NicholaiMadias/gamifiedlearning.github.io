<?php
/**
 * Template Name: Gamified Learning – Lightning Page
 *
 * Minimal, single-purpose landing page for the Match Maker game.
 * Intentionally lightweight: no sidebar, no header/footer chrome — just the
 * hero, the game, a short pitch, and a CTA row.
 *
 * Select via: Page › Attributes › Template › "Gamified Learning – Lightning Page"
 *
 * @package Gamified_Learning
 */

// Register this template with WordPress (handled by the plugin's filter, but the
// docblock above is what WP reads when scanning theme/plugin template files).
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo( 'charset' ); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php wp_head(); ?>
  <style>
  /* ── Lightning Page reset ──────────────────────────────────────────── */
  .lp-hero, .lp-hero *, .lp-hero *::before, .lp-hero *::after,
  .lp-game, .lp-game *, .lp-game *::before, .lp-game *::after,
  .lp-features, .lp-features *, .lp-features *::before, .lp-features *::after,
  .lp-cta-strip, .lp-cta-strip *, .lp-cta-strip *::before, .lp-cta-strip *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body.gl-lightning-page { background: #050508; color: #e0e0e0;
         font-family: 'Segoe UI', system-ui, sans-serif; }
  .lp-hero a, .lp-game a, .lp-features a, .lp-cta-strip a { color: #00ff41; }

  /* ── Hero ──────────────────────────────────────────────────────────── */
  .lp-hero {
    background: linear-gradient(135deg, #0a0a0f 0%, #0d1a2e 100%);
    padding: 3rem 1.5rem 2.5rem;
    text-align: center;
    border-bottom: 1px solid #1a1a2e;
  }
  .lp-hero__eyebrow {
    font-size: .72rem; letter-spacing: .2em; text-transform: uppercase;
    color: #00ff41; margin-bottom: .6rem;
  }
  .lp-hero__title {
    font-size: clamp(1.8rem, 5vw, 2.8rem); font-weight: 700;
    letter-spacing: .06em; color: #fff;
    text-shadow: 0 0 24px rgba(0,255,65,.35);
    margin-bottom: .75rem;
  }
  .lp-hero__sub {
    font-size: clamp(.9rem, 2.2vw, 1.05rem); color: #aaa;
    max-width: 540px; margin: 0 auto 1.4rem;
    line-height: 1.65;
  }
  .lp-hero__cta {
    display: inline-block; padding: .65rem 1.8rem;
    background: #00ff41; color: #050508;
    font-weight: 700; font-size: .9rem; letter-spacing: .08em;
    border-radius: 6px; text-decoration: none;
    transition: opacity .15s;
  }
  .lp-hero__cta:hover { opacity: .85; }

  /* ── Game section ──────────────────────────────────────────────────── */
  .lp-game {
    padding: 2.5rem 1rem;
    display: flex; justify-content: center;
  }

  /* ── Features ──────────────────────────────────────────────────────── */
  .lp-features {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.2rem;
    max-width: 860px; margin: 0 auto;
    padding: 0 1.5rem 3rem;
  }
  .lp-feature {
    background: #0d0d1a; border: 1px solid #1a1a2e;
    border-radius: 10px; padding: 1.1rem 1.2rem;
  }
  .lp-feature__icon { font-size: 1.5rem; margin-bottom: .5rem; line-height: 1; }
  .lp-feature__title {
    font-size: .85rem; font-weight: 700; letter-spacing: .07em;
    text-transform: uppercase; color: #00ff41; margin-bottom: .35rem;
  }
  .lp-feature__desc { font-size: .82rem; color: #888; line-height: 1.6; }

  /* ── CTA strip ─────────────────────────────────────────────────────── */
  .lp-cta-strip {
    background: #0d0d1a; border-top: 1px solid #1a1a2e;
    padding: 2rem 1.5rem; text-align: center;
  }
  .lp-cta-strip p { color: #aaa; margin-bottom: 1rem; font-size: .9rem; }
  .lp-cta-strip a {
    display: inline-block; padding: .55rem 1.5rem;
    border: 1px solid #00ff41; color: #00ff41;
    border-radius: 6px; font-size: .85rem; letter-spacing: .07em;
    text-decoration: none; transition: background .15s;
  }
  .lp-cta-strip a:hover { background: rgba(0,255,65,.12); }
  </style>
</head>
<body <?php body_class( 'gl-lightning-page' ); ?>>
<?php wp_body_open(); ?>

<!-- ── Hero ─────────────────────────────────────────────────────────────── -->
<header class="lp-hero">
  <p class="lp-hero__eyebrow">Gamified Learning</p>
  <h1 class="lp-hero__title">Match Gems. Level Up.</h1>
  <p class="lp-hero__sub">
    Swap adjacent gems to form matches of three or more. Chain reactions score big.
    Can you reach Champion before your moves run out?
  </p>
  <a href="#game" class="lp-hero__cta">Play Now ↓</a>
</header>

<!-- ── Game ─────────────────────────────────────────────────────────────── -->
<div class="lp-game" id="game">
  <?php echo do_shortcode( '[gamified_learning]' ); ?>
</div>

<!-- ── Features ─────────────────────────────────────────────────────────── -->
<section class="lp-features" aria-label="Why Gamified Learning">

  <div class="lp-feature">
    <div class="lp-feature__icon" aria-hidden="true">&#9726;</div>
    <h2 class="lp-feature__title">Pattern Recognition</h2>
    <p class="lp-feature__desc">
      Spotting matches trains the same visual-processing pathways used in reading
      and problem-solving.
    </p>
  </div>

  <div class="lp-feature">
    <div class="lp-feature__icon" aria-hidden="true">&#9654;</div>
    <h2 class="lp-feature__title">Instant Feedback</h2>
    <p class="lp-feature__desc">
      Every swap triggers immediate visual feedback — no waiting, no loading screens,
      pure flow state.
    </p>
  </div>

  <div class="lp-feature">
    <div class="lp-feature__icon" aria-hidden="true">&#9651;</div>
    <h2 class="lp-feature__title">Progressive Badges</h2>
    <p class="lp-feature__desc">
      Five achievement tiers from Seedling to Champion keep learners motivated to
      push further each session.
    </p>
  </div>

  <div class="lp-feature">
    <div class="lp-feature__icon" aria-hidden="true">&#9633;</div>
    <h2 class="lp-feature__title">Works Everywhere</h2>
    <p class="lp-feature__desc">
      Fully responsive and touch-friendly. No downloads, no installs — just open
      and play on any device.
    </p>
  </div>

</section>

<!-- ── CTA strip ─────────────────────────────────────────────────────────── -->
<div class="lp-cta-strip">
  <p>Want more games and learning tools?</p>
  <?php
  $posts_page_id = (int) get_option( 'page_for_posts' );
  $blog_url      = $posts_page_id > 0 ? get_permalink( $posts_page_id ) : home_url( '/blog/' );
  ?>
  <a href="<?php echo esc_url( $blog_url ); ?>">
    Read the Blog &#8594;
  </a>
</div>

<?php wp_footer(); ?>
</body>
</html>
