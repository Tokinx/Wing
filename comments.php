<?php if ( post_password_required() || !comments_open() ) {
	return;
} ?>

<section id="comments"></section>
<script>
    window.ArticleData = {
        el: '#comments',
        post_id: <?= get_the_ID() ?>,
        editor: {
            placeholder: '<?= get_theme_mod('biji_setting_placeholder', 'Comment'); ?>',
            features: ['emoji', 'bold', 'italic'],
        },
        hyperlinks: <?= json_encode(get_theme_mod('biji_setting_hyperlinks', true)); ?>, // 评论者链接
        pagination: {
            rows: 10, // 每页评论数
            rolling: <?= json_encode(get_theme_mod('biji_setting_rolling', true)); ?>, // 滚动加载
            autoload: <?= json_encode(get_theme_mod('biji_setting_autoload', false)); ?>, // 自动加载
        },
        visitor: <?php the_visitor_info(); ?>
    };
</script>
<script src="<?= get_template_directory_uri().'/static/comment.js?'.THEME_VERSION ?>"></script>