<?php

include_once RY_LINE_PLUGIN_DIR . 'includes/ry-global/abstract-link-server.php';

final class RY_LINE_LinkServer extends RY_Abstract_Link_Server
{
    protected static $_instance = null;

    protected $plugin_slug = 'ry-line';

    public static function instance(): RY_LINE_LinkServer
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
        }

        return self::$_instance;
    }

    protected function get_base_info(): array
    {
        $base_info = [
            'plugin' => RY_LINE_VERSION,
            'php' => PHP_VERSION,
            'wp' => get_bloginfo('version'),
        ];
        if (defined('WC_VERSION')) {
            $base_info['wc'] = WC_VERSION;
        }
        return $base_info;
    }

    protected function get_user_agent()
    {
        return sprintf(
            'RY_LINE %s (WordPress/%s)',
            RY_LINE_VERSION,
            get_bloginfo('version'),
        );
    }
}
