<div class="submitbox">
    <div class="misc-pub-section">
        <?php esc_html_e('Please save data before performing any LINE operations.', 'ry-line'); ?>
    </div>

    <?php if (empty($richMenuId)) { ?>
    <div id="major-publishing-actions">
        <div id="publishing-action">
            <button type="button" class="button button-primary ry-line-loading ry-create-menu"><?php esc_html_e('Create menu', 'ry-line'); ?></button>
        </div>
        <div class="clear"></div>
    </div>
    <?php } else { ?>
    <div id="major-actions">
        <div class="misc-pub-section">
            <p>
                <label for="menu-alias"><?php esc_html_e('Menu alias', 'ry-line'); ?></label>
                <input id="menu-alias" name="menu-alias" type="text" value="<?php echo esc_attr($richMenuAliasId); ?>" placeholder="<?php esc_attr_e('Enter menu alias', 'ry-line'); ?>">
            </p>
            <button type="button" class="button ry-line-loading ry-set-alias"><?php esc_html_e('Set menu alias', 'ry-line'); ?></button>
        </div>
        <?php if (!empty($line_user_ID)) { ?>
        <div class="misc-pub-section">
            <button type="button" class="button ry-line-loading ry-set-test"><?php esc_html_e('Link to test user', 'ry-line'); ?></button>
        </div>
        <?php } ?>
    </div>
    <div id="major-publishing-actions">
        <div id="delete-action">
            <a class="submitdelete deletion ry-line-loading ry-delete-menu" href="javascript:void(0);"><?php esc_html_e('Delete menu', 'ry-line'); ?></a>
        </div>
        <div id="publishing-action">
            <button type="button" class="button button-primary ry-line-loading ry-default-menu"><?php $default_ID == $post->ID ? esc_html_e('Unset default menu', 'ry-line') : esc_html_e('Default menu', 'ry-line'); ?></button>
        </div>
        <div class="clear"></div>
    </div>
    <?php } ?>
</div>
