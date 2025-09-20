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
<hr>

<div class="ry-line-row">
    <div class="ry-line-col-auto richmenu-img">
        <svg id="richmenu-image-svg" class="richmenu-svg" xmlns="http://www.w3.org/2000/svg" data-bg="<?php echo esc_url($thumbnail_src[0]); ?>" data-width="<?php echo esc_attr($richmenu_data['size']['width']); ?>" data-height="<?php echo esc_attr($richmenu_data['size']['height']); ?>">
            <defs>
                <pattern id="bg-pattern" patternUnits="userSpaceOnUse">
                    <image x="0" y="0" preserveAspectRatio="xMidYMid slice" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg-pattern)" />
            <rect width="100%" height="100%" fill="#000" opacity="0" class="bg" />
            <g class="area-lines"></g>
            <g class="area-texts"></g>
        </svg>
        <p class="description">
            <?php esc_html_e('Create area by dragging them, starting from the edge of the partition.', 'ry-line'); ?><br>
            <?php esc_html_e('Drag the line to adjust their positions. After adjustment, the line that are not started by edges will be removed.', 'ry-line'); ?><br>
            <?php esc_html_e('Double-click line to delete it.', 'ry-line'); ?>
        </p>
    </div>
    <div class="ry-line-col">
        <p>
            <?php echo esc_html(sprintf(
                /* translators: %1$d: image width, %2$d: image height */
                __('Image size: %1$d x %2$d px', 'ry-line'),
                $richmenu_data['size']['width'],
                $richmenu_data['size']['height']
            )); ?>
            <?php if (empty($richMenuId)) { ?>
            <button type="button" class="button ry-reset-areas"><?php esc_html_e('Reset area', 'ry-line'); ?></button>
            <?php } ?>
        </p>

        <fieldset id="richmenu-area-list">
            <table class="wp-list-table widefat striped" style="display:none">
                <thead>
                    <th><?php esc_html_e('No', 'ry-line'); ?></th>
                    <th><?php esc_html_e('Phone display size', 'ry-line'); ?></th>
                    <th><?php esc_html_e('Start', 'ry-line'); ?></th>
                    <th><?php esc_html_e('Size', 'ry-line'); ?></th>
                </thead>
                <tbody></tbody>
                <?php if (empty($richMenuId)) { ?>
                <tfoot>
                    <tr>
                        <td colspan="4">
                            <p class="description"><?php esc_html_e('Phone display size is based on width 360px. The recommended area is larger than 30px.', 'ry-line'); ?></p>
                            <button type="button" class="button button-primary ry-line-loading ry-save-position"><?php esc_html_e('Save area position', 'ry-line'); ?></button>
                        </td>
                    </tr>
                </tfoot>
                <?php } ?>
            </table>
        </fieldset>

        <fieldset id="richmenu-action-list">
            <table class="wp-list-table widefat striped" style="display:none">
                <thead>
                    <th><?php esc_html_e('No', 'ry-line'); ?></th>
                    <th><?php esc_html_e('Position', 'ry-line'); ?></th>
                    <th><?php esc_html_e('Action type', 'ry-line'); ?></th>
                    <th><?php esc_html_e('Action info', 'ry-line'); ?></th>
                </thead>
                <tbody></tbody>
                <?php if (empty($richMenuId)) { ?>
                <tfoot>
                    <tr>
                        <td colspan="4">
                            <button type="button" class="button button-primary ry-line-loading ry-save-action"><?php esc_html_e('Save area action', 'ry-line'); ?></button>
                        </td>
                    </tr>
                </tfoot>
                <?php } ?>
            </table>
        </fieldset>
    </div>
</div>

<script type="text/html" id="tmpl-area-settings">
    <tr>
        <td><input type="hidden" name="area-{{ data.idx }}" value="{{ data.value }}">{{ data.idx }}</td>
        <td>{{ data.phoneSize }}</td>
        <td>{{ data.areaStart }}</td>
        <td>{{ data.areaSize }}</td>
    </tr>
</script>

<script type="text/html" id="tmpl-action-settings">
    <tr>
        <td>{{ data.idx }}</td>
        <td>
            <?php esc_html_e('Start', 'ry-line'); ?> {{ data.areaStart }}<br>
            <?php esc_html_e('Size', 'ry-line'); ?> {{ data.areaSize }}
        </td>
        <td>
            <select name="action-type-{{ data.idx }}" class="action-type">
                <option value=""><?php echo esc_html_x('None', 'action type', 'ry-line'); ?></option>
                <option value="uri"><?php echo esc_html_x('Link', 'action type', 'ry-line'); ?></option>
                <option value="message"><?php echo esc_html_x('Text', 'action type', 'ry-line'); ?></option>
                <option value="richmenuswitch"><?php echo esc_html_x('Switch menu', 'action type', 'ry-line'); ?></option>
            </select>
        </td>
        <td>
            <div class="action-info action-info-uri">
                <label for="action-info-{{ data.idx }}-uri"><?php esc_html_e('URL', 'ry-line'); ?></label>
                <input id="action-info-{{ data.idx }}-uri" name="action-info-{{ data.idx }}-uri" type="url" placeholder="<?php esc_attr_e('Enter url', 'ry-line'); ?>">
            </div>
            <div class="action-info action-info-message">
                <label for="action-info-{{ data.idx }}-text"><?php esc_html_e('Message text', 'ry-line'); ?></label>
                <textarea id="action-info-{{ data.idx }}-text" name="action-info-{{ data.idx }}-text" placeholder="<?php esc_attr_e('Enter message text', 'ry-line'); ?>" rows="3"></textarea>
            </div>
            <div class="action-info action-info-richmenuswitch">
                <label for="action-info-{{ data.idx }}-richMenuAliasId"><?php esc_html_e('Menu alias', 'ry-line'); ?></label>
                <input id="action-info-{{ data.idx }}-richMenuAliasId" name="action-info-{{ data.idx }}-richMenuAliasId" type="text" placeholder="<?php esc_attr_e('Enter menu alias', 'ry-line'); ?>">
            </div>
            <div class="action-info action-info-uri action-info-message">
                <label for="action-info-{{ data.idx }}-label"><?php esc_html_e('Action label', 'ry-line'); ?></label>
                <input id="action-info-{{ data.idx }}-label" name="action-info-{{ data.idx }}-label" type="text" placeholder="<?php esc_attr_e('Enter action label', 'ry-line'); ?>">
            </div>
        </td>
    </tr>
</script>
