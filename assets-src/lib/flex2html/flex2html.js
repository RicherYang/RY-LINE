window.flex2html = (element, json) => {
    document.getElementById(element).innerHTML = '<div class="LySlider"><div class="lyInner">' + bubble_object(json) + '</div></div>';

    function upper1digit(str) {
        return str.charAt(0).toUpperCase();
    }

    function upperalldigit(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function bubble_struc(json) {
        const { size, direction } = json;

        return `<div class="lyItem Ly-${size}"><div class="T1" dir="${direction ?? 'ltr'}"><!-- header --><!-- hero --><!-- body --><!-- footer --></div></div>`;
    }

    function hero_struc(json) {
        const { styles } = json;
        let backgroundColor = '';
        if (styles) {
            const { hero } = styles;
            backgroundColor = (hero && hero.backgroundColor) ? `background-color:${hero.backgroundColor}` : '';
        }
        return `<div class="t1Hero" style="${backgroundColor}"><!-- inner --></div>`;
    }

    function header_struc(json) {
        const { styles } = json;
        let backgroundColor = '';
        if (styles) {
            const { header } = styles;
            backgroundColor = (header && header.backgroundColor) ? `background-color:${header.backgroundColor}` : '';
        }
        return `<div class="t1Header" style="${backgroundColor}"><!-- inner --></div>`;
    }

    function body_struc(json) {
        const { footer, styles } = json;
        let backgroundColor = '';
        if (styles) {
            const { body } = styles;
            backgroundColor = (body && body.backgroundColor) ? `background-color:${body.backgroundColor}` : '';
        }
        let ExHasFooter = (footer) ? 'ExHasFooter' : '';
        return `<div class="t1Body ${ExHasFooter}" style="${backgroundColor}"><!-- inner --></div>`;
    }

    function footer_struc(json) {
        const { styles } = json;
        let backgroundColor = '';
        if (styles) {
            const { footer } = styles;
            backgroundColor = (footer && footer.backgroundColor) ? `background-color:${footer.backgroundColor}` : '';
        }
        return `<div class="t1Footer" style="${backgroundColor}"><!-- inner --></div>`;
    }

    function bubble_object(json) {
        const { hero, header, body, footer } = json;

        let box = '';
        if (hero?.type === 'video') {
            box = hero_box_video(hero);
        } else if (hero?.type === 'image') {
            box = convert_object('', hero);
        } else {
            for (const key in hero) {
                if (hero.hasOwnProperty(key)) {
                    if (key === 'type' && hero[key] === 'box') {
                        box = box_recursive(box_object(hero), hero['layout'], hero['contents']);
                    }
                }
            }
        }
        const hero_object = hero_struc(json).replace('<!-- inner -->', box);

        box = '';
        for (const key in header) {
            if (header.hasOwnProperty(key)) {
                if (key === 'type' && header[key] === 'box') {
                    box = box_recursive(box_object(header), header['layout'], header['contents']);
                }
            }
        }
        const header_object = header_struc(json).replace('<!-- inner -->', box);

        box = '';
        for (const key in body) {
            if (body.hasOwnProperty(key)) {
                if (key === 'type' && body[key] === 'box') {
                    box = box_recursive(box_object(body), body['layout'], body['contents']);
                }
            }
        }
        const body_object = body_struc(json).replace('<!-- inner -->', box);

        box = '';
        for (const key in footer) {
            if (footer.hasOwnProperty(key)) {
                if (key === 'type' && footer[key] === 'box') {
                    box = box_recursive(box_object(footer), footer['layout'], footer['contents']);
                }
            }
        }
        const footer_object = footer_struc(json).replace('<!-- inner -->', box);

        return bubble_struc(json).replace('<!-- hero -->', hero_object)
            .replace('<!-- header -->', header_object)
            .replace('<!-- body -->', body_object)
            .replace('<!-- footer -->', footer_object);
    }

    function hero_box_video(hero) {
        return `<div class="ExCover MdImg ExFull"><div><video width="100%" poster="${hero?.previewUrl}" controls>
   <source src="${hero?.url}" type="video/mp4">
   <source src="${hero?.url}" type="video/ogg">
   <source src="${hero?.url}" type="video/webm">
</video></div></div>`;
    }

    function box_recursive(parent_box, layout, json) {
        if (Array.isArray(json)) {
            const result = [];
            json.forEach((obj, index) => {
                let temp = '';
                if (obj['type'] === 'box') {
                    temp = box_recursive(box_object(obj), obj['layout'], obj['contents']);
                } else if (obj['type'] === 'text' && obj['contents'] && obj['contents'].length > 0) {
                    temp = box_recursive(convert_object(layout, obj), obj['layout'], obj['contents']);
                } else {
                    temp = convert_object(layout, obj);
                }
                result[index] = temp;
            });
            json.forEach((obj, index) => {
                result[index] = result[index].replace('<!-- content -->', '');
                parent_box = parent_box.replace('<!-- content -->', result[index] + '<!-- content -->');
            });
        }

        return parent_box;
    }

    function convert_object(layout, json) {
        switch (json['type']) {
            case 'image':
                return image_object(json);
            case 'icon':
                return icon_object(json);
            case 'text':
                return text_object(json);
            case 'span':
                return span_object(json);
            case 'button':
                return button_object(json);
            case 'filler':
                return filler_object(json);
            case 'spacer':
                return spacer_object(json);
            case 'separator':
                return separator_object(layout, json);
        }
        return null;
    }

    function box_object(json) {
        let styles = '';
        let classes = '';
        let { layout, position, flex, spacing, margin, width, height, backgroundColor, borderColor, borderWidth, cornerRadius, justifyContent, alignItems, offsetTop, offsetBottom, offsetStart, offsetEnd, paddingAll, paddingTop, paddingBottom, paddingStart, paddingEnd, background, maxWidth, maxHeight } = json;


        if (layout === 'baseline') {
            classes += ' hr bl';
        } else if (layout === 'horizontal') {
            classes += ' hr';
        } else if (layout === 'vertical') {
            classes += ' vr';
        }

        if (flex > 3) {
            styles += `-webkit-box-flex:${flex};flex-grow:${flex};`;
        } else if (flex >= 0) {
            classes += ` fl${flex}`;
        }

        if (position === 'absolute') {
            classes += ' ExAbs';
        }

        if (spacing && spacing.indexOf("px") >= 0) {
            // no class
        } else if (spacing) {
            classes += ' spc' + upperalldigit(spacing)
        }

        if (margin && margin.indexOf("px") >= 0) {
            styles += `margin-top:${margin};`
        } else if (margin) {
            classes += ' ExMgnT' + upperalldigit(margin)
        }
        if (width && width !== '') {
            styles += `width:${width}; max-width:${width};`
        }
        if (height && height !== '') {
            styles += `height:${height};`
        }
        if (backgroundColor) {
            styles += `background-color:${backgroundColor} !important;`
        }
        if (borderColor) {
            styles += `border-color:${borderColor} !important;`
        }

        if (borderWidth && borderWidth.indexOf("px") >= 0) {
            styles += `border-width:${borderWidth};`
        } else if (borderWidth) {
            switch (borderWidth) {
                case 'none':
                    classes += ' ExBdrWdtNone'
                    break;
                case 'light':
                    classes += ' ExBdrWdtLgh'
                    break;
                case 'normal':
                    classes += ' ExBdrWdtNml'
                    break;
                case 'medium':
                    classes += ' ExBdrWdtMdm'
                    break;
                case 'semi-bold':
                    classes += ' ExBdrWdtSbd'
                    break;
                case 'bold':
                    classes += ' ExBdrWdtBld'
                    break;
            }
        }
        if (cornerRadius && cornerRadius.indexOf("px") >= 0) {
            styles += `border-radius:${cornerRadius};`
        } else if (cornerRadius) {
            classes += ' ExBdrRad' + upperalldigit(cornerRadius)
        }

        if (justifyContent && justifyContent !== '') {
            switch (justifyContent) {
                case 'center':
                    classes += ' itms-jfcC'
                    break;
                case 'flex-start':
                    classes += ' itms-jfcS'
                    break;
                case 'flex-end':
                    classes += ' itms-jfcE'
                    break;
                case 'space-between':
                    classes += ' itms-jfcSB'
                    break;
                case 'space-around':
                    classes += ' itms-jfcSA'
                    break;
                case 'space-evenly':
                    classes += ' itms-jfcSE'
                    break;
            }
        }
        if (alignItems && alignItems !== '') {
            switch (alignItems) {
                case 'center':
                    classes += ' itms-algC'
                    break;
                case 'flex-start':
                    classes += ' itms-algS'
                    break;
                case 'flex-end':
                    classes += ' itms-algE'
                    break;
            }
        }
        if (offsetTop && offsetTop.indexOf("px") >= 0) {
            styles += `top:${offsetTop};`
        } else if (offsetTop) {
            classes += ' ExT' + upperalldigit(offsetTop)
        }

        if (offsetBottom && offsetBottom.indexOf("px") >= 0) {
            styles += `bottom:${offsetBottom};`
        } else if (offsetBottom) {
            classes += ' ExB' + upperalldigit(offsetBottom)
        }

        if (offsetStart && offsetStart.indexOf("px") >= 0) {
            styles += `left:${offsetStart};`
        } else if (offsetStart) {
            classes += ' ExL' + upperalldigit(offsetStart)
        }

        if (offsetEnd && offsetEnd.indexOf("px") >= 0) {
            styles += `right:${offsetEnd};`
        } else if (offsetEnd) {
            classes += ' ExR' + upperalldigit(offsetEnd)
        }

        if (paddingAll && paddingAll.indexOf("px") >= 0) {
            styles += `padding:${paddingAll};`
        } else if (paddingAll) {
            classes += ' ExPadA' + upperalldigit(paddingAll)
        }

        if (paddingTop && paddingTop.indexOf("px") >= 0) {
            styles += `padding-top:${paddingTop};`
        } else if (paddingTop) {
            classes += ' ExPadT' + upperalldigit(paddingTop)
        }

        if (paddingBottom && paddingBottom.indexOf("px") >= 0) {
            styles += `padding-bottom:${paddingBottom};`
        } else if (paddingBottom) {
            classes += ' ExPadB' + upperalldigit(paddingBottom)
        }

        if (paddingStart && paddingStart.indexOf("px") >= 0) {
            styles += `padding-left:${paddingStart};`
        } else if (paddingStart) {
            classes += ' ExPadL' + upperalldigit(paddingStart)
        }

        if (paddingEnd && paddingEnd.indexOf("px") >= 0) {
            styles += `padding-right:${paddingEnd};`
        } else if (paddingEnd) {
            classes += ' ExPadR' + upperalldigit(paddingEnd)
        }

        if (background && background.type === 'linearGradient') {
            centerPosition = (background.centerPosition) ? background.centerPosition : '50%'
            if (background.centerColor) {
                styles += `background: linear-gradient(${background.angle}, ${background.startColor} 0%, ${background.centerColor} ${centerPosition}, ${background.endColor} 100%);`
            } else {
                styles += `background: linear-gradient(${background.angle}, ${background.startColor} 0%, ${background.endColor} 100%);`
            }
        }
        if (maxWidth && maxWidth.indexOf("px") >= 0) {
            styles += `max-width:${maxWidth};`
        }
        if (maxHeight && maxHeight.indexOf("px") >= 0) {
            styles += `max-height:${maxHeight};`
        }

        return `<div class="MdBx ${classes}" style="${styles}"><!-- content --></div>`
    }

    function button_object(json) {
        let styles = ''
        let styles2 = ''
        let classes = ''
        let { flex, margin, position, height, style, color, gravity, adjustMode, offsetTop, offsetBottom, offsetStart, offsetEnd, action } = json

        if (flex > 3) {
            styles += `-webkit-box-flex:${flex};flex-grow:${flex};`
        } else if (flex >= 0) {
            classes += ` fl${flex}`
        }

        if (position === 'absolute') {
            classes += ' ExAbs'
        }

        if (margin && margin.indexOf("px") >= 0) {
            styles += `margin-top:${margin};`
        } else if (margin) {
            classes += ' ExMgnT' + upperalldigit(margin)
        }

        if (height && height !== '' && height !== 'md') {
            classes += ' Ex' + upperalldigit(height)
        }

        if (gravity === 'bottom' || gravity === 'center') {
            classes += ' grv' + upper1digit(gravity)
        }

        if (style && style !== '') {
            switch (style) {
                case 'link':
                    classes += ' ExBtnL'
                    break;
                case 'primary':
                    classes += ' ExBtn1'
                    break;
                case 'secondary':
                    classes += ' ExBtn2'
                    break;
                default:
                    classes += ' ExBtnL'
            }
        } else {
            classes += ' ExBtnL'
        }

        if (color) {
            styles2 += (style === 'link') ? `color:${color} !important;` : `background-color:${color} !important;`
        }

        if (offsetTop && offsetTop.indexOf("px") >= 0) {
            styles += `top:${offsetTop};`
        } else if (offsetTop) {
            classes += ' ExT' + upperalldigit(offsetTop)
        }

        if (offsetBottom && offsetBottom.indexOf("px") >= 0) {
            styles += `bottom:${offsetBottom};`
        } else if (offsetBottom) {
            classes += ' ExB' + upperalldigit(offsetBottom)
        }

        if (offsetStart && offsetStart.indexOf("px") >= 0) {
            styles += `left:${offsetStart};`
        } else if (offsetStart) {
            classes += ' ExL' + upperalldigit(offsetStart)
        }

        if (offsetEnd && offsetEnd.indexOf("px") >= 0) {
            styles += `right:${offsetEnd};`
        } else if (offsetEnd) {
            classes += ' ExR' + upperalldigit(offsetEnd)
        }

        return `<div class="MdBtn ${classes}" style="${styles}"><a style="${styles2}"><div>${action?.label}</div></a></div>`
    }

    function filler_object(json) {
        let styles = ''
        let classes = ''
        let { flex } = json

        if (flex > 3) {
            styles += `-webkit-box-flex:${flex};flex-grow:${flex};`
        } else if (flex >= 0) {
            classes += ` fl${flex}`
        }
        return `<div class="mdBxFiller ${classes}" style="${styles}" ></div>`
    }

    function icon_object(json) {
        let styles = ''
        let classes = ' fl0'
        let { size, aspectRatio, url, position, margin, offsetTop, offsetBottom, offsetStart, offsetEnd } = json
        let styleimg = `background-image:url('${url}');`

        size = (!size || size === '') ? 'md' : size
        if (size.indexOf("px") >= 0) {
            styles += `font-size:${size};`
        } else {
            classes += ' Ex' + upperalldigit(size)
        }

        if (!aspectRatio || aspectRatio === '') {
            styleimg += `width:1em;`
        } else {
            ratio = ratio[0] / ratio[1]
            styleimg += `width:${ratio}em;`
        }

        if (position === 'absolute') {
            classes += ' ExAbs'
        }

        if (margin && margin.indexOf("px") >= 0) {
            styles += `margin-top:${margin};`
        } else if (margin) {
            classes += ' ExMgnT' + upperalldigit(margin)
        }

        if (offsetTop && offsetTop.indexOf("px") >= 0) {
            styles += `top:${offsetTop};`
        } else if (offsetTop) {
            classes += ' ExT' + upperalldigit(offsetTop)
        }

        if (offsetBottom && offsetBottom.indexOf("px") >= 0) {
            styles += `bottom:${offsetBottom};`
        } else if (offsetBottom) {
            classes += ' ExB' + upperalldigit(offsetBottom)
        }

        if (offsetStart && offsetStart.indexOf("px") >= 0) {
            styles += `left:${offsetStart};`
        } else if (offsetStart) {
            classes += ' ExL' + upperalldigit(offsetStart)
        }

        if (offsetEnd && offsetEnd.indexOf("px") >= 0) {
            styles += `right:${offsetEnd};`
        } else if (offsetEnd) {
            classes += ' ExR' + upperalldigit(offsetEnd)
        }

        return `<div class="MdIco ${classes}" style="${styles}" ><div><span style="${styleimg}"></span></div></div>`
    }

    function image_object(json) {
        let styles = ''
        let styles2 = ''
        let classes = ''
        let { aspectMode, size, aspectRatio, url, position, flex, margin, align, gravity, backgroundColor, offsetTop, offsetBottom, offsetStart, offsetEnd } = json
        let styleimg = `background-image:url('${url}');`
        if (backgroundColor) {
            styleimg += `background-color:${backgroundColor} !important;`
        }

        aspectMode = (!aspectMode || aspectMode === '') ? 'fit' : aspectMode
        classes += ' Ex' + upperalldigit(aspectMode)

        size = (!size || size === '') ? 'md' : size
        if (size.indexOf("px") >= 0) {
            styles2 += `width:${size};`
        } else if (size.indexOf("%") >= 0) {
            styles2 += `width:${size};`
        } else {
            classes += ' Ex' + upperalldigit(size)
        }

        if (!aspectRatio || aspectRatio === '') {
            ratio = '100'
        } else {
            ratio = aspectRatio.split(':')
            ratio = ratio[1] * 100 / ratio[0]
        }

        if (flex > 3) {
            styles += `-webkit-box-flex:${flex};flex-grow:${flex};`
        } else if (flex >= 0) {
            classes += ` fl${flex}`
        }

        if (position === 'absolute') {
            classes += ' ExAbs'
        }

        if (margin && margin.indexOf("px") >= 0) {
            styles += `margin-top:${margin};`
        } else if (margin) {
            classes += ' ExMgnT' + upperalldigit(margin)
        }

        if (align === 'start' || align === 'end') {
            classes += ' alg' + upper1digit(align)
        }

        if (gravity === 'bottom' || gravity === 'center') {
            classes += ' grv' + upper1digit(gravity)
        }

        if (offsetTop && offsetTop.indexOf("px") >= 0) {
            styles += `top:${offsetTop};`
        } else if (offsetTop) {
            classes += ' ExT' + upperalldigit(offsetTop)
        }

        if (offsetBottom && offsetBottom.indexOf("px") >= 0) {
            styles += `bottom:${offsetBottom};`
        } else if (offsetBottom) {
            classes += ' ExB' + upperalldigit(offsetBottom)
        }

        if (offsetStart && offsetStart.indexOf("px") >= 0) {
            styles += `left:${offsetStart};`
        } else if (offsetStart) {
            classes += ' ExL' + upperalldigit(offsetStart)
        }

        if (offsetEnd && offsetEnd.indexOf("px") >= 0) {
            styles += `right:${offsetEnd};`
        } else if (offsetEnd) {
            classes += ' ExR' + upperalldigit(offsetEnd)
        }
        return `<div class="MdImg ${classes}"  style="${styles}">
    <div style="${styles2}">
        <a style="padding-bottom:${ratio}%;">
        <span style="${styleimg}"></span>
        </a>
    </div>
</div>`;
    }

    function separator_object(layout, json) {
        let styles = ''
        let classes = ' fl0'
        let { margin, color } = json

        if (margin && margin.indexOf("px") >= 0) {
            styles += (layout === 'vertical') ? `margin-top:${margin};` : `margin-left:${margin};`
        } else if (margin) {
            classes += ' ExMgnT' + upperalldigit(margin)
        }
        if (color) {
            styles += `border-color:${color} !important;`
        }

        return `<div class="MdSep ${classes}" style="${styles}" ></div>`
    }

    function spacer_object(json) {
        let classes = ' fl0'
        let { size } = json
        size = (!size || size === '') ? 'md' : size
        if (size.indexOf("px") >= 0) {
            // no class for px size
        } else {
            classes += ' spc' + upperalldigit(size)
        }
        return `<div class="mdBxSpacer ${classes}" ></div>`
    }

    function span_object(json) {
        let styles = ''
        let classes = ''
        let { text, size, color, weight, style, decoration } = json

        if (size && size !== '') {
            if (size.indexOf("px") >= 0) {
                styles += `font-size:${size};`
            } else {
                classes += ' Ex' + upperalldigit(size)
            }
        }

        if (color && color !== '') {
            styles += `color:${color};`
        }

        if (weight === 'bold') {
            classes += ' ExWB'
        }

        if (style === 'normal') {
            classes += ' ExFntStyNml'
        } else if (style === 'italic') {
            classes += ' ExFntStyIt'
        }

        if (decoration === 'line-through') {
            classes += ' ExTxtDecLt'
        } else if (decoration === 'underline') {
            classes += ' ExTxtDecUl'
        } else if (decoration === 'none') {
            classes += ' ExTxtDecNone'
        }

        return `<span class="MdSpn ${classes}" style="${styles}" >${text}</span>`
    }

    function text_object(json) {
        let styles = ''
        let classes = ''
        let { flex, margin, size, position, align, gravity, text, color, weight, style, decoration, wrap, maxLines, adjustMode, offsetTop, offsetBottom, offsetStart, offsetEnd, lineSpacing } = json

        if (flex > 3) {
            styles += `-webkit-box-flex:${flex};flex-grow:${flex};`
        } else if (flex >= 0) {
            classes += ` fl${flex}`
        }

        if (position === 'absolute') {
            classes += ' ExAbs'
        }

        if (margin && margin.indexOf("px") >= 0) {
            styles += `margin-top:${margin};`
        } else if (margin) {
            classes += ' ExMgnL' + upperalldigit(margin)
        }

        if (align === 'start' || align === 'end' || align === 'center') {
            classes += ' ExAlg' + upper1digit(align)
        }

        if (gravity === 'bottom' || gravity === 'center') {
            classes += ' grv' + upper1digit(gravity)
        }

        size = (!size || size === '') ? 'md' : size
        if (size.indexOf("px") >= 0) {
            styles += `font-size:${size};`
        } else {
            classes += ' Ex' + upperalldigit(size)
        }

        if (color && color !== '') {
            styles += `color:${color};`
        }

        if (weight === 'bold') {
            classes += ' ExWB'
        }

        if (style === 'normal') {
            classes += ' ExFntStyNml'
        } else if (style === 'italic') {
            classes += ' ExFntStyIt'
        }

        if (decoration === 'line-through') {
            classes += ' ExTxtDecLt'
        } else if (decoration === 'underline') {
            classes += ' ExTxtDecUl'
        } else if (decoration === 'none') {
            classes += ' ExTxtDecNone'
        }

        if (wrap === true) {
            classes += ' ExWrap'
        }

        if (offsetTop && offsetTop.indexOf("px") >= 0) {
            styles += `top:${offsetTop};`
        } else if (offsetTop) {
            classes += ' ExT' + upperalldigit(offsetTop)
        }

        if (offsetBottom && offsetBottom.indexOf("px") >= 0) {
            styles += `bottom:${offsetBottom};`
        } else if (offsetBottom) {
            classes += ' ExB' + upperalldigit(offsetBottom)
        }

        if (offsetStart && offsetStart.indexOf("px") >= 0) {
            styles += `left:${offsetStart};`
        } else if (offsetStart) {
            classes += ' ExL' + upperalldigit(offsetStart)
        }

        if (offsetEnd && offsetEnd.indexOf("px") >= 0) {
            styles += `right:${offsetEnd};`
        } else if (offsetEnd) {
            classes += ' ExR' + upperalldigit(offsetEnd)
        }

        if (lineSpacing && lineSpacing.indexOf("px") >= 0) {
            let lineHeight = (parseInt(lineSpacing.replace('px', '')) + 15) + 'px'
            styles += `line-height:${lineHeight};`
        }
        text = (!text) ? '' : text
        return `<div class="MdTxt ${classes}" style="${styles}"><p>${text}<!-- content --></p></div>`
    }
}
