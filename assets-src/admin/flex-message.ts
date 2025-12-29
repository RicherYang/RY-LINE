import $ from 'jquery';
import { __ } from '@wordpress/i18n';

import 'select2';
import 'select2/dist/css/select2.css';

import './flex-message.scss';

import './flex-message/globals.d.ts';
import { FlexEditor } from './flex-message/editor.ts';

/**
 * 全域 Flex 編輯器實例
 */
let flexEditor: FlexEditor | undefined;

/**
 * 初始化 Flex 訊息選擇器
 */
function initFlexMessageSelector(): void {
    $('#use-messages').select2({
        language: {
            inputTooShort: function () {
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
            data: function (params: { term: any; page: any; }) {
                return {
                    search: params.term || '',
                    page: params.page || 1,
                    post_id: $('#post_ID').val(),
                    _ajax_nonce: ryLineFlex.nonce.get,
                };
            },
            processResults: function (data: { data: { results: any; next: any; }; }, params: { page: number; }) {
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
}

/**
 * 處理訊息類型變更事件
 */
function handleMessageTypeChange(): void {
    const messageType = $('#message-type').val() as string;

    if (messageType === 'flex') {
        // 當選擇 flex 類型時，建立編輯器實例
        if (!flexEditor) {
            flexEditor = new FlexEditor();
        }
    } else {
        // 切換到其他類型時，銷毀編輯器
        if (flexEditor) {
            flexEditor = undefined;
            $('#flex-message-tree').empty();
            $('#flex-node-property').empty();
        }
    }
}

/**
 * 處理 JSON 匯入
 */
function handleJsonImport(): void {
    const tmpContent = $('#flex-message-content').val() as string;
    $('#flex-message-content').val(__('Paste JSON here. Only bubble type is supported.', 'ry-line')).prop('readonly', false);

    $('#flex-message-content').one('focus', function () {
        $('#flex-message-content').val('');
        $(document).off('click.flexImport');
    });

    $('#flex-message-content').one('input', function () {
        $('#flex-message-content').prop('readonly', true);
        const importContent = $('#flex-message-content').val() as string;

        try {
            const data = JSON.parse(importContent);
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
        flexEditor = new FlexEditor();
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
}

/**
 * 處理 JSON 匯出
 */
function handleJsonExport(): void {
    navigator.clipboard.writeText($('#flex-message-content').val() as string);
    alert(__('Flex Message JSON copied to clipboard.', 'ry-line'));
}

/**
 * 處理節點創建
 */
function handleNodeCreate(): void {
    if (flexEditor && flexEditor.currentNodeId) {
        flexEditor.showAddNodeMenu();
    }
}

/**
 * 處理節點向上移動
 */
function handleNodeMoveUp(): void {
    if (flexEditor && flexEditor.currentNodeId) {
        flexEditor.moveNodeUp();
    }
}

/**
 * 處理節點向下移動
 */
function handleNodeMoveDown(): void {
    if (flexEditor && flexEditor.currentNodeId) {
        flexEditor.moveNodeDown();
    }
}

/**
 * 處理節點刪除
 */
function handleNodeDelete(): void {
    if (flexEditor && flexEditor.currentNodeId) {
        flexEditor.deleteNode();
    }
}

/**
 * 處理樹狀節點點擊
 */
function handleTreeNodeClick(e: JQuery.ClickEvent): void {
    e.stopPropagation();
    if (flexEditor) {
        flexEditor.selectNode($(e.currentTarget).closest('.flex-tree-node').data('node-id'));
    }
}

/**
 * 處理樹狀節點展開/收合
 */
function handleTreeNodeToggle(e: JQuery.ClickEvent): void {
    e.stopPropagation();
    if (flexEditor) {
        $(e.currentTarget).closest('.flex-tree-node').toggleClass('collapsed');
    }
}

/**
 * 處理屬性變更
 */
function handlePropertyChange(this: HTMLElement): void {
    if (flexEditor) {
        flexEditor.updateNodeProperty($(this));
        if ($(this).data('property') === 'action') {
            flexEditor.renderActionPropertyEditor($(this));
        }
    }
}

/**
 * 處理焦點事件，設定模板字串插入目標
 */
function handlePropertyFocus(this: HTMLElement): void {
    $('#flex-message-template-string').data('target', '#' + $(this).attr('id'));
}

/**
 * 註冊所有事件監聽器
 */
function registerEventListeners(): void {
    // 監聽訊息類型變更事件
    $('#message-type').on('change', handleMessageTypeChange).trigger('change');

    // 匯入 JSON
    $('#json-import').on('click', handleJsonImport);

    // 匯出 JSON
    $('#json-export').on('click', handleJsonExport);

    // 新增節點
    $('#node-create').on('click', handleNodeCreate);

    // 向上移動節點
    $('#node-up').on('click', handleNodeMoveUp);

    // 向下移動節點
    $('#node-down').on('click', handleNodeMoveDown);

    // 刪除節點
    $('#node-delete').on('click', handleNodeDelete);

    // 由樹狀結構選擇節點
    $('#flex-message-tree').on('click', '.flex-tree-node-header', handleTreeNodeClick);

    // 樹狀結構的展開/收合
    $('#flex-message-tree').on('click', '.flex-tree-node-toggle', handleTreeNodeToggle);

    // 屬性值內容變更
    $('#flex-node-property').on('change', 'input, select, textarea', handlePropertyChange);

    // 設定模板字串插入目標
    $('#flex-node-property').on('focus', 'input, select, textarea', handlePropertyFocus);
}

/**
 * 主要初始化函式
 */
$(function () {
    initFlexMessageSelector();
    registerEventListeners();
});
