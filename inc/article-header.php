<header class="article-header">
    <h1 itemprop="headline" class="article-title h2 mb-2"><?php the_title(); ?></h1>
    <ul class="article-info d-flex text-gray reset-ul m-0">
		<?php if ( get_the_author_meta( 'display_name' ) ) : ?>
            <li>
                <i class="czs-forum"></i>
                <span><?php the_author_meta( 'display_name' ); ?></span>
            </li>
		<?php endif; ?>
        <li>
            <i class="czs-time"></i>
            <time datetime="<?php the_time( 'c' ); ?>" itemprop="datePublished"
                  pubdate><?php the_time( 'Y-m-d' ); ?></time>
        </li>
        <li class="c-hand" onclick="onPraise()">
            <i class="czs-heart"></i>
            <span class="praise-<?php the_ID(); ?>"><?= get_praise() ?></span>
        </li>
    </ul>
    <div class="divider"></div>

    <meta itemprop="author" content="<?php the_author_meta( 'display_name' ); ?>">
    <meta itemprop="publisher" content="<?php bloginfo( 'name' ); ?>">
    <meta itemprop="dateModified" content="<?php the_modified_time( 'c' ); ?>">
    <?php if($thumbnail = get_thumbnail()):?>
        <meta itemprop="image" content="<?=$thumbnail?>">
    <?php endif; ?>
</header>
<script>
    function onPraise() {
        if ( $h.store.comments && $h.store.comments.$refs.affiliate ) {
            $h.store.comments.$refs.affiliate.handlePraise();
        } else {
            $modules.actions.setPraise(<?php the_ID(); ?>);
        }
    }
</script>