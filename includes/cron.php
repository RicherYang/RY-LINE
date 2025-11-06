<?php

final class RY_LINE_Cron
{
    public static function add_action(): void
    {
        add_action(RY_LINE::OPTION_PREFIX . 'check_expire', [__CLASS__, 'check_expire']);

        add_action(RY_LINE::OPTION_PREFIX . 'check_autosend_hooks', [__CLASS__, 'check_autosend_hooks']);
    }

    public static function check_expire(): void
    {
        RY_LINE_License::instance()->check_expire();
    }

    public static function check_autosend_hooks(): void
    {
        $autosend_hooks = [];

        $query = new WP_Query();
        $messages = $query->query([
            'post_type' => RY_LINE::POSTTYPE_MESSAGE,
            'posts_per_page' => -1,
            'post_status' => 'publish',
            'meta_query' => [
                [
                    'key' => 'ry_line_message_autosend',
                    'compare' => 'EXISTS',
                ],
            ],
            'fields' => 'ids',
        ]);
        $added_event = [];
        foreach ($messages as $message_ID) {
            $post_event = get_post_meta($message_ID, 'ry_line_message_autosend');
            foreach ($post_event as $event_key) {
                if (isset($added_event[$event_key])) {
                    continue;
                }
                $added_event[$event_key] = true;

                $autosend_info = apply_filters('ry/line_autosend_info-' . $event_key, null);
                if (is_array($autosend_info)) {
                    $autosend_info['args'] = $autosend_info['args'] ?? 1;
                    $autosend_info['priority'] = $autosend_info['priority'] ?? 20;

                    foreach ($autosend_info['hook'] as $hook_name) {
                        if (!isset($autosend_hooks[$hook_name])) {
                            $autosend_hooks[$hook_name] = [
                                'autosend' => [],
                                'args' => $autosend_info['args'],
                                'priority' => $autosend_info['priority'],
                            ];
                        }
                        $autosend_hooks[$hook_name]['autosend'][] = $event_key;
                        $autosend_hooks[$hook_name]['autosend'] = array_unique($autosend_hooks[$hook_name]['autosend']);
                        $autosend_hooks[$hook_name]['args'] = max($autosend_hooks[$hook_name]['args'], $autosend_info['args']);
                        $autosend_hooks[$hook_name]['priority'] = min($autosend_hooks[$hook_name]['priority'], $autosend_info['priority']);
                    }
                }
            }
        }
        RY_LINE::update_option('autosend_hooks', $autosend_hooks, true);
    }
}
