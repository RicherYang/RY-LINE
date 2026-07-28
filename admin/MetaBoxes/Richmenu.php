<?php

namespace RY\Line\Admin\MetaBoxes;

defined('ABSPATH') or exit;

use RY\Line\Main;

final class Richmenu
{
    public static function init_meta_boxes()
    {
        add_action('add_meta_boxes_' . Main::POSTTYPE_RICHERMENU, [__CLASS__, 'add_richmenu_metabox']);
    }

    public static function add_richmenu_metabox($post)
    {
        remove_meta_box('submitdiv', '', 'side');

        add_meta_box('ry-line-richmenu-action', __('Action area', 'ry-line'), [__CLASS__, 'display_richmenu_action'], null, 'side', 'high');
        add_meta_box('ry-line-richmenu-operate', __('LINE Operation', 'ry-line'), [__CLASS__, 'display_richmenu_operate'], null, 'side', 'core');
        add_meta_box('ry-line-richmenu-info', __('Menu content', 'ry-line'), [__CLASS__, 'display_richmenu_info'], null, 'advanced', 'high');
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

    public static function display_richmenu_action($post)
    {
        $richMenuId = get_post_meta($post->ID, 'ry_line_richmenu_richMenuId', true);

        include __DIR__ . '/html/richmenu-action.php';
    }

    public static function display_richmenu_operate($post)
    {
        if (!has_post_thumbnail($post)) {
            echo '<div class="misc-pub-section">' . esc_html__('Please set show image first.', 'ry-line') . '</div>';
            return;
        }

        $richMenuId = get_post_meta($post->ID, 'ry_line_richmenu_richMenuId', true);
        $richMenuAliasId = get_post_meta($post->ID, 'ry_line_richmenu_richMenuAliasId', true);
        $default_ID = Main::get_option('richmenu_default');
        $line_user_ID = Main::get_option('test_user_id');

        include __DIR__ . '/html/richmenu-operate.php';
    }

    public static function display_richmenu_info($post)
    {
        $richMenuId = get_post_meta($post->ID, 'ry_line_richmenu_richMenuId', true);
        $richmenu_data = get_post_meta($post->ID, 'ry_line_richmenu_data', true);

        include __DIR__ . '/html/richmenu-info.php';
    }

    public static function display_image_area($post)
    {
        if (!has_post_thumbnail($post)) {
            echo '<p>' . esc_html__('Please set show image first.', 'ry-line') . '</p>';
            return;
        }

        $thumbnail_ID = get_post_thumbnail_id($post);
        $thumbnail_src = wp_get_attachment_image_src($thumbnail_ID, 'full');

        include __DIR__ . '/html/image-area.php';
    }
}
