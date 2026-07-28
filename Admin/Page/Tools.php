<?php

namespace RY\Line\Admin\Page;

defined('ABSPATH') or exit;

use RY\General\V20260727\AbstractAdminPage;
use RY\Line\LineApi;

final class Tools extends AbstractAdminPage
{
    public static function init_menu(): void
    {
        add_filter('ry_line-navs', [__CLASS__, 'add_nav']);
        add_action('ry_line-show_page-tools', [__CLASS__, 'pre_show_page']);
        add_action('admin_post_ry-line-tools', [__CLASS__, 'admin_action']);
    }

    public static function add_nav(array $navs): array
    {
        $navs[] = [
            'name' => __('Tools', 'ry-line'),
            'type' => 'tools',
        ];

        return $navs;
    }

    protected function do_init(): void {}

    public function output_page(): void
    {
        wp_enqueue_script('ry-line-admin');

        $line_user_ID = \RY_LINE::get_option('test_user_id');

        include __DIR__ . '/html/tools.php';
    }

    public function do_admin_action(string $action): void
    {
        if ('ry-line-tools' !== $action) {
            return;
        }

        if (!wp_verify_nonce($_POST['_wpnonce'] ?? '', 'ry-line-tools')) {
            wp_die('Invalid nonce');
        }

        $do = sanitize_key($_POST['do'] ?? '');
        if ($do === 'reload-richmenu') {
            $wp_query = new \WP_Query();

            $list = LineApi::richmenu_list();
            $alias_list = LineApi::richmenu_alias_list();
            $alias_list = is_wp_error($alias_list) ? [] : array_column($alias_list->aliases, 'richMenuAliasId', 'richMenuId');
            if (!is_wp_error($list)) {
                foreach ($list->richmenus as $richmenu) {
                    $posts = $wp_query->query([
                        'post_type' => \RY_LINE::POSTTYPE_RICHERMENU,
                        'meta_key' => 'ry_line_richmenu_richMenuId',
                        'meta_value' => $richmenu->richMenuId,
                        'posts_per_page' => -1,
                        'fields' => 'ids',
                    ]);
                    if (empty($posts)) {
                        $post_ID = wp_insert_post([
                            'post_type' => \RY_LINE::POSTTYPE_RICHERMENU,
                            'meta_input' => [
                                'ry_line_richmenu_richMenuId' => $richmenu->richMenuId,
                            ],
                        ]);
                    } else {
                        $post_ID = array_shift($posts);
                        if (count($posts)) {
                            foreach ($posts as $dup_post) {
                                wp_delete_post($dup_post, true);
                            }
                        }
                    }

                    wp_update_post([
                        'ID' => $post_ID,
                        'post_status' => 'publish',
                        'post_title' => $richmenu->name,
                    ]);
                    $richmenu_data = [
                        'size' => json_decode(wp_json_encode($richmenu->size), true),
                        'areas' => json_decode(wp_json_encode($richmenu->areas), true),
                        'chatBarText' => $richmenu->chatBarText,
                        'selected' => $richmenu->selected,
                    ];
                    update_post_meta($post_ID, 'ry_line_richmenu_data', $richmenu_data);
                    update_post_meta($post_ID, 'ry_line_richmenu_richMenuAliasId', $alias_list[$richmenu->richMenuId] ?? '');

                    $image = LineApi::richmenu_image($richmenu->richMenuId);
                    if (!is_wp_error($image)) {
                        $tmp_name = wp_tempnam($richmenu->richMenuId);
                        @file_put_contents($tmp_name, $image[1]);

                        $thumbnail_ID = get_post_thumbnail_id($post_ID);
                        if ($thumbnail_ID > 0) {
                            if (md5_file(get_attached_file($thumbnail_ID)) === md5_file($tmp_name)) {
                                wp_delete_file($tmp_name);
                                continue;
                            }
                        }

                        $upload_file = [
                            'name' => $richmenu->richMenuId . '.' . substr($image[0], 6),
                            'type' => $image[0],
                            'tmp_name' => $tmp_name,
                            'error' => UPLOAD_ERR_OK,
                        ];
                        $att_ID = media_handle_sideload($upload_file, $post_ID);
                        if (!is_wp_error($att_ID)) {
                            set_post_thumbnail($post_ID, $att_ID);
                        }
                        wp_delete_file($tmp_name);
                    }
                }
            }

            $default = LineApi::richmenu_get_default();
            if (!is_wp_error($default)) {
                $posts = $wp_query->query([
                    'post_type' => \RY_LINE::POSTTYPE_RICHERMENU,
                    'meta_key' => 'ry_line_richmenu_richMenuId',
                    'meta_value' => $default->richMenuId,
                    'posts_per_page' => -1,
                    'fields' => 'ids',
                ]);

                if (!empty($posts)) {
                    \RY_LINE::update_option('richmenu_default', $posts[0]);
                }
            }

            $this->add_notice('success', __('Reloaded successfully.', 'ry-line'));
        }

        if ($do === 'clear-unused-rich-aliases') {
            $count = 0;
            $list = LineApi::richmenu_list();
            $alias_list = LineApi::richmenu_alias_list();
            if (!is_wp_error($list) && !is_wp_error($alias_list)) {
                $list = array_column($list->richmenus, 'richMenuId');
                foreach ($alias_list->aliases as $alias) {
                    if (!in_array($alias->richMenuId, $list, true)) {
                        $count += 1;
                        LineApi::richmenu_alias_delete($alias->richMenuAliasId);
                    }
                }
            }
            /* translators: %d: number of deleted aliases */
            $this->add_notice('success', sprintf(_n('Deleted %d unused rich menu alias.', 'Deleted %d unused rich menu aliases.', $count, 'ry-line'), $count));
        }

        if ($do === 'clear-test-user-rich-menu') {
            $count = 0;
            $line_user_ID = \RY_LINE::get_option('test_user_id');
            LineApi::richmenu_unlink_user($line_user_ID);
            $this->add_notice('success', sprintf(__('Unlink test user rich menu successfully.', 'ry-line'), 1));
        }

        wp_safe_redirect(admin_url('admin.php?page=ry-line&type=tools'));
    }
}
