<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
	<?php wp_head(); ?>
</head>

<body class="<?php the_skin_mode(); ?>">
<div id="app" :class="['layout', animation]" style="display: none;" v-show="true">
    <header id="header" class="flex-center justify-between">
        <hgroup class="logo">
            <h1 class="fullname">
                <a href="<?php bloginfo( 'url' ); ?>"><?php bloginfo( 'name' ); ?></a>
            </h1>
        </hgroup>
        <section class="header__right d-flex">
            <form method="get" action="<?php bloginfo( 'url' ); ?>" class="search mr-2">
                <input class="search-key s-circle" name="s" placeholder="输入关键词..." type="text" required="required"/>
                <i class="text-small czs-search-l flex-center"></i>
            </form>
            <div class="dropdown" hover-show perspective>
                <a class="right-btn dropdown-toggle flex-center s-circle" href="javascript:void(0);" tabindex="0">
                    <i class="czs-clothes-l text-small"></i>
                </a>
                <ul class="menu menu-left mode-switch uni-card bg-blur" @click="toggleSkinMode">
                    <li v-for="item of modeList" class="menu-item">
                        <a class="flex-center" :data-mode="item.mode" href="javascript:void(0);">
                            <i :class="[item.icon, 'mr-1']"></i>{{ item.name }}
                        </a>
                    </li>
                </ul>
            </div>
            <a class="right-btn menu-btn off-canvas-toggle flex-center ml-2" href="#aside">
                <i class="czs-menu-l"></i>
            </a>
        </section>
    </header>
    <section id="core" class="container off-canvas off-canvas-sidebar-show">
        <!-- Aside -->
        <aside id="aside" class="off-canvas-sidebar">
            <section class="sticky">
				<?php
				foreach ( [ 'header_nav', 'footer_nav' ] as $name ) {
					if ( has_nav_menu( $name ) ) {
						wp_nav_menu( [
							'container'      => false,
							'theme_location' => $name,
							'items_wrap'     => '<ul class="header-nav reset-ul uni-bg uni-shadow ' . $name . '">%3$s</ul>',
							'depth'          => 0,
						] );
					}
				}
				dynamic_sidebar( 'aside-widget-area' );
				?>
            </section>
        </aside>
        <a class="off-canvas-overlay" href="#close"></a>
        <!-- Main -->
        <main id="main" class="uni-bg uni-shadow off-canvas-content">
            <div class="content">