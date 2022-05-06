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
			<?php foreach ( get_readers_wall() as $comment ) { ?>
                <li class="column col-3 col-sm-4 col-xs-6 p-2">
                    <div class="card uni-card flex-center text-center p-2">
                        <a class="text-gray text-tiny m-2 tooltip"
                           href="<?= ( $comment->comment_author_url ?: 'javascript:void(0);' ) ?>"
                           target="<?= ( $comment->comment_author_url ? '_blank' : '_self' ) ?>"
                           data-tooltip="<?= $comment->comment_author ?> [ <?= $comment->cnt ?> ]">
							<?= get_avatar( $comment->comment_author_email, 160, '', '', [
								"class" => [ 'avatar-xl' ]
							] ); ?>
                            <span class="d-block text-ellipsis mt-1"><?= $comment->comment_author ?></span>
                        </a>
                    </div>
                </li>
			<?php } ?>
        </ul>
    </article>
<?php
if ( comments_open() || get_comments_number() ) :
	comments_template();
endif;
get_footer();
?>