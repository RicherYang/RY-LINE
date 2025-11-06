<?php

final class RY_LINE_Integration_WooCommerce_Template
{
    protected static $_instance = null;

    public static function instance(): RY_LINE_Integration_WooCommerce_Template
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
            self::$_instance->do_init();
        }

        return self::$_instance;
    }

    protected function do_init(): void
    {
        if (is_admin()) {
            add_filter('ry/line_template_string', [$this, 'add_template_string']);
        }

        add_filter('ry/line_template_replace-wc_order', [$this, 'replace_order_template_string'], 10, 4);
    }

    public function add_template_string($templates)
    {
        $templates[] = [
            'name' => __('WooCommerce order', 'ry-line'),
            'strings' => [
                [
                    'code' => '{{wc_order.id}}',
                    'name' => __('Order ID', 'ry-line'),
                ],
                [
                    'code' => '{{wc_order.number}}',
                    'name' => __('Order number', 'ry-line'),
                ],
                [
                    'code' => '{{wc_order.transaction_id}}',
                    'name' => __('Order transaction ID', 'ry-line'),
                ],
                [
                    'code' => '{{wc_order.date}}',
                    'name' => __('Order date', 'ry-line'),
                ],
                [
                    'code' => '{{wc_order.status}}',
                    'name' => __('Order status', 'ry-line'),
                ],
                [
                    'code' => '{{wc_order.total}}',
                    'name' => __('Order total', 'ry-line'),
                ],
                [
                    'code' => '{{wc_order.note}}',
                    'name' => __('Order note', 'ry-line'),
                ],
                [
                    'code' => '{{wc_order.payment_method}}',
                    'name' => __('Payment method', 'ry-line'),
                ],
                [
                    'code' => '{{wc_order.billing_address}}',
                    'name' => __('Billing address', 'ry-line'),
                ],
                [
                    'code' => '{{wc_order.shipping_address}}',
                    'name' => __('Shipping address', 'ry-line'),
                ],
                [
                    'code' => '{{wc_order.item_count}}',
                    'name' => __('Item count', 'ry-line'),
                ],
                [
                    'code' => '{{wc_order.view_url}}',
                    'name' => __('View order url', 'ry-line'),
                ],
            ],
        ];

        return $templates;
    }

    public function replace_order_template_string($value, $key, $template_info, $default)
    {
        if (!isset($template_info->wc_order)) {
            return $default;
        }

        switch ($key) {
            case 'id':
                $value = $template_info->wc_order->get_id();
                break;
            case 'number':
                $value = $template_info->wc_order->get_order_number();
                break;
            case 'transaction_id':
                $value = $template_info->wc_order->get_transaction_id();
                break;
            case 'status':
                $value = wc_get_order_status_name($template_info->wc_order->get_status());
                break;
            case 'date':
                $value = date_i18n(get_option('date_format'), $template_info->wc_order->get_date_created()->getTimestamp());
                break;
            case 'total':
                $value = $template_info->wc_order->get_total();
                break;
            case 'note':
                $value = $template_info->wc_order->get_customer_note();
                break;
            case 'payment_method':
                $value = $template_info->wc_order->get_payment_method_title();
                break;
            case 'billing_address':
                $value = $template_info->wc_order->get_formatted_billing_address();
                break;
            case 'shipping_address':
                $value = $template_info->wc_order->get_formatted_shipping_address();
                break;
            case 'item_count':
                $value = $template_info->wc_order->get_item_count();
                break;
            case 'view_url':
                if ($template_info->wc_order->get_customer_id()) {
                    $value = $template_info->wc_order->get_view_order_url();
                } else {
                    $value = $template_info->wc_order->get_checkout_order_received_url();
                }
                break;
        }
        if (isset($value) && is_scalar($value)) {
            if (is_bool($value)) {
                return $value ? 'true' : 'false';
            }
            return $value;
        }

        return $default;
    }
}

RY_LINE_Integration_WooCommerce_Template::instance();
