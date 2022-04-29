<?php get_header(); ?>
    <div id="single-note"></div>
    <script>
        !(() => {
              const $config = {
                post_id: <?= get_the_ID() ?>,
                permalink: <?= json_encode( get_permalink() ) ?>,
                lately: <?= json_encode( get_theme_mod( 'biji_setting_lately', true ) ) ?>,
                // 评论配置
                comment: {
                    author_information: <?= json_encode( get_theme_mod( 'biji_setting_author_information', true ) ); ?>,
                    editor: {
                        placeholder: '<?= get_theme_mod( 'biji_setting_placeholder', 'Comment' ); ?>',
                        features: ['emoji', 'bold', 'italic'],
                    },
                    hyperlinks: <?= json_encode( get_theme_mod( 'biji_setting_hyperlinks', true ) ); ?>,
                    pagination: {
                        rows: 10,
                        rolling: <?= json_encode( get_theme_mod( 'biji_setting_rolling', true ) ); ?>,
                        autoload: true,
                    },
                    visitor: <?php the_visitor_info(); ?>,
                    author: <?php the_author_info(); ?>,
                }
            };
            $h.store.config = $config;
            $h.tasks.single_note = () => $h.store.single_note = new Vue({
                el: '#single-note',
                template: `
                    <div id="notes" class="d-flex">
                        <main class="notes-core single-note">
                            <div class="loading" v-if="loading"></div>
                            <note-card v-else v-bind="{ lately, note }" />
                            <comment-area ref="comments" />
                        </main>
                        <aside class="notes-aside">
                            <section class="sticky">
                                <heat-map />
                            </section>
                        </aside>
                    </div>
                `,
                components: {
                    HeatMap: $modules.HeatMap,
                    NoteCard: $modules.NoteCard,
                    'comment-area': {
                        mixins: [$modules.CommentArea],
                        data() {
                            return { post_id: $config.post_id, ...$config.comment };
                        },
                    },
                },
                data() {
                    return { loading: false, note: {}, ...$config };
                },
                created() {
                    this.getSingleNote();
                },
                methods: {
                    getSingleNote() {
                        if ( this.loading ) return;
                        this.loading = true;
                        $h.ajax({
                            query: { action: 'get_all_posts', type: 'single', ids: this.post_id },
                        })
                        .then(({ data }) => {
                            if ( data && data.length > 0 ) {
                                this.note = data[0];
                            } else {
                                // 跳转回首页
                                window.location.href = $base.origin;
                            }
                        })
                        .finally(() => {
                            this.loading = false;
                        });
                    },
                },
            });
        })();
    </script>
<?php get_footer(); ?>