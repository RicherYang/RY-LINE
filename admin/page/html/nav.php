<nav class="nav-tab-wrapper wp-clearfix">
    <?php printf(
        '<a href="%1$s" class="nav-tab %2$s">%3$s</a>',
        esc_url(admin_url('admin.php?page=ry-line-tools')),
        $show_type === 'ry-line-tools' ? 'nav-tab-active' : '',
        esc_html__('Tools', 'ry-line')
    ); ?>
    <?php printf(
        '<a href="%1$s" class="nav-tab %2$s">%3$s</a>',
        esc_url(admin_url('admin.php?page=ry-line-option')),
        $show_type === 'ry-line-option' ? 'nav-tab-active' : '',
        esc_html__('Options', 'ry-line')
    ); ?>
</nav>
