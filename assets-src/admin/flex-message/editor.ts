import $ from 'jquery';
import { __ } from '@wordpress/i18n';
import './globals.d.ts';
import type {
    NodeData,
    NodeInfo,
    NodeShowInfo,
    PropertyDefinition,
    Templates,
    FlexNodeType
} from './types.ts';
import {
    DEFAULT_FLEX_MESSAGE,
    TYPE_ICONS,
    ADD_CHILD_TYPES,
    TYPE_PROPERTIES
} from './constants.ts';

/**
 * Flex Message 編輯器類別
 * 用於建立和管理 LINE Flex Message 的視覺化編輯介面
 */
export class FlexEditor {
    public currentNodeId: string | null = null;
    private nodeIdCounter: number = 1;
    private template: Templates;

    /**
     * 建構函式
     * 初始化編輯器實例並設定必要的屬性
     */
    constructor() {
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
        };

        this.init();
    }

    /**
     * 初始化編輯器
     * 載入既有內容或使用預設模板，並渲染樹狀結構
     */
    private init(): void {
        const existingContent = $('#flex-message-content').val() as string;
        let jsonData: any;

        if (existingContent) {
            try {
                jsonData = JSON.parse(existingContent);
            } catch (e) {
                jsonData = DEFAULT_FLEX_MESSAGE;
            }
        } else {
            jsonData = DEFAULT_FLEX_MESSAGE;
        }

        this.renderTree(jsonData);
        this.updateNodeToggle();
        this.updateJsonOutput();
    }

    /**
     * 渲染樹狀結構
     * @param jsonData - Flex Message JSON 資料
     */
    private renderTree(jsonData: any): void {
        this.nodeIdCounter = 1;

        const $tree = $('#flex-message-tree');
        $tree.empty();
        $tree.append(this.createTreeNode(jsonData, null, 'bubble'));
    }

    /**
     * 建立樹狀節點
     * @param data - 節點資料
     * @param parentId - 父節點 ID
     * @param forceType - 強制指定節點類型
     * @returns 節點的 jQuery 物件
     */
    private createTreeNode(data: NodeData, parentId: string | null, forceType: FlexNodeType | null = null): JQuery {
        const nodeId = `node-${this.nodeIdCounter++}`;
        const nodeType = (forceType || data.type) as FlexNodeType;

        const showInfo = this.getNodeShowInfo(nodeType, data);
        const $node = $(this.template.treeNode({
            id: nodeId,
            type: nodeType,
            icon: showInfo.icon,
            label: showInfo.label,
        }));

        // 建立節點資料並儲存到 data 屬性中
        const nodeData: NodeInfo = {
            data: data,
            parentId: parentId,
            type: nodeType
        };
        $node.attr('data-node-info', JSON.stringify(nodeData));

        const $children = $node.find('.flex-tree-node-children');

        // 根據節點類型建立子節點
        switch (nodeType) {
            case 'bubble':
                (['header', 'hero', 'body', 'footer'] as FlexNodeType[]).forEach(blockType => {
                    $children.append(this.createTreeNode(data[blockType] || {}, nodeId, blockType));
                });
                break;
            case 'header':
            case 'hero':
            case 'body':
            case 'footer':
                if (Object.keys(data).length > 0) {
                    $children.append(this.createTreeNode(data, nodeId, null));
                }
                break;
            case 'box':
                if (data.contents) {
                    data.contents.forEach((child: NodeData) => {
                        $children.append(this.createTreeNode(child, nodeId, null));
                    });
                }
                break;
            case 'text':
                if (data.contents) {
                    data.contents.forEach((child: NodeData) => {
                        $children.append(this.createTreeNode(child, nodeId, null));
                    });
                }
                break;
        }

        return $node;
    }

    /**
     * 取得節點顯示資訊（圖示和標籤）
     * @param type - 節點類型
     * @param data - 節點資料
     * @returns 包含 icon 和 label 的物件
     */
    private getNodeShowInfo(type: FlexNodeType, data: NodeData): NodeShowInfo {
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
            icon: TYPE_ICONS[type] || '',
            label: label
        };
    }

    /**
     * 選擇指定節點
     * @param nodeId - 節點 ID
     */
    public selectNode(nodeId: string): void {
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
     * @param nodeInfo - 節點資訊
     * @returns 可新增的子節點類型陣列
     */
    public getAddableChildTypes(nodeInfo: NodeInfo): FlexNodeType[] {
        if (nodeInfo.type === 'box') {
            const boxTypes = ADD_CHILD_TYPES['box'];
            if (boxTypes && typeof boxTypes === 'object' && !Array.isArray(boxTypes)) {
                return boxTypes[nodeInfo.data.layout] || [];
            }
            return [];
        }
        const childTypes = ADD_CHILD_TYPES[nodeInfo.type];
        if (Array.isArray(childTypes)) {
            return childTypes;
        }
        return [];
    }

    /**
     * 更新工具列按鈕的啟用/停用狀態
     */
    public updateButtonStates(): void {
        const $node = $(`.flex-tree-node[data-node-id="${this.currentNodeId}"]`);
        const nodeInfo = $node.data('node-info') as NodeInfo;
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
    public renderPropertyEditor(): void {
        const $node = $(`.flex-tree-node[data-node-id="${this.currentNodeId}"]`);
        const nodeInfo = $node.data('node-info') as NodeInfo;
        if (!nodeInfo) return;

        const { data, type } = nodeInfo;
        const properties = this.getNodeProperties(type, data);

        $('#flex-node-property').html(this.template.propertyEditor({ type: type }));
        const $fields = $('#flex-node-property .flex-property-fields');

        // 依序建立各個屬性欄位
        properties?.forEach(prop => {
            const templateKey = `property${prop.type.charAt(0).toUpperCase()}${prop.type.slice(1)}` as keyof Templates;
            if (this.template[templateKey] !== undefined) {
                prop.id = `${this.currentNodeId}-property-${prop.name}`;
                $fields.append(this.template[templateKey](prop));

                switch (prop.type) {
                    case 'color':
                        $(`#${prop.id}`).wpColorPicker({
                            change: () => {
                                setTimeout(() => {
                                    this.updateNodeProperty($(`#${prop.id}`));
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
     * @param $actionSelect - action 下拉選單的 jQuery 物件
     */
    public renderActionPropertyEditor($actionSelect: JQuery): void {
        const $node = $(`.flex-tree-node[data-node-id="${this.currentNodeId}"]`);
        const nodeInfo = $node.data('node-info') as NodeInfo;
        if (!nodeInfo) return;

        const actionType = $actionSelect.val() as string;

        // 移除之前動態產生的 action 屬性欄位
        $actionSelect.closest('.flex-property-field').nextAll('.flex-property-field').remove();

        if (!actionType || actionType === '') {
            return;
        }

        const properties = this.getNodeProperties(actionType as any, nodeInfo.data.action);
        const $fields = $('#flex-node-property .flex-property-fields');

        // 新增 action 相關的屬性欄位
        properties?.forEach(prop => {
            const templateKey = `property${prop.type.charAt(0).toUpperCase()}${prop.type.slice(1)}` as keyof Templates;
            if (this.template[templateKey] !== undefined) {
                prop.id = `${this.currentNodeId}-property-${prop.name}`;
                $fields.append(this.template[templateKey](prop));
            }
        });
    }

    /**
     * 取得節點的屬性列表
     * @param type - 節點類型
     * @param data - 節點資料
     * @returns 屬性物件陣列(包含屬性名稱)
     */
    public getNodeProperties(type: string, data: NodeData): (PropertyDefinition & { name: string })[] | undefined {
        const propertiesObj = TYPE_PROPERTIES[type as keyof typeof TYPE_PROPERTIES];
        if (propertiesObj === undefined) {
            return;
        }

        // 將物件轉換為陣列，並填入目前的值，同時保留屬性的鍵名
        const properties = Object.entries(propertiesObj).map(([key, prop]) => {
            const property = { ...prop, name: key };

            if (data[key] !== undefined) {
                if (key === 'action') {
                    property.value = data[key].type;
                } else {
                    property.value = data[key];
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
     * @param $input - 變更的輸入欄位 jQuery 物件
     */
    public async updateNodeProperty($input: JQuery): Promise<void> {
        const $node = $(`.flex-tree-node[data-node-id="${this.currentNodeId}"]`);
        const nodeInfo = $node.data('node-info') as NodeInfo;
        if (!nodeInfo) return;

        const { data } = nodeInfo;
        const propName = $input.data('property') as string;
        let propValue: any;

        // 根據欄位類型處理值
        if ($input.attr('type') === 'number') {
            propValue = parseFloat($input.val() as string);
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
                const actionPropertiesObj = TYPE_PROPERTIES[propValue.type as keyof typeof TYPE_PROPERTIES];
                if (actionPropertiesObj) {
                    Object.entries(actionPropertiesObj).forEach(([propKey, propDef]) => {
                        const typeValue = $(`[data-property="${propKey}"]`).val();
                        if (typeValue === undefined) {
                            if (data.action !== undefined && data.action[propKey] !== undefined) {
                                propValue[propKey] = data.action[propKey];
                            }
                        } else if (typeValue !== null && typeValue !== '') {
                            propValue[propKey] = typeValue;
                        }
                    });
                }
                data.action = { ...propValue };
            }
            data[propName] = propValue;
        }

        // 更新節點的資料屬性
        $node.data('node-info', nodeInfo);
        if (propName !== 'action') {
            $('[data-property="action"]').trigger('change');
        }

        // 執行節點屬性驗證（異步）
        await this.verifyNodeProperties(nodeInfo);

        // 更新節點的資料屬性
        $node.data('node-info', nodeInfo);

        // 顯示屬性錯誤訊息
        this.displayPropertyErrors(propName, nodeInfo.propertyErrors);

        // 更新樹狀結構顯示的標籤文字
        this.updateTreeNodeLabel(this.currentNodeId!);
        // 更新 JSON 輸出
        this.updateJsonOutput();
    }

    /**
     * 驗證節點的所有屬性
     * @param nodeInfo - 節點資訊
     */
    private async verifyNodeProperties(nodeInfo: NodeInfo): Promise<void> {
        const { data, type } = nodeInfo;
        const properties = TYPE_PROPERTIES[type];

        // 清空錯誤訊息
        nodeInfo.propertyErrors = {};

        if (!properties) {
            return;
        }

        // 檢查所有屬性
        for (const [propName, propDef] of Object.entries(properties)) {
            const propValue = data[propName];

            // 如果屬性有驗證類型，執行驗證
            if (propDef.verifyType) {
                const error = await this.verifyPropertyValue(propDef.verifyType, propValue);
                if (error !== '') {
                    nodeInfo.propertyErrors[propName] = error;
                }
            }
        }
    }

    /**
     * 顯示屬性錯誤訊息
     * @param currentProp - 當前變更的屬性名稱
     * @param propertyErrors - 所有屬性的錯誤訊息
     */
    private displayPropertyErrors(currentProp: string, propertyErrors?: Record<string, string>): void {
        // 先移除所有錯誤訊息
        $('.flex-property-fields .verify-info').hide();
        $('.flex-property-fields .invalid').removeClass(['invalid']);

        // 如果沒有錯誤，直接返回
        if (!propertyErrors || Object.keys(propertyErrors).length === 0) {
            return;
        }

        // 為每個有錯誤的屬性顯示錯誤訊息
        Object.entries(propertyErrors).forEach(([propName, errorMsg]) => {
            const $field = $(`.flex-property-field.field-${propName}`);
            if ($field.length > 0) {
                $field.addClass(['invalid']);
                $field.find('.verify-info').text(errorMsg).show();
            }
        });
    }

    /**
     * 驗證屬性值
     * @param verifyType - 驗證類型陣列
     * @param value - 屬性值
     * @returns 錯誤訊息字串，若無錯誤則回傳空字串
     */
    private async verifyPropertyValue(verifyType: string[], value: any): Promise<string> {
        // 依序執行驗證，只要有錯誤就停止後續驗證
        for (const type of verifyType) {
            let error: string;

            switch (type) {
                case 'required':
                    if (value === undefined || value === null || value === '') {
                        error = __('Value is required', 'ry-line');
                    }
                    break;
                case 'url':
                    error = this.verifyUrl(value);
                    break;
                case 'image':
                    error = await this.verifyImageUrl(value);
                    break;
                case 'color':
                    error = this.verifyColor(value, false);
                    break;
                case 'color_alpha':
                    error = this.verifyColor(value, true);
                    break;
                default:
                    error = '';
            }

            // 如果驗證失敗，立即返回錯誤，不再執行後續驗證
            if (error !== '') {
                return error;
            }
        }

        return '';
    }

    /**
     * 驗證 URL
     * 檢查：HTTPS 協議
     * @param value - URL
     * @returns 錯誤訊息字串，若無錯誤則回傳空字串
     */
    private verifyUrl(value: any): string {
        if (!value || typeof value !== 'string') {
            return '';
        }

        try {
            // 驗證 URL 格式和 HTTPS 協議
            const url = new URL(value);
            if (url.protocol !== 'https:') {
                return __('Only HTTPS protocol is allowed', 'ry-line');
            }
        } catch (error) {
            return __('Invalid URL', 'ry-line');
        }

        return '';
    }

    /**
     * 驗證圖片 URL
     * 檢查：HTTPS 協議
     * @param value - 圖片 URL
     * @returns 錯誤訊息字串，若無錯誤則回傳空字串
     */
    private async verifyImageUrl(value: any): Promise<string> {
        if (!value || typeof value !== 'string') {
            return '';
        }

        return await new Promise<string>((resolve) => {
            const img = new Image();
            const timeout = setTimeout(() => {
                img.src = '';
                resolve(__('Unable to load image', 'ry-line'));
            }, 5000);

            img.onload = () => {
                clearTimeout(timeout);
                resolve('');
            };

            img.onerror = () => {
                clearTimeout(timeout);
                resolve(__('Unable to load image', 'ry-line'));
            };
            img.src = value;
        });
    }

    private verifyColor(value: any, allowAlpha: boolean): string {
        if (!value || typeof value !== 'string') {
            return '';
        }

        const hexColorRegex = allowAlpha ? /^#([0-9A-Fa-f]{2}){3,4}$/ : /^#([0-9A-Fa-f]{2}){3}$/;
        if (!hexColorRegex.test(value)) {
            return __('Invalid color', 'ry-line');
        }
        return '';
    }

    /**
     * 更新樹狀節點的標籤文字
     * @param nodeId - 節點 ID
     */
    private updateTreeNodeLabel(nodeId: string): void {
        const $node = $(`.flex-tree-node[data-node-id="${nodeId}"]`);
        const nodeInfo = $node.data('node-info') as NodeInfo;
        if (!nodeInfo) return;

        const { data, type, propertyErrors } = nodeInfo;
        const showInfo = this.getNodeShowInfo(type, data);

        const $label = $node.find('.flex-tree-node-label:nth(0)');

        if (showInfo.label) {
            $label.text(showInfo.label);
        } else {
            $label.text('');
        }

        // 根據驗證狀態更新 CSS class
        const $header = $node.find('.flex-tree-node-header:first');
        if (propertyErrors && Object.keys(propertyErrors).length > 0) {
            $header.addClass('invalid');
        } else {
            $header.removeClass('invalid');
        }
    }

    /**
     * 顯示新增節點選單
     * 根據目前節點類型，顯示可新增的子節點類型選單
     */
    public showAddNodeMenu(): void {
        const $node = $(`.flex-tree-node[data-node-id="${this.currentNodeId}"]`);
        const nodeInfo = $node.data('node-info') as NodeInfo;
        if (!nodeInfo) return;

        const allowedTypes = this.getAddableChildTypes(nodeInfo);

        // 如果沒有可新增的類型，直接返回
        if (allowedTypes.length === 0) {
            return;
        }

        // 移除舊的選單
        $('.flex-add-node-menu').remove();

        // 準備選單項目資料
        const types = allowedTypes.map(type => ({
            type: type,
            icon: TYPE_ICONS[type] || '',
        }));

        const $menu = $(this.template.addNode({ types: types }));

        // 定位選單在新增按鈕下方
        $menu.css({
            position: 'absolute',
            top: $('#node-create').offset()!.top + $('#node-create').outerHeight()!,
            left: $('#node-create').offset()!.left,
            zIndex: 1000
        });
        $('body').append($menu);

        // 點擊選單項目時新增對應類型的節點
        $menu.on('click', '.flex-node-menu-item', (e: JQuery.ClickEvent) => {
            e.stopPropagation();
            this.addNode($(e.currentTarget).data('node-type'));
            $menu.remove();
            $(document).off('click.flexMenu');
        });

        // 延遲註冊文件點擊事件，以避免立即觸發關閉
        setTimeout(() => {
            $(document).on('click.flexMenu', (e: JQuery.ClickEvent) => {
                if (!$(e.target).closest('.flex-add-node-menu').length) {
                    $menu.remove();
                    $(document).off('click.flexMenu');
                }
            });
        }, 100);
    }

    /**
     * 新增節點
     * @param nodeType - 要新增的節點類型
     */
    public addNode(nodeType: FlexNodeType): void {
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
     * @param nodeType - 節點類型
     * @returns 節點資料物件
     */
    private createNodeData(nodeType: FlexNodeType): NodeData {
        const data: NodeData = { type: nodeType };

        // 填入必填屬性的預設值
        const propertiesObj = TYPE_PROPERTIES[nodeType];
        if (propertiesObj) {
            Object.entries(propertiesObj).forEach(([propKey, propDef]) => {
                if (propDef.required === true) {
                    data[propKey] = propDef.default;
                }
            });
        }

        return data;
    }

    /**
     * 將節點向上移動
     * 與前一個兄弟節點交換位置
     */
    public moveNodeUp(): void {
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
    public moveNodeDown(): void {
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
    public deleteNode(): void {
        const $node = $(`.flex-tree-node[data-node-id="${this.currentNodeId}"]`);
        const nodeInfo = $node.data('node-info') as NodeInfo;
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
    public updateNodeToggle(): void {
        $('.flex-tree-node').each(function (this: HTMLElement) {
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
    public updateJsonOutput(): void {
        const jsonData = this.cleanJsonData(this.getJsonData());
        flex2html('flex-message-preview', jsonData);
        $('#flex-message-content').val(JSON.stringify(jsonData, null, 4)).trigger('input');
    }

    /**
     * 取得 JSON 資料
     * 從樹狀結構根節點開始轉換為 JSON 物件
     * @returns JSON 資料物件
     */
    private getJsonData(): any {
        const $treeNode = $('#flex-message-tree > .flex-tree-node');
        if ($treeNode.length === 0) return {};

        return this.nodeToJson($treeNode);
    }

    /**
     * 複製節點屬性到結果物件
     * @param data - 來源資料
     * @param result - 目標物件
     * @param type - 節點類型
     */
    private copyNodeProperties(data: NodeData, result: any, type: string): void {
        const propertiesObj = TYPE_PROPERTIES[type as keyof typeof TYPE_PROPERTIES];
        if (propertiesObj === undefined) {
            return;
        }

        Object.entries(propertiesObj).forEach(([propKey, propDef]) => {
            if (data[propKey] !== undefined && data[propKey] !== null) {
                if (propKey === 'action') {
                    result.action = data[propKey];
                    this.copyNodeProperties(data[propKey], result.action, data[propKey].type);
                } else {
                    if (propDef.type === 'color') {
                        const colorValue = data[propKey] as string;
                        if (colorValue.substring(0, 4) === 'rgb(') {
                            result[propKey] = '#' + colorValue.substring(4, colorValue.length - 1).split(',').map(num => {
                                return parseInt(num.trim()).toString(16).padStart(2, '0').toUpperCase();
                            }).join('');
                        } else if (colorValue.substring(0, 5) === 'rgba(') {
                            result[propKey] = '#' + colorValue.substring(5, colorValue.length - 1).split(',').map((num, idx) => {
                                return parseInt(String(parseFloat(num.trim()) * (idx === 3 ? 255 : 1))).toString(16).padStart(2, '0').toUpperCase();
                            }).join('');
                        } else {
                            result[propKey] = colorValue;
                        }
                    } else {
                        result[propKey] = data[propKey];
                    }
                }
            } else if (propDef.required === true) {
                result[propKey] = (propDef.default ?? '');
            }
        });
    }

    /**
     * 將節點轉換為 JSON 物件
     * 遞迴處理子節點
     * @param $treeNode - 節點的 jQuery 物件
     * @returns JSON 物件
     */
    private nodeToJson($treeNode: JQuery): any | null {
        const nodeInfo = $treeNode.data('node-info') as NodeInfo;
        if (!nodeInfo) return null;

        const { data, type } = nodeInfo;
        const result: any = {};
        this.copyNodeProperties(data, result, type);

        // 根據節點類型處理子內容
        switch (type) {
            case 'bubble':
                result.type = type;
                result.styles = {};

                const $children = $treeNode.find('> .flex-tree-node-children > .flex-tree-node');
                $children.each((index, child) => {
                    const $child = $(child);
                    const childInfo = $child.data('node-info') as NodeInfo;
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
                const $boxChildren = $treeNode.find('> .flex-tree-node-children > .flex-tree-node');
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
     * @param $blockNode - 區塊節點的 jQuery 物件
     * @returns 子節點的 JSON 物件
     */
    private getBlockContent($blockNode: JQuery): any | null {
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
     * @param data - 要清理的資料
     * @returns 清理後的資料
     */
    private cleanJsonData(data: any): any {
        if (Array.isArray(data)) {
            return data
                .map(item => this.cleanJsonData(item))
                .filter(item => {
                    if (Array.isArray(item) && item.length === 0) return false;
                    if (typeof item === 'object' && Object.keys(item).length === 0) return false;
                    return true;
                });
        } else if (typeof data === 'object' && data !== null) {
            const result: any = {};
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const value = data[key];
                    const cleanedValue = this.cleanJsonData(value);

                    if (Array.isArray(cleanedValue) && cleanedValue.length === 0) continue;
                    if (typeof cleanedValue === 'object' && cleanedValue !== null && Object.keys(cleanedValue).length === 0) continue;

                    result[key] = cleanedValue;
                }
            }
            return result;
        }

        if (typeof data === 'string') {
            return data.trim();
        }

        return data;
    }
}
