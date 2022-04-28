$h.tasks.comments = () => {
    const $config = window.ArticleData || {};
    $h.store.comments = new Vue({
        el: $config.el,
        mixins: [$modules.CommentArea],
        data() {
            return { ...$config };
        },
    });
}