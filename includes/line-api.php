<?php

final class RY_LINE_Api
{
    public static function get_access_token()
    {
        $token = RY_LINE::get_transient('access_token');
        if (empty($token)) {
            $client_id = RY_LINE::get_option('channel_id');
            $client_secret = RY_LINE::get_option('channel_secret');
            if (!empty($client_id) && !empty($client_secret)) {
                $response = wp_remote_request('https://api.line.me/v2/oauth/accessToken', [
                    'method' => 'POST',
                    'httpversion' => '1.1',
                    'headers' => [
                        'Content-Type' => 'application/x-www-form-urlencoded',
                    ],
                    'body' => [
                        'grant_type' => 'client_credentials',
                        'client_id' => $client_id,
                        'client_secret' => $client_secret,
                    ],
                ]);

                if (is_wp_error($response)) {
                    return false;
                }
                if (wp_remote_retrieve_response_code($response) !== 200) {
                    return false;
                }

                $result = json_decode(wp_remote_retrieve_body($response));
                if (isset($result->access_token)) {
                    $token = $result->access_token;
                    RY_LINE::set_transient('access_token', $token, $result->expires_in / 2);
                }
            }
        }

        return $token;
    }

    public static function revoke_access_token()
    {
        $token = RY_LINE::get_transient('access_token');
        if (!empty($token)) {
            wp_remote_request('https://api.line.me/v2/oauth/revoke', [
                'method' => 'POST',
                'httpversion' => '1.1',
                'headers' => [
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ],
                'body' => [
                    'access_token' => $token,
                ],
            ]);
        }
    }

    public static function build_message_object($posts, $template_info)
    {
        $message_object = [];
        foreach ($posts as $post) {
            if (get_post_type($post) !== RY_LINE::POSTTYPE_MESSAGE) {
                continue;
            }

            $post_data = get_post_meta($post->ID, 'ry_line_message_data', true);
            switch ($post_data['type']) {
                case 'text':
                    $post_data['type'] = 'textV2';
                    $post_data['text'] = RY_LINE_Template::instance()->do_template_string($post->post_content, $template_info);
                    break;
                case 'image':
                    $thumbnail_ID = get_post_thumbnail_id($post);
                    if ($thumbnail_ID) {
                        $post_data['type'] = 'image';
                        $post_data['originalContentUrl'] = wp_get_attachment_image_src($thumbnail_ID, 'full')[0];
                        $post_data['previewImageUrl'] = wp_get_attachment_image_src($thumbnail_ID, [1024, 0])[0];
                    }
                    break;
                case 'flex':
                    $content = maybe_unserialize($post->post_content);
                    if (is_object($content)) {
                        $post_data['type'] = 'flex';
                        $post_data['altText'] = RY_LINE_Template::instance()->do_template_string($post->post_excerpt, $template_info);
                        $post_data['contents'] = json_decode(RY_LINE_Template::instance()->do_template_string(wp_json_encode($content), $template_info), true);
                    }
            }
            $message_object[$post->ID] = $post_data;
        }

        return $message_object;
    }

    public static function build_richmenu_object($post_ID)
    {
        $richmenu_object = [];
        if (get_post_type($post_ID) == RY_LINE::POSTTYPE_RICHERMENU) {
            $post = get_post($post_ID);
            $richmenu_object = get_post_meta($post->ID, 'ry_line_richmenu_data', true);
            $richmenu_object['name'] = $post->post_title;
            $richmenu_object['areas'] = array_values(array_filter($richmenu_object['areas'], function ($area) {
                return count($area['action']);
            }));
            foreach ($richmenu_object['areas'] as &$area) {
                switch ($area['action']['type']) {
                    case 'richmenuswitch':
                        $area['action']['data'] = 'ry/switch-richmenu';
                        break;
                    case 'accountlink':
                        $area['action']['type'] = 'postback';
                        $area['action']['data'] = 'ry/account-link';
                        break;
                    case 'selfmessage':
                        $area['action']['type'] = 'postback';
                        $area['action']['data'] = 'ry/message/' . $area['action']['message'];
                        break;
                }
            }
        }

        return $richmenu_object;
    }

    public static function get_info($types)
    {
        $info = [];
        foreach ($types as $type) {
            switch ($type) {
                case 'quota':
                    $remote = self::do_remote_request('https://api.line.me/v2/bot/message/quota', 'GET');
                    if (!is_wp_error($remote)) {
                        $info['quota'] = $remote->type === 'limited' ? $remote->value : 'unlimited';
                    }
                    break;
                case 'consumption':
                    $remote = self::do_remote_request('https://api.line.me/v2/bot/message/quota/consumption', 'GET');
                    if (!is_wp_error($remote)) {
                        $info['consumption'] = $remote->totalUsage;
                    }
                    break;
                case 'friends':
                    $remote = self::do_remote_request('https://api.line.me/v2/bot/insight/followers', 'GET', [
                        'date' => current_time('Ymd'),
                    ]);
                    if (!is_wp_error($remote)) {
                        if ($remote->status === 'ready') {
                            $info['friends'] = $remote->followers - $remote->blocks;
                        }
                    }
                    break;
            }
        }

        return $info;
    }

    public static function get_bot_info()
    {
        return self::do_remote_request('https://api.line.me/v2/bot/info', 'GET');
    }

    public static function get_webhook_info()
    {
        return self::do_remote_request('https://api.line.me/v2/bot/channel/webhook/endpoint', 'GET');
    }

    public static function webhook_url($url)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/channel/webhook/endpoint', 'PUT', [
            'endpoint' => $url,
        ]);
    }

    public static function test_webhook()
    {
        return self::do_remote_request('https://api.line.me/v2/bot/channel/webhook/test', 'POST', []);
    }

    public static function get_user_info($userId)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/profile/' . $userId, 'GET');
    }

    public static function get_user_linktoken($userId)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/user/' . $userId . '/linkToken', 'POST');
    }

    public static function message_validate($post_data)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/message/validate/push', 'POST', [
            'messages' => self::fixed_message_object($post_data),
        ]);
    }

    public static function message_reply($post_data, $replyToken)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/message/reply', 'POST', [
            'replyToken' => $replyToken,
            'messages' => self::fixed_message_object($post_data),
        ]);
    }

    public static function message_push($post_data, $userId)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/message/push', 'POST', [
            'to' => $userId,
            'messages' => self::fixed_message_object($post_data),
        ]);
    }

    public static function richmenu_list()
    {
        return self::do_remote_request('https://api.line.me/v2/bot/richmenu/list', 'GET');
    }

    public static function richmenu_get_default()
    {
        return self::do_remote_request('https://api.line.me/v2/bot/user/all/richmenu', 'GET');
    }

    public static function richmenu_image($richMenuId)
    {
        return self::do_remote_request('https://api-data.line.me/v2/bot/richmenu/' . $richMenuId . '/content', 'GET');
    }

    public static function richmenu_validate($post_data)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/richmenu/validate', 'POST', $post_data);
    }

    public static function richmenu_create($post_data)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/richmenu', 'POST', $post_data);
    }

    public static function richmenu_upload($richMenuId, $att_ID)
    {
        return self::do_remote_request('https://api-data.line.me/v2/bot/richmenu/' . $richMenuId . '/content', 'POST', $att_ID);
    }

    public static function richmenu_default($richMenuId)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/user/all/richmenu/' . $richMenuId, 'POST');
    }

    public static function richmenu_undefault()
    {
        return self::do_remote_request('https://api.line.me/v2/bot/user/all/richmenu', 'DELETE');
    }

    public static function richmenu_delete($richMenuId)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/richmenu/' . $richMenuId, 'DELETE');
    }

    public static function richmenu_alias_list()
    {
        return self::do_remote_request('https://api.line.me/v2/bot/richmenu/alias/list', 'GET');
    }

    public static function richmenu_link_user($userId, $richMenuId)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/user/' . $userId . '/richmenu/' . $richMenuId, 'POST');
    }

    public static function richmenu_unlink_user($userId)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/user/' . $userId . '/richmenu', 'DELETE');
    }

    public static function richmenu_alias_create($richMenuId, $alias)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/richmenu/alias', 'POST', [
            'richMenuId' => $richMenuId,
            'richMenuAliasId' => $alias,
        ]);
    }

    public static function richmenu_alias_update($richMenuId, $alias)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/richmenu/alias/' . $alias, 'POST', [
            'richMenuId' => $richMenuId,
        ]);
    }

    public static function richmenu_alias_delete($alias)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/richmenu/alias/' . $alias, 'DELETE');
    }

    public static function reply_message($replyToken, $messages)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/message/reply', 'POST', [
            'replyToken' => $replyToken,
            'messages' => $messages,
        ]);
    }

    protected static function fixed_message_object($message_object)
    {
        $new_message_object = [];
        foreach ($message_object as $message) {
            switch ($message['type']) {
                case 'textV2':
                    $message['text'] = wp_strip_all_tags($message['text']);
                    $message['text'] = str_replace(['{', '}'], ['{{', '}}'], $message['text']);
                    break;
                case 'flex':
                    $message['contents'] = wp_json_encode($message['contents']);
                    $message['contents'] = str_replace(['<br>', '<br/>', '<br />'], '\n', $message['contents']);
                    $message['contents'] = wp_strip_all_tags($message['contents']);
                    $message['contents'] = json_decode($message['contents']);
                    break;
            }
            $new_message_object[] = $message;
            if (count($new_message_object) >= 5) {
                break;
            }
        }

        return $new_message_object;
    }

    protected static function do_remote_request(string $url, string $method = 'GET', mixed $content = null, bool $retry = true)
    {
        $header = [
            'Authorization' => 'Bearer ' . self::get_access_token(),
        ];
        if ($content !== null) {
            if ($method === 'GET') {
                $url = add_query_arg($content, $url);
            } else {
                if (is_array($content)) {
                    if (empty($content)) {
                        $body = '{}';
                    } else {
                        $body = json_encode($content);
                    }
                    $header['Content-Type'] = 'application/json';
                } elseif (get_post_type($content) === 'attachment') {
                    $header['Content-Type'] = get_post_mime_type($content);
                    $body = file_get_contents(get_attached_file($content));
                }
            }
        }

        $response = wp_remote_request($url, [
            'method' => $method,
            'httpversion' => '1.1',
            'headers' => $header,
            'body' => $body ?? null,
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        if (wp_remote_retrieve_response_code($response) == 200) {
            if (wp_remote_retrieve_header($response, 'content-type') === 'application/json') {
                return json_decode(wp_remote_retrieve_body($response));
            }
            return [wp_remote_retrieve_header($response, 'content-type'), wp_remote_retrieve_body($response)];
        }
        if (wp_remote_retrieve_response_code($response) == 401) {
            RY_LINE::delete_transient('access_token');
            if ($retry) {
                return self::do_remote_request($url, $method, $content, false);
            }
        }

        return new WP_Error('line_error', wp_remote_retrieve_response_code($response), json_decode(wp_remote_retrieve_body($response)));
    }
}
