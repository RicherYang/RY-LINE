<?php

final class RY_LINE_Cron
{
    public static function add_action(): void
    {
        add_action(RY_LINE::OPTION_PREFIX . 'check_expire', [__CLASS__, 'check_expire']);
    }

    public static function check_expire(): void
    {
        RY_LINE_License::instance()->check_expire();
    }
}
