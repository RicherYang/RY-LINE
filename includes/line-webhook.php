<?php

final class RY_LINE_Webhook
{
    public const ENDPOINT_USER_LINK = 'user-link';

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
            $request_url = rest_url('otz/v1/webhook', 'https');
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

        add_action('otz_webhook_event_received', [$this, 'do_single_event'], 10, 2);
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
            RY_LINE_Action::instance()->do_link_user();
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
}

RY_LINE_Webhook::instance();
