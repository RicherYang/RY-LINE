<?php

class RY_ActionScheduler_ListTable extends ActionScheduler_ListTable
{
    protected $timezone;

    public function __construct(ActionScheduler_Store $store, ActionScheduler_Logger $logger, ActionScheduler_QueueRunner $runner)
    {
        $this->timezone = wp_timezone();
        parent::__construct($store, $logger, $runner);
    }

    protected function display_tablenav($which)
    {
        if ('top' === $which) {
            echo '<style>.column-args code { word-wrap: anywhere; }</style>';
        }

        parent::display_tablenav($which);
    }

    protected function get_table_classes()
    {
        $classes = parent::get_table_classes();
        unset($classes[array_search('fixed', $classes)]);

        return $classes;
    }

    protected function get_schedule_display_string(ActionScheduler_Schedule $schedule)
    {
        if (is_a($schedule, 'ActionScheduler_NullSchedule')) {
            return 'async';
        }

        if (! method_exists($schedule, 'get_date') || ! $schedule->get_date()) {
            return '0000-00-00 00:00:00';
        }

        $schedule->get_date()->setTimezone($this->timezone);
        $next_timestamp = $schedule->get_date()->getTimestamp();

        $schedule_display_string = $schedule->get_date()->format('Y-m-d H:i:s') . '<br>';

        if (gmdate('U') > $next_timestamp) {
            /* translators: %s: date interval */
            $schedule_display_string .= sprintf('%s 之前', human_time_diff(gmdate('U'), $next_timestamp));
        } else {
            /* translators: %s: date interval */
            $schedule_display_string .= sprintf('%s', human_time_diff($next_timestamp, gmdate('U')));
        }

        return $schedule_display_string;
    }

    public function column_log_entries(array $row)
    {
        $log_entries_html = '<ol style="margin-top:0;margin-bottom:0;">';
        $timezone = $this->timezone;
        foreach ($row['log_entries'] as $log_entry) {
            $log_entries_html .= $this->get_log_entry_html($log_entry, $timezone);
        }
        $log_entries_html .= '</ol>';

        return $log_entries_html;
    }

    protected function get_log_entry_html(ActionScheduler_LogEntry $log_entry, DateTimezone $timezone)
    {
        $date = $log_entry->get_date();
        $date->setTimezone($timezone);

        return sprintf(
            '<li style="margin-bottom:3px"><strong style="padding-right:.5em">%1$s</strong>%2$s</li>',
            esc_html($date->format('Y-m-d H:i:s')),
            esc_html($log_entry->get_message()),
        );
    }
}
