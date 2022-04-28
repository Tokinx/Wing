const $modules = new function () {
    const that = this;
    // 作者卡片
    this.Affiliate = {
        name: 'affiliate',
        template: `
            <section class="affiliate">
                <div v-if="author_information && author" class="card">
                    <div class="tile tile-centered">
                        <div class="tile-icon">
                            <figure class="avatar avatar-xl" :data-initial="initial">
                                <img :src="author.avatar" :alt="author.display_name" />
                                <div class="avatar-icon s-circle">
                                    <button class="btn btn-warning btn-sm s-circle flex-center tooltip" data-tooltip="BLOGGER">
                                        <i class="czs-crown"></i>
                                    </button>
                                </div>
                            </figure>
                        </div>
                        <div class="tile-content my-2">
                            <div class="tile-title text-ellipsis">{{ author.display_name }}</div>
                            <small class="text-gray d-block">{{ author.description }}</small>
                        </div>
                        
                        <div class="tile-action flex-center">
                            <button class="btn btn-action btn-link text-gray flex-center mx-1" @click="handlePraise" :class="{ 'text-error': praise }">
                                <i :class="'czs-heart' + (praise ? '' : '-l')"></i>
                            </button>
                            <div class="popover popover-top mx-1">
                                <button class="btn btn-action btn-link text-gray flex-center">
                                    <i class="czs-qrcode-l"></i>
                                </button>
                                <div class="popover-container" style="width: 100px;">
                                    <div ref="qr" class="card uni-shadow qr-image p-2"></div>
                                </div>
                            </div>
                            <button v-if="settings" @click="handleLinkSettings" class="btn btn-action btn-link text-gray flex-center uni-bg ml-2">
                                <i class="czs-setting-l"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <ul v-if="adjacent_articles && adjacent" class="pagination">
                    <li v-for="key of Object.keys(adjacent)" :key="key" :class="'page-item w-0 page-' + key">
                        <a :href="adjacent[key].permalink || 'javascript: void(0);'" class="w-100 text-gray">
                            <div class="page-item-subtitle text-capitalize">{{ key }}</div>
                            <div class="page-item-title h6 text-ellipsis">
                                {{ adjacent[key].title || 'No more' }}
                            </div>
                        </a>
                    </li>
                </ul>
            </section>
        `,
        props: {
            post_id: { type: [Number, String], required: true },
            author: { type: Object, default: () => ({}) },
            author_information: Boolean,
            adjacent_articles: Boolean,
        },
        data() {
            return {
                affiliateInfo: {},
                praise: !!Cookies.get(`praise_${this.post_id}`)
            }
        },
        computed: {
            adjacent() {
                return this.affiliateInfo.adjacent;
            },
            initial() {
                return this.author.display_name ? this.author.display_name.charAt(0) : 'A';
            },
            settings() {
                return document.querySelector('#Links')
            }
        },
        created() {
            this.getAffiliateInfo();
            this.$nextTick(() => {
                new QRCode(this.$refs.qr, { text: location.href, correctLevel: QRCode.CorrectLevel.L });
            });
        },
        methods: {
            // 获取关联信息
            getAffiliateInfo() {
                $h.ajax({ query: { action: 'get_affiliate_info', post_id: this.post_id } }).then(({ data }) => {
                    this.affiliateInfo = data;
                });
            },
            handlePraise() {
                $modules.actions.submit_praise(this.post_id).then(num => {
                    const el = document.querySelector("#Praise");
                    if ( parseInt(num) > parseInt(el.innerText) ) this.$toast({ type: 'success', message: '祝你财源广进' });
                    el && (el.innerHTML = num);
                    this.praise = !!Cookies.get(`praise_${this.post_id}`);
                });
            },
            handleLinkSettings() {
                $modules.LinkSettingDialog(this.post_id);
            },
        }
    };
    // 富文本编辑器
    this.Editor = {
        name: 'editor',
        components: {
            'tools': {
                name: 'tools',
                template: `
                    <button v-if="name === 'topic'" class="btn btn-link btn-action btn-sm flex-center">
                        #
                    </button>
                    <div v-else-if="name === 'emoji'" class="popover popover-bottom">
                        <button class="btn btn-link btn-action btn-sm flex-center">
                            <i class="dashicons dashicons-smiley"></i>
                        </button>
                        <div class="editor-tool-emoji popover-container">
                            <div class="card uni-card bg-white">
                                <div class="card-body flex-center" style="flex-wrap: wrap">
                                    <button v-for="emoji in emojis" :key="emoji" class="btn btn-link btn-action flex-center" @click="$emit('emoji', emoji)">{{ emoji }}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button v-else-if="name === 'ul'" class="btn btn-link btn-action btn-sm flex-center">
                        <i class="dashicons dashicons-editor-ul"></i>
                    </button>
                    <button v-else-if="name === 'ol'" class="btn btn-link btn-action btn-sm flex-center">
                        <i class="dashicons dashicons-editor-ol"></i>
                    </button>
                    <button v-else-if="name === 'bold'" class="btn btn-link btn-action btn-sm flex-center">
                        <i class="dashicons dashicons-editor-bold"></i>
                    </button>
                    <button v-else-if="name === 'italic'" class="btn btn-link btn-action btn-sm flex-center">
                        <i class="dashicons dashicons-editor-italic"></i>
                    </button>
                    <button v-else-if="name === 'image'" class="btn btn-link btn-action btn-sm flex-center">
                        <i class="dashicons dashicons-format-gallery"></i>
                    </button>
                `,
                props: { name: String },
                data() {
                    return {
                        emojis: ['🥳', '😀', '😂', '😉', '😘', '😍', '🤪', '😓', '🙁', '😕', '😳', '😱', '😧', '😡', '👨🏻‍💻', '🙅🏻‍♂️', '🎉', '👏', '🎁', '🚀', '🌈'],
                        images: [],
                    }
                },
            },
        },
        template: `
            <div class="editor-box d-flex">
                <div class="editor">
                    <div v-if="loading" class="loading loading-full"></div>
                    <div
                        :ref="refName"
                        contenteditable
                        class="editor-content article-content"
                        :class="{ 'is-empty': !content }"
                        v-bind="{ placeholder }"
                        @input="onInput"
                        @paste="onPaste"
                        @keydown="onKeydown"
                    >
                        <p><br></p>
                    </div>
                    
                    <input ref="upload" class="d-none" type="file" accept="image/*" multiple @change="handleUpload" />
                    <div v-if="images.length" class="editor-preview m-2">
                        <div class="editor-preview-box flex-center">
                            <div v-for="(image, index) in images" :key="image.id" class="editor-preview__item d-flex">
                                <img :src="image.source_url" class="s-rounded mr-2" />
                                <a href="javascript:void(0);" class="editor-preview__item-remove btn btn-clear bg-error m-0" @click="handleRemoveImage(index)"></a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="editor-footer flex-center justify-between">
                        <div class="editor-tool d-flex">
                            <slot name="tool">
                                <slot name="tool-l"></slot>
                                <tools v-for="name in features" :key="name" :name="name" :class="{ loading: name === 'image' && uploading }" @click.native="handleTools(name)" @emoji="insertText" />
                                <slot name="tool-r"></slot>
                            </slot>
                        </div>
                        <div class="flex-center">
                            <slot name="send">
                                <slot name="send-l"></slot>
                                <button class="btn btn-primary btn-sm flex-center" @click="submit">
                                    <i class="dashicons dashicons-edit-page mr-1"></i> {{ sendText }}
                                </button>
                                <slot name="send-r"></slot>
                            </slot>
                        </div>
                    </div>
                </div>
            </div>
        `,
        props: {
            placeholder: { type: String, default: '在想什么，记下来吧？' },
            sendText: { type: String, default: '发送' },
            features: { type: Array, default: ['emoji'] }
        },
        data() {
            return {
                refName: `editor-${Date.now()}`,
                loading: false,
                uploading: false,
                content: '',
                images: [],
            }
        },
        computed: {
            editor() {
                return this.$refs[this.refName];
            },
        },
        methods: {
            submit() {
                this.$emit('submit', {
                    content: this.content,
                    images: this.images
                });
            },
            setLoading(loading) {
                this.loading = loading;
            },
            clear() {
                this.editor.innerHTML = `<p><br></p>`;
                this.content = '';
                this.images = [];
            },
            handleTools(name) {
                switch (name) {
                    case 'topic':
                        this.insertText('#');
                        break;
                    case 'ul':
                        this.execCommand('insertUnorderedList');
                        break;
                    case 'ol':
                        this.execCommand('insertOrderedList');
                        break;
                    case 'bold':
                        this.execCommand('bold');
                        break;
                    case 'italic':
                        this.execCommand('italic');
                        break;
                    // case 'emoji':
                    //   this.$refs.emoji.show();
                    //   break;
                    case 'image':
                        // this.$toast({ message: 'coming soon' });
                        this.$refs.upload.click();
                        break;
                }
            },
            handleUpload(e) {
                const { files } = (e.target || {});
                const len = { flag: 0, count: files.length };
                this.uploading = true;
                Array.from(files).forEach(file => {
                    const formData = new FormData();
                    formData.append("file", file);
                    $h.rest('wp/v2/media', {
                        method: 'POST',
                        headers: {
                            'Content-Type': null,
                            'Content-Disposition': `attachment; filename=${file.name}`
                        },
                        body: formData,
                    }).then(({ id, source_url, mime_type }) => {
                        this.images.push({ id, source_url, mime_type });
                    }).finally(() => {
                        if ( ++len.flag === len.count ) {
                            this.uploading = false;
                        }
                    });
                });
                e.target.value = ""; // 清空input
            },
            handleRemoveImage(index) {
                const { id } = this.images[index];
                $h.rest(`wp/v2/media/${id}`, {
                    method: 'DELETE',
                    query: { force: true }
                });
                this.images.splice(index, 1);
            },
            onInput(e) {
                const editor = this.editor;
                // 清除前后空格与空标签
                const value = editor.innerHTML.trim().replace(/style\s*?=\s*?(['"])[\s\S]*?\1/g, '');
                // 移除多余的br标签
                if ( !editor.textContent ) {
                    this.clear();
                } else {
                    this.content = value;
                }
            },
            onPaste(e) {
                e.preventDefault();
                let text = null;

                if ( window.clipboardData && clipboardData.setData ) {
                    // IE
                    text = window.clipboardData.getData('text');
                } else {
                    text = (e.originalEvent || e).clipboardData.getData('text/plain') || prompt('在这里输入文本');
                }
                this.insertText(text);
            },
            // 移除快捷键
            onKeydown(e) {
                // if (e.ctrlKey || e.metaKey) {
                //     switch (e.keyCode) {
                //         case 66: //ctrl+B or ctrl+b
                //         case 98:
                //         case 73: //ctrl+I or ctrl+i
                //         case 105:
                //         case 85: //ctrl+U or ctrl+u
                //         case 117:
                //             e.preventDefault();
                //             break;
                //     }
                // }
            },
            handleFocus() {
                const editor = this.editor;
                // 判断当前是否有焦点
                if ( document.activeElement !== editor ) {
                    editor.focus();
                }
            },
            // 插入文字
            insertText(text) {
                this.handleFocus();
                if ( document.body.createTextRange ) {
                    if ( document.selection ) {
                        textRange = document.selection.createRange();
                    } else if ( window.getSelection ) {
                        sel = window.getSelection();
                        const range = sel.getRangeAt(0);

                        // 创建临时元素，使得TextRange可以移动到正确的位置
                        const tempEl = document.createElement("span");
                        tempEl.innerHTML = "&#FEFF;";
                        range.deleteContents();
                        range.insertNode(tempEl);
                        textRange = document.body.createTextRange();
                        textRange.moveToElementText(tempEl);
                        tempEl.parentNode.removeChild(tempEl);
                    }
                    textRange.text = text;
                    textRange.collapse(false);
                    textRange.select();
                } else {
                    // Chrome之类浏览器
                    document.execCommand("insertText", false, text);
                }
            },
            // 插入节点
            execCommand(type) {
                this.handleFocus();
                document.execCommand(type, false, null);
            },
        }
    };
    // 评论表单
    this.CommentForm = {
        name: 'comment-form',
        template: `
            <form method="post" action id="comment_form" :class="{ 'small-size': reply.id }" @submit="e => e.preventDefault()">
                <div class="form-group w-100">
                    <div class="d-flex">
                        <figure class="user-avatar s-rounded">
                            <img class="s-rounded" :src="avatar" :alt="form.author" />
                        </figure>
                        <div class="d-flex flex-wrap w-100">
                            <div v-show="!userId" class="user-info flex-center w-100">
                                <input v-for="(item, index) in inputs" :key="item.key" class="form-input" type="text" v-model="form[item.bind.name]" v-bind="item.bind" :disabled="sending" @input="() => item.event && item.event()" />
                            </div>
                            <editor class="w-100" ref="editor" @submit="submit" v-bind="info.editor"></editor>
                        </div>
                    </div>
                </div>
            </form>
        `,
        components: { Editor: that.Editor },
        props: {
            info: {
                type: Object, default: () => ({}),
            },
            reply: {
                type: Object, default: () => ({}),
            },
        },
        data() {
            return {
                sending: false,
                inputs: [
                    { bind: { name: 'author', placeholder: 'Name', required: true } },
                    {
                        bind: { name: 'email', placeholder: 'Email', required: true },
                        // TODO: 从接口回去头像和URL
                        event: $h.debounce(() => this.avatar = $h.avatar(this.form.email, { s: '168' }), 600),
                    },
                    { bind: { name: 'url', placeholder: 'Url' } },
                ],
                avatar: '',
                userId: '',
                form: {
                    comment_post_ID: null, comment_parent: null, author: '', email: '', url: '', comment: '',
                },
            };
        },
        watch: {
            info: {
                deep: true,
                immediate: true,
                handler({ post_id, visitor }) {
                    this.userId = visitor && visitor.user_id;
                    this.avatar = $h.avatar(visitor && visitor.email, { s: '168' });
                    this.form = { ...this.form, ...visitor, comment_post_ID: post_id };
                },
            },
            reply: {
                deep: true,
                immediate: true,
                handler(data) {
                    this.form.comment_parent = data.id;
                },
            },
        },
        methods: {
            submit({ content, images }) {
                if ( !content ) return;
                this.form.comment = content;
                this.sending = true;
                this.$refs.editor.setLoading(true);
                $h.ajax({
                    query: { action: 'submit_comment' },
                    data: this.form,
                    method: 'POST',
                })
                .then(({ data }) => {
                    this.$refs.editor.clear();
                    this.$toast({ type: 'success', message: '提交成功' });
                    this.$emit('append', data);
                }).finally(() => {
                    this.sending = false;
                    this.$refs.editor.setLoading(false);
                });
            },
        },
    };
    // 评论样式
    this.CommentItem = {
        name: 'comment-item',
        template: `
            <li :class="['comment', { 'card uni-card': !(+comment.parent) }]" :id="'comment-' + comment.id">
            <div class="tile text-tiny">
                <div class="tile-icon">
                    <figure class="avatar avatar-lg bg-gray">
                        <img :src="comment.avatar" alt="" />
                        <div v-if="comment.sign === 'friends'" class="avatar-icon s-circle">
                            <button class="btn btn-sm btn-warning comment-sign s-circle flex-center tooltip" :data-tooltip="sign.tooltips" style="height: 100%;width: 100%;font-size: 0.6rem;">
                                <i :class="sign.icon"></i>
                            </button>
                        </div>
                  </figure>
                </div>
                <div class="tile-content w-0">
                    <div class="flex-center justify-between">
                        <div class="tile-title">
                            <component :is="info.hyperlinks && comment.url ? 'a' : 'span'" class="tile-title__name mr-2" :href="comment.url" target="_blank">{{ comment.author }}</component>
                            <time class="tile-title__time">{{ comment.date }}</time>
                        </div>
                        <div class="tile-action">
                            <button class="btn btn-link btn-sm text-tiny flex-center" @click="showReply = true">
                                <i class="czs-comment"></i>
                             </button>
                        </div>
                    </div>
                    <div class="tile-subtitle text-break" v-html="comment.content"></div>
                    
                    <template v-if="showReply">
                        <div class="divider"></div>
                        <div class="text-tiny">
                            <span class="chip m-0">
                                <a :href="'#comment-' + comment.id">@{{ comment.author }}</a>
                                <a href="javascript: void(0);" class="btn btn-clear" @click="showReply = false"></a>
                            </span>
                        </div>
                        <comment-form class="mt-2" :info="info" :reply="comment" @append="appendComment" />
                    </template>
                </div>
              </div>
            <ol v-if="comment.children && comment.children.length" class="children">
                <template v-for="item in comment.children" :key="item.id">
                    <comment-item :info="info" :comment="item" />
                </template>
              </ol>
        </li>
        `,
        components: { 'comment-form': that.CommentForm },
        props: {
            info: {
                type: Object, default: () => ({})
            },
            comment: {
                type: Object, default: () => ({})
            },
        },
        data() {
            return {
                showReply: false,
            };
        },
        computed: {
            sign() {
                return {
                    icon: this.comment.sign === 'admin' ? 'czs-crown' : 'czs-trophy',
                    tooltips: this.comment.sign.toUpperCase(),
                }
            }
        },
        methods: {
            appendComment(data) {
                if ( !this.comment.children ) {
                    this.$set(this.comment, 'children', [data]);
                } else {
                    this.comment.children.push(data);
                }
                this.showReply = false;
            },
        },
    };
    // 评论区
    this.CommentArea = {
        name: 'comments',
        template: `
            <div class="comment-area">
                <affiliate v-if="author_information || adjacent_articles" v-bind="{ post_id, author, author_information, adjacent_articles }" />
                <section id="comments">
                    <comment-form :info="{ post_id, editor, hyperlinks, visitor }" @append="appendComment" />
                    <div v-if="commentList.length" class="divider" style="margin: 1rem 0;"></div>
                    <ol class="comment-list reset-ul" @click="delegateCommentClick">
                        <template v-for="item in commentList" :key="item.id">
                            <comment-item :info="{ post_id, editor, hyperlinks, visitor }" :comment="item" />
                        </template>
                    </ol>
                    <div class="text-center load-next-comments">
                        <button v-if="isNextPage || loading" class="btn btn-link" :class="{ loading }" @click="loadNextComments">
                            {{ !parameter.page ? '加载评论' : '继续加载' }}
                        </button>
                        <span v-else-if="commentList.length">🎉加载完毕</span>
                        <span v-else>🌈快来抢沙发吧~</span>
                    </div>
                </section>
            </div>
        `,
        components: {
            // 评论框
            'comment-form': that.CommentForm,
            // 评论样式
            'comment-item': that.CommentItem,
            // 作者信息
            'affiliate': this.Affiliate
        },
        data() {
            return {
                loading: false,
                commentList: [],
                paging: { page: 0, total: null, filter: [] },

                // 评论区配置
                post_id: null,
                author_information: false,
                adjacent_articles: false,
                editor: { placeholder: 'Comment', features: ['emoji'] },
                hyperlinks: true,
                pagination: { rows: 10, rolling: true, autoload: true },
                visitor: {},
                author: {},
            };
        },
        computed: {
            parameter() {
                return { type: 'comment', post_id: this.post_id, ...this.paging, ...this.pagination }
            },
            elContent() {
                return document.querySelector('.content');
            },
            isNextPage() {
                const { total, page } = this.paging;
                return total === null || page < total;
            },
        },
        mounted() {
            // 自动加载
            if ( this.pagination.autoload ) {
                const { offsetHeight, scrollHeight } = this.elContent;
                scrollHeight <= offsetHeight && this.loadNextComments();
            }
        },
        methods: {
            loadNextComments() {
                if ( this.isNextPage && !this.loading ) {
                    this.paging.page++;
                    this.getCommentList();
                }
            },
            getCommentList() {
                this.loading = true;
                $h.ajax({ query: { action: 'get_next_comments', ...this.parameter } })
                .then(res => {
                    if ( res && res.data ) {
                        res.data.length && this.commentList.push(...res.data);
                        this.paging.total = res.total;
                    }
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            appendComment(data) {
                this.commentList.unshift(data);
                this.paging.filter.push(data.id);
            },
            delegateCommentClick(e) {
                if ( e.target.closest('.comment-reply-link') ) {
                    e.preventDefault();
                }
            },
        },
    };


    // 友情链接设置
    this.LinkSettingDialog = (post_id) => {
        const Dialog = Vue.extend({
            template: `
                <div class="modal modal-lg active modal-links">
                    <a href="javascript: void(0);" class="modal-overlay" @click="hide" aria-label="Close"></a>
                    <div class="modal-container">
                        <div class="modal-header">
                            <a href="javascript: void(0);" class="btn btn-clear text-gray float-right" @click="hide" aria-label="Close"></a>
                            <div class="modal-title h5 text-gray">{{ lang.title }}</div>
                        </div>
                        <form method="post" action>
                            <div class="modal-body article" ref="body">
                                <div v-if="loading" class="loading" style="position: absolute;inset: 0;z-index: 1;"></div>
                                <ul class="columns reset-ul" :style="{ opacity: loading ? 0.3 : 1 }">
                                    <li v-for="(item, index) of links" :key="index" class="column col-4 col-sm-6 p-2">
                                        <button class="btn btn-clear bg-error btn-sm text-white flex-center" @click="handleRemoveLink(index)"></button>
                                        <div class="card uni-card p-2">
                                            <div class="form-group">
                                                <input class="form-input input-sm" v-model="item.name" type="text" placeholder="Name" required />
                                            </div>
                                            <div class="form-group">
                                                <input class="form-input input-sm" v-model="item.url" type="text" placeholder="Link" required />
                                            </div>
                                            <div class="form-group">
                                                <textarea class="form-input input-sm" v-model="item.description" type="text" placeholder="Description" rows="2" required />
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div class="modal-footer">
                                <div class="btn btn-link float-left" @click="handleAddLinks">{{ lang.add }}</div>
                                <button class="btn btn-primary" :disabled="loading" @click="submit">{{ lang.save }}</button>
                            </div>
                        </form>
                    </div>
                </div>
            `,
            data() {
                return {
                    post_id, loading: false, links: [],
                    lang: {
                        title: '友情链接设置',
                        add: '添加链接',
                        save: '全部保存',
                    }
                };
            },
            created() {
                this.getLinks();
            },
            methods: {
                getLinks() {
                    this.loading = true;
                    $h.ajax({
                        query: { action: 'get_post_meta', post_id: this.post_id, key: 'links' },
                    })
                    .then(({ data }) => {
                        this.links = JSON.parse(data);
                    })
                    .finally(() => {
                        this.loading = false;
                    })
                },
                submit(e) {
                    if ( this.links.some(item => (!item.name || !item.url)) ) return;
                    this.loading = true;
                    $h.ajax({
                        query: { action: 'submit_post_meta', 'post_id': this.post_id, 'key': 'links' },
                        data: { content: JSON.stringify(this.links) },
                        method: 'POST',
                    })
                    .then((html) => {
                        this.reRender(html);
                        this.$toast({ type: 'success', message: '保存成功！' });
                        this.hide();
                    }).finally(() => {
                        this.loading = false;
                    });
                    e.preventDefault();
                },
                reRender(html) {
                    document.querySelector("#Links").innerHTML = html;
                },
                handleAddLinks() {
                    this.links.push({});
                    this.$nextTick(() => {
                        const el = this.$refs.body;
                        el.scrollTop = el.scrollHeight;
                    });
                },
                handleRemoveLink(index) {
                    this.links.splice(index, 1);
                },
                hide() {
                    this.$el.remove();
                },
            },
        });

        const vm = new Dialog({ el: document.createElement('div') });
        document.querySelector('#core').appendChild(vm.$el);
    };
    // 喜欢
    this.actions = {
        submit_praise(post_id) {
            return $h.ajax({ query: { action: 'submit_praise', post_id } });
        },
    }
};