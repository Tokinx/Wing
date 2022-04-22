<!-- Content -->
<section class="article">
	<?php
	if ( have_posts() ) :
		while ( have_posts() ) : the_post();
			require_once( "article-header.php" ); ?>
            <article class="article-content" itemscope itemtype="https://schema.org/Article">
				<?php the_content(); ?>
            </article>
		<?php
		endwhile;
	endif;
	?>
</section>