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
                <form method="post" action="admin-post.php">
                    <input type="hidden" name="action" value="ry/admin-line-tools">
                    <input type="hidden" name="do" value="reload-richmenu">
                    <?php wp_nonce_field('ry/admin-line-tools'); ?>
                    <button type="submit" class="button ry-line-loading"><?php esc_html_e('Reload rich menu', 'ry-line'); ?></button>
                </form>
            </td>
        </tr>
        <tr>
            <td>
                <strong><?php esc_html_e('Clear unused rich menu alias', 'ry-line'); ?></strong>
            </td>
            <td class="action">
                <form method="post" action="admin-post.php">
                    <input type="hidden" name="action" value="ry/admin-line-tools">
                    <input type="hidden" name="do" value="clear-unused-rich-aliases">
                    <?php wp_nonce_field('ry/admin-line-tools'); ?>
                    <button type="submit" class="button ry-line-loading"><?php esc_html_e('Clear alias', 'ry-line'); ?></button>
                </form>
            </td>
        </tr>
        <?php if (!empty($line_user_ID)) { ?>
        <tr>
            <td>
                <strong><?php esc_html_e('Unlink test user rich menu', 'ry-line'); ?></strong>
            </td>
            <td class="action">
                <form method="post" action="admin-post.php">
                    <input type="hidden" name="action" value="ry/admin-line-tools">
                    <input type="hidden" name="do" value="clear-test-user-rich-menu">
                    <?php wp_nonce_field('ry/admin-line-tools'); ?>
                    <button type="submit" class="button ry-line-loading"><?php esc_html_e('Unlink test user', 'ry-line'); ?></button>
                </form>
            </td>
        </tr>
        <?php } ?>
    </tbody>
</table>
