const $base = window.BaseData || {};
/**
 * ViewImage Native JavaScript Lightbox Plugin
 *
 * @name ViewImage.js
 * @version 2.0.0
 * @author Tokinx
 * @license MIT License - http://www.opensource.org/licenses/mit-license.php
 *
 * For usage and examples, visit:
 * https://tokinx.github.io/ViewImage/
 *
 * Copyright (c) 2017, biji.io
 */
(() => {
    window.ViewImage = new function () {
        this.target = 'article img';
        this.listener = (e) => {
            const el = e.target.closest(this.target);
            if ( !el ) return;
            const root = this.target.replace(/\s.+/, '');
            const images = [...document.querySelectorAll(`${root === 'img' ? '' : root} img`)].map(img => img.src);
            this.display(images, e.target.src);
            e.stopPropagation();
            e.preventDefault();
        };
        this.init = (val) => {
            if ( val ) this.target = val;
            ['removeEventListener', 'addEventListener'].forEach(method => {
                document[method]('click', this.listener, false);
            });
        }
        this.display = (images, src) => {
            let index = images.indexOf(src);
            const $el = new DOMParser().parseFromString(`
                <div class="view-image">
                    <div class="view-image-container">
                        <div class="view-image-lead"></div>
                        <div class="view-image-loading"></div>
                        <div class="view-image-close view-image-close__full"></div>
                    </div>
                    <div class="view-image-tools">
                        <div class="view-image-tools__count">
                            <span><b class="view-image-index">${index + 1}</b>/${images.length}</span>
                        </div>
                        <div class="view-image-tools__flip">
                            <div class="view-image-btn view-image-tools__flip-prev">
                                <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="white" fill-opacity="0.01"/><path d="M31 36L19 24L31 12" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            </div>
                            <div class="view-image-btn view-image-tools__flip-next">
                                <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="white" fill-opacity="0.01"/><path d="M19 12L31 24L19 36" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            </div>
                        </div>
                        <div class="view-image-btn view-image-close">
                            <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="white" fill-opacity="0.01"/><path d="M8 8L40 40" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 40L40 8" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </div>
                    </div>
                </div>
            `, 'text/html').body.firstChild,
                keyFn = function (e) {
                    const keyMap = { Escape: 'close', ArrowLeft: 'tools__flip-prev', ArrowRight: 'tools__flip-next' };
                    if ( keyMap[e.key] ) $el.querySelector(`.view-image-${keyMap[e.key]}`).click();
                },
                loadImage = (src) => {
                    const img = new Image(), $lead = $el.querySelector('.view-image-lead');
                    $lead.className = "view-image-lead view-image-lead__out";
                    setTimeout(() => {
                        $lead.innerHTML = "";
                        img.onload = function () {
                            setTimeout(() => {
                                $lead.innerHTML = `<img src="${img.src}" alt="ViewImage"/>`;
                                $lead.className = "view-image-lead view-image-lead__in";
                            }, 100);
                        };
                        img.src = src;
                    }, 300);
                };
            document.body.appendChild($el);
            loadImage(src);

            window.addEventListener("keydown", keyFn);
            $el.onclick = (e) => {
                if ( e.target.closest('.view-image-close') ) {
                    window.removeEventListener("keydown", keyFn);
                    $el.onclick = null;
                    $el.classList.add('view-image__out');
                    setTimeout(() => $el.remove(), 300);
                } else if ( e.target.closest('.view-image-tools__flip') ) {
                    if ( e.target.closest('.view-image-tools__flip-prev') ) {
                        index = index === 0 ? images.length - 1 : index - 1;
                    } else {
                        index = index === images.length - 1 ? 0 : index + 1;
                    }
                    loadImage(images[index]);
                    $el.querySelector('.view-image-index').innerHTML = index + 1;
                }
            };
        }
    }
})();

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