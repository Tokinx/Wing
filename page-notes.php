<?php
/*
Template Name: 笔记
*/
get_header(); ?>
    <div id="notes"></div>
    <script>
        window.NotesConfig = {
            // 登录状态
            logged: <?= json_encode( is_user_logged_in() ) ?>,
            permalink: <?= json_encode( get_permalink() ) ?>,
            // 时间格式化
            lately: <?= json_encode( get_theme_mod( 'biji_setting_lately', true ) ) ?>,
            editor: {
                placeholder: '在想什么，记下来吧？',
                features: ['topic', 'emoji', 'ul', 'ol', 'bold', 'italic', 'image']
            },
            search: {
                type: 'all', // 类型
                topics: '', // 话题
            },
            // 基础tab
            tabs: [
                { name: '全部', id: 'all' },
                { name: '笔记', id: 'note' },
                { name: '文章', id: 'post' }
            ],
            paging: { page: 1, rows: 10, total: 0 },
            // 评论配置
            comment: {
                author_information: <?= json_encode( get_theme_mod( 'biji_setting_author_information', true ) ); ?>, // 作者信息
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
            }
        };
    </script>
    <script src="<?= get_template_directory_uri() . '/static/notes.js?' . THEME_VERSION ?>"></script>
<?php get_footer(); ?>