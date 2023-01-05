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
                        <div class="tile-content my-2 p-0">
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
                            <button v-if="settings" @click="handleLinkSettings" class="btn btn-action btn-link text-gray flex-center mx-1">
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
                return !!document.querySelector("#Links");
            }
        },
        created() {
            this.getAffiliateInfo();
        },
        mounted() {
            this.$nextTick(() => {
                new QRCode(this.$refs.qr, { text: location.href, correctLevel: QRCode.CorrectLevel.L });
            });
        },
        methods: {
            // 获取关联信息
            getAffiliateInfo() {
                if ( !this.adjacent_articles ) return;
                $h.ajax({ query: { action: 'get_affiliate_info', post_id: this.post_id } }).then(({ data }) => {
                    this.affiliateInfo = data;
                });
            },
            handlePraise() {
                $modules.actions.setPraise(this.post_id).then((cookie) => {
                    this.praise = cookie;
                });
            },
            handleLinkSettings() {
                if ( !window.LinkSettingDialog ) return;
                window.LinkSettingDialog();
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
                            <div class="card uni-card card uni-card uni-bg uni-shadow bg-blur">
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
                    <button v-else-if="name === 'upload'" class="btn btn-link btn-action btn-sm flex-center">
                        <i class="dashicons dashicons-cloud-upload"></i>
                    </button>
                `,
                props: { name: String },
                data() {
                    return {
                        emojis: ['🥳', '😀', '😂', '😉', '😘', '😍', '🤪', '😓', '🙁', '😕', '😳', '😱', '😧', '😡', '👨🏻‍💻', '🙅🏻‍♂️', '🎉', '👏', '🎁', '🚀', '🌈'],
                    }
                },
            },
            'attachment-chips': {
                name: 'attachment-chips',
                props: ['attachments', 'showClose'],
                template: `
                    <div v-if="(attachments || []).length" class="attachment" style="margin: -0.2rem; margin-top: 1%;">
                        <span v-for="(item, index) in files" :key="item.id" class="chip bg-gray text-gray m-1 tooltip" :data-tooltip="item.filename" style="overflow: unset;">
                            <i class="dashicons dashicons-media-default"></i>
                            <div class="divider-vert px-1"></div>
                            <a :href="item.source_url" target="_blank" style="color: currentColor">{{ item.name }}</a>
                            <template v-if="showClose">
                                <div v-if="item.loading" class="loading ml-1" style="width: 1rem;"></div>
                                <a v-else href="javascript:void(0);" class="btn btn-clear" aria-label="Close" role="button" @click="remove(index)"></a>
                            </template>
                        </span>
                    </div>`,
                computed: {
                    files() {
                        return (this.attachments || []).map(item => {
                            const filename = item.source_url.split('/').pop();
                            return { ...item, filename, name: this.truncation(filename) };
                        });
                    },
                },
                methods: {
                    remove(index) {
                        this.$emit('remove', index);
                    },
                    truncation(str, len = 18) {
                        return str.length > len ? str.slice(0, Math.floor(len / 2)) + '...' + str.slice(-Math.ceil(len / 2)) : str;
                    }
                }
            }
        },
        template: `
            <div class="editor-box d-flex">
                <div class="editor">
                    <div v-if="loading" class="loading loading-full"></div>
                    <div
                        :ref="refName"
                        contenteditable
                        class="editor-content article-content p-2"
                        :class="{ 'is-empty': !content }"
                        v-bind="{ placeholder }"
                        @input="onInput"
                        @paste="onPaste"
                        @keydown="onKeydown"
                    >
                        <p><br></p>
                    </div>
                    
                    <input v-if="features.includes('upload')" ref="upload" class="d-none" type="file" multiple @change="handleUpload" />
                    
                    <attachment-chips v-if="files.length" v-bind="{ attachments: files, showClose: true }" @remove="handleRemoveFile" style="margin: 0" />
                    
                    <div class="editor-footer flex-center justify-between">
                        <div class="editor-tool d-flex">
                            <slot name="tool">
                                <slot name="tool-l"></slot>
                                <tools v-for="name in features" :key="name" :name="name" :disabled="name === 'upload' && uploading" @click.native="e => handleTools(name, e)" @emoji="insertText" />
                                <slot name="tool-r"></slot>
                            </slot>
                        </div>
                        <div class="flex-center">
                            <slot name="send">
                                <slot name="send-l"></slot>
                                <button class="editor-send btn btn-primary btn-sm flex-center" @click="submit" :disabled="uploading">
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
                id: null,
                refName: `editor-${Date.now()}`,
                loading: false,
                uploading: false,
                content: '',
                files: [],
            }
        },
        computed: {
            editor() {
                return this.$refs[this.refName];
            },
        },
        methods: {
            submit() {
                // this.content 去除html标签和空格
                const content = this.content.replace(/<[^>]+>/g, '').replace(/\s+/g, '');
                if ( content.length ) {
                    this.$emit('submit', { content: this.content, files: this.files, id: this.id });
                } else {
                    this.$toast({ message: '内容不能为空' });
                }
            },
            setLoading(loading) {
                this.loading = loading;
            },
            clearText() {
                this.editor.innerHTML = `<p><br></p>`;
                this.content = '';
            },
            clear() {
                this.clearText();
                this.files = [];
            },
            handleTools(name, e) {
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
                    case 'upload':
                        this.$refs.upload.click();
                        break;
                }
                e.stopPropagation();
                e.preventDefault();
            },
            handleUpload(e) {
                const { files } = (e.target || {});
                const len = { flag: 0, count: files.length };
                this.uploading = true;
                Array.from(files).forEach(file => {
                    const formData = new FormData();
                    formData.append("file", file);
                    file.id = Math.random().toString(32).substring(2);
                    this.files.push({ id: file.id, source_url: file.name, loading: true });
                    $h.rest('wp/v2/media', {
                        method: 'POST',
                        headers: {
                            'Content-Type': null,
                            'Content-Disposition': `attachment; filename=${encodeURI(file.name)}`
                        },
                        body: formData,
                    }).then(({ id, guid, mime_type }) => {
                        const name = guid.raw.split('/').pop();
                        // 根据id替换
                        this.files = this.files.map(item => {
                            if ( item.id === file.id ) {
                                item = { id, source_url: guid.raw, mime_type, loading: false };
                            }
                            return item;
                        });
                    }).finally(() => {
                        if ( ++len.flag === len.count ) {
                            this.uploading = false;
                        }
                    });
                });
                e.target.value = ""; // 清空input
            },
            handleRemoveFile(index) {
                const { id } = this.files[index];
                $h.rest(`wp/v2/media/${id}`, {
                    method: 'DELETE',
                    query: { force: true }
                });
                this.files.splice(index, 1);
            },
            onInput(e) {
                const editor = this.editor;
                // 清除前后空格与空标签
                const value = editor.innerHTML.trim().replace(/style\s*?=\s*?(['"])[\s\S]*?\1/g, '');
                // 移除多余的br标签
                if ( !editor.innerHTML || ['<p><br></p>', '<p><div><br></div></p>'].includes(editor.innerHTML) ) {
                    this.clearText();
                } else {
                    this.content = value;
                }
            },
            // 粘贴
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
            // 聚焦
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
                    let textRange = "";
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
                document.execCommand(type);
            },
        }
    };
    // 评论表单
    this.CommentForm = {
        name: 'comment-form',
        template: `
            <form method="post" action id="comment_form" :class="{ 'small-size': reply.id }" @submit="e => e.preventDefault()">
                <div class="form-group w-100">
                    <div v-show="!userId" slot="content-top" class="user-info flex-center w-100">
                        <input v-for="(item, index) in inputs" :key="item.key" class="form-input" type="text" v-model="form[item.bind.name]" v-bind="item.bind" :disabled="sending" @input="() => item.event && item.event()" />
                    </div>
                    <div class="d-flex">
                        <figure class="user-avatar s-rounded">
                            <img class="s-rounded" :src="avatar" :alt="form.author" />
                        </figure>
                        <div class="d-flex flex-wrap w-100">
                            <editor class="w-100" ref="editor" @submit="submit" v-bind="info.editor" />
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
                    {
                        bind: { name: 'email', placeholder: 'Email', required: true },
                        event: $h.debounce(() => {
                            $h.visitor(this.form.email, ({ author, avatar, url }) => {
                                this.avatar = avatar;
                                this.form.author = author || '';
                                this.form.url = url || '';
                            });
                        }, 600),
                    },
                    { bind: { name: 'author', placeholder: 'Name', required: true } },
                    { bind: { name: 'url', placeholder: 'Url' } },
                ],
                avatar: 'data:image/gif;base64,R0lGODdhAQABAPAAAMPDwwAAACwAAAAAAQABAAACAkQBADs=',
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
                    this.userId = visitor.user_id;
                    if ( visitor.email !== this.form.email ) {
                        $h.visitor(visitor.email, ({ avatar }) => {
                            this.avatar = avatar;
                        });
                    }
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
            submit({ content, upload }) {
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
        <li class="comment" :id="'comment-' + comment.id">
            <div v-if="comment.parent == 0" class="divider" style="margin: 1rem 0;"></div>
            <div class="tile text-tiny">
                <div class="tile-icon">
                    <figure :class="['avatar bg-gray', {'avatar-lg': comment.parent == 0}]">
                        <img :src="comment.avatar" alt="" />
                        <div v-if="sign.icon" class="avatar-icon s-circle">
                            <button class="btn btn-sm btn-warning comment-sign s-circle flex-center tooltip" :data-tooltip="sign.tooltips" style="height: 100%;width: 100%;font-size: 0.6rem;">
                                <i :class="sign.icon"></i>
                            </button>
                        </div>
                  </figure>
                </div>
                <div class="tile-content w-0">
                    <div class="flex-center justify-between">
                        <div class="tile-title flex-center">
                            <component :is="info.hyperlinks && comment.url ? 'a' : 'span'" class="tile-title__name mr-2" :href="comment.url" target="_blank">{{ comment.author }}</component>
                            <time class="tile-title__time tooltip" :data-tooltip="comment.date">{{ commentDate }}</time>
                        </div>
                        <div class="tile-action flex-center">
                            <span v-if="comment.approved == 0" class="text-error mr-2">待审核</span>
                            <button class="btn btn-link btn-sm flex-center" @click="showReply = true">
                                <i class="czs-comment"></i>
                             </button>
                        </div>
                    </div>
                    <div class="tile-subtitle text-break" v-html="comment.content"></div>
                    <div v-if="metas.length" class="comment-metas flex-center justify-start mt-1">
                        <span v-for="item of metas" :key="item.name" :class="['text-gray mr-2', { tooltip: !!item.tooltip }]" :data-tooltip="item.tooltip">{{ item.name }}</span>
                    </div>
                    
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
                const _sign = this.comment.sign || "";
                if ( _sign === 'admin' && !this.info.admin_icon ) return {};
                const _icon = { admin: 'czs-crown', friends: 'czs-trophy' }
                return {
                    icon: _icon[_sign] || "",
                    tooltips: _sign.toUpperCase(),
                }
            },
            metas() {
                const metas = [];
                const { ip_city, agent } = this.comment;
                if ( ip_city ) metas.push({ name: `来自${ip_city}` });
                if ( this.info.browser || this.info.os ) {
                    const { browser, os } = new UAParser(agent).getResult();
                    if ( this.info.os ) metas.push({
                        name: os.name,
                        tooltip: [os.name, os.version].join(' '),
                    });
                    if ( this.info.browser ) metas.push({
                        name: browser.name,
                        tooltip: [browser.name, browser.version].join(' '),
                    });
                }
                return metas;
            },
            commentDate() {
                return window.Lately ? Lately.format(this.comment.date) : this.comment.date;
            },
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
                <affiliate v-if="author_information || adjacent_articles" ref="affiliate" v-bind="{ post_id, author, author_information, adjacent_articles }" />
                <section id="comments">
                    <comment-form :info="{ post_id, editor, hyperlinks, visitor }" @append="appendComment" />
                    <ol class="comment-list reset-ul" @click="delegateCommentClick">
                        <template v-for="item in commentList" :key="item.id">
                            <comment-item :info="{ post_id, editor, hyperlinks, browser, os, admin_icon, visitor }" :comment="item" />
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

                // 评论区默认设置
                post_id: null,
                author_information: false,
                adjacent_articles: false,
                editor: { placeholder: 'Comment', features: ['emoji'] },
                hyperlinks: true,
                browser: false,
                os: false,
                admin_icon: true,
                pagination: { rows: 10, rolling: true, autoload: true },
                visitor: {},
                author: {},
            };
        },
        computed: {
            parameter() {
                return { type: 'comment', post_id: this.post_id, ...this.paging, ...this.pagination }
            },
            isNextPage() {
                const { total, page } = this.paging;
                return total === null || page < total;
            },
        },
        created() {
            // 自动加载
            if ( this.pagination.autoload ) this.loadNextComments();
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


    // 热力图
    this.HeatMap = {
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
                $h.ajax({ query: { action: 'get_heatmap' } })
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
    this.TopicList = {
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
                      this.topics = data.map(item => ({
                          ...item,
                          name: item.name.replace(/&nbsp;/g, '')
                      }));
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
    this.NoteCard = {
        name: 'note-card',
        template: `
            <div :class="'notes-item feat-' + featId">
                    <template v-if="!isEditor">
                        <div class="tile d-block">
                            <div class="tile-header flex-center justify-between">
                                <div class="article-header text-gray text-tiny w-100 d-flex align-center">
                                    <h3 v-if="isPost" class="text-dark h5 mt-2 mb-0">
                                        <a :href="note.permalink">{{ note.title }}</a>
                                    </h3>
                                    <div v-else class="flex-center">
                                        <time class="mr-2" :datetime="note.date" itemprop="datePublished" pubdate>{{ noteDate }}</time>
                                        <button class="btn btn-link btn-sm text-gray mr-2" @click="handleComment">
                                            <i class="czs-talk"></i> {{ note.comment_count }}
                                        </button>
                                        <button :class="['btn btn-link btn-sm text-gray mr-2', { 'text-error': praise }]"  @click="handleMenuClick({ id: 'praise' })">
                                            <i class="czs-heart"></i> <span :class="'praise-' + note.id">{{ notePraise }}</span>
                                        </button>
                                        <span v-if="note.status === 'private'" class="chip bg-gray text-gray">{{ note.status.toLocaleUpperCase() }}</span>
                                    </div>
                                </div>
        
                                <slot name="right-icon">
                                    <div v-if="!isPost && logged" class="dropdown" hover-show>
                                        <a href="javascript:void(0);" class="btn btn-link btn-action btn-sm flex-center dropdown-toggle text-gray" tabindex="0">
                                            <i class="dashicons dashicons-ellipsis"></i>
                                        </a>
                                        <ul class="menu menu-left uni-card uni-bg uni-shadow bg-blur" style="overflow: unset; min-width: 6rem;">
                                            <div v-if="loading" class="loading loading-full"></div>
                                            <div class="text-center">
                                                <li v-if="!item.hide" :class="['menu-item d-inline-block tooltip mt-0', { 'ml-1': index}]" v-for="(item, index) in menus.icons" :key="item.id"
                                                    :data-tooltip="item.name" @click="debounceMenuClick(item)">
                                                    <a :href="item.href || 'javascript:void(0);'" class="align-center" style="display: flex;">
                                                        <i v-if="item.icon" :class="[item.icon]"></i>
                                                    </a>
                                                </li>
                                            </div>
                                            <div class="divider my-2" v-if="menus.texts.length"></div>
                                            <li :class="['menu-item', item.class]" v-for="item in menus.texts" :key="item.id"  @click="debounceMenuClick(item)">
                                                <a :href="item.href || 'javascript:void(0);'" class="align-center" style="display: flex;">
                                                    <i v-if="item.icon" :class="[item.icon, 'mr-2']"></i> {{ item.name }}
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </slot>
                            </div>
                            <div class="tile-content p-0">
                                <div :class="['flex-wrap', { 'd-flex': !isPost }]">
                                    <img v-if="note.thumbnail" class="thumbnail s-rounded" :src="note.thumbnail" alt=""/>
                                    <div :class="['article-content', { 'w-100': isPost }]" v-html="superContent" @click="handleDelegate"></div>
                                </div>
                                <div v-if="note.images" class="notes-item-images flex-center justify-start">
                                    <div class="notes-item-images__item c-zoom-in" v-for="item in note.images" :key="item.id">
                                        <img class="s-rounded" :src="item.source_url" alt @click="handleViewImage(item.source_url)"/>
                                    </div>
                                </div>
                                <attachment-chips v-if="note.attachment" :attachments="note.attachment"></attachment-chips>
                            </div>
                            <div v-if="isPost" class="tile-footer text-gray text-tiny flex-center justify-between">
                                <div class="flex-center">
                                    <time class="mr-2">{{ noteDate }}</time>
                                    <button class="btn btn-link btn-sm text-gray d-flex align-center" @click="handleComment">
                                        <i class="czs-talk mr-1"></i> {{ note.comment_count }}
                                    </button>
                                </div>
        
                                <a v-if="isPost" class="btn btn-link btn-sm text-gray d-flex align-center" :href="note.permalink">
                                    Read Article <i class="dashicons dashicons-arrow-right-alt ml-1"></i>
                                </a>
                                <span v-else class="flex-center">
                                    <i class="dashicons dashicons-laptop mr-1"></i> Write from Webpage
                                </span>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <editor class="edit-status" ref="editor" v-bind="{ ...bindEditor }" @submit="handleSubmit">
                            <button slot="send-l" class="btn btn-link btn-sm mr-2" @click="isEditor=false">取消</button>
                        </editor>
                    </template>
                <div v-if="!hideDivider" class="divider"></div>
            </div>
        `,
        components: {
            Editor: that.Editor,
            'attachment-chips': that.Editor.components['attachment-chips'],
        },
        props: {
            logged: { type: Boolean, default: false },
            lately: { type: Boolean, default: true },
            hideDivider: { type: Boolean, default: false },
            note: { type: Object, default: () => ({}) },
            isDialog: { type: Boolean, default: false },
        },
        data() {
            return {
                isEditor: false,
                loading: false,
                comment: null,
                praise: !!Cookies.get(`praise_${this.note.id}`),
                bindEditor: $h.store.notes ? $h.store.notes.editor : false,
            }
        },
        computed: {
            menus() {
                const detail_href = this.note.permalink;
                const texts = [];
                const status = this.note.status;
                if ( ['private'].includes(status) ) {
                    texts.push({ id: 'publish', icon: 'czs-read-l', name: 'Publish' });
                }
                if ( ['publish'].includes(status) ) {
                    texts.push({ id: 'private', icon: 'czs-lock-l', name: 'Private' });
                }
                if ( status === 'trash' ) {
                    texts.push({ id: 'publish', icon: 'czs-read-l', name: 'Restore' });
                    texts.push({ id: 'delete', icon: 'czs-trash-l', name: 'Delete', class: 'text-error' });
                } else {
                    texts.push({ id: 'trash', icon: 'czs-box-l', name: 'Archive', class: 'text-error' });
                }
                return {
                    texts,
                    icons: [
                        { id: 'quote', icon: "czs-bookmark-l", name: 'Quote' },
                        { id: 'edit', icon: 'czs-pen-write', name: 'Edit' },
                        { id: 'detail', icon: 'czs-talk-l', name: 'View Detail', href: detail_href },
                    ]
                };
            },
            isPost() {
                return this.note.type === 'post';
            },
            featId() {
                const rand = Math.random().toString(36).substring(2);
                return `${this.note.id}-${rand}`;
            },
            superContent() {
                let content = this.note.content;
                if ( !content ) return '';
                if ( this.isPost ) return `<p>${content}</p>`;
                // 高亮话题 #话题1 话题2
                Array.from(new Set(content.match(/.?#([^#|^<\s]+)/g) || []))
                     .filter(text => ["#", " ", ">"].includes(text[0]))
                     .map(text => text.replace(/\s|&nbsp;|>/g, ''))
                     .filter(item => !!item)
                     .forEach(topic => {
                         content = content.replaceAll(topic, `<span class="chip c-hand text-primary" data-topic="${topic}">${topic.replace("#", "")}</span>`);
                     });

                // 高亮引用 /note/5841
                new Set((content.match(/(\/note\/\d+)/g) || [])).forEach(quote => {
                    const id = quote.replace('/note/', '');
                    content = content.replaceAll(quote, `<a href="javascript:void(0);" class="text-primary" data-quote="${id}">~${quote}</a>`);
                });

                // url转link
                let url_regex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z\d][a-zA-Z\d-]+[a-zA-Z\d]\.[^\s|^<]{2,}|www\.[a-zA-Z\d][a-zA-Z\d-]+[a-zA-Z\d]\.[^\s|^<]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z\d]+\.[^\s|^<]{2,}|www\.[a-zA-Z\d]+\.[^\s|^<]{2,})/g;
                let url_match = content.match(url_regex);
                if ( url_match ) {
                    url_match.forEach(url => {
                        content = content.replaceAll(url, `<a href="${url}" target="_blank" class="chip text-primary tooltip" data-tooltip="${url}" style="text-decoration: none;overflow: unset"><i class="dashicons dashicons-external"></i> Link</a>`);
                    });
                }

                return content;
            },
            category() {
                return (this.note.category || []).map(({ name }) => name).join(', ');
            },
            noteDate() {
                if ( !this.note.date ) return '';
                if ( this.lately ) {
                    return Lately && Lately.format(this.note.date);
                }
                return dayjs && dayjs(this.note.date).format('YYYY/MM/DD');
            },
            notePraise() {
                return String(this.note.fields && (this.note.fields.praise || 0));
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
                    this.$emit('topic', dataset.topic.replace('#', '').replace(/&nbsp;/g, ''));
                }
                if ( dataset && dataset.quote ) {
                    this.openArticleDialog(dataset.quote);
                }
            },
            handleComment() {
                if ( this.comment ) {
                    this.comment.destroy();
                    this.comment = null;
                } else {
                    this.comment = $modules.CommentAppend(this.featId, $h.store.config);
                }
            },
            openArticleDialog(post_id) {
                $modules.ArticleDialog(post_id, $h.store.config);
            },
            handleMenuClick(item) {
                // 防抖
                if ( this.loading ) return;
                const { id, type, content, images, videos, attachment, permalink } = this.note;
                switch (item.id) {
                    case 'quote':
                        this.$emit('event', { event: item.id });
                        break;
                    case 'edit':
                        this.isEditor = true;
                        this.$nextTick(() => {
                            const e = this.$refs.editor;
                            const target = e.$refs[e.refName];
                            target.innerHTML = content;
                            e.content = content;
                            e.files = [...(images || []), ...(videos || []), ...(attachment || [])];
                            // 将光标定位到最后
                            getSelection().collapse(target, target.childNodes.length);
                        });
                        break;
                    case 'publish':
                    case 'private':
                    case 'trash':
                    case 'delete':
                        this.loading = true;
                        let options = {};
                        if ( ['trash', 'delete'].includes(item.id) ) {
                            options = { method: 'DELETE', query: { force: item.id === 'delete' } };
                        } else if ( ['publish', 'private'].includes(item.id) ) {
                            options = { method: 'POST', query: { status: item.id } };
                        }
                        $h.rest(`wp/v2/${type}s/${id}`, options).then(({ code, message }) => {
                            if ( !!code ) {
                                this.$toast({ type: 'error', message });
                            } else {
                                this.$toast({ type: 'success', message: 'Successfully' });
                                this.$emit('event', { event: item.id });
                            }
                        }).finally(() => {
                            this.loading = false;
                        });
                        break;
                    case 'praise':
                        $modules.actions.setPraise(id).then(() => {
                            this.praise = !!Cookies.get(`praise_${id}`);
                        });
                        break;
                    case 'links':
                        // 复制链接
                        $h.copyText(permalink);
                        this.$toast({ type: 'success', message: 'Copied!' });
                        break;
                }
            },
            handleViewImage(url) {
                window.ViewImage && ViewImage.display(this.note.images.map(({ source_url }) => source_url), url);
            },
            handleSubmit({ content, files }) {
                const e = this.$refs.editor;
                e.setLoading(true);
                that.actions.setNotes(this.note, { content, files })
                    .then(({ content }) => {
                        this.isEditor = false;
                        this.$emit('event', { event: 'update', content: content.rendered, files })
                    })
                    .finally(() => {
                        e.setLoading(false);
                    });
            },
        }
    };
    // // 右侧侧边栏
    // this.NoteAside = {
    //     name: 'note-aside',
    // };

    // 卡片下方追加显示评论
    this.CommentAppend = (featId, $config) => {
        const post_id = featId.match(/(\d+)-/)[1];
        const Append = Vue.extend({
            template: `
                <div class="append-comments" @scroll="ThrottleScroll">
                    <comment-area ref="comments" />
                </div>
            `,
            components: {
                'comment-area': {
                    mixins: [$modules.CommentArea],
                    data() {
                        return { post_id, ...$config.comment };
                    },
                },
            },
            computed: {
                ThrottleScroll() {
                    return $h.throttle(this.handleScroll, 300);
                },
            },
            methods: {
                handleScroll(e) {
                    $h.scrollHasBottom(e.target, this.$refs.comments.loadNextComments);
                },
                destroy() {
                    this.$el.remove();
                }
            },
        });
        const vm = new Append({ el: document.createElement('div') });
        document.querySelector(`.feat-${featId} > div`).appendChild(vm.$el);
        return vm;
    }

    // 显示笔记、文章
    this.ArticleDialog = (post_id, $config) => {
        const Dialog = Vue.extend({
            template: `
                <div class="modal active article-dialog">
                    <a href="javascript:void(0);" class="modal-overlay" @click="destroy()"></a>
                    <div v-if="loading" class="loading"></div>
                    <note-card v-else v-bind="{ lately, note, isDialog: true }" class="uni-bg uni-shadow bg-blur">
                        <button slot="right-icon" href="javascript:void(0);" class="btn btn-clear" @click="destroy()"></button>
                    </note-card>
                </div>
            `,
            components: {
                'note-card': $modules.NoteCard,
            },
            data() {
                return { loading: false, note: {}, ...$config };
            },
            created() {
                this.getNote();
            },
            methods: {
                getNote() {
                    this.loading = true;
                    $h.ajax({ query: { action: 'get_all_posts', type: 'single', ids: post_id, page: 1, rows: 1 } })
                      .then(({ data }) => {
                          if ( data && data.length ) {
                              const { permalink } = this.note = data[0];
                              if ( history.state ) history.state.url = permalink;
                              history.replaceState(history.state, null, permalink);
                          } else {
                              this.destroy();
                              this.$toast({ type: 'warning', message: '资源已被删除' });
                          }
                      }).finally(() => {
                        this.loading = false;
                        this.$nextTick(() => {
                            _exReload && _exReload();
                        });
                    });
                },
                // 销毁实例
                destroy() {
                    if ( history.state ) history.state.url = $config.permalink;
                    history.replaceState(history.state, null, $config.permalink);
                    this.$el.remove();
                }
            },
        });
        const vm = new Dialog({ el: document.createElement('div') });
        document.querySelector('#notes').appendChild(vm.$el);
    }

    this.actions = {
        // 喜欢
        setPraise(post_id) {
            return $h.ajax({ query: { action: 'submit_praise', post_id } }).then(num => {
                Array.from(document.querySelectorAll(`.praise-${post_id}`)).forEach((el, i) => {
                    if ( !i && (+num) > (+el.innerText) ) {
                        new Vue().$toast({ type: 'success', message: '祝你财源广进' });
                    }
                    el.parentNode.classList.toggle('text-error');
                    el && (el.innerHTML = num);
                });
                return !!Cookies.get(`praise_${post_id}`);
            });
        },
        // 创建&编辑笔记
        setNotes(form, { content, files }) {
            // 从content提取topic：#topic1 #topic2 ...
            const topics = Array.from(new Set(content.match(/.?#([^#|^<\s]+)/g) || []))
                                .filter(text => ["#", " ", ">"].includes(text[0]))
                                .map(text => text.replace(/#|\s|&nbsp;|>/g, ''))
                                .filter(item => !!item);
            const fields = [];
            const images = [];
            const videos = [];
            const attachment = [];

            files && files.forEach((item) => {
                if ( item.mime_type.includes("image/") ) {
                    images.push(item);
                } else if ( item.mime_type.includes("video/") ) {
                    videos.push(item);
                } else {
                    attachment.push(item);
                }
            });

            if ( images.length ) {
                fields.push({ name: 'images', value: images.map(item => item.id).join(',') });
            }
            if ( videos.length ) {
                fields.push({ name: 'videos', value: videos.map(item => item.id).join(',') });
            }
            if ( attachment.length ) {
                fields.push({ name: 'attachment', value: attachment.map(item => item.id).join(',') });
            }
            return $h.rest(`wp/v2/notes/${form.id || ''}`, {
                method: !form.id ? 'POST' : 'PUT',
                query: { _locale: 'user' },
                data: { ...form, content, topics, fields },
            });
        },
    }
};