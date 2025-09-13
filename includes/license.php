<?php

include_once RY_LINE_PLUGIN_DIR . 'includes/ry-global/abstract-license.php';

final class RY_LINE_License extends RY_Abstract_License
{
    public static $main_class = RY_LINE::class;

    protected static $_instance = null;

    public static function instance(): RY_LINE_License
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
            self::$_instance->do_init();
        }

        return self::$_instance;
    }

    protected function do_init(): void
    {
        $this->valid_key();
    }

    public function activate_key()
    {
        return RY_LINE_LinkServer::instance()->activate_key($this->get_license_key());
    }

    public function get_version_info()
    {
        $version_info = RY_LINE::get_transient('version_info');
        if (empty($version_info)) {
            $version_info = RY_LINE_LinkServer::instance()->check_version();
            if ($version_info) {
                RY_LINE::set_transient('version_info', $version_info, HOUR_IN_SECONDS);
            }
        }

        return $version_info;
    }

    public function check_expire(): void
    {
        $json = RY_LINE_LinkServer::instance()->expire_data();
        if (is_array($json) && isset($json['data'])) {
            $this->set_license_data($json['data']);
            RY_LINE::delete_transient('expire_link_error');
        } elseif (false === $json) {
            $link_error = (int) RY_LINE::get_transient('expire_link_error');
            if ($link_error > 3) {
                $this->delete_license();
            } else {
                if ($link_error <= 0) {
                    $link_error = 0;
                }
                $link_error += 1;
                RY_LINE::set_transient('expire_link_error', $link_error);
            }
        } else {
            $this->delete_license();
        }
    }
}
