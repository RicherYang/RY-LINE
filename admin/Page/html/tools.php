<?php defined('ABSPATH') or exit; ?>

<?php
use RY\General\V20260810\Utils;

?>

<style>
    table#ry-line-tools td {
        padding: 1.5em;
        vertical-align: middle;
    }

    table#ry-line-tools .action {
        text-align: right;
    }
</style>
<table id="ry-line-tools" class="widefat striped">
    <tbody>
        <tr>
            <td>
                <strong><?php esc_html_e('Reload rich menu', 'ry-line'); ?></strong>
            </td>
            <td class="action">
                <?php Utils::the_action_form('line-tools', 'reload-richmenu', __('Reload rich menu', 'ry-line')); ?>
            </td>
        </tr>
        <tr>
            <td>
                <strong><?php esc_html_e('Clear unused rich menu alias', 'ry-line'); ?></strong>
            </td>
            <td class="action">
                <?php Utils::the_action_form('line-tools', 'clear-unused-rich-aliases', __('Clear alias', 'ry-line')); ?>
            </td>
        </tr>
        <?php if (!empty($line_user_ID)) { ?>
        <tr>
            <td>
                <strong><?php esc_html_e('Unlink test user rich menu', 'ry-line'); ?></strong>
            </td>
            <td class="action">
                <?php Utils::the_action_form('line-tools', 'clear-test-user-rich-menu', __('Unlink test user', 'ry-line')); ?>
            </td>
        </tr>
        <?php } ?>
    </tbody>
</table>
