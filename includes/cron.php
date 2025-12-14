<?php

final class RY_LINE_Cron
{
    public static function add_action(): void
    {
        add_action(RY_LINE::OPTION_PREFIX . 'check_expire', [__CLASS__, 'check_expire']);

        add_action(RY_LINE::OPTION_PREFIX . 'check_autosend_hooks', [__CLASS__, 'check_autosend_hooks']);

        add_action(RY_LINE::OPTION_PREFIX . 'update_0_5_5', [__CLASS__, 'update_0_5_5']);
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

    public static function update_0_5_5(): void
    {
        global $wpdb;

        @set_time_limit(60);

        $start = time();
        $query = new WP_Query();
        $messages = $query->query([
            'post_type' => RY_LINE::POSTTYPE_MESSAGE,
            'posts_per_page' => -1,
            'meta_query' => [
                [
                    'key' => 'ry_line_message_type',
                    'value' => 'flex',
                ],
            ],
        ]);

        foreach ($messages as $message) {
            $message->post_content = maybe_unserialize($message->post_content);
            if (is_object($message->post_content)) {
                if (isset($message->post_content->type) && $message->post_content->type === 'carousel') {
                    $use_messages = [];
                    foreach ($message->post_content->contents as $content) {
                        $new_message_ID = wp_insert_post([
                            'post_type' => RY_LINE::POSTTYPE_MESSAGE,
                            'post_title' => $message->post_title . ' - ' . (count($use_messages) + 1),
                            'post_status' => 'draft',
                            'post_content' => maybe_serialize($content),
                            'post_excerpt' => $message->post_excerpt,
                            'post_author' => $message->post_author,
                        ]);
                        update_post_meta($new_message_ID, 'ry_line_message_type', 'flex');
                        update_post_meta($new_message_ID, 'ry_line_message_data', [
                            'reply_from' => [],
                            'send_cc_lineid' => '',
                        ]);

                        wp_cache_delete($new_message_ID, 'posts');
                        $message_object = RY_LINE_Api::build_message_object([get_post($new_message_ID)], []);
                        if ($message_object) {
                            $status = RY_LINE_Api::message_validate($message_object);
                            if (is_wp_error($status)) {
                                $error = $status->get_error_data();
                                $message_data = get_post_meta($new_message_ID, 'ry_line_message_data', true);
                                $message_data['error'] = $error->message;
                                foreach ($error->details as $detail) {
                                    $message_data['error'] .= "\n" . ($detail->property ?? '') . ' ( ' . $detail->message . ' )';
                                }
                                update_post_meta($new_message_ID, 'ry_line_message_data', $message_data);
                            } else {
                                $wpdb->update($wpdb->posts, ['post_status' => 'publish'], ['ID' => $new_message_ID]);
                                wp_transition_post_status('publish', 'draft', get_post($new_message_ID));
                            }
                        }

                        $use_messages[] = $new_message_ID;
                    }
                    wp_update_post([
                        'ID' => $message->ID,
                        'post_status' => 'draft',
                        'post_content' => '',
                    ]);
                    update_post_meta($message->ID, 'ry_line_message_type', 'flexes');
                    $message_data = get_post_meta($message->ID, 'ry_line_message_data', true);
                    $message_data['use'] = $use_messages;
                    update_post_meta($message->ID, 'ry_line_message_data', $message_data);

                    wp_cache_delete($message->ID, 'posts');
                    $message_object = RY_LINE_Api::build_message_object([get_post($message->ID)], []);
                    if ($message_object) {
                        $status = RY_LINE_Api::message_validate($message_object);
                        if (is_wp_error($status)) {
                            $error = $status->get_error_data();
                            $message_data = get_post_meta($message->ID, 'ry_line_message_data', true);
                            $message_data['error'] = $error->message;
                            foreach ($error->details as $detail) {
                                $message_data['error'] .= "\n" . ($detail->property ?? '') . ' ( ' . $detail->message . ' )';
                            }
                            update_post_meta($message->ID, 'ry_line_message_data', $message_data);
                        } else {
                            $wpdb->update($wpdb->posts, ['post_status' => 'publish'], ['ID' => $message->ID]);
                            wp_transition_post_status('publish', 'draft', get_post($message->ID));
                        }
                    }

                    if ($start - time() > 5) {
                        as_schedule_single_action(time(), RY_LINE::OPTION_PREFIX . 'update_0_5_5', [], 'ry-line', true);
                        break;
                    }
                }
            }
        }
    }
}
