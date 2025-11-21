<h2><?php esc_html_e('Messaging API', 'ry-line'); ?></h2>

<table class="form-table">
    <tbody>
        <tr>
            <th><label for="channel-id"><?php esc_html_e('Channel ID', 'ry-line'); ?></label></th>
            <td>
                <input name="channel-id" type="text" class="regular-text" value="<?php echo esc_attr(RY_LINE::get_option('channel_id')); ?>">
                <?php if (!empty($bot_info)) { ?>
                <table>
                    <tr>
                        <td style="padding-bottom:0">
                            <img src="<?php echo esc_url($bot_info['icon']); ?>" alt="" width="64" height="64" style="border-radius: 50%;">
                        </td>
                        <td style="padding-bottom:0;line-height:1.4">
                            <?php esc_html_e('Bot basic ID: ', 'ry-line'); ?> <?php echo esc_html($bot_info['id']); ?><br>
                            <?php esc_html_e('Channel name: ', 'ry-line'); ?> <?php echo esc_html($bot_info['name']); ?><br>
                            <?php esc_html_e('Webhook URL: ', 'ry-line'); ?> <?php echo esc_html($bot_info['webhook-url']); ?><br>
                            <?php esc_html_e('Webhook status: ', 'ry-line'); ?> <?php $bot_info['webhook-status'] ? esc_html_e('Enabled', 'ry-line') : esc_html_e('Disabled', 'ry-line'); ?><br>
                            <?php esc_html_e('Message usage: ', 'ry-line'); ?> <span class="ry-line-load-info" data-id="consumption">?</span> / <span class="ry-line-load-info" data-id="quota">?</span><br>
                            <?php esc_html_e('Friends count: ', 'ry-line'); ?> <span class="ry-line-load-info" data-id="friends">?</span></p>
                        </td>
                    </tr>
                </table>
                <?php } ?>
            </td>
        </tr>
        <tr>
            <th><label for="channel-secret"><?php esc_html_e('Channel secret', 'ry-line'); ?></label></th>
            <td>
                <input name="channel-secret" type="text" class="regular-text" value="<?php echo esc_attr(RY_LINE::get_option('channel_secret')); ?>">
            </td>
        </tr>
        <tr>
            <th><label for="test-user-id"><?php esc_html_e('Test user ID', 'ry-line'); ?></label></th>
            <td>
                <input name="test-user-id" type="text" class="regular-text" value="<?php echo esc_attr(RY_LINE::get_option('test_user_id')); ?>">
                <?php if (!empty($user_info)) { ?>
                <table>
                    <tr>
                        <td style="padding-bottom:0">
                            <img src="<?php echo esc_url($user_info['icon']); ?>" alt="" width="64" height="64" style="border-radius: 50%;">
                        </td>
                        <td style="padding-bottom:0">
                            <?php esc_html_e('User name: ', 'ry-line'); ?> <?php echo esc_html($user_info['name']); ?><br>
                            <?php esc_html_e('Language: ', 'ry-line'); ?> <?php echo esc_html($user_info['lang']); ?>
                        </td>
                    </tr>
                </table>
                <?php } ?>
            </td>
        </tr>
    </tbody>
</table>
