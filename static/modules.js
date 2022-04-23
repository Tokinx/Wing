// 编辑器
const Editor = {
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
                        <div class="card bg-white">
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
// 评论框
const CommentForm = {
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
                        <editor class="w-100" ref="editor" @submit="submit" v-bind="article.editor"></editor>
                    </div>
                </div>
            </div>
        </form>
    `,
    components: { Editor },
    props: {
        article: {
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
        article: {
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
const CommentItem = {
    name: 'comment-item',
    template: `
        <li :class="{ comment: true, card: !(+comment.parent) }" :id="'comment-' + comment.id">
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
                        <component :is="article.hyperlinks && comment.url ? 'a' : 'span'" class="tile-title__name mr-2" :href="comment.url" target="_blank">{{ comment.author }}</component>
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
                    <comment-form class="mt-2" :article="article" :reply="comment" @append="appendComment" />
                </template>
            </div>
          </div>
        <ol v-if="comment.children && comment.children.length" class="children">
            <template v-for="item in comment.children" :key="item.id">
                <comment-item :article="article" :comment="item" />
            </template>
          </ol>
    </li>
    `,
    components: { 'comment-form': CommentForm },
    props: {
        article: {
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
// 友情链接设置
const LinkSettings = {
    name: 'link-settings',
    template: `
        <div v-if="visible" class="modal modal-lg active">
            <a href="javascript: void(0);" class="modal-overlay" @click="hide" aria-label="Close"></a>
            <div class="modal-container">
                <div class="modal-header">
                    <a href="javascript: void(0);" class="btn btn-clear text-gray float-right" @click="hide" aria-label="Close"></a>
                    <div class="modal-title h5 text-gray">Links Settings</div>
                </div>
                <form method="post" action>
                    <div class="modal-body article" ref="body">
                        <div v-if="loading" class="loading" style="position: absolute;inset: 0;z-index: 1;"></div>
                        <ul class="article-cards columns reset-ul" :style="{ opacity: loading ? 0.3 : 1 }">
                            <li v-for="(item, index) of links" :key="index" class="column col-4 col-sm-6 p-2">
                                <a href="javascript: void(0);" class="btn btn-error btn-sm flex-center" @click="handleRemoveLink(index)">
                                    <i class="czs-trash-l"></i>
                                </a>
                                <div class="card">
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
                        <div class="btn btn-link float-left" @click="handleAddLinks">Add Links</div>
                        <button class="btn btn-primary" :disabled="loading" @click="submit">Save Links</button>
                    </div>
                </form>
            </div>
        </div>
    `,
    props: {
        post_id: [String, Number],
    },
    data() {
        return {
            visible: false,
            loading: false,
            links: []
        };
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
            })
        },
        handleRemoveLink(index) {
            this.links.splice(index, 1);
        },
        show() {
            this.getLinks();
            this.visible = true;
        },
        hide() {
            this.visible = false;
        },
    },
};
// 作者卡片
const AuthorCard = {
    name: 'author-card',
    template: `
        <div class="card">
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
                <div class="tile-content">
                    <div class="tile-title text-ellipsis">{{ author.display_name }}</div>
                    <small class="text-gray d-block">{{ author.description }}</small>
                </div>
                <div class="tile-action flex-center">
                    <button class="btn btn-action btn-link text-gray flex-center uni-bg" @click="handlePraise" :class="{ 'text-error': praise }">
                        <i :class="'czs-heart' + (praise ? '' : '-l')"></i>
                    </button>
                    <div class="popover popover-top ml-2">
                        <button class="btn btn-action btn-link text-gray flex-center uni-bg">
                            <i class="czs-qrcode-l"></i>
                        </button>
                        <div class="popover-container" style="width: 100px;">
                            <div class="card qr-image" ref="qr"></div>
                        </div>
                    </div>
                    <button v-if="settings" @click="handleLinkSettings" class="btn btn-action btn-link text-gray flex-center uni-bg ml-2">
                        <i class="czs-setting-l"></i>
                    </button>
                    <link-settings ref="links" :post_id="post.id" />
                </div>
            </div>
        </div>
    `,
    components: { LinkSettings },
    props: {
        author: {
            type: Object, default: () => ({})
        },
        post: {
            type: Object, default: () => ({})
        },
    },
    data() {
        return {
            praise: !!Cookies.get(`praise_${this.post.id}`)
        }
    },
    computed: {
        initial() {
            return this.author.display_name.charAt(0);
        },
        settings() {
            return document.querySelector('#Links')
        }
    },
    mounted() {
        this.$nextTick(() => {
            new QRCode(this.$refs.qr, { text: location.href, correctLevel: QRCode.CorrectLevel.L });
        })
    },
    methods: {
        handlePraise() {
            // if (this.praise) return;
            $h.ajax({
                query: { action: 'submit_praise', post_id: this.post.id },
            })
            .then((num) => {
                this.praise = !!Cookies.get(`praise_${this.post.id}`);
                const el = document.querySelector("#Praise");
                if ( el.innerText < num ) this.$toast({ type: 'success', message: '祝你财源广进' });
                el && (el.innerHTML = num);
            });
        },
        handleLinkSettings() {
            this.$refs.links.show();
        },
    }
};

const $modules = { CommentForm, CommentItem, AuthorCard, LinkSettings, Editor };