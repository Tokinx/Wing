<?php
/*
Template Name: 笔记
*/
get_header(); ?>
    <div id="notes"></div>
    <script>
        window.NotesConfig = {
            logged: <?= json_encode(is_user_logged_in()) ?>,
            editor: {
                placeholder: '在想什么，记下来吧？',
                features: ['topic', 'emoji', 'ul', 'ol', 'bold', 'italic', 'image']
            },
            search: {
                type: 'all', // 类型
                topics: '', // 话题
            },
            tabs: [
                {
                    name: '全部',
                    id: 'all'
                },
                {
                    name: '笔记',
                    id: 'note'
                },
                {
                    name: '文章',
                    id: 'post'
                }
            ],
            paging: {
                page: 1,
                rows: 10,
                total: 0,
            },
        };
    </script>
    <script src="<?= get_template_directory_uri().'/static/notes.js?'.THEME_VERSION ?>"></script>
<?php get_footer(); ?>