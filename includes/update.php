<?php

final class RY_LINE_update
{
    public static function update()
    {
        $now_version = RY_LINE::get_option('version', '0.0.0');

        if (RY_LINE_VERSION === $now_version) {
            return;
        }

        if (version_compare($now_version, '0.5.5', '<')) {
            add_action('init', function () {
                $query = new WP_Query();
                $messages = $query->query([
                    'post_type' => RY_LINE::POSTTYPE_MESSAGE,
                    'posts_per_page' => -1,
                    'fields' => 'ids',
                ]);
                foreach ($messages as $message_ID) {
                    $message_data = get_post_meta($message_ID, 'ry_line_message_data', true);
                    if (isset($message_data['type'])) {
                        update_post_meta($message_ID, 'ry_line_message_type', $message_data['type']);
                        unset($message_data['type']);
                        update_post_meta($message_ID, 'ry_line_message_data', $message_data);
                    }
                }

                as_enqueue_async_action(RY_LINE::OPTION_PREFIX . 'update_0_5_5', [], 'ry-line', true);
            });

            RY_LINE::update_option('version', '0.5.5', true);
        }
    }
}
