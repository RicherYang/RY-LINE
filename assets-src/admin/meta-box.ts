import $ from 'jquery';

import './lib/globals.d.ts';
import './lib/image-area.ts';

import './meta-box.scss';

import type {
    AjaxResponse
} from './lib/types.ts';

$(function () {
    // 自動調整 textarea 高度以適應內容
    $('#post').on('input', 'textarea', function () {
        let $textarea = $(this);
        $textarea.height('auto');
        $textarea.height(Math.min(400, $textarea[0].scrollHeight + 10));
    }).trigger('input');

    // 訊息類型選擇器：根據選擇顯示對應的設定欄位
    $('#message-type').on('change', function () {
        $('#postimagediv').hide();  // 隱藏特色圖片區塊
        $('.type-info').hide();     // 隱藏所有類型設定
        $('.type-info-' + $(this).val()).show();  // 顯示選中類型的設定
        if ($(this).val() == 'image') {
            $('#postimagediv').show();  // 圖片類型顯示特色圖片區塊
        }
    }).trigger('change');

    // 回覆類型選擇器：顯示對應的回覆設定
    $('[name="reply-type"]').on('input', function () {
        $('.reply-info').hide();
        $('.reply-info-' + $(this).val()).show();
    });
    $('[name="reply-type"]:checked').trigger('input');

    // 自動發送事件選擇器：控制事件設定的顯示
    $('[name="autosend-event[]"]').on('input', function () {
        $('.event-info').hide();
        if ($('[name="autosend-event[]"]:checked').length) {
            $('.event-info').show();  // 有選中任何事件時顯示設定
        }
    }).first().trigger('input');

    // 發送測試訊息按鈕
    $('.ry-send-test').on('click', function (e) {
        if (e.isPropagationStopped()) return;
        let $btn = $(this);
        $.ajax({
            url: ajaxurl + '?action=ry-line/remote-message-testsend',
            method: 'POST',
            dataType: 'json',
            data: {
                post_id: $('#post_ID').val(),
                _ajax_nonce: RYLineMetabox.nonce.testsend
            }
        }).done(function (Jdata: AjaxResponse) {
            if (Jdata.success) {
                return;
            }
            alertError(Jdata.data);  // 顯示錯誤訊息
        }).always(function () {
            $btn.parent().find('span.spinner').removeClass('is-active').remove();
        });
    });

    // 建立圖文選單按鈕：上傳選單到 LINE 伺服器
    $('.ry-create-menu').on('click', function (e) {
        if (e.isPropagationStopped()) return;
        let $btn = $(this);
        $.ajax({
            url: ajaxurl + '?action=ry-line/remote-richmenu-create',
            method: 'POST',
            dataType: 'json',
            data: {
                post_id: $('#post_ID').val(),
                _ajax_nonce: RYLineMetabox.nonce.create
            }
        }).done(function (Jdata: AjaxResponse) {
            if (Jdata.success) {
                location.reload();  // 建立成功，重新載入頁面
                return;
            }
            alertError(Jdata.data);
        }).always(function () {
            $btn.parent().find('span.spinner').removeClass('is-active').remove();
        });
    });

    // 設定選單別名按鈕
    $('.ry-set-alias').on('click', function (e) {
        if (e.isPropagationStopped()) return;
        let $btn = $(this);
        $.ajax({
            url: ajaxurl + '?action=ry-line/remote-richmenu-alias',
            method: 'POST',
            dataType: 'json',
            data: {
                post_id: $('#post_ID').val(),
                alias: $('#menu-alias').val(),
                _ajax_nonce: RYLineMetabox.nonce.alias
            }
        }).done(function (Jdata: AjaxResponse) {
            if (Jdata.success) {
                $('#menu-alias').val(Jdata.data);  // 更新別名欄位
                return;
            }
            alertError(Jdata.data);
        }).always(function () {
            $btn.parent().find('span.spinner').removeClass('is-active').remove();
        });
    });

    // 設定為測試選單按鈕：將選單連結到測試用戶
    $('.ry-set-test').on('click', function (e) {
        if (e.isPropagationStopped()) return;
        let $btn = $(this);
        $.ajax({
            url: ajaxurl + '?action=ry-line/remote-richmenu-test',
            method: 'POST',
            dataType: 'json',
            data: {
                post_id: $('#post_ID').val(),
                _ajax_nonce: RYLineMetabox.nonce.test
            }
        }).done(function (Jdata: AjaxResponse) {
            if (Jdata.success) {
                return;
            }
            alertError(Jdata.data);
        }).always(function () {
            $btn.parent().find('span.spinner').removeClass('is-active').remove();
        });
    });

    // 設定為預設選單按鈕：將選單設為所有用戶的預設選單
    $('.ry-default-menu').on('click', function (e) {
        if (e.isPropagationStopped()) return;
        let $btn = $(this);
        $.ajax({
            url: ajaxurl + '?action=ry-line/remote-richmenu-default',
            method: 'POST',
            dataType: 'json',
            data: {
                post_id: $('#post_ID').val(),
                _ajax_nonce: RYLineMetabox.nonce.default
            }
        }).done(function (Jdata: AjaxResponse) {
            if (Jdata.success) {
                $btn.text(Jdata.data);  // 更新按鈕文字
                return;
            }
            alertError(Jdata.data);
        }).always(function () {
            $btn.parent().find('span.spinner').removeClass('is-active').remove();
        });
    });

    // 刪除選單按鈕：從 LINE 伺服器刪除選單
    $('.ry-delete-menu').on('click', function (e) {
        if (e.isPropagationStopped()) return;
        let $btn = $(this);
        $.ajax({
            url: ajaxurl + '?action=ry-line/remote-richmenu-delete',
            method: 'POST',
            dataType: 'json',
            data: {
                post_id: $('#post_ID').val(),
                _ajax_nonce: RYLineMetabox.nonce.delete
            }
        }).done(function (Jdata: AjaxResponse) {
            if (Jdata.success) {
                location.reload();  // 刪除成功，重新載入頁面
                return;
            }
            alertError(Jdata.data);
        }).always(function () {
            $btn.parent().find('span.spinner').removeClass('is-active').remove();
        });
    });

    /**
     * 顯示錯誤訊息的輔助函式
     * @param {Object} Jdata - 錯誤資料物件
     */
    const alertError = function (Jdata) {
        let message = Jdata.message;
        // 如果有詳細錯誤資訊，附加到訊息中
        if (Jdata.details !== undefined) {
            for (const detail of Jdata.details) {
                message += `\n- ${detail.message} ( ${detail.property} )`;
            }
        }
        alert(message);
    };

    // 樣板字串插入功能
    let $string = $('.ry-template-string');
    let $targetInput;  // 目標輸入欄位
    if ($string.length) {
        const $dialog = $('#ry-template-dialog');
        // 隱藏對話框的函式
        const hideDialog = () => {
            $dialog.animate({
                opacity: 0
            }, 400, function () {
                $dialog.css('visibility', 'hidden');
            });
        }

        // 點擊樣板群組項目時，顯示該群組的樣板字串
        $dialog.on('click', '.template-group-item', function () {
            const $btn = $(this);
            $dialog.find('.template-group-item').removeClass(['active']);
            $btn.addClass(['active']);

            const stringTemplate = wp.template('string-item');
            const $string = $dialog.find('.template-string');
            $string.empty();
            $btn.data('strings').forEach((d) => {
                $string.append(stringTemplate(d));

            });
        });
        // 點擊樣板字串項目時，插入到目標輸入欄位
        $dialog.on('click', '.template-string-item', function () {
            const targetElement = $targetInput[0];
            const currentValue = $targetInput.val();
            const cursorPosition = targetElement.selectionStart || currentValue.length;
            const templateCode = ' ' + $(this).find('code').text() + ' ';
            $targetInput.val((currentValue.slice(0, cursorPosition).trim() + templateCode + currentValue.slice(cursorPosition).trim()).trim());

            const newCursorPosition = cursorPosition + templateCode.length;
            targetElement.setSelectionRange(newCursorPosition, newCursorPosition);
            $targetInput.trigger('focus');

            hideDialog();
        });
        // 延遲載入樣板群組列表
        setTimeout(() => {
            const itemTemplate = wp.template('group-item');
            const $group = $dialog.find('.template-group');
            // 建立所有樣板群組項目
            for (const template of RYLineMetabox.templateString) {
                $group.append(itemTemplate({
                    name: template.name
                }));
                $group.find('.template-group-item:last').data('strings', template.strings);
            }
            $group.find('.template-group-item:first').trigger('click');  // 預設顯示第一個群組
        });

        // 點擊樣板字串按鈕時，顯示樣板選擇對話框
        $string.on('click', function () {
            const $btn = $(this);
            const position = $btn.position();
            $targetInput = $($btn.data('target'));
            if ($targetInput.length == 0) {
                return;
            }

            // 加入表格欄位本身的相對位置
            position.left += $btn.parent().position().left;
            position.top += $btn.parent().position().top;

            // 設定對話框初始位置（按鈕右側）
            $dialog.css({
                left: position.left + $btn.outerWidth() + 20 + 'px',
                top: position.top + 'px',
                visibility: 'visible'
            });

            // 如果對話框超出視窗右側，改顯示在按鈕左側
            const dialogRight = $dialog.position().left + $dialog.outerWidth();
            if (dialogRight > $(window).width() - 20) {
                $dialog.css({
                    left: position.left - $dialog.outerWidth() - 20 + 'px'
                });
            }

            // 如果對話框超出視窗底部，調整垂直位置
            const dialogBottom = $dialog.position().top + $dialog.outerHeight();
            if (dialogBottom > $(window).height() - 20) {
                $dialog.css({
                    top: Math.max(20, position.top - $dialog.outerHeight() + $btn.outerHeight(true)) + 'px'
                });
            }

            // 顯示對話框（淡入動畫）
            $dialog.animate({
                opacity: 1
            }, 400);
        });

        // 點擊對話框外部時關閉對話框
        $(document).on('click', function (e) {
            if ($dialog.css('opacity') == 1 && !$(e.target).closest('#ry-template-dialog, .ry-template-string').length) {
                hideDialog();
            }
        });
    }

    // 表單驗證：如果有錯誤訊息，禁用儲存按鈕
    $('form#post').on('change', function () {
        $('#save').prop('disabled', $(this).find('.description.error').length > 0);
    });
});
