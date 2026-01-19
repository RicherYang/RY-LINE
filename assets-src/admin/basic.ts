import $ from 'jquery';

import './lib/globals.d.ts';

import type {
    AjaxResponse
} from './lib/types.ts';

const LOADING_ANIMATION_DURATION = 250;

/**
 * 處理載入動畫
 */
function LoadingAction(event: JQuery.ClickEvent) {
    const $item: JQuery = $(event.currentTarget);
    switch ($item.prop('nodeName').toLowerCase()) {
        case 'a':
            anchorLoadingAction(event, $item);
            break;
        case 'input':
        case 'button':
            buttonLoadingAction(event, $item);
            break;
    }
}

/**
 * 處理錨點的載入動畫顯示
 */
const anchorLoadingAction = (event: JQuery.ClickEvent, $item: JQuery): void => {
    event.preventDefault();
    event.stopPropagation();
    $item.append($('<span>').addClass(['spinner', 'is-active']).hide());
    $item.find('span').show(LOADING_ANIMATION_DURATION, function () {
        window.location.assign($item.attr('href') as string);
    });
}

/**
 * 處理按鈕載入動畫顯示
 */
const buttonLoadingAction = (event: JQuery.ClickEvent, $item: JQuery): void => {
    if ($item.parent().find('span.spinner').length == 0) {
        event.preventDefault();
        event.stopPropagation();
        $item.after($('<span>').addClass(['spinner', 'is-active']).css('float', 'none').hide());
        $item.next('span').show(LOADING_ANIMATION_DURATION, function () {
            $item.trigger('click');
        });
    }
}

$(function () {
    $('.ry-line-loading').on('click', LoadingAction);

    /**
     * 載入 LINE 即時資訊
     */
    const $info_elements: Record<string, JQuery<HTMLElement>[]> = {};
    $('.ry-line-load-info').each(function () {
        const $info: JQuery<HTMLElement> = $(this);
        const type_ID = $info.data('id');
        if (type_ID !== '') {
            $info_elements[type_ID] = $info_elements[type_ID] || [];
            $info_elements[type_ID].push($info);
        }
    });
    const info_IDs = Object.keys($info_elements);
    if (info_IDs.length) {
        $.ajax({
            url: ajaxurl + '?action=ry-line/get-info',
            method: 'POST',
            dataType: 'json',
            data: {
                types: info_IDs,
                _ajax_nonce: RYLine.nonce.get
            },
        }).done(function (Jdata: AjaxResponse) {
            if (Jdata.success !== true) return;

            for (const type_ID of info_IDs) {
                for (const $element of $info_elements[type_ID]) {
                    $element.text(Jdata.data[type_ID] ?? 'N/A');
                }
            }
        });
    }
});
