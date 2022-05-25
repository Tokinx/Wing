</div><!-- content -->
</main><!-- main -->
</section><!-- core -->

<footer id="footer">
    <div class="d-flex flex-center justify-between">
        <div class='left'>
            <span>&copy; <?= date( 'Y' ) ?> <a
                        href="<?= get_bloginfo( 'url' ) ?>"><?= get_bloginfo( 'name' ) ?></a></span>
			<?php if ( get_icp_num() ) { ?>
                <span> . <a href="https://beian.miit.gov.cn/" target="_blank"><?= get_icp_num(); ?></a></span>
			<?php } ?>
        </div>
        <div class='right'>
            <span>Theme by <a class="theme-name" href="https://biji.io" target="_blank"><?= THEME_NAME ?></a></span>
        </div>
    </div>
</footer>

<script data-no-instant>
    function _exReload() {
		<?php if (get_theme_mod( 'biji_setting_lately', true )) { ?>
        window.Lately && Lately.init();
		<?php }  if (get_theme_mod( 'biji_setting_view_image', true )) { ?>
        window.ViewImage && ViewImage.init();
		<?php } if (get_theme_mod( 'biji_setting_prettify', true )) { ?>
        window.prettyPrint && prettyPrint();
		<?php } ?>
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