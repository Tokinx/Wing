<!-- Content -->
<article class="article" itemscope="itemscope" itemtype="http://schema.org/Article">
    <?php
    if ( have_posts() ) :
        while ( have_posts() ) : the_post();
            require_once( "article-header.php" ); ?>
            <div class="article-content" itemprop="articleBody" view-image>
                <?php the_content(); ?>
            </div>
        <?php
        endwhile;
    endif;
    echo get_theme_mod( 'biji_setting_article_foot' ) ?: "";
    ?>
</article>