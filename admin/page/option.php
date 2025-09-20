<?php

final class RY_Line_Admin_Option extends RY_Abstract_Admin_Page
{
    protected static $_instance = null;

    protected $license_list = [];

    public static function init_menu(): void
    {
        add_submenu_page('', __('LINE options', 'ry-line'), '', 'manage_options', 'ry-line-option', [__CLASS__, 'pre_show_page']);
        add_action('load-admin_page_ry-line-option', [__CLASS__, 'instance']);
        add_action('admin_post_ry/admin-line-option', [__CLASS__, 'admin_action']);
    }

    protected function do_init(): void
    {
        global $_wp_menu_nopriv, $_wp_real_parent_file, $submenu_file;

        if ($_wp_menu_nopriv) {
            $_wp_menu_nopriv['ry-line-option'] = true;
            $_wp_real_parent_file['ry-line-option'] = RY_LINE()->admin->main_slug;
            $submenu_file = 'ry-line';
        }
    }

    public function output_page(): void
    {
        $bot_info = RY_LINE::get_transient('bot_info');
        if (empty($bot_info)) {
            $bot_info = RY_LINE_Api::get_bot_info();
            if ($bot_info) {
                $bot_info = [
                    'id' => $bot_info->basicId,
                    'name' => $bot_info->displayName,
                    'icon' => $bot_info->pictureUrl ?? '',
                    'webhook-url' => '',
                    'webhook-status' => '',
                ];

                RY_LINE::set_transient('bot_info', $bot_info, DAY_IN_SECONDS);
            }
        }

        $user_info = RY_LINE::get_transient('user_info');
        if (empty($user_info)) {
            $line_user_ID = RY_LINE::get_option('test_user_id');
            if (!empty($line_user_ID)) {
                $user_info = RY_LINE_Api::get_user_info($line_user_ID);
                if ($user_info) {
                    $user_info = [
                        'name' => $user_info->displayName,
                        'icon' => $user_info->pictureUrl ?? '',
                        'lang' => $user_info->language ?? '',
                    ];

                    RY_LINE::set_transient('user_info', $user_info, DAY_IN_SECONDS);
                }
            }
        }

        echo '<div class="wrap">';
        $show_type = 'ry-line-option';
        include __DIR__ . '/html/nav.php';
        echo '<h1>' . esc_html__('LINE API setting', 'ry-line') . '</h1>';
        echo '<form method="post" action="admin-post.php">';
        echo '<input type="hidden" name="action" value="ry/admin-line-option">';
        wp_nonce_field('ry/admin-line-option');
        include __DIR__ . '/html/option.php';
        submit_button();
        echo '</form></div>';
    }

    public function do_admin_action(string $action): void
    {
        if ($action !== 'ry/admin-line-option') {
            return;
        }

        if (!wp_verify_nonce($_POST['_wpnonce'] ?? '', 'ry/admin-line-option')) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash , WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
            wp_die('Invalid nonce');
        }

        RY_LINE::update_option('channel_id', sanitize_locale_name($_POST['channel-id'] ?? ''), false);
        RY_LINE::update_option('channel_secret', sanitize_locale_name($_POST['channel-secret'] ?? ''), false);
        RY_LINE::update_option('test_user_id', sanitize_locale_name($_POST['test-user-id'] ?? ''), false);

        RY_LINE::delete_transient('bot_info');
        RY_LINE::delete_transient('user_info');
        RY_LINE_Api::revoke_access_token();
        if (RY_LINE_Api::get_access_token()) {
            $this->add_notice('success', __('Settings saved.', 'ry-line'));
        } else {
            $this->add_notice('error', __('Error channel ID or channel secret.', 'ry-line'));
        }

        wp_safe_redirect(admin_url('admin.php?page=ry-line-option'));
    }
}

RY_Line_Admin_Option::init_menu();
