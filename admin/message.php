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

    public function change_post_data($data)
    {
        if ($data['post_type'] === RY_LINE::POSTTYPE_MESSAGE) {
            if (isset($_POST['message-type'])) {
                $data['post_content'] = '';
                $data['post_excerpt'] = '';
                $data['menu_order'] = intval($_POST['message-priority'] ?? '');
                switch ($_POST['message-type']) {
                    case 'text':
                        $data['post_content'] = sanitize_textarea_field(wp_unslash($_POST['message-content']));
                        break;
                    case 'flex':
                        $data['post_content'] = sanitize_textarea_field(wp_unslash($_POST['message-content']));
                        $data['post_content'] = json_decode($data['post_content']);
                        if ($data['post_content'] === null) {
                            $data['post_content'] = '';
                        }
                        $data['post_content'] = maybe_serialize($data['post_content']);
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
        $message_data['type'] = sanitize_key($_POST['message-type'] ?? '');
        $message_data['account_link'] = isset($_POST['account_link']);
        $message_data['reply_from'] = array_map('sanitize_key', is_array($_POST['reply_from'] ?? '') ? $_POST['reply_from'] : []);
        $message_data['reply_from'] = array_intersect($message_data['reply_from'], ['user', 'group', 'room']);
        if (count($message_data['reply_from']) === 3) {
            $message_data['reply_from'] = [];
        }

        update_post_meta($post_ID, 'ry_line_message_data', $message_data);
        update_post_meta($post_ID, 'ry_line_message_reply', sanitize_text_field(wp_unslash($_POST['reply-keyword'] ?? '')));

        if ($post->post_status === 'auto-draft') {
            return;
        }

        $message_object = RY_LINE_Api::build_message_object([get_post($post_ID)]);
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
