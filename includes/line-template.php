<?php

final class RY_LINE_Template
{
    protected static $_instance = null;

    public static function instance(): RY_LINE_Template
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
            self::$_instance->do_init();
        }

        return self::$_instance;
    }

    protected function do_init(): void
    {
        add_filter('ry_line_template_string', [$this, 'add_template_string']);

        add_filter('ry_line_template_replace-wp', [$this, 'replace_wp_template_string'], 10, 2);
        add_filter('ry_line_template_replace-user', [$this, 'replace_user_template_string'], 10, 3);
    }

    public function do_template_string($string, $template_info)
    {
        if (! str_contains($string, '{{')) {
            return $string;
        }

        return preg_replace_callback('@\{\{([^\{\}\x00-\x20]+)\}\}@', function ($matches) use ($template_info) {
            return $this->replace($matches, $template_info);
        }, $string);
    }

    public function replace($matches, $template_info)
    {
        $template_string = trim($matches[1]);
        if (str_contains($template_string, '.')) {
            $group = strstr($template_string, '.', true);
            $key = substr(strstr($template_string, '.'), 1);
        } else {
            $group = '';
            $key = $template_string;
        }

        return apply_filters('ry_line_template_replace-' . $group, $key, $template_info);
    }

    public function add_template_string($templates)
    {
        $templates[] = [
            'name' => __('General', 'ry-line'),
            'strings' => [
                [
                    'code' => '{{wp.name}}',
                    'name' => __('Site title', 'ry-line'),
                ],
                [
                    'code' => '{{wp.description}}',
                    'name' => __('Site tagline', 'ry-line'),
                ],
                [
                    'code' => '{{wp.wpurl}}',
                    'name' => __('WordPress URL', 'ry-line'),
                ],
                [
                    'code' => '{{wp.url}}',
                    'name' => __('Site URL', 'ry-line'),
                ],
                [
                    'code' => '{{wp.admin_email}}',
                    'name' => __('Admin Email', 'ry-line'),
                ],
            ],
        ];
        $templates[] = [
            'name' => __('User', 'ry-line'),
            'strings' => [
                [
                    'code' => '{{user.display_name}}',
                    'name' => __('Public display name', 'ry-line'),
                ],
                [
                    'code' => '{{user.nickname}}',
                    'name' => __('Nickname', 'ry-line'),
                ],
                [
                    'code' => '{{user.first_name}}',
                    'name' => __('First Name', 'ry-line'),
                ],
                [
                    'code' => '{{user.last_name}}',
                    'name' => __('Last Name', 'ry-line'),
                ],
                [
                    'code' => '{{user.user_email}}',
                    'name' => __('Email', 'ry-line'),
                ],
            ],
        ];

        return $templates;
    }

    public function replace_wp_template_string($key)
    {
        return get_bloginfo($key);
    }

    public function replace_user_template_string($key, $template_info)
    {
        if (!isset($template_info->wp_user)) {
            return '';
        }

        if (str_starts_with($key, 'meta.')) {
            $value = get_user_meta($template_info->wp_user->ID, substr($key, 5), true);
        } else {
            if (in_array($key, ['user_pass', 'user_activation_key'], true)) {
                return '';
            }
            $value = $template_info->wp_user->get($key);
        }
        if (is_scalar($value)) {
            if (is_bool($value)) {
                return $value ? 'true' : 'false';
            }
            return $value;
        }

        return '';
    }
}

RY_LINE_Template::instance();
