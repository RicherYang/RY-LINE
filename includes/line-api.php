<?php

class RY_LINE_Api
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

    public static function get_bot_info()
    {
        $response = self::do_remote_request('https://api.line.me/v2/bot/info', 'GET');
        if ($response === false) {
            return false;
        }

        return $response;
    }

    protected static function do_remote_request($url, $method = 'GET')
    {
        $response = wp_remote_request($url, [
            'method' => $method,
            'httpversion' => '1.1',
            'headers' => [
                'Authorization' => 'Bearer ' . self::get_access_token(),
            ],
        ]);

        if (is_wp_error($response)) {
            return false;
        }
        if (wp_remote_retrieve_response_code($response) == 200) {
            return json_decode(wp_remote_retrieve_body($response));
        }
        if (wp_remote_retrieve_response_code($response) == 401) {
            RY_LINE::delete_transient('access_token');
        }
        if (wp_remote_retrieve_response_code($response) == 403) {
            RY_LINE::delete_transient('access_token');
        }

        return false;
    }
}
