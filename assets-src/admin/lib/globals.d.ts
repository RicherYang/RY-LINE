/**
 * 全域變數聲明
 * 這些變數在其他地方定義，這裡僅進行類型聲明
 */

/**
 * WordPress 全域物件
 */
declare global {

    /**
     * WordPress AJAX URL
     */
    const ajaxurl: string;

    /**
     * WordPress 範本函式
     */
    const wp: {
        template: (id: string) => (data: any) => string;
    };

    /**
     * RY LINE 設定物件
     */
    const RYLine: {
        nonce: {
            get: string;
        };
    };

    const RYLineMetabox: {
        templateString: {
            name: string;
            strings: {
                code: string;
                name: string;
            }[]
        }[],
        nonce: {
            'get': string,
            'position': string,
            'actions': string,
            'testsend': string,
            'create': string,
            'default': string,
            'delete': string,
            'alias': string,
            'test': string,
        };
    }
}

export { };
