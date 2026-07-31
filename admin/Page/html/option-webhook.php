<?php defined('ABSPATH') or exit; ?>

<?php
use RY\General\V20260729\Utils;

?>

<h2 class="title"><?php esc_html_e('Webhook', 'ry-line'); ?></h2>
<table>
    <tr>
        <td>
            <?php Utils::the_action_form('line-option', 'set-webhook', __('Set webhook URL', 'ry-line')); ?>
        </td>
        <td>&nbsp;</td>
        <td>
            <?php Utils::the_action_form('line-option', 'test-webhook', __('Test webhook', 'ry-line')); ?>
        </td>
    </tr>
</table>
