(function () {
    function renderAllObjects() {
        var imgObj = App.getActiveImage();
        var els = App.els();
        if (!imgObj) { els.objectLayer.innerHTML = ''; return; }

        var existing = {};
        els.objectLayer.querySelectorAll('.text-box, .watermark-box, .localzoom-box, .localzoom-source').forEach(function (el) {
            if (!existing[el.dataset.objId]) existing[el.dataset.objId] = [];
            existing[el.dataset.objId].push(el);
        });

        var fragment = document.createDocumentFragment();
        imgObj.objects.forEach(function (obj) {
            if (obj.type === 'localzoom') {
                if (App.LocalZoom) {
                    App.LocalZoom.drawToObjectLayer(obj, fragment);
                }
                if (existing[obj.id]) delete existing[obj.id];
            } else if (existing[obj.id] && existing[obj.id].length) {
                var el = existing[obj.id][0];
                if (obj.type === 'text') updateTextBoxDOM(el, obj);
                else updateWatermarkBoxDOM(el, obj);
                fragment.appendChild(el);
                delete existing[obj.id];
            } else {
                if (obj.type === 'text') fragment.appendChild(createTextBoxDOM(obj));
                else fragment.appendChild(createWatermarkBoxDOM(obj));
            }
        });

        Object.keys(existing).forEach(function (id) {
            if (existing[id]) {
                existing[id].forEach(function (el) {
                    if (el.parentNode) el.parentNode.removeChild(el);
                });
            }
        });

        els.objectLayer.innerHTML = '';
        els.objectLayer.appendChild(fragment);
    }

    function renderOne(obj) {
        var els = App.els();
        var el = els.objectLayer.querySelector('[data-id="' + obj.id + '"]');
        if (el) {
            if (obj.type === 'text') updateTextBoxDOM(el, obj);
            else updateWatermarkBoxDOM(el, obj);
        }
    }

    function createTextBoxDOM(obj) {
        var div = document.createElement('div');
        div.className = 'text-box' + (obj.id === App.state.selectedObjId ? ' selected' : '');
        div.dataset.id = obj.id;
        div.dataset.type = 'text';

        var content = document.createElement('div');
        content.className = 'text-content';
        content.textContent = obj.text;
        applyTextStyle(content, obj, true);

        var dirs = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
        dirs.forEach(function (d) {
            var handle = document.createElement('div');
            handle.className = 'resize-handle h-' + d;
            handle.dataset.dir = d;
            div.appendChild(handle);
        });

        div.appendChild(content);
        updateTextBoxDOM(div, obj);
        return div;
    }

    function updateTextBoxDOM(el, obj) {
        el.style.left = App.toDisplay(obj.x) + 'px';
        el.style.top = App.toDisplay(obj.y) + 'px';
        el.style.width = App.toDisplay(obj.width) + 'px';
        el.style.height = App.toDisplay(obj.height) + 'px';
        el.classList.toggle('selected', obj.id === App.state.selectedObjId);

        var content = el.querySelector('.text-content');
        if (content && !el.classList.contains('editing')) {
            content.textContent = obj.text;
            applyTextStyle(content, obj, true);
        }
    }

    function applyTextStyle(el, obj, forDisplay) {
        el.style.font = App.buildFontStr(obj, forDisplay);
        el.style.color = obj.color;
        var decos = [];
        if (obj.underline) decos.push('underline');
        if (obj.strikethrough) decos.push('line-through');
        el.style.textDecoration = decos.length ? decos.join(' ') : 'none';

        var shadow = '';
        if (obj.shadow && obj.shadow.enabled) {
            var ox = forDisplay ? App.toDisplay(obj.shadow.offsetX) : obj.shadow.offsetX;
            var oy = forDisplay ? App.toDisplay(obj.shadow.offsetY) : obj.shadow.offsetY;
            var blur = forDisplay ? App.toDisplay(obj.shadow.blur) : obj.shadow.blur;
            shadow = ox + 'px ' + oy + 'px ' + blur + 'px ' + obj.shadow.color;
        }
        el.style.textShadow = shadow;

        if (obj.stroke && obj.stroke.enabled) {
            var width = forDisplay ? Math.max(1, App.toDisplay(obj.stroke.width)) : obj.stroke.width;
            el.style.webkitTextStroke = width + 'px ' + obj.stroke.color;
        } else {
            el.style.webkitTextStroke = '';
        }
    }

    function createWatermarkBoxDOM(obj) {
        var div = document.createElement('div');
        div.className = 'watermark-box' + (obj.id === App.state.selectedObjId ? ' selected' : '');
        div.dataset.id = obj.id;
        div.dataset.type = 'watermark';

        var rotateHandle = document.createElement('div');
        rotateHandle.className = 'watermark-rotate';
        rotateHandle.title = App.i18n.t('js.rotate_handle');
        div.appendChild(rotateHandle);

        var img = document.createElement('img');
        img.src = obj.src;
        div.appendChild(img);

        var dirs = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
        dirs.forEach(function (d) {
            var handle = document.createElement('div');
            handle.className = 'resize-handle h-' + d;
            handle.dataset.dir = d;
            div.appendChild(handle);
        });

        updateWatermarkBoxDOM(div, obj);
        return div;
    }

    function updateWatermarkBoxDOM(el, obj) {
        el.style.left = App.toDisplay(obj.x) + 'px';
        el.style.top = App.toDisplay(obj.y) + 'px';
        el.style.width = App.toDisplay(obj.width) + 'px';
        el.style.height = App.toDisplay(obj.height) + 'px';
        el.style.transform = 'rotate(' + obj.rotation + 'deg)';
        el.style.transformOrigin = 'center center';
        el.style.opacity = obj.opacity / 100;
        el.classList.toggle('selected', obj.id === App.state.selectedObjId);
    }

    function createTextObj(x, y, w, h) {
        var imgObj = App.getActiveImage();
        if (!imgObj) return null;
        var els = App.els();

        var obj = {
            id: 'text_' + App.state.nextTextId++,
            type: 'text',
            x: x,
            y: y,
            width: w,
            height: h,
            text: App.i18n.t('object.text'),
            fontSize: parseInt(els.fontSize.value) || 32,
            fontFamily: els.fontFamily.value,
            bold: els.boldBtn.classList.contains('active'),
            italic: els.italicBtn.classList.contains('active'),
            underline: els.underlineBtn.classList.contains('active'),
            strikethrough: els.strikethroughBtn.classList.contains('active'),
            color: els.fontColor.value,
            shadow: {
                enabled: els.shadowEnabled.checked,
                offsetX: parseInt(els.shadowOffsetX.value) || 0,
                offsetY: parseInt(els.shadowOffsetY.value) || 0,
                blur: parseInt(els.shadowBlur.value) || 0,
                color: els.shadowColor.value
            },
            stroke: {
                enabled: els.strokeEnabled.checked,
                width: parseFloat(els.strokeWidth.value) || 0,
                color: els.strokeColor.value
            }
        };
        imgObj.objects.push(obj);
        return obj;
    }

    function startDrawingRect(e) {
        if (App.state.activeTool !== 'text') return;
        var els = App.els();
        var rect = els.canvasWrapper.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        App.state.isDrawing = true;
        App.state.drawStartX = x;
        App.state.drawStartY = y;

        var selRect = els.selectionRect;
        selRect.style.display = 'block';
        selRect.style.left = x + 'px';
        selRect.style.top = y + 'px';
        selRect.style.width = '0px';
        selRect.style.height = '0px';
    }

    function drawRectMove(e) {
        if (!App.state.isDrawing) return;
        var els = App.els();
        var rect = els.canvasWrapper.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        var left = Math.min(App.state.drawStartX, x);
        var top = Math.min(App.state.drawStartY, y);
        var w = Math.abs(x - App.state.drawStartX);
        var h = Math.abs(y - App.state.drawStartY);

        var selRect = els.selectionRect;
        selRect.style.left = left + 'px';
        selRect.style.top = top + 'px';
        selRect.style.width = w + 'px';
        selRect.style.height = h + 'px';
    }

    function endDrawingRect(e) {
        if (!App.state.isDrawing) return;
        var els = App.els();
        App.state.isDrawing = false;
        els.selectionRect.style.display = 'none';

        var rect = els.canvasWrapper.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        var left = Math.min(App.state.drawStartX, x);
        var top = Math.min(App.state.drawStartY, y);
        var w = Math.abs(x - App.state.drawStartX);
        var h = Math.abs(y - App.state.drawStartY);

        if (w < 10 && h < 10) {
            w = App.toDisplay(200);
            h = App.toDisplay(40);
            left = App.state.drawStartX - w / 2;
            top = App.state.drawStartY - h / 2;
        }

        var imgObj = App.getActiveImage();
        var imgLeft = Math.max(0, App.toImage(left));
        var imgTop = Math.max(0, App.toImage(top));
        var imgW = Math.max(20, App.toImage(w));
        var imgH = Math.max(16, App.toImage(h));
        imgW = Math.min(imgW, imgObj.width - imgLeft);
        imgH = Math.min(imgH, imgObj.height - imgTop);

        var obj = createTextObj(imgLeft, imgTop, imgW, imgH);
        selectObject(obj.id);
        renderAllObjects();
        App.trigger('objects:changed');
    }

    function selectObject(id) {
        App.state.selectedObjId = id;
        var els = App.els();
        els.objectLayer.querySelectorAll('.text-box, .watermark-box').forEach(function (el) {
            el.classList.toggle('selected', el.dataset.id === id);
        });
        App.trigger('object:selected', { id: id });
    }

    function deselectAll() {
        App.state.selectedObjId = null;
        document.querySelectorAll('.text-box.selected, .watermark-box.selected').forEach(function (el) {
            el.classList.remove('selected');
        });
        App.trigger('object:deselected');
    }

    function deleteObject(id) {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var idx = imgObj.objects.findIndex(function (o) { return o.id === id; });
        if (idx === -1) return;
        imgObj.objects.splice(idx, 1);
        if (App.state.selectedObjId === id) {
            App.state.selectedObjId = null;
            App.trigger('object:deselected');
        }
        renderAllObjects();
        App.trigger('objects:changed');
    }

    function onEditBlur() {
        setTimeout(function () {
            if (App.state.isEditing) stopEditing();
        }, 100);
    }

    function startEditing(textBox, obj) {
        App.state.isEditing = true;
        textBox.classList.add('editing');

        var content = textBox.querySelector('.text-content');
        content.contentEditable = 'true';
        content.focus();

        var range = document.createRange();
        range.selectNodeContents(content);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        content.addEventListener('blur', onEditBlur);
    }

    function stopEditing() {
        if (!App.state.isEditing) return;
        App.state.isEditing = false;

        var editingEl = document.querySelector('.text-box.editing');
        if (!editingEl) return;

        var id = editingEl.dataset.id;
        var obj = App.getActiveImage().objects.find(function (t) { return t.id === id; });
        if (obj) {
            var content = editingEl.querySelector('.text-content');
            obj.text = content.textContent || App.i18n.t('object.text');
            content.contentEditable = 'false';
            content.removeEventListener('blur', onEditBlur);
        }

        editingEl.classList.remove('editing');
        renderAllObjects();
        App.trigger('objects:changed');
    }

    App.Text = {
        renderAllObjects: renderAllObjects,
        renderOne: renderOne,
        createTextBoxDOM: createTextBoxDOM,
        updateTextBoxDOM: updateTextBoxDOM,
        applyTextStyle: applyTextStyle,
        createWatermarkBoxDOM: createWatermarkBoxDOM,
        updateWatermarkBoxDOM: updateWatermarkBoxDOM,
        createTextObj: createTextObj,
        startDrawingRect: startDrawingRect,
        drawRectMove: drawRectMove,
        endDrawingRect: endDrawingRect,
        selectObject: selectObject,
        deselectAll: deselectAll,
        deleteObject: deleteObject,
        startEditing: startEditing,
        stopEditing: stopEditing
    };
})();
