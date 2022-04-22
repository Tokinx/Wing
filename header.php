<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no">
    <?php wp_head(); ?>
</head>

<body class="<?php the_skin_mode(); ?>">
    <div id="app" :class="['layout', animation]" style="display: none;" v-show="true">
        <header id="header" class="flex-center justify-between">
            <hgroup class="logo">
                <h1 class="fullname">
                    <a href="<?php bloginfo('url'); ?>"><?php bloginfo('name'); ?></a>
                </h1>
            </hgroup>
            <section class="header__right d-flex">
                <form method="get" action="<?php bloginfo('url'); ?>" class="search mr-2">
                    <input class="search-key s-circle" name="s" placeholder="输入关键词..." type="text" required="required" />
                    <i class="czs-search-l flex-center"></i>
                </form>
                <?php if (get_theme_mod('biji_setting_mode') !== 'dark') { ?>
                    <a class="right-btn s-circle light-mode-btn flex-center" href="javascript:void(0);" @click="toggleSkinMode()">
                        <i class="czs-sun-l"></i>
                    </a>
                    <a class="right-btn s-circle dark-mode-btn flex-center" href="javascript:void(0);" @click="toggleSkinMode('dark')">
                        <i class="czs-moon-l"></i>
                    </a>
                <?php } ?>
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
                    foreach (['header_nav', 'footer_nav'] as $name) {
                        if (has_nav_menu($name)) wp_nav_menu([
                            'container'      => false,
                            'theme_location' => $name,
                            'items_wrap'     => '<ul class="header-nav reset-ul uni-bg ' . $name . '">%3$s</ul>',
                            'depth'          => 0,
                        ]);
                    }
                    dynamic_sidebar('aside-widget-area');
                    ?>
                </section>
            </aside>
            <a class="off-canvas-overlay" href="#close"></a>
            <!-- Main -->
            <main id="main" class="off-canvas-content">
                <div class="content">