<?php

namespace RY\Line\Admin\MetaBoxes;

defined('ABSPATH') or exit;

final class Message
{
    public static function init_meta_boxes()
    {
        add_action('add_meta_boxes_' . \RY_LINE::POSTTYPE_MESSAGE, [__CLASS__, 'add_message_metabox']);
    }

    public static function add_message_metabox($post)
    {
        remove_meta_box('submitdiv', '', 'side');

        add_meta_box('ry-line-message-action', __('Action area', 'ry-line'), [__CLASS__, 'display_message_action'], null, 'side', 'high');
        add_meta_box('ry-line-message-info', __('Message content', 'ry-line'), [__CLASS__, 'display_message_info'], '', 'normal', 'core');
        add_meta_box('ry-line-message-autosend', __('Automatic send', 'ry-line'), [__CLASS__, 'display_message_autosend'], '', 'normal', 'core');

        $asset_info = include RY_LINE_PLUGIN_DIR . 'assets/admin/meta-box.asset.php';
        wp_enqueue_style('ry-line-admin-meta-box', RY_LINE_PLUGIN_URL . 'assets/admin/meta-box.css', [], $asset_info['version']);
        $asset_info['dependencies'][] = 'ry-line-admin';
        wp_enqueue_script('ry-line-admin-meta-box', RY_LINE_PLUGIN_URL . 'assets/admin/meta-box.js', $asset_info['dependencies'], $asset_info['version'], true);

        wp_localize_script('ry-line-admin-meta-box', 'RYLineMetabox', [
            'templateString' => apply_filters('ry/line_template_string', []),
            'nonce' => [
                'get' => wp_create_nonce('get-image-areas_' . $post->ID),
                'position' => wp_create_nonce('save-image-position_' . $post->ID),
                'actions' => wp_create_nonce('save-image-actions_' . $post->ID),

                'testsend' => wp_create_nonce('remote-message-testsend_' . $post->ID),
            ],
        ]);

        $asset_info = include RY_LINE_PLUGIN_DIR . 'assets/admin/flex-message.asset.php';
        wp_enqueue_style('ry-line-admin-flex-message', RY_LINE_PLUGIN_URL . 'assets/admin/flex-message.css', ['wp-color-picker'], $asset_info['version']);
        $asset_info['dependencies'][] = 'wp-color-picker';
        wp_enqueue_script('ry-line-admin-flex-message', RY_LINE_PLUGIN_URL . 'assets/admin/flex-message.js', $asset_info['dependencies'], $asset_info['version'], true);
        wp_set_script_translations('ry-line-admin-flex-message', 'ry-line', RY_LINE_PLUGIN_DIR . 'languages');

        wp_localize_script('ry-line-admin-flex-message', 'ryLineFlex', [
            'nonce' => [
                'get' => wp_create_nonce('get-flex_' . $post->ID),
            ],
        ]);
    }

    public static function display_message_action($post)
    {
        $message_data = get_post_meta($post->ID, 'ry_line_message_data', true);

        include __DIR__ . '/html/message-action.php';
    }

    public static function display_message_autosend($post)
    {
        $message_data = get_post_meta($post->ID, 'ry_line_message_data', true);
        $reply_type = get_post_meta($post->ID, 'ry_line_message_reply_type', true);
        $reply_keyword = get_post_meta($post->ID, 'ry_line_message_reply', true);
        $autosend = get_post_meta($post->ID, 'ry_line_message_autosend');

        if (count($message_data['reply_from']) === 0) {
            $message_data['reply_from'] = ['user', 'group', 'room'];
        }
        if (empty($message_data['send_cc_lineid'])) {
            $message_data['send_cc_lineid'] = '';
        }

        $autosend_events = apply_filters('ry/line_autosend_events', []);

        include __DIR__ . '/html/message-autosend.php';
    }

    public static function display_message_info($post)
    {
        $message_type = get_post_meta($post->ID, 'ry_line_message_type', true);
        $message_data = get_post_meta($post->ID, 'ry_line_message_data', true);
        switch ($message_type) {
            case 'flex':
                $post->post_content = maybe_unserialize($post->post_content);
                if (is_object($post->post_content)) {
                    $post->post_content = wp_json_encode($post->post_content);
                } else {
                    $post->post_content = '';
                }
                break;
        }

        include __DIR__ . '/html/message-info.php';
        include __DIR__ . '/html/message-flex-teml.php';
    }
}
