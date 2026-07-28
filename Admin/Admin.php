<?php

namespace RY\Line\Admin;

defined('ABSPATH') or exit;

use RY\Line\Admin\Ajax;
use RY\Line\Admin\Media;
use RY\Line\Admin\Message;
use RY\Line\Admin\MetaBoxes\Message as MetaBoxMessage;
use RY\Line\Admin\MetaBoxes\Richmenu as MetaBoxRichmenu;
use RY\Line\Admin\Page\Option as PageOption;
use RY\Line\Admin\Page\Tools as PageTools;
use RY\Line\Admin\Richmenu;
use RY\Line\License;
use RY\Paid\V20260727\AbstractAdmin;

final class Admin extends AbstractAdmin
{
    private static ?self $_instance = null;

    protected License $license;

    public static function instance(): Admin
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
            self::$_instance->do_init();
        }

        return self::$_instance;
    }

    protected function do_init(): void
    {
        parent::do_init();

        $this->license = License::instance();
        add_filter('ry-plugin/license_list', [$this, 'add_license']);

        add_action('admin_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('add_meta_boxes', [$this, 'add_meta_boxes']);
        include_once RY_LINE_PLUGIN_DIR . 'admin/message.php';
        include_once RY_LINE_PLUGIN_DIR . 'admin/richmenu.php';

        Ajax::init_ajax();

        if ($this->license->is_activated()) {
            $this->license->check_expire_cron();

            PageOption::init_menu();
            PageTools::init_menu();

            Media::instance();
            Message::instance();
            Richmenu::instance();

            add_filter('ry-plugin/menu_list', [$this, 'add_menu']);
        }
    }

    public function add_license(array $license_list): array
    {
        $license_list[RY_LINE_PLUGIN_BASENAME] = [
            'name' => $this->license::$main_class::PLUGIN_NAME,
            'license' => $this->license,
            'version' => RY_LINE_VERSION,
            'basename' => RY_LINE_PLUGIN_BASENAME,
        ];

        return $license_list;
    }

    public function enqueue_scripts()
    {
        $asset_info = include RY_LINE_PLUGIN_DIR . 'assets/admin/basic.asset.php';
        wp_register_script('ry-line-admin', RY_LINE_PLUGIN_URL . 'assets/admin/basic.js', $asset_info['dependencies'], $asset_info['version'], true);
    }

    public function add_meta_boxes()
    {
        MetaBoxMessage::init_meta_boxes();
        MetaBoxRichmenu::init_meta_boxes();
    }

    public function add_menu(array $menu_list): array
    {
        $menu_list[] = [
            'name' => __('LINE', 'ry-line'),
            'slug' => 'ry-line',
            'capability' => 'manage_options',
            'function' => [$this, 'show_page'],
        ];

        return $menu_list;
    }

    public function show_page(): void
    {
        $navs = apply_filters('ry_line-navs', []);
        $show_type = wp_unslash($_GET['type'] ?? 'tools');
        if ($show_type !== sanitize_key($show_type)) {
            $show_type = '';
        }

        echo '<div class="wrap">';
        echo '<h1 class="wp-heading">' . esc_html__('LINE', 'ry-line') . '</h1>';

        echo '<nav class="nav-tab-wrapper wp-clearfix">';
        foreach ($navs as $nav) {
            printf(
                '<a href="%1$s" class="nav-tab %2$s">%3$s</a>',
                esc_url(add_query_arg([
                    'page' => 'ry-line',
                    'type' => $nav['type'],
                ], admin_url('admin.php'))),
                $show_type === $nav['type'] ? 'nav-tab-active' : '',
                esc_html($nav['name'])
            );
        }
        echo '</nav>';

        do_action('ry_line-show_page-' . $show_type);

        echo '</div>';
    }
}
