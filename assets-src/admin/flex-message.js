import $ from 'jquery';
import { __ } from '@wordpress/i18n';
import 'select2';

import 'select2/src/scss/core.scss';
import './flex-message.scss';

$(function () {
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

    // Flex message JSON validation
    $('#flex-message-content').on('change', function () {
        const $textarea = $(this);
        $textarea.parent().find('p.description.error').remove();
        try {
            const json = JSON.parse($textarea.val());
            if (typeof json !== 'object' || json === null) {
                throw new Error(__('Only object is allowed', 'ry-line'));
            }
            if (json.type === undefined || json.type !== 'bubble') {
                throw new Error(__('Only "Bubble" Container is allowed', 'ry-line'));
            }
            $textarea.removeClass('ry-line-error');
        } catch (e) {
            if (e.name === 'SyntaxError') {
                $textarea.after(`<p class="description error">${__('Invalid JSON string', 'ry-line')}: ${e.message}</p>`);
            } else {
                $textarea.after(`<p class="description error">${__('Invalid data', 'ry-line')}: ${e.message}</p>`);
            }
            $textarea.addClass('ry-line-error');
        }
    });
});
