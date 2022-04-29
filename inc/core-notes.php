<?php
function note_custom_init() {
	// 注册Note类型
	register_post_type( 'note', [
		'labels'              => [
			'name'               => __( '笔记' ),
			'singular_name'      => __( '笔记' ),
			'add_new'            => __( '新的笔记' ),
			'add_new_item'       => __( '笔记' ),
			'edit_item'          => __( '编辑' ),
			'new_item'           => __( '新笔记' ),
			'view_item'          => __( '查看' ),
			'search_items'       => __( '搜索' ),
			'not_found'          => __( '暂无笔记' ),
			'not_found_in_trash' => __( '没有已遗弃的笔记' ),
			'parent_item_colon'  => __( '' ),
			'menu_name'          => __( '笔记' )
		],
		'public'              => true, // 公开
		'capability_type'     => 'post', // 指定权限类型
		'map_meta_cap'        => true, // 允许编辑器设置
		'menu_icon'           => 'dashicons-edit-page', // 图标
		'hierarchical'        => false, // 是否为级联
		'query_var'           => true, // 可通过query_var获取
		'delete_with_user'    => true, // 删除时同时删除文章
		'supports'            => [ 'title', 'editor', 'author', 'custom-fields', 'trackbacks', 'comments' ], // 支持的功能
//		'show_ui'             => false, // 后台不显示界面
		'exclude_from_search' => true, // 搜索结果中排出
		'show_in_nav_menus'   => false, // 导航菜单中不显示
		'show_in_rest'        => true, // 在REST API中显示
		'rest_base'           => 'notes', // REST API中的路由
		'publicly_queryable'  => true, // 允许查看
		'rewrite'             => [ 'slug' => 'note' ],
	] );

	// 话题
	register_taxonomy( 'topic', 'note', [
		'labels'                => [
			'name'              => __( '话题' ),
			'singular_name'     => __( '话题' ),
			'search_items'      => __( '搜索话题' ),
			'all_items'         => __( '所有话题' ),
			'parent_item'       => __( '该话题的上级话题' ),
			'parent_item_colon' => __( '该话题的上级话题：' ),
			'edit_item'         => __( '编辑话题' ),
			'update_item'       => __( '更新话题' ),
			'add_new_item'      => __( '添加新的话题' ),
			'new_item_name'     => __( '新话题' ),
			'menu_name'         => __( '话题' ),
		],
		'hierarchical'          => false, // 是否为级联
		'show_ui'               => true, // 后台显示
		'update_count_callback' => '_update_post_term_count', // 更新计数
		'publicly_queryable'    => false, // 允许查看
		'exclude_from_search'   => false, // 搜索结果中排出
		'query_var'             => false, // 可通过query_var获取
		'show_in_rest'          => true, // 在REST API中显示
//		'rewrite'               => ['slug' => 'topic'], // 更改路由
	] );
}

add_action( 'init', 'note_custom_init' );

// 控制管理页面字段
function note_custom_columns( $column ) {
	global $post;
	switch ( $column ) {
		case "content":
			echo $post->post_content;
			break;
	}
}

function note_edit_columns( $columns ) {
	return [
		'content'  => '笔记',
		'author'   => '作者',
		'comments' => '评论',
		'date'     => '日期',
	];
}

add_action( "manage_note_posts_custom_column", "note_custom_columns" );
add_filter( "manage_note_posts_columns", "note_edit_columns", 10, 2 );

// 保存笔记时支持自定义字段
function set_custom_fields( \WP_Post $post, $request, $creating ) {
	// 自定义字段
	$fields = $request->get_param( "fields" );
	if ( is_array( $fields ) ) {
		array_map( function ( $field ) use ( $post ) {
			update_post_meta( $post->ID, $field['name'], $field['value'] );
		}, $fields );
	}
	// 话题
	$topics = $request->get_param( "topics" );
	if ( is_array( $topics ) ) {
		wp_set_post_terms( $post->ID, implode( ',', $topics ), 'topic' );
	}
}

add_action( "rest_insert_note", "set_custom_fields", 10, 3 );
