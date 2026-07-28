<?php

namespace RY\Line;

defined('ABSPATH') or exit;

use RY\General\V20260727\Logs;

final class Update
{
    public static function update()
    {
        $now_version = Main::get_option('version', '0.0.0');

        if (RY_LINE_VERSION === $now_version) {
            return;
        }

        if ($now_version === '0.0.0') {
            Main::update_option('version', RY_LINE_VERSION, true);
            return;
        }

        if (version_compare($now_version, '0.5.5', '<')) {
            add_action('init', function () {
                $wp_query = new \WP_Query();
                $messages = $wp_query->query([
                    'post_type' => Main::POSTTYPE_MESSAGE,
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

                as_enqueue_async_action(Main::OPTION_PREFIX . 'update_0_5_5', [], 'ry-line', true);
            });

            Main::update_option('version', '0.5.5', true);
        }

        if (version_compare($now_version, '2026.7.27', '<')) {
            $old_dir = WP_CONTENT_DIR . '/ry-logs';
            if (is_dir($old_dir)) {
                $new_dir = Logs::get_log_directory();
                foreach (new \FilesystemIterator($old_dir, \FilesystemIterator::SKIP_DOTS) as $file) {
                    @rename($file->getPathname(), $new_dir . $file->getFilename());
                }
                @rmdir($old_dir);
            }
            add_action('init', [Logs::class, 'set_cron_job']);

            Main::update_option('version', '2026.7.27', true);
        }
    }
}
