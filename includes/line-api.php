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
                    RY_LINE::set_transient('access_token', $token, DAY_IN_SECONDS * 2);
                }
            }
        }

        return $token;
    }

    public static function revoke_access_token()
    {
        $token = RY_LINE::get_transient('access_token');
        if (!empty($token)) {
            $response = wp_remote_request('https://api.line.me/v2/oauth/revoke', [
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

        return $token;
    }

    public static function get_bot_info()
    {
        return self::do_remote_request('https://api.line.me/v2/bot/info', 'GET');
    }

    public static function get_user_info($userId)
    {
        return self::do_remote_request('https://api.line.me/v2/bot/profile/' . $userId, 'GET');
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

    protected static function do_remote_request(string $url, string $method = 'GET', mixed $content = null, bool $retry = true)
    {
        $header = [
            'Authorization' => 'Bearer ' . self::get_access_token(),
        ];
        if ($content !== null) {
            if (is_array($content)) {
                $body = json_encode($content);
                $header['Content-Type'] = 'application/json';
            } elseif (get_post_type($content) === 'attachment') {
                $header['Content-Type'] = get_post_mime_type($content);
                $body = file_get_contents(get_attached_file($content));
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
