<?php get_header();
require_once( "inc/article-content.php" );
if ( comments_open() || get_comments_number() ) :
	comments_template();
endif;
get_footer(); ?>