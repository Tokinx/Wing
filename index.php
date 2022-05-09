<?php get_header(); ?>
    <!-- 文章列表 -->
    <div class="article-list">
		<?php if ( have_posts() ) {
			while ( have_posts() ) : the_post();
				$thumbnail = get_thumbnail();
				$maskTag   = ! post_password_required() ? 'a' : 'div';
				?>
                <article class="card uni-card article-item">
                <<?= $maskTag ?> href="<?php the_permalink(); ?>" class="article-mask">
				<?php if ( $thumbnail ) { ?>
                    <div class="article-thumbnail" style="background-image: url('<?= $thumbnail; ?>');"></div>
				<?php } else { ?>
                    <div class="article-thumbnail">
                        <main class="card-body">
                            <p class="text-tiny text-gray">
								<?php if ( post_password_required() ) {
									the_content();
								} else {
									$content       = get_post_field( 'post_content', get_the_ID() );
									$content_parts = get_extended( $content );
									echo mb_strimwidth( strip_shortcodes( strip_tags( apply_filters( 'the_content', $post->post_excerpt ?: $content_parts['main'] ) ) ), 0, 300, '...' );
								} ?>
                            </p>
                        </main>
                    </div>
				<?php }; ?>
                <header class="card-header">
                    <h2 class="card-title h5 text-dark text-ellipsis">
						<?php the_title(); ?>
						<?php //= !post_password_required() ? get_the_title() : '<a href="' . get_permalink() . '">' . get_the_title() . '</a>';
						?>
                    </h2>
                    <div class="card-subtitle text-gray">
                        <ul class="d-flex text-tiny text-gray reset-ul">
                            <li class="time">
                                <i class="czs-time"></i>
                                <time datetime="<?php the_time( 'c' ); ?>" itemprop="datePublished"
                                      pubdate><?php the_time( 'Y-m-d' ); ?></time>
                            </li>
                            <li class="comments">
                                <i class="czs-comment"></i>
								<?php comments_number( '0', '1', '%' ); ?>
                            </li>
							<?php if ( get_praise() ) : ?>
                                <li class="likes">
                                    <i class="czs-heart"></i>
									<?= get_praise() ?>
                                </li>
							<?php endif; ?>
                        </ul>
                    </div>
                </header>
                </<?= $maskTag ?>>
                </article>
			<?php endwhile;
		} else { ?>
            <article class="meta flex-center w-100" style="padding: 20% 0;flex-direction: column;">
                <h1>404</h1>
                <p>This page doesn't have what you're looking for.</p>
            </article>
		<?php }; ?>
    </div>
<?php the_pagination() ?>
<?php get_footer(); ?>