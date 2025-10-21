<div class="submitbox">
    <div id="major-actions">
        <div class="misc-pub-section">
            <p>
                <?php esc_html_e('Validate status:', 'ry-line'); ?>
                <?php $post->post_status === 'publish' ? esc_html_e('Valid', 'ry-line') : esc_html_e('Invalid', 'ry-line'); ?>
            </p>
            <?php if (isset($message_data['error'])) { ?>
            <p>
                <strong><?php esc_html_e('Error info:', 'ry-line'); ?></strong>
                <pre><?php echo esc_html($message_data['error']); ?></pre>
            </p>
            <?php } ?>
            <?php if ($post->post_status === 'publish') { ?>
            <p>
                <button type="button" class="button ry-line-loading ry-send-test"><?php esc_html_e('Send to test user', 'ry-line'); ?></button>
            </p>
            <?php } ?>
        </div>
    </div>

    <div id="major-publishing-actions">
        <div id="delete-action">
            <?php if (current_user_can('delete_post', $post->ID)) { ?>
            <a class="submitdelete deletion" href="<?php echo esc_url(get_delete_post_link($post->ID)); ?>"><?php esc_html_e('Move to Trash', 'ry-line'); ?></a>
            <?php } ?>
        </div>
        <div id="publishing-action">
            <?php submit_button(__('Update', 'ry-line'), 'primary', 'save', false); ?>
        </div>
        <div class="clear"></div>
    </div>
</div>
