<?php
// 校验nonce，防止滥用接口
function check_nonce() {
    $nonce = $_REQUEST['_wpnonce'] ?? ( $_SERVER['HTTP_X_WP_NONCE'] ?? '' );
    // 判断用户是否已登陆
    if ( get_theme_mod( 'biji_setting_rest_abuse', false ) // 防滥用开关
         && ! wp_verify_nonce( $nonce, 'wp_rest' ) // 校验nonce
         && ! is_user_logged_in() ) {
        wp_send_json_error( 'No permission to access', 401 );
    }
}

// 检查并获取真实value
function tryGetValue( $key, $default = '' ) {
    return $_GET[ $key ] ?? $default;
}

// 获取文章信息
function ajax_get_all_posts_callback() {
    check_nonce();

    // 参数
    $type = tryGetValue( 'type', 'single' );
    $ids  = tryGetValue( 'ids' );
    $rows = tryGetValue( 'rows', 10 );
    $page = tryGetValue( 'page', 1 );

    // 查询条件
    $args = [
//         'post__in'       => ["5826"],
//         'ignore_sticky_posts' => 1,
        'post_type'      => $type,
        'posts_per_page' => $rows,
        'offset'         => ( $page - 1 ) * $rows,
        'post_status'    => 'publish',
        'orderby'        => 'date',
        'order'          => 'DESC',
        'author'         => get_current_user_id(),
        'tax_query'      => [],
//        'has_password'   => false,
    ];

    // 已登入用户，查询更多状态的文章
    if ( $type !== 'note' && is_user_logged_in() ) {
        $args['post_status'] = [ 'publish', 'private' ];
    }

    // 私密笔记 || 归档笔记
    if ( $type === 'private' || $type === 'trash' ) {
        if ( ! is_user_logged_in() ) {
            wp_send_json_error( 'No permission to access', 401 );
        }
        $args['post_type']   = 'note';
        $args['post_status'] = $type;
    }
    // 每日回顾
    if ( $type === 'review' ) {
        if ( ! is_user_logged_in() ) {
            wp_send_json_error( 'No permission to access', 401 );
        }
        if ( get_transient( 'review' ) ) {
            wp_send_json( get_transient( 'review' ) );
        }
        $args['post_type'] = 'note';
        $args['orderby']   = 'rand';
        $args['order']     = '';
    }
    if ( $type === 'all' ) {
        // 过滤分类文章
        if ( get_theme_mod( 'biji_setting_exclude' ) ) {
            $exclude_array       = explode( ",", get_theme_mod( 'biji_setting_exclude' ) );
            $args['tax_query'][] = [
                'taxonomy' => 'category',
                'field'    => 'term_id',
                'terms'    => $exclude_array,
                'operator' => 'NOT IN',
            ];
        }
        $args['post_type'] = [ 'post', 'note' ];
    }
    if ( $type === 'single' && $ids ) {
        $args['post_type'] = [ 'post', 'note' ];
        $args['post__in']  = explode( ',', $ids );
    }
    if ( tryGetValue( 'topics' ) ) {
        $args['tax_query'][] = [
            'taxonomy' => 'topic',
            'field'    => 'name',
            'terms'    => explode( ',', tryGetValue( 'topics' ) ),
        ];
    }

    $posts = get_posts( $args ); // 文章

    $args['posts_per_page'] = - 1;
    $args['fields']         = 'ids';
    $count                  = get_posts( $args ); // 文章数量

    $posts = array_map( function ( $post ) use ( $type ) {
        $post = formatter_article( $post );
        // 获取tags和topic
        $post->tags = [];
        $tags       = get_the_terms( $post->id, 'topic' );
        if ( is_array( $tags ) ) {
            $post->tags = array_map( function ( $tag ) {
                return [ 'id' => $tag->term_id, 'name' => $tag->name ];
            }, $tags );
        }
        // 获取分类
        $post->category = get_the_terms( $post->id, 'category' );
        // 获取自定义字段
        $post->fields = get_post_meta( $post->id, '', true );
        // 获取图片、视频、附件
        $get_media = function ( $var ) {
            $ids = explode( ',', $var );

            return array_filter(array_map( function ( $id ) {
                $attachment = get_post( $id );
                if(!$attachment->post_mime_type) return false;
                return [
                    'id'         => $id,
                    'mime_type'  => $attachment->post_mime_type,
                    'source_url' => replace_domain( $attachment->guid )
                ];
            }, $ids ), function ($item){
				return $item;
			});
        };
        foreach ( $post->fields as $key => $value ) {
            if ( $key === 'images' && is_array( $value ) ) {
                $post->images = $get_media( $value[0] );
            }
            if ( $key === 'videos' && is_array( $value ) ) {
                $post->videos = $get_media( $value[0] );
            }
            if ( $key === 'attachment' && is_array( $value ) ) {
                $post->attachment = $get_media( $value[0] );
            }
        }
        // 格式化文章内容
        if ( $post->type === 'post' ) {
            if ( $type === 'single' ) {
                $post->content = static_cdn_replace( $post->content );
                $post->content = dangopress_esc_html( $post->content );
            } else {
                $post->content = mb_strimwidth( strip_shortcodes( strip_tags( $post->content ) ), 0, 220, '...' );
            }
        }

        $post->thumbnail = replace_domain( $post->thumbnail );

        return $post;
    }, $posts );

    $result = [
        'success' => true,
        'data'    => $posts,
        'total'   => count( $count ),
    ];

    // 缓存每日回顾
    if ( $type === 'review' ) {
        set_transient( 'review', $result, 12 * HOUR_IN_SECONDS );
    }

    wp_send_json( $result );
}

add_action( 'wp_ajax_get_all_posts', 'ajax_get_all_posts_callback' );
add_action( 'wp_ajax_nopriv_get_all_posts', 'ajax_get_all_posts_callback' );

// 获取文章相关信息（前后文章、作者信息）TODO：相关文章
function ajax_affiliate_info_callback() {
    check_nonce();

    if ( array_key_exists( 'post_id', $_GET ) ) {
        $data = (object) [
            "id" => $_GET['post_id']
        ];
        // 获取文章信息
        $post            = get_post( $data->id );
        $GLOBALS['post'] = $post;
        $data->post      = formatter_article( $post );
        // 上下篇文章
        $adjacent       = (object) [
            "prev" => get_previous_post() ? formatter_article( get_previous_post() ) : new stdClass(),
            "next" => get_next_post() ? formatter_article( get_next_post() ) : new stdClass()
        ];
        $data->adjacent = $adjacent;
        // 作者信息
        $data->author = (object) [
            "id"           => $post->post_author,
            "display_name" => get_the_author_meta( 'display_name', $post->post_author ),
            "description"  => get_the_author_meta( 'description', $post->post_author ),
            "avatar"       => get_avatar_url( $post->post_author ),
        ];

        wp_send_json_success( $data );
    } else {
        wp_send_json_error( "Parameter error", 400 );
    }
}

add_action( 'wp_ajax_get_affiliate_info', 'ajax_affiliate_info_callback' );
add_action( 'wp_ajax_nopriv_get_affiliate_info', 'ajax_affiliate_info_callback' );

// AJAX 提交评论
function ajax_comment_callback() {
    check_nonce();

    $json    = json_decode( file_get_contents( 'php://input' ), true );
    $comment = wp_handle_comment_submission( wp_unslash( $json ) );
    if ( is_wp_error( $comment ) ) {
        $data = $comment->get_error_data();
        if ( ! empty( $data ) ) {
            wp_send_json_error( $comment->get_error_message(), $comment->get_error_code() );
        }
    } else {
        $user = wp_get_current_user();
        do_action( 'set_comment_cookies', $comment, $user );
        $comment = formatter_comment( $comment );
        wp_send_json_success( $comment );
    }
    wp_die();
}

add_action( 'wp_ajax_submit_comment', 'ajax_comment_callback' );
add_action( 'wp_ajax_nopriv_submit_comment', 'ajax_comment_callback' );

// AJAX 加载评论
function ajax_get_next_comments_callback() {
    check_nonce();

    if ( array_key_exists( 'post_id', $_GET ) ) {
        global $in_comment_loop;
        $in_comment_loop = true;

        $defaults = [
            'post_id' => null,
            'type'    => 'all',
            'page'    => 1,
            'rows'    => get_option( 'comments_per_page' ),
            'order'   => 'DESC',
            'filter'  => '',
        ];

        $parsed_args = wp_parse_args( $_GET, $defaults );

        $comment_args = [
            'post_id' => $parsed_args['post_id'],
            'orderby' => 'comment_date_gmt',
            'order'   => $parsed_args['order'],
            'status'  => 'approve',
        ];

        if ( is_user_logged_in() ) {
            $comment_args['include_unapproved'] = [ get_current_user_id() ];
        } else {
            $unapproved_email = wp_get_unapproved_comment_author_email();

            if ( $unapproved_email ) {
                $comment_args['include_unapproved'] = [ $unapproved_email ];
            }
        }

        $comments = get_comments( $comment_args );
        $sorted   = [];
        // 过滤类型
        if ( count( $comments ) && 'all' !== $parsed_args['type'] ) {
            $comments_by_type = separate_comments( $comments );
            $comments         = [];
            if ( ! empty( $comments_by_type[ $parsed_args['type'] ] ) ) {
                $comments = $comments_by_type[ $parsed_args['type'] ];
            }
        }

        if ( count( $comments ) ) {
            $filter  = explode( ',', $parsed_args['filter'] );
            $friends = explode( PHP_EOL, get_theme_mod( 'biji_setting_friend' ) );
            // 处理评论
            $_comments = [];
            foreach ( $comments as $o1 ) {
                if ( count( $filter ) && in_array( $o1->comment_ID, $filter ) ) {
                    continue;
                } // 过滤
                $_comments[] = formatter_comment( $o1, $friends );
            }

            // 评论嵌套
            usort( $_comments, function ( $a, $b ) {
                return $a->parent < $b->parent;
            } );
            $temp = $_comments;
            foreach ( $_comments as $o1 ) {
                if ( $temp[0]->parent == 0 ) {
                    break;
                }
                $parentIndex = - 1;
                foreach ( $temp as $o2Index => $o2 ) {
                    if ( $temp[0]->parent == $o2->id ) {
                        $parentIndex = $o2Index;
                        break;
                    }
                }
                if ( $parentIndex < 0 ) {
                    continue;
                }
                if ( isset( $temp[ $parentIndex ] ) && isset( $temp[ $parentIndex ]->children ) ) {
                    $temp[ $parentIndex ]->children[] = $temp[0];
                } else {
                    $temp[ $parentIndex ]->children = [ $temp[0] ];
                }
                if ( count( $temp[ $parentIndex ]->children ) > 1 ) {
                    usort( $temp[ $parentIndex ]->children, function ( $a, $b ) {
                        return $a->date_gmt > $b->date_gmt;
                    } );
                }
                array_shift( $temp );
            }
            $sorted = $temp;

            usort( $sorted, function ( $a, $b ) use ( $parsed_args ) {
                if ( strtoupper( $parsed_args['order'] ) === 'ASC' ) {
                    return $a->date_gmt > $b->date_gmt;
                }

                return $a->date_gmt < $b->date_gmt;
            } );
        }
        $in_comment_loop = false;
        $page            = $parsed_args['rows'] * max( ( $parsed_args['page'] - 1 ), 0 );
        $rows            = $parsed_args['rows'];
        $result          = [
            'success' => true,
            'page'    => $parsed_args['page'],
            'rows'    => $rows,
            'total'   => (string) ceil( count( $sorted ) / $rows ),
            'data'    => array_slice( $sorted, $page, $rows ),
        ];
        wp_send_json( $result );
    }
    wp_send_json_error( "Parameter error", 400 );
}

add_action( 'wp_ajax_get_next_comments', 'ajax_get_next_comments_callback' );
add_action( 'wp_ajax_nopriv_get_next_comments', 'ajax_get_next_comments_callback' );

// 点赞
function ajax_praise_callback() {
    check_nonce();

    if ( array_key_exists( 'post_id', $_GET ) ) {
        $post_id     = $_GET["post_id"];
        $cookie_name = "praise_$post_id";
        $praise      = get_post_meta( $post_id, 'praise', true ) ?: 0;
        $domain      = ( $_SERVER['HTTP_HOST'] != 'localhost' ) ? $_SERVER['HTTP_HOST'] : false;  // make cookies work with localhost
        $isUp        = array_key_exists( $cookie_name, $_COOKIE ) ? - 1 : 1;                       // 区分点赞和取消
        $praise      = $praise + ( 1 * $isUp );
        $expires     = time() + ( 99999999 * $isUp );
        update_post_meta( $post_id, 'praise', max( $praise, 0 ) );
        setcookie( $cookie_name, $post_id, $expires, '/', $domain, false );

        echo get_post_meta( $post_id, 'praise', true ) + ( get_post_meta( $post_id, 'dotGood', true ) ?: 0 );
    }
    wp_die();
}

add_action( 'wp_ajax_submit_praise', 'ajax_praise_callback' );
add_action( 'wp_ajax_nopriv_submit_praise', 'ajax_praise_callback' );

// 设置文章媒体信息
function ajax_post_meta_callback() {
    check_nonce();

    // 仅限管理员
    if ( is_super_admin() && array_key_exists( 'post_id', $_GET ) && array_key_exists( 'key', $_GET ) ) {
        $json    = json_decode( file_get_contents( 'php://input' ) );
        $post_id = $_GET["post_id"];
        $key     = $_GET["key"];
        $content = $json->content;
        update_post_meta( $post_id, $key, $content );
        if ( $key === 'links' ) {
            the_friendly_links( $post_id );
            wp_die();
        } else {
            wp_send_json_success( get_post_meta( $post_id, $key, true ) );
        }
    }
    wp_send_json_error( "Parameter error", 400 );
}

add_action( 'wp_ajax_submit_post_meta', 'ajax_post_meta_callback' );
add_action( 'wp_ajax_nopriv_submit_post_meta', 'ajax_post_meta_callback' );

// 获取文章媒体信息
function ajax_get_post_meta_callback() {
    check_nonce();

    if ( is_admin() && array_key_exists( 'post_id', $_GET ) && array_key_exists( 'key', $_GET ) ) {
        $post_id = $_GET["post_id"];
        $key     = $_GET["key"];
        wp_send_json_success( get_post_meta( $post_id, $key, true ) ?: [] );
    }
    wp_send_json_error( "Parameter error", 400 );
}

add_action( 'wp_ajax_get_post_meta', 'ajax_get_post_meta_callback' );
add_action( 'wp_ajax_nopriv_get_post_meta', 'ajax_get_post_meta_callback' );

// 获取热力图数据
function ajax_get_heatmap_callback() {
    check_nonce();

    if ( false === ( $result = get_transient( 'heatmap' ) ) ) {
        $calendar = [];

        $after_day = array_key_exists( 'after_day', $_GET ) ? $_GET['after_day'] : 60;

        for ( $i = 0; $i < $after_day; $i ++ ) {
            $day              = date( 'Y-m-d', strtotime( "-$i day" ) );
            $calendar[ $day ] = new stdClass();
        }

        // 获取当前用户最近60天的数据，按时间排序
        $args = [
            'post_type'      => [ 'post', 'note' ],
            'posts_per_page' => '-1',
            'post_status'    => 'publish',
            'orderby'        => 'date',
            'order'          => 'ASC',
            'author__in'     => max( get_current_user_id(), 1 ),
            'date_query'     => [
                'after' => "-$after_day day",
            ],
        ];

        $comments = get_comments( $args ); // 评论

        $posts = get_posts( $args ); // 文章

        foreach ( $comments as $comment ) {
            $date = date( 'Y-m-d', strtotime( $comment->comment_date ) );
            if ( array_key_exists( $date, $calendar ) ) {
                if ( ! isset( $calendar[ $date ]->comments ) ) {
                    $calendar[ $date ]->comments = 0;
                }
                $calendar[ $date ]->comments ++;
            }
        }

        foreach ( $posts as $post ) {
            $date = date( 'Y-m-d', strtotime( $post->post_date ) );
            if ( array_key_exists( $date, $calendar ) ) {
                // 判断文章类型
                if ( $post->post_type === 'note' ) {
                    if ( ! isset( $calendar[ $date ]->notes ) ) {
                        $calendar[ $date ]->notes = 0;
                    }
                    $calendar[ $date ]->notes ++;
                } else {
                    if ( ! isset( $calendar[ $date ]->posts ) ) {
                        $calendar[ $date ]->posts = 0;
                    }
                    $calendar[ $date ]->posts ++;
                }
            }
        }

        // 获取文章总数
        $_posts = wp_count_posts( 'post' );
        // 获取笔记总数
        $_notes = wp_count_posts( 'note' );
        // 最老一篇笔记
        $last = get_posts( [
            'post_type'      => 'note',
            'posts_per_rows' => 1,
            'orderby'        => 'date',
            'order'          => 'ASC',
        ] );
        $days = 0;
        if ( $last && count( $last ) ) {
            $last_date = $last[0]->post_date;
            // 判断两个日期相差的天数
            $days = ceil( ( strtotime( date( 'Y-m-d' ) ) - strtotime( $last_date ) ) / 86400 );
        }

        $result = [
            'notes'    => $_notes->publish,
            'posts'    => $_posts->publish,
            'days'     => (string) max( $days, 1 ),
            'calendar' => $calendar,
        ];

        set_transient( 'heatmap', $result, DAY_IN_SECONDS );
    };
    wp_send_json_success( $result );
}

add_action( 'wp_ajax_get_heatmap', 'ajax_get_heatmap_callback' );
add_action( 'wp_ajax_nopriv_get_heatmap', 'ajax_get_heatmap_callback' );

// 获取话题数据
function ajax_get_topics_callback() {
    check_nonce();

    $topics = get_terms( 'topic', [
        'hide_empty' => true,
        'orderby'    => 'count',
        'order'      => 'DESC',
    ] );
    $topics = array_map( function ( $topic ) {
        return [
            'id'    => $topic->term_id,
            'name'  => $topic->name,
            'count' => $topic->count,
        ];
    }, $topics );
    wp_send_json_success( $topics );
}

add_action( 'wp_ajax_get_topics', 'ajax_get_topics_callback' );
add_action( 'wp_ajax_nopriv_get_topics', 'ajax_get_topics_callback' );

// 删除旧缓存
function update_cache() {
    delete_transient( 'readers_wall' );
    if ( is_user_logged_in() ) {
        // 只有登录用户才可以删除热力图缓存
        delete_transient( 'heatmap' );
    }
}

add_action( 'save_post', 'update_cache' );
add_action( 'comment_post', 'update_cache' );

// 获取访客信息
function ajax_get_visitor_info_callback() {
    check_nonce();
    $email = tryGetValue( 'email' );
    $key   = md5( $email );

    if ( false === ( $result = get_transient( $key ) ) ) {
        $result = [
            'author' => '',
            'email'  => $email,
            'avatar' => get_avatar_url( $email ),
            'url'    => '',
        ];
        // 通过email获取访客最近一次评论
        $comment = get_comments( [
            'number'       => 1,
            'author_email' => $email,
            'order'        => 'DESC',
            'orderby'      => 'comment_date',
        ] );
        if ( $comment && count( $comment ) ) {
            $result['author'] = $comment[0]->comment_author;
            $result['url']    = $comment[0]->comment_author_url;
            set_transient( $key, $result, MONTH_IN_SECONDS );
        }
    }

    wp_send_json_success( $result );
}

add_action( 'wp_ajax_get_visitor_info', 'ajax_get_visitor_info_callback' );
add_action( 'wp_ajax_nopriv_get_visitor_info', 'ajax_get_visitor_info_callback' );

// test
function ajax_test_callback() {
$like_query = get_posts(array(
	'post_type'		=> array('post','note'),
	'post__in'		=> get_option( 'sticky_posts' ),
	'posts_per_page'	=> 999,
	'ignore_sticky_posts'	=> 0
) );
    var_dump($like_query);
    die();
}

add_action( 'wp_ajax_test', 'ajax_test_callback' );
add_action( 'wp_ajax_nopriv_test', 'ajax_test_callback' );

// End of page.
