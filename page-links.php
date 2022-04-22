<?php
/*
Template Name: 友情链接
*/
get_header();
?>
<section class="article">
    <?php
    if (have_posts()) :
        while (have_posts()) : the_post();
            require_once("inc/article-header.php"); ?>
            <article class="article-content" itemscope itemtype="https://schema.org/Article">
                <ul id="<?= (is_super_admin() ? 'Links' : '') ?>" class="article-cards article-links columns reset-ul">
                    <?php the_friendly_links(); ?>
                </ul>
                <?php the_content(); ?>
            </article>
    <?php
        endwhile;
    endif;
    ?>
</section>
<?php
if (comments_open() || get_comments_number()) :
    comments_template();
endif;
get_footer();
?>