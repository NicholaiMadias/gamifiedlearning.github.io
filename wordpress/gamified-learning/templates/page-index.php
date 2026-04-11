<?php
/**
 * Template Name: Gamified Learning – Index
 *
 * Landing / index page for the Gamified Learning site.
 * Select via: Page › Attributes › Template › "Gamified Learning – Index"
 *
 * @package Gamified_Learning
 */

get_header();
?>

<main id="gl-main">

  <!-- ── Hero ─────────────────────────────────────────────────────────── -->
  <section class="gl-hero">
    <div class="gl-hero__inner">
      <h1 class="gl-hero__title">Gamified Learning</h1>
      <p class="gl-hero__sub">
        Match gems, level up, and build virtues — one move at a time.
      </p>
      <a href="#gl-play" class="gl-btn">&#9654; Play Now</a>
    </div>
  </section>

  <!-- ── Featured game ────────────────────────────────────────────────── -->
  <section id="gl-play" class="gl-section gl-section--dark">
    <h2 class="gl-section__label">Featured Game</h2>
    <?php echo do_shortcode( '[gamified_learning]' ); ?>
  </section>

  <!-- ── About (page content) ─────────────────────────────────────────── -->
  <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
  <section class="gl-section gl-section--content">
    <div class="gl-prose">
      <h2 class="gl-prose__title"><?php the_title(); ?></h2>
      <div class="gl-prose__body"><?php the_content(); ?></div>
    </div>
  </section>
  <?php endwhile; endif; ?>

  <!-- ── Blog CTA ─────────────────────────────────────────────────────── -->
  <section class="gl-section gl-section--cta">
    <p class="gl-cta__text">Read the latest posts in our learning blog.</p>
    <?php
    $blog_page_id  = (int) get_option( 'page_for_posts' );
    $blog_page_url = $blog_page_id > 0
        ? get_permalink( $blog_page_id )
        : home_url( '/blog/' );
    ?>
    <a href="<?php echo esc_url( $blog_page_url ); ?>"
       class="gl-btn gl-btn--secondary">
      &#128214; Blog
    </a>
  </section>

</main>

<style>
/* ── Index page styles ─────────────────────────────────────────────────── */
#gl-main { background: #050508; color: #e0e0e0;
           font-family: 'Segoe UI', system-ui, sans-serif; }

/* Hero */
.gl-hero { background: linear-gradient(135deg, #0a0a0f 0%, #0d1a2e 100%);
           padding: 5rem 1.5rem 4rem; text-align: center; }
.gl-hero__inner { max-width: 640px; margin: 0 auto; }
.gl-hero__title { font-size: clamp(1.8rem, 5vw, 2.8rem); letter-spacing: .12em;
                  text-transform: uppercase; color: #00ff41;
                  text-shadow: 0 0 20px rgba(0,255,65,.5); margin-bottom: .8rem; }
.gl-hero__sub   { font-size: 1.05rem; color: #aaa;
                  max-width: 480px; margin: 0 auto 2rem; line-height: 1.6; }

/* Buttons */
.gl-btn { display: inline-block; padding: .5rem 1.8rem; border-radius: 6px;
          font-size: .9rem; letter-spacing: .08em; text-decoration: none;
          transition: background .15s, color .15s;
          border: 1px solid #00ff41; color: #00ff41; background: transparent; }
.gl-btn:hover { background: rgba(0,255,65,.13); }
.gl-btn--secondary { border-color: #4fc3f7; color: #4fc3f7; }
.gl-btn--secondary:hover { background: rgba(79,195,247,.13); }

/* Sections */
.gl-section { padding: 3rem 1.5rem; }
.gl-section--dark { background: #050508; text-align: center; }
.gl-section--content { background: #0a0a0f; }
.gl-section--cta { background: #0d0d1a; text-align: center; }
.gl-section__label { font-size: .8rem; letter-spacing: .14em;
                     text-transform: uppercase; color: #555; margin-bottom: 1.8rem; }

/* Prose */
.gl-prose { max-width: 680px; margin: 0 auto; }
.gl-prose__title { font-size: 1.4rem; color: #4fc3f7; margin-bottom: .8rem; }
.gl-prose__body  { color: #aaa; line-height: 1.75; }
.gl-prose__body a { color: #00ff41; }

/* CTA */
.gl-cta__text { color: #aaa; margin-bottom: 1.2rem; }
</style>

<?php get_footer(); ?>
