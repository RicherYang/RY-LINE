/**
 * Rewrite from
 *
 * flex2html
 * https://github.com/PamornT/flex2html
 * MIT License
 */

import $ from 'jquery';

import './preview.scss';

interface FlexBubble {
    type: string;
    size: string;
    direction?: string;
    header?: FlexComponent;
    hero?: FlexComponent;
    body?: FlexComponent;
    footer?: FlexComponent;
    styles?: FlexStyles;
}

interface FlexComponent {
    type?: string;
    layout?: string;
    contents?: FlexComponent[];
    position?: string;
    flex?: number;
    spacing?: string;
    margin?: string;
    width?: string;
    height?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: string;
    cornerRadius?: string;
    justifyContent?: string;
    alignItems?: string;
    offsetTop?: string;
    offsetBottom?: string;
    offsetStart?: string;
    offsetEnd?: string;
    paddingAll?: string;
    paddingTop?: string;
    paddingBottom?: string;
    paddingStart?: string;
    paddingEnd?: string;
    background?: FlexBackground;
    maxWidth?: string;
    maxHeight?: string;
    size?: string;
    aspectRatio?: string;
    aspectMode?: string;
    url?: string;
    previewUrl?: string;
    align?: string;
    gravity?: string;
    text?: string;
    color?: string;
    weight?: string;
    style?: string;
    decoration?: string;
    wrap?: boolean;
    adjustMode?: string;
    lineSpacing?: string;
    action?: FlexAction;
}

interface FlexBackground {
    type?: string;
    angle?: string;
    startColor?: string;
    centerColor?: string;
    centerPosition?: string;
    endColor?: string;
}

interface FlexStyles {
    hero?: { backgroundColor?: string };
    header?: { backgroundColor?: string };
    body?: { backgroundColor?: string };
    footer?: { backgroundColor?: string };
}

interface FlexAction {
    label?: string;
    type?: string;
    uri?: string;
    data?: string;
}

function hero_struc(jsonData: FlexBubble): JQuery<HTMLElement> {
    const elem = $('<div>').addClass(['flex-hero']);
    if (jsonData.styles?.hero?.backgroundColor) {
        elem.css('background-color', jsonData.styles.hero.backgroundColor);
    }
    return elem;
}

function header_struc(jsonData: FlexBubble): JQuery<HTMLElement> {
    const elem = $('<div>').addClass(['flex-header']);
    if (jsonData.styles?.header?.backgroundColor) {
        elem.css('background-color', jsonData.styles.header.backgroundColor);
    }
    return elem;
}

function body_struc(jsonData: FlexBubble): JQuery<HTMLElement> {
    const classes = ['flex-body'];
    const elem = $('<div>').addClass(classes);
    if (jsonData.styles?.body?.backgroundColor) {
        elem.css('background-color', jsonData.styles.body.backgroundColor);
    }
    return elem;
}

function footer_struc(jsonData: FlexBubble): JQuery<HTMLElement> {
    const elem = $('<div>').addClass(['flex-footer']);
    if (jsonData.styles?.footer?.backgroundColor) {
        elem.css('background-color', jsonData.styles.footer.backgroundColor);
    }
    return elem;
}

function bubble_object(jsonData: FlexBubble): JQuery<HTMLElement> {
    const elem = $('<div>')
        .addClass(['flex-bubble', `size-${jsonData.size}`])
        .attr('dir', jsonData.direction ?? 'ltr');

    for (const key in jsonData.header) {
        if (key === 'type') {
            if (jsonData.header[key as keyof FlexComponent] === 'box') {
                elem.append(header_struc(jsonData).append(
                    box_recursive(box_object(jsonData.header), jsonData.header.layout ?? '', jsonData.header.contents ?? [])
                ));
            }
        }
    }


    for (const key in jsonData.hero) {
        if (key === 'type') {
            if (jsonData.hero[key as keyof FlexComponent] === 'box') {
                elem.append(hero_struc(jsonData).append(
                    box_recursive(box_object(jsonData.hero), jsonData.hero.layout ?? '', jsonData.hero.contents ?? [])
                ));
            }
            if (jsonData.hero[key as keyof FlexComponent] === 'image') {
                elem.append(hero_struc(jsonData).append(
                    convert_object('', jsonData.hero)
                ));
            }
        }
    }

    for (const key in jsonData.body) {
        if (key === 'type') {
            if (jsonData.body[key as keyof FlexComponent] === 'box') {
                elem.append(body_struc(jsonData).append(
                    box_recursive(box_object(jsonData.body), jsonData.body.layout ?? '', jsonData.body.contents ?? [])
                ));
            }
        }
    }

    for (const key in jsonData.footer) {
        if (key === 'type') {
            if (jsonData.footer[key as keyof FlexComponent] === 'box') {
                elem.append(footer_struc(jsonData).append(
                    box_recursive(box_object(jsonData.footer), jsonData.footer.layout ?? '', jsonData.footer.contents ?? [])
                ));
            }
        }
    }

    return elem;
}

function add_global_style(jsonData: FlexComponent, classes: string[], styles: Record<string, string>): void {
    if (jsonData.margin) {
        if (['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'].includes(jsonData.margin)) {
            classes.push(`margin-${jsonData.margin}`);
        } else {
            styles['margin-top'] = jsonData.margin;
        }
    }

    if (jsonData.position) {
        classes.push(`position-${jsonData.position}`);
    }

    if (jsonData.offsetTop) {
        if (['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'].includes(jsonData.offsetTop)) {
            classes.push(`offset-top-${jsonData.offsetTop}`);
        } else {
            styles['top'] = jsonData.offsetTop;
        }
    }
    if (jsonData.offsetBottom) {
        if (['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'].includes(jsonData.offsetBottom)) {
            classes.push(`offset-bottom-${jsonData.offsetBottom}`);
        } else {
            styles['bottom'] = jsonData.offsetBottom;
        }
    }
    if (jsonData.offsetStart) {
        if (['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'].includes(jsonData.offsetStart)) {
            classes.push(`offset-start-${jsonData.offsetStart}`);
        } else {
            styles['left'] = jsonData.offsetStart;
        }
    }
    if (jsonData.offsetEnd) {
        if (['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'].includes(jsonData.offsetEnd)) {
            classes.push(`offset-end-${jsonData.offsetEnd}`);
        } else {
            styles['right'] = jsonData.offsetEnd;
        }
    }
}

function box_recursive(parent_box: JQuery<HTMLElement>, layout: string, jsonData: FlexComponent[]): JQuery<HTMLElement> {
    if (Array.isArray(jsonData)) {
        const result: JQuery<HTMLElement>[] = [];
        jsonData.forEach((obj, index) => {
            let temp: JQuery<HTMLElement>;
            if (obj.type === 'box') {
                temp = box_recursive(box_object(obj), obj.layout ?? '', obj.contents ?? []);
            } else if (obj.type === 'text' && obj.contents && obj.contents.length > 0) {
                temp = box_recursive(convert_object(layout, obj), obj.layout ?? '', obj.contents);
            } else {
                temp = convert_object(layout, obj);
            }
            result[index] = temp;
        });
        jsonData.forEach((obj, index) => {
            if (obj.type === 'span') {
                parent_box.find('p').append(result[index]);
            } else {
                parent_box.append(result[index]);
            }
        });
    }

    return parent_box;
}

function convert_object(layout: string, jsonData: FlexComponent): JQuery<HTMLElement> {
    switch (jsonData.type) {
        case 'image':
            return image_object(jsonData);
        case 'icon':
            return icon_object(jsonData);
        case 'text':
            return text_object(jsonData);
        case 'span':
            return span_object(jsonData);
        case 'button':
            return button_object(jsonData);
        case 'separator':
            return separator_object(layout, jsonData);
    }
    return $('<div>');
}

function box_object(jsonData: FlexComponent): JQuery<HTMLElement> {
    const styles: Record<string, string> = {};
    const classes: string[] = ['flex-type-box'];

    add_global_style(jsonData, classes, styles);

    if (jsonData.layout === 'baseline') {
        classes.push('layout-baseline', 'layout-horizontal');
    } else if (jsonData.layout === 'horizontal') {
        classes.push('layout-horizontal');
    } else if (jsonData.layout === 'vertical') {
        classes.push('layout-vertical');
    }

    if (jsonData.backgroundColor) {
        styles['background-color'] = `${jsonData.backgroundColor}`;
    }
    if (jsonData.borderColor) {
        styles['border-color'] = `${jsonData.borderColor}`;
    }

    if (jsonData.borderWidth) {
        if (['none', 'light', 'normal', 'medium', 'semi-bold', 'bold'].includes(jsonData.borderWidth)) {
            classes.push(`border-width-${jsonData.borderWidth}`);
        } else {
            styles['border-width'] = jsonData.borderWidth;
        }
    }
    if (jsonData.cornerRadius) {
        if (['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'].includes(jsonData.cornerRadius)) {
            classes.push(`border-radius-${jsonData.cornerRadius}`);
        } else {
            styles['border-radius'] = jsonData.cornerRadius;
        }
    }

    if (jsonData.width) {
        styles['width'] = jsonData.width;
    }
    if (jsonData.maxWidth) {
        styles['max-width'] = jsonData.maxWidth;
    }
    if (jsonData.height) {
        styles['height'] = jsonData.height;
    }
    if (jsonData.maxHeight) {
        styles['max-height'] = jsonData.maxHeight;
    }

    if (jsonData.flex) {
        if (jsonData.flex > 0) {
            styles['flex'] = `${jsonData.flex} 0 auto`;
        }
        classes.push(`flex-${jsonData.flex}`);
    }

    if (jsonData.justifyContent) {
        classes.push(`justify-${jsonData.justifyContent}`);
    }
    if (jsonData.alignItems) {
        classes.push(`align-${jsonData.alignItems}`);
    }

    if (jsonData.spacing && jsonData.spacing.indexOf('px') >= 0) {
        // no class
    } else if (jsonData.spacing) {
        classes.push(`spacing-${jsonData.spacing}`);
    }

    if (jsonData.paddingAll && jsonData.paddingAll.indexOf('px') >= 0) {
        styles['padding'] = jsonData.paddingAll;
    } else if (jsonData.paddingAll) {
        classes.push(`padding-${jsonData.paddingAll}`);
    }
    if (jsonData.paddingTop && jsonData.paddingTop.indexOf('px') >= 0) {
        styles['padding-top'] = jsonData.paddingTop;
    } else if (jsonData.paddingTop) {
        classes.push(`padding-top-${jsonData.paddingTop}`);
    }
    if (jsonData.paddingBottom && jsonData.paddingBottom.indexOf('px') >= 0) {
        styles['padding-bottom'] = jsonData.paddingBottom;
    } else if (jsonData.paddingBottom) {
        classes.push(`padding-bottom-${jsonData.paddingBottom}`);
    }
    if (jsonData.paddingStart && jsonData.paddingStart.indexOf('px') >= 0) {
        styles['padding-start'] = jsonData.paddingStart;
    } else if (jsonData.paddingStart) {
        classes.push(`padding-start-${jsonData.paddingStart}`);
    }
    if (jsonData.paddingEnd && jsonData.paddingEnd.indexOf('px') >= 0) {
        styles['padding-end'] = jsonData.paddingEnd;
    } else if (jsonData.paddingEnd) {
        classes.push(`padding-end-${jsonData.paddingEnd}`);
    }

    if (jsonData.background && jsonData.background.type === 'linearGradient') {
        const centerPosition = jsonData.background.centerPosition ?? '50%';
        if (jsonData.background.centerColor) {
            styles['background'] = `linear-gradient(${jsonData.background.angle}, ${jsonData.background.startColor} 0%, ${jsonData.background.centerColor} ${centerPosition}, ${jsonData.background.endColor} 100%)`;
        } else {
            styles['background'] = `linear-gradient(${jsonData.background.angle}, ${jsonData.background.startColor} 0%, ${jsonData.background.endColor} 100%)`;
        }
    }

    return $('<div>')
        .addClass(classes)
        .css(styles);
}

function button_object(jsonData: FlexComponent): JQuery<HTMLElement> {
    const styles: Record<string, string> = {};
    const styles2: Record<string, string> = {};
    const classes: string[] = ['flex-type-button'];

    add_global_style(jsonData, classes, styles);

    if (jsonData.style) {
        classes.push(`style-${jsonData.style}`);
    } else {
        classes.push('style-link');
    }

    if (jsonData.flex) {
        if (jsonData.flex > 0) {
            styles['flex'] = `${jsonData.flex} 0 auto`;
        }
        classes.push(`flex-${jsonData.flex}`);
    }

    if (jsonData.height) {
        if (['sm', 'md'].includes(jsonData.height)) {
            classes.push(`height-${jsonData.height}`);
        } else {
            styles['height'] = jsonData.height;
        }
    }

    if (jsonData.color) {
        if (jsonData.style === 'link') {
            styles2['color'] = `${jsonData.color}`;
        } else {
            styles2['background-color'] = `${jsonData.color}`;
        }
    }

    if (jsonData.gravity) {
        classes.push(`gravity-${jsonData.gravity}`);
    }

    return $('<div>')
        .addClass(classes)
        .css(styles)
        .append($('<a>')
            .append($('<div>')
                .css(styles2)
                .text(jsonData.action?.label ?? '')
            )
        );
}

function image_object(jsonData: FlexComponent): JQuery<HTMLElement> {
    const styles: Record<string, string> = {};
    const styles2: Record<string, string> = {};
    const classes: string[] = ['flex-type-image'];
    const styleimg: Record<string, string> = {
        'background-image': `url('${jsonData.url}')`
    };

    add_global_style(jsonData, classes, styles);

    if (jsonData.backgroundColor) {
        styleimg['background-color'] = `${jsonData.backgroundColor}`;
    }

    if (jsonData.aspectMode) {
        classes.push(`aspect-${jsonData.aspectMode}`);
    }
    if (jsonData.gravity) {
        classes.push(`gravity-${jsonData.gravity}`);
    }

    if (jsonData.size) {
        if (['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl', '5xl'].includes(jsonData.size)) {
            classes.push(`size-${jsonData.size}`);
        } else {
            styles['width'] = jsonData.size;
        }
    }

    let ratio: string | number = '100';
    if (!jsonData.aspectRatio || jsonData.aspectRatio === '') {
        ratio = '100';
    } else {
        const ratioParts = jsonData.aspectRatio.split(':');
        ratio = parseFloat(ratioParts[1]) * 100 / parseFloat(ratioParts[0]);
    }

    if (jsonData.flex) {
        if (jsonData.flex > 0) {
            styles['flex'] = `${jsonData.flex} 0 auto`;
        }
        classes.push(`flex-${jsonData.flex}`);
    }

    if (jsonData.align) {
        classes.push(`align-${jsonData.align}`);
    }

    return $('<div>')
        .addClass(classes)
        .css(styles)
        .append($('<div>')
            .css(styles2)
            .append($('<a>')
                .css('padding-bottom', `${ratio}%`)
                .append($('<span>')
                    .css(styleimg)
                )
            )
        );
}

function icon_object(jsonData: FlexComponent): JQuery<HTMLElement> {
    const styles: Record<string, string> = {};
    const classes: string[] = ['flex-type-icon', 'flex-0'];
    const styleimg: Record<string, string> = {
        'background-image': `url('${jsonData.url}')`
    };

    add_global_style(jsonData, classes, styles);

    if (jsonData.size) {
        if (['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl', '5xl'].includes(jsonData.size)) {
            classes.push(`size-${jsonData.size}`);
        } else {
            styles['font-size'] = jsonData.size;
        }
    }

    if (!jsonData.aspectRatio || jsonData.aspectRatio === '') {
        styleimg['width'] = '1em';
    } else {
        const ratioParts = jsonData.aspectRatio.split(':');
        const ratioValue = parseFloat(ratioParts[0]) / parseFloat(ratioParts[1]);
        styleimg['width'] = `${ratioValue}em`;
    }

    return $('<div>')
        .addClass(classes)
        .css(styles)
        .append($('<div>')
            .append($('<span>')
                .css(styleimg)
            )
        );
}

function text_object(jsonData: FlexComponent): JQuery<HTMLElement> {
    const styles: Record<string, string> = {};
    const classes: string[] = ['flex-type-text'];

    add_global_style(jsonData, classes, styles);

    if (jsonData.flex) {
        if (jsonData.flex > 0) {
            styles['flex'] = `${jsonData.flex} 0 auto`;
        }
        classes.push(`flex-${jsonData.flex}`);
    }

    if (jsonData.align) {
        classes.push(`align-${jsonData.align}`);
    }

    if (jsonData.size) {
        if (['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl', '5xl'].includes(jsonData.size)) {
            classes.push(`size-${jsonData.size}`);
        } else {
            styles['font-size'] = jsonData.size;
        }
    }

    if (jsonData.color) {
        styles['color'] = jsonData.color;
    }

    if (jsonData.weight) {
        classes.push(`font-weight-${jsonData.weight}`);
    }
    if (jsonData.style) {
        classes.push(`font-style-${jsonData.style}`);
    }
    if (jsonData.decoration) {
        classes.push(`decoration-${jsonData.decoration}`);
    }

    if (jsonData.wrap) {
        classes.push('word-wrap');
    }
    if (jsonData.gravity) {
        classes.push(`gravity-${jsonData.gravity}`);
    }

    if (jsonData.lineSpacing && jsonData.lineSpacing.indexOf('px') >= 0) {
        const lineHeight = (parseInt(jsonData.lineSpacing.replace('px', '')) + 15) + 'px';
        styles['line-height'] = lineHeight;
    }

    return $('<div>')
        .addClass(classes)
        .css(styles)
        .append($('<p>')
            .text((!jsonData.text) ? '' : (jsonData.contents ? '' : jsonData.text))
        );
}

function span_object(jsonData: FlexComponent): JQuery<HTMLElement> {
    const styles: Record<string, string> = {};
    const classes: string[] = ['flex-type-span'];

    add_global_style(jsonData, classes, styles);

    if (jsonData.size) {
        if (['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl', '5xl'].includes(jsonData.size)) {
            classes.push(`size-${jsonData.size}`);
        } else {
            styles['font-size'] = jsonData.size;
        }
    }

    if (jsonData.color) {
        styles['color'] = jsonData.color;
    }

    if (jsonData.weight) {
        classes.push(`font-weight-${jsonData.weight}`);
    }
    if (jsonData.style) {
        classes.push(`font-style-${jsonData.style}`);
    }
    if (jsonData.decoration) {
        classes.push(`decoration-${jsonData.decoration}`);
    }

    return $('<span>')
        .addClass(classes)
        .css(styles)
        .text(jsonData.text ?? '');
}

function separator_object(layout: string, jsonData: FlexComponent): JQuery<HTMLElement> {
    const styles: Record<string, string> = {};
    const classes: string[] = ['flex-type-separator', 'flex-0'];

    add_global_style(jsonData, classes, styles);

    if (jsonData.color) {
        styles['border-color'] = `${jsonData.color}`;
    }

    return $('<div>')
        .addClass(classes)
        .css(styles);
}

export default function flexPreview(selector: string, jsonData: FlexBubble): void {
    const $iFrame = $(selector).contents().find('.flex-message');
    if ($iFrame.length) {
        $iFrame.empty()
            .append(bubble_object(jsonData));
    } else {
        setTimeout(() => {
            flexPreview(selector, jsonData);
        });
    }
}
