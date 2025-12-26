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
     * RY LINE Flex Message 設定物件
     */
    const ryLineFlex: {
        nonce: {
            get: string;
        };
    };

    /**
     * Flex2HTML 函式
     * 將 Flex Message JSON 轉換為 HTML 預覽
     */
    function flex2html(containerId: string, flexData: any): void;

    /**
     * jQuery wpColorPicker 擴展方法
     */
    interface JQuery {
        wpColorPicker(options?: any): JQuery;
        select2(options?: any): JQuery;
    }
}

export { };
