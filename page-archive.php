<?php
/*
Template Name: 文章归档
*/
get_header();
if ( have_posts() ) {
	while ( have_posts() ) {
		the_post();
		require_once( "inc/article-header.php" );
	}
}; ?>
    <article class="article archives" itemscope itemtype="https://schema.org/Article">
        <div class="timeline">
			<?php foreach ( get_my_archives() as $block ): ?>
                <div class="timeline-item">
                    <div class="timeline-left">
                        <div class="timeline-icon icon-lg"><i class="czs-medal"></i></div>
                    </div>
                    <div class="timeline-content pt-0">
                        <div class="tile">
                            <div class="tile-content">
                                <p class="tile-subtitle text-large text-bold"><?= $block['year'] ?></p>
                            </div>
                            <div class="tile-action">
                                <span class="chip"><?= count( $block['articles'] ) ?></span>
                            </div>
                        </div>
                    </div>
                </div>
				<?php foreach ( $block["articles"] as $article ): ?>
                    <div class="timeline-item">
                        <div class="timeline-left">
                            <div class="timeline-icon"></div>
                        </div>
                        <div class="timeline-content pt-0">
                            <div class="tile">
                                <div class="tile-content">
                                    <p class="tile-subtitle">
                                        <a href="<?= $article['permalink'] ?>"><?= $article['title'] ?></a>
                                        - <?= $article['month-day'] ?>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
				<?php endforeach; ?>
			<?php endforeach; ?>
        </div>
    </article>
<?php get_footer(); ?>