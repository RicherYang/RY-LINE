/**
 * Flex Message 節點類型
 */
export type FlexNodeType =
    | 'bubble'
    | 'header'
    | 'hero'
    | 'body'
    | 'footer'
    | 'box'
    | 'text'
    | 'button'
    | 'image'
    | 'icon'
    | 'separator'
    | 'span';

/**
 * Flex Action 類型
 */
export type FlexActionType =
    | 'postback'
    | 'uri'
    | 'message'
    | 'datetimepicker'
    | 'clipboard';

/**
 * 屬性欄位類型
 */
export type PropertyFieldType =
    | 'text'
    | 'textarea'
    | 'number'
    | 'color'
    | 'select'
    | 'selecttext';

/**
 * 屬性定義介面
 */
export interface PropertyDefinition {
    label: string;
    type: PropertyFieldType;
    verifyType?: string[];
    required?: boolean;
    default?: string | number | boolean;
    options?: string[] | Array<{ value: string; label: string }>;
    min?: number;
    max?: number;
    step?: number;
    description?: string;
    alpha?: boolean;
    value?: string | number | boolean;
    id?: string;
}

/**
 * 節點資料介面
 */
export interface NodeData {
    type: FlexNodeType | FlexActionType;
    [key: string]: any;
}

/**
 * 節點資訊介面
 */
export interface NodeInfo {
    data: NodeData;
    parentId: string | null;
    type: FlexNodeType;
    propertyErrors?: Record<string, string>;
}

/**
 * 節點顯示資訊介面
 */
export interface NodeShowInfo {
    icon: string;
    label: string;
}

/**
 * 預設 Flex Message 結構介面
 */
export interface DefaultFlexMessage {
    type: 'bubble';
    body: {
        type: 'box';
        layout: 'vertical';
        contents: Array<{
            type: 'text';
            text: string;
            size: string;
        }>;
    };
}

/**
 * 範本函式介面
 */
export interface TemplateFunction {
    (data: any): string;
}

/**
 * 範本集合介面
 */
export interface Templates {
    treeNode: TemplateFunction;
    addNode: TemplateFunction;
    propertyEditor: TemplateFunction;
    propertyText: TemplateFunction;
    propertyColor: TemplateFunction;
    propertyTextarea: TemplateFunction;
    propertyNumber: TemplateFunction;
    propertySelect: TemplateFunction;
    propertySelecttext: TemplateFunction;
}

/**
 * 屬性集合類型
 */
export type PropertyCollection = Record<string, PropertyDefinition>;

/**
 * 節點屬性映射類型
 */
export type NodePropertiesMap = Record<FlexNodeType | FlexActionType, PropertyCollection>;

/**
 * 子節點類型映射
 */
export type ChildTypeMap = {
    header?: FlexNodeType[];
    body?: FlexNodeType[];
    footer?: FlexNodeType[];
    hero?: FlexNodeType[];
    box?: Record<string, FlexNodeType[]>;
    text?: FlexNodeType[];
    [key: string]: FlexNodeType[] | Record<string, FlexNodeType[]> | undefined;
};
