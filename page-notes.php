<?php
/*
Template Name: 笔记
*/
get_header(); ?>
    <div id="notes"></div>
    <script>
        (() => {
            const $config = {
                // 登录状态
                logged: <?= json_encode( is_user_logged_in() ) ?>,
                permalink: <?= json_encode( get_permalink() ) ?>,
                // 时间格式化
                lately: <?= json_encode( get_theme_mod( 'biji_setting_lately', true ) ) ?>,
                editor: {
                    placeholder: '在想什么，记下来吧？',
                    features: ['topic', 'emoji', 'ul', 'ol', 'bold', 'italic', 'image']
                },
                search: { type: 'all', topics: '', },
                tabs: [{ name: '全部', id: 'all' }, { name: '笔记', id: 'note' }, { name: '文章', id: 'post' }],
                paging: { page: 1, rows: 10, total: 0 },
                // 评论配置
                comment: {
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

            $h.tasks.notes = () => $h.store.notes = new Vue({
                el: '#notes',
                components: {
                    HeatMap: $modules.HeatMap,
                    TopicList: $modules.TopicList,
                    NoteCard: $modules.NoteCard,
                    Editor: $modules.Editor
                },
                template: `
                    <div id="notes" class="d-flex">
                        <main class="notes-core">
                            <editor v-if="logged" class="mb-2" ref="editor" @submit="submitNote" v-bind="editor">
                                <a slot="send-l" href="javascript:void(0);" class="btn-private btn btn-link btn-action btn-sm flex-center mr-2"
                                    :class="{ active: private }" @click="private = !private">
                                    <i class="dashicons dashicons-privacy"></i>
                                </a>
                            </editor>

                            <div class="notes-tabbar sticky">
                                <ul class="tab">
                                    <li v-for="item in superTabs" :key="item.id" @click="handleTabs(item)" :class="['tab-item', { active: search.type === item.id }]">
                                        <a href="javascript: void(0);">{{ item.name }}</a>
                                    </li>
                                    <div v-if="loading" class="loading"></div>
                                    <span v-else-if="search.topics" class="chip text-primary">
                                        {{ search.topics }}
                                        <a href="javascript: void(0);" class="btn btn-clear" @click="handleTopic('')" aria-label="Close" role="button"></a>
                                    </span>
                                </ul>
                            </div>
                            <div class="notes-list" :style="{opacity:loading?0.5:1}">
                                <note-card v-for="(note, index) in noteList" :key="note.id" v-bind="{ logged, lately, note }" @event="data => handleNoteCard(data, note, index)" @topic="handleTopic" />
                                <div v-if="paging.total && !loading && theEnd" class="text-center" style="opacity: 0.5;">没有更多了</div>
                            </div>
                        </main>
                        <aside class="notes-aside">
                            <section class="sticky">
                                <heat-map />
                                <topic-list :active="search.topics" @topic="handleTopic" />
                            </section>
                        </aside>
                    </div>
                `,
                data() {
                    return {
                        loading: false,// 加载状态
                        private: false,// 私密笔记
                        form: {
                            content: "",
                            status: "publish", // 发布状态
                            comment_status: "open", // 允许评论
                            ping_status: "open", // 允许ping
                        },
                        noteList: [],
                        ...$config
                    };
                },
                computed: {
                    superTabs() {
                        const tabs = [];
                        if ( this.logged ) {
                            tabs.push(...[{ name: '回顾', id: 'review' }, { name: '私密', id: 'private' }]);
                        }
                        return [...$config.tabs, ...tabs];
                    },
                    theEnd() {
                        return this.noteList.length >= this.paging.total;
                    },
                },
                watch: {
                    private(val) {
                        this.form.status = val ? 'private' : 'publish';
                        this.$toast({
                            type: (this.private ? 'primary' : ''),
                            message: '私密笔记已' + (this.private ? '开启' : '关闭')
                        });
                    },
                    'search.type': function (val) {
                        this.reset();
                        this.getNoteList(false);
                    }
                },
                created() {
                    this.getNoteList(false);
                },
                methods: {
                    reset() {
                        this.search.topics = '';
                        this.paging.page = 1;
                    },
                    handleTopic(topic) {
                        this.reset();
                        this.search.topics = topic;
                        this.getNoteList(false);
                    },
                    handleNoteCard({ event }, note, index) {
                        switch (event) {
                            case 'quote':
                                $h.scrollTo({
                                    callback: () => {
                                        this.$refs.editor.insertText(['', note.type, note.id].join('/'));
                                    }
                                });
                                break;
                            case 'edit':
                                // 编辑
                                break;
                            case 'delete':
                                this.noteList.splice(index, 1);
                                break;
                        }
                    },
                    handleTabs(item) {
                        this.search.type = item.id;
                        // 滚动到顶部
                        $h.scrollTo();
                    },
                    // 加载下一页
                    handleNextPage() {
                        // 加载完毕、每日回顾不需要加载下一页
                        if ( this.loading || this.theEnd || this.search.type === 'review' ) return;
                        this.paging.page++;
                        this.getNoteList();
                    },
                    getNoteList(append = true) {
                        if ( this.loading ) return;
                        this.loading = true;
                        $h.ajax({
                            query: { action: 'get_all_posts', ...this.search, ...this.paging, },
                        })
                        .then(({ data, total }) => {
                            if ( append ) this.noteList.push(...data);
                            else this.noteList = data;
                            this.paging.total = total;
                        })
                        .finally(() => {
                            this.loading = false;
                        });
                    },
                    submitNote({ content, images }) {
                        // 从content提取topic：#topic1 #topic2 ...
                        const topics = (content.match(/#([^#|^<]+)/g) || []).map(item => item.replace('#', '')).filter(item => !!item);
                        const fields = [];
                        if ( (images || []).length ) {
                            fields.push({ name: 'images', value: images.map(item => item.id).join(',') });
                        }
                        this.$refs.editor.setLoading(true);
                        $h.rest('wp/v2/notes', {
                            method: 'POST',
                            query: { _locale: 'user' },
                            data: { ...this.form, content, topics, fields },
                        })
                        .then(() => {
                            this.$refs.editor.clear();
                            this.reset();
                            if ( ['all', 'note'].includes(this.search.type) || (this.private && this.search.type === 'private') ) {
                                this.getNoteList(false);
                            }
                        })
                        .finally(() => {
                            this.$refs.editor.setLoading(false);
                        });
                    }
                },
            });
        })();
    </script>
<?php get_footer(); ?>