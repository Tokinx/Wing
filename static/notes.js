!(() => {
    $config = window.NotesConfig || {};
    // 热力图
    const HeatMap = {
        name: 'heat-map',
        components: {
            // Block
            'heat-map-item': {
                props: {
                    day: String,
                    states: { type: Object, default: () => ({}) },
                },
                template: `
                    <div class="heatmap-map__item tooltip" :data-tooltip="tooltip">
                        <div v-if="states" class="heatmap-map__item-block">
                            <div v-for="(key, index) in Object.keys(states)" :key="index" :class="['heatmap-map__item-inner', key, { active: states[key] }]">
                            </div>
                        </div>
                    </div>
                `,
                computed: {
                    tooltip() {
                        return `${this.day}\n${Object.keys(this.states).map(key => `${key}: ${this.states[key]}`).join('\n')}`;
                    }
                },
            },
        },
        template: `
            <div class="heatmap">
                <div class="heatmap-mvp d-flex">
                    <div class="heatmap-mvp__item">
                        <h5>{{heatmap.days}}</h5>
                        <span>DAYS</span>
                    </div>
                    <div class="heatmap-mvp__item">
                        <h5>{{heatmap.notes}}</h5>
                        <span>NOTES</span>
                    </div>
                    <div class="heatmap-mvp__item">
                        <h5>{{heatmap.posts}}</h5>
                        <span>POSTS</span>
                    </div>
                </div>
                <div class="heatmap-map d-flex">
                    <heat-map-item v-for="(item,index) in calendar" :key="index" v-bind="item"/>
                </div>
            </div>
        `,
        data() {
            return {
                loading: false,
                heatmap: { calendar: [...Array(60)], days: '-', notes: '-', posts: '-' }
            }
        },
        computed: {
            calendar() {
                const { calendar } = this.heatmap;
                return Object.keys(calendar).map(day => ({ day, states: calendar[day] }));
            }
        },
        created() {
            this.getHeatmap();
        },
        methods: {
            getHeatmap() {
                this.loading = true;
                $h.ajax({
                    query: { action: 'get_heatmap' }
                })
                .then(({ data }) => {
                    this.heatmap = data;
                })
                .finally(() => {
                    this.loading = false;
                });
            },
        }
    };

    // 话题列表
    const TopicList = {
        name: 'topic-list',
        template: `
            <ul class="topic-list menu">
                <li v-for="topic in topics" :key="topic.id" class="menu-item" @click="handleTopic(topic)">
                    <a href="javascript:void(0);" :class="{ active: active ===topic.name }">{{ topic.name }}</a>
                    <div class="menu-badge">
                        <label class="label text-tiny">{{ topic.count }}</label>
                    </div>
                </li>
            </ul>
        `,
        props: {
            active: String,
        },
        data() {
            return {
                loading: false,
                topics: [],
            }
        },
        created() {
            this.getTopics();
        },
        methods: {
            getTopics() {
                this.loading = true;
                $h.ajax({
                    query: { action: 'get_topics' }
                })
                .then(({ data }) => {
                    this.topics = data;
                }).finally(() => {
                    this.loading = false;
                });
            },
            handleTopic(topic) {
                this.$emit('topic', topic.name);
            },
        }
    };

    // 笔记卡片
    const NoteCard = {
        name: 'note-card',
        template: `
            <div class="notes-item card">
                <div class="tile card-body d-block">
                    <div class="tile-header flex-center justify-between">
                        <div class="text-gray text-tiny w-100 d-flex align-center">
                            <h3 v-if="isPost" class="text-dark h5 mt-2 mb-0">
                                <a :href="note.permalink">{{ note.title }}</a>
                            </h3>
                            <time v-else>{{ note_date }}</time>
                        </div>

                        <div v-if="logged && !isPost" class="dropdown">
                            <a href="javascript:void(0);" class="btn btn-link btn-action btn-sm flex-center dropdown-toggle">
                                <i class="dashicons dashicons-ellipsis"></i>
                            </a>
                            <ul class="menu" style="left: unset;right: 0;">
                                <div v-if="loading" class="loading loading-full"></div>
                                <li class="menu-item">
                                    <a v-for="item in menu" :key="item.id" href="javascript:void(0);" @click="debounceMenuClick(item)"
                                        class="align-center" style="display: flex;">
                                        <i v-if="item.icon" :class="[item.icon, 'mr-1']"></i> {{ item.name }}
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="tile-content p-0">
                        <div :class="['flex-wrap', { 'd-flex': !isPost }]">
                            <img v-if="note.thumbnail" class="thumbnail s-rounded" :src="note.thumbnail" alt=""/>
                            <div :class="['article-content', { 'w-100': isPost }]" v-html="superContent" @click="handleDelegate"></div>
                        </div>
                        <div v-if="note.images" class="notes-item-images flex-center justify-start mt-2 w-100">
                            <div class="notes-item-images__item mx-1" v-for="(url, index) in note.images" :key="url">
                                <img class="s-rounded" :src="url" alt @click="handleViewImage(url)"/>
                            </div>
                        </div>
                    </div>
                    <div class="tile-footer text-gray text-tiny flex-center justify-between">
                        <div class="flex-center">
                            <button v-if="category" class="btn btn-link btn-sm text-gray d-flex align-center">
                                <i class="czs-read mr-1"></i> {{ category }}
                            </button>
                            <button class="btn btn-link btn-sm text-gray d-flex align-center">
                                <i class="czs-talk mr-1"></i> {{ note.comment_count }}
                            </button>
                        </div>

                        <time v-if="isPost">{{ note_date }}</time>
                        <span v-else class="flex-center">
                            <i class="dashicons dashicons-laptop mr-1"></i> Write from Webpage
                        </span>
                    </div>
                </div>
            </div>
        `,
        props: {
            logged: { type: Boolean, default: false },
            lately: { type: Boolean, default: true },
            note: { type: Object, default: () => ({}) }
        },
        data() {
            return {
                loading: false,
                menu: [
                    {
                        id: 'quote',
                        icon: 'dashicons dashicons-format-quote',
                        name: '引用',
                    },
                    {
                        id: 'edit',
                        icon: 'dashicons dashicons-edit',
                        name: '编辑',
                    },
                    {
                        id: 'trash',
                        icon: 'dashicons dashicons-trash',
                        name: '删除',
                    }
                ],
            }
        },
        computed: {
            isPost() {
                return this.note.type === 'post';
            },
            superContent() {
                let content = this.note.content;
                if ( !content ) return '';
                if ( this.isPost ) return content;
                // 高亮话题 #话题1 话题2
                (content.match(/#([^#|^<]+)/g) || []).forEach(topic => {
                    content = content.replace(topic, `<span class="chip c-hand text-primary" data-topic="${topic}">${topic}</span>`);
                });

                // 高亮引用 /note/5841
                (content.match(/(\/note\/\d+)/g) || []).forEach(quote => {
                    const id = quote.replace('/note/', '');
                    content = content.replace(quote, `<a href="javascript:void(0);" class="text-primary" data-quote="${id}">${quote}</a>`);
                });

                // url转link
                let url_regex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z\d][a-zA-Z\d-]+[a-zA-Z\d]\.[^\s|^<]{2,}|www\.[a-zA-Z\d][a-zA-Z\d-]+[a-zA-Z\d]\.[^\s|^<]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z\d]+\.[^\s|^<]{2,}|www\.[a-zA-Z\d]+\.[^\s|^<]{2,})/g;
                let url_match = content.match(url_regex);
                if ( url_match ) {
                    url_match.forEach(url => {
                        content = content.replace(url, `<a href="${url}" target="_blank" class="chip text-primary" style="text-decoration: none;"><i class="dashicons dashicons-external"></i> Link</a>`);
                    });
                }

                return content;
            },
            category() {
                return (this.note.category || []).map(({ name }) => name).join(', ');
            },
            note_date() {
                if( !this.note.date ) return '';
                if ( this.lately ) {
                    return Lately && Lately.format(this.note.date);
                }
                return dayjs && dayjs(this.note.date).format('YYYY-MM-DD HH:mm:ss');
            },
            // 防抖
            debounceMenuClick() {
                return $h.debounce(this.handleMenuClick, 500);
            },
        },
        methods: {
            handleDelegate(e) {
                const { dataset } = e.target;
                if ( dataset && dataset.topic ) {
                    this.$emit('topic', dataset.topic.replace('#', ''));
                }
                if ( dataset && dataset.quote ) {
                    QuoteDialog(dataset.quote, this.lately);
                }
            },
            handleMenuClick(item) {
                // 防抖
                if ( this.loading ) return;
                const { id, type } = this.note;
                switch (item.id) {
                    case 'quote':
                        this.$emit('event', { event: item.id });
                        break;
                    case 'edit':
                        this.$emit('event', { event: item.id });
                        break;
                    case 'trash':
                        this.loading = true;
                        $h.rest(`wp/v2/${type}s/${id}`, {
                            method: 'DELETE',
                            query: { force: true },
                        })
                        .then(({ code, message }) => {
                            if ( !!code ) {
                                this.$toast({ type: 'error', message });
                            } else {
                                this.$toast({ type: 'success', message: '删除成功' });
                                this.$emit('event', { event: item.id });
                            }
                        }).finally(() => {
                            this.loading = false;
                        })
                        break;
                }
            },
            handleViewImage(url) {
                window.ViewImage && ViewImage.view(this.note.images, url);
            }
        }
    };

    // 显示引用卡片
    const QuoteDialog = (note_id, lately) => {
        const Dialog = Vue.extend({
            template: `
                <div class="modal active quote-dialog">
                    <a href="javascript:void(0);" class="modal-overlay" @click="$el.remove()"></a>
                    <div class="modal-container p-0">
                        <div v-if="loading" class="loading loading-full"></div>
                        <a href="javascript:void(0);" class="btn btn-clear m-0" @click="$el.remove()"></a>
                        ${NoteCard.template}
                    </div>
                </div>
            `,
            mixins: [NoteCard],
            data() {
                return { loading: false, lately, note: null }
            },
            created() {
                this.getNote();
            },
            methods: {
                getNote() {
                    this.loading = true;
                    $h.ajax({ query: { action: 'get_all_posts', type: 'single', ids: note_id, page: 1, rows: 1 } })
                    .then(({ data }) => {
                        if ( data && data.length ) {
                            this.note = data[0];
                        } else {
                            this.$el.remove();
                            this.$toast({ type: 'warning', message: '无法找到该引用' });
                        }
                    }).finally(() => {
                        this.loading = false;
                    });
                },
            }
        });
        const vm = new Dialog({ el: document.createElement('div') });
        document.querySelector('#notes').appendChild(vm.$el);
    }

    $h.tasks.notes = () => $h.store.notes = new Vue({
        el: '#notes',
        components: { HeatMap, TopicList, NoteCard, Editor: $modules.Editor },
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
                logged: false,// 登录状态
                lately: true, // 格式化时间
                loading: false,// 加载状态
                private: false,// 私密笔记
                form: {
                    content: "",
                    status: "publish", // 发布状态
                    comment_status: "open", // 允许评论
                    ping_status: "open", // 允许ping
                },
                noteList: [],
                editor: {
                    placeholder: '在想什么，记下来吧？',
                    features: ['topic', 'emoji', 'ul', 'ol', 'bold', 'italic', 'image'], // 编辑器功能
                },
                search: {
                    type: 'all', // 类型
                    topics: '', // 话题
                },
                paging: { page: 1, rows: 10, total: 0 },
                ...$config
            };
        },
        computed: {
            superTabs() {
                const tabs = [];
                if ( this.logged ) {
                    tabs.push(...[
                        { name: '回顾', id: 'review' },
                        { name: '私密', id: 'private' }
                    ]);
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
                this.$toast({ type: (this.private ? 'primary' : ''), message: '私密笔记已' + (this.private ? '开启' : '关闭') });
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
                    case 'trash':
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