<?php

final class RY_ActionScheduler_Dashboard
{
    protected static $_instance = null;

    public static function instance()
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
            self::$_instance->do_init();
        }

        return self::$_instance;
    }

    protected function do_init(): void
    {
        add_action('wp_dashboard_setup', [$this, 'add_dashboard_widget']);
    }

    public function add_dashboard_widget()
    {
        wp_add_dashboard_widget('ry_action_scheduler', '排程概況', [$this, 'status_widget']);
    }

    public function status_widget()
    {
        $store = ActionScheduler::store();
        $counts = $store->action_counts() + $store->extra_action_counts();

        foreach ($counts as $status_name => $count) {
            if (0 === $count) {
                continue;
            }

            $status_url = admin_url('tools.php?page=action-scheduler');
            if ('all' !== $status_name) {
                $status_url = add_query_arg(['status' => $status_name], $status_url);
            }
            $status_list_items[] = sprintf('<li><a href="%s">%s</a> ( %d )</li>', esc_url($status_url), esc_html(ucfirst($status_name)), absint($count));
        }

        echo '<ul class="subsubsub" style="float:none">';
        echo implode(' | ', $status_list_items); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        echo '</ul>';
    }
}

RY_ActionScheduler_Dashboard::instance();
