<table class="form-table">
    <tbody>
        <tr>
            <th><?php esc_html_e('Type', 'ry-line'); ?></th>
            <td>
                <select name="message-type" id="message-type">
                    <option value="text" <?php selected($message_data['type'], 'text'); ?>><?php echo esc_html_x('Text', 'message type', 'ry-line'); ?></option>
                    <option value="image" <?php selected($message_data['type'], 'image'); ?>><?php echo esc_html_x('Image', 'message type', 'ry-line'); ?></option>
                    <option value="flex" <?php selected($message_data['type'], 'flex'); ?>><?php echo esc_html_x('Flex', 'message type', 'ry-line'); ?></option>
                </select>
            </td>
        </tr>
        <tr class="type-info type-info-text type-info-flex">
            <th><?php esc_html_e('Content', 'ry-line'); ?></th>
            <td>
                <textarea name="message-content" id="message-content" class="large-text" rows="3"><?php echo esc_textarea($post->post_content); ?></textarea>
                <p class="description type-info type-info-flex"><?php esc_html_e('For Flex message, please enter the JSON content.', 'ry-line'); ?></p>
            </td>
        </tr>
        <tr class="type-info type-info-flex">
            <th><?php esc_html_e('Alt content', 'ry-line'); ?></th>
            <td>
                <input name="message-alt" id="message-alt" type="text" class="long-text" value="<?php echo esc_attr($post->post_excerpt); ?>">
            </td>
        </tr>
    </tbody>
</table>
