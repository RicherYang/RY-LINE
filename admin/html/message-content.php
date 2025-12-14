<table class="form-table">
    <tbody>
        <tr>
            <th><?php esc_html_e('Message type', 'ry-line'); ?></th>
            <td>
                <select name="message-type" id="message-type">
                    <option value="text" <?php selected($message_type, 'text'); ?>><?php echo esc_html_x('Text', 'message type', 'ry-line'); ?></option>
                    <option value="image" <?php selected($message_type, 'image'); ?>><?php echo esc_html_x('Image', 'message type', 'ry-line'); ?></option>
                    <option value="flex" <?php selected($message_type, 'flex'); ?>><?php echo esc_html_x('Flex single', 'message type', 'ry-line'); ?></option>
                    <option value="flexes" <?php selected($message_type, 'flexes'); ?>><?php echo esc_html_x('Flex multiple', 'message type', 'ry-line'); ?></option>
                </select>
            </td>
        </tr>
        <tr class="type-info type-info-text">
            <th>
                <?php esc_html_e('Content', 'ry-line'); ?><br>
                <span class="ry-template-string" data-target="#message-content">{{ }}</span>
            </th>
            <td>
                <textarea name="message-content" id="message-content" class="large-text" rows="3"><?php echo esc_textarea($post->post_content); ?></textarea>
            </td>
        </tr>
        <tr class="type-info type-info-flex">
            <th>
                <?php esc_html_e('Content', 'ry-line'); ?><br>
                <span class="ry-template-string" data-target="#flex-message-content">{{ }}</span>
            </th>
            <td>
                <textarea name="flex-message-content" id="flex-message-content" class="large-text" rows="6"><?php echo esc_textarea($post->post_content); ?></textarea>
                <p class="description type-info type-info-flex"><?php esc_html_e('For Flex message, please enter the JSON content.', 'ry-line'); ?></p>
            </td>
        </tr>
        <tr class="type-info type-info-flexes">
            <th>
                <?php esc_html_e('Content', 'ry-line'); ?>
            </th>
            <td>
                <select name="use-messages[]" id="use-messages" multiple>
                    <?php foreach ($message_data['use'] ?? [] as $flex_message_ID) { ?>
                    <option value="<?php echo esc_attr($flex_message_ID); ?>" selected><?php echo esc_html(get_the_title($flex_message_ID)); ?></option>
                    <?php } ?>
                </select>
            </td>
        </tr>
        <tr class="type-info type-info-flex type-info-flexes">
            <th>
                <?php esc_html_e('Alt content', 'ry-line'); ?><br>
                <span class="ry-template-string" data-target="#message-alt">{{ }}</span>
            </th>
            <td>
                <textarea name="message-alt" id="message-alt" class="long-text" rows="2"><?php echo esc_textarea($post->post_excerpt); ?></textarea>
            </td>
        </tr>
        <tr>
            <th><?php esc_html_e('Use order', 'ry-line'); ?></th>
            <td>
                <input type="number" name="message-order" id="message-order" class="small-text" value="<?php echo esc_attr($post->menu_order); ?>" min="0" step="1" />
            </td>
        </tr>
    </tbody>
</table>

<div id="ry-template-dialog">
    <div class="ry-line-row">
        <div class="ry-line-col-auto">
            <div class="template-group"></div>
        </div>
        <div class="ry-line-col">
            <div class="template-string"></div>
        </div>
    </div>
</div>
<script type="text/html" id="tmpl-group-item">
    <div class="template-group-item">
        <span>{{ data.name }}</span>
    </div>
</script>
<script type="text/html" id="tmpl-string-item">
    <div class="template-string-item">
        <p>{{ data.name }}</p>
        <code>{{ data.code }}</code>
    </div>
</script>
