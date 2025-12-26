<!-- 樹狀節點模板 -->
<script type="text/html" id="tmpl-flex-tree-node">
    <div class="flex-tree-node" data-node-id="{{ data.id }}" data-node-type="{{ data.type }}">
        <div class="flex-tree-node-header">
            <span class="flex-tree-node-toggle">
                <span class="dashicons dashicons-arrow-down-alt2"></span>
            </span>
            <span class="flex-tree-node-icon">{{ data.icon }}</span>
            <span class="flex-tree-node-type">{{ data.type }}</span>
            <span class="flex-tree-node-label">{{ data.label }}</span>
        </div>
        <div class="flex-tree-node-children"></div>
    </div>
</script>

<!-- 新增節點選單模板 -->
<script type="text/html" id="tmpl-flex-add-node">
    <div class="flex-add-node-menu">
        <# _.each(data.types, function(item) { #>
            <div class="flex-node-menu-item" data-node-type="{{ item.type }}">
                <span class="flex-tree-node-icon">{{ item.icon }}</span>
                <span class="flex-tree-node-type">{{ item.type }}</span>
            </div>
        <# }); #>
    </div>
</script>

<!-- 屬性編輯器模板 -->
<script type="text/html" id="tmpl-flex-property-editor">
    <div class="flex-property-editor">
        <div class="flex-property-header">
            <h3><?php esc_html_e('Node Properties', 'ry-line'); ?></h3>
            <span class="flex-property-type">[ {{ data.type }} ]</span>
        </div>
        <div class="flex-property-fields"></div>
    </div>
</script>

<!-- 屬性欄位模板 - 文字輸入 -->
<script type="text/html" id="tmpl-flex-property-text">
    <div class="flex-property-field property-text field-{{ data.name }}">
        <label>
            {{ data.label }}
            <# if (data.required) { #><span class="required">*</span><# } #>
        </label>
        <div class="flex-property-field-wrapper">
            <input type="text" id="{{ data.id }}" value="{{ data.value || '' }}" data-property="{{ data.name }}"
                <# if (data.required) { #> required <# } #> />
            <# if (data.description) { #>
                <p class="description">{{ data.description }}</p>
            <# } #>
            <p class="description verify-info"></p>
        </div>
    </div>
</script>

<!-- 屬性欄位模板 - 顏色輸入 -->
<script type="text/html" id="tmpl-flex-property-color">
    <div class="flex-property-field property-color field-{{ data.name }}">
        <label>
            {{ data.label }}
            <# if (data.required) { #><span class="required">*</span><# } #>
        </label>
        <div class="flex-property-field-wrapper">
            <input type="text" id="{{ data.id }}" value="{{ data.value || '' }}" data-property="{{ data.name }}" data-alpha-enabled="{{ data.alpha ? 'true' : 'false' }}" data-alpha-custom-width="90"
                <# if (data.required) { #> required <# } #> />
            <# if (data.description) { #>
                <p class="description">{{ data.description }}</p>
            <# } #>
            <p class="description verify-info"></p>
        </div>
    </div>
</script>

<!-- 屬性欄位模板 - 文字區域 -->
<script type="text/html" id="tmpl-flex-property-textarea">
    <div class="flex-property-field property-textarea field-{{ data.name }}">
        <label>
            {{ data.label }}
            <# if (data.required) { #><span class="required">*</span><# } #>
        </label>
        <div class="flex-property-field-wrapper">
            <textarea rows="1" id="{{ data.id }}" data-property="{{ data.name }}"
                <# if (data.required) { #>required<# } #> >{{ data.value || '' }}</textarea>
            <# if (data.description) { #>
                <p class="description">{{ data.description }}</p>
            <# } #>
            <p class="description verify-info"></p>
        </div>
    </div>
</script>

<!-- 屬性欄位模板 - 數字輸入 -->
<script type="text/html" id="tmpl-flex-property-number">
    <div class="flex-property-field property-number field-{{ data.name }}">
        <label>
            {{ data.label }}
            <# if (data.required) { #><span class="required">*</span><# } #>
        </label>
        <div class="flex-property-field-wrapper">
            <input type="number" id="{{ data.id }}" value="{{ data.value || '' }}" data-property="{{ data.name }}"
                <# if (data.min !== undefined) { #>min="{{ data.min }}"<# } #>
                <# if (data.step !== undefined) { #>step="{{ data.step }}"<# } #>
                <# if (data.required) { #>required<# } #> />
            <# if (data.description) { #>
                <p class="description">{{ data.description }}</p>
            <# } #>
            <p class="description verify-info"></p>
        </div>
    </div>
</script>

<!-- 屬性欄位模板 - 下拉選單 -->
<script type="text/html" id="tmpl-flex-property-select">
    <div class="flex-property-field property-select field-{{ data.name }}">
        <label>
            {{ data.label }}
            <# if (data.required) { #><span class="required">*</span><# } #>
        </label>
        <div class="flex-property-field-wrapper">
            <select id="{{ data.id }}" data-property="{{ data.name }}"
                <# if (data.required) { #>required<# } #>>
                <# _.each(data.options, function(option) { #>
                    <option value="{{ option.value }}"
                        <# if (data.value == option.value) { #>selected<# } #>>
                        {{ option.label }}
                    </option>
                <# }); #>
            </select>
            <# if (data.description) { #>
                <p class="description">{{ data.description }}</p>
            <# } #>
            <p class="description verify-info"></p>
        </div>
    </div>
</script>
