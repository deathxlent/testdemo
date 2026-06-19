(function () {
    function applyTextProp(key, value) {
        var obj = App.getActiveObj();
        if (!obj || obj.type !== 'text') return;
        obj[key] = value;
        App.Text.renderOne(obj);
        App.trigger('objects:changed');
    }

    function applyShadowProp(key, value) {
        var obj = App.getActiveObj();
        if (!obj || obj.type !== 'text') return;
        if (!obj.shadow) return;
        obj.shadow[key] = value;
        App.Text.renderOne(obj);
        App.trigger('objects:changed');
    }

    function applyStrokeProp(key, value) {
        var obj = App.getActiveObj();
        if (!obj || obj.type !== 'text') return;
        if (!obj.stroke) return;
        obj.stroke[key] = value;
        App.Text.renderOne(obj);
        App.trigger('objects:changed');
    }

    function updateUIForSelected() {
        var els = App.els();
        var obj = App.getActiveObj();

        if (obj && obj.type === 'text') {
            els.fontFamily.value = obj.fontFamily;
            els.fontSize.value = obj.fontSize;
            els.boldBtn.classList.toggle('active', obj.bold);
            els.italicBtn.classList.toggle('active', obj.italic);
            els.underlineBtn.classList.toggle('active', obj.underline);
            els.strikethroughBtn.classList.toggle('active', obj.strikethrough);
            els.fontColor.value = obj.color;
            els.fontColorText.value = obj.color;
            if (obj.shadow) {
                els.shadowEnabled.checked = obj.shadow.enabled;
                els.shadowOffsetX.value = obj.shadow.offsetX;
                els.shadowOffsetY.value = obj.shadow.offsetY;
                els.shadowBlur.value = obj.shadow.blur;
                els.shadowColor.value = obj.shadow.color;
            }
            if (obj.stroke) {
                els.strokeEnabled.checked = obj.stroke.enabled;
                els.strokeWidth.value = obj.stroke.width;
                els.strokeColor.value = obj.stroke.color;
            }
        }
    }

    function setupEvents() {
        var els = App.els();

        els.fontFamily.addEventListener('change', function () {
            applyTextProp('fontFamily', els.fontFamily.value);
        });

        els.fontSize.addEventListener('input', function () {
            var val = parseInt(els.fontSize.value);
            if (val > 0) applyTextProp('fontSize', val);
        });

        els.boldBtn.addEventListener('click', function () {
            var obj = App.getActiveObj();
            if (obj && obj.type === 'text') applyTextProp('bold', !obj.bold);
        });

        els.italicBtn.addEventListener('click', function () {
            var obj = App.getActiveObj();
            if (obj && obj.type === 'text') applyTextProp('italic', !obj.italic);
        });

        els.underlineBtn.addEventListener('click', function () {
            var obj = App.getActiveObj();
            if (obj && obj.type === 'text') applyTextProp('underline', !obj.underline);
        });

        els.strikethroughBtn.addEventListener('click', function () {
            var obj = App.getActiveObj();
            if (obj && obj.type === 'text') applyTextProp('strikethrough', !obj.strikethrough);
        });

        els.fontColor.addEventListener('input', function () {
            els.fontColorText.value = els.fontColor.value;
            applyTextProp('color', els.fontColor.value);
        });

        els.fontColorText.addEventListener('change', function () {
            var val = els.fontColorText.value;
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                els.fontColor.value = val;
                applyTextProp('color', val);
            }
        });

        els.shadowEnabled.addEventListener('change', function () {
            applyShadowProp('enabled', els.shadowEnabled.checked);
        });

        els.shadowOffsetX.addEventListener('input', function () {
            applyShadowProp('offsetX', parseInt(els.shadowOffsetX.value) || 0);
        });

        els.shadowOffsetY.addEventListener('input', function () {
            applyShadowProp('offsetY', parseInt(els.shadowOffsetY.value) || 0);
        });

        els.shadowBlur.addEventListener('input', function () {
            applyShadowProp('blur', parseInt(els.shadowBlur.value) || 0);
        });

        els.shadowColor.addEventListener('input', function () {
            applyShadowProp('color', els.shadowColor.value);
        });

        els.strokeEnabled.addEventListener('change', function () {
            applyStrokeProp('enabled', els.strokeEnabled.checked);
        });

        els.strokeWidth.addEventListener('input', function () {
            applyStrokeProp('width', parseFloat(els.strokeWidth.value) || 0);
        });

        els.strokeColor.addEventListener('input', function () {
            applyStrokeProp('color', els.strokeColor.value);
        });
    }

    App.TextStyle = {
        updateUIForSelected: updateUIForSelected,
        setupEvents: setupEvents
    };
})();
