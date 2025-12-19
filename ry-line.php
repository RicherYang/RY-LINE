<?php

/**
 * Plugin Name: RY LINE
 * Plugin URI: https://ry-plugin.com/ry-line
 * Description: LINE support
 * Version: 0.6.0
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Author: Richer Yang
 * Author URI: https://richer.tw/
 * License: GPLv3
 * License URI: https://www.gnu.org/licenses/gpl-3.0.txt
 * Update URI: https://ry-plugin.com/ry-line
 *
 * Text Domain: ry-line
 * Domain Path: /languages
 */

function_exists('plugin_dir_url') or exit('No direct script access allowed');

define('RY_LINE_VERSION', '0.6.0');
define('RY_LINE_PLUGIN_URL', plugin_dir_url(__FILE__));
define('RY_LINE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('RY_LINE_PLUGIN_BASENAME', plugin_basename(__FILE__));
define('RY_LINE_PLUGIN_LANGUAGES_DIR', plugin_dir_path(__FILE__) . '/languages');

require_once RY_LINE_PLUGIN_DIR . 'includes/main.php';

register_activation_hook(__FILE__, ['RY_LINE', 'plugin_activation']);
register_deactivation_hook(__FILE__, ['RY_LINE', 'plugin_deactivation']);

function RY_LINE(): RY_LINE
{
    return RY_LINE::instance();
}

RY_LINE();
