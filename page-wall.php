<?php
/*
Template Name: 读者排行
*/
get_header();
if ( have_posts() ) {
	while ( have_posts() ) {
		the_post();
		require_once( "inc/article-header.php" );
	}
}; ?>
    <article class="article" itemscope itemtype="https://schema.org/Article">
        <ul class="article-cards columns reset-ul">
			<?php foreach ( get_readers_wall() as $comment ) :
				$url = $comment->comment_author_url;
				$alt = mb_substr( $comment->comment_author, 0, 1 );
				$avatar = get_avatar_url( $comment->comment_author_email ); ?>
                <li class="column col-3 col-sm-4 col-xs-6 p-2">
                    <div class="card uni-card flex-center text-center p-2">
                        <a class="text-gray text-tiny m-2" href="<?= ( $url ?: 'javascript:void(0);' ); ?>"
                           target="<?= ( $url ? '_blank' : '_self' ); ?>">
                            <figure class="avatar avatar-xl bg-gray badge" data-badge="<?= $comment->cnt ?>"
                                    data-initial="<?= $alt; ?>">
                                <img src="<?= $avatar; ?>" alt="<?= $alt; ?>" no-view/>
                            </figure>
                            <span class="d-block text-ellipsis mt-1"><?= $comment->comment_author ?></span>
                        </a>
                    </div>
                </li>
			<?php endforeach; ?>
        </ul>
    </article>
<?php
if ( comments_open() || get_comments_number() ) :
	comments_template();
endif;
get_footer();
?>