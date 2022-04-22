<?php
// 移除非必要的头部文件
remove_action( 'wp_head', 'feed_links_extra', 3 );                    // 额外的feed,例如category, tag页
remove_action( 'wp_head', 'wp_generator' );                                    // 隐藏wordpress版本
remove_filter( 'the_content', 'wptexturize' );                            // 取消标点符号转义
remove_filter( 'oembed_dataparse', 'wp_filter_oembed_result', 10 );
remove_action( 'wp_head', 'wp_oembed_add_discovery_links' );
remove_action( 'wp_head', 'wp_oembed_add_host_js' );
add_filter( 'wp_lazy_loading_enabled', '__return_false' );

// Remove Gutenberg Block Library CSS from loading on the frontend
// function remove_styles_inline()
// {
// 	wp_deregister_style('global-styles');
// 	wp_dequeue_style('global-styles');
// }

// add_action('wp_enqueue_scripts', 'remove_styles_inline');

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

//// 禁止wp-embed.min.js
//function disable_embeds_init() {
//  global $wp;
//  $wp->public_query_vars = array_diff($wp->public_query_vars, ['embed']);
//  remove_action('rest_api_init', 'wp_oembed_register_route');
//  add_filter('embed_oembed_discover', '__return_false');
//  remove_filter('oembed_dataparse', 'wp_filter_oembed_result', 10);
//  remove_action('wp_head', 'wp_oembed_add_discovery_links');
//  remove_action('wp_head', 'wp_oembed_add_host_js');
//  add_filter('tiny_mce_plugins', 'disable_embeds_tiny_mce_plugin');
//  add_filter('rewrite_rules_array', 'disable_embeds_rewrites');
//}
//
//add_action('init', 'disable_embeds_init', 9999);
//
//function disable_embeds_tiny_mce_plugin($plugins) {
//  return array_diff($plugins, ['wpembed']);
//}
//
//function disable_embeds_rewrites($rules) {
//  foreach ($rules as $rule => $rewrite) {
//    if (false !== strpos($rewrite, 'embed=true')) {
//      unset($rules[$rule]);
//    }
//  }
//  return $rules;
//}
//
//function disable_embeds_remove_rewrite_rules() {
//  add_filter('rewrite_rules_array', 'disable_embeds_rewrites');
//  flush_rewrite_rules();
//}
//
//register_activation_hook(__FILE__, 'disable_embeds_remove_rewrite_rules');
//function disable_embeds_flush_rewrite_rules() {
//  remove_filter('rewrite_rules_array', 'disable_embeds_rewrites');
//  flush_rewrite_rules();
//}
//
//register_deactivation_hook(__FILE__, 'disable_embeds_flush_rewrite_rules');

// End of page.
