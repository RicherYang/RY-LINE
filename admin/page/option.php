<?php

final class RY_Line_Admin_Option extends RY_Abstract_Admin_Page
{
    protected static $_instance = null;

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
            $_wp_real_parent_file['ry-line-option'] = RY_LINE_Admin::instance()->main_slug;
            $submenu_file = 'ry-line';
        }
    }

    public function output_page(): void
    {
        wp_enqueue_script('ry-line-admin');
        wp_localize_script('ry-line-admin', 'RYLine', [
            'nonce' => [
                'get' => wp_create_nonce('get-info'),
            ],
        ]);

        $bot_info = RY_LINE::get_transient('bot_info');
        if (empty($bot_info)) {
            $bot_info = RY_LINE_Api::get_bot_info();
            if (is_wp_error($bot_info)) {
                $bot_info = [];
            } else {
                $bot_info = [
                    'id' => $bot_info->basicId,
                    'name' => $bot_info->displayName,
                    'icon' => $bot_info->pictureUrl ?? '',
                    'webhook-url' => '',
                    'webhook-status' => false,
                ];

                $webhook_info = RY_LINE_Api::get_webhook_info();
                if (!is_wp_error($webhook_info)) {
                    $bot_info['webhook-url'] = $webhook_info->endpoint;
                    $bot_info['webhook-status'] = $webhook_info->active;
                }

                RY_LINE::set_transient('bot_info', $bot_info, DAY_IN_SECONDS);
            }
        }

        $user_info = RY_LINE::get_transient('user_info');
        if (empty($user_info)) {
            $line_user_ID = RY_LINE::get_option('test_user_id');
            if (!empty($line_user_ID)) {
                $user_info = RY_LINE_Api::get_user_info($line_user_ID);
                if (is_wp_error($user_info)) {
                    $user_info = [];
                } else {
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
        echo '<h1>' . esc_html__('LINE setting', 'ry-line') . '</h1>';
        echo '<form method="post" action="admin-post.php">';
        echo '<input type="hidden" name="action" value="ry/admin-line-option">';
        echo '<input type="hidden" name="do" value="save-option">';
        wp_nonce_field('ry/admin-line-option');
        include __DIR__ . '/html/option.php';
        submit_button();
        echo '</form>';

        if (!empty($bot_info)) {
            include __DIR__ . '/html/option-webhook.php';
        }
        echo '</div>';
    }

    public function do_admin_action(string $action): void
    {
        if ($action !== 'ry/admin-line-option') {
            return;
        }

        if (!wp_verify_nonce($_POST['_wpnonce'] ?? '', 'ry/admin-line-option')) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash , WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
            wp_die('Invalid nonce');
        }

        $do = sanitize_key($_POST['do'] ?? '');
        if ($do === 'set-webhook') {
            $webhook_url = RY_LINE_Webhook::get_webhook_url();
            $set_status = RY_LINE_Api::webhook_url($webhook_url);
            if (is_wp_error($set_status)) {
                if ($set_status->get_error_code() === 'line_error') {
                    $this->add_notice('error', __('Settings failed.', 'ry-line') . ' ' . $set_status->get_error_data()->message);
                } else {
                    $this->add_notice('error', __('Settings failed.', 'ry-line') . ' ' . $set_status->get_error_message());
                }
            } else {
                $this->add_notice('success', __('Settings saved.', 'ry-line'));
            }

            RY_LINE::set_transient('bot_info', []);
            flush_rewrite_rules();
        }

        if ($do === 'test-webhook') {
            $webhook_status = RY_LINE_Api::test_webhook();
            if (is_wp_error($webhook_status)) {
                if ($webhook_status->get_error_code() === 'line_error') {
                    $this->add_notice('error', __('Test failed.', 'ry-line') . ' ' . $webhook_status->get_error_data()->message);
                } else {
                    $this->add_notice('error', __('Test failed.', 'ry-line') . ' ' . $webhook_status->get_error_message());
                }
            } else {
                if ($webhook_status->success === true) {
                    $this->add_notice('success', __('Test success.', 'ry-line'));
                } else {
                    $this->add_notice('error', __('Test failed.', 'ry-line') . ' ' . $webhook_status->detail);
                }
            }
        }

        if ($do === 'save-option') {
            RY_LINE::update_option('channel_id', sanitize_locale_name($_POST['channel-id'] ?? ''), false);
            RY_LINE::update_option('channel_secret', sanitize_locale_name($_POST['channel-secret'] ?? ''), false);
            RY_LINE::update_option('test_user_id', sanitize_locale_name($_POST['test-user-id'] ?? ''), false);

            RY_LINE::set_transient('bot_info', []);
            RY_LINE::set_transient('user_info', []);
            RY_LINE_Api::revoke_access_token();
            if (RY_LINE_Api::get_access_token()) {
                $this->add_notice('success', __('Settings saved.', 'ry-line'));
            } else {
                $this->add_notice('error', __('Error channel ID or channel secret.', 'ry-line'));
            }
        }

        wp_safe_redirect(admin_url('admin.php?page=ry-line-option'));
    }
}

RY_Line_Admin_Option::init_menu();
