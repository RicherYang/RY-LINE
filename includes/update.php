<?php

final class RY_LINE_update
{
    public static function update()
    {
        $now_version = RY_LINE::get_option('version');

        if (false === $now_version) {
            $now_version = '0.0.0';
        }
        if (RY_LINE_VERSION === $now_version) {
            return;
        }

        if (version_compare($now_version, '0.4.0', '<')) {
            RY_LINE::create_roles();

            RY_LINE::update_option('version', '0.4.0', true);
        }

        if (version_compare($now_version, '0.4.5', '<')) {
            RY_LINE::update_option('version', '0.4.5', true);
        }
    }
}
