<?php
include_once( 'core-cache.php' ); // 缓存
include_once( 'core-rest.php' ); // AJAX接口
include_once( 'core-notes.php' ); // 笔记
include_once( 'core-settings.php' ); // 主题设置
include_once( 'theme-update-checker.php' ); // 主题更新

// 数据缓存
$_cache   = new FileCache( THEME_PATH . '/cache', 3600 * 24 );
$_cache7  = new FileCache( THEME_PATH . '/cache/7d', 3600 * 24 * 7 );
$_cache30 = new FileCache( THEME_PATH . '/cache/30d', 3600 * 24 * 30 );

// 注册导航
if ( function_exists( 'register_nav_menus' ) ) {
	register_nav_menus( [
		'header_nav' => __( '站点导航' ),
		'footer_nav' => __( '底部导航' ),
	] );
}

// 注册侧边栏
if ( function_exists( 'register_sidebar' ) ) {
	register_sidebar( [
		'name'          => __( '侧边栏' ),
		'id'            => 'aside-widget-area',
		'description'   => __( '侧边栏小工具' ),
		'before_widget' => '<div class="reset-ul uni-bg flex-center %2$s">',
		'after_widget'  => '</div>',
		// 'before_title' => '<h3 class="widget-title">',
		// 'after_title' => '</h3>',
	] );
}

// 拦截纯英文评论
function scp_comment_post( $incoming_comment ) {
	if ( ! get_theme_mod( 'biji_setting_enc', false ) && ! preg_match( '/[一-龥]/u', $incoming_comment['comment_content'] ) ) {
		wp_send_json_error( '评论内容必须包含中文', 403 );
	}

	return $incoming_comment;
}

add_filter( 'preprocess_comment', 'scp_comment_post' );

// Gravatar头像使用镜像服务器
function biji_replace_avatar( $avatar ) {
	if ( get_theme_mod( 'biji_setting_avatar' ) ) {
		$cdn  = get_theme_mod( 'biji_setting_avatar' );
		$path = "";
		if ( strpos( $cdn, "/avatar" ) || strpos( $cdn, "/gravatar" ) ) {
			$path = "avatar";
		}
		$avatar = preg_replace( "/(.*?).gravatar.com\/$path/", $cdn, $avatar );
	}

	return $avatar;
}

add_filter( 'get_avatar', 'biji_replace_avatar' );
add_filter( 'get_avatar_url', 'biji_replace_avatar' );

// 静态资源使用 CDN
function static_cdn() {
	ob_start( 'static_cdn_replace' );
}

// 替换资源
function static_cdn_replace( $content ) {
	if ( get_theme_mod( 'biji_setting_cdn' ) ) {
		$regex   = function ( $dirs, $type ) {
			return '/' . str_replace( '/', '\/', preg_replace( '#^\w+://#', '//', site_url() ) ) . '\/((' . $dirs . ')\/[^\s\?\\\'\"\;\>\<]{1,}.(' . $type . '))([\"\\\'\s\?]{1})/';
		};
		$cdn     = get_theme_mod( 'biji_setting_cdn' );
		$suffix  = 'png|jpg|jpeg|gif|bmp|zip|rar|7z|gz';
		$dirs    = str_replace( '-', '\-', 'wp-content|wp-includes' );
		$content = preg_replace( $regex( $dirs, $suffix ), '' . preg_replace( '#^\w+://#', '//', $cdn ) . '/$1$4', $content );
	}

	return $content;
}

add_action( 'template_redirect', 'static_cdn' );

// 替换域名
function replace_domain( $url ) {
	if ( get_theme_mod( 'biji_setting_cdn' ) ) {
		$cdn = get_theme_mod( 'biji_setting_cdn' );
		$url = str_replace( site_url(), $cdn, $url );
	}

	return $url;
}

// 首页过滤分类文章
function exclude_category( $query ) {
	if ( ! get_theme_mod( 'biji_setting_exclude' ) ) {
		return;
	}

	$exclude_array = explode( ",", get_theme_mod( 'biji_setting_exclude' ) );
	$exclude       = '';
	foreach ( $exclude_array as $k => $ex ) {
		if ( $ex > 0 ) {
			$ex *= - 1;
		}
		$exclude .= $ex . ',';
	}
	if ( $query->is_home() && $query->is_main_query() ) {
		$query->set( 'cat', $exclude );
	}
}

add_action( 'pre_get_posts', 'exclude_category' );

// 缩略图技术 by：http://www.bgbk.org
if ( ! defined( 'THEME_THUMBNAIL_PATH' ) ) {
	define( 'THEME_THUMBNAIL_PATH', '/cache/thumbnail' ); //存储目录
}
function biji_build_empty_index( $path ) {
	// 生成空白首页
	$index = $path . '/index.php';
	if ( is_file( $index ) ) {
		return;
	}
	wp_mkdir_p( $path );
	file_put_contents( $index, "<?php\n// Silence is golden.\n" );
}

/**
 * 裁剪图片
 *
 * @param string $url 图片地址
 * @param int $width 宽度
 * @param int $height 高度
 */
function crop_thumbnail( $url, $width, $height = null ) {
	$width     = (int) $width;
	$height    = empty( $height ) ? $width : (int) $height;
	$hash      = md5( $url );
	$file_path = constant( 'WP_CONTENT_DIR' ) . constant( 'THEME_THUMBNAIL_PATH' ) . "/$hash-$width-$height.jpg";
	$file_url  = content_url( constant( 'THEME_THUMBNAIL_PATH' ) . "/$hash-$width-$height.jpg" );
	if ( is_file( $file_path ) ) {
		return $file_url;
	}
	$editor = wp_get_image_editor( $url );
	if ( is_wp_error( $editor ) ) {
		return $url;
	}
	$size = $editor->get_size();
	$dims = image_resize_dimensions( $size['width'], $size['height'], $width, $height, true );
	//if( !$dims ) return $url;
	$cmp = min( $size['width'] / $width, $size['height'] / $height );
	if ( is_wp_error( $editor->crop( $dims[2], $dims[3], $width * $cmp, $height * $cmp, $width, $height ) ) ) {
		return $url;
	}
	biji_build_empty_index( constant( 'WP_CONTENT_DIR' ) . constant( 'THEME_THUMBNAIL_PATH' ) );

	return is_wp_error( $editor->save( $file_path, 'image/jpg' ) ) ? $url : $file_url;
}

/**
 * 获取缩略图
 *
 * @param string $width 宽度
 * @param string $height 高度
 * @param string $_post 文章
 */
function get_thumbnail( $width = 0, $height = 0, $_post = null ) {
	global $post;
	$_post = $_post ?: $post;
	if ( has_post_thumbnail( $_post->ID ) ) {
		$thumbnail = get_post_thumbnail_url( $_post->ID );
		if ( $width === 0 && $height === 0 ) {
			return $thumbnail;
		} else {
			return crop_thumbnail( $thumbnail, $width, $height );
		}
	} else {
		$content = $_post->post_content;
		preg_match_all( '/<img.*?(?: |\\t|\\r|\\n)?src=[\'"]?(.+?)[\'"]?(?:(?: |\\t|\\r|\\n)+.*?)?>/sim', $content, $strResult, PREG_PATTERN_ORDER );
		if ( count( $strResult[1] ) > 0 ) {
			if ( $width === 0 && $height === 0 ) {
				return $strResult[1][0];
			} else {
				return crop_thumbnail( $strResult[1][0], $width, $height );
			}
		} else {
			return '';
		}
	}
}

function get_post_thumbnail_url( $post_id = null ) {
	$post_id      = $post_id ?: get_the_ID();
	$thumbnail_id = get_post_thumbnail_id( $post_id );
	if ( $thumbnail_id ) {
		$thumbnail = wp_get_attachment_image_src( $thumbnail_id, 'full' );

		return $thumbnail[0];
	}

	return false;
}

/* Mini Pagenavi v1.0 by Willin Kan. Edit by zwwooooo */
if ( ! function_exists( 'the_pagination' ) ) {
	function the_pagination( $p = 2 ) {
		if ( is_singular() ) {
			return;
		}
		global $wp_query, $paged;
		$max_page = $wp_query->max_num_pages;
		if ( $max_page == 1 ) {
			return;
		}
		$paged = $paged ?: 1;
		$links = "";
		if ( $paged > $p + 1 ) {
			$links .= get_pagination_link( 1 );
		}
		if ( $paged > $p + 2 ) {
			$links .= get_pagination_link( - 1 );
		}
		for ( $i = $paged - $p; $i <= $paged + $p; $i ++ ) {
			if ( $i > 0 && $i <= $max_page ) {
				$links .= get_pagination_link( $i, $paged );
			}
		}
		if ( $paged < $max_page - $p - 1 ) {
			$links .= get_pagination_link( - 1 );
		}
		if ( $paged < $max_page - $p ) {
			$links .= get_pagination_link( $max_page );
		}

		echo $links ? "<ul class='pagination'>$links</ul>" : "";
	}

	function get_pagination_link( $num, $paged = null ) {
		$active = $num === $paged ? 'active' : '';
		$link   = $num == - 1 ? "..." : "<a href='" . esc_html( get_pagenum_link( $num ) ) . "' title='第 {$num} 页'>{$num}</a>";

		return "<li class='page-item {$active}'>$link</li>";
	}
}

// 格式化评论字段
function formatter_comment( $comment, $friends = [] ) {
	$res = (object) [];

	$formatter = [
		"comment_ID"         => "id",
		"comment_post_ID"    => "post_id",
		"comment_author"     => "author",
		// "comment_author_email" => "email",
		"comment_author_url" => "url",
		"comment_author_IP"  => "ip",
		"comment_date"       => "date",
		"comment_date_gmt"   => "date_gmt",
		"comment_content"    => "content",
		"comment_karma"      => "karma",
		"comment_approved"   => "approved",
		"comment_agent"      => "agent",
		"comment_type"       => "type",
		"comment_parent"     => "parent",
	];

	// 用户标注
	if ( user_can( $comment->user_id, "administrator" ) ) {
		$res->sign = 'admin';
	} else if ( in_array( $comment->comment_author_email, $friends ) ) {
		$res->sign = 'friends';
	} else {
		$res->sign = '';
	}

	$res->avatar = get_avatar_url( $comment->comment_author_email );

	foreach ( $formatter as $old => $new ) {
		$res->{$new} = $comment->{$old};
	}
	// 评论@回复
	if ( $res->parent > 0 && get_comment( $res->parent ) ) {
		$res->content = '<a href="#comment-' . $res->parent . '">@' . get_comment_author( $res->parent ) . '</a> ' . $res->content;
	}

	return $res;
}

// 格式化文章字段
function formatter_article( $post, $formatter = null ) {
	$formatter = $formatter ?: [
		"ID"             => "id",
		"post_type"      => "type",
		"post_title"     => "title",
		"post_date"      => "date",
		"post_date_gmt"  => "date_gmt",
		"post_content"   => "content",
		"post_author"    => "author",
		"post_status"    => "status",
		"comment_status" => "comment_status",
		"comment_count"  => "comment_count",
		"ping_status"    => "ping_status",
	];

	$res = (object) [];

	foreach ( $formatter as $old => $new ) {
		$res->{$new} = $post->{$old};
	}

	$res->permalink = get_permalink( $post->ID );
	$res->thumbnail = get_thumbnail( 0, 0, $post );

	return $res;
}

// 获取文章归档
function get_my_archives() {
	$previous_year = $year = 0;
	$archives      = [];
	$posts         = get_posts( 'numberposts=-1&orderby=post_date&order=DESC' );
	foreach ( $posts as $post ) {
		$year = date( 'Y', strtotime( $post->post_date ) );
		if ( $year != $previous_year ) {
			$archives[ $year ] = [
				"year"     => $year,
				"articles" => []
			];
		}
		$previous_year                   = $year;
		$archives[ $year ]["articles"][] = [
			"month-day" => date( 'm-d', strtotime( $post->post_date ) ),
			"permalink" => get_permalink( $post->ID ),
			"title"     => $post->post_title,
			"comments"  => $post->comment_count
		];
	}

	return $archives;
}

// 获取读者墙
function get_readers_wall( $count = 12 ) {
	global $wpdb, $_cache;
	if ( ! $_cache->has( 'readers_wall' ) ) {
		// 根据评论邮箱查询排名前N名评论者
		$sql    = "SELECT COUNT(comment_ID) AS cnt, comment_author, comment_author_url, comment_author_email FROM $wpdb->comments LEFT OUTER JOIN $wpdb->posts ON ($wpdb->posts.ID=$wpdb->comments.comment_post_ID) WHERE comment_date > date_sub( NOW(), INTERVAL 3 MONTH ) AND user_id='0' AND post_password='' AND comment_approved='1' AND comment_type='comment' GROUP BY comment_author_email ORDER BY cnt DESC LIMIT $count";
		$result = $wpdb->get_results( $sql );
		$_cache->set( 'readers_wall', $result );
	} else {
		$result = $_cache->get( 'readers_wall' );
	}

	return $result;
}

// 图片转base64，捕获异常
function get_image_base64( $url = '' ) {
	global $_cache30;
	try {
		if ( strpos( $url, 'http' ) !== 0 ) {
			$url = 'https:' . $url;
		}
		if ( $_cache30->has( md5( $url ) ) ) {
			return $_cache30->get( md5( $url ) );
		}
		$stream_opts  = [
			"ssl"  => [ "verify_peer" => false, "verify_peer_name" => false ], // 忽略SSL
			"http" => [ "timeout" => 5 ], // 超时时间 5 秒
		];
		$base64string = chunk_split( base64_encode( file_get_contents( "$url", false, stream_context_create( $stream_opts ) ) ) );
		// 正则提取Content-Type
		preg_match( '/Content-Type: (.*?);/', implode( ';', $http_response_header ), $match );
		$mime   = $match[1] ?: 'image/png';
		$base64 = "data:" . $mime . ";base64,$base64string";
		// 缓存base64
		$_cache30->set( md5( $url ), $base64 );

		return $base64;
	} catch ( Error $e ) {
		return "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
	}
}

// 获取主题更新
new ThemeUpdateChecker( THEME_NAME, "http://dev.biji.local/update?" . http_build_query( [
		'theme'     => THEME_NAME,
		'version'   => THEME_VERSION,
		'preview'   => get_theme_mod( 'biji_setting_preview_update' ),
		'url'       => home_url(),
		'email'     => get_option( 'admin_email' ),
		'wordpress' => $GLOBALS['wp_version'],
	] )
);


// End of page.
