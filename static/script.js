const $base = window.BaseData || {};

// Pjax
class WingPjax {
    // 配置
    configure = {
        selector: ":not(.no-pjax) a, a:not([download])",
        origin: location.origin,
        before() {
            return Promise.resolve();
        },
        complete(data, display) {
            return display(data, ['#app']);
        },
        after() {
        },
        error() {
        },
    };

    constructor(configure) {
        const $ua = navigator.userAgent;
        const supported = ('pushState' in history && (!$ua.match('Android') || $ua.match('Chrome/')) && location.protocol !== "file:");
        if ( !supported ) return;

        // 初始化
        Object.assign(this.configure, configure);
        this.init();
    }

    // 初始化
    init() {
        const { configure } = this;
        this.delegate(document, 'click', configure.selector, (e, node) => {
            if ( e.ctrlKey || e.metaKey || e.shiftKey || e.altKey ) return;
            const newWindow = node.target === '_blank' || node.rel.indexOf('external') > -1;
            const crossDomain = node.href.indexOf(configure.origin) !== 0;
            if ( newWindow || crossDomain ) {
                if ( newWindow ) {
                    // 新窗口打开
                    window.open(node.href);
                } else if ( crossDomain ) {
                    // 跨域重定向
                    location.href = node.href;
                }
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // 移除hash参数，判断是否切换了页面
            if ( this.clearHash(node.href) === this.clearHash(location.href) ) return;
            if ( !node.hash ) e.preventDefault();
            this.replace(node.href);
        });
        let oldUrl = '';
        window.addEventListener('popstate', (e) => {
            if ( !e.state ) return;
            const node = new URL(e.state.url);
            if ( node.href.replace(/#.*$/, '') === oldUrl.replace(/#.*$/, '') ) return;
            if ( !node.hash ) e.preventDefault();
            oldUrl = '';
            this.replace(node.href, true);
        });
        window.addEventListener('hashchange', (e) => {
            oldUrl = e.newURL;
        });
    };

    // 清除Clear
    getHash(url) {
        const { hash } = new URL(url);
        return hash;
    };

    // 清除Clear
    clearHash(url) {
        return url.replace(this.getHash(url), '');
    };

    // 获取滚动条位置
    getScrollTop() {
        return document.documentElement.scrollTop || document.body.scrollTop;
    }

    // 事件委托
    delegate(element, eventType, selector, fn) {
        element.addEventListener(eventType, e => {
            const el = e.target.closest(selector);
            el && fn.call(el, e, el);
        });
        return element;
    };

    replace(url, back) {
        const that = this;
        that.configure.before().then(() => {
            this.request(url, {
                success(html) {
                    const data = that.formatter(html, url);
                    if ( !back ) {
                        history.pushState({
                            url: that.clearHash(url),
                            title: data.title
                        }, data.title, url);
                    }
                    that.configure.complete(data, that.display).then(() => {
                        this.after(data);
                    });
                },
                after({ title, head }) {
                    document.title = title;
                    that.configure.after(head);
                },
                error: that.configure.error,
            });
        });
    };

    // 数据请求
    request(url, staff) {
        fetch(url).then(rv => rv.text()).then((html) => {
            try {
                staff.success(html);
            } catch (e) {
                new Promise(resolver => {
                    staff.error();
                    resolver();
                }).then(() => {
                    location.href = url; // 直接跳转到URL
                });
            }
        });
    };

    // 显示
    display({ body }, affect) {
        return Promise.all(affect.map(name => new Promise(resolve => {
            if ( !name ) return;
            const [oldNode, newNode] = [document.querySelector(name), body.querySelector(name)];
            if ( oldNode && newNode ) oldNode.parentNode.replaceChild(newNode, oldNode);
            Promise.all([...newNode.querySelectorAll('script')].map(script => {
                    return new Promise(resolve => {
                        if ( script.hasAttribute('data-no-instant') ) return;
                        const temp = document.createElement('script');
                        try {
                            if ( script.src ) {
                                temp.src = script.src;
                                temp.onload = resolve;
                            } else if ( script.innerHTML ) {
                                temp.innerHTML = script.innerHTML;
                                resolve();
                            }
                        } catch (e) {
                            resolve();
                        }
                        const parentNode = script.parentNode;
                        const nextSibling = script.nextSibling;
                        parentNode.removeChild(script);
                        parentNode.insertBefore(temp, nextSibling);
                    })
                })
            ).then(resolve);
        })));
    };

    // 获取并输出格式化数据
    formatter(html, url) {
        const { title, body, head } = new DOMParser().parseFromString(html, 'text/html');
        return { url, title, body, head };
    };
}

Vue.prototype.$toast = function (params, timer) {
    const Toast = Vue.extend({
        template: `
            <div :class="['vue-toast toast', 'toast-${(params || {}).type}']">
                <button class="btn btn-clear float-right" @click="$el.remove()"></button>
                <span>${(params || {}).message}</span>
            </div>
        `,
        destroyed() {
            setTimeout(() => {
                this.$el.remove();
            }, timer || 2000);
        }
    });
    const vm = new Toast({ el: document.createElement('div') });
    document.body.appendChild(vm.$el);
    vm.$destroy();
}

window.$vm = new Vue({
    el: '#app',
    data() {
        return { animation: "" };
    },
    mounted() {
        new WingPjax({
            // selector: '.header-nav a, .footer-nav a, .article-list a',
            origin: $base.origin,
            before() {
                $h.scrollTo();
                $vm.animation = 'animation-start';
                // 清除当前页面创建的实例
                Object.keys($h.tasks).forEach(name => {
                    $h.tasks[name] = null;
                    $h.store[name] = null;
                });
                return $vm.sleep(0);
            },
            complete(data, display) {
                $vm.animation = 'animation-toward';
                return $vm.sleep().then(() => display(data, ['#core']));
            },
            after() {
                $vm.sleep(100).then(() => {
                    $vm.animation = 'animation-end';
                    $vm.overload();
                });
            },
        });

        this.overload();

        const throttleScroll = $h.throttle(() => {
            const body = document.documentElement.scrollTop === 0 ? document.body : document.documentElement
            const clientHeight = body.clientHeight;
            const scrollTop = body.scrollTop;
            const scrollHeight = body.scrollHeight;

            if ( scrollTop !== 0 && scrollHeight < scrollTop + clientHeight + 100 ) {
                // 滚动加载评论
                if ( $h.store.comments && $h.store.comments.pagination.rolling ) {
                    $h.store.comments.loadNextComments();
                }
                // 滚动加载笔记
                if ( $h.store.notes ) {
                    $h.store.notes.handleNextPage();
                }
            }
        }, 300);
        window.addEventListener('scroll', throttleScroll);
        throttleScroll();
    },
    methods: {
        overload() {
            Object.keys($h.tasks).forEach(name => {
                $h.tasks[name] && $h.tasks[name]();
            });

            window._exReload && _exReload();

            // Safari Hack
            if ( navigator.vendor.indexOf("Apple") > -1 ) {
                document.querySelectorAll("[srcset]").forEach(img => {
                    img.outerHTML = img.outerHTML;
                });
            }
        },
        toggleSkinMode(mode) {
            let add = 'default', remove = "dark";
            if ( mode ) {
                add = 'dark';
                remove = "default";
                Cookies.set('skin-mode', 'dark');
            } else Cookies.remove('skin-mode');
            !((item) => {
                item.add(add);
                item.remove(remove);
            })(document.body.classList)
        },
        sleep(timer = 300) {
            return new Promise(resolve => {
                setTimeout(resolve, timer);
            });
        }
    }
});