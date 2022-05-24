// Helper
const $h = {
    tasks: {},
    store: {},
    // 更新URL
    pushState(state) {
        history.pushState(state, state.title, state.url);
    },
    // 对象转QueryString
    toQueryString(obj) {
        return Object.keys(obj).map(key => `${key}=${obj[key]}`).join('&');
    },
    // 获取访客信息
    visitor(email, cb) {
        email = (email || '').trim();
        if ( !email || !/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email) ) {
            cb && cb({ avatar: `${$base.avatar}/default?d=mm&f=y&r=g` })
            return;
        }
        this.ajax({ query: { action: 'get_visitor_info', email } }).then(({ data }) => cb && cb(data));
    },
    // 防抖
    debounce(fun, delay = 500) {
        let timer = null;  //设定一个定时器
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                fun.apply(this, args);
            }, delay);
        };
    },
    // 节流
    throttle(fun, delay = 1000) {
        let flag = true;
        return (...args) => {
            if ( !flag ) return;
            flag = false;
            setTimeout(() => {
                fun.apply(this, args);
                flag = true;
            }, delay);
        };
    },
    // 封装fetch
    fetch(url, args = {}) {
        const { query = {}, data, method = 'GET', headers = {}, ...others } = args;
        const queryString = this.toQueryString(query);
        const body = method === 'GET' ? null : JSON.stringify(data);
        const urlWithQuery = queryString ? `${url}?${queryString}` : url;
        const _headers = { 'Content-Type': 'application/json', 'X-WP-Nonce': $base.nonce, ...headers };
        if ( headers['Content-Type'] === null ) delete _headers['Content-Type'];
        return fetch(urlWithQuery, { method, headers: _headers, body, ...others })
        .then(rv => {
            if ( rv.status >= 200 && rv.status < 300 ) {
                if ( args.source ) {
                    return rv;
                } else if ( rv.headers.get('Content-Type').indexOf('application/json') > -1 ) {
                    return rv.json();
                } else {
                    return rv.text();
                }
            }

            return Promise.reject(rv);
        }).catch(rv => {
            return new Promise((resolve, reject) => {
                const type = rv.status >= 400 && rv.status < 500 ? 'warning' : 'error';
                if ( rv.headers.get('Content-Type').indexOf('application/json') > -1 ) {
                    rv.json().then(({ message, msg, data }) => {
                        reject({ type, message: message || msg || data });
                    });
                } else {
                    rv.text().then(message => {
                        reject({ type, message: message || '网络错误，请稍后重试' });
                    });
                }
            }).catch(({ type, message }) => {
                $vm.$toast({ type, message });
                return Promise.reject({ type, message });
            });
        });
    },
    ajax(args) {
        return this.fetch($base.ajax, args);
    },
    rest(url, args) {
        return this.fetch(`${$base.rest}${url}`, args);
    },
    // 平滑滚动
    scrollTo({ el, to = 0, rate = 6, callback } = {}) {
        const target = (el ? document.querySelector(el) : document.scrollingElement);
        let scrollTop = target.scrollTop;

        const animationToTop = function () {
            scrollTop = scrollTop + (to - scrollTop) / rate;

            // 临界判断，终止动画
            if ( Math.abs(scrollTop - to) <= 1 ) {
                target.scrollTop = to;
                callback && callback();
                return;
            }
            target.scrollTop = scrollTop;
            // 动画
            requestAnimationFrame(animationToTop);
        };
        animationToTop();
    },
    scrollHasBottom({ scrollHeight, clientHeight, scrollTop }, callback, advance = 100) {
        if ( scrollTop && (scrollHeight - advance) < scrollTop + clientHeight ) {
            callback && callback();
        }
    },
};

