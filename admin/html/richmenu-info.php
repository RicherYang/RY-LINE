<table class="form-table">
    <tbody>
        <tr>
            <th scope="row"><label for="chatBarText"><?php echo esc_html__('Chat button text', 'ry-line'); ?></label></th>
            <td><input name="chatBarText" type="text" id="chatBarText" value="<?php echo esc_attr($richmenu_data['chatBarText'] ?? __('Open menu', 'ry-line')); ?>" class="regular-text"></td>
        </tr>
        <tr>
            <th scope="row"><?php echo esc_html__('Display', 'ry-line'); ?></th>
            <td>
                <fieldset><label for="selected">
                    <input name="selected" type="checkbox" id="selected" value="1" <?php checked($richmenu_data['selected'] ?? true); ?>>
                    <?php echo esc_html__('Default display the rich menu', 'ry-line'); ?>
                </label></fieldset>
            </td>
        </tr>
    </tbody>
</table>
