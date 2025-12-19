/**
 * LINE Rich Menu (圖文選單) 編輯器
 * 提供圖形化介面來建立和編輯 LINE 圖文選單的區域劃分和互動行為
 */
import $ from 'jquery';

import './meta-box.scss';

$(function () {
    // DOM 元素參照
    const $svg = $('#image-area-svg');                       // SVG 畫布，用於顯示圖文選單圖片和區域劃分
    const $gLines = $svg.find('.area-lines');                // 存放區域分割線的 SVG 群組
    const $gTexts = $svg.find('.area-texts');                // 存放區域編號標記的 SVG 群組
    const $positionTable = $('#image-position-list tbody');  // 區域位置資訊表格
    const areaTemplate = wp.template('area-settings');       // 區域設定的模板函式
    const $actionTable = $('#image-action-list tbody');      // 區域動作設定表格
    const actionTemplate = wp.template('action-settings');   // 動作設定的模板函式

    if ($svg !== undefined) {
        // 繪圖狀態變數
        let isDrawing = false;   // 是否正在繪製新的分割線
        let isDragging = false;  // 是否正在拖曳現有的分割線
        let startPoint = null;   // 繪圖或拖曳的起始點座標
        let currentLine = null;  // 目前正在操作的線條元素

        /**
         * 從伺服器取得圖文選單的區域資料
         * 如果已有儲存的區域資料，則顯示編輯介面；否則進入繪圖模式
         */
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
                        // 有現有區域資料，以較小尺寸顯示並切換到顯示模式
                        showImg(360);
                        initDisplayAreas(Jdata.data.areas);
                        return;
                    }
                }
                // 沒有區域資料，以較大尺寸顯示並進入繪圖模式
                showImg(720);
                initLineDrawing();
            });
        };
        getAreasData();

        /**
         * 顯示圖文選單圖片並調整 SVG 畫布大小
         * @param {number} width - 目標顯示寬度（像素）
         */
        const showImg = (width) => {
            // 限制寬度不超過容器的 60%
            width = Math.min(width, $svg.closest('.postbox').width() * 0.6);
            $svg.parent().width(width);
            // 計算並儲存縮放比例
            $svg.data('ratio', width / parseInt($svg.data('width')));
            const svgWidth = parseInt($svg.data('width')) * $svg.data('ratio');
            const svgHeight = parseInt($svg.data('height')) * $svg.data('ratio');

            // 設定 SVG 元素的尺寸和視圖範圍
            $svg.attr({
                width: svgWidth,
                height: svgHeight,
                viewBox: `0 0 ${svgWidth} ${svgHeight}`
            });
            // 設定背景圖片的尺寸
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

        /**
         * 滑鼠放開事件處理：完成線條繪製或拖曳
         * 處理線條的最終定位、驗證和分類（水平或垂直線）
         */
        $(document).on('mouseup', function (event) {
            if (!isDrawing && !isDragging) return;

            // 處理拖曳線條的情況
            if (isDragging) {
                currentLine.removeClass('dragging');

                let endPoint = getMousePoint(event);
                // 根據線條類型（水平/垂直）更新座標
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

                autoDeleteLine();  // 自動刪除無效的線條
                showAreasTable();  // 更新區域表格

                isDragging = false;
                startPoint = null;
                return;
            }

            // 處理新線條繪製的情況
            $svg.removeClass(['drawing']);
            let endPoint = snapToEdgeOrLine(event);  // 將終點吸附到邊緣或現有線條

            // 根據拖曳距離判斷線條方向（水平或垂直）
            const deltaX = Math.abs(endPoint.x - startPoint.x);
            const deltaY = Math.abs(endPoint.y - startPoint.y);
            if (deltaX > deltaY) {
                endPoint.y = startPoint.y;  // 水平線
                currentLine.addClass(['horizontal']);
            } else {
                endPoint.x = startPoint.x;  // 垂直線
                currentLine.addClass(['vertical']);
            }

            const minLength = 20;  // 最小有效線條長度
            // 驗證線條長度和起點、終點位置的有效性
            if (Math.abs(startPoint.x - endPoint.x) + Math.abs(startPoint.y - endPoint.y) > minLength && isValidStartPoint(endPoint.x, endPoint.y)) {
                // 將臨時線條轉換為永久線條
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

                // 綁定雙擊刪除線條的事件
                currentLine.on('dblclick', function () {
                    $(this).remove();
                    autoDeleteLine();
                });

                showAreasTable();  // 更新區域表格
            } else {
                currentLine.remove();  // 線條無效，移除
            }

            // 重置繪圖狀態
            isDrawing = false;
            startPoint = null;
            currentLine = null;
        });

        /**
         * 初始化線條繪製模式
         * 啟用互動式區域劃分功能，讓使用者可以繪製分割線來定義點擊區域
         */
        const initLineDrawing = () => {
            $actionTable.off('change');  // 移除動作表格的變更監聽
            $svg.find('rect.bg').attr('opacity', 0);  // 隱藏背景遮罩
            $positionTable.closest('table').show();   // 顯示位置表格
            $actionTable.closest('table').hide();     // 隱藏動作表格
            $('.ry-create-menu').hide();              // 隱藏建立選單按鈕

            // 綁定滑鼠按下事件：開始繪製或拖曳線條
            $svg.on('mousedown', function (event) {
                event.preventDefault();
                const snapped = snapToEdgeOrLine(event);  // 將滑鼠位置吸附到邊緣或線條

                // 如果點擊的是現有線條，進入拖曳模式
                if (event.target.classList.contains('permanent-line')) {
                    isDragging = true;
                    startPoint = snapped;
                    currentLine = $(event.target);
                    currentLine.addClass(['dragging']);
                    return;
                }

                // 如果點擊位置有效（在邊緣或線條上），開始繪製新線條
                if (isValidStartPoint(snapped.x, snapped.y)) {
                    $svg.addClass(['drawing']);
                    isDrawing = true;
                    startPoint = snapped;

                    // 建立新的臨時線條
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

            // 綁定滑鼠移動事件：即時更新線條的繪製或拖曳狀態
            $svg.on('mousemove', function (event) {
                if (!isDrawing && !isDragging) return;

                // 處理拖曳線條的情況
                if (isDragging) {
                    let endPoint = getMousePoint(event);
                    // 根據線條類型限制移動方向
                    if (currentLine.hasClass('horizontal')) {
                        currentLine.attr({
                            y1: endPoint.y,
                            y2: endPoint.y,
                            stroke: '#00ff00'  // 拖曳中顯示綠色
                        });
                    } else {
                        currentLine.attr({
                            x1: endPoint.x,
                            x2: endPoint.x,
                            stroke: '#00ff00'
                        });
                    }
                    showAreasTable();  // 即時更新區域表格
                    return;
                }

                // 處理新線條繪製的情況
                let endPoint = snapToEdgeOrLine(event);

                // 根據移動距離判斷線條方向
                const deltaX = Math.abs(endPoint.x - startPoint.x);
                const deltaY = Math.abs(endPoint.y - startPoint.y);

                if (deltaX > deltaY) {
                    endPoint.y = startPoint.y;  // 限制為水平線
                } else {
                    endPoint.x = startPoint.x;  // 限制為垂直線
                }

                // 更新臨時線條，並根據終點有效性改變顏色
                currentLine.attr({
                    x2: endPoint.x,
                    y2: endPoint.y,
                    stroke: isValidStartPoint(endPoint.x, endPoint.y) ? '#00ff00' : '#ff0000'
                });
            });

            showAreasTable();  // 初始化時顯示區域表格
        }

        /**
         * 初始化區域顯示模式
         * 顯示已儲存的區域資料，讓使用者可以設定每個區域的互動行為
         * @param {Array} areas - 區域資料陣列，包含位置和動作資訊
         */
        const initDisplayAreas = (areas) => {
            $svg.off('mousedown');   // 移除繪圖相關的滑鼠事件
            $svg.off('mousemove');
            $svg.find('rect.bg').attr('opacity', 0.04);  // 顯示淺色背景遮罩
            $positionTable.closest('table').hide();      // 隱藏位置表格
            $actionTable.closest('table').show();        // 顯示動作表格
            $('.ry-create-menu').hide();                 // 預設隱藏建立選單按鈕

            $actionTable.empty();  // 清空動作表格
            $gTexts.empty();       // 清空區域編號標記

            // 綁定動作類型變更事件：顯示對應的設定欄位
            $actionTable.on('change', '.action-type', function () {
                $(this).closest('tr').find('.action-info').hide();
                $(this).closest('tr').find('.action-info-' + $(this).val()).show();
            });

            let showAction = false;  // 是否有任何區域設定了動作
            // 遍歷所有區域，建立視覺化元素和動作設定表單
            for (const idx in areas) {
                const area = areas[idx];

                // 在區域中心加入編號標記
                addText((area.bounds.x + area.bounds.width / 2) * $svg.data('ratio'), (area.bounds.y + area.bounds.height / 2) * $svg.data('ratio'), idx);

                // 繪製區域邊框
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

                // 新增動作設定表單行
                $actionTable.append(actionTemplate({
                    idx: idx,
                    areaStart: `( ${area.bounds.x}, ${area.bounds.y} )`,
                    areaSize: `${area.bounds.width} x ${area.bounds.height}`
                }));
                const $tr = $actionTable.find('tr').last();
                $tr.find('.action-type').val(area.action.type).trigger('change');
                // 根據動作類型填入對應的設定值
                switch (area.action.type) {
                    case 'uri':  // 開啟網址
                        $tr.find(`#action-info-${idx}-uri`).val(area.action.uri);
                        $tr.find(`#action-info-${idx}-label`).val(area.action.label);
                        showAction = true;
                        break;
                    case 'message':  // 發送訊息
                        $tr.find(`#action-info-${idx}-text`).val(area.action.text);
                        $tr.find(`#action-info-${idx}-label`).val(area.action.label);
                        showAction = true;
                        break;
                    case 'selfmessage':  // 自訂訊息
                        $tr.find(`#action-info-${idx}-message`).val(area.action.message);
                        $tr.find(`#action-info-${idx}-label`).val(area.action.label);
                        showAction = true;
                        break;
                    case 'richmenuswitch':  // 切換選單
                        $tr.find(`#action-info-${idx}-richMenuAliasId`).val(area.action.richMenuAliasId);
                        showAction = true;
                        break;
                    case 'accountlink':  // 帳號連結
                        $tr.find(`#action-info-${idx}-text`).val(area.action.displayText);
                        $tr.find(`#action-info-${idx}-label`).val(area.action.label);
                        showAction = true;
                        break;
                }
            }
            // 如果有任何區域設定了動作，顯示建立選單按鈕
            if (showAction) {
                $('.ry-create-menu').show();
            }
        }

        /**
         * 顯示區域劃分表格
         * 根據目前的分割線計算所有有效區域，並顯示在表格中
         */
        const showAreasTable = () => {
            const svgWidth = parseFloat($svg.attr('width'));
            const svgHeight = parseFloat($svg.attr('height'));

            // 收集所有永久線條的座標
            const lines = [];
            $gLines.find('line.permanent-line').each(function () {
                lines.push({
                    x1: parseFloat($(this).attr('x1')),
                    y1: parseFloat($(this).attr('y1')),
                    x2: parseFloat($(this).attr('x2')),
                    y2: parseFloat($(this).attr('y2'))
                });
            });

            // 建立座標集合（包含邊界和所有線條的座標）
            const xCoords = new Set([0, svgWidth]);
            const yCoords = new Set([0, svgHeight]);
            lines.forEach(line => {
                xCoords.add(line.x1);
                xCoords.add(line.x2);
                yCoords.add(line.y1);
                yCoords.add(line.y2);
            });

            // 將座標排序，用於尋找所有可能的矩形區域
            const sortedX = Array.from(xCoords).sort((a, b) => a - b);
            const sortedY = Array.from(yCoords).sort((a, b) => a - b);

            // 嘗試找出所有完全封閉的矩形區域
            const areas = {};
            for (let y1 = 0; y1 < sortedY.length - 1; y1++) {
                for (let y2 = y1 + 1; y2 < sortedY.length; y2++) {
                    for (let x1 = 0; x1 < sortedX.length - 1; x1++) {
                        for (let x2 = x1 + 1; x2 < sortedX.length; x2++) {
                            let left = sortedX[x1];
                            let right = sortedX[x2];
                            let top = sortedY[y1];
                            let bottom = sortedY[y2];

                            // 避免重複處理相同的區域
                            if (areas[`${left}, ${top}`] !== undefined) {
                                continue;
                            }

                            // 檢查這個矩形是否被線條完全包圍
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

            // 更新表格：顯示所有找到的區域
            $positionTable.empty();
            $gTexts.empty();
            Object.values(areas).forEach((area, idx) => {
                // 在區域中心加入編號標記
                addText((area.left + area.right) / 2, (area.top + area.bottom) / 2, idx);

                // 計算原始圖片尺寸的座標（反向縮放）
                const left = Math.floor(area.left / $svg.data('ratio'));
                const top = Math.floor(area.top / $svg.data('ratio'));
                const right = Math.floor(area.right / $svg.data('ratio'));
                const bottom = Math.floor(area.bottom / $svg.data('ratio'));
                // 計算在手機上顯示的尺寸（以 360px 寬度為基準）
                const phoneRatio = parseFloat($svg.attr('width')) / $svg.data('ratio') / 360;
                let phoneWidth = Math.round((right - left) / phoneRatio);
                let phoneHeight = Math.round((bottom - top) / phoneRatio);
                // 檢查尺寸是否符合 LINE 的最小要求（30px）
                if (phoneWidth < 30) {
                    phoneWidth = `<strong class="file-error">${phoneWidth}</strong>`;
                }
                if (phoneHeight < 30) {
                    phoneHeight = `<strong class="file-error">${phoneHeight}</strong>`;
                }

                // 新增表格行，顯示區域資訊
                $positionTable.append(areaTemplate({
                    idx: idx,
                    value: `${left ? left + 1 : 0}-${top ? top + 1 : 0}-${right - left}-${bottom - top}`,
                    phoneSize: `${phoneWidth} x ${phoneHeight}`,
                    areaStart: `( ${left ? left + 1 : 0} , ${top ? top + 1 : 0} )`,
                    areaSize: `${right - left} x ${bottom - top}`
                }));
            });
        }

        /**
         * 自動刪除無效的線條
         * 檢查所有線條，移除起點或終點不在有效位置的線條
         * 會遞迴執行直到沒有線條被刪除為止
         */
        const autoDeleteLine = () => {
            let removeLine = [];
            // 檢查每條線的起點和終點是否有效
            $gLines.find('line.permanent-line').each(function () {
                let $line = $(this);
                $line.addClass(['pre-delete'])
                    .removeClass(['permanent-line']);
                if (isValidStartPoint($line.attr('x1'), $line.attr('y1')) && isValidStartPoint($line.attr('x2'), $line.attr('y2'))) {
                    // 線條有效，恢復狀態
                    $line.addClass(['permanent-line'])
                        .removeClass(['pre-delete']);
                } else {
                    // 線條無效，加入待刪除清單
                    removeLine.push($line);
                }
            });
            if (removeLine.length) {
                // 刪除所有無效線條
                while (removeLine.length) {
                    removeLine.pop().remove();
                }
                autoDeleteLine();  // 遞迴檢查，因為刪除線條可能導致其他線條變無效
            } else {
                showAreasTable();  // 所有線條都有效，更新表格
            }
        };

        /**
         * 在 SVG 上加入文字標記（用於顯示區域編號）
         * @param {number} x - 文字中心的 X 座標
         * @param {number} y - 文字中心的 Y 座標
         * @param {string|number} content - 要顯示的內容
         */
        const addText = (x, y, content) => {
            // 建立圓形背景
            const circle = $(document.createElementNS('http://www.w3.org/2000/svg', 'circle'));
            circle.attr({
                cx: x,
                cy: y,
                fill: '#000',
                opacity: '0.075'
            });
            $gTexts.append(circle);

            // 建立文字元素
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
            // 根據文字大小調整背景圓形的半徑
            circle.attr({
                r: Math.floor(Math.max(text[0].getBBox().width, text[0].getBBox().height) / 2)
            });
        }

        /**
         * 取得滑鼠在 SVG 座標系統中的位置
         * @param {Event} event - 滑鼠事件物件
         * @returns {Object} 包含 x 和 y 座標的物件
         */
        const getMousePoint = (event) => {
            const rect = $svg[0].getBoundingClientRect();
            const svgWidth = parseFloat($svg.attr('width'));
            const svgHeight = parseFloat($svg.attr('height'));

            // 將瀏覽器座標轉換為 SVG 座標
            return {
                x: ((event.clientX - rect.left) / rect.width) * svgWidth,
                y: ((event.clientY - rect.top) / rect.height) * svgHeight
            };
        }

        /**
         * 將滑鼠位置吸附到最近的邊緣或線條
         * 提供磁吸效果，讓繪圖更精確
         * @param {Event} event - 滑鼠事件物件
         * @returns {Object} 調整後的座標，包含 x 和 y
         */
        const snapToEdgeOrLine = (event) => {
            const svgWidth = parseFloat($svg.attr('width'));
            const svgHeight = parseFloat($svg.attr('height'));
            const tolerance = 20;  // 吸附容許範圍（像素）
            let { x, y } = getMousePoint(event);

            // 吸附到 SVG 邊緣
            if (x <= tolerance) x = 0;
            if (x >= svgWidth - tolerance) x = svgWidth;
            if (y <= tolerance) y = 0;
            if (y >= svgHeight - tolerance) y = svgHeight;

            // 吸附到現有的永久線條
            $gLines.find('line.permanent-line').each(function () {
                const line = {
                    x1: parseFloat($(this).attr('x1')),
                    y1: parseFloat($(this).attr('y1')),
                    x2: parseFloat($(this).attr('x2')),
                    y2: parseFloat($(this).attr('y2'))
                };
                if (isPointOnLine(x, y, line, tolerance)) {
                    if (Math.abs(line.y1 - line.y2) < 1) {
                        y = line.y1;  // 吸附到水平線
                    } else if (Math.abs(line.x1 - line.x2) < 1) {
                        x = line.x1;  // 吸附到垂直線
                    }
                }
            });

            return { x, y };
        }

        /**
         * 檢查點是否為有效的起點或終點
         * 有效點必須在 SVG 邊緣或現有線條上
         * @param {number} x - X 座標
         * @param {number} y - Y 座標
         * @returns {boolean} 是否為有效點
         */
        const isValidStartPoint = (x, y) => {
            const svgWidth = parseFloat($svg.attr('width'));
            const svgHeight = parseFloat($svg.attr('height'));
            const tolerance = 0.1;  // 判定容許誤差

            x = parseFloat(x);
            y = parseFloat(y);

            // 檢查是否在 SVG 邊緣
            if (x <= tolerance || x >= svgWidth - tolerance ||
                y <= tolerance || y >= svgHeight - tolerance) {
                return true;
            }

            // 檢查是否在現有線條上
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

        /**
         * 檢查點是否在線條上
         * @param {number} x - 點的 X 座標
         * @param {number} y - 點的 Y 座標
         * @param {Object} line - 線條物件，包含 x1, y1, x2, y2
         * @param {number} tolerance - 容許誤差
         * @returns {boolean} 點是否在線條上
         */
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

        /**
         * 檢查矩形區域是否被線條完全包圍
         * @param {number} left - 區域左邊界
         * @param {number} top - 區域上邊界
         * @param {number} right - 區域右邊界
         * @param {number} bottom - 區域下邊界
         * @param {Array} lines - 線條陣列
         * @returns {boolean} 區域是否完全封閉
         */
        const isAreaFullyEnclosed = (left, top, right, bottom, lines) => {
            const tolerance = 0.1;

            // 檢查四個邊是否都存在對應的線條或 SVG 邊界
            const hasTopEdge = hasLineSegment(left, top, right, top, lines, tolerance);
            const hasRightEdge = hasLineSegment(right, top, right, bottom, lines, tolerance);
            const hasBottomEdge = hasLineSegment(left, bottom, right, bottom, lines, tolerance);
            const hasLeftEdge = hasLineSegment(left, top, left, bottom, lines, tolerance);

            return hasTopEdge && hasRightEdge && hasBottomEdge && hasLeftEdge;
        }

        /**
         * 檢查線段是否存在（可能是 SVG 邊界或繪製的線條）
         * @param {number} x1 - 線段起點 X 座標
         * @param {number} y1 - 線段起點 Y 座標
         * @param {number} x2 - 線段終點 X 座標
         * @param {number} y2 - 線段終點 Y 座標
         * @param {Array} lines - 線條陣列
         * @param {number} tolerance - 容許誤差
         * @returns {boolean} 線段是否存在
         */
        const hasLineSegment = (x1, y1, x2, y2, lines, tolerance) => {
            const svgWidth = parseFloat($svg.attr('width'));
            const svgHeight = parseFloat($svg.attr('height'));

            // 檢查是否為 SVG 邊界
            if ((Math.abs(y1) <= tolerance && Math.abs(y2) <= tolerance) ||
                (Math.abs(x1) <= tolerance && Math.abs(x2) <= tolerance) ||
                (Math.abs(y1 - svgHeight) <= tolerance && Math.abs(y2 - svgHeight) <= tolerance) ||
                (Math.abs(x1 - svgWidth) <= tolerance && Math.abs(x2 - svgWidth) <= tolerance)) {
                return true;
            }

            // 檢查是否有線條覆蓋此線段
            for (const line of lines) {
                if (isLineSegmentCovered(x1, y1, x2, y2, line, tolerance)) {
                    return true;
                }
            }

            return false;
        }

        /**
         * 檢查線段是否被某條線完全覆蓋
         * @param {number} x1 - 線段起點 X 座標
         * @param {number} y1 - 線段起點 Y 座標
         * @param {number} x2 - 線段終點 X 座標
         * @param {number} y2 - 線段終點 Y 座標
         * @param {Object} line - 線條物件
         * @param {number} tolerance - 容許誤差
         * @returns {boolean} 線段是否被覆蓋
         */
        const isLineSegmentCovered = (x1, y1, x2, y2, line, tolerance) => {
            const { x1: lx1, y1: ly1, x2: lx2, y2: ly2 } = line;

            // 檢查水平線段
            if (Math.abs(y1 - y2) < tolerance && Math.abs(ly1 - ly2) < tolerance) {
                if (Math.abs(y1 - ly1) <= tolerance) {
                    const edgeStart = Math.min(x1, x2);
                    const edgeEnd = Math.max(x1, x2);
                    const lineStart = Math.min(lx1, lx2);
                    const lineEnd = Math.max(lx1, lx2);

                    return lineStart <= edgeStart + tolerance && lineEnd >= edgeEnd - tolerance;
                }
            }
            // 檢查垂直線段
            else if (Math.abs(x1 - x2) < tolerance && Math.abs(lx1 - lx2) < tolerance) {
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

        // 重置區域按鈕：清除所有線條並重新進入繪圖模式
        $('.ry-reset-areas').on('click', function () {
            $gLines.empty();
            initLineDrawing();
        });

        // 儲存區域位置按鈕：將區域資料傳送到伺服器
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
                        // 儲存成功，切換到動作設定模式
                        initDisplayAreas(Jdata.data);
                        return;
                    }
                }
                // 儲存失敗或無資料，返回繪圖模式
                initLineDrawing();
            }).always(function () {
                $btn.parent().find('span.spinner').removeClass('is-active').remove();
            });
        });

        // 儲存區域動作按鈕：將動作設定傳送到伺服器
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
                        // 儲存成功，重新載入動作設定
                        initDisplayAreas(Jdata.data);
                        return;
                    }
                }
                // 儲存失敗，返回繪圖模式
                initLineDrawing();
            }).always(function () {
                $btn.parent().find('span.spinner').removeClass('is-active').remove();
            });
        });
    }

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
        }).done(function (Jdata) {
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
        }).done(function (Jdata) {
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
        }).done(function (Jdata) {
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
        }).done(function (Jdata) {
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
        }).done(function (Jdata) {
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
        }).done(function (Jdata) {
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
            $targetInput.val(currentValue.slice(0, cursorPosition) + templateCode + currentValue.slice(cursorPosition));

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
        $string.on('click', function (e) {
            const $btn = $(this);
            const position = $btn.position();
            const elementHeight = $btn.outerHeight();
            $targetInput = $($btn.data('target'));
            if ($targetInput.length == 0) {
                return;
            }

            // 設定對話框初始位置（按鈕右側）
            $dialog.css({
                left: position.left + $btn.outerWidth() + 20 + 'px',
                top: position.top + 'px',
                visibility: 'visible'
            });

            // 如果對話框超出視窗右側，改顯示在按鈕左側
            const dialogRight = $dialog.position().left + $dialog.outerWidth();
            const windowWidth = $(window).width();
            if (dialogRight > windowWidth - 20) {
                $dialog.css({
                    left: position.left - $dialog.outerWidth() - 20 + 'px'
                });
            }

            // 如果對話框超出視窗底部，調整垂直位置
            const dialogBottom = $dialog.position().top + $dialog.outerHeight();
            const windowHeight = $(window).height();

            if (dialogBottom > windowHeight - 20) {
                $dialog.css({
                    top: Math.max(20, position.top - $dialog.outerHeight() + elementHeight) + 'px'
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
