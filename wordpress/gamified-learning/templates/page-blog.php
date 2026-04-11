<?php
/**
 * Template Name: Gamified Learning – Blog
 *
 * Blog post index for the Gamified Learning site.
 * Select via: Page › Attributes › Template › "Gamified Learning – Blog"
 *
 * @package Gamified_Learning
 */

get_header();

$paged = max( 1, (int) get_query_var( 'paged' ) );
$query = new WP_Query(
	[
		'post_type'      => 'post',
		'posts_per_page' => 9,
		'paged'          => $paged,
	]
);
?>

<main id="gl-blog">

  <!-- ── Page header ──────────────────────────────────────────────────── -->
  <header class="gl-blog-header">
    <h1 class="gl-blog-header__title">Blog</h1>
    <p class="gl-blog-header__sub">Insights on learning, growth, and gamification.</p>
  </header>

  <!-- ── Post grid ────────────────────────────────────────────────────── -->
  <section class="gl-blog-grid-wrap">
    <div class="gl-blog-grid">

      <?php if ( $query->have_posts() ) : ?>

        <?php while ( $query->have_posts() ) : $query->the_post(); ?>
        <article class="gl-post-card" id="post-<?php the_ID(); ?>">

          <?php if ( has_post_thumbnail() ) : ?>
          <a class="gl-post-card__thumb" href="<?php the_permalink(); ?>">
            <?php the_post_thumbnail( 'medium', [ 'loading' => 'lazy' ] ); ?>
          </a>
          <?php endif; ?>

          <div class="gl-post-card__body">
            <span class="gl-post-card__date">
              <?php echo esc_html( get_the_date() ); ?>
            </span>

            <h2 class="gl-post-card__title">
              <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
            </h2>

            <p class="gl-post-card__excerpt">
              <?php echo esc_html( wp_trim_words( get_the_excerpt(), 22, '…' ) ); ?>
            </p>

            <a class="gl-post-card__more" href="<?php the_permalink(); ?>">
              Read more &#8594;
            </a>
          </div>

        </article>
        <?php endwhile; ?>

        <?php wp_reset_postdata(); ?>

      <?php else : ?>

        <p class="gl-blog-empty">No posts yet — check back soon!</p>

      <?php endif; ?>

    </div><!-- .gl-blog-grid -->

    <!-- ── Pagination ─────────────────────────────────────────────────── -->
    <?php if ( $query->max_num_pages > 1 ) : ?>
    <nav class="gl-pagination" aria-label="<?php esc_attr_e( 'Blog pages', 'gamified-learning' ); ?>">
      <?php
      echo wp_kses_post(
          paginate_links(
              [
                  'total'     => $query->max_num_pages,
                  'current'   => $paged,
                  'prev_text' => '&#8592; Prev',
                  'next_text' => 'Next &#8594;',
              ]
          )
      );
      ?>
    </nav>
    <?php endif; ?>

  </section><!-- .gl-blog-grid-wrap -->

</main>

<style>
/* ── Blog page styles ──────────────────────────────────────────────────── */
#gl-blog { background: #050508; color: #e0e0e0;
           font-family: 'Segoe UI', system-ui, sans-serif; min-height: 100vh; }

/* Header */
.gl-blog-header { background: linear-gradient(135deg, #0a0a0f 0%, #0d1a2e 100%);
                  padding: 4rem 1.5rem 3rem; text-align: center;
                  border-bottom: 1px solid #1a1a2e; }
.gl-blog-header__title { font-size: clamp(1.6rem, 4vw, 2.2rem); letter-spacing: .12em;
                          text-transform: uppercase; color: #00ff41;
                          text-shadow: 0 0 16px rgba(0,255,65,.45); margin-bottom: .5rem; }
.gl-blog-header__sub   { color: #aaa; font-size: 1rem; }

/* Grid */
.gl-blog-grid-wrap { padding: 3rem 1.5rem; max-width: 1040px; margin: 0 auto; }
.gl-blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

/* Post card */
.gl-post-card { background: #0d0d1a; border: 1px solid #1a1a2e; border-radius: 12px;
                overflow: hidden; display: flex; flex-direction: column; }
.gl-post-card__thumb img { width: 100%; display: block;
                           transition: opacity .2s; }
.gl-post-card__thumb:hover img { opacity: .85; }
.gl-post-card__body  { padding: 1rem 1.1rem 1.2rem; display: flex;
                        flex-direction: column; gap: .5rem; flex: 1; }
.gl-post-card__date  { font-size: .72rem; color: #555; text-transform: uppercase;
                        letter-spacing: .08em; }
.gl-post-card__title { font-size: 1rem; margin: 0; line-height: 1.4; }
.gl-post-card__title a { color: #e0e0e0; text-decoration: none; }
.gl-post-card__title a:hover { color: #00ff41; }
.gl-post-card__excerpt { font-size: .85rem; color: #888; line-height: 1.6; flex: 1; }
.gl-post-card__more  { color: #00ff41; font-size: .8rem; text-decoration: none;
                        letter-spacing: .05em; margin-top: auto; }
.gl-post-card__more:hover { text-decoration: underline; }

/* Empty state */
.gl-blog-empty { color: #aaa; text-align: center; grid-column: 1 / -1;
                 padding: 3rem 0; }

/* Pagination */
.gl-pagination { text-align: center; padding: 1rem 0; }
.gl-pagination .page-numbers {
  display: inline-block; padding: .3rem .7rem; margin: 0 .15rem;
  border: 1px solid #1a1a2e; border-radius: 4px;
  color: #aaa; text-decoration: none; font-size: .85rem;
  transition: border-color .15s, color .15s;
}
.gl-pagination .page-numbers:hover,
.gl-pagination .page-numbers.current {
  border-color: #00ff41; color: #00ff41;
}
</style>

<?php get_footer(); ?>
