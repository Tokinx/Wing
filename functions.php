<?php
ini_set( 'display_errors', 1 );
if ( version_compare( $GLOBALS['wp_version'], '5.9', '<' ) ) {
	wp_die( 'Please upgrade to version 5.9 or higher' );
}
if ( ! defined( 'THEME_PATH' ) ) {
	define( 'THEME_PATH', get_template_directory() );
}
if ( ! defined( 'THEME_NAME' ) ) {
	define( 'THEME_NAME', wp_get_theme()->Name );
}
if ( ! defined( 'THEME_VERSION' ) ) {
	define( 'THEME_VERSION', wp_get_theme()->Version );
}

include_once( 'inc/core.php' ); // 核心

include_once( 'inc/base-customized.php' ); // 定制优化

// 挂载脚本
function biji_enqueue_scripts() {
	// WP自带图标
	wp_enqueue_style( 'dashicons' );
	wp_enqueue_style( 'wp-block-library' ); // WordPress 核心
	wp_enqueue_style( 'wp-block-library-theme' ); // WordPress 核心

	// 草莓ICON PRO
	wp_enqueue_style( 'caomei', get_template_directory_uri() . '/static/caomei/style.css', [], THEME_VERSION );
	wp_enqueue_style( 'style', get_template_directory_uri() . '/style.css', [], THEME_VERSION );

	// 禁用jQuery
	wp_deregister_script( 'jquery' );
	// 咱们的主题使用Vue
	wp_enqueue_script( 'vue', '//cdn.staticfile.org/vue/2.6.14/vue.min.js', [], THEME_VERSION, true );
	// 开启代码高亮
	if ( get_theme_mod( 'biji_setting_prettify', true ) ) {
		wp_enqueue_script( 'prettify', '//cdn.staticfile.org/prettify/r298/prettify.js', [], THEME_VERSION, true );
	}
	wp_enqueue_script( 'helper', get_template_directory_uri() . '/static/helper.js', [], THEME_VERSION, false );
	wp_enqueue_script( 'package', get_template_directory_uri() . '/static/package.js', [], THEME_VERSION, true );
	wp_enqueue_script( 'modules', get_template_directory_uri() . '/static/modules.js', [], THEME_VERSION, true );
	wp_enqueue_script( 'script', get_template_directory_uri() . '/static/script.js', [], THEME_VERSION, true );
	wp_localize_script( 'script', 'BaseData', [
		'origin' => site_url(),
		'avatar' => ( get_theme_mod( 'biji_setting_avatar' ) ?: '//cn.gravatar.com/avatar' ),
		'ajax'   => admin_url( 'admin-ajax.php' ),
		'rest'   => rest_url(),
		'nonce'  => wp_create_nonce( 'wp_rest' )
	] );
}

add_action( 'wp_enqueue_scripts', 'biji_enqueue_scripts', 1 );

// 添加特色缩略图支持
if ( function_exists( 'add_theme_support' ) ) {
	add_theme_support( 'post-thumbnails' );
}

// 网页标题支持
function biji_add_theme_support_title() {
	add_theme_support( 'title-tag' );
}

add_action( 'after_setup_theme', 'biji_add_theme_support_title' );

// 代码高亮
function dangopress_esc_html( $content ) {
	if ( ! get_theme_mod( 'biji_setting_prettify', true ) ) {
		return $content;
	}

	if ( ! is_feed() || ! is_robots() ) {
		$content = preg_replace( '/<code(.*?)>/i', "<code class=\"prettyprint\" \$1>", $content );
	}
	$regex = '/(<code.*?>)(.*?)(<\/code>)/sim';

	return preg_replace_callback( $regex, function ( $matches ) {
		$tag_open  = $matches[1];
		$content   = $matches[2];
		$tag_close = $matches[3];
		$content   = esc_html( $content );

		return $tag_open . $content . $tag_close;
	}, $content );
}

add_filter( 'the_content', 'dangopress_esc_html', 2 );
add_filter( 'comment_text', 'dangopress_esc_html', 2 );

// Bark推送
function bark_push_msg( $comment_id ) {
	if ( ! get_theme_mod( 'biji_setting_bark' ) ) {
		return false;
	}
	$comment = get_comment( $comment_id );
	if ( (int) $comment->comment_parent <= 0 || $comment->comment_approved === 'spam' ) {
		return false;
	}
	$token     = trim( get_theme_mod( 'biji_setting_bark' ) );
	$blog_name = trim( get_bloginfo( 'name' ) );
	$title     = trim( get_the_title( $comment->comment_post_ID ) ) ?: $blog_name;
	$message   = trim( $comment->comment_author . '：' . $comment->comment_content );
	$avatar    = get_avatar_url( $comment->comment_author_email );
	$replay    = htmlspecialchars( get_comment_link( $comment_id ) );
	if ( strpos( $avatar, 'http' ) !== 0 ) {
		$avatar = 'https:' . $avatar;
	}

	$stream_opts = [
		"ssl"  => [ "verify_peer" => false, "verify_peer_name" => false ], // 忽略SSL
		"http" => [ "timeout" => 5 ], // 超时时间 5 秒
	];

	return file_get_contents( "https://api.day.app/$token/$title/$message?icon=$avatar&group=$blog_name&url=$replay", false, stream_context_create( $stream_opts ) );
}

add_action( 'comment_post', 'bark_push_msg' );

// 评论邮件
function comment_mail_notify( $comment_id ) {
	$comment = get_comment( $comment_id );

	if ( (int) $comment->comment_parent > 0 && ( $comment->comment_approved != 'spam' ) ) {
		$wp_email = 'no-reply@' . preg_replace( '#^www.#', '', strtolower( $_SERVER['SERVER_NAME'] ) ); // e-mail 发出点, no-reply 可改为可用的 e-mail.
		$parent   = get_comment( $comment->comment_parent );
		$to       = trim( $parent->comment_author_email );
		$subject  = '您在 [' . get_option( "blogname" ) . '] 的留言有了新回复';
		$title    = trim( get_the_title( $comment->comment_post_ID ) ) ?: get_option( "blogname" );
		$message  = '<table cellspacing="0" border="0" cellpadding="0" align="center" width="100%" bgcolor="transparent" style="border-collapse: separate; border-spacing: 0; letter-spacing: 0; max-width: 580px;">
	<tbody>
		<tr>
			<td>
				<table style="width: 100%;padding-top: 5%;">
					<tbody>
						<tr>
							<td style="padding: 10px 0; border-bottom: 1px dashed #ddd;line-height:20px;">
								<div style="float: left; font-weight: bold;font-size: 20px;">' . get_option( "blogname" ) . '</div>
								<div style="float: right; font-size: 14px; color: #AAB2BD;">' . get_option( "blogdescription" ) . '</div>
							</td>
						</tr>
					</tbody>
				</table>
				<table width="100%" style="border-collapse: separate; border-spacing: 0; table-layout: fixed">
					<tbody>
						<tr>
							<td style="color: #000; line-height: 1.6;">
								<h1 style="font-size: 28px; font-weight: bold; margin: 28px auto; text-align: center">
								' . $title . '
								</h1>
								<div style="height: 240px;background-color: #3274ff;"></div>
								<div style="margin: -120px 4% 0;background-color: #fff;font-size: 18px;padding: 8%;box-shadow: 0 0 0 1px rgb(0, 85, 255, 0.1), 3px 3px 0 rgb(0, 85, 255, 0.1);font-size: 14px;">
									<div style="text-align: right;margin-bottom: 8%;">
										<div style="display: inline-block;width: 80%;">
											<span style="color: #666;">' . trim( $parent->comment_author ) . '</span>
											<div style="background-color: #F5F7FA;border-radius: 10px;border-top-right-radius: 0;padding: 5% 8%;">
												' . trim( $parent->comment_content ) . '
											</div>
										</div>
										<img src="' . get_image_base64( get_avatar_url( $to ) ) . '" style="border-radius: 50%;width: 15%;display: inline-block;vertical-align: top;margin-left: 2%;">
									</div>
									<div>
									<img src="' . get_image_base64( get_avatar_url( trim( $comment->comment_author_email ) ) ) . '" style="border-radius: 50%;width: 15%;display: inline-block;vertical-align: top;margin-right: 2%;">
										<div style="display: inline-block;width: 80%;">
											<span style="color: #666;">' . $comment->comment_author . '</span>
											<div style="background-color: #3274ff;color:#fff;border-radius: 10px;border-top-left-radius: 0;padding: 5% 8%;">
												' . trim( $comment->comment_content ) . '
											</div>
										</div>
									</div>
									<div style="border-top: 1px dashed #ddd;margin-top: 10%;text-align: center;">
										<a target="_blank" href="' . htmlspecialchars( get_comment_link( $comment_id ) ) . '"
											style="background-color: #3274ff; border: none; color: white !important; margin: 10% auto 0; padding: 3% 10%; display: inline-block;text-decoration: none;"
											rel="noopener">立即回复</a>
									</div>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</td>
		</tr>
	</tbody>
</table>

<table width="100%" align="center" style="border-collapse: separate; border-spacing: 0; padding: 5% 0; table-layout: fixed; text-align: center">
	<tbody>
		<tr>
			<td style="font-size: 12px; padding: 0;">
				<table cellspacing="0" border="0" cellpadding="0" align="center" width="100%" bgcolor="transparent"
					style="border-collapse: separate; border-spacing: 0; letter-spacing: 0; max-width: 580px;">
					<tbody>
						<tr>
							<td valign="top" align="center" style="font-size: 12px; color: #aaa;">
								<div>
									<p>这是由系统自动发送的电子邮件，请勿直接回复。</p>
									<p>© ' . date( "Y" ) . ' <a href="' . get_option( "home" ) . '" style="color: #aaa;" target="_blank">' . get_option( "blogname" ) . '</a></p>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</td>
		</tr>
	</tbody>
</table>';
		$from     = "From: \"" . get_option( 'blogname' ) . "\" <$wp_email>";
		$headers  = "$from\nContent-Type: text/html; charset=" . get_option( 'blog_charset' ) . "\n";
		wp_mail( $to, $subject, $message, $headers );
	}
}

add_action( 'comment_post', 'comment_mail_notify' );

// 文章加密
function password_protected_change( $content ) {
	if ( post_password_required() ) {
		return '<form action="' . get_option( 'siteurl' ) . '/wp-login.php?action=postpass" method="post" class="post_password_form">
            <div class="form-group">
                <label class="form-label text-warning text-tiny" for="post_password">本篇文章需输入密码后查看</label>
                <div class="d-flex">
                  <input class="form-input" id="post_password" name="post_password" type="password" size="20" placeholder="请输入密码">
                  <input type="hidden" name="_wp_http_referer" value="' . get_permalink() . '" />
                  <div class="mx-1"></div>
                  <button class="btn btn-primary" type="submit" name="Submit">立即查看</button>
                </div>
            </div>
        </form>';
	}

	return $content;
}

add_filter( 'the_content', 'password_protected_change' );

// 获取皮肤模式
function the_skin_mode() {
	$mode = $_COOKIE['skin-mode'] ?? get_theme_mod( 'biji_setting_mode', 'auto' );
	print $mode;
}

// 获取ICP备案号
function get_icp_num() {
	return get_option( 'zh_cn_l10n_icp_num' ) ?: get_theme_mod( 'biji_setting_icp' );
}

// 获取访客信息
function the_visitor_info() {
	$data = [];
	if ( is_user_logged_in() ) {
		$user            = wp_get_current_user();
		$data['user_id'] = $user->ID;
		$data['author']  = $user->display_name;
		$data['email']   = $user->user_email;
		$data['url']     = $user->user_url;
	} else {
		if ( isset( $_COOKIE[ 'comment_author_' . COOKIEHASH ] ) ) {
			$data['author'] = $_COOKIE[ 'comment_author_' . COOKIEHASH ];
		}
		if ( isset( $_COOKIE[ 'comment_author_email_' . COOKIEHASH ] ) ) {
			$data['email'] = $_COOKIE[ 'comment_author_email_' . COOKIEHASH ];
		}
		if ( isset( $_COOKIE[ 'comment_author_url_' . COOKIEHASH ] ) ) {
			$data['url'] = $_COOKIE[ 'comment_author_url_' . COOKIEHASH ];
		}
	}
	print json_encode( $data, JSON_UNESCAPED_SLASHES );
}

// 获取作者信息
function the_author_info( $post_id = null ) {
	$post = get_post( $post_id );
	$data = [
		"display_name" => get_the_author_meta( 'display_name', $post->post_author ),
		"description"  => get_the_author_meta( 'description', $post->post_author ),
		"avatar"       => get_avatar_url( $post->post_author ),
	];
	print json_encode( $data, JSON_UNESCAPED_SLASHES );
}

// 展示友情链接
function the_friendly_links( $post_id = null ) {
	$post_id = $post_id ?: get_the_ID();
	$links   = json_decode( get_post_meta( $post_id, 'links', true ) ?: "[]" );
	foreach ( $links as $link ) : ?>
        <li class="column col-4 col-sm-6 p-2">
            <a class="card uni-card flex-center text-center" href="<?= $link->url ?? 'javascript:void(0);' ?>"
               target="_blank">
                <span class="text-break mt-2"><?= $link->name ?? '--' ?></span>
                <span class="text-gray text-tiny text-break mb-2"><?= $link->description ?? '' ?></span>
            </a>
        </li>
	<?php endforeach;
}

// 获取点赞信息
function get_praise( $post_id = null ) {
	$post_id = $post_id ?: get_the_ID();

	return ( get_post_meta( $post_id, 'praise', true ) ?: 0 ) + ( get_post_meta( $post_id, 'dotGood', true ) ?: 0 );
}

// 全部配置完毕
