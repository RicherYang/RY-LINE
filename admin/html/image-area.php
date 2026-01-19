<div class="ry-line-row">
    <div class="ry-line-col-auto image-area">
        <svg id="image-area-svg" xmlns="http://www.w3.org/2000/svg" data-bg="<?php echo esc_url($thumbnail_src[0]); ?>" data-width="<?php echo esc_attr($thumbnail_src[1]); ?>" data-height="<?php echo esc_attr($thumbnail_src[2]); ?>">
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
        <p style="margin-top:3px;">
            <?php echo esc_html(sprintf(
                /* translators: %1$d: image width, %2$d: image height */
                __('Image size: %1$d x %2$d px', 'ry-line'),
                $thumbnail_src[1],
                $thumbnail_src[2]
            )); ?>
            <?php if (empty($richMenuId)) { ?>
            <button type="button" class="button ry-reset-areas"><?php esc_html_e('Reset area', 'ry-line'); ?></button>
            <?php } ?>
        </p>

        <fieldset id="image-position-list">
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

        <fieldset id="image-action-list">
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

<?php
$wp_query = new WP_Query();
        $messages = $wp_query->query([
            'post_type' => RY_LINE::POSTTYPE_MESSAGE,
            'posts_per_page' => 999,
            'post_status' => 'publish',
            'orderby' => 'menu_order',
            'order' => 'DESC',
        ]); ?>

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
                <option value="selfmessage"><?php echo esc_html_x('Customized message', 'action type', 'ry-line'); ?></option>
                <option value="richmenuswitch"><?php echo esc_html_x('Switch menu', 'action type', 'ry-line'); ?></option>
                <option value="accountlink"><?php echo esc_html_x('Account link', 'action type', 'ry-line'); ?></option>
            </select>
        </td>
        <td>
            <div class="ry-line-row action-info action-info-uri">
                <label for="action-info-{{ data.idx }}-uri" class="ry-line-col-auto"><?php esc_html_e('URL', 'ry-line'); ?></label>
                <div class="ry-line-col">
                    <input id="action-info-{{ data.idx }}-uri" name="action-info-{{ data.idx }}-uri" type="url" placeholder="<?php esc_attr_e('Enter url', 'ry-line'); ?>">
                </div>
            </div>
            <div class="ry-line-row action-info action-info-selfmessage">
                <label for="action-info-{{ data.idx }}-message" class="ry-line-col-auto"><?php esc_html_e('Message', 'ry-line'); ?></label>
                <div class="ry-line-col">
                    <select id="action-info-{{ data.idx }}-message" name="action-info-{{ data.idx }}-message">
                        <?php foreach ($messages as $message) { ?>
                        <option value="<?php echo esc_attr($message->ID); ?>"><?php echo esc_html($message->post_title); ?></option>
                        <?php } ?>
                    </select>
                </div>
            </div>
            <div class="ry-line-row action-info action-info-message action-info-accountlink">
                <label for="action-info-{{ data.idx }}-text" class="ry-line-col-auto"><?php esc_html_e('Message text', 'ry-line'); ?></label>
                <div class="ry-line-col">
                    <textarea id="action-info-{{ data.idx }}-text" name="action-info-{{ data.idx }}-text" placeholder="<?php esc_attr_e('Enter message text', 'ry-line'); ?>" rows="3"></textarea>
                </div>
            </div>
            <div class="ry-line-row action-info action-info-richmenuswitch">
                <label for="action-info-{{ data.idx }}-richMenuAliasId" class="ry-line-col-auto"><?php esc_html_e('Menu alias', 'ry-line'); ?></label>
                <div class="ry-line-col">
                    <input id="action-info-{{ data.idx }}-richMenuAliasId" name="action-info-{{ data.idx }}-richMenuAliasId" type="text" placeholder="<?php esc_attr_e('Enter menu alias', 'ry-line'); ?>">
                </div>
            </div>
            <div class="ry-line-row action-info action-info-uri action-info-message action-info-selfmessage action-info-accountlink">
                <label for="action-info-{{ data.idx }}-label" class="ry-line-col-auto"><?php esc_html_e('Action label', 'ry-line'); ?></label>
                <div class="ry-line-col">
                    <input id="action-info-{{ data.idx }}-label" name="action-info-{{ data.idx }}-label" type="text" placeholder="<?php esc_attr_e('Enter action label', 'ry-line'); ?>">
                </div>
            </div>
        </td>
    </tr>
</script>
