<?php

final class RY_LINE_Admin_Richmenu
{
    protected static $_instance = null;

    public static function instance(): RY_LINE_Admin_Richmenu
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
        add_filter('display_post_states', [$this, 'add_post_states'], 10, 2);
        add_filter('manage_' . RY_LINE::POSTTYPE_RICHERMENU . '_posts_columns', [$this, 'add_columns']);
        add_filter('manage_' . RY_LINE::POSTTYPE_RICHERMENU . '_posts_custom_column', [$this, 'show_columns'], 10, 2);
        add_action('save_post_' . RY_LINE::POSTTYPE_RICHERMENU, [$this, 'save_date'], 10, 2);
    }

    public function skip_quick_edit($enabled, $post_type)
    {
        if ($post_type === RY_LINE::POSTTYPE_RICHERMENU) {
            return false;
        }

        return $enabled;
    }

    public function add_post_states($post_states, $post)
    {
        if ($post->post_type !== RY_LINE::POSTTYPE_RICHERMENU) {
            return $post_states;
        }

        if ($post->ID == RY_LINE::get_option('richmenu_default')) {
            $post_states[] = __('Default menu', 'ry-line');
        }
        return $post_states;
    }

    public function add_columns($columns)
    {
        $add_columns = [
            'alias' => __('Menu alias', 'ry-line'),
        ];

        return array_merge(array_slice($columns, 0, 2, true), $add_columns, array_slice($columns, 2, null, true));
    }

    public function show_columns($column_name, $post_ID)
    {
        if ('alias' === $column_name) {
            echo esc_html(get_post_meta($post_ID, 'ry_line_richmenu_richMenuAliasId', true));
        }
    }

    public function save_date($post_ID, $post)
    {
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        $richmenu_data = get_post_meta($post_ID, 'ry_line_richmenu_data', true);
        if (!is_array($richmenu_data)) {
            $richmenu_data = [];
        }

        $thumbnail_ID = get_post_thumbnail_id($post);
        if (!$thumbnail_ID) {
            update_post_meta($post_ID, 'ry_line_richmenu_data', []);
            return;
        }

        $thumbnail_meta = wp_get_attachment_metadata($thumbnail_ID);
        $richmenu_data['size'] = [
            'width' => $thumbnail_meta['width'],
            'height' => $thumbnail_meta['height'],
        ];
        $richmenu_data['chatBarText'] = sanitize_text_field(wp_unslash($_POST['chatBarText'] ?? ''));
        if (empty($richmenu_data['chatBarText'])) {
            $richmenu_data['chatBarText'] = __('Open menu', 'ry-line');
        }
        $richmenu_data['selected'] = isset($_POST['selected']);

        update_post_meta($post_ID, 'ry_line_richmenu_data', $richmenu_data);
    }
}

RY_LINE_Admin_Richmenu::instance();
