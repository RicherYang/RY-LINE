<?php

defined('ABSPATH') or exit;

use RY\Paid\V20260727\AbstractLinkServer;

final class RY_LINE_LinkServer extends AbstractLinkServer
{
    private static ?self $_instance = null;

    protected string $plugin_slug = 'ry-line';

    public static function instance(): RY_LINE_LinkServer
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
        }

        return self::$_instance;
    }

    protected function get_base_info(): array
    {
        return [
            'plugin' => RY_LINE_VERSION,
        ];
    }
}
