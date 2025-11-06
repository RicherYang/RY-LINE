<?php

include_once RY_LINE_PLUGIN_DIR . 'includes/ry-global/abstract-basic.php';

final class RY_LINE extends RY_Abstract_Basic
{
    public const OPTION_PREFIX = 'RY_LINE_';

    public const PLUGIN_NAME = 'RY LINE';

    public const POSTTYPE_RICHERMENU = 'ry-line-richmenu';

    public const POSTTYPE_MESSAGE = 'ry-line-message';

    protected static $_instance = null;

    public static function instance(): RY_LINE
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
        include_once RY_LINE_PLUGIN_DIR . 'includes/cron.php';
        include_once RY_LINE_PLUGIN_DIR . 'includes/action-scheduler/action-scheduler.php';

        if (is_admin()) {
            include_once RY_LINE_PLUGIN_DIR . 'includes/update.php';
            RY_LINE_update::update();
        }

        add_action('init', [$this, 'real_init']);
    }

    public function real_init(): void
    {
        include_once RY_LINE_PLUGIN_DIR . 'includes/license.php';
        include_once RY_LINE_PLUGIN_DIR . 'includes/link-server.php';
        include_once RY_LINE_PLUGIN_DIR . 'includes/updater.php';
        RY_LINE_Updater::instance();

        $this->register_post_type();

        if (is_admin()) {
            include_once RY_LINE_PLUGIN_DIR . 'includes/ry-global/admin-license.php';
            include_once RY_LINE_PLUGIN_DIR . 'admin/admin.php';
            RY_LINE_Admin::instance();
        }

        if (RY_LINE_License::instance()->is_activated()) {
            include_once RY_LINE_PLUGIN_DIR . 'includes/cron.php';
            include_once RY_LINE_PLUGIN_DIR . 'includes/user.php';
            RY_LINE_Cron::add_action();

            include_once RY_LINE_PLUGIN_DIR . 'includes/line-autosend.php';
            include_once RY_LINE_PLUGIN_DIR . 'includes/line-api.php';
            include_once RY_LINE_PLUGIN_DIR . 'includes/line-template.php';
            include_once RY_LINE_PLUGIN_DIR . 'includes/line-webhook.php';

            if (defined('WC_PLUGIN_FILE')) {
                include_once RY_LINE_PLUGIN_DIR . 'includes/integrations/woocommerce/template.php';
                include_once RY_LINE_PLUGIN_DIR . 'includes/integrations/woocommerce/autosend.php';
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
            'rewrite' => [
                'with_front' => false,
            ],
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
            'rewrite' => [
                'with_front' => false,
            ],
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

    public static function plugin_activation()
    {
        self::create_roles();
    }

    public static function plugin_deactivation()
    {
        wp_unschedule_hook(self::OPTION_PREFIX . 'check_expire');
        wp_unschedule_hook(self::OPTION_PREFIX . 'check_update');
    }
}
