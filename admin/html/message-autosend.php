<table class="form-table">
    <tbody>
        <tr>
            <th><?php esc_html_e('Reply type', 'ry-line'); ?></th>
            <td>
                <div class="ry-line-row">
                    <label class="ry-line-col-auto">
                        <input name="reply-type" type="radio" value="" <?php checked($reply_type, ''); ?>> <?php esc_html_e('None', 'ry-line'); ?>
                    </label>
                    <label class="ry-line-col-auto">
                        <input name="reply-type" type="radio" value="keyword" <?php checked($reply_type, 'keyword'); ?>> <?php esc_html_e('Keyword', 'ry-line'); ?>
                    </label>
                    <label class="ry-line-col-auto">
                        <input name="reply-type" type="radio" value="all-nokeyword" <?php checked($reply_type, 'all-nokeyword'); ?>> <?php esc_html_e('Reply all without keyword', 'ry-line'); ?>
                    </label>
                </div>
            </td>
        </tr>
        <tr class="reply-info reply-info-keyword">
            <th><?php esc_html_e('Reply keyword', 'ry-line'); ?></th>
            <td>
                <input name="reply-keyword" id="reply-keyword" type="text" class="long-text" value="<?php echo esc_attr($reply_keyword); ?>">
            </td>
        </tr>
        <tr class="reply-info reply-info-keyword reply-info-all">
            <th><?php esc_html_e('Reply Source', 'ry-line'); ?></th>
            <td>
                <div class="ry-line-row">
                    <label class="ry-line-col-auto">
                        <input name="reply-from[]" type="checkbox" value="user" <?php checked(in_array('user', $message_data['reply_from'])); ?>> <?php esc_html_e('User', 'ry-line'); ?>
                    </label>
                    <label class="ry-line-col-auto">
                        <input name="reply-from[]" type="checkbox" value="group" <?php checked(in_array('group', $message_data['reply_from'])); ?>> <?php esc_html_e('Group', 'ry-line'); ?>
                    </label>
                    <label class="ry-line-col-auto">
                        <input name="reply-from[]" type="checkbox" value="room" <?php checked(in_array('room', $message_data['reply_from'])); ?>> <?php esc_html_e('Room', 'ry-line'); ?>
                    </label>
                </div>
            </td>
        </tr>
        <tr>
            <th><?php esc_html_e('Event action', 'ry-line'); ?></th>
            <td>
                <div class="ry-line-row">
                    <?php foreach ($autosend_events as $event_key => $event_label) { ?>
                    <label class="ry-line-col-auto">
                        <input name="autosend-event[]" type="checkbox" value="<?php echo esc_attr($event_key); ?>" <?php checked(in_array($event_key, $autosend)); ?>> <?php echo esc_html($event_label); ?>
                    </label>
                    <?php } ?>
                 </div>
            </td>
        </tr>
    </tbody>
</table>
