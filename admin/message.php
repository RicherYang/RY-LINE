<?php

final class RY_LINE_Admin_Message
{
    protected static $_instance = null;

    public static function instance(): RY_LINE_Admin_Message
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
            self::$_instance->do_init();
        }

        return self::$_instance;
    }

    protected function do_init(): void
    {
        add_filter('quick_edit_enabled_for_post_type', [$this, 'skip_quick_edit'], 10, 2);
        add_filter('manage_' . RY_LINE::POSTTYPE_MESSAGE . '_posts_columns', [$this, 'add_columns']);
        add_filter('manage_' . RY_LINE::POSTTYPE_MESSAGE . '_posts_custom_column', [$this, 'show_columns'], 10, 2);
        add_filter('wp_insert_post_data', [$this, 'change_post_data']);
        add_action('save_post_' . RY_LINE::POSTTYPE_MESSAGE, [$this, 'save_date'], 10, 2);
    }

    public function skip_quick_edit($enabled, $post_type)
    {
        if ($post_type === RY_LINE::POSTTYPE_MESSAGE) {
            return false;
        }

        return $enabled;
    }

    public function add_columns($columns)
    {
        $add_index = array_search('author', array_keys($columns));
        $pre_array = array_splice($columns, 0, $add_index);
        return array_merge($pre_array, [
            'mtype' => __('Message type', 'ry-line'),
            'autosend' => __('Automatic send', 'ry-line'),
        ], $columns);
    }

    public function show_columns($column_name, $post_ID)
    {
        static $autosend_events = null;
        if (null === $autosend_events) {
            $autosend_events = apply_filters('ry/line_autosend_events', []);
        }

        if ('mtype' === $column_name) {
            $message_type = get_post_meta($post_ID, 'ry_line_message_type', true);
            switch ($message_type) {
                case 'text':
                    echo esc_html_x('Text', 'message type', 'ry-line');
                    break;
                case 'image':
                    echo esc_html_x('Image', 'message type', 'ry-line');
                    break;
                case 'flex':
                    echo esc_html_x('Flex single', 'message type', 'ry-line');
                    break;
                case 'flexes':
                    echo esc_html_x('Flex multiple', 'message type', 'ry-line');
                    break;
            }
        }
        if ('autosend' === $column_name) {
            switch (get_post_meta($post_ID, 'ry_line_message_reply_type', true)) {
                case 'keyword':
                    $reply_keyword = get_post_meta($post_ID, 'ry_line_message_reply', true);
                    if (!empty($reply_keyword)) {
                        echo esc_html__('Reply keyword: ', 'ry-line') . esc_html($reply_keyword) . '<br>';
                    }
                    break;
                case 'all-nokeyword':
                    echo esc_html__('Reply all without keyword', 'ry-line') . '<br>';
                    break;
                default:
                    break;
            }

            $used_events = [];
            $autosend = get_post_meta($post_ID, 'ry_line_message_autosend');
            foreach ($autosend_events as $event_key => $event_label) {
                if (in_array($event_key, $autosend)) {
                    $used_events[] = $event_label;
                }
            }
            if (count($used_events)) {
                echo esc_html__('Autosend events: ', 'ry-line') . esc_html(implode(__(', ', 'ry-line'), $used_events)) . '<br>';
            }
        }
    }

    public function change_post_data($data)
    {
        if ($data['post_type'] === RY_LINE::POSTTYPE_MESSAGE) {
            if (isset($_POST['message-type'])) {
                $data['post_content'] = '';
                $data['post_excerpt'] = '';
                $data['menu_order'] = intval($_POST['message-order'] ?? '');
                $data['menu_order'] = $data['menu_order'] > 0 ? $data['menu_order'] : 0;

                switch ($_POST['message-type']) {
                    case 'text':
                        $data['post_content'] = sanitize_textarea_field(wp_unslash($_POST['message-content']));
                        break;
                    case 'flex':
                        $data['post_content'] = sanitize_textarea_field(wp_unslash($_POST['flex-message-content']));
                        $data['post_content'] = json_decode($data['post_content']);
                        if ($data['post_content'] === null) {
                            $data['post_content'] = '';
                        }
                        $data['post_content'] = maybe_serialize($data['post_content']);
                        $data['post_excerpt'] = sanitize_textarea_field(wp_unslash($_POST['message-alt']));
                        break;
                    case 'flexes':
                        $data['post_excerpt'] = sanitize_textarea_field(wp_unslash($_POST['message-alt']));
                        break;
                }
            }
        }

        return $data;
    }

    public function save_date($post_ID, $post)
    {
        global $wpdb;

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (!in_array($post->post_status, ['auto-draft', 'draft', 'publish'], true)) {
            return;
        }

        $message_data = get_post_meta($post_ID, 'ry_line_message_data', true);
        if (!is_array($message_data)) {
            $message_data = [];
        }

        unset($message_data['error']);
        $message_type = sanitize_key($_POST['message-type'] ?? '');
        update_post_meta($post_ID, 'ry_line_message_type', $message_type);

        $message_data['reply_from'] = array_map('sanitize_key', is_array($_POST['reply-from'] ?? '') ? $_POST['reply-from'] : []);
        $message_data['send_cc_lineid'] = sanitize_locale_name($_POST['cc-user-id'] ?? '');
        $message_data['reply_from'] = array_intersect($message_data['reply_from'], ['user', 'group', 'room']);
        if (count($message_data['reply_from']) === 3) {
            $message_data['reply_from'] = [];
        }
        switch ($message_type) {
            case 'flexes':
                $message_data['use'] = array_map('intval', is_array($_POST['use-messages'] ?? '') ? $_POST['use-messages'] : []);
                $query = new WP_Query();
                $message_data['use'] = $query->query([
                    'post_type' => RY_LINE::POSTTYPE_MESSAGE,
                    'post__in' => $message_data['use'],
                    'orderby' => 'menu_order',
                    'order' => 'DESC',
                    'fields' => 'ids',
                    'posts_per_page' => -1,
                ]);
                break;
        }
        update_post_meta($post_ID, 'ry_line_message_data', $message_data);

        $reply_type = sanitize_key($_POST['reply-type'] ?? '');
        switch ($reply_type) {
            case 'keyword':
                update_post_meta($post->ID, 'ry_line_message_reply_type', $reply_type);
                update_post_meta($post_ID, 'ry_line_message_reply', sanitize_text_field(wp_unslash($_POST['reply-keyword'] ?? '')));
                break;
            case 'all-nokeyword':
                update_post_meta($post->ID, 'ry_line_message_reply_type', $reply_type);
                delete_post_meta($post_ID, 'ry_line_message_reply');
                break;
            default:
                delete_post_meta($post_ID, 'ry_line_message_reply_type');
                delete_post_meta($post_ID, 'ry_line_message_reply');
                break;
        }

        $post_event = array_map('sanitize_text_field', is_array($_POST['autosend-event'] ?? '') ? $_POST['autosend-event'] : []);
        $pre_autosend = get_post_meta($post_ID, 'ry_line_message_autosend');
        $pre_autosend = array_fill_keys($pre_autosend, true);
        $autosend_hooks = RY_LINE::get_option('autosend_hooks', []);
        foreach ($post_event as $event_key) {
            if (!isset($pre_autosend[$event_key])) {
                add_post_meta($post_ID, 'ry_line_message_autosend', $event_key, false);
            }
            unset($pre_autosend[$event_key]);

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
        if (count($pre_autosend)) {
            foreach ($pre_autosend as $autosend => $true) {
                delete_post_meta($post_ID, 'ry_line_message_autosend', $autosend);
            }
            as_schedule_single_action(time() + HOUR_IN_SECONDS, RY_LINE::OPTION_PREFIX . 'check_autosend_hooks', [], 'ry-line', true);
        }
        RY_LINE::update_option('autosend_hooks', $autosend_hooks, true);

        if ($post->post_status === 'auto-draft') {
            return;
        }

        $template_info = (object) [
            'wp_user' => wp_get_current_user(),
        ];
        $message_object = RY_LINE_Api::build_message_object([get_post($post_ID)], $template_info);
        if ($message_object) {
            $status = RY_LINE_Api::message_validate($message_object);
            if (is_wp_error($status)) {
                $error = $status->get_error_data();
                $message_data['error'] = $error->message;
                foreach ($error->details as $detail) {
                    $message_data['error'] .= "\n" . ($detail->property ?? '') . ' ( ' . $detail->message . ' )';
                }
                update_post_meta($post_ID, 'ry_line_message_data', $message_data);
            } else {
                if ($post->post_status !== 'publish') {
                    $wpdb->update($wpdb->posts, ['post_status' => 'publish'], ['ID' => $post_ID]);
                    wp_transition_post_status('publish', $post->post_status, $post);
                }
                return;
            }
        }
        if ($post->post_status !== 'draft') {
            $wpdb->update($wpdb->posts, ['post_status' => 'draft'], ['ID' => $post_ID]);
            wp_transition_post_status('draft', $post->post_status, $post);
        }
    }
}

RY_LINE_Admin_Message::instance();
