<?php

if (!class_exists('RY_ActionScheduler')) {
    include_once __DIR__ . '/composer/vendor/woocommerce/action-scheduler/action-scheduler.php';

    class RY_ActionScheduler
    {
        protected static $_instance = null;

        private static $action_id = null;

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
            add_action('action_scheduler_pre_init', [$this, 'load']);
        }

        public function load(): void
        {
            add_action('action_scheduler_begin_execute', [$this, 'set_action_id']);
            add_filter('action_scheduler_queue_runner_time_limit', [$this, 'set_45']);

            if (is_admin()) {
                include_once __DIR__ . '/admin/admin-view.php';
                include_once __DIR__ . '/admin/dashboard.php';
                include_once __DIR__ . '/admin/list-table.php';

                add_filter('action_scheduler_admin_view_class', [$this, 'change_adminview']);
            }
        }

        public function set_action_id($action_id): void
        {
            self::$action_id = $action_id;
        }

        public function set_45(): int
        {
            return 45;
        }

        public function change_adminview(): string
        {
            return 'RY_ActionScheduler_AdminView';
        }

        public static function add_log(string $message): void
        {
            if (null !== self::$action_id) {
                ActionScheduler_Logger::instance()->log(self::$action_id, $message);
            }
        }
    }

    RY_ActionScheduler::instance();
}
