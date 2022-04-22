<?php
ini_set('display_errors', 1);
if ( version_compare($GLOBALS['wp_version'], '5.9', '<') ) {
	wp_die('Please upgrade to version 5.9 or higher');
}
if ( !defined('THEME_PATH') ) {
	define('THEME_PATH', get_template_directory());
}
if ( !defined('THEME_NAME') ) {
	define('THEME_NAME', wp_get_theme()->Name);
}
if ( !defined('THEME_VERSION') ) {
	define('THEME_VERSION', wp_get_theme()->Version);
}

include_once('inc/core.php'); // 核心

include_once('inc/base-rest.php'); // AJAX接口
include_once('inc/base-meta.php'); // 自定义字段数据相关
include_once('inc/base-customized.php'); // 定制优化
include_once('inc/theme-update-checker.php'); // 主题更新

// 获取主题更新
new ThemeUpdateChecker(THEME_NAME, 'https://update.biji.io/?theme='.THEME_NAME);

// 挂载脚本
function biji_enqueue_scripts() {
	wp_enqueue_style('dashicons');
	wp_enqueue_style('caomei', get_template_directory_uri().'/static/caomei/style.css', [], THEME_VERSION);
	wp_enqueue_style('style', get_template_directory_uri().'/style.css', [], THEME_VERSION);

	wp_deregister_script('jquery'); // 禁用jQuery
	wp_enqueue_script('vue', '//cdn.staticfile.org/vue/2.6.14/vue.min.js', [], THEME_VERSION, true);
//	wp_enqueue_script('vue3', '//cdn.staticfile.org/vue/3.2.33/vue.global.min.js', [], THEME_VERSION, true);
	// 开启代码高亮
	if ( get_theme_mod('biji_setting_prettify', true) ) {
		wp_enqueue_script('prettify', '//cdn.staticfile.org/prettify/r298/prettify.js', [], THEME_VERSION, true);
	}
	wp_enqueue_script('dayjs', '//cdn.staticfile.org/dayjs/1.8.21/dayjs.min.js', [], THEME_VERSION, true);
	wp_enqueue_script('qrcode', '//cdn.staticfile.org/qrcodejs/1.0.0/qrcode.min.js', [], THEME_VERSION, true);
	wp_enqueue_script('helper', get_template_directory_uri().'/static/helper.js', [], THEME_VERSION, false);
	wp_enqueue_script('package', get_template_directory_uri().'/static/package.js', [], THEME_VERSION, true);
	wp_enqueue_script('modules', get_template_directory_uri().'/static/modules.js', [], THEME_VERSION, true);
	wp_enqueue_script('script', get_template_directory_uri().'/static/script.js', [], THEME_VERSION, true);
	wp_localize_script('script', 'BaseData', [
		'origin' => site_url(),
		'avatar' => (get_theme_mod('biji_setting_avatar') ?: '//cn.gravatar.com/avatar'),
		'ajax'   => admin_url('admin-ajax.php'),
		'rest'   => rest_url(),
		'nonce'  => wp_create_nonce('wp_rest')
	]);
}

add_action('wp_enqueue_scripts', 'biji_enqueue_scripts', 1);

// 添加特色缩略图支持
if ( function_exists('add_theme_support') ) {
	add_theme_support('post-thumbnails');
}

// 网页标题
function biji_add_theme_support_title() {
	add_theme_support('title-tag');
}

add_action('after_setup_theme', 'biji_add_theme_support_title');

// 阻止站内文章互相Pingback
// function theme_noself_ping(&$links)
// {
// 	$home = get_theme_mod('home');
// 	foreach ($links as $l => $link) {
// 		if (0 === strpos($link, $home)) {
// 			unset($links[$l]);
// 		}
// 	}
// }

// add_action('pre_ping', 'theme_noself_ping');

// 代码高亮
function dangopress_esc_html($content) {
	if ( !get_theme_mod('biji_setting_prettify', true) ) {
		return $content;
	}

	if ( !is_feed() || !is_robots() ) {
		$content = preg_replace('/<code(.*?)>/i', "<code class=\"prettyprint\" \$1>", $content);
	}
	$regex = '/(<code.*?>)(.*?)(<\/code>)/sim';

	return preg_replace_callback($regex, function ($matches) {
		$tag_open  = $matches[1];
		$content   = $matches[2];
		$tag_close = $matches[3];
		//$content = htmlspecialchars($content, ENT_NOQUOTES, bloginfo('charset'));
		$content = esc_html($content);

		return $tag_open.$content.$tag_close;
	}, $content);
}

add_filter('the_content', 'dangopress_esc_html', 2);
add_filter('comment_text', 'dangopress_esc_html', 2);

// Bark推送
function bark_push_msg($comment_id) {
	if ( !get_theme_mod('biji_setting_bark') ) {
		return false;
	}
	$comment = get_comment($comment_id);
	if ( ($comment->comment_parent == '') || ($comment->comment_approved == 'spam') ) {
		return false;
	}
	$token     = get_theme_mod('biji_setting_bark');
	$blog_name = get_bloginfo('name');
	$title     = get_the_title($comment->comment_post_ID);
	$message   = $comment->comment_author.'：'.$comment->comment_content;
	$avatar    = get_avatar_url($comment->comment_author_email);
	$replay    = htmlspecialchars(get_comment_link($comment_id));
	if ( strpos($avatar, 'http') !== 0 ) {
		$avatar = 'https:'.$avatar;
	}

	return file_get_contents("https://api.day.app/$token/$title/$message?icon=$avatar&group=$blog_name&url=$replay");
}

add_action('comment_post', 'bark_push_msg');

// 评论邮件
function comment_mail_notify($comment_id) {
	$comment = get_comment($comment_id);

	if ( (int) $comment->comment_parent > 0 && ($comment->comment_approved != 'spam') ) {
		$wp_email = 'no-reply@'.preg_replace('#^www.#', '', strtolower($_SERVER['SERVER_NAME'])); // e-mail 发出点, no-reply 可改为可用的 e-mail.
		$parent   = get_comment($comment->comment_parent);
		$to       = trim($parent->comment_author_email);
		$subject  = '您在 ['.get_option("blogname").'] 的留言有了新回复';
		$message  = '<table cellspacing="0" border="0" cellpadding="0" align="center" width="100%" bgcolor="transparent" style="border-collapse: separate; border-spacing: 0; letter-spacing: 0; max-width: 580px;">
	<tbody>
		<tr>
			<td>
				<table style="width: 100%;padding-top: 5%;">
					<tbody>
						<tr>
							<td style="padding: 10px 0; border-bottom: 1px dashed #ddd;line-height:20px;">
								<div style="float: left; font-weight: bold;font-size: 20px;">'.get_option("blogname").'</div>
								<div style="float: right; font-size: 14px; color: #AAB2BD;">'.get_option("blogdescription").'</div>
							</td>
						</tr>
					</tbody>
				</table>
				<table width="100%" style="border-collapse: separate; border-spacing: 0; table-layout: fixed">
					<tbody>
						<tr>
							<td style="color: #000; line-height: 1.6;">
								<h1 style="font-size: 28px; font-weight: bold; margin: 28px auto; text-align: center">
								'.get_the_title($comment->comment_post_ID).'
								</h1>
								<div style="height: 240px;background-color: #3274ff;"></div>
								<div style="margin: -120px 4% 0;background-color: #fff;font-size: 18px;padding: 8%;box-shadow: 0 0 0 1px rgb(0, 85, 255, 0.1), 3px 3px 0 rgb(0, 85, 255, 0.1);font-size: 14px;">
									<div style="text-align: right;margin-bottom: 8%;">
										<div style="display: inline-block;width: 80%;">
											<span style="color: #666;">'.trim($parent->comment_author).'</span>
											<div style="background-color: #F5F7FA;border-radius: 10px;border-top-right-radius: 0;padding: 5% 8%;text-align: left;">
												'.trim($parent->comment_content).'
											</div>
										</div>
										<img src="'.imgToBase64(get_avatar_url($to)).'" style="border-radius: 50%;width: 15%;display: inline-block;vertical-align: top;margin-left: 2%;">
									</div>
									<div>
									<img src="'.imgToBase64(get_avatar_url(trim($comment->comment_author_email))).'" style="border-radius: 50%;width: 15%;display: inline-block;vertical-align: top;margin-right: 2%;">
										<div style="display: inline-block;width: 80%;">
											<span style="color: #666;">'.$comment->comment_author.'</span>
											<div style="background-color: #3274ff;color:#fff;border-radius: 10px;border-top-left-radius: 0;padding: 5% 8%;">
												'.trim($comment->comment_content).'
											</div>
										</div>
									</div>
									<div style="border-top: 1px dashed #ddd;margin-top: 10%;text-align: center;">
										<a target="_blank" href="'.htmlspecialchars(get_comment_link($comment_id)).'"
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
									<p>© '.date("Y").' <a href="'.get_option("home").'" style="color: #aaa;" target="_blank">'.get_option("blogname").'</a></p>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</td>
		</tr>
	</tbody>
</table>';
		$from     = "From: \"".get_option('blogname')."\" <$wp_email>";
		$headers  = "$from\nContent-Type: text/html; charset=".get_option('blog_charset')."\n";
		wp_mail($to, $subject, $message, $headers);
	}
}

add_action('comment_post', 'comment_mail_notify');

// 文章加密
function password_protected_change($content) {
	if ( post_password_required() ) {
		return '<form action="'.get_option('siteurl').'/wp-login.php?action=postpass" method="post" class="post_password_form">
            <div class="form-group">
                <label class="form-label text-warning text-tiny" for="post_password">本篇文章需输入密码后查看</label>
                <div class="d-flex">
                  <input class="form-input" id="post_password" name="post_password" type="password" size="20" placeholder="请输入密码">
                  <input type="hidden" name="_wp_http_referer" value="'.get_permalink().'" />
                  <div class="mx-1"></div>
                  <button class="btn btn-primary" type="submit" name="Submit">立即查看</button>
                </div>
            </div>
        </form>';
	}

	return $content;
}

add_filter('the_content', 'password_protected_change');

// 获取皮肤模式
function the_skin_mode() {
	$mode = $_COOKIE['skin-mode'] ?? get_theme_mod('biji_setting_mode', '');
	print $mode;
}

// 获取ICP备案号
function get_icp_num() {
	return get_option('zh_cn_l10n_icp_num') ?: get_theme_mod('biji_setting_icp');
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
		if ( isset($_COOKIE['comment_author_'.COOKIEHASH]) ) {
			$data['author'] = $_COOKIE['comment_author_'.COOKIEHASH];
		}
		if ( isset($_COOKIE['comment_author_email_'.COOKIEHASH]) ) {
			$data['email'] = $_COOKIE['comment_author_email_'.COOKIEHASH];
		}
		if ( isset($_COOKIE['comment_author_url_'.COOKIEHASH]) ) {
			$data['url'] = $_COOKIE['comment_author_url_'.COOKIEHASH];
		}
	}
	print json_encode($data, JSON_UNESCAPED_SLASHES);
}

// 全部配置完毕
