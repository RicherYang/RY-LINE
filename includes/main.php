<?php

include_once RY_LINE_PLUGIN_DIR . 'includes/ry-global/abstract-basic.php';

final class RY_LINE extends RY_Abstract_Basic
{
    public const OPTION_PREFIX = 'RY_LINE_';

    public const PLUGIN_NAME = 'RY LINE';

    protected static $_instance = null;

    public RY_LINE_Admin $admin;

    public static function instance(): RY_LINE
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
            self::$_instance->do_init();
        }

        return self::$_instance;
    }

    protected function do_init(): void
    {
        load_plugin_textdomain('ry-line', false, plugin_basename(dirname(__DIR__)) . '/languages');

        if (is_admin()) {
            include_once RY_LINE_PLUGIN_DIR . 'includes/update.php';
            RY_LINE_update::update();
        }

        add_action('init', [$this, 'real_init']);
    }

    public function real_init(): void
    {
        include_once RY_LINE_PLUGIN_DIR . 'includes/license.php';
        include_once RY_LINE_PLUGIN_DIR . 'includes/link-server.php';
        include_once RY_LINE_PLUGIN_DIR . 'includes/updater.php';
        RY_LINE_Updater::instance();

        if (is_admin()) {
            include_once RY_LINE_PLUGIN_DIR . 'includes/ry-global/admin-license.php';
            include_once RY_LINE_PLUGIN_DIR . 'admin/admin.php';
            $this->admin = RY_LINE_Admin::instance();
        }

        if (RY_LINE_License::instance()->is_activated()) {
            include_once RY_LINE_PLUGIN_DIR . 'includes/cron.php';
            RY_LINE_Cron::add_action();

            include_once RY_LINE_PLUGIN_DIR . 'includes/line-api.php';
        }
    }

    public static function plugin_activation() {}

    public static function plugin_deactivation()
    {
        wp_unschedule_hook(self::OPTION_PREFIX . 'check_expire');
        wp_unschedule_hook(self::OPTION_PREFIX . 'check_update');
    }
}
