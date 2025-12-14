import $ from 'jquery';

import './meta-box.scss';

$(function () {
    const $svg = $('#image-area-svg');
    const $gLines = $svg.find('.area-lines');
    const $gTexts = $svg.find('.area-texts');
    const $positionTable = $('#image-position-list tbody');
    const areaTemplate = wp.template('area-settings');
    const $actionTable = $('#image-action-list tbody');
    const actionTemplate = wp.template('action-settings');

    if ($svg !== undefined) {
        let isDrawing = false;
        let isDragging = false;
        let startPoint = null;
        let currentLine = null;

        const getAreasData = () => {
            $.ajax({
                url: ajaxurl + '?action=ry-line/get-image-areas',
                method: 'POST',
                dataType: 'json',
                data: {
                    post_id: $('#post_ID').val(),
                    _ajax_nonce: RYLineMetabox.nonce.get
                }
            }).done(function (Jdata) {
                if (Jdata.success) {
                    if (Array.isArray(Jdata.data.areas) && Jdata.data.areas.length) {
                        showImg(360);
                        initDisplayAreas(Jdata.data.areas);
                        return;
                    }
                }
                showImg(720);
                initLineDrawing();
            });
        };
        getAreasData();

        const showImg = (width) => {
            width = Math.min(width, $svg.closest('.postbox').width() * 0.6);
            $svg.parent().width(width);
            $svg.data('ratio', width / parseInt($svg.data('width')));
            const svgWidth = parseInt($svg.data('width')) * $svg.data('ratio');
            const svgHeight = parseInt($svg.data('height')) * $svg.data('ratio');

            $svg.attr({
                width: svgWidth,
                height: svgHeight,
                viewBox: `0 0 ${svgWidth} ${svgHeight}`
            });
            $('#bg-pattern').attr({
                width: svgWidth,
                height: svgHeight
            });
            $('#bg-pattern image').attr({
                width: svgWidth,
                height: svgHeight,
                href: $svg.data('bg')
            });
        };

        // 滑鼠放開事件
        $(document).on('mouseup', function (event) {
            if (!isDrawing && !isDragging) return;

            if (isDragging) {
                currentLine.removeClass('dragging');

                let endPoint = getMousePoint(event);
                if (currentLine.hasClass('horizontal')) {
                    currentLine.attr({
                        y1: endPoint.y,
                        y2: endPoint.y,
                        stroke: '#0000ff'
                    });
                } else {
                    currentLine.attr({
                        x1: endPoint.x,
                        x2: endPoint.x,
                        stroke: '#0000ff'
                    });
                }

                autoDeleteLine();
                showAreasTable();

                // 重置狀態
                isDragging = false;
                startPoint = null;
                return;
            }

            $svg.removeClass(['drawing']);
            let endPoint = snapToEdgeOrLine(event);

            // 強制線段為水平或垂直
            const deltaX = Math.abs(endPoint.x - startPoint.x);
            const deltaY = Math.abs(endPoint.y - startPoint.y);
            if (deltaX > deltaY) {
                endPoint.y = startPoint.y; // 水平線
                currentLine.addClass(['horizontal']);
            } else {
                endPoint.x = startPoint.x; // 垂直線
                currentLine.addClass(['vertical']);
            }

            const minLength = 20; // 最小長度
            if (Math.abs(startPoint.x - endPoint.x) + Math.abs(startPoint.y - endPoint.y) > minLength && isValidStartPoint(endPoint.x, endPoint.y)) {
                // 將臨時線段轉為永久線段
                currentLine.removeClass(['temp-line'])
                    .addClass(['permanent-line'])
                    .attr({
                        x1: startPoint.x,
                        y1: startPoint.y,
                        x2: endPoint.x,
                        y2: endPoint.y,
                        stroke: '#0000ff',
                        'stroke-dasharray': ''
                    });

                // 添加雙擊刪除功能
                currentLine.on('dblclick', function () {
                    $(this).remove();
                    autoDeleteLine();
                });

                showAreasTable();
            } else {
                // 刪除無效線段
                currentLine.remove();
            }

            // 重置狀態
            isDrawing = false;
            startPoint = null;
            currentLine = null;
        });

        // 初始化線段繪製功能
        const initLineDrawing = () => {
            $actionTable.off('change');
            $svg.find('rect.bg').attr('opacity', 0);
            $positionTable.closest('table').show();
            $actionTable.closest('table').hide();
            $('.ry-create-menu').hide();

            // 滑鼠按下事件
            $svg.on('mousedown', function (event) {
                event.preventDefault();
                const snapped = snapToEdgeOrLine(event);

                if (event.target.classList.contains('permanent-line')) {
                    isDragging = true;
                    startPoint = snapped;
                    currentLine = $(event.target);
                    currentLine.addClass(['dragging']);
                    return;
                }

                if (isValidStartPoint(snapped.x, snapped.y)) {
                    $svg.addClass(['drawing']);
                    isDrawing = true;
                    startPoint = snapped;

                    // 創建臨時線段
                    currentLine = $(document.createElementNS('http://www.w3.org/2000/svg', 'line'));
                    currentLine.addClass(['temp-line'])
                        .attr({
                            x1: startPoint.x,
                            y1: startPoint.y,
                            x2: startPoint.x,
                            y2: startPoint.y,
                            stroke: '#ff0000',
                            'stroke-width': 2,
                            'stroke-dasharray': '5,5'
                        });
                    $gLines.append(currentLine);
                }
            });

            // 滑鼠移動事件
            $svg.on('mousemove', function (event) {
                if (!isDrawing && !isDragging) return;

                if (isDragging) {
                    let endPoint = getMousePoint(event);
                    if (currentLine.hasClass('horizontal')) {
                        currentLine.attr({
                            y1: endPoint.y,
                            y2: endPoint.y,
                            stroke: '#00ff00'
                        });
                    } else {
                        currentLine.attr({
                            x1: endPoint.x,
                            x2: endPoint.x,
                            stroke: '#00ff00'
                        });
                    }
                    showAreasTable();
                    return;
                }

                let endPoint = snapToEdgeOrLine(event);

                // 強制線段為水平或垂直
                const deltaX = Math.abs(endPoint.x - startPoint.x);
                const deltaY = Math.abs(endPoint.y - startPoint.y);

                if (deltaX > deltaY) {
                    endPoint.y = startPoint.y; // 水平線
                } else {
                    endPoint.x = startPoint.x; // 垂直線
                }

                currentLine.attr({
                    x2: endPoint.x,
                    y2: endPoint.y,
                    stroke: isValidStartPoint(endPoint.x, endPoint.y) ? '#00ff00' : '#ff0000'
                });
            });

            showAreasTable();
        }

        // 初始化區域顯示功能
        const initDisplayAreas = (areas) => {
            $svg.off('mousedown');
            $svg.off('mousemove');
            $svg.find('rect.bg').attr('opacity', 0.04);
            $positionTable.closest('table').hide();
            $actionTable.closest('table').show();
            $('.ry-create-menu').hide();

            $actionTable.empty();
            $gTexts.empty();

            $actionTable.on('change', '.action-type', function () {
                $(this).closest('tr').find('.action-info').hide();
                $(this).closest('tr').find('.action-info-' + $(this).val()).show();
            });

            let showAction = false;
            for (const idx in areas) {
                const area = areas[idx];

                addText((area.bounds.x + area.bounds.width / 2) * $svg.data('ratio'), (area.bounds.y + area.bounds.height / 2) * $svg.data('ratio'), idx);

                const rect = $(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));
                rect.attr({
                    x: area.bounds.x * $svg.data('ratio'),
                    y: area.bounds.y * $svg.data('ratio'),
                    width: area.bounds.width * $svg.data('ratio'),
                    height: area.bounds.height * $svg.data('ratio'),
                    fill: 'none',
                    stroke: '#0000ff',
                    'stroke-width': 1
                });
                $gLines.append(rect);

                $actionTable.append(actionTemplate({
                    idx: idx,
                    areaStart: `( ${area.bounds.x}, ${area.bounds.y} )`,
                    areaSize: `${area.bounds.width} x ${area.bounds.height}`
                }));
                const $tr = $actionTable.find('tr').last();
                $tr.find('.action-type').val(area.action.type).trigger('change');
                switch (area.action.type) {
                    case 'uri':
                        $tr.find(`#action-info-${idx}-uri`).val(area.action.uri);
                        $tr.find(`#action-info-${idx}-label`).val(area.action.label);
                        showAction = true;
                        break;
                    case 'message':
                        $tr.find(`#action-info-${idx}-text`).val(area.action.text);
                        $tr.find(`#action-info-${idx}-label`).val(area.action.label);
                        showAction = true;
                        break;
                    case 'selfmessage':
                        $tr.find(`#action-info-${idx}-message`).val(area.action.message);
                        $tr.find(`#action-info-${idx}-label`).val(area.action.label);
                        showAction = true;
                        break;
                    case 'richmenuswitch':
                        $tr.find(`#action-info-${idx}-richMenuAliasId`).val(area.action.richMenuAliasId);
                        showAction = true;
                        break;
                    case 'accountlink':
                        $tr.find(`#action-info-${idx}-text`).val(area.action.displayText);
                        $tr.find(`#action-info-${idx}-label`).val(area.action.label);
                        showAction = true;
                        break;
                }
            }
            if (showAction) {
                $('.ry-create-menu').show();
            }
        }

        // 顯示線段所圍成的區域資訊
        const showAreasTable = () => {
            const svgWidth = parseFloat($svg.attr('width'));
            const svgHeight = parseFloat($svg.attr('height'));

            // 收集所有線段
            const lines = [];
            $gLines.find('line.permanent-line').each(function () {
                lines.push({
                    x1: parseFloat($(this).attr('x1')),
                    y1: parseFloat($(this).attr('y1')),
                    x2: parseFloat($(this).attr('x2')),
                    y2: parseFloat($(this).attr('y2'))
                });
            });

            // 收集所有的x和y座標
            const xCoords = new Set([0, svgWidth]);
            const yCoords = new Set([0, svgHeight]);
            lines.forEach(line => {
                xCoords.add(line.x1);
                xCoords.add(line.x2);
                yCoords.add(line.y1);
                yCoords.add(line.y2);
            });

            // 排序座標
            const sortedX = Array.from(xCoords).sort((a, b) => a - b);
            const sortedY = Array.from(yCoords).sort((a, b) => a - b);

            // 找出所有可能的矩形區域
            const areas = {};
            for (let y1 = 0; y1 < sortedY.length - 1; y1++) {
                for (let y2 = y1 + 1; y2 < sortedY.length; y2++) {
                    for (let x1 = 0; x1 < sortedX.length - 1; x1++) {
                        for (let x2 = x1 + 1; x2 < sortedX.length; x2++) {
                            let left = sortedX[x1];
                            let right = sortedX[x2];
                            let top = sortedY[y1];
                            let bottom = sortedY[y2];

                            if (areas[`${left}, ${top}`] !== undefined) {
                                continue;
                            }

                            // 檢查這個矩形是否被完全包圍
                            if (isAreaFullyEnclosed(left, top, right, bottom, lines)) {
                                areas[`${left}, ${top}`] = {
                                    left: left,
                                    top: top,
                                    right: right,
                                    bottom: bottom
                                }
                            }
                        }
                    }
                }
            }

            // 更新表格內容
            $positionTable.empty();
            $gTexts.empty();
            Object.values(areas).forEach((area, idx) => {
                addText((area.left + area.right) / 2, (area.top + area.bottom) / 2, idx);

                const left = Math.floor(area.left / $svg.data('ratio'));
                const top = Math.floor(area.top / $svg.data('ratio'));
                const right = Math.floor(area.right / $svg.data('ratio'));
                const bottom = Math.floor(area.bottom / $svg.data('ratio'));
                const phoneRatio = parseFloat($svg.attr('width')) / $svg.data('ratio') / 360;
                let phoneWidth = Math.round((right - left) / phoneRatio);
                let phoneHeight = Math.round((bottom - top) / phoneRatio);
                if (phoneWidth < 30) {
                    phoneWidth = `<strong class="file-error">${phoneWidth}</strong>`;
                }
                if (phoneHeight < 30) {
                    phoneHeight = `<strong class="file-error">${phoneHeight}</strong>`;
                }

                $positionTable.append(areaTemplate({
                    idx: idx,
                    value: `${left ? left + 1 : 0}-${top ? top + 1 : 0}-${right - left}-${bottom - top}`,
                    phoneSize: `${phoneWidth} x ${phoneHeight}`,
                    areaStart: `( ${left ? left + 1 : 0} , ${top ? top + 1 : 0} )`,
                    areaSize: `${right - left} x ${bottom - top}`
                }));
            });
        }

        // 刪除無效線段
        const autoDeleteLine = () => {
            let removeLine = [];
            $gLines.find('line.permanent-line').each(function () {
                let $line = $(this);
                $line.addClass(['pre-delete'])
                    .removeClass(['permanent-line']);
                if (isValidStartPoint($line.attr('x1'), $line.attr('y1')) && isValidStartPoint($line.attr('x2'), $line.attr('y2'))) {
                    $line.addClass(['permanent-line'])
                        .removeClass(['pre-delete']);
                } else {
                    removeLine.push($line);
                }
            });
            if (removeLine.length) {
                while (removeLine.length) {
                    removeLine.pop().remove();
                }
                autoDeleteLine();
            } else {
                showAreasTable();
            }
        };

        // 添加區域編號文字
        const addText = (x, y, content) => {
            const circle = $(document.createElementNS('http://www.w3.org/2000/svg', 'circle'));
            circle.attr({
                cx: x,
                cy: y,
                fill: '#000',
                opacity: '0.075'
            });
            $gTexts.append(circle);

            const text = $(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
            text.attr({
                x: x,
                y: y,
                dy: '2px',
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
            });
            text.text(content);
            $gTexts.append(text);
            circle.attr({
                r: Math.floor(Math.max(text[0].getBBox().width, text[0].getBBox().height) / 2)
            });
        }

        // 從滑鼠事件中獲取座標
        const getMousePoint = (event) => {
            const rect = $svg[0].getBoundingClientRect();
            const svgWidth = parseFloat($svg.attr('width'));
            const svgHeight = parseFloat($svg.attr('height'));

            return {
                x: ((event.clientX - rect.left) / rect.width) * svgWidth,
                y: ((event.clientY - rect.top) / rect.height) * svgHeight
            };
        }

        // 將滑鼠的點位對齊到邊緣或線段
        const snapToEdgeOrLine = (event) => {
            const svgWidth = parseFloat($svg.attr('width'));
            const svgHeight = parseFloat($svg.attr('height'));
            const tolerance = 20; // 容許容差值
            let { x, y } = getMousePoint(event);

            // 對齊到邊緣
            if (x <= tolerance) x = 0;
            if (x >= svgWidth - tolerance) x = svgWidth;
            if (y <= tolerance) y = 0;
            if (y >= svgHeight - tolerance) y = svgHeight;

            // 對齊到現有線段
            $gLines.find('line.permanent-line').each(function () {
                const line = {
                    x1: parseFloat($(this).attr('x1')),
                    y1: parseFloat($(this).attr('y1')),
                    x2: parseFloat($(this).attr('x2')),
                    y2: parseFloat($(this).attr('y2'))
                };
                if (isPointOnLine(x, y, line, tolerance)) {
                    if (Math.abs(line.y1 - line.y2) < 1) {
                        y = line.y1; // 水平線
                    } else if (Math.abs(line.x1 - line.x2) < 1) {
                        x = line.x1; // 垂直線
                    }
                }
            });

            return { x, y };
        }

        // 檢查點是否在邊緣或線段上
        const isValidStartPoint = (x, y) => {
            const svgWidth = parseFloat($svg.attr('width'));
            const svgHeight = parseFloat($svg.attr('height'));
            const tolerance = 0.1; // 容許誤差值

            x = parseFloat(x);
            y = parseFloat(y);

            // 檢查是否在邊緣
            if (x <= tolerance || x >= svgWidth - tolerance ||
                y <= tolerance || y >= svgHeight - tolerance) {
                return true;
            }

            // 檢查是否在現有線段上
            let isOnLine = false;
            $gLines.find('line.permanent-line').each(function () {
                const line = {
                    x1: parseFloat($(this).attr('x1')),
                    y1: parseFloat($(this).attr('y1')),
                    x2: parseFloat($(this).attr('x2')),
                    y2: parseFloat($(this).attr('y2'))
                };
                if (isPointOnLine(x, y, line, tolerance)) {
                    isOnLine = true;
                }
            });

            return isOnLine;
        }

        // 檢查點是否在線段上
        const isPointOnLine = (x, y, line, tolerance) => {
            const { x1, y1, x2, y2 } = line;

            // 檢查水平線
            if (Math.abs(y1 - y2) < tolerance) {
                return Math.abs(y - y1) <= tolerance &&
                    x >= Math.min(x1, x2) - tolerance &&
                    x <= Math.max(x1, x2) + tolerance;
            }

            // 檢查垂直線
            if (Math.abs(x1 - x2) < tolerance) {
                return Math.abs(x - x1) <= tolerance &&
                    y >= Math.min(y1, y2) - tolerance &&
                    y <= Math.max(y1, y2) + tolerance;
            }

            return false;
        }

        // 檢查矩形區域是否被線段完全包圍
        const isAreaFullyEnclosed = (left, top, right, bottom, lines) => {
            const tolerance = 0.1; // 容許誤差值

            // 檢查四條邊是否都有線段覆蓋
            const hasTopEdge = hasLineSegment(left, top, right, top, lines, tolerance);
            const hasRightEdge = hasLineSegment(right, top, right, bottom, lines, tolerance);
            const hasBottomEdge = hasLineSegment(left, bottom, right, bottom, lines, tolerance);
            const hasLeftEdge = hasLineSegment(left, top, left, bottom, lines, tolerance);

            return hasTopEdge && hasRightEdge && hasBottomEdge && hasLeftEdge;
        }

        // 檢查是否有線段覆蓋指定的邊
        const hasLineSegment = (x1, y1, x2, y2, lines, tolerance) => {
            // 如果是邊界，直接返回true
            const svgWidth = parseFloat($svg.attr('width'));
            const svgHeight = parseFloat($svg.attr('height'));

            // 檢查是否是邊界
            if ((Math.abs(y1) <= tolerance && Math.abs(y2) <= tolerance) || // 上邊界
                (Math.abs(x1) <= tolerance && Math.abs(x2) <= tolerance) || // 左邊界
                (Math.abs(y1 - svgHeight) <= tolerance && Math.abs(y2 - svgHeight) <= tolerance) || // 下邊界
                (Math.abs(x1 - svgWidth) <= tolerance && Math.abs(x2 - svgWidth) <= tolerance)) { // 右邊界
                return true;
            }

            // 檢查是否有線段完全覆蓋這條邊
            for (const line of lines) {
                if (isLineSegmentCovered(x1, y1, x2, y2, line, tolerance)) {
                    return true;
                }
            }

            return false;
        }

        const isLineSegmentCovered = (x1, y1, x2, y2, line, tolerance) => {
            const { x1: lx1, y1: ly1, x2: lx2, y2: ly2 } = line;

            // 檢查是否在同一條線上
            if (Math.abs(y1 - y2) < tolerance && Math.abs(ly1 - ly2) < tolerance) {
                // 水平線
                if (Math.abs(y1 - ly1) <= tolerance) {
                    const edgeStart = Math.min(x1, x2);
                    const edgeEnd = Math.max(x1, x2);
                    const lineStart = Math.min(lx1, lx2);
                    const lineEnd = Math.max(lx1, lx2);

                    return lineStart <= edgeStart + tolerance && lineEnd >= edgeEnd - tolerance;
                }
            } else if (Math.abs(x1 - x2) < tolerance && Math.abs(lx1 - lx2) < tolerance) {
                // 垂直線
                if (Math.abs(x1 - lx1) <= tolerance) {
                    const edgeStart = Math.min(y1, y2);
                    const edgeEnd = Math.max(y1, y2);
                    const lineStart = Math.min(ly1, ly2);
                    const lineEnd = Math.max(ly1, ly2);

                    return lineStart <= edgeStart + tolerance && lineEnd >= edgeEnd - tolerance;
                }
            }

            return false;
        }

        // 按鈕-重設區域
        $('.ry-reset-areas').on('click', function () {
            $gLines.empty();
            initLineDrawing();
        });

        // 按鈕-儲存區域位置
        $('.ry-save-position').on('click', function (e) {
            if (e.isPropagationStopped()) return;
            let $btn = $(this);
            $.ajax({
                url: ajaxurl + '?action=ry-line/save-image-position',
                method: 'POST',
                dataType: 'json',
                data: {
                    areas: decodeURIComponent($positionTable.closest('fieldset').serialize()),
                    post_id: $('#post_ID').val(),
                    _ajax_nonce: RYLineMetabox.nonce.position
                }
            }).done(function (Jdata) {
                if (Jdata.success) {
                    if (Array.isArray(Jdata.data) && Jdata.data.length) {
                        initDisplayAreas(Jdata.data);
                        return;
                    }
                }
                initLineDrawing();
            }).always(function () {
                $btn.parent().find('span.spinner').removeClass('is-active').remove();
            });
        });

        // 按鈕-儲存區域動作
        $('.ry-save-action').on('click', function (e) {
            if (e.isPropagationStopped()) return;
            let $btn = $(this);
            $.ajax({
                url: ajaxurl + '?action=ry-line/save-image-actions',
                method: 'POST',
                dataType: 'json',
                data: {
                    actions: decodeURIComponent($actionTable.closest('fieldset').serialize()),
                    post_id: $('#post_ID').val(),
                    _ajax_nonce: RYLineMetabox.nonce.actions
                }
            }).done(function (Jdata) {
                if (Jdata.success) {
                    if (Array.isArray(Jdata.data) && Jdata.data.length) {
                        initDisplayAreas(Jdata.data);
                        return;
                    }
                }
                initLineDrawing();
            }).always(function () {
                $btn.parent().find('span.spinner').removeClass('is-active').remove();
            });
        });
    }

    // 內容自動高度
    $('textarea').on('input', function () {
        let $textarea = $(this);
        $textarea.height('auto');
        $textarea.height(Math.min(400, $textarea[0].scrollHeight + 30));
    }).trigger('input');

    // 訊息類型切換
    $('#message-type').on('input', function () {
        $('#postimagediv').hide();
        $('.type-info').hide();
        $('.type-info-' + $(this).val()).show();
        if ($(this).val() == 'image') {
            $('#postimagediv').show();
        }
    }).trigger('input');

    // 訊息回應關鍵字
    $('[name="reply-type"]').on('input', function () {
        $('.reply-info').hide();
        $('.reply-info-' + $(this).val()).show();
    });
    $('[name="reply-type"]:checked').trigger('input');

    // 事件副本
    $('[name="autosend-event[]"]').on('input', function () {
        $('.event-info').hide();
        if ($('[name="autosend-event[]"]:checked').length) {
            $('.event-info').show();
        }
    }).first().trigger('input');

    // 按鈕-發送訊息
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
        }).done(function (Jdata) {
            if (Jdata.success) {
                return;
            }
            alertError(Jdata.data);
        }).always(function () {
            $btn.parent().find('span.spinner').removeClass('is-active').remove();
        });
    });

    // 按鈕-建立選單
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
        }).done(function (Jdata) {
            if (Jdata.success) {
                location.reload();
                return;
            }
            alertError(Jdata.data);
        }).always(function () {
            $btn.parent().find('span.spinner').removeClass('is-active').remove();
        });
    });

    // 按鈕-選單代稱
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
        }).done(function (Jdata) {
            if (Jdata.success) {
                $('#menu-alias').val(Jdata.data);
                return;
            }
            alertError(Jdata.data);
        }).always(function () {
            $btn.parent().find('span.spinner').removeClass('is-active').remove();
        });
    });

    // 按鈕-選單代稱
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
        }).done(function (Jdata) {
            if (Jdata.success) {
                return;
            }
            alertError(Jdata.data);
        }).always(function () {
            $btn.parent().find('span.spinner').removeClass('is-active').remove();
        });
    });

    // 按鈕-預設選單
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
        }).done(function (Jdata) {
            if (Jdata.success) {
                $btn.text(Jdata.data);
                return;
            }
            alertError(Jdata.data);
        }).always(function () {
            $btn.parent().find('span.spinner').removeClass('is-active').remove();
        });
    });

    // 按鈕-刪除選單
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
        }).done(function (Jdata) {
            if (Jdata.success) {
                location.reload();
                return;
            }
            alertError(Jdata.data);
        }).always(function () {
            $btn.parent().find('span.spinner').removeClass('is-active').remove();
        });
    });

    const alertError = function (Jdata) {
        let message = Jdata.message;
        if (Jdata.details !== undefined) {
            for (const detail of Jdata.details) {
                message += `\n- ${detail.message} ( ${detail.property} )`;
            }
        }
        alert(message);
    };

    // 模板字符串對話框功能
    let $string = $('.ry-template-string');
    let $targetInput;
    if ($string.length) {
        const $dialog = $('#ry-template-dialog');
        const hideDialog = () => {
            $dialog.animate({
                opacity: 0
            }, 400, function () {
                $dialog.css('visibility', 'hidden');
            });
        }

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
        $dialog.on('click', '.template-string-item', function () {
            const targetElement = $targetInput[0];
            const currentValue = $targetInput.val();
            const cursorPosition = targetElement.selectionStart || currentValue.length;
            const templateCode = ' ' + $(this).find('code').text() + ' ';
            $targetInput.val(currentValue.slice(0, cursorPosition) + templateCode + currentValue.slice(cursorPosition));

            // 設定新的游標位置到插入文字的末尾
            const newCursorPosition = cursorPosition + templateCode.length;
            targetElement.setSelectionRange(newCursorPosition, newCursorPosition);
            $targetInput.trigger('focus');

            hideDialog();
        });
        setTimeout(() => {
            const itemTemplate = wp.template('group-item');
            const $group = $dialog.find('.template-group');
            for (const template of RYLineMetabox.templateString) {
                $group.append(itemTemplate({
                    name: template.name
                }));
                $group.find('.template-group-item:last').data('strings', template.strings);
            }
            $group.find('.template-group-item:first').trigger('click');
        });

        // 點擊顯示對話框
        $string.on('click', function (e) {
            const $btn = $(this);
            const position = $btn.position();
            const elementHeight = $btn.outerHeight();
            $targetInput = $($btn.data('target'));
            if ($targetInput.length == 0) {
                return;
            }


            $dialog.css({
                left: position.left + $btn.outerWidth() + 20 + 'px',
                top: position.top + 'px',
                visibility: 'visible'
            });

            // 檢查對話框是否超出視窗右邊界，如果是則調整位置到左側
            const dialogRight = $dialog.position().left + $dialog.outerWidth();
            const windowWidth = $(window).width();
            if (dialogRight > windowWidth - 20) {
                $dialog.css({
                    left: position.left - $dialog.outerWidth() - 20 + 'px'
                });
            }

            // 檢查對話框是否超出視窗下邊界，如果是則向上調整
            const dialogBottom = $dialog.position().top + $dialog.outerHeight();
            const windowHeight = $(window).height();

            if (dialogBottom > windowHeight - 20) {
                $dialog.css({
                    top: Math.max(20, position.top - $dialog.outerHeight() + elementHeight) + 'px'
                });
            }

            $dialog.animate({
                opacity: 1
            }, 400);
        });

        // 點擊其他地方隱藏對話框
        $(document).on('click', function (e) {
            if ($dialog.css('opacity') == 1 && !$(e.target).closest('#ry-template-dialog, .ry-template-string').length) {
                hideDialog();
            }
        });
    }

    $('form#post').on('change', function () {
        $('#save').prop('disabled', $(this).find('.description.error').length > 0);
    });
});
