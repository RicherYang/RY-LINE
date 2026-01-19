<?php

final class RY_LINE_Webhook
{
    public const ENDPOINT_USER_LINK = 'user-link';

    public const LINK_QUERY = 'line-token';

    protected static $_instance = null;

    public static function instance(): RY_LINE_Webhook
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
            self::$_instance->do_init();
        }

        return self::$_instance;
    }

    public static function get_webhook_url($request = '')
    {
        if ($request === '' && defined('OTZ_VERSION')) {
            $request_url = otz_get_webhook_url();
        } else {
            if (strstr(get_option('permalink_structure'), '/index.php/')) {
                $request_url = trailingslashit(home_url('/index.php/ry-line-webhook/' . $request, 'https'));
            } elseif (get_option('permalink_structure')) {
                $request_url = trailingslashit(home_url('/ry-line-webhook/' . $request, 'https'));
            } else {
                $request_url = add_query_arg('ry-line-webhook', $request, trailingslashit(home_url('', 'https')));
            }
        }

        return $request_url;
    }

    public function do_init(): void
    {
        add_rewrite_endpoint('ry-line-webhook', EP_ROOT);

        add_action('query_vars', [$this, 'add_query_vars'], 0);
        add_action('parse_request', [$this, 'parse_webhook_request'], 0);

        add_action('otz_webhook_event_received', [$this, 'do_single_event']);

        add_action('ry/line-webhook/postback-ry/message', [$this, 'menu_send_message'], 10, 3);
        add_action('ry/line-webhook/message', [$this, 'reply_message'], 10, 3);

        add_action('ry/line-webhook/postback-ry/account-link', [$this, 'show_link_button'], 10, 3);
        add_action('ry/line-webhook/postback-ry/account-unlink', [$this, 'unlink_user'], 10, 3);
        add_action('ry/line-webhook/accountLink', [$this, 'link_user'], 10, 3);
    }

    public function add_query_vars($vars)
    {
        $vars[] = 'ry-line-webhook';

        return $vars;
    }

    public function parse_webhook_request()
    {
        global $wp;

        if (isset($_GET['ry-line-webhook'])) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            $wp->query_vars['ry-line-webhook'] = '';
        }

        if (!isset($wp->query_vars['ry-line-webhook'])) {
            return;
        }

        if ($wp->query_vars['ry-line-webhook'] === self::ENDPOINT_USER_LINK) {
            $this->do_link_user();
            exit;
        }

        $api_signature = sanitize_text_field(wp_unslash($_SERVER['HTTP_X_LINE_SIGNATURE'] ?? ''));
        $data = file_get_contents('php://input');
        $client_secret = RY_LINE::get_option('channel_secret');
        $hash = hash_hmac('sha256', $data, $client_secret, true);
        $signature = base64_encode($hash);
        if (hash_equals($signature, $api_signature)) {
            $data = json_decode($data);
            foreach ($data->events as $event) {
                $this->do_single_event($event);
            }
            status_header(200);
            exit;
        }

        wp_send_json_error('invalid signature', 400);
    }

    public function do_single_event($event)
    {
        switch ($event->type) {
            case 'message':
                do_action('ry/line-webhook/message', $event->message, $event->source, $event->replyToken);
                break;
            case 'postback':
                $data = explode('/', $event->postback->data);
                $action_data = '';
                do {
                    $action_data .= array_shift($data);
                    do_action('ry/line-webhook/postback-' . $action_data, $event->postback->data, $event->source, $event->replyToken);
                    $action_data .= '/';
                } while (count($data));
                break;
            case 'accountLink':
                do_action('ry/line-webhook/accountLink', $event->link, $event->source, $event->replyToken);
                break;
        }

        do_action('ry/line-webhook', $event);
    }

    public function menu_send_message($event_data, $source, $reply_token): void
    {
        $params = explode('/', $event_data);
        $message_ID = intval($params[2] ?? '');
        if (get_post_type($message_ID) !== RY_LINE::POSTTYPE_MESSAGE) {
            return;
        }

        $message = get_post($message_ID);

        $this->do_send_reply([$message], $source, $reply_token);
    }

    public function reply_message($message, $source, $reply_token)
    {
        if ($message->type !== 'text') {
            return;
        }
        $text = sanitize_text_field(trim($message->text));
        if (empty($text)) {
            return;
        }

        $wp_query = new WP_Query();
        $messages = $wp_query->query([
            'post_type' => RY_LINE::POSTTYPE_MESSAGE,
            'posts_per_page' => -1,
            'post_status' => 'publish',
            'meta_query' => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
                [
                    'key' => 'ry_line_message_reply_type',
                    'value' => 'keyword',
                ],
                [
                    'key' => 'ry_line_message_reply',
                    'value' => $text,
                ],
            ],
            'orderby' => 'menu_order',
            'order' => 'DESC',
        ]);
        if (empty($messages)) {
            $messages = $wp_query->query([
                'post_type' => RY_LINE::POSTTYPE_MESSAGE,
                'posts_per_page' => -1,
                'post_status' => 'publish',
                'meta_query' => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
                    [
                        'key' => 'ry_line_message_reply_type',
                        'value' => 'all-nokeyword',
                    ],
                ],
                'orderby' => 'menu_order',
                'order' => 'DESC',
            ]);
        }
        if (empty($messages)) {
            return;
        }

        $this->do_send_reply($messages, $source, $reply_token);
    }

    protected function do_send_reply($messages, $source, $reply_token): void
    {
        $message_data = [];
        $message_reply = [];
        $template_info = (object) [
            'wp_user' => RY_LINE_User::instance()->get_wp_user($source->userId),
        ];
        $message_object = RY_LINE_Api::build_message_object($messages, $template_info);
        foreach ($message_object as $message_ID => $message) {
            $message_data[$message_ID] = get_post_meta($message_ID, 'ry_line_message_data', true);
            $message_reply[$message_ID] = get_post_meta($message_ID, 'ry_line_message_reply', true);
            if (!empty($message_reply[$message_ID]) && count($message_data[$message_ID]['reply_from'])) {
                if (!in_array($source->type, $message_data[$message_ID]['reply_from'], true)) {
                    unset($message_object[$message_ID]);
                }
            }
        }
        if (empty($message_object)) {
            return;
        }

        RY_LINE_Api::message_reply($message_object, $reply_token);
    }

    public function show_link_button($event_data, $source, $reply_token): void
    {
        if ($source->type !== 'user') {
            RY_LINE_Api::reply_message($reply_token, [[
                'type' => 'textV2',
                'text' => __('Account link action can only do at one-by-one chat.', 'ry-line'),
            ]]);
            return;
        }

        $text = __('Please click below button', 'ry-line');
        $actions = [];

        $wp_user = RY_LINE_User::instance()->get_wp_user($source->userId);
        if ($wp_user) {
            /* translators: %s: user display name */
            $text = sprintf(__('Linked account: %s', 'ry-line'), $wp_user->display_name) . "\n" . $text;
            $actions[] = [
                'type' => 'postback',
                'label' => __('Unlink account', 'ry-line'),
                'data' => 'ry/account-unlink',
            ];
        } else {
            $link_token = RY_LINE_Api::get_user_linktoken($source->userId);
            $actions[] = [
                'type' => 'uri',
                'label' => __('Link account', 'ry-line'),
                'uri' => add_query_arg([
                    self::LINK_QUERY => $link_token->linkToken,
                ], RY_LINE_Webhook::get_webhook_url(RY_LINE_Webhook::ENDPOINT_USER_LINK)),
            ];
        }

        RY_LINE_Api::reply_message($reply_token, [[
            'type' => 'template',
            'altText' => __('Link account', 'ry-line'),
            'template' => [
                'type' => 'buttons',
                'text' => $text,
                'actions' => $actions,
            ],
        ]]);
    }

    public function unlink_user($event_data, $source, $reply_token): void
    {
        if ($source->type !== 'user') {
            RY_LINE_Api::reply_message($reply_token, [[
                'type' => 'textV2',
                'text' => __('Account link action can only do at one-by-one chat.', 'ry-line'),
            ]]);
            return;
        }

        $wp_user = RY_LINE_User::instance()->get_wp_user($source->userId);
        if ($wp_user) {
            foreach (RY_LINE_User::MAYPE_USER_META_KEY as $meta_key) {
                delete_user_meta($wp_user->ID, $meta_key);
            }
        } else {
            RY_LINE_Api::reply_message($reply_token, [[
                'type' => 'textV2',
                'text' => __('No linked account found.', 'ry-line'),
            ]]);
            return;
        }

        do_action('ry/line_account_unlinked', $wp_user, $source->userId, $reply_token);
        RY_LINE_Api::reply_message($reply_token, [[
            'type' => 'textV2',
            'text' => __('Unlink account success.', 'ry-line'),
        ]]);
    }

    public function link_user($link, $source, $reply_token): void
    {
        if ($source->type !== 'user') {
            RY_LINE_Api::reply_message($reply_token, [[
                'type' => 'textV2',
                'text' => __('Account link action can only do at one-by-one chat.', 'ry-line'),
            ]]);
            return;
        }

        if ($link->result === 'ok') {
            $nonce = sanitize_key($link->nonce);
            $nonce = hex2bin($nonce);
            $iv = substr(wp_salt('nonce'), 0, openssl_cipher_iv_length('aes-128-cbc'));
            $user_ID = openssl_decrypt($nonce, 'aes-128-cbc', RY_LINE::get_option('channel_secret'), OPENSSL_RAW_DATA, $iv);
            if ($user_ID === sanitize_key($user_ID)) {
                $user_ID = intval($user_ID);
                if ($user_ID > 0) {
                    $wp_user = RY_LINE_User::instance()->get_wp_user($source->userId);
                    if ($wp_user->ID != $user_ID) {
                        foreach (RY_LINE_User::MAYPE_USER_META_KEY as $meta_key) {
                            delete_user_meta($wp_user->ID, $meta_key);
                        }
                    }

                    update_user_meta($user_ID, RY_LINE_User::MAYPE_USER_META_KEY[0], $source->userId);
                    $wp_user = get_user_by('id', $user_ID);
                    do_action('ry/line_account_linked', $wp_user, $source->userId, $reply_token);
                    RY_LINE_Api::reply_message($reply_token, [[
                        'type' => 'textV2',
                        /* translators: %s: user display name */
                        'text' => sprintf(__('Welcome %s\nLink account success.', 'ry-line'), $wp_user->display_name),
                    ]]);
                    return;
                }
            }
        }

        RY_LINE_Api::reply_message($reply_token, [[
            'type' => 'textV2',
            'text' => __('Sorry!\nLink account failed.', 'ry-line'),
        ]]);
    }

    public function do_link_user()
    {
        $link_token = sanitize_text_field(wp_unslash($_GET[self::LINK_QUERY] ?? '')); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $user_ID = get_current_user_id();
        if ($user_ID === 0) {
            if (defined('WC_VERSION')) {
                $login_url = wc_get_page_permalink('myaccount');
            } else {
                $login_url = wp_login_url();
            }
            $login_url = add_query_arg([
                'redirect_to' => add_query_arg([
                    self::LINK_QUERY => $link_token,
                ], RY_LINE_Webhook::get_webhook_url(RY_LINE_Webhook::ENDPOINT_USER_LINK)),
            ], $login_url);
            wp_safe_redirect($login_url);
            return;
        }

        $iv = substr(wp_salt('nonce'), 0, openssl_cipher_iv_length('aes-128-cbc'));
        $nonce = openssl_encrypt($user_ID, 'aes-128-cbc', RY_LINE::get_option('channel_secret'), OPENSSL_RAW_DATA, $iv);

        // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
        wp_redirect(add_query_arg([
            'linkToken' => $link_token,
            'nonce' => bin2hex($nonce),
        ], 'https://access.line.me/dialog/bot/accountLink'));
    }
}

RY_LINE_Webhook::instance();
