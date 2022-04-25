<?php

function get_praise( $post_id = null ) {
	$post_id = $post_id ?: get_the_ID();

	return ( get_post_meta( $post_id, 'praise', true ) ?: 0 ) + ( get_post_meta( $post_id, 'dotGood', true ) ?: 0 );
}

function the_friendly_links( $post_id = null ) {
	$post_id = $post_id ?: get_the_ID();
	$links   = json_decode( get_post_meta( $post_id, 'links', true ) ?: "[]" );
	foreach ( $links as $link ) : ?>
        <li class="column col-4 col-sm-6 p-2">
            <a class="card flex-center text-center" href="<?= $link->url ?? 'javascript:void(0);' ?>" target="_blank">
                <span class="text-break mt-2"><?= $link->name ?? '--' ?></span>
                <span class="text-gray text-tiny text-break mb-2"><?= $link->description ?? '' ?></span>
            </a>
        </li>
	<?php
	endforeach;
}
