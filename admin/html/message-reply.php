<table class="form-table">
    <tbody>
        <tr>
            <th><?php esc_html_e('Reply Keyword', 'ry-line'); ?></th>
            <td>
                <input name="reply-keyword" id="reply-keyword" type="text" class="long-text" value="<?php echo esc_attr($reply_keyword); ?>">
            </td>
        </tr>
        <tr class="reply-info">
            <th><?php esc_html_e('Reply Source', 'ry-line'); ?></th>
            <td>
                <div class="ry-line-row">
                    <label class="ry-line-col-auto">
                        <input name="reply_from[]" type="checkbox" value="user" <?php checked(in_array('user', $message_data['reply_from'])); ?>> <?php esc_html_e('User', 'ry-line'); ?>
                    </label>
                    <label class="ry-line-col-auto">
                        <input name="reply_from[]" type="checkbox" value="group" <?php checked(in_array('group', $message_data['reply_from'])); ?>> <?php esc_html_e('Group', 'ry-line'); ?>
                    </label>
                    <label class="ry-line-col-auto">
                        <input name="reply_from[]" type="checkbox" value="room" <?php checked(in_array('room', $message_data['reply_from'])); ?>> <?php esc_html_e('Room', 'ry-line'); ?>
                    </label>
                </div>
            </td>
        </tr>
    </tbody>
</table>
