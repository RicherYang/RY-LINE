<div class="submitbox">
    <?php if (empty($richMenuId)) { ?>
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
    <?php } else { ?>
    <div class="misc-pub-section">
        <p><?php esc_html_e('Upload to LINE menu can\'t edit.', 'ry-line'); ?></p>
    </div>
    <?php } ?>
</div>
