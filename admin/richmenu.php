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
        $add_index = array_search('author', array_keys($columns));
        $pre_array = array_splice($columns, 0, $add_index);
        return array_merge($pre_array, [
            'alias' => __('Menu alias', 'ry-line'),
            'actions' => __('Menu actions', 'ry-line'),
        ], $columns);
    }

    public function show_columns($column_name, $post_ID)
    {
        if ('alias' === $column_name) {
            echo esc_html(get_post_meta($post_ID, 'ry_line_richmenu_richMenuAliasId', true));
        }
        if ('actions' === $column_name) {
            $richmenu_data = get_post_meta($post_ID, 'ry_line_richmenu_data', true);
            if (is_array($richmenu_data)) {
                echo '<ul style="list-style: disc inside; margin: 0;">';
                foreach ($richmenu_data['areas'] as $area) {
                    if (isset($area['action']['type']) && !empty($area['action']['type'])) {
                        echo '<li style="margin: 0;">';
                        switch ($area['action']['type']) {
                            case 'uri':
                                echo esc_html_x('Link', 'action type', 'ry-line');
                                echo ' ' . esc_url($area['action']['uri']);
                                break;
                            case 'message':
                                echo esc_html_x('Text', 'action type', 'ry-line');
                                echo ' ' . esc_html($area['action']['text']);
                                break;
                            case 'selfmessage':
                                echo esc_html_x('Customized message', 'action type', 'ry-line');
                                echo ' ' . esc_html(get_the_title($area['action']['message']));
                                break;
                            case 'richmenuswitch':
                                echo esc_html_x('Switch menu', 'action type', 'ry-line');
                                echo ' ' . esc_html($area['action']['richMenuAliasId']);
                                break;
                            case 'accountlink':
                                echo esc_html_x('Account link', 'action type', 'ry-line');
                                break;
                        }
                        echo '</li>';
                    }
                }
                echo '</ul>';
            }
        }
    }

    public function save_date($post_ID, $post)
    {
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (!in_array($post->post_status, ['auto-draft', 'draft', 'publish'], true)) {
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
        $richmenu_data['chatBarText'] = sanitize_text_field(wp_unslash($_POST['chatBarText'] ?? '')); // phpcs:ignore WordPress.Security.NonceVerification.Missing
        if (empty($richmenu_data['chatBarText'])) {
            $richmenu_data['chatBarText'] = __('Open menu', 'ry-line');
        }
        $richmenu_data['selected'] = isset($_POST['selected']); // phpcs:ignore WordPress.Security.NonceVerification.Missing

        update_post_meta($post_ID, 'ry_line_richmenu_data', $richmenu_data);
    }
}

RY_LINE_Admin_Richmenu::instance();
