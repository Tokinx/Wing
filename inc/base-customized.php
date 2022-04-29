<?php
// 移除非必要的头部文件
remove_action( 'wp_head', 'feed_links_extra', 3 );                    // 额外的feed,例如category, tag页
remove_action( 'wp_head', 'wp_generator' );                                    // 隐藏wordpress版本
remove_filter( 'the_content', 'wptexturize' );                            // 取消标点符号转义
remove_filter( 'oembed_dataparse', 'wp_filter_oembed_result', 10 );
remove_action( 'wp_head', 'wp_oembed_add_discovery_links' );
remove_action( 'wp_head', 'wp_oembed_add_host_js' );
add_filter( 'wp_lazy_loading_enabled', '__return_false' );

// Disable the emoji's
function disable_emojis() {
	remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
	remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
	remove_action( 'wp_print_styles', 'print_emoji_styles' );
	remove_action( 'admin_print_styles', 'print_emoji_styles' );
	remove_filter( 'the_content_feed', 'wp_staticize_emoji' );
	remove_filter( 'comment_text_rss', 'wp_staticize_emoji' );
	remove_filter( 'wp_mail', 'wp_staticize_emoji_for_email' );
}

add_action( 'init', 'disable_emojis' );

// 阻止站内文章互相 PingBack
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

// End of page.
