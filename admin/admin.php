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

        if ($this->license->is_activated()) {
            $this->license->check_expire_cron();
            include_once RY_LINE_PLUGIN_DIR . 'admin/page/option.php';

            add_filter('ry-plugin/menu_list', [$this, 'add_menu']);
        }
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

    public function add_license($license_list): array
    {
        $license_list[] = [
            'name' => $this->license::$main_class::PLUGIN_NAME,
            'license' => $this->license,
            'version' => RY_LINE_VERSION,
            'basename' => RY_LINE_PLUGIN_BASENAME,
        ];

        return $license_list;
    }
}
