<?php

/**
 * Plugin Name: RY LINE
 * Plugin URI: https://ry-plugin.com/ry-line
 * Description: LINE support
 * Version: 2026.7.31
 * Requires at least: 6.8
 * Requires PHP: 8.2
 * Author: Richer Yang
 * Author URI: https://richer.tw/
 * License: GPLv3
 * Update URI: https://ry-plugin.com/ry-line
 *
 * Text Domain: ry-line
 * Domain Path: /languages
 */

defined('ABSPATH') or exit;

use RY\Line\Main;

define('RY_LINE_VERSION', '2026.7.31');
define('RY_LINE_PLUGIN_URL', plugin_dir_url(__FILE__));
define('RY_LINE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('RY_LINE_PLUGIN_BASENAME', plugin_basename(__FILE__));
define('RY_LINE_PLUGIN_LANGUAGES_DIR', plugin_dir_path(__FILE__) . '/languages');

require_once RY_LINE_PLUGIN_DIR . 'includes/vendor/autoload.php';

register_activation_hook(__FILE__, [Main::class, 'plugin_activation']);
register_deactivation_hook(__FILE__, [Main::class, 'plugin_deactivation']);

Main::instance();
