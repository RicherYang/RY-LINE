<?php

final class RY_LINE_User
{
    public const MAYPE_USER_META_KEY = [
        'ry_line_user_id',
        'wc_notify_line_user_id', // OrderNotify for WooCommerce
    ];

    protected static $_instance = null;

    public static function instance(): RY_LINE_User
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
            self::$_instance->do_init();
        }

        return self::$_instance;
    }

    protected function do_init(): void {}

    public function get_wp_user(string $line_user_ID)
    {
        foreach (self::MAYPE_USER_META_KEY as $meta_key) {
            $query = new WP_User_Query([
                'meta_query' => [
                    [
                        'key' => $meta_key,
                        'value' => $line_user_ID,
                        'compare' => '=',
                    ],
                ],
                'number' => 1,
            ]);
            $wp_user = $query->get_results();
            if (!empty($wp_user)) {
                return $wp_user[0];
            }
        }
    }
}

RY_LINE_User::instance();
