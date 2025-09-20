<?php

final class RY_LINE_Meta_Box_Richmenu
{
    public static function init_metabox()
    {
        add_action('add_meta_boxes_' . RY_LINE::POSTTYPE_RICHERMENU, [__CLASS__, 'add_metabox']);
    }

    public static function add_metabox($post)
    {
        remove_meta_box('submitdiv', '', 'side');
        remove_meta_box('slugdiv', '', 'normal');

        add_meta_box('ry-line-richmenu-action', __('Action area', 'ry-line'), [__CLASS__, 'display_action'], null, 'side', 'high');
        add_meta_box('ry-line-richmenu-operate', __('LINE Operation', 'ry-line'), [__CLASS__, 'display_operate'], null, 'side', 'core');
        add_meta_box('ry-line-richmenu-area', __('Action area', 'ry-line'), [__CLASS__, 'display_area'], null, 'advanced');

        $asset_info = include RY_LINE_PLUGIN_DIR . 'assets/admin/richmenu.asset.php';
        wp_enqueue_style('ry-line-admin-richmenu', RY_LINE_PLUGIN_URL . 'assets/admin/richmenu.css', [], $asset_info['version']);
        array_unshift($asset_info['dependencies'], 'ry-line-admin');
        wp_enqueue_script('ry-line-admin-richmenu', RY_LINE_PLUGIN_URL . 'assets/admin/richmenu.js', $asset_info['dependencies'], $asset_info['version'], true);

        wp_localize_script('ry-line-admin-richmenu', 'RYLineRichmenu', [
            'nonce' => [
                'get' => wp_create_nonce('get-richmenu-areas_' . $post->ID),
                'areas' => wp_create_nonce('save-richmenu-areas_' . $post->ID),
                'actions' => wp_create_nonce('save-richmenu-actions_' . $post->ID),
                'create' => wp_create_nonce('remote-richmenu-create_' . $post->ID),
                'default' => wp_create_nonce('remote-richmenu-default_' . $post->ID),
                'delete' => wp_create_nonce('remote-richmenu-delete_' . $post->ID),
                'alias' => wp_create_nonce('remote-richmenu-alias_' . $post->ID),
                'test' => wp_create_nonce('remote-richmenu-test_' . $post->ID),
            ],
        ]);
    }

    public static function display_action($post)
    {
        $richMenuId = get_post_meta($post->ID, 'ry_line_richmenu_richMenuId', true);

        include RY_LINE_PLUGIN_DIR . 'admin/meta-boxes/html/richmenu-action.php';
    }

    public static function display_operate($post)
    {
        if (!RY_LINE_License::instance()->is_activated()) {
            $link = sprintf('<a href="%1$s">%2$s</a>', admin_url('admin.php?page=ry-license'), esc_html__('license key', 'ry-line'));
            /* translators: %s: license key link */
            echo '<div class="misc-pub-section">' . sprintf(esc_html__('Please activate %s to use this feature.', 'ry-line'), $link) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
            return;
        }

        if (!has_post_thumbnail($post)) {
            echo '<div class="misc-pub-section">' . esc_html__('Please set menu image first.', 'ry-line') . '</div>';
            return;
        }

        $richMenuId = get_post_meta($post->ID, 'ry_line_richmenu_richMenuId', true);
        $richMenuAliasId = get_post_meta($post->ID, 'ry_line_richmenu_richMenuAliasId', true);
        $default_ID = RY_LINE::get_option('richmenu_default');
        $line_user_ID = RY_LINE::get_option('test_user_id');

        include RY_LINE_PLUGIN_DIR . 'admin/meta-boxes/html/richmenu-operate.php';
    }

    public static function display_area($post)
    {
        if (!has_post_thumbnail($post)) {
            echo '<p>' . esc_html__('Please set menu image first.', 'ry-line') . '</p>';
            return;
        }

        $richMenuId = get_post_meta($post->ID, 'ry_line_richmenu_richMenuId', true);
        $richmenu_data = get_post_meta($post->ID, 'ry_line_richmenu_data', true);

        $thumbnail_ID = get_post_thumbnail_id($post);
        $thumbnail_src = wp_get_attachment_image_src($thumbnail_ID, [500, 500]);

        include RY_LINE_PLUGIN_DIR . 'admin/meta-boxes/html/richmenu-area.php';
    }
}

RY_LINE_Meta_Box_Richmenu::init_metabox();
