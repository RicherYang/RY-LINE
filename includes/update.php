<?php

final class RY_LINE_update
{
    public static function update()
    {
        $now_version = RY_LINE::get_option('version');

        if (false === $now_version) {
            $now_version = '0.0.0';
        }
        if (RY_LINE_VERSION === $now_version) {
            return;
        }

        if (version_compare($now_version, '0.4.0', '<')) {
            RY_LINE::create_roles();

            RY_LINE::update_option('version', '0.4.0', true);
        }

        if (version_compare($now_version, '0.5.1', '<')) {
            $query = new WP_Query();
            $messages = $query->query([
                'post_type' => RY_LINE::POSTTYPE_MESSAGE,
                'posts_per_page' => -1,
                'post_status' => 'publish',
                'meta_query' => [
                    [
                        'key' => 'ry_line_message_reply',
                        'compare' => 'EXISTS',
                    ],
                ],
                'orderby' => 'menu_order',
                'order' => 'DESC',
            ]);
            foreach ($messages as $message) {
                update_post_meta($message->ID, 'ry_line_message_reply_type', 'keyword');
            }

            RY_LINE::update_option('version', '0.5.1', true);
        }
    }
}
