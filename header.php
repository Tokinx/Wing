<!DOCTYPE html>
<html class="<?php the_skin_mode(); ?>">

<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
    <?php wp_head(); ?>
    <?php if ( $_background = get_theme_mod( 'biji_setting_background', '' ) ): ?>
        <style>
            html {
                background-image: url("<?= $_background ?>");
                background-size: cover;
                background-position: center;
                background-attachment: fixed;
            }
        </style>
    <?php endif; ?>
</head>

<body>
<div id="app" :class="['layout', animation, '<?= ( $_background ? 'less-animation' : '' ) ?>']" style="display: none;"
     v-show="true">
    <header id="header" class="flex-center justify-between">
        <hgroup class="logo" itemprop="publisher" itemscope="" itemtype="https://schema.org/Organization">
            <h1 class="fullname" itemprop="logo" itemscope="" itemtype="https://schema.org/ImageObject">
                <a href="<?php bloginfo( 'url' ); ?>"><?php bloginfo( 'name' ); ?></a>
            </h1>
            <meta itemprop="name" content="<?php bloginfo( 'name' ); ?>">
            <meta itemprop="url" content="<?php bloginfo( 'url' ); ?>">
        </hgroup>
        <section class="header__right d-flex">
            <form method="get" action="<?php bloginfo( 'url' ); ?>" class="search">
                <input class="search-key btn btn-link btn-action right-btn uni-bg uni-shadow" name="s" placeholder="Please enter..." type="text"
                       required="required"/>
                <i class="text-small czs-search-l flex-center"></i>
            </form>
            <a class="btn btn-link btn-action right-btn uni-bg uni-shadow menu-btn off-canvas-toggle flex-center ml-2" href="#aside">
                <i class="text-large czs-menu-l flex-center"></i>
            </a>
        </section>
    </header>
    <section id="core" class="container off-canvas off-canvas-sidebar-show">
        <!-- Aside -->
        <aside id="aside" class="off-canvas-sidebar">
            <div class="probes"></div>
            <section class="sticky">
                <?php if ( is_single() && get_theme_mod( 'biji_setting_toc', true ) && ( $_toc = get_post_toc() ) ) : ?>
                    <input type="radio" id="tab-toc" name="aside-radio" hidden checked>
                    <input type="radio" id="tab-nav" name="aside-radio" hidden>
                    <ul class="aside-tab">
                        <li class="toc-active">
                            <label for="tab-toc" class="c-hand flex flex-center"><i class="czs-read-l"></i></label>
                        </li>
                        <li class="nav-active">
                            <label for="tab-nav" class="c-hand flex flex-center"><i
                                        class="czs-choose-list-l"></i></label>
                        </li>
                    </ul>
                    <?php print $_toc;
                endif;
                foreach ( [ 'header_nav', 'footer_nav' ] as $name ) {
                    if ( has_nav_menu( $name ) ) {
                        wp_nav_menu( [
                            'container'      => false,
                            'theme_location' => $name,
                            'menu_class'     => $name . ' reset-ul uni-bg uni-shadow ',
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