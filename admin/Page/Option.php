<?php

namespace RY\Line\Admin\Page;

defined('ABSPATH') or exit;

use RY\General\V20260810\AbstractAdminPage;
use RY\General\V20260810\Utils;
use RY\Line\LineApi;
use RY\Line\Main;
use RY\Line\Webhook;

final class Option extends AbstractAdminPage
{
    public static function init_menu(): void
    {
        add_filter('ry_line-navs', [__CLASS__, 'add_nav']);
        add_action('ry_line-show_page-option', [__CLASS__, 'pre_show_page']);
        add_action('admin_post_ry-line-option', [__CLASS__, 'admin_action']);
    }

    public static function add_nav(array $navs): array
    {
        $navs[] = [
            'name' => __('Options', 'ry-line'),
            'type' => 'option',
        ];

        return $navs;
    }

    protected function do_init(): void {}

    public function output_page(): void
    {
        wp_enqueue_script('ry-line-admin');
        wp_localize_script('ry-line-admin', 'RYLine', [
            'nonce' => [
                'get' => wp_create_nonce('get-info'),
            ],
        ]);

        $bot_info = Main::get_transient('bot_info');
        if (empty($bot_info)) {
            $remote_bot_info = LineApi::get_bot_info();
            if (is_wp_error($remote_bot_info)) {
                $bot_info = [];
            } else {
                $bot_info = [
                    'id' => $remote_bot_info->basicId,
                    'name' => $remote_bot_info->displayName,
                    'icon' => $remote_bot_info->pictureUrl ?? '',
                    'webhook-url' => '',
                    'webhook-status' => false,
                ];
                if (isset($remote_bot_info->premiumId) && !empty($remote_bot_info->premiumId)) {
                    $bot_info['id'] .= ' (' . $remote_bot_info->premiumId . ')';
                }

                $webhook_info = LineApi::get_webhook_info();
                if (!is_wp_error($webhook_info)) {
                    $bot_info['webhook-url'] = $webhook_info->endpoint;
                    $bot_info['webhook-status'] = $webhook_info->active;
                }

                Main::set_transient('bot_info', $bot_info, DAY_IN_SECONDS);
            }
        }

        $user_info = Main::get_transient('user_info');
        if (empty($user_info)) {
            $line_user_ID = Main::get_option('test_user_id');
            if (!empty($line_user_ID)) {
                $user_info = LineApi::get_user_info($line_user_ID);
                if (is_wp_error($user_info)) {
                    $user_info = [];
                } else {
                    $user_info = [
                        'name' => $user_info->displayName,
                        'icon' => $user_info->pictureUrl ?? '',
                        'lang' => $user_info->language ?? '',
                    ];

                    Main::set_transient('user_info', $user_info, DAY_IN_SECONDS);
                }
            }
        }

        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
        include __DIR__ . '/html/option.php';
        Utils::the_action_form_button('line-option', 'save-option', __('Save Changes', 'ry-line'), 'submit', 'button-primary');
        echo '</form>';

        if (!empty($bot_info)) {
            include __DIR__ . '/html/option-webhook.php';
        }
    }

    protected function do_admin_action(string $action, string $real_action): void
    {
        if ('ry-line-option' !== $action) {
            return;
        }

        if ($real_action !== '' && is_callable([$this, $real_action])) {
            $this->$real_action();
        }

        wp_safe_redirect(admin_url('admin.php?page=ry-line&type=option'));
        exit;
    }

    private function save_option(): void
    {
        check_ajax_referer('save-option', '_ajax_nonce');

        Main::update_option('channel_id', sanitize_locale_name($_POST['channel-id'] ?? ''), false);
        Main::update_option('channel_secret', sanitize_locale_name($_POST['channel-secret'] ?? ''), false);
        Main::update_option('test_user_id', sanitize_locale_name($_POST['test-user-id'] ?? ''), false);

        Main::set_transient('bot_info', []);
        Main::set_transient('user_info', []);
        LineApi::revoke_access_token();
        if (LineApi::get_access_token()) {
            $this->add_notice('success', __('Settings saved.', 'ry-line'));
        } else {
            $this->add_notice('error', __('Error channel ID or channel secret.', 'ry-line'));
        }
    }

    private function set_webhook(): void
    {
        check_ajax_referer('set-webhook', '_ajax_nonce');
        $webhook_url = Webhook::get_webhook_url();
        $set_status = LineApi::webhook_url($webhook_url);
        if (is_wp_error($set_status)) {
            if ($set_status->get_error_code() === 'line_error') {
                $this->add_notice('error', __('Settings failed.', 'ry-line') . ' ' . $set_status->get_error_data()->message);
            } else {
                $this->add_notice('error', __('Settings failed.', 'ry-line') . ' ' . $set_status->get_error_message());
            }
        } else {
            $this->add_notice('success', __('Settings saved.', 'ry-line'));
        }

        Main::set_transient('bot_info', []);
        flush_rewrite_rules();
    }

    private function test_webhook(): void
    {
        check_ajax_referer('test-webhook', '_ajax_nonce');
        $webhook_status = LineApi::test_webhook();
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
}
