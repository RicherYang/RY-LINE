<?php

final class RY_LINE_Autosend
{
    protected static $_instance = null;

    public static function instance(): RY_LINE_Autosend
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
            self::$_instance->do_init();
        }

        return self::$_instance;
    }

    protected function do_init(): void
    {
        $autosend_hooks = RY_LINE::get_option('autosend_hooks', []);
        foreach ($autosend_hooks as $hook_name => $hook_info) {
            add_action($hook_name, [$this, 'do_autosend_event'], $hook_info['priority'] ?? 20, $hook_info['args'] ?? 1);
        }

        add_filter('ry/line_autosend_events', [$this, 'add_autosend_events']);

        add_filter('ry/line_autosend_info-wp_login', [$this, 'set_login_info']);
        add_filter('ry/line_autosend_template-wp_login', [$this, 'set_login_template'], 10, 2);
        add_filter('ry/line_autosend_user-wp_login', [$this, 'set_login_user'], 10, 2);

        add_filter('ry/line_autosend_info-line_account_linked', [$this, 'set_linked_info']);
        add_filter('ry/line_autosend_info-line_account_unlinked', [$this, 'set_unlinked_info']);
        foreach (['line_account_linked', 'line_account_unlinked'] as $autosend_key) {
            add_filter('ry/line_autosend_template-' . $autosend_key, [$this, 'set_link_template'], 10, 2);
            add_filter('ry/line_autosend_token-' . $autosend_key, [$this, 'set_link_token'], 10, 2);
        }
    }

    public function do_autosend_event(...$args): void
    {
        $autosend_hooks = RY_LINE::get_option('autosend_hooks', []);
        $hook_name = current_filter();
        if (!isset($autosend_hooks[$hook_name])) {
            return;
        }

        if (count($autosend_hooks[$hook_name]['autosend']) === 1) {
            $meta_query = [
                'key' => 'ry_line_message_autosend',
                'value' => $autosend_hooks[$hook_name]['autosend'][0],
            ];
        } else {
            $meta_query = [
                'key' => 'ry_line_message_autosend',
                'value' => $autosend_hooks[$hook_name]['autosend'],
                'compare' => 'IN',
            ];
        }

        $query = new WP_Query();
        $messages = $query->query([
            'post_type' => RY_LINE::POSTTYPE_MESSAGE,
            'posts_per_page' => -1,
            'post_status' => 'publish',
            'meta_query' => [$meta_query],
            'orderby' => 'menu_order',
            'order' => 'DESC',
        ]);

        $template_info = [];
        foreach ($autosend_hooks[$hook_name]['autosend'] as $event_key) {
            $template_info = apply_filters('ry/line_autosend_template-' . $event_key, $template_info, $args);
        }

        $message_object = RY_LINE_Api::build_message_object($messages, (object) $template_info);
        if (empty($message_object)) {
            return;
        }

        $replay_token = '';
        foreach ($autosend_hooks[$hook_name]['autosend'] as $event_key) {
            $replay_token = apply_filters('ry/line_autosend_token-' . $event_key, $replay_token, $args);
        }
        if (!empty($replay_token)) {
            $status = RY_LINE_Api::message_reply($message_object, $replay_token);
            if (!is_wp_error($status)) {
                return;
            }
        }

        $line_users = '';
        foreach ($autosend_hooks[$hook_name]['autosend'] as $event_key) {
            $line_users = apply_filters('ry/line_autosend_user-' . $event_key, $line_users, $args);
        }
        if (!is_array($line_users)) {
            $line_users = [$line_users];
        }
        foreach ($message_object as $message_ID => $message_data) {
            $message_data = get_post_meta($message_ID, 'ry_line_message_data', true);
            if (!empty($message_data['send_cc_lineid'])) {
                $line_users[] = $message_data['send_cc_lineid'];
            }
        }
        foreach ($line_users as &$line_user_ID) {
            if ($line_user_ID instanceof WP_User) {
                $line_user_ID = (int) $line_user_ID->ID;
            }
            if (is_int($line_user_ID)) {
                $line_user_ID = RY_LINE_User::instance()->get_line_user_id($line_user_ID);
            }
        }
        unset($line_user_ID);
        $line_users = array_filter($line_users);

        if (count($line_users)) {
            $status = RY_LINE_Api::message_multicast($message_object, array_values($line_users));
        }
    }

    public function add_autosend_events($events)
    {
        $events['wp_login'] = __('User login', 'ry-line');
        $events['line_account_linked'] = __('Linked LINE account', 'ry-line');
        $events['line_account_unlinked'] = __('Unlinked LINE account', 'ry-line');

        return $events;
    }

    public function set_login_info()
    {
        return [
            'hook' => ['wp_login'],
            'args' => 2,
        ];
    }

    public function set_login_template($template, $args)
    {
        list($user_login, $wp_user) = $args;
        $template['wp_user'] = $wp_user;

        return $template;
    }

    public function set_login_user($user, $args)
    {
        list($user_login, $wp_user) = $args;

        return (int) $wp_user->ID;
    }

    public function set_linked_info()
    {
        return [
            'hook' => ['ry/line_account_linked'],
            'args' => 3,
        ];
    }

    public function set_unlinked_info()
    {
        return [
            'hook' => ['ry/line_account_unlinked'],
            'args' => 3,
        ];
    }

    public function set_link_template($template, $args)
    {
        list($wp_user, $line_user_ID, $reply_token) = $args;
        $template['wp_user'] = $wp_user;

        return $template;
    }

    public function set_link_token($token, $args)
    {
        list($wp_user, $line_user_ID, $reply_token) = $args;

        return $reply_token;
    }
}

RY_LINE_Autosend::instance();
