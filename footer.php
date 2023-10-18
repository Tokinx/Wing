</div><!-- content -->
</main><!-- main -->
</section><!-- core -->

<footer id="footer">
    <div class="d-flex flex-center justify-between flex-wrap">
        <div class='left'>
            <span>&copy; <?= date( 'Y' ) ?> <a
                        href="<?= get_bloginfo( 'url' ) ?>"><?= get_bloginfo( 'name' ) ?></a></span>
        </div>
        <div class='right'>
            <span>Theme by <a class="theme-name" href="https://biji.io" target="_blank"><?= THEME_NAME ?></a></span>
        </div>
    </div>
    <div class="text-center text-tiny mt-2 w-100" style="opacity: 0.2;">
        <?php if ( $code = get_icp_num() ) { ?>
            <span class="mx-1"><a href="https://beian.miit.gov.cn" target="_blank"><?= $code; ?></a></span>
        <?php } ?>
        <?php if ( $code = get_theme_mod( 'biji_setting_net' ) ) { ?>
            <span class="mx-1"><a href="https://www.beian.gov.cn/portal/registerSystemInfo"
                                  target="_blank"><?= $code; ?></a></span>
        <?php } ?>
    </div>

    <div class="scroll-tools mr-2">
        <div class="dropdown" hover-show perspective>
            <a class="btn btn-link btn-action uni-bg bg-blur uni-shadow dropdown-toggle flex-center"
               href="javascript:void(0);" tabindex="0">
                <i class="czs-clothes-l"></i>
            </a>
            <ul class="menu menu-left mode-switch uni-card uni-bg bg-blur uni-shadow text-center" @click="toggleSkinMode">
                <li v-for="item of modeList" class="menu-item">
                    <a class="flex-center" :data-mode="item.mode" href="javascript:void(0);">
                        <i :class="[item.icon, 'mr-1']"></i>{{ item.name }}
                    </a>
                </li>
            </ul>
        </div>
        <div style="height: 0.4rem;"></div>
        <div class="dropdown" hover-show perspective>
            <a class="btn btn-link btn-action uni-bg bg-blur uni-shadow dropdown-toggle flex-center"
               href="javascript:void(0);" tabindex="0">
                <i class="czs-earth"></i>
            </a>
            <ul class="menu menu-left mode-switch uni-card uni-bg bg-blur uni-shadow" @click="toggleLanguage">
                <li v-for="item of langList" class="menu-item">
                    <a class="flex-center" :data-mode="item.mode" href="javascript:void(0);">
                        <i :class="[item.icon, 'mr-1']"></i>{{ item.name }}
                    </a>
                </li>
            </ul>
        </div>
        <div style="height: 0.4rem;"></div>
        <a class="scroll-top btn btn-link btn-action uni-bg bg-blur uni-shadow flex-center"
           href="javascript: $h.scrollTo();">
            <i class="czs-rocket"></i>
        </a>
    </div>
</footer>

<script data-no-instant>
    function _exReload() {
        <?php if (get_theme_mod( 'biji_setting_lately', true )) { ?>
        (() => {
            let _op = undefined;
            if ( !["zh_SC", "zh_CN"].includes($lang.lang) ) {
                _op = { target: 'time', lang: $lang.options("Lately") }
            }
            window.Lately && Lately.init(_op);
        })();
        <?php }  if (get_theme_mod( 'biji_setting_view_image', true )) { ?>
        window.ViewImage && ViewImage.init();
        <?php } if (get_theme_mod( 'biji_setting_prettify', true )) { ?>
        window.prettyPrint && prettyPrint();
        <?php }
        echo get_theme_mod( 'biji_setting_foot_script' ) ?: "";
        ?>
        if ( window.WP_DOUBAN && document.querySelector('.db--container') ) {
            new WP_DOUBAN();
        }
    }
</script>
</div>
<?php wp_footer(); ?>
<!--网站效率：<?php timer_stop( 4 ); ?>秒内查询了<?= get_num_queries(); ?>次数据库-->
</body>

</html>