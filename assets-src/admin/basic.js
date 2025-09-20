import $ from 'jquery';

$(function () {
    const $loading = $('.ry-line-loading');
    if ($loading.length) {
        $loading.on('click', function (e) {
            const $item = $(this);
            switch ($item.prop('nodeName').toLowerCase()) {
                case 'a':
                    e.preventDefault();
                    $item.append($('<span>').addClass(['spinner', 'is-active']).hide());
                    $item.find('span').show(250, function () {
                        location = $item.attr('href');
                    });
                    break;
                case 'input':
                case 'button':
                    if ($item.parent().find('span.spinner').length == 0) {
                        e.preventDefault();
                        e.stopPropagation();
                        $item.after($('<span>').addClass(['spinner', 'is-active']).css('float', 'none').hide());
                        $item.next('span').show(250, function () {
                            $item.trigger('click');
                        });
                    }
                    break;
            }
        });
    }
});
