<?php

namespace RY\Line;

defined('ABSPATH') or exit;

use RY\General\V20260810\AbstractBasic;
use RY\Line\Admin\Admin;
use RY\Line\WooCommerce\Autosend as WooCommerceAutosend;
use RY\Line\WooCommerce\Template as WooCommerceTemplate;

final class Main extends AbstractBasic
{
    public const PREFIX = 'RY_LINE_';

    public const PLUGIN_NAME = 'RY LINE';

    public const POSTTYPE_RICHERMENU = 'ry-line-richmenu';

    public const POSTTYPE_MESSAGE = 'ry-line-message';

    private static ?self $_instance = null;

    public static function instance(): Main
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
            self::$_instance->do_init();
        }

        return self::$_instance;
    }

    protected function do_init(): void
    {
        load_plugin_textdomain('ry-line', false, plugin_basename(dirname(__DIR__)) . '/languages');

        if (is_admin()) {
            Update::update();
        }

        add_action('init', [$this, 'do_wp_init'], 9);
    }

    public function do_wp_init(): void
    {
        Updater::instance();

        $this->register_post_type();

        if (is_admin()) {
            Admin::instance();
        }

        if (License::instance()->is_activated()) {
            Cron::add_action();

            Autosend::instance();
            Template::instance();
            Webhook::instance();
            User::instance();

            if (did_action('woocommerce_init')) {
                WooCommerceAutosend::instance();
                WooCommerceTemplate::instance();
            }
        }
    }

    public function register_post_type(): void
    {
        register_post_type(self::POSTTYPE_MESSAGE, [
            'labels' => [
                'name' => _x('LINE message', 'post type general name', 'ry-line'),
                'add_new_item' => __('Add message', 'ry-line'),
                'edit_item' => __('Edit message', 'ry-line'),
                'search_items' => __('Search message', 'ry-line'),
                'uploaded_to_this_item' => __('Uploaded to this message', 'ry-line'),
                'featured_image' => __('Show image', 'ry-line'),
                'set_featured_image' => __('Set show image', 'ry-line'),
                'remove_featured_image' => __('Remove show image', 'ry-line'),
                'use_featured_image' => __('Use as show image', 'ry-line'),
            ],
            'public' => false,
            'show_ui' => true,
            'show_in_admin_bar' => false,
            'show_in_menu' => 'ry-line',
            'show_in_rest' => false,
            'capability_type' => self::POSTTYPE_MESSAGE,
            'rewrite' => false,
            'delete_with_user' => false,
            'supports' => ['title', 'author', 'thumbnail'],
        ]);

        register_post_type(self::POSTTYPE_RICHERMENU, [
            'labels' => [
                'name' => _x('LINE rich menu', 'post type general name', 'ry-line'),
                'add_new_item' => __('Add rich menu', 'ry-line'),
                'edit_item' => __('Edit rich menu', 'ry-line'),
                'search_items' => __('Search rich menu', 'ry-line'),
                'uploaded_to_this_item' => __('Uploaded to this rich menu', 'ry-line'),
                'featured_image' => __('Show image', 'ry-line'),
                'set_featured_image' => __('Set show image', 'ry-line'),
                'remove_featured_image' => __('Remove show image', 'ry-line'),
                'use_featured_image' => __('Use as show image', 'ry-line'),
            ],
            'public' => false,
            'show_ui' => true,
            'show_in_admin_bar' => false,
            'show_in_menu' => 'ry-line',
            'show_in_rest' => false,
            'capability_type' => self::POSTTYPE_RICHERMENU,
            'rewrite' => false,
            'delete_with_user' => false,
            'supports' => ['title', 'author', 'thumbnail'],
        ]);
    }

    public static function create_roles()
    {
        global $wp_roles;

        if (! isset($wp_roles)) {
            $wp_roles = new WP_Roles();
        }

        foreach ([self::POSTTYPE_RICHERMENU, self::POSTTYPE_MESSAGE] as $post_type) {
            $wp_roles->add_cap('administrator', "edit_{$post_type}");
            $wp_roles->add_cap('administrator', "read_{$post_type}");
            $wp_roles->add_cap('administrator', "delete_{$post_type}");
            $wp_roles->add_cap('administrator', "edit_{$post_type}s");
            $wp_roles->add_cap('administrator', "edit_others_{$post_type}s");
            $wp_roles->add_cap('administrator', "delete_{$post_type}s");
            $wp_roles->add_cap('administrator', "publish_{$post_type}s");
            $wp_roles->add_cap('administrator', "read_private_{$post_type}s");
            $wp_roles->add_cap('administrator', "edit_{$post_type}s");
        }
    }

    public static function usage_tracking(): void
    {
        if (get_option('RY_General_tracking', 'yes') !== 'yes') {
            return;
        }

        LinkServer::instance()->send_tracking();
    }

    public static function plugin_activation(): void
    {
        self::create_roles();
    }

    public static function plugin_deactivation(): void
    {
        wp_unschedule_hook(self::get_prefix_name('check_expire'));
        wp_unschedule_hook(self::get_prefix_name('check_update'));
    }
}
