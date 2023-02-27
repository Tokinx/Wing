class Language {
    constructor(options = {}) {
        // 默认语言为英语
        this.lang = options.lang || "en";
    }

    translate(text) {
        // 从字典中获取译文，如果没有则原样返回 (English)
        const translation = this.dictionary[text] ?? {};
        if ( this.lang.includes("zh_") && !translation[this.lang] ) {
            console.log(text)
        }
        return translation[this.lang] ?? text;
    }

    options(name) {
        const libs = {
            Lately: {
                en: {
                    'second': ' Second(s)',
                    'minute': ' Minute(s)',
                    'hour': ' Hour(s)',
                    'day': ' Day(s)',
                    'month': ' Month(s)',
                    'year': ' Year(s)',
                    'ago': ' Ago',
                    'error': 'NaN'
                },
                zh_TC: {
                    'second': '秒',
                    'minute': '分鐘',
                    'hour': '小時',
                    'day': '天',
                    'month': '个月',
                    'year': '年',
                    'ago': '前',
                    'error': 'NaN'
                },
                ja: {
                    'second': '秒',
                    'minute': '分鐘',
                    'hour': '時間',
                    'day': '日',
                    'month': 'ヶ月',
                    'year': '年',
                    'ago': '前',
                    'error': 'NaN'
                }
            }
        }
        return (libs[name] || {})[this.lang] || {};
    }

    dictionary = {
        "Auto": {
            "zh_SC": "自动",
            "zh_TC": "自動",
            "ja": "自動"
        },
        "Light": {
            "zh_SC": "明亮",
            "zh_TC": "明亮",
            "ja": "明るい"
        },
        "Dark": {
            "zh_SC": "黑暗",
            "zh_TC": "黑暗",
            "ja": "暗い"
        },
        "Email": {
            "zh_SC": "电子邮件",
            "zh_TC": "電子郵件",
            "ja": "電子メール"
        },
        "Name": {
            "zh_SC": "昵称",
            "zh_TC": "暱稱",
            "ja": "ニックネーム"
        },
        "Url": {
            "zh_SC": "网址",
            "zh_TC": "網址",
            "ja": "ウェブサイト"
        },
        "Description": {
            "zh_SC": "描述",
            "zh_TC": "描述",
            "ja": "説明"
        },
        "Operate": {
            "zh_SC": "操作",
            "zh_TC": "操作",
            "ja": "操作する"
        },
        "All": {
            "zh_SC": "全部",
            "zh_TC": "全部",
            "ja": "全て"
        },
        "Notes": {
            "zh_SC": "笔记",
            "zh_TC": "筆記",
            "ja": "ノート"
        },
        "Articles": {
            "zh_SC": "文章",
            "zh_TC": "文章",
            "ja": "記事"
        },
        "Review": {
            "zh_SC": "回顾",
            "zh_TC": "回顧",
            "ja": "レビュー"
        },
        "Private": {
            "zh_SC": "私密",
            "zh_TC": "私密",
            "ja": "プライベート"
        },
        "Publish": {
            "zh_SC": "公开",
            "zh_TC": "公開",
            "ja": "公開"
        },
        "Archive": {
            "zh_SC": "归档",
            "zh_TC": "歸檔",
            "ja": "アーカイブ"
        },
        "Quote": {
            "zh_SC": "引用",
            "zh_TC": "引用",
            "ja": "引用"
        },
        "Send": {
            "zh_SC": "发送",
            "zh_TC": "發送",
            "ja": "送信"
        },
        "Edit": {
            "zh_SC": "编辑",
            "zh_TC": "編輯",
            "ja": "編集"
        },
        "Confirm": {
            "zh_SC": "确定",
            "zh_TC": "確認",
            "ja": "確認"
        },
        "Cancel": {
            "zh_SC": "取消",
            "zh_TC": "取消",
            "ja": "キャンセル"
        },
        "View Detail": {
            "zh_SC": "查看详情",
            "zh_TC": "查看詳情",
            "ja": "詳細を見る"
        },
        "Restore": {
            "zh_SC": "恢复",
            "zh_TC": "恢復",
            "ja": "レジュメ"
        },
        "Delete": {
            "zh_SC": "删除",
            "zh_TC": "刪除",
            "ja": "削除"
        },
        "Pending review": {
            "zh_SC": "待审核",
            "zh_TC": "待審核",
            "ja": "見直される"
        },
        "Load comments": {
            "zh_SC": "加载评论",
            "zh_TC": "载入評論",
            "ja": "コメント読み込み中"
        },
        "Continue load": {
            "zh_SC": "继续加载",
            "zh_TC": "繼續载入",
            "ja": "読み込みを継続する"
        },
        "Looking forward to your comments": {
            "zh_SC": "期待你的评论",
            "zh_TC": "期待你的評論",
            "ja": "コメントお待ちしております"
        },
        "No more": {
            "zh_SC": "没有更多了",
            "zh_TC": "沒有更多了",
            "ja": "もういや"
        },
        "From": {
            "zh_SC": "来自",
            "zh_TC": "來自",
            "ja": "から"
        },
        "What are you thinking, write it down?": {
            "zh_SC": "你在想什么，写下来吧？",
            "zh_TC": "你在想什麼，寫下來吧？",
            "ja": "何を考えているか、書き留めましょうか？"
        },
        "Please enter content": {
            "zh_SC": "请输入内容",
            "zh_TC": "請輸入內容",
            "ja": "内容を入力してください"
        },
        "Please enter:": {
            "zh_SC": "请输入：",
            "zh_TC": "請輸入：",
            "ja": "入ってください："
        },
        "Successfully": {
            "zh_SC": "成功",
            "zh_TC": "成功",
            "ja": "成功"
        },
        "Read Article": {
            "zh_SC": "阅读全文",
            "zh_TC": "閱讀全文",
            "ja": "続きを読む"
        },
        "Good luck": {
            "zh_SC": "元气满满的一天",
            "zh_TC": "元氣滿滿的一天",
            "ja": "元気な一日"
        },
        "Link Settings": {
            "zh_SC": "友情链接设置",
            "zh_TC": "友情鏈接設定",
            "ja": "フレンドリンク設定"
        },
        "Add Links": {
            "zh_SC": "添加链接",
            "zh_TC": "添加鏈接",
            "ja": "リンクを追加"
        },
        "Save All": {
            "zh_SC": "全部保存",
            "zh_TC": "全部儲存",
            "ja": "全部を保存"
        },
        "Sticky": {
            "zh_SC": "置顶",
            "zh_TC": "置頂",
            "ja": "上"
        },
    }
}

!(() => {
    let lang = Cookies.get('lang') ?? (window.BaseData || {}).lang ?? 'en';
    if ( lang.includes("zh_") ) {
        lang = lang === "zh_CN" ? "zh_SC" : "zh_TC";
    } else if ( !["ja"].includes(lang) ) {
        lang = "en";
    }
    window.$lang = new Language({ lang });
})();