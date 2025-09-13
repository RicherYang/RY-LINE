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
                                <img src="<?php echo esc_url($bot_info['icon']); ?>" alt="<?php esc_html_e('Channel icon', 'ry-line'); ?>" width="64" height="64" style="border-radius: 50%;">
                            </td>
                            <td style="padding-bottom:0">
                                <?php esc_html_e('Bot basic ID: ', 'ry-line'); ?><?php echo esc_html($bot_info['id']); ?><br>
                                <?php esc_html_e('Channel name: ', 'ry-line'); ?><?php echo esc_html($bot_info['name']); ?>
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
     </tbody>
 </table>
