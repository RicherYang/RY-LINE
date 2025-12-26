import { __ } from '@wordpress/i18n';
import type { FlexNodeType, ChildTypeMap, NodePropertiesMap, DefaultFlexMessage } from './types.ts';

/**
 * 預設的 Flex Message JSON 結構
 */
export const DEFAULT_FLEX_MESSAGE: DefaultFlexMessage = {
    type: 'bubble',
    body: {
        type: 'box',
        layout: 'vertical',
        contents: [{
            type: 'text',
            text: 'Hello World!!',
            size: 'md'
        }]
    }
};

/**
 * 各種節點類型對應的圖示
 */
export const TYPE_ICONS: Record<FlexNodeType, string> = {
    bubble: '🫧',
    header: '📄',
    hero: '📄',
    body: '📄',
    footer: '📄',
    box: '📦',
    text: '📝',
    button: '🔘',
    image: '🖼️',
    icon: '⭐',
    separator: '➖',
    span: '✏️',
};

/**
 * 節點可以新增的子節點類型
 */
export const ADD_CHILD_TYPES: ChildTypeMap = {
    header: ['box'],
    body: ['box'],
    footer: ['box'],
    hero: ['image', 'box'],
    box: {
        'horizontal': ['box', 'button', 'image', 'text', 'separator'],
        'vertical': ['box', 'button', 'image', 'text', 'separator'],
        'baseline': ['icon', 'text'],
    },
    text: ['span']
};

/**
 * 節點的屬性值定義
 */
export const TYPE_PROPERTIES: NodePropertiesMap = {
    // 結構節點
    bubble: {
        size: {
            label: __('Size', 'ry-line'),
            type: 'select',
            required: true,
            default: 'mega',
            options: ['nano', 'micro', 'deca', 'hecto', 'kilo', 'mega', 'giga'],
        },
        direction: {
            label: __('Text direction', 'ry-line'),
            type: 'select',
            default: 'ltr',
            options: ['', 'ltr', 'rtl'],
        },
        action: {
            label: __('Action', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'postback', 'uri', 'message', 'datetimepicker', 'clipboard'],
        },
    },
    header: {
        backgroundColor: {
            label: __('Background color', 'ry-line'),
            type: 'color',
            verifyType: ['color'],
        },
        separator: {
            label: __('Separator', 'ry-line'),
            type: 'select',
            default: 'false',
            options: ['', 'true', 'false'],
        },
        separatorColor: {
            label: __('Separator color', 'ry-line'),
            type: 'color',
            verifyType: ['color'],
        },
    },
    hero: {
        backgroundColor: {
            label: __('Background color', 'ry-line'),
            type: 'color',
            verifyType: ['color'],
        },
        separator: {
            label: __('Separator', 'ry-line'),
            type: 'select',
            default: 'false',
            options: ['', 'true', 'false'],
        },
        separatorColor: {
            label: __('Separator color', 'ry-line'),
            type: 'color',
            verifyType: ['color'],
        },
    },
    body: {
        backgroundColor: {
            label: __('Background color', 'ry-line'),
            type: 'color',
            verifyType: ['color'],
        },
        separator: {
            label: __('Separator', 'ry-line'),
            type: 'select',
            default: 'false',
            options: ['', 'true', 'false'],
        },
        separatorColor: {
            label: __('Separator color', 'ry-line'),
            type: 'color',
            verifyType: ['color'],
        },
    },
    footer: {
        backgroundColor: {
            label: __('Background color', 'ry-line'),
            type: 'color',
            verifyType: ['color'],
        },
        separator: {
            label: __('Separator', 'ry-line'),
            type: 'select',
            default: 'false',
            options: ['', 'true', 'false'],
        },
        separatorColor: {
            label: __('Separator color', 'ry-line'),
            type: 'color',
            verifyType: ['color'],
        },
    },

    // 一般節點
    box: {
        layout: {
            label: __('Layout', 'ry-line'),
            type: 'select',
            required: true,
            default: 'horizontal',
            options: ['horizontal', 'vertical', 'baseline'],
        },
        backgroundColor: {
            label: __('Background color', 'ry-line'),
            type: 'color',
            verifyType: ['color_alpha'],
            alpha: true,
        },
        borderColor: {
            label: __('Border color', 'ry-line'),
            type: 'color',
            verifyType: ['color'],
        },
        borderWidth: {
            label: __('Border width', 'ry-line'),
            type: 'select',
            default: 'none',
            options: ['', 'none', 'light', 'normal', 'medium', 'semi-bold', 'bold'],
        },
        cornerRadius: {
            label: __('Border radius', 'ry-line'),
            type: 'select',
            default: 'none',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        width: {
            label: __('Width', 'ry-line'),
            type: 'text',
        },
        maxWidth: {
            label: __('Max Width', 'ry-line'),
            type: 'text',
        },
        height: {
            label: __('Height', 'ry-line'),
            type: 'text',
        },
        maxHeight: {
            label: __('Max Height', 'ry-line'),
            type: 'text',
        },
        flex: {
            label: __('Flex', 'ry-line'),
            type: 'number',
            min: 0,
        },
        justifyContent: {
            label: __('Justification', 'ry-line'),
            type: 'select',
            default: 'flex-start',
            options: ['', 'flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
        },
        alignItems: {
            label: __('Vertical alignment', 'ry-line'),
            type: 'select',
            default: 'flex-start',
            options: ['', 'flex-start', 'center', 'flex-end'],
        },
        spacing: {
            label: __('Spacing', 'ry-line'),
            type: 'select',
            default: 'none',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        margin: {
            label: __('Margin', 'ry-line'),
            type: 'select',
            default: 'none',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        paddingAll: {
            label: __('Padding All', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        paddingTop: {
            label: __('Padding Top', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        paddingBottom: {
            label: __('Padding Bottom', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        paddingStart: {
            label: __('Padding Start', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        paddingEnd: {
            label: __('Padding End', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        position: {
            label: __('Position', 'ry-line'),
            type: 'select',
            default: 'relative',
            options: ['', 'relative', 'absolute'],
        },
        offsetTop: {
            label: __('Offset Top', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        offsetBottom: {
            label: __('Offset Bottom', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        offsetStart: {
            label: __('Offset Start', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        offsetEnd: {
            label: __('Offset End', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        action: {
            label: __('Action', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'postback', 'uri', 'message', 'datetimepicker', 'clipboard'],
        },
    },
    button: {
        color: {
            label: __('Color', 'ry-line'),
            type: 'color',
            verifyType: ['color'],
        },
        style: {
            label: __('Style', 'ry-line'),
            type: 'select',
            default: 'link',
            options: ['', 'primary', 'secondary', 'link'],
        },
        flex: {
            label: __('Flex', 'ry-line'),
            type: 'number',
            min: 0,
        },
        height: {
            label: __('Height', 'ry-line'),
            type: 'select',
            default: 'md',
            options: ['', 'sm', 'md'],
        },
        gravity: {
            label: __('Vertical alignment', 'ry-line'),
            type: 'select',
            default: 'top',
            options: ['', 'top', 'center', 'bottom'],
        },
        scaling: {
            label: __('Scaled according APP', 'ry-line'),
            type: 'select',
            default: 'false',
            options: ['', 'true', 'false'],
        },
        adjustMode: {
            label: __('Font size adjust Mode', 'ry-line'),
            type: 'select',
            options: ['', 'shrink-to-fit'],
        },
        margin: {
            label: __('Margin', 'ry-line'),
            type: 'select',
            default: 'none',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        position: {
            label: __('Position', 'ry-line'),
            type: 'select',
            default: 'relative',
            options: ['', 'relative', 'absolute'],
        },
        offsetTop: {
            label: __('Offset Top', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        offsetBottom: {
            label: __('Offset Bottom', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        offsetStart: {
            label: __('Offset Start', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        offsetEnd: {
            label: __('Offset End', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        action: {
            label: __('Action', 'ry-line'),
            type: 'select',
            required: true,
            default: 'uri',
            options: ['postback', 'uri', 'message', 'datetimepicker', 'clipboard'],
        },
    },
    image: {
        url: {
            label: __('URL', 'ry-line'),
            type: 'text',
            verifyType: ['required', 'url', 'image'],
            required: true,
            default: '', description: __('Image format: JPEG or PNG', 'ry-line'),
        },
        backgroundColor: {
            label: __('Background color', 'ry-line'),
            type: 'color',
            verifyType: ['color'],
        },
        flex: {
            label: __('Flex', 'ry-line'),
            type: 'number', min: 0,
        },
        size: {
            label: __('Size', 'ry-line'),
            type: 'select',
            default: 'md',
            options: ['', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl', '5xl', 'full'],
        },
        aspectRatio: {
            label: __('Aspect Ratio', 'ry-line'),
            type: 'text',
            default: '1:1',
        },
        aspectMode: {
            label: __('Aspect Mode', 'ry-line'),
            type: 'select',
            default: 'fit',
            options: ['', 'cover', 'fit'],
        },
        align: {
            label: __('Horizontal alignment', 'ry-line'),
            type: 'select',
            default: 'center',
            options: ['', 'start', 'center', 'end'],
        },
        gravity: {
            label: __('Vertical alignment', 'ry-line'),
            type: 'select',
            default: 'top',
            options: ['', 'top', 'center', 'bottom'],
        },
        margin: {
            label: __('Margin', 'ry-line'),
            type: 'select',
            default: 'none',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        position: {
            label: __('Position', 'ry-line'),
            type: 'select',
            default: 'relative',
            options: ['', 'relative', 'absolute'],
        },
        offsetTop: {
            label: __('Offset Top', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        offsetBottom: {
            label: __('Offset Bottom', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        offsetStart: {
            label: __('Offset Start', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        offsetEnd: {
            label: __('Offset End', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        action: {
            label: __('Action', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'postback', 'uri', 'message', 'datetimepicker', 'clipboard'],
        },
    },
    icon: {
        url: {
            label: __('URL', 'ry-line'),
            type: 'text',
            verifyType: ['required', 'url', 'image'],
            required: true,
            default: '',
            description: __('Image format: JPEG or PNG', 'ry-line'),
        },
        size: {
            label: __('Size', 'ry-line'),
            type: 'select',
            default: 'md',
            options: ['', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl', '5xl'],
        },
        aspectRatio: {
            label: __('Aspect Ratio', 'ry-line'),
            type: 'text',
            default: '1:1',
        },
        scaling: {
            label: __('Scaled according APP', 'ry-line'),
            type: 'select',
            default: 'false',
            options: ['', 'true', 'false'],
        },
        margin: {
            label: __('Margin', 'ry-line'),
            type: 'select',
            default: 'none',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        position: {
            label: __('Position', 'ry-line'),
            type: 'select',
            default: 'relative',
            options: ['', 'relative', 'absolute'],
        },
        offsetTop: {
            label: __('Offset Top', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        offsetBottom: {
            label: __('Offset Bottom', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        offsetStart: {
            label: __('Offset Start', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        offsetEnd: {
            label: __('Offset End', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
    },
    text: {
        text: {
            label: __('Text', 'ry-line'),
            type: 'textarea',
        },
        color: {
            label: __('Color', 'ry-line'),
            type: 'color',
            verifyType: ['color'],
        },
        size: {
            label: __('Font size', 'ry-line'),
            type: 'select',
            default: 'md',
            options: ['', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl', '5xl'],
        },
        scaling: {
            label: __('Scaled according APP', 'ry-line'),
            type: 'select',
            default: 'false',
            options: ['', 'true', 'false'],
        },
        adjustMode: {
            label: __('Font size adjust Mode', 'ry-line'),
            type: 'select',
            options: ['', 'shrink-to-fit'],
        },
        weight: {
            label: __('Font weight', 'ry-line'),
            type: 'select',
            default: 'regular',
            options: ['', 'regular', 'bold'],
        },
        style: {
            label: __('Font style', 'ry-line'),
            type: 'select',
            default: 'normal',
            options: ['', 'normal', 'italic'],
        },
        decoration: {
            label: __('Decoration', 'ry-line'),
            type: 'select',
            default: 'none',
            options: ['', 'none', 'underline', 'line-through'],
        },
        wrap: {
            label: __('Wrap text', 'ry-line'),
            type: 'select',
            default: 'false',
            options: ['', 'true', 'false'],
        },
        lineSpacing: {
            label: __('Line spacing', 'ry-line'),
            type: 'text',
        },
        maxLines: {
            label: __('Max Lines', 'ry-line'),
            type: 'number',
            min: 0,
            step: 1,
        },
        flex: {
            label: __('Flex', 'ry-line'),
            type: 'number', min: 0,
        },
        align: {
            label: __('Horizontal alignment', 'ry-line'),
            type: 'select',
            default: 'center',
            options: ['', 'start', 'center', 'end'],
        },
        gravity: {
            label: __('Vertical alignment', 'ry-line'),
            type: 'select',
            default: 'top',
            options: ['', 'top', 'center', 'bottom'],
        },
        margin: {
            label: __('Margin', 'ry-line'),
            type: 'select',
            default: 'none',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        position: {
            label: __('Position', 'ry-line'),
            type: 'select',
            default: 'relative',
            options: ['', 'relative', 'absolute'],
        },
        offsetTop: {
            label: __('Offset Top', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        offsetBottom: {
            label: __('Offset Bottom', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        offsetStart: {
            label: __('Offset Start', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        offsetEnd: {
            label: __('Offset End', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
        action: {
            label: __('Action', 'ry-line'),
            type: 'select',
            default: '',
            options: ['', 'postback', 'uri', 'message', 'datetimepicker', 'clipboard'],
        },
    },
    span: {
        text: {
            label: __('Text', 'ry-line'),
            type: 'text',
        },
        color: {
            label: __('Color', 'ry-line'),
            type: 'color',
            verifyType: ['color'],
        },
        size: {
            label: __('Font size', 'ry-line'),
            type: 'select',
            options: ['', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl', '5xl'],
        },
        weight: {
            label: __('Font weight', 'ry-line'),
            type: 'select',
            default: 'regular',
            options: ['', 'regular', 'bold'],
        },
        style: {
            label: __('Font style', 'ry-line'),
            type: 'select',
            default: 'normal',
            options: ['', 'normal', 'italic'],
        },
        decoration: {
            label: __('Decoration', 'ry-line'),
            type: 'select',
            default: 'none',
            options: ['', 'none', 'underline', 'line-through'],
        },
    },
    separator: {
        color: {
            label: __('Color', 'ry-line'),
            type: 'color',
            verifyType: ['color'],
        },
        margin: {
            label: __('Margin', 'ry-line'),
            type: 'select',
            default: 'none',
            options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        },
    },

    // Action 內容
    postback: {
        label: {
            label: __('Label', 'ry-line'),
            type: 'text',
        },
        data: {
            label: __('Webhook data', 'ry-line'),
            type: 'text',
            verifyType: ['required'],
            required: true,
        },
        displayText: {
            label: __('Message text', 'ry-line'),
            type: 'textarea',
        },
    },
    message: {
        label: {
            label: __('Label', 'ry-line'),
            type: 'text',
        },
        text: {
            label: __('Message text', 'ry-line'),
            type: 'textarea',
            verifyType: ['required'],
            required: true,
        },
    },
    uri: {
        label: {
            label: __('Label', 'ry-line'),
            type: 'text',
        },
        uri: {
            label: __('URL', 'ry-line'),
            type: 'text',
            verifyType: ['required', 'url'],
            required: true,
        },
        'altUri.desktop': {
            label: __('Desktop URL', 'ry-line'),
            type: 'text',
        },
    },
    datetimepicker: {
        label: {
            label: __('Label', 'ry-line'),
            type: 'text',
        },
        data: {
            label: __('Webhook data', 'ry-line'),
            type: 'text',
            verifyType: ['required'],
            required: true,
        },
        mode: {
            label: __('Mode', 'ry-line'),
            type: 'select',
            required: true,
            default: 'date',
            options: ['date', 'time', 'datetime'],
        },
        initial: {
            label: __('Default', 'ry-line'),
            type: 'text',
        },
        min: {
            label: __('Min', 'ry-line'),
            type: 'text',
        },
        max: {
            label: __('Max', 'ry-line'),
            type: 'text',
        },
    },
    clipboard: {
        label: {
            label: __('Label', 'ry-line'),
            type: 'text',
        },
        clipboardText: {
            label: __('Clipboard text', 'ry-line'),
            type: 'textarea',
            verifyType: ['required'],
            required: true,
        },
    }
};
