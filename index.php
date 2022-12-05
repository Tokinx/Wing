<?php get_header(); ?>
    <!-- 文章列表 -->
    <div class="article-list">
		<?php if ( have_posts() ) {
			while ( have_posts() ) : the_post(); ?>
                <article class="article-item">
                    <a href="<?php the_permalink(); ?>" class="article-mask">
						<?php if ( ! post_password_required() && $thumbnail = get_thumbnail() ) { ?>
                            <div class="article-thumbnail" style="background-image: url('<?= $thumbnail; ?>');"></div>
						<?php } else { ?>
                            <div class="article-thumbnail">
                                <main class="article-body <?= ( post_password_required() ? 'flex-center' : '' ) ?>">
                                    <p class="text-tiny text-gray">
										<?php if ( post_password_required() ) : ?>
                                            <span class="d-block text-center mt-2" style="font-size: 3rem;">
                                                <i class="dashicons dashicons-privacy d-block"></i>
                                            </span>
										<?php else :
											echo mb_strimwidth( strip_shortcodes( strip_tags( get_the_content() ) ), 0, 300, '...' );
										endif; ?>
                                    </p>
                                </main>
                            </div>
						<?php }; ?>
                        <header class="article-header">
                            <h2 class="article-title h5 text-dark text-ellipsis">
								<?php the_title(); ?>
                            </h2>
                            <div class="article-subtitle text-gray">
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
									<?php if ( $post_praise = get_praise() ) : ?>
                                        <li class="likes">
                                            <i class="czs-heart"></i>
											<?= $post_praise ?>
                                        </li>
									<?php endif; ?>
                                </ul>
                            </div>
                        </header>
                    </a>
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