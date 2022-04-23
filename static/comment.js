$h.tasks.affiliate = () => {
    const $article = window.ArticleData || {};
    $h.store.affiliate = new Vue({
        el: $article.el,
        template: `
        <div id="slight" class="article-cards">
            <section class="affiliate">
                <author-card v-if="!!affiliateInfo.author" :author="affiliateInfo.author" :post="affiliateInfo.post" />
                <ul v-if="affiliateInfo.adjacent" class="pagination">
                    <li v-for="key of Object.keys(affiliateInfo.adjacent)" :key="key" :class="'page-item w-0 page-' + key">
                        <a :href="affiliateInfo.adjacent[key].permalink || 'javascript: void(0);'" class="w-100 text-gray">
                            <div class="page-item-subtitle text-capitalize">{{ key }}</div>
                            <div class="page-item-title h6 text-ellipsis">
                                {{ affiliateInfo.adjacent[key].title || 'No more' }}
                            </div>
                        </a>
                    </li>
                </ul>
            </section>
            <section id="comments">
                <comment-form :article="article" @append="appendComment" />
                <div v-if="commentList.length" class="divider" style="margin: 1rem 0;"></div>
                <ol class="comment-list reset-ul" @click="delegateCommentClick">
                    <template v-for="item in commentList" :key="item.id">
                        <comment-item :article="article" :comment="item" />
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
            // 作者卡片
            'author-card': $modules.AuthorCard,
            // 评论框
            'comment-form': $modules.CommentForm,
            // 评论样式
            'comment-item': $modules.CommentItem,
        },
        data() {
            return {
                loading: false,
                article: $article,
                affiliateInfo: {},
                commentList: [],
                parameter: {
                    type: 'comment',
                    page: 0,
                    rows: $article.pagination.rows || 10,
                    total: null,
                    filter: [],
                },
                replyComment: {},
            };
        },
        computed: {
            elContent() {
                return document.querySelector('.content');
            },
            elComment() {
                return document.querySelector('.comment-list');
            },
            isNextPage() {
                const { total, page } = this.parameter;
                return total == null || page < total;
            },
        },
        mounted() {
            // 自动加载
            if ( $article.pagination.autoload ) {
                const { offsetHeight, scrollHeight } = this.elContent;
                scrollHeight <= offsetHeight && this.loadNextComments();
            }
            this.getAffiliateInfo()
        },
        methods: {
            // 获取关联信息
            getAffiliateInfo() {
                $h.ajax({ query: { action: 'get_affiliate_info', post_id: $article.post_id } }).then(({ data }) => {
                    this.affiliateInfo = data;
                });
            },
            loadComment() {
                if ( this.isNextPage && !this.loading ) {
                    this.loadNextComments();
                }
            },
            loadNextComments() {
                this.parameter.page++;
                this.getCommentList();
            },
            getCommentList() {
                this.loading = true;
                $h.ajax({
                    query: {
                        action: 'get_next_comments',
                        post: $article.post_id,
                        ...this.parameter
                    }
                })
                .then(res => {
                    if ( res && res.data ) {
                        res.data.length && this.commentList.push(...res.data);
                        this.parameter.total = res.total;
                    }
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            appendComment(data) {
                this.commentList.unshift(data);
                this.parameter.filter.push(data.id);
            },
            delegateCommentClick(e) {
                if ( e.target.closest('.comment-reply-link') ) {
                    e.preventDefault();
                }
            },
        },
    });
}