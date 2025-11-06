<?php

final class RY_LINE_Integration_WooCommerce_Autosend
{
    protected static $_instance = null;

    public static function instance(): RY_LINE_Integration_WooCommerce_Autosend
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
            self::$_instance->do_init();
        }

        return self::$_instance;
    }

    protected function do_init(): void
    {
        add_filter('ry/line_autosend_events', [$this, 'add_autosend_events']);
        add_filter('ry/line_autosend_info-woocommerce_new_order', [$this, 'set_new_info']);
        add_filter('ry/line_autosend_info-woocommerce_completed_order', [$this, 'set_completed_info']);
        foreach (['woocommerce_new_order', 'woocommerce_completed_order'] as $autosend_key) {
            add_filter('ry/line_autosend_args-' . $autosend_key, [$this, 'set_order_args']);
            add_filter('ry/line_autosend_template-' . $autosend_key, [$this, 'set_order_template'], 10, 2);
            add_filter('ry/line_autosend_user-' . $autosend_key, [$this, 'set_order_user'], 10, 2);
        }
    }

    public function add_autosend_events($events)
    {
        $events['woocommerce_new_order'] = __('WooCommerce new order', 'ry-line');
        $events['woocommerce_completed_order'] = __('WooCommerce completed order', 'ry-line');

        return $events;
    }

    public function set_new_info()
    {
        return [
            'hook' => ['woocommerce_order_status_processing'],
            'args' => 2,
        ];
    }

    public function set_completed_info()
    {
        return [
            'hook' => ['woocommerce_order_status_completed'],
            'args' => 2,
        ];
    }

    public function set_order_args()
    {
        return 2;
    }

    public function set_order_template($template, $args)
    {
        list($order_ID, $order) = $args;

        $template['wp_user'] = $order->get_user();
        $template['wc_order'] = $order;

        return $template;
    }

    public function set_order_user($user, $args)
    {
        list($order_ID, $order) = $args;

        return (int) $order->get_user_id();
    }
}

RY_LINE_Integration_WooCommerce_Autosend::instance();
