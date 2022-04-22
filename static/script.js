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

    init() {
        this.delegate(document.body, 'click', this.configure.selector, (e, node) => {
            if ( e.ctrlKey || e.metaKey || e.shiftKey || e.altKey ) return;
            const isNewWindow = node.target === '_blank' || (node.rel && ['external'].some(word => node.rel.includes(word)));
            const isCross = node.href.indexOf(this.configure.origin) !== 0;
            if ( isNewWindow || isCross ) {
                if ( isNewWindow ) window.open(node.href); // 新窗口打开
                else if ( isCross ) location.href = node.href; // 跨域重定向
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // 移除hash参数，判断是否切换了页面
            if ( node.href.replace(/#.*$/, '') === location.href.replace(/#.*$/, '') ) return;
            if ( !node.hash ) e.preventDefault();
            this.replace(node.href);
        });
        window.addEventListener('popstate', (e) => {
            if ( !e.state ) return;
            const node = new URL(e.state.url);
            // TODO：如何获取上一个页面的URL？如果上一个页面跟当前页面相同，则不需要重新渲染
            // if ( node.href.replace(/#.*$/, '') === location.href.replace(/#.*$/, '') ) return;
            if ( !node.hash ) e.preventDefault();
            else return;
            this.replace(node.href, true);
        });
    };

    // 事件委托
    delegate(element, eventType, selector, fn) {
        // const find = (el) => {
        //   if (element === el) return null;
        //   if (el.matches(selector)) return el;
        //   return find(el.parentNode);
        // }
        element.addEventListener(eventType, e => {
            // const el = find(e.target);
            const el = e.target.closest(selector);
            el && fn.call(el, e, el);
        });
        return element;
    };

    replace(url, back) {
        const { configure, formatter, display } = this;
        configure.before().then(() => {
            this.request(url, {
                success(html) {
                    const data = formatter(html, url);

                    if ( !back ) {
                        history.pushState({ url, title: data.title, module: "pjax" }, data.title, url);
                    }

                    configure.complete(data, display).then(() => {
                        this.after(data);
                    });
                },
                after({ title, head }, elName) {
                    document.title = title;
                    configure.after(elName, head);
                },
                error: configure.error,
            });
        });
    };

    // 数据请求
    request(url, staff) {
        const injection = (html) => {
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
        };
        fetch(url).then(rv => rv.text()).then(injection);
    };

    // 显示
    display({ body }, affect) {
        return Promise.all(affect.map(elName => new Promise(resolve => {
            if ( !elName ) return;
            const [oldNode, newNode] = [document.querySelector(elName), body.querySelector(elName)];
            if ( oldNode && newNode ) oldNode.parentNode.replaceChild(newNode, oldNode);
            Promise.all(
                [...newNode.querySelectorAll('script')].map(script => new Promise(resolve => {
                        if ( script.hasAttribute('data-no-instant') ) return;
                        const temp = document.createElement('script');
                        try {
                            if ( script.src ) {
                                temp.src = script.src;
                                temp.onload = resolve;
                            }
                            if ( script.innerHTML ) {
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
                )
            ).then(resolve);
            console.log('script loaded');
        })));
    };

    // 获取并输出格式化数据
    formatter(html, url) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return { url, title: doc.title, body: doc.body, head: doc.head };
    };
}

Vue.prototype.$toast = ({ message, type }, timer = 2000) => {
    const Toast = Vue.extend({
        template: `
            <div :class="['vue-toast toast', 'toast-${type || 'default'}']">
                <button class="btn btn-clear float-right" @click="$el.remove()"></button>
                <span>${message}</span>
            </div>
        `,
        destroyed() {
            setTimeout(() => {
                this.$el.remove();
            }, timer);
        }
    });
    const vm = new Toast({ el: document.createElement('div') });
    document.body.appendChild(vm.$el);
    vm.$destroy();
}

window.$vm = new Vue({
    el: '#app',
    data() {
        return {
            animation: "",
        };
    },
    mounted() {
        new WingPjax({
            // selector: '.header-nav a, .footer-nav a, .article-list a',
            origin: $base.origin,
            before() {
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
                $h.scrollTo();
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

            // 滚动加载评论
            if ( scrollTop !== 0 && scrollHeight < scrollTop + clientHeight + 100 ) {
                const $article = window.ArticleData
                if ( $article && $article.el && document.querySelector($article.el) ) {
                    if ( $article.pagination && $article.pagination.rolling && $h.store.affiliate ) {
                        $h.store.affiliate.loadComment();
                    }
                }
                if ( $h.store.notes ) {
                    $h.store.notes.handleNextPage();
                }
            }
        }, 200);
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