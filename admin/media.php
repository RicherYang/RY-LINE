<?php

final class RY_LINE_Admin_Media
{
    protected static $_instance = null;

    public static function instance(): RY_LINE_Admin_Media
    {
        if (null === self::$_instance) {
            self::$_instance = new self();
            self::$_instance->do_init();
        }

        return self::$_instance;
    }

    protected function do_init(): void
    {
        add_filter('admin_post_thumbnail_size', [$this, 'size_for_richmenu'], 10, 3);
        add_filter('admin_post_thumbnail_html', [$this, 'check_for_richmenu'], 10, 3);
    }

    public function size_for_richmenu($size, $thumbnail_ID, $post)
    {
        if ($post->post_type === RY_LINE::POSTTYPE_RICHERMENU) {
            $size = 'medium';
        }

        return $size;
    }

    public function check_for_richmenu($content, $post_ID, $thumbnail_ID)
    {
        if (get_post_type($post_ID) === RY_LINE::POSTTYPE_RICHERMENU) {
            if (str_contains($content, 'remove-post-thumbnail')) {
                $add_info = [];
                $image_meta = wp_get_attachment_metadata($thumbnail_ID);
                $mime_type = get_post_mime_type($thumbnail_ID);

                if (!in_array($mime_type, ['image/jpeg', 'image/png'], true)) {
                    $add_info[] = esc_html__('Image must be JPEG or PNG format', 'ry-line');
                }
                if ($image_meta['width'] < 800 || $image_meta['width'] > 2500) {
                    $add_info[] = esc_html__('Image width must be between 800 and 2500 pixels', 'ry-line');
                }
                if ($image_meta['height'] < 250) {
                    $add_info[] = esc_html__('Image height must be more than 250 pixels', 'ry-line');
                }
                if ($image_meta['width'] / $image_meta['height'] < 1.45) {
                    $add_info[] = esc_html__('Image aspect ratio must be greater than 1.45', 'ry-line');
                }
                if ($image_meta['filesize'] > MB_IN_BYTES) {
                    $add_info[] = esc_html__('Image file size must be less than 1MB', 'ry-line');
                }

                $richmenu_data = get_post_meta($post_ID, 'ry_line_richmenu_data', true);
                if (is_array($richmenu_data) && count($richmenu_data)) {
                    if ($richmenu_data['size']['width'] !== $image_meta['width'] || $richmenu_data['size']['height'] !== $image_meta['height']) {
                        $add_info[] = esc_html__('Changing the image size will clear the option of action areas', 'ry-line');
                    }
                }

                if (count($add_info)) {
                    $add_html = '<p class="file-error">' . implode('<br>', $add_info) . '</p>';

                    $pos = strrpos($content, '<p ');
                    $content = substr_replace($content, $add_html, $pos, 0);
                }
            }
        }

        return $content;
    }
}

RY_LINE_Admin_Media::instance();
