<?php

final class RY_LINE_Admin_Meta_Box
{
    public static function init_metabox()
    {
        add_action('add_meta_boxes_' . RY_LINE::POSTTYPE_MESSAGE, [__CLASS__, 'add_message_metabox']);
        add_action('add_meta_boxes_' . RY_LINE::POSTTYPE_RICHERMENU, [__CLASS__, 'add_richmenu_metabox']);
    }

    public static function add_message_metabox($post)
    {
        remove_meta_box('submitdiv', '', 'side');
        remove_meta_box('slugdiv', '', 'normal');

        add_meta_box('ry-line-message-action', __('Action area', 'ry-line'), [__CLASS__, 'display_message_action'], null, 'side', 'high');
        add_meta_box('ry-line-message-content', __('Message content', 'ry-line'), [__CLASS__, 'display_message_content'], '', 'normal', 'core');
        add_meta_box('ry-line-message-autosend', __('Automatic send', 'ry-line'), [__CLASS__, 'display_message_autosend'], '', 'normal', 'core');

        $asset_info = include RY_LINE_PLUGIN_DIR . 'assets/admin/meta-box.asset.php';
        wp_enqueue_style('ry-line-admin-meta-box', RY_LINE_PLUGIN_URL . 'assets/admin/meta-box.css', [], $asset_info['version']);
        array_unshift($asset_info['dependencies'], 'ry-line-admin');
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
    }

    public static function add_richmenu_metabox($post)
    {
        remove_meta_box('submitdiv', '', 'side');
        remove_meta_box('slugdiv', '', 'normal');

        add_meta_box('ry-line-richmenu-action', __('Action area', 'ry-line'), [__CLASS__, 'display_richmenu_action'], null, 'side', 'high');
        add_meta_box('ry-line-richmenu-operate', __('LINE Operation', 'ry-line'), [__CLASS__, 'display_richmenu_operate'], null, 'side', 'core');
        add_meta_box('ry-line-richmenu-content', __('Menu content', 'ry-line'), [__CLASS__, 'display_richmenu_content'], null, 'advanced', 'high');
        add_meta_box('ry-line-image-area', __('Image action area', 'ry-line'), [__CLASS__, 'display_image_area'], null, 'advanced');

        $asset_info = include RY_LINE_PLUGIN_DIR . 'assets/admin/meta-box.asset.php';
        wp_enqueue_style('ry-line-admin-meta-box', RY_LINE_PLUGIN_URL . 'assets/admin/meta-box.css', [], $asset_info['version']);
        array_unshift($asset_info['dependencies'], 'ry-line-admin');
        wp_enqueue_script('ry-line-admin-meta-box', RY_LINE_PLUGIN_URL . 'assets/admin/meta-box.js', $asset_info['dependencies'], $asset_info['version'], true);

        wp_localize_script('ry-line-admin-meta-box', 'RYLineMetabox', [
            'nonce' => [
                'get' => wp_create_nonce('get-image-areas_' . $post->ID),
                'position' => wp_create_nonce('save-image-position_' . $post->ID),
                'actions' => wp_create_nonce('save-image-actions_' . $post->ID),

                'create' => wp_create_nonce('remote-richmenu-create_' . $post->ID),
                'default' => wp_create_nonce('remote-richmenu-default_' . $post->ID),
                'delete' => wp_create_nonce('remote-richmenu-delete_' . $post->ID),
                'alias' => wp_create_nonce('remote-richmenu-alias_' . $post->ID),
                'test' => wp_create_nonce('remote-richmenu-test_' . $post->ID),
            ],
        ]);
    }

    public static function display_message_action($post)
    {
        $message_data = get_post_meta($post->ID, 'ry_line_message_data', true);

        include RY_LINE_PLUGIN_DIR . 'admin/html/message-action.php';
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

        $autosend_events = apply_filters('ry/line_autosend_events', []);

        include RY_LINE_PLUGIN_DIR . 'admin/html/message-autosend.php';
    }

    public static function display_message_content($post)
    {
        $message_data = get_post_meta($post->ID, 'ry_line_message_data', true);
        switch ($message_data['type']) {
            case 'flex':
                $post->post_content = maybe_unserialize($post->post_content);
                if (is_object($post->post_content)) {
                    $post->post_content = wp_json_encode($post->post_content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
                } else {
                    $post->post_content = '';
                }
                break;
        }

        include RY_LINE_PLUGIN_DIR . 'admin/html/message-content.php';
    }

    public static function display_richmenu_action($post)
    {
        $richMenuId = get_post_meta($post->ID, 'ry_line_richmenu_richMenuId', true);

        include RY_LINE_PLUGIN_DIR . 'admin/html/richmenu-action.php';
    }

    public static function display_richmenu_operate($post)
    {
        if (!RY_LINE_License::instance()->is_activated()) {
            $link = sprintf('<a href="%1$s">%2$s</a>', admin_url('admin.php?page=ry-license'), esc_html__('license key', 'ry-line'));
            /* translators: %s: license key link */
            echo '<div class="misc-pub-section">' . sprintf(esc_html__('Please activate %s to use this feature.', 'ry-line'), $link) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
            return;
        }

        if (!has_post_thumbnail($post)) {
            echo '<div class="misc-pub-section">' . esc_html__('Please set show image first.', 'ry-line') . '</div>';
            return;
        }

        $richMenuId = get_post_meta($post->ID, 'ry_line_richmenu_richMenuId', true);
        $richMenuAliasId = get_post_meta($post->ID, 'ry_line_richmenu_richMenuAliasId', true);
        $default_ID = RY_LINE::get_option('richmenu_default');
        $line_user_ID = RY_LINE::get_option('test_user_id');

        include RY_LINE_PLUGIN_DIR . 'admin/html/richmenu-operate.php';
    }

    public static function display_richmenu_content($post)
    {
        $richMenuId = get_post_meta($post->ID, 'ry_line_richmenu_richMenuId', true);
        $richmenu_data = get_post_meta($post->ID, 'ry_line_richmenu_data', true);

        include RY_LINE_PLUGIN_DIR . 'admin/html/richmenu-content.php';
    }

    public static function display_image_area($post)
    {
        if (!has_post_thumbnail($post)) {
            echo '<p>' . esc_html__('Please set show image first.', 'ry-line') . '</p>';
            return;
        }

        $thumbnail_ID = get_post_thumbnail_id($post);
        $thumbnail_src = wp_get_attachment_image_src($thumbnail_ID, 'full');

        include RY_LINE_PLUGIN_DIR . 'admin/html/image-area.php';
    }
}

RY_LINE_Admin_Meta_Box::init_metabox();
