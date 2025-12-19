import $ from 'jquery';
import { __ } from '@wordpress/i18n';
import 'select2';
import './lib/wp-color-picker-alpha.js';

import 'select2/src/scss/core.scss';
import './flex-message.scss';

let flexEditor;

$(function () {
    // 初始化 Flex 訊息選擇器
    $('#use-messages').select2({
        language: {
            inputTooShort: function (args) {
                return __('Enter search keyword', 'ry-line');
            },
            searching: function () {
                return __('Loading...', 'ry-line');
            },
            loadingMore: function () {
                return __('Loading...', 'ry-line');
            },
            noResults: function () {
                return __('No matching message found', 'ry-line');
            },
        },
        allowClear: true,
        placeholder: __('Search flex message', 'ry-line'),
        minimumInputLength: 1,
        width: '100%',
        ajax: {
            url: ajaxurl + '?action=ry-line/get-flex',
            type: 'POST',
            dataType: 'json',
            data: function (params) {
                return {
                    search: params.term || '',
                    page: params.page || 1,
                    post_id: $('#post_ID').val(),
                    _ajax_nonce: ryLineFlex.nonce.get,
                };
            },
            processResults: function (data, params) {
                params.page = params.page || 1;
                return {
                    results: data.data.results,
                    pagination: {
                        more: data.data.next,
                    },
                };
            }
        },
    });

    // 監聽訊息類型變更事件
    $('#message-type').on('change', function () {
        if ($(this).val() === 'flex') {
            // 當選擇 flex 類型時，建立編輯器實例
            if (!flexEditor) {
                flexEditor = new FlexMessageEditor();
            }
        } else {
            // 切換到其他類型時，銷毀編輯器
            if (flexEditor) {
                flexEditor = undefined;
                $('#flex-message-tree').empty();
                $('#flex-node-property').empty();
            }
        }
    }).trigger('change');

    // 匯入 JSON
    $('#json-import').on('click', function () {
        let tmpContent = $('#flex-message-content').val();
        $('#flex-message-content').val(__('Paste JSON here. Only bubble type is supported.', 'ry-line')).prop('readonly', false);
        $('#flex-message-content').one('focus', function () {
            $('#flex-message-content').val('');
            $(document).off('click.flexImport');
        });
        $('#flex-message-content').one('input', function () {
            $('#flex-message-content').prop('readonly', true);
            let importContent = $('#flex-message-content').val();
            try {
                let data = JSON.parse(importContent);
                if (typeof data !== 'object' || data === null || Array.isArray(data)) {
                    throw new Error('Invalid JSON structure');
                }
                if (data.type !== 'bubble') {
                    throw new Error('Only bubble type is supported');
                }
            } catch (error) {
                $('#flex-message-content').val(tmpContent);
            }
            $('#flex-message-tree').empty();
            $('#flex-node-property').empty();
            flexEditor = new FlexMessageEditor();
        });

        // 延遲註冊文件點擊事件，以避免立即觸發關閉
        setTimeout(function () {
            $(document).on('click.flexImport', function (e) {
                if (!$(e.target).is('#flex-message-content')) {
                    $('#flex-message-content').val(tmpContent).prop('readonly', true);
                    $(document).off('click.flexImport');
                }
            });
        }, 100);
    });

    // 匯出 JSON
    $('#json-export').on('click', function () {
        navigator.clipboard.writeText($('#flex-message-content').val());
        alert(__('Flex Message JSON copied to clipboard.', 'ry-line'));
    });


    // 新增節點
    $('#node-create').on('click', function () {
        if (flexEditor && flexEditor.currentNodeId) {
            flexEditor.showAddNodeMenu();
        }
    });

    // 向上移動節點
    $('#node-up').on('click', function () {
        if (flexEditor && flexEditor.currentNodeId) {
            flexEditor.moveNodeUp();
        }
    });

    // 向下移動節點
    $('#node-down').on('click', function () {
        if (flexEditor && flexEditor.currentNodeId) {
            flexEditor.moveNodeDown();
        }
    });

    // 刪除節點
    $('#node-delete').on('click', function () {
        if (flexEditor && flexEditor.currentNodeId) {
            flexEditor.deleteNode();
        }
    });

    // 由樹狀結構選擇節點
    $('#flex-message-tree').on('click', '.flex-tree-node-header', function (e) {
        e.stopPropagation();
        if (flexEditor) {
            flexEditor.selectNode($(this).closest('.flex-tree-node').data('node-id'));
        }
    });

    // 樹狀結構的展開/收合
    $('#flex-message-tree').on('click', '.flex-tree-node-toggle', function (e) {
        e.stopPropagation();
        if (flexEditor) {
            $(this).closest('.flex-tree-node').toggleClass('collapsed');
        }
    });

    // 屬性值內容變更
    $('#flex-node-property').on('change', 'input, select, textarea', function () {
        if (flexEditor) {
            flexEditor.updateNodeProperty($(this));
            if ($(this).data('property') === 'action') {
                flexEditor.renderActionPropertyEditor($(this));
            }
        }
    });

    // 設定模板字串插入目標
    $('#flex-node-property').on('focus', 'input, select, textarea', function () {
        $('#flex-message-template-string').data('target', '#' + $(this).attr('id'));
    });
});

/**
 * Flex Message 編輯器類別
 * 用於建立和管理 LINE Flex Message 的視覺化編輯介面
 */
class FlexMessageEditor {
    // 預設的 Flex Message JSON 結構
    defaultJson = {
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
    }

    // 各種節點類型對應的圖示
    typeIcon = {
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
    }

    // 節點可以新增的子節點類型
    addChildTypes = {
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
    }

    // 節點的屬性值
    typeProperties = {
        // 一般節點
        bubble: [
            { name: 'size', label: __('Size', 'ry-line'), type: 'select', required: true, default: 'mega', options: ['nano', 'micro', 'deca', 'hecto', 'kilo', 'mega', 'giga'] },
            { name: 'direction', label: __('Text direction', 'ry-line'), type: 'select', default: 'ltr', options: ['', 'ltr', 'rtl'] },
            { name: 'action', label: __('Action', 'ry-line'), type: 'select', default: '', options: ['', 'postback', 'uri', 'message', 'datetimepicker', 'clipboard'] },
        ],
        header: [
            { name: 'backgroundColor', label: __('Background color', 'ry-line'), type: 'color' },
            { name: 'separator', label: __('Separator', 'ry-line'), type: 'select', default: 'false', options: ['', 'true', 'false'] },
            { name: 'separatorColor', label: __('Separator color', 'ry-line'), type: 'color' },
        ],
        hero: [
            { name: 'backgroundColor', label: __('Background color', 'ry-line'), type: 'color' },
            { name: 'separator', label: __('Separator', 'ry-line'), type: 'select', default: 'false', options: ['', 'true', 'false'] },
            { name: 'separatorColor', label: __('Separator color', 'ry-line'), type: 'color' },
        ],
        body: [
            { name: 'backgroundColor', label: __('Background color', 'ry-line'), type: 'color' },
            { name: 'separator', label: __('Separator', 'ry-line'), type: 'select', default: 'false', options: ['', 'true', 'false'] },
            { name: 'separatorColor', label: __('Separator color', 'ry-line'), type: 'color' },
        ],
        footer: [
            { name: 'backgroundColor', label: __('Background color', 'ry-line'), type: 'color' },
            { name: 'separator', label: __('Separator', 'ry-line'), type: 'select', default: 'false', options: ['', 'true', 'false'] },
            { name: 'separatorColor', label: __('Separator color', 'ry-line'), type: 'color' },
        ],
        box: [
            { name: 'layout', label: __('Layout', 'ry-line'), type: 'select', required: true, default: 'horizontal', options: ['horizontal', 'vertical', 'baseline'] },
            { name: 'backgroundColor', label: __('Background color', 'ry-line'), type: 'color', alpha: true },
            { name: 'borderColor', label: __('Border color', 'ry-line'), type: 'color' },
            { name: 'borderWidth', label: __('Border width', 'ry-line'), type: 'select', default: 'none', options: ['', 'none', 'light', 'normal', 'medium', 'semi-bold', 'bold'] },
            { name: 'cornerRadius', label: __('Border radius', 'ry-line'), type: 'select', default: 'none', options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] },
            { name: 'width', label: __('Width', 'ry-line'), type: 'text' },
            { name: 'maxWidth', label: __('Max Width', 'ry-line'), type: 'text' },
            { name: 'height', label: __('Height', 'ry-line'), type: 'text' },
            { name: 'maxHeight', label: __('Max Height', 'ry-line'), type: 'text' },
            { name: 'flex', label: __('Flex', 'ry-line'), type: 'number', min: 0 },
            { name: 'justifyContent', label: __('Justification', 'ry-line'), type: 'select', default: 'flex-start', options: ['', 'flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'] },
            { name: 'alignItems', label: __('Vertical alignment', 'ry-line'), type: 'select', default: 'flex-start', options: ['', 'flex-start', 'center', 'flex-end'] },
            { name: 'spacing', label: __('Spacing', 'ry-line'), type: 'select', default: 'none', options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] },
            { name: 'margin', label: __('Margin', 'ry-line'), type: 'select', default: 'none', options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] },
            { name: 'paddingAll', label: __('Padding All', 'ry-line'), type: 'text' },
            { name: 'paddingTop', label: __('Padding Top', 'ry-line'), type: 'text' },
            { name: 'paddingBottom', label: __('Padding Bottom', 'ry-line'), type: 'text' },
            { name: 'paddingStart', label: __('Padding Start', 'ry-line'), type: 'text' },
            { name: 'paddingEnd', label: __('Padding End', 'ry-line'), type: 'text' },
            { name: 'position', label: __('Position', 'ry-line'), type: 'select', default: 'relative', options: ['', 'relative', 'absolute'] },
            { name: 'offsetTop', label: __('Offset Top', 'ry-line'), type: 'text' },
            { name: 'offsetBottom', label: __('Offset Bottom', 'ry-line'), type: 'text' },
            { name: 'offsetStart', label: __('Offset Start', 'ry-line'), type: 'text' },
            { name: 'offsetEnd', label: __('Offset End', 'ry-line'), type: 'text' },
            { name: 'action', label: __('Action', 'ry-line'), type: 'select', default: '', options: ['', 'postback', 'uri', 'message', 'datetimepicker', 'clipboard'] },
        ],
        button: [
            { name: 'color', label: __('Color', 'ry-line'), type: 'color' },
            { name: 'style', label: __('Style', 'ry-line'), type: 'select', default: 'link', options: ['', 'primary', 'secondary', 'link'] },
            { name: 'flex', label: __('Flex', 'ry-line'), type: 'number', min: 0 },
            { name: 'height', label: __('Height', 'ry-line'), type: 'select', default: 'md', options: ['', 'sm', 'md'] },
            { name: 'gravity', label: __('Vertical alignment', 'ry-line'), type: 'select', default: 'top', options: ['', 'top', 'center', 'bottom'] },
            { name: 'scaling', label: __('Scaled according APP', 'ry-line'), type: 'select', default: 'false', options: ['', 'true', 'false'] },
            { name: 'adjustMode', label: __('Font size adjust Mode', 'ry-line'), type: 'select', options: ['', 'shrink-to-fit'] },
            { name: 'margin', label: __('Margin', 'ry-line'), type: 'select', default: 'none', options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] },
            { name: 'position', label: __('Position', 'ry-line'), type: 'select', default: 'relative', options: ['', 'relative', 'absolute'] },
            { name: 'offsetTop', label: __('Offset Top', 'ry-line'), type: 'text' },
            { name: 'offsetBottom', label: __('Offset Bottom', 'ry-line'), type: 'text' },
            { name: 'offsetStart', label: __('Offset Start', 'ry-line'), type: 'text' },
            { name: 'offsetEnd', label: __('Offset End', 'ry-line'), type: 'text' },
            { name: 'action', label: __('Action', 'ry-line'), type: 'select', required: true, default: 'uri', options: ['postback', 'uri', 'message', 'datetimepicker', 'clipboard'] },
        ],
        image: [
            { name: 'url', label: __('URL', 'ry-line'), type: 'text', required: true, default: '', description: __('Image format: JPEG or PNG, Max image size: 1024 x 1024 pixels, Max file size: 10 MB', 'ry-line') },
            { name: 'backgroundColor', label: __('Background color', 'ry-line'), type: 'color' },
            { name: 'flex', label: __('Flex', 'ry-line'), type: 'number', min: 0 },
            { name: 'size', label: __('Size', 'ry-line'), type: 'select', default: 'md', options: ['', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl', '5xl', 'full'] },
            { name: 'aspectRatio', label: __('Aspect Ratio', 'ry-line'), type: 'text', default: '1:1' },
            { name: 'aspectMode', label: __('Aspect Mode', 'ry-line'), type: 'select', default: 'fit', options: ['', 'cover', 'fit'] },
            { name: 'align', label: __('Horizontal alignment', 'ry-line'), type: 'select', default: 'center', options: ['', 'start', 'center', 'end'] },
            { name: 'gravity', label: __('Vertical alignment', 'ry-line'), type: 'select', default: 'top', options: ['', 'top', 'center', 'bottom'] },
            { name: 'margin', label: __('Margin', 'ry-line'), type: 'select', default: 'none', options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] },
            { name: 'position', label: __('Position', 'ry-line'), type: 'select', default: 'relative', options: ['', 'relative', 'absolute'] },
            { name: 'offsetTop', label: __('Offset Top', 'ry-line'), type: 'text' },
            { name: 'offsetBottom', label: __('Offset Bottom', 'ry-line'), type: 'text' },
            { name: 'offsetStart', label: __('Offset Start', 'ry-line'), type: 'text' },
            { name: 'offsetEnd', label: __('Offset End', 'ry-line'), type: 'text' },
            { name: 'action', label: __('Action', 'ry-line'), type: 'select', default: '', options: ['', 'postback', 'uri', 'message', 'datetimepicker', 'clipboard'] },
        ],
        icon: [
            { name: 'url', label: __('URL', 'ry-line'), type: 'text', required: true, default: '', description: __('Image format: JPEG or PNG, Max image size: 1024 x 1024 pixels, Max file size: 1 MB', 'ry-line') },
            { name: 'size', label: __('Size', 'ry-line'), type: 'select', default: 'md', options: ['', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl', '5xl'] },
            { name: 'aspectRatio', label: __('Aspect Ratio', 'ry-line'), type: 'text', default: '1:1' },
            { name: 'scaling', label: __('Scaled according APP', 'ry-line'), type: 'select', default: 'false', options: ['', 'true', 'false'] },
            { name: 'margin', label: __('Margin', 'ry-line'), type: 'select', default: 'none', options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] },
            { name: 'position', label: __('Position', 'ry-line'), type: 'select', default: 'relative', options: ['', 'relative', 'absolute'] },
            { name: 'offsetTop', label: __('Offset Top', 'ry-line'), type: 'text' },
            { name: 'offsetBottom', label: __('Offset Bottom', 'ry-line'), type: 'text' },
            { name: 'offsetStart', label: __('Offset Start', 'ry-line'), type: 'text' },
            { name: 'offsetEnd', label: __('Offset End', 'ry-line'), type: 'text' },
        ],
        text: [
            { name: 'text', label: __('Text', 'ry-line'), type: 'textarea' },
            { name: 'color', label: __('Color', 'ry-line'), type: 'color' },
            { name: 'size', label: __('Font size', 'ry-line'), type: 'select', default: 'md', options: ['', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl', '5xl'] },
            { name: 'scaling', label: __('Scaled according APP', 'ry-line'), type: 'select', default: 'false', options: ['', 'true', 'false'] },
            { name: 'adjustMode', label: __('Font size adjust Mode', 'ry-line'), type: 'select', options: ['', 'shrink-to-fit'] },
            { name: 'weight', label: __('Font weight', 'ry-line'), type: 'select', default: 'regular', options: ['', 'regular', 'bold'] },
            { name: 'style', label: __('Font style', 'ry-line'), type: 'select', default: 'normal', options: ['', 'normal', 'italic'] },
            { name: 'decoration', label: __('Decoration', 'ry-line'), type: 'select', default: 'none', options: ['', 'none', 'underline', 'line-through'] },
            { name: 'wrap', label: __('Wrap text', 'ry-line'), type: 'select', default: 'false', options: ['', 'true', 'false'] },
            { name: 'lineSpacing', label: __('Line spacing', 'ry-line'), type: 'text' },
            { name: 'maxLines', label: __('Max Lines', 'ry-line'), type: 'number', min: 0, step: 1 },
            { name: 'flex', label: __('Flex', 'ry-line'), type: 'number', min: 0 },
            { name: 'align', label: __('Horizontal alignment', 'ry-line'), type: 'select', default: 'center', options: ['', 'start', 'center', 'end'] },
            { name: 'gravity', label: __('Vertical alignment', 'ry-line'), type: 'select', default: 'top', options: ['', 'top', 'center', 'bottom'] },
            { name: 'margin', label: __('Margin', 'ry-line'), type: 'select', default: 'none', options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] },
            { name: 'position', label: __('Position', 'ry-line'), type: 'select', default: 'relative', options: ['', 'relative', 'absolute'] },
            { name: 'offsetTop', label: __('Offset Top', 'ry-line'), type: 'text' },
            { name: 'offsetBottom', label: __('Offset Bottom', 'ry-line'), type: 'text' },
            { name: 'offsetStart', label: __('Offset Start', 'ry-line'), type: 'text' },
            { name: 'offsetEnd', label: __('Offset End', 'ry-line'), type: 'text' },
            { name: 'action', label: __('Action', 'ry-line'), type: 'select', default: '', options: ['', 'postback', 'uri', 'message', 'datetimepicker', 'clipboard'] },
        ],
        span: [
            { name: 'text', label: __('Text', 'ry-line'), type: 'text' },
            { name: 'color', label: __('Color', 'ry-line'), type: 'color' },
            { name: 'size', label: __('Font size', 'ry-line'), type: 'select', options: ['', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl', '5xl'] },
            { name: 'weight', label: __('Font weight', 'ry-line'), type: 'select', default: 'regular', options: ['', 'regular', 'bold'] },
            { name: 'style', label: __('Font style', 'ry-line'), type: 'select', default: 'normal', options: ['', 'normal', 'italic'] },
            { name: 'decoration', label: __('Decoration', 'ry-line'), type: 'select', default: 'none', options: ['', 'none', 'underline', 'line-through'] },
        ],
        separator: [
            { name: 'color', label: __('Color', 'ry-line'), type: 'color' },
            { name: 'margin', label: __('Margin', 'ry-line'), type: 'select', default: 'none', options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] },
        ],

        // Action 內容
        postback: [
            { name: 'label', label: __('Label', 'ry-line'), type: 'text' },
            { name: 'data', label: __('Webhook data', 'ry-line'), type: 'text', required: true },
            { name: 'displayText', label: __('Message text', 'ry-line'), type: 'textarea' },
        ],
        message: [
            { name: 'label', label: __('Label', 'ry-line'), type: 'text' },
            { name: 'text', label: __('Message text', 'ry-line'), type: 'textarea', required: true },
        ],
        uri: [
            { name: 'label', label: __('Label', 'ry-line'), type: 'text' },
            { name: 'uri', label: __('URL', 'ry-line'), type: 'text', required: true },
            { name: 'altUri.desktop', label: __('Desktop URL', 'ry-line'), type: 'text' },
        ],
        datetimepicker: [
            { name: 'label', label: __('Label', 'ry-line'), type: 'text' },
            { name: 'data', label: __('Webhook data', 'ry-line'), type: 'text', required: true },
            { name: 'mode', label: __('Mode', 'ry-line'), type: 'select', required: true, default: 'date', options: ['date', 'time', 'datetime'] },
            { name: 'initial', label: __('Default', 'ry-line'), type: 'text' },
            { name: 'min', label: __('Min', 'ry-line'), type: 'text' },
            { name: 'max', label: __('Max', 'ry-line'), type: 'text' },
        ],
        clipboard: [
            { name: 'label', label: __('Label', 'ry-line'), type: 'text' },
            { name: 'clipboardText', label: __('Clipboard text', 'ry-line'), type: 'textarea', required: true },
        ]
    };

    /**
     * 建構函式
     * 初始化編輯器實例並設定必要的屬性
     */
    constructor() {
        this.currentNodeId = null; // 目前選中的節點 ID
        this.nodeIdCounter = 1; // 節點 ID 計數器
        // 快取模板函式
        this.template = {
            treeNode: wp.template('flex-tree-node'),
            addNode: wp.template('flex-add-node'),
            propertyEditor: wp.template('flex-property-editor'),
            propertyText: wp.template('flex-property-text'),
            propertyColor: wp.template('flex-property-color'),
            propertyTextarea: wp.template('flex-property-textarea'),
            propertyNumber: wp.template('flex-property-number'),
            propertySelect: wp.template('flex-property-select'),
        }

        this.init();
    }

    /**
     * 初始化編輯器
     * 載入既有內容或使用預設模板，並渲染樹狀結構
     */
    init() {
        const existingContent = $('#flex-message-content').val();
        let jsonData;
        if (existingContent) {
            try {
                jsonData = JSON.parse(existingContent);
            } catch (e) {
                jsonData = this.defaultJson;
            }
        } else {
            jsonData = this.defaultJson;
        }

        this.renderTree(jsonData);
        this.updateNodeToggle();
        this.updateJsonOutput();
    }

    /**
     * 渲染樹狀結構
     * @param {Object} jsonData - Flex Message JSON 資料
     */
    renderTree(jsonData) {
        this.nodeIdCounter = 1;

        const $tree = $('#flex-message-tree');
        $tree.empty();
        $tree.append(this.createTreeNode(jsonData, null, 'bubble'));
    }

    /**
     * 建立樹狀節點
     * @param {Object} data - 節點資料
     * @param {string|null} parentId - 父節點 ID
     * @param {string|null} forceType - 強制指定節點類型
     * @returns {jQuery} 節點的 jQuery 物件
     */
    createTreeNode(data, parentId, forceType = null) {
        const nodeId = `node-${this.nodeIdCounter++}`;
        const nodeType = forceType || data.type;

        const showInfo = this.getNodeShowInfo(nodeType, data);
        const $node = $(this.template.treeNode({
            id: nodeId,
            type: nodeType,
            icon: showInfo.icon,
            label: showInfo.label,
        }));
        // 建立節點資料並儲存到 data 屬性中
        const nodeData = {
            data: data,
            parentId: parentId,
            type: nodeType
        };
        $node.attr('data-node-info', JSON.stringify(nodeData));

        const $children = $node.find('.flex-tree-node-children');
        // 根據節點類型建立子節點
        switch (nodeType) {
            case 'bubble':
                ['header', 'hero', 'body', 'footer'].forEach(blockType => {
                    $children.append(this.createTreeNode(data[blockType] || {}, nodeId, blockType));
                });
                break;
            case 'header':
            case 'hero':
            case 'body':
            case 'footer':
                if (Object.keys(data).length > 0) {
                    $children.append(this.createTreeNode(data, nodeId));
                }
                break;
            case 'box':
                if (data.contents) {
                    data.contents.forEach(child => {
                        $children.append(this.createTreeNode(child, nodeId));
                    });
                }
                break;
            case 'text':
                if (data.contents) {
                    data.contents.forEach(child => {
                        $children.append(this.createTreeNode(child, nodeId));
                    });
                }
                break;
        }
        return $node;
    }

    /**
     * 取得節點顯示資訊（圖示和標籤）
     * @param {string} type - 節點類型
     * @param {Object} data - 節點資料
     * @returns {Object} 包含 icon 和 label 的物件
     */
    getNodeShowInfo(type, data) {
        let label = '';
        if (type === 'text') {
            label = data.text || '';
            label = label.substring(0, 20) + (label.length > 20 ? '...' : '');
        } else if (type === 'button' && data.action && data.action.label) {
            label = data.action.label.substring(0, 20) + (data.action.label.length > 20 ? '...' : '');
        } else if (type === 'box' && data.layout) {
            label = `[${data.layout}]`;
        }

        return {
            icon: this.typeIcon[type] || '',
            label: label
        };
    }

    /**
     * 選擇指定節點
     * @param {string} nodeId - 節點 ID
     */
    selectNode(nodeId) {
        // 移除所有節點的選中狀態
        $('.flex-tree-node').removeClass('selected');

        // 標記目前節點為選中狀態
        const $node = $(`.flex-tree-node[data-node-id="${nodeId}"]`);
        $node.addClass('selected');
        this.currentNodeId = nodeId;

        this.updateButtonStates();
        this.renderPropertyEditor();
    }

    /**
     * 取得可新增的子節點類型
     * @param {Object} nodeInfo - 節點資訊
     * @returns {Array} 可新增的子節點類型陣列
     */
    getAddableChildTypes(nodeInfo) {
        if (nodeInfo.type === 'box') {
            return this.addChildTypes['box'][nodeInfo.data.layout] || [];
        }
        return this.addChildTypes[nodeInfo.type] || [];
    }

    /**
     * 更新工具列按鈕的啟用/停用狀態
     */
    updateButtonStates() {
        const $node = $(`.flex-tree-node[data-node-id="${this.currentNodeId}"]`);
        const nodeInfo = $node.data('node-info');
        if (!nodeInfo) return;

        const { type } = nodeInfo;

        // 判斷是否可以新增子節點
        let canCreate = this.getAddableChildTypes(nodeInfo).length > 0;
        if (canCreate && ['header', 'hero', 'body', 'footer'].includes(type)) {
            canCreate = $node.find('.flex-tree-node').length === 0;
        }
        $('#node-create').prop('disabled', !canCreate);

        // 頂層區塊節點不能移動
        const canMove = !['bubble', 'header', 'hero', 'body', 'footer'].includes(type);
        $('#node-up').prop('disabled', !canMove);
        $('#node-down').prop('disabled', !canMove);

        // 頂層區塊節點不能刪除
        const canDelete = !['bubble', 'header', 'hero', 'body', 'footer'].includes(type);
        $('#node-delete').prop('disabled', !canDelete);
    }

    /**
     * 渲染屬性編輯器
     * 根據目前選中的節點類型，顯示對應的屬性欄位
     */
    renderPropertyEditor() {
        const $node = $(`.flex-tree-node[data-node-id="${this.currentNodeId}"]`);
        const nodeInfo = $node.data('node-info');
        if (!nodeInfo) return;

        const { data, type } = nodeInfo;
        const properties = this.getNodeProperties(type, data);

        $('#flex-node-property').html($(this.template.propertyEditor({ type: type })));
        const $fields = $('#flex-node-property .flex-property-fields');

        // 依序建立各個屬性欄位
        properties.forEach(prop => {
            const templateKey = `property` + prop.type.charAt(0).toUpperCase() + prop.type.slice(1);
            if (this.template[templateKey] !== undefined) {
                prop.id = `${this.currentNodeId}-property-${prop.name}`;
                $fields.append(this.template[templateKey](prop));
                switch (prop.type) {
                    case 'color':
                        $(`#${prop.id}`).wpColorPicker({
                            change: function () {
                                setTimeout(() => {
                                    flexEditor.updateNodeProperty($(this));
                                });
                            },
                        });
                        break;
                    case 'textarea':
                        $(`#${prop.id}`).trigger('input');
                        break;
                }
                if (prop.name === 'action') {
                    $(`#${prop.id}`).trigger('change');
                }
            }
        });
    }

    /**
     * 渲染動作屬性編輯器
     * 當選擇不同的 action 類型時，動態顯示對應的屬性欄位
     * @param {jQuery} $actionSelect - action 下拉選單的 jQuery 物件
     */
    renderActionPropertyEditor($actionSelect) {
        const $node = $(`.flex-tree-node[data-node-id="${this.currentNodeId}"]`);
        const nodeInfo = $node.data('node-info');
        if (!nodeInfo) return;

        const actionType = $actionSelect.val();
        // 移除之前動態產生的 action 屬性欄位
        $actionSelect.closest('.flex-property-field').nextAll('.flex-property-field').remove();

        if (!actionType || actionType === '') {
            return;
        }

        const properties = this.getNodeProperties(actionType, nodeInfo.data.action);
        const $fields = $('#flex-node-property .flex-property-fields');

        // 新增 action 相關的屬性欄位
        properties.forEach(prop => {
            const templateKey = `property` + prop.type.charAt(0).toUpperCase() + prop.type.slice(1);
            if (this.template[templateKey] !== undefined) {
                prop.id = `${this.currentNodeId}-property-${prop.name}`;
                $fields.append(this.template[templateKey](prop));
            }
        });
    }

    /**
     * 取得節點的屬性列表
     * @param {string} type - 節點類型
     * @param {Object} data - 節點資料
     * @returns {Array} 屬性物件陣列
     */
    getNodeProperties(type, data) {
        const basicProperties = this.typeProperties[type] || [];

        // 處理每個屬性，填入目前的值
        const properties = basicProperties.map(prop => {
            const property = { ...prop };

            if (data[prop.name] !== undefined) {
                if (prop.name === 'action') {
                    property.value = data[prop.name].type;
                } else {
                    property.value = data[prop.name];
                    if (typeof property.value === 'boolean') {
                        property.value = String(property.value);
                    }
                }
            } else {
                property.value = '';
            }

            if (property.options && Array.isArray(property.options)) {
                property.options = property.options.map(opt => {
                    if (typeof opt === 'string') {
                        return { value: opt, label: opt };
                    }
                    return opt;
                });
            }

            return property;
        });

        return properties;
    }

    /**
     * 更新節點屬性
     * 當屬性編輯器的欄位變更時呼叫
     * @param {jQuery} $input - 變更的輸入欄位 jQuery 物件
     */
    updateNodeProperty($input) {
        const $node = $(`.flex-tree-node[data-node-id="${this.currentNodeId}"]`);
        const nodeInfo = $node.data('node-info');
        if (!nodeInfo) return;

        const { data } = nodeInfo;
        const propName = $input.data('property');
        let propValue;

        // 根據欄位類型處理值
        if ($input.attr('type') === 'number') {
            propValue = parseFloat($input.val());
            if (isNaN(propValue)) {
                propValue = null;
            }
        } else {
            propValue = $input.val();
            if (propValue === 'true') {
                propValue = true;
            } else if (propValue === 'false') {
                propValue = false;
            }
        }

        // 空值時刪除屬性
        if (propValue === '' || propValue === null) {
            delete data[propName];
        } else {
            if (propName === 'action') {
                propValue = {
                    type: propValue
                };
                this.typeProperties[propValue.type].forEach(propDef => {
                    const typeValue = $(`[data-property="${propDef.name}"]`).val();
                    if (typeValue === undefined) {
                        if (data.action !== undefined && data.action[propDef.name] !== undefined) {
                            propValue[propDef.name] = data.action[propDef.name];
                        }
                    } else if (typeValue !== null && typeValue !== '') {
                        propValue[propDef.name] = typeValue;
                    }
                });
                data.action = { ...propValue };
            }
            data[propName] = propValue;
        }

        // 更新節點的資料屬性
        $node.data('node-info', nodeInfo);
        $node.attr('data-node-info', JSON.stringify(nodeInfo));

        if (propName !== 'action') {
            $('[data-property="action"]').trigger('change');
        }

        // 更新樹狀結構顯示的標籤文字
        this.updateTreeNodeLabel(this.currentNodeId);
        // 更新 JSON 輸出
        this.updateJsonOutput();
    }

    /**
     * 更新樹狀節點的標籤文字
     * @param {string} nodeId - 節點 ID
     */
    updateTreeNodeLabel(nodeId) {
        const $node = $(`.flex-tree-node[data-node-id="${nodeId}"]`);
        const nodeInfo = $node.data('node-info');
        if (!nodeInfo) return;

        const { data, type } = nodeInfo;
        const showInfo = this.getNodeShowInfo(type, data);

        const $label = $node.find('.flex-tree-node-label:nth(0)');

        if (showInfo.label) {
            $label.text(showInfo.label);
        } else {
            $label.text('');
        }
    }

    /**
     * 顯示新增節點選單
     * 根據目前節點類型，顯示可新增的子節點類型選單
     */
    showAddNodeMenu() {
        const $node = $(`.flex-tree-node[data-node-id="${this.currentNodeId}"]`);
        const nodeInfo = $node.data('node-info');
        if (!nodeInfo) return;

        const { type } = nodeInfo;
        const allowedTypes = this.getAddableChildTypes(nodeInfo);

        // 如果沒有可新增的類型，直接返回
        if (allowedTypes.length === 0) {
            return;
        }

        // 移除舊的選單
        $('.flex-add-node-menu').remove();

        // 準備選單項目資料
        const types = [];
        allowedTypes.forEach(type => {
            types.push({
                type: type,
                icon: this.typeIcon[type] || '',
            });
        });
        const $menu = $(this.template.addNode({ types: types }));

        // 定位選單在新增按鈕下方
        $menu.css({
            position: 'absolute',
            top: $('#node-create').offset().top + $('#node-create').outerHeight(),
            left: $('#node-create').offset().left,
            zIndex: 1000
        });
        $('body').append($menu);

        // 點擊選單項目時新增對應類型的節點
        $menu.on('click', '.flex-node-menu-item', function (e) {
            e.stopPropagation();
            flexEditor.addNode($(this).data('node-type'));
            $menu.remove();
            $(document).off('click.flexMenu');
        });

        // 延遲註冊文件點擊事件，以避免立即觸發關閉
        setTimeout(function () {
            $(document).on('click.flexMenu', function (e) {
                if (!$(e.target).closest('.flex-add-node-menu').length) {
                    $menu.remove();
                    $(document).off('click.flexMenu');
                }
            });
        }, 100);
    }

    /**
     * 新增節點
     * @param {string} nodeType - 要新增的節點類型
     */
    addNode(nodeType) {
        const newNodeData = this.createNodeData(nodeType);
        const $node = $(`.flex-tree-node[data-node-id="${this.currentNodeId}"]`);
        const $children = $node.find('> .flex-tree-node-children');

        $children.append(this.createTreeNode(newNodeData, this.currentNodeId, nodeType));
        this.selectNode($children.find('> .flex-tree-node').last().data('node-id'));
        this.updateNodeToggle();
        this.updateJsonOutput();
    }

    /**
     * 建立新節點的預設資料
     * @param {string} nodeType - 節點類型
     * @returns {Object} 節點資料物件
     */
    createNodeData(nodeType) {
        const data = { type: nodeType };

        // 填入必填屬性的預設值
        this.typeProperties[nodeType].forEach(propDef => {
            if (propDef.required === true) {
                data[propDef.name] = propDef.default;
            }
        });

        return data;
    }

    /**
     * 將節點向上移動
     * 與前一個兄弟節點交換位置
     */
    moveNodeUp() {
        if (!this.currentNodeId) return;

        const $currentNode = $(`.flex-tree-node[data-node-id="${this.currentNodeId}"]`);
        if ($currentNode.length === 0) return;

        const $prevNode = $currentNode.prev('.flex-tree-node');
        if ($prevNode.length === 0) return;

        $currentNode.insertBefore($prevNode);
        this.updateJsonOutput();
    }

    /**
     * 將節點向下移動
     * 與下一個兄弟節點交換位置
     */
    moveNodeDown() {
        if (!this.currentNodeId) return;

        const $currentNode = $(`.flex-tree-node[data-node-id="${this.currentNodeId}"]`);
        if ($currentNode.length === 0) return;

        const $nextNode = $currentNode.next('.flex-tree-node');
        if ($nextNode.length === 0) return;

        $currentNode.insertAfter($nextNode);
        this.updateJsonOutput();
    }

    /**
     * 刪除節點
     * 頂層區塊節點不能刪除
     */
    deleteNode() {
        const $node = $(`.flex-tree-node[data-node-id="${this.currentNodeId}"]`);
        const nodeInfo = $node.data('node-info');
        if (!nodeInfo || !nodeInfo.parentId) return;

        const { type } = nodeInfo;

        // 頂層區塊節點不能刪除
        if (['bubble', 'header', 'hero', 'body', 'footer'].includes(type)) {
            return;
        }

        $node.remove();
        this.selectNode(nodeInfo.parentId);
        this.updateNodeToggle();
        this.updateJsonOutput();
    }

    /**
     * 更新節點的展開/收合按鈕顯示狀態
     * 沒有子節點的節點隱藏展開按鈕
     */
    updateNodeToggle() {
        $('.flex-tree-node').each(function () {
            const $node = $(this);
            const $toggle = $node.find('> .flex-tree-node-header .flex-tree-node-toggle');
            const $children = $node.find('> .flex-tree-node-children');

            if ($children.children().length > 0) {
                $toggle.find('.dashicons').show();
                $children.addClass('has-children');
            } else {
                $toggle.find('.dashicons').hide();
                $children.removeClass('has-children');
            }
        });
    }

    /**
     * 更新 JSON 輸出欄位
     * 將樹狀結構轉換為 JSON 字串並填入隱藏欄位
     */
    updateJsonOutput() {
        const jsonData = this.getJsonData();
        const jsonString = JSON.stringify(this.cleanJsonData(jsonData), null, 4);
        $('#flex-message-content').val(jsonString).trigger('input');;
    }

    /**
     * 取得 JSON 資料
     * 從樹狀結構根節點開始轉換為 JSON 物件
     * @returns {Object} JSON 資料物件
     */
    getJsonData() {
        const $rootNode = $('#flex-message-tree > .flex-tree-node');
        if ($rootNode.length === 0) return '{}';

        return this.nodeToJson($rootNode);
    }

    /**
     * 複製節點屬性到結果物件
     * @param {Object} data - 來源資料
     * @param {Object} result - 目標物件
     * @param {string} type - 節點類型
     */
    copyNodeProperties(data, result, type) {
        if (this.typeProperties[type] === undefined) {
            return data;
        }

        this.typeProperties[type].forEach(propDef => {
            if (data[propDef.name] !== undefined && data[propDef.name] !== null) {
                if (propDef.name === 'action') {
                    result.action = data[propDef.name];
                    this.copyNodeProperties(data, result.action, data[propDef.name]);
                } else {
                    if (propDef.type === 'color') {
                        if (data[propDef.name].substring(0, 4) === 'rgb(') {
                            result[propDef.name] = '#' + data[propDef.name].substring(4, data[propDef.name].length - 1).split(',').map(num => {
                                return parseInt(num.trim()).toString(16).padStart(2, '0').toUpperCase();
                            }).join('');
                        } else if (data[propDef.name].substring(0, 5) === 'rgba(') {
                            result[propDef.name] = '#' + data[propDef.name].substring(5, data[propDef.name].length - 1).split(',').map((num, idx) => {
                                return parseInt(num.trim() * (idx === 3 ? 255 : 1)).toString(16).padStart(2, '0').toUpperCase();
                            }).join('');
                        } else {
                            result[propDef.name] = data[propDef.name];
                        }
                    } else {
                        result[propDef.name] = data[propDef.name];
                    }
                }
            } else if (propDef.required === true) {
                result[propDef.name] = (propDef.default ?? '');
            }
        });
    }

    /**
     * 將節點轉換為 JSON 物件
     * 遞迴處理子節點
     * @param {jQuery} $node - 節點的 jQuery 物件
     * @returns {Object|null} JSON 物件
     */
    nodeToJson($node) {
        const nodeInfo = $node.data('node-info');
        if (!nodeInfo) return null;

        const { data, type } = nodeInfo;
        const result = {};
        this.copyNodeProperties(data, result, type);

        // 根據節點類型處理子內容
        switch (type) {
            case 'bubble':
                result.type = type;
                result.styles = {}

                const $children = $node.find('> .flex-tree-node-children > .flex-tree-node');
                $children.each((index, child) => {
                    const $child = $(child);
                    const childInfo = $child.data('node-info');
                    if (!childInfo) return;

                    const blockType = childInfo.type;
                    if (['header', 'hero', 'body', 'footer'].includes(blockType)) {
                        const blockContent = this.getBlockContent($child);
                        if (blockContent) {
                            result[blockType] = blockContent;
                            result.styles[blockType] = {};
                            this.copyNodeProperties(childInfo.data, result.styles[blockType], blockType);
                        }
                    }
                });
                break;

            case 'header':
            case 'hero':
            case 'body':
            case 'footer':
                return null;

            case 'box':
            case 'text':
                result.type = type;
                result.contents = [];
                const $boxChildren = $node.find('> .flex-tree-node-children > .flex-tree-node');
                $boxChildren.each((index, child) => {
                    const childJson = this.nodeToJson($(child));
                    if (childJson) {
                        result.contents.push(childJson);
                    }
                });
                break;

            default:
                if (Object.keys(result).length > 0) {
                    result.type = type;
                }
                break;
        }

        return result;
    }

    /**
     * 取得區塊節點的內容
     * 區塊節點（header、hero、body、footer）只能有一個子節點
     * @param {jQuery} $blockNode - 區塊節點的 jQuery 物件
     * @returns {Object|null} 子節點的 JSON 物件
     */
    getBlockContent($blockNode) {
        const $children = $blockNode.find('> .flex-tree-node-children > .flex-tree-node');
        if ($children.length === 0) {
            return null;
        }

        const $child = $children.first();
        return this.nodeToJson($child);
    }

    /**
     * 清理 JSON 資料
     * 移除空值、空陣列和空物件
     * @param {*} data - 要清理的資料
     * @returns {*} 清理後的資料
     */
    cleanJsonData(data) {
        if (Array.isArray(data)) {
            return data
                .map(item => this.cleanJsonData(item))
                .filter(item => {
                    if (Array.isArray(item) && item.length === 0) return false;
                    if (typeof item === 'object' && Object.keys(item).length === 0) return false;
                    return true;
                });
        } else if (typeof data === 'object') {
            const result = {};
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const value = data[key];
                    const cleanedValue = this.cleanJsonData(value);

                    if (Array.isArray(cleanedValue) && cleanedValue.length === 0) continue;
                    if (typeof cleanedValue === 'object' && Object.keys(cleanedValue).length === 0) continue;

                    result[key] = cleanedValue;
                }
            }
            return result;
        }
        if (typeof data === 'string') {
            data = data.trim();
        }
        return data;
    }
}
