<header class="article-header">
    <h1 itemprop="name headline" class="article-title h2 mb-2"><?php the_title(); ?></h1>
    <ul class="article-info d-flex text-gray reset-ul m-0">
        <li>
            <i class="czs-forum"></i>
            <span><?php the_author_meta( 'display_name' ); ?></span>
        </li>
        <li>
            <i class="czs-time"></i>
            <time datetime="<?php the_time( 'c' ); ?>" itemprop="datePublished"
                  pubdate><?php the_time( 'Y-m-d' ); ?></time>
        </li>
		<?php if ( get_praise() ) : ?>
            <li>
                <i class="czs-heart"></i>
                <span id="Praise"><?= get_praise() ?></span>
            </li>
		<?php endif; ?>
    </ul>
    <div class="divider"></div>
</header>