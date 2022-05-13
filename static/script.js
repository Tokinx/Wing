const $base = window.BaseData || {};

// Pjax
class WingPjax {
    // 配置
    configure = {
        selector: ":not(.no-pjax) a, a:not([download])",
        origin: location.origin,
        timeout: 15, // 超时时间，单位：秒
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

    // 比较页面是否相同
    compare = (newUrl, oldUrl) => {
        const urls = [newUrl, oldUrl].map(url => url.replace(/#.*/, ''));
        return urls[0] === urls[1];
    };

    // 初始化
    init() {
        const { configure } = this;
        let $href = '';
        this.delegate(document, 'click', configure.selector, (e, a) => {
            if ( e.ctrlKey || e.metaKey || e.shiftKey || e.altKey ) return;
            const newWindow = a.target === '_blank' || a.rel.indexOf('external') > -1;
            const crossDomain = a.href.indexOf(configure.origin) !== 0;
            const download = a.hasAttribute('download');
            if ( newWindow || crossDomain || download ) {
                if ( newWindow ) {
                    window.open(a.href); // 新窗口打开
                } else if ( crossDomain ) {
                    location.href = a.href; // 跨域重定向
                } else if ( download ) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // 移除hash参数，判断是否切换了页面
            $href = a.href;
            if ( this.compare(location.href, a.href) ) return;
            if ( !a.hash ) e.preventDefault();
            this.replace(a.href);
        });

        window.addEventListener('popstate', (e) => {
            if ( $href && this.compare(location.href, $href) ) return;
            if ( !location.hash ) e.preventDefault();
            $href = '';
            this.replace(location.href, true);
        });
    };

    // 事件委托
    delegate(element, eventType, selector, fn) {
        element.addEventListener(eventType, e => {
            const el = e.target.closest(selector);
            el && fn.call(el, e, el);
        });
        return element;
    };

    replace(newUrl, back) {
        const conf = this.configure;
        conf.before().then(() => {
            this.request(newUrl, {
                success: element => {
                    const page = new DOMParser().parseFromString(element, 'text/html');
                    // 渲染新页面
                    conf.complete().then(els => {
                        document.title = page.title; // 更新标题
                        if ( !back ) history.pushState(null, null, newUrl); // 更新地址栏
                        return this.display(page, els);
                    }).then(() => {
                        return conf.after();
                    });
                },
                error: conf.error,
            });
        });
    };

    // 数据请求
    request(url, staff) {
        const timer = this.configure.timeout * 1000;
        Promise.race([new Promise(resolve => {
            setTimeout(() => resolve(new Response("timeout")), timer);
        }), fetch(url)])
        .then(rv => rv.text()).then((element) => {
            try {
                if ( element === 'timeout' ) throw 'timeout';
                staff.success(element);
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
    display({ body }, els) {
        return Promise.all(els.map(name => new Promise(resolve => {
            if ( !name ) return;
            const [oldNode, newNode] = [document.querySelector(name), body.querySelector(name)];
            if ( oldNode && newNode ) oldNode.parentNode.replaceChild(newNode, oldNode);
            Promise.all([...newNode.querySelectorAll('script')].map(script => {
                    return new Promise(resolve => {
                        if ( script.hasAttribute('data-no-instant') ) return;
                        const newScript = document.createElement('script');
                        try {
                            if ( script.src ) {
                                newScript.src = script.src;
                                newScript.onload = resolve;
                            } else if ( script.innerHTML ) {
                                newScript.innerHTML = script.innerHTML;
                                resolve();
                            }
                        } catch (e) {
                            resolve();
                        }
                        const parentNode = script.parentNode;
                        const nextSibling = script.nextSibling;
                        parentNode.removeChild(script);
                        parentNode.insertBefore(newScript, nextSibling);
                    })
                })
            ).then(resolve);
        })));
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
        return {
            animation: "",
            modeList: [
                { name: '自动', icon: 'czs-bot', mode: 'auto' },
                { name: '明亮', icon: 'czs-sun', mode: 'light' },
                { name: '暗黑', icon: 'czs-moon', mode: 'dark' },
                // { name: '护眼', icon: 'czs-eye', mode: 'relax' },
            ],
        };
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
            complete() {
                $vm.animation = 'animation-toward';
                // 更新节点
                return $vm.sleep().then(() => ['#core']);
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
            const body = document.documentElement.scrollTop === 0 ? document.body : document.documentElement;
            $h.scrollHasBottom(body, () => {
                // 滚动加载评论
                if ( $h.store.comments && $h.store.comments.pagination.rolling ) {
                    $h.store.comments.loadNextComments();
                }
                if ( $h.store.single_note && $h.store.single_note.comment.pagination.rolling ) {
                    $h.store.single_note.$refs.comments.loadNextComments();
                }
                // 滚动加载笔记
                if ( $h.store.notes ) {
                    $h.store.notes.handleNextPage();
                }
            });
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
        toggleSkinMode(e) {
            const target = e.target;
            if ( !target.closest('a') ) return;
            const mode = target.dataset.mode;
            Cookies.set('skin-mode', mode);
            ((body) => {
                body.remove('auto', 'light', 'dark');
                body.add(mode);
            })(document.body.classList);
        },
        sleep(timer = 300) {
            return new Promise(resolve => {
                setTimeout(resolve, timer);
            });
        }
    }
});