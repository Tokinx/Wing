<?php if ( post_password_required() || ! comments_open() ) {
	return;
} ?>

<section id="comments"></section>
<script>
    window.ArticleData = {
        el: '#comments',
        post_id: <?= get_the_ID() ?>,
        author_information: <?= json_encode( get_theme_mod( 'biji_setting_author_information', true ) ); ?>, // 作者信息
        adjacent_articles: <?= json_encode( get_theme_mod( 'biji_setting_adjacent_articles', false ) ); ?>, // 相邻文章
        editor: {
            placeholder: '<?= get_theme_mod( 'biji_setting_placeholder', 'Comment' ); ?>', // 编辑器提示文字
            features: ['emoji', 'bold', 'italic'], // 编辑器功能
        },
        hyperlinks: <?= json_encode( get_theme_mod( 'biji_setting_hyperlinks', true ) ); ?>, // 评论者链接
        pagination: {
            rows: 10, // 每页评论数
            rolling: <?= json_encode( get_theme_mod( 'biji_setting_rolling', true ) ); ?>, // 滚动加载
            autoload: <?= json_encode( get_theme_mod( 'biji_setting_autoload', false ) ); ?>, // 自动加载
        },
        visitor: <?php the_visitor_info(); ?>, // 访客信息
        author: <?php the_author_info(); ?>, // 作者信息
    };
</script>
<script src="<?= get_template_directory_uri() . '/static/comment.js?' . THEME_VERSION ?>"></script>