<h2><?php esc_html_e('Webhook', 'ry-line'); ?></h2>

<table>
    <tr>
        <td>
            <form method="post" action="admin-post.php">
                <input type="hidden" name="action" value="ry/admin-line-option">
                <input type="hidden" name="do" value="set-webhook">
                <?php wp_nonce_field('ry/admin-line-option'); ?>
                <button type="submit" class="button ry-line-loading"><?php esc_html_e('Set webhook URL', 'ry-line'); ?></button>
            </form>
        </td>
        <td>&nbsp;</td>
        <td>
            <form method="post" action="admin-post.php">
                <input type="hidden" name="action" value="ry/admin-line-option">
                <input type="hidden" name="do" value="test-webhook">
                <?php wp_nonce_field('ry/admin-line-option'); ?>
                <button type="submit" class="button ry-line-loading"><?php esc_html_e('Test webhook', 'ry-line'); ?></button>
            </form>
        </td>
    </tr>
</table>
