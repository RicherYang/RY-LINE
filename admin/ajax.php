<?php

final class RY_LINE_Admin_Ajax
{
    protected static $_instance = null;

    public static function instance(): RY_LINE_Admin_Ajax
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
            self::$_instance->do_init();
        }

        return self::$_instance;
    }

    protected function do_init(): void
    {
        $actions = [
            'ry-line/get-richmenu-areas',
            'ry-line/save-richmenu-areas',
            'ry-line/save-richmenu-actions',

            'ry-line/remote-richmenu-create',
            'ry-line/remote-richmenu-default',
            'ry-line/remote-richmenu-delete',
            'ry-line/remote-richmenu-alias',
            'ry-line/remote-richmenu-test',
        ];

        $action_idx = array_search($_GET['action'] ?? '', $actions, true); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        if ($action_idx !== false) {
            $action_hook = $actions[$action_idx];
            add_action('wp_ajax_' . $action_hook, [$this, str_replace('-', '_', substr($action_hook, 8))]);
        }
    }

    public function get_richmenu_areas()
    {
        $post_ID = intval($_POST['post_id'] ?? '');
        check_ajax_referer('get-richmenu-areas_' . $post_ID);

        wp_send_json_success(get_post_meta($post_ID, 'ry_line_richmenu_data', true));
    }

    public function save_richmenu_areas()
    {
        $post_ID = intval($_POST['post_id'] ?? '');
        check_ajax_referer('save-richmenu-areas_' . $post_ID);

        $richmenu_data = get_post_meta($post_ID, 'ry_line_richmenu_data', true);

        $input = sanitize_text_field(wp_unslash($_POST['areas'] ?? ''));
        wp_parse_str($input, $areas);
        if (is_array($areas)) {
            $richmenu_data['areas'] = [];
            $idx = 0;
            while (isset($areas['area-' . $idx])) {
                $area = array_map('intval', explode('-', sanitize_key($areas['area-' . $idx])));
                $idx += 1;

                if (count($area) !== 4) {
                    continue;
                }

                $richmenu_data['areas'][] = [
                    'bounds' => [
                        'x' => $area[0],
                        'y' => $area[1],
                        'width' => $area[2],
                        'height' => $area[3],
                    ],
                    'action' => [],
                ];
            }
        }

        update_post_meta($post_ID, 'ry_line_richmenu_data', $richmenu_data);
        wp_send_json_success($richmenu_data['areas']);
    }

    public function save_richmenu_actions()
    {
        $post_ID = intval($_POST['post_id'] ?? '');
        check_ajax_referer('save-richmenu-actions_' . $post_ID);

        $richmenu_data = get_post_meta($post_ID, 'ry_line_richmenu_data', true);

        $input = sanitize_text_field(wp_unslash($_POST['actions'] ?? ''));
        wp_parse_str($input, $actions);

        if (is_array($actions) && is_array($richmenu_data['areas'])) {
            $idx = 0;
            while (isset($actions["action-type-{$idx}"], $richmenu_data['areas'][$idx])) {
                $action = [];
                $action_type = sanitize_text_field($actions["action-type-{$idx}"]);
                switch ($action_type) {
                    case 'uri':
                        $url = sanitize_url($actions["action-info-{$idx}-uri"] ?? '', ['http', 'https']);
                        if ($url !== '') {
                            $action['type'] = $action_type;
                            $action['uri'] = $url;
                            $action['label'] = sanitize_textarea_field($actions["action-info-{$idx}-label"] ?? '');
                        }
                        break;
                    case 'message':
                        $text = sanitize_textarea_field($actions["action-info-{$idx}-text"] ?? '');
                        if ($text !== '') {
                            $action['type'] = $action_type;
                            $action['text'] = $text;
                            $action['label'] = sanitize_textarea_field($actions["action-info-{$idx}-label"] ?? '');
                        }
                        break;
                    case 'richmenuswitch':
                        $alias = sanitize_key($actions["action-info-{$idx}-richMenuAliasId"] ?? '');
                        if ($alias !== '') {
                            $action['type'] = $action_type;
                            $action['richMenuAliasId'] = $alias;
                            $action['data'] = 'ry/switch-richmenu';
                        }
                        break;
                }
                $richmenu_data['areas'][$idx]['action'] = $action;

                $idx += 1;
            }
        }

        update_post_meta($post_ID, 'ry_line_richmenu_data', $richmenu_data);
        wp_send_json_success($richmenu_data['areas']);
    }

    public function remote_richmenu_create()
    {
        $post_ID = intval($_POST['post_id'] ?? '');
        check_ajax_referer('remote-richmenu-create_' . $post_ID);

        $post_data = get_post_meta($post_ID, 'ry_line_richmenu_data', true);
        $post_data['name'] = get_the_title($post_ID);
        $post_data['areas'] = array_filter($post_data['areas'], function ($area) {
            return count($area['action']);
        });

        $response = RY_LINE_Api::richmenu_validate($post_data);
        if (is_wp_error($response)) {
            if ($response->get_error_code() === 'line_error') {
                wp_send_json_error($response->get_error_data());
            } else {
                wp_send_json_error(['message' => $response->get_error_message()]);
            }
            return;
        }

        $response = RY_LINE_Api::richmenu_create($post_data);
        if (is_wp_error($response)) {
            if ($response->get_error_code() === 'line_error') {
                wp_send_json_error($response->get_error_data());
            } else {
                wp_send_json_error(['message' => $response->get_error_message()]);
            }
            return;
        }
        wp_update_post([
            'ID' => $post_ID,
            'post_status' => 'publish',
        ]);
        update_post_meta($post_ID, 'ry_line_richmenu_richMenuId', $response->richMenuId);

        $thumbnail_ID = get_post_thumbnail_id($post_ID);
        $response = RY_LINE_Api::richmenu_upload($response->richMenuId, $thumbnail_ID);
        if (is_wp_error($response)) {
            if ($response->get_error_code() === 'line_error') {
                wp_send_json_error($response->get_error_data());
            } else {
                wp_send_json_error(['message' => $response->get_error_message()]);
            }
            return;
        }

        wp_send_json_success($response);
    }

    public function remote_richmenu_default()
    {
        $post_ID = intval($_POST['post_id'] ?? '');
        check_ajax_referer('remote-richmenu-default_' . $post_ID);

        $richMenuId = get_post_meta($post_ID, 'ry_line_richmenu_richMenuId', true);

        $default_ID = RY_LINE::get_option('richmenu_default');
        if ($default_ID == $post_ID) {
            $response = RY_LINE_Api::richmenu_undefault();
            $post_ID = '';
        } else {
            $response = RY_LINE_Api::richmenu_default($richMenuId);
        }
        if (is_wp_error($response)) {
            if ($response->get_error_code() === 'line_error') {
                wp_send_json_error($response->get_error_data());
            } else {
                wp_send_json_error(['message' => $response->get_error_message()]);
            }
            return;
        }

        RY_LINE::update_option('richmenu_default', $post_ID);
        wp_send_json_success($post_ID == '' ? __('Default menu', 'ry-line') : __('Unset default menu', 'ry-line'));
    }

    public function remote_richmenu_delete()
    {
        $post_ID = intval($_POST['post_id'] ?? '');
        check_ajax_referer('remote-richmenu-delete_' . $post_ID);

        $richMenuId = get_post_meta($post_ID, 'ry_line_richmenu_richMenuId', true);

        $response = RY_LINE_Api::richmenu_delete($richMenuId);
        if (is_wp_error($response)) {
            if ($response->get_error_code() === 'line_error') {
                wp_send_json_error($response->get_error_data());
            } else {
                wp_send_json_error(['message' => $response->get_error_message()]);
            }
            return;
        }

        $richMenuAliasId = get_post_meta($post_ID, 'ry_line_richmenu_richMenuAliasId', true);
        if (!empty($richMenuAliasId)) {
            $response = RY_LINE_Api::richmenu_alias_delete($richMenuAliasId);
            update_post_meta($post_ID, 'ry_line_richmenu_richMenuAliasId', '');
        }

        wp_update_post([
            'ID' => $post_ID,
            'post_status' => 'draft',
        ]);
        update_post_meta($post_ID, 'ry_line_richmenu_richMenuId', '');
        wp_send_json_success();
    }

    public function remote_richmenu_alias()
    {
        $post_ID = intval($_POST['post_id'] ?? '');
        check_ajax_referer('remote-richmenu-alias_' . $post_ID);

        $richMenuId = get_post_meta($post_ID, 'ry_line_richmenu_richMenuId', true);
        $richMenuAliasId = get_post_meta($post_ID, 'ry_line_richmenu_richMenuAliasId', true);
        $alias = sanitize_key($_POST['alias'] ?? '');

        if (empty($alias)) {
            if (!empty($richMenuAliasId)) {
                $response = RY_LINE_Api::richmenu_alias_delete($richMenuAliasId);
            }
        } else {
            if ($alias !== $richMenuAliasId) {
                $response = RY_LINE_Api::richmenu_alias_create($richMenuId, $alias);
                if (is_wp_error($response) && $response->get_error_code() === 'line_error') {
                    if ($response->get_error_data()->message === 'conflict richmenu alias id') {
                        $response = RY_LINE_Api::richmenu_alias_update($richMenuId, $alias);
                    }
                }
            }
        }
        if (isset($response) && is_wp_error($response)) {
            if ($response->get_error_code() === 'line_error') {
                wp_send_json_error($response->get_error_data());
            } else {
                wp_send_json_error(['message' => $response->get_error_message()]);
            }
            return;
        }

        $query = new WP_Query();
        $alias_posts = $query->query([
            'post_type' => RY_LINE::POSTTYPE_RICHERMENU,
            'meta_key' => 'ry_line_richmenu_richMenuAliasId', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
            'meta_value' => $alias, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
            'posts_per_page' => -1,
            'fields' => 'ids',
        ]);
        foreach ($alias_posts as $alias_post_ID) {
            update_post_meta($alias_post_ID, 'ry_line_richmenu_richMenuAliasId', '');
        }

        update_post_meta($post_ID, 'ry_line_richmenu_richMenuAliasId', $alias);
        wp_send_json_success($alias);
    }

    public function remote_richmenu_test()
    {
        $post_ID = intval($_POST['post_id'] ?? '');
        check_ajax_referer('remote-richmenu-test_' . $post_ID);

        $richMenuId = get_post_meta($post_ID, 'ry_line_richmenu_richMenuId', true);
        $line_user_ID = RY_LINE::get_option('test_user_id');

        $response = RY_LINE_Api::richmenu_link_user($line_user_ID, $richMenuId);
        if (isset($response) && is_wp_error($response)) {
            if ($response->get_error_code() === 'line_error') {
                wp_send_json_error($response->get_error_data());
            } else {
                wp_send_json_error(['message' => $response->get_error_message()]);
            }
            return;
        }

        wp_send_json_success();
    }
}

RY_LINE_Admin_Ajax::instance();
