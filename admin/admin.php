<?php

include_once RY_LINE_PLUGIN_DIR . 'includes/ry-global/abstract-admin.php';

final class RY_LINE_Admin extends RY_Abstract_Admin
{
    protected static $_instance = null;

    public static function instance(): RY_LINE_Admin
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
            self::$_instance->do_init();
        }

        return self::$_instance;
    }

    protected function do_init(): void
    {
        parent::do_init();

        $this->license = RY_LINE_License::instance();
        add_filter('ry-plugin/license_list', [$this, 'add_license']);

        add_action('admin_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('add_meta_boxes', [$this, 'load_meta_boxes']);
        include_once RY_LINE_PLUGIN_DIR . 'admin/media.php';
        include_once RY_LINE_PLUGIN_DIR . 'admin/message.php';
        include_once RY_LINE_PLUGIN_DIR . 'admin/richmenu.php';

        if (defined('DOING_AJAX') && DOING_AJAX) {
            include_once RY_LINE_PLUGIN_DIR . 'admin/ajax.php';
        }

        if ($this->license->is_activated()) {
            $this->license->check_expire_cron();
            include_once RY_LINE_PLUGIN_DIR . 'admin/page/option.php';
            include_once RY_LINE_PLUGIN_DIR . 'admin/page/tools.php';

            add_filter('ry-plugin/menu_list', [$this, 'add_menu']);
        }
    }

    public function add_license($license_list): array
    {
        $license_list[RY_LINE_PLUGIN_BASENAME] = [
            'name' => $this->license::$main_class::PLUGIN_NAME,
            'license' => $this->license,
            'version' => RY_LINE_VERSION,
            'basename' => RY_LINE_PLUGIN_BASENAME,
        ];

        return $license_list;
    }

    public function enqueue_scripts()
    {
        $asset_info = include RY_LINE_PLUGIN_DIR . 'assets/admin/basic.asset.php';
        wp_register_script('ry-line-admin', RY_LINE_PLUGIN_URL . 'assets/admin/basic.js', $asset_info['dependencies'], $asset_info['version'], true);
    }

    public function load_meta_boxes()
    {
        include_once RY_LINE_PLUGIN_DIR . 'admin/meta-boxes.php';
    }

    public function add_menu($menu_list)
    {
        $menu_list[] = [
            'name' => 'LINE',
            'slug' => 'ry-line',
            'function' => [$this, 'goto_page'],
        ];

        return $menu_list;
    }

    public function goto_page()
    {
        wp_safe_redirect(admin_url('admin.php?page=ry-line-option'));
        exit;
    }
}
