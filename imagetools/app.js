(function () {
    var state = {
        images: [],
        activeImageId: null,
        selectedTextId: null,
        activeTool: 'select',
        zoom: 100,
        nextImageId: 1,
        nextTextId: 1,
        isDrawing: false,
        drawStartX: 0,
        drawStartY: 0,
        isDragging: false,
        dragOffsetX: 0,
        dragOffsetY: 0,
        isResizing: false,
        resizeDir: '',
        resizeStartX: 0,
        resizeStartY: 0,
        resizeOrigX: 0,
        resizeOrigY: 0,
        resizeOrigW: 0,
        resizeOrigH: 0,
        isEditing: false
    };

    var els = {
        uploadBtn: document.getElementById('uploadBtn'),
        exportBtn: document.getElementById('exportBtn'),
        selectTool: document.getElementById('selectTool'),
        textTool: document.getElementById('textTool'),
        textPropsSection: document.getElementById('textPropsSection'),
        fontFamily: document.getElementById('fontFamily'),
        fontSize: document.getElementById('fontSize'),
        boldBtn: document.getElementById('boldBtn'),
        italicBtn: document.getElementById('italicBtn'),
        underlineBtn: document.getElementById('underlineBtn'),
        strikethroughBtn: document.getElementById('strikethroughBtn'),
        fontColor: document.getElementById('fontColor'),
        fontColorText: document.getElementById('fontColorText'),
        tabBar: document.getElementById('tabBar'),
        canvasContainer: document.getElementById('canvasContainer'),
        canvasScrollContent: document.getElementById('canvasScrollContent'),
        uploadHint: document.getElementById('uploadHint'),
        canvasWrapper: document.getElementById('canvasWrapper'),
        mainCanvas: document.getElementById('mainCanvas'),
        textLayer: document.getElementById('textLayer'),
        selectionRect: document.getElementById('selectionRect'),
        zoomBar: document.getElementById('zoomBar'),
        zoomSlider: document.getElementById('zoomSlider'),
        zoomOutBtn: document.getElementById('zoomOutBtn'),
        zoomInBtn: document.getElementById('zoomInBtn'),
        zoomFitBtn: document.getElementById('zoomFitBtn'),
        zoomDisplay: document.getElementById('zoomDisplay'),
        objectList: document.getElementById('objectList'),
        fileInput: document.getElementById('fileInput')
    };

    function getActiveImage() {
        return state.images.find(function (img) { return img.id === state.activeImageId; });
    }

    function getActiveTextObj() {
        var img = getActiveImage();
        if (!img || !state.selectedTextId) return null;
        return img.textObjects.find(function (t) { return t.id === state.selectedTextId; });
    }

    function toDisplay(v) { return v * state.zoom / 100; }
    function toImage(v) { return v * 100 / state.zoom; }

    function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

    function buildFontStr(obj, forDisplay) {
        var size = forDisplay ? toDisplay(obj.fontSize) : obj.fontSize;
        var parts = [];
        if (obj.italic) parts.push('italic');
        if (obj.bold) parts.push('bold');
        parts.push(size + 'px');
        parts.push('"' + obj.fontFamily + '"');
        return parts.join(' ');
    }

    function renderTabs() {
        var html = '';
        state.images.forEach(function (img) {
            var cls = img.id === state.activeImageId ? 'tab-item active' : 'tab-item';
            html += '<div class="' + cls + '" data-id="' + img.id + '">';
            html += '<span class="tab-name">' + escapeHtml(img.name) + '</span>';
            html += '<span class="tab-close" data-close="' + img.id + '">\u00d7</span>';
            html += '</div>';
        });
        els.tabBar.innerHTML = html;

        els.tabBar.querySelectorAll('.tab-item').forEach(function (tab) {
            tab.addEventListener('click', function (e) {
                if (e.target.classList.contains('tab-close')) return;
                switchImage(tab.dataset.id);
            });
        });
        els.tabBar.querySelectorAll('.tab-close').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                closeImage(btn.dataset.close);
            });
        });
    }

    function switchImage(id) {
        state.activeImageId = id;
        state.selectedTextId = null;
        state.isEditing = false;
        state.zoom = 100;
        var img = getActiveImage();
        if (img) {
            state.zoom = img._lastZoom || 100;
        }
        renderTabs();
        renderCanvas();
        renderTextBoxes();
        renderObjectList();
        updateTextPropsUI();
        updateZoomUI();
    }

    function closeImage(id) {
        var idx = state.images.findIndex(function (img) { return img.id === id; });
        if (idx === -1) return;
        state.images.splice(idx, 1);
        if (state.activeImageId === id) {
            if (state.images.length > 0) {
                var newIdx = Math.min(idx, state.images.length - 1);
                switchImage(state.images[newIdx].id);
            } else {
                state.activeImageId = null;
                state.selectedTextId = null;
                renderTabs();
                showUploadHint();
                renderObjectList();
                updateTextPropsUI();
            }
        } else {
            renderTabs();
            renderObjectList();
        }
    }

    function showUploadHint() {
        els.uploadHint.style.display = 'flex';
        els.canvasWrapper.style.display = 'none';
        els.zoomBar.style.display = 'none';
    }

    function showCanvasArea() {
        els.uploadHint.style.display = 'none';
        els.canvasWrapper.style.display = 'inline-block';
        els.zoomBar.style.display = 'flex';
    }

    function addImage(file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                var imageObj = {
                    id: 'img_' + state.nextImageId++,
                    name: file.name,
                    img: img,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    textObjects: [],
                    _lastZoom: 100
                };
                state.images.push(imageObj);
                switchImage(imageObj.id);
                fitToView();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function renderCanvas() {
        var imgObj = getActiveImage();
        if (!imgObj) {
            showUploadHint();
            return;
        }
        showCanvasArea();

        var canvas = els.mainCanvas;
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        canvas.style.width = toDisplay(imgObj.width) + 'px';
        canvas.style.height = toDisplay(imgObj.height) + 'px';

        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, imgObj.width, imgObj.height);
        ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);

        els.canvasWrapper.style.width = toDisplay(imgObj.width) + 'px';
        els.canvasWrapper.style.height = toDisplay(imgObj.height) + 'px';
    }

    function fitToView() {
        var imgObj = getActiveImage();
        if (!imgObj) return;
        var container = els.canvasContainer;
        var cw = container.clientWidth - 40;
        var ch = container.clientHeight - 40;
        var scaleW = cw / imgObj.width * 100;
        var scaleH = ch / imgObj.height * 100;
        var z = Math.min(scaleW, scaleH, 100);
        z = Math.max(5, Math.round(z));
        setZoom(z);
    }

    function setZoom(val) {
        val = clamp(Math.round(val), 5, 500);
        state.zoom = val;
        var imgObj = getActiveImage();
        if (imgObj) imgObj._lastZoom = val;
        if (state.isEditing) stopEditing();
        renderCanvas();
        renderTextBoxes();
        updateZoomUI();
    }

    function updateZoomUI() {
        els.zoomSlider.value = state.zoom;
        els.zoomDisplay.textContent = state.zoom + '%';
    }

    function setTool(tool) {
        state.activeTool = tool;
        els.selectTool.classList.toggle('active', tool === 'select');
        els.textTool.classList.toggle('active', tool === 'text');
        els.textPropsSection.style.display = (tool === 'text' || state.selectedTextId) ? 'block' : 'none';

        els.textLayer.classList.remove('cursor-text', 'cursor-crosshair');
        if (tool === 'text') {
            els.textLayer.classList.add('cursor-crosshair');
        }
        deselectAll();
    }

    function deselectAll() {
        state.selectedTextId = null;
        document.querySelectorAll('.text-box.selected').forEach(function (el) {
            el.classList.remove('selected');
        });
        updateTextPropsUI();
        renderObjectList();
    }

    function selectTextObj(id) {
        state.selectedTextId = id;
        document.querySelectorAll('.text-box').forEach(function (el) {
            el.classList.toggle('selected', el.dataset.id === id);
        });
        updateTextPropsUI();
        renderObjectList();
    }

    function updateTextPropsUI() {
        var obj = getActiveTextObj();
        if (obj) {
            els.fontFamily.value = obj.fontFamily;
            els.fontSize.value = obj.fontSize;
            els.boldBtn.classList.toggle('active', obj.bold);
            els.italicBtn.classList.toggle('active', obj.italic);
            els.underlineBtn.classList.toggle('active', obj.underline);
            els.strikethroughBtn.classList.toggle('active', obj.strikethrough);
            els.fontColor.value = obj.color;
            els.fontColorText.value = obj.color;
            els.textPropsSection.style.display = 'block';
        } else {
            els.textPropsSection.style.display = state.activeTool === 'text' ? 'block' : 'none';
        }
    }

    function applyTextProp(key, value) {
        var obj = getActiveTextObj();
        if (!obj) return;
        obj[key] = value;
        renderTextBox(obj);
        renderObjectList();
    }

    function renderTextBoxes() {
        var imgObj = getActiveImage();
        if (!imgObj) { els.textLayer.innerHTML = ''; return; }

        var existing = {};
        els.textLayer.querySelectorAll('.text-box').forEach(function (el) {
            existing[el.dataset.id] = el;
        });

        var fragment = document.createDocumentFragment();
        imgObj.textObjects.forEach(function (obj) {
            if (existing[obj.id]) {
                updateTextBoxDOM(existing[obj.id], obj);
                fragment.appendChild(existing[obj.id]);
                delete existing[obj.id];
            } else {
                fragment.appendChild(createTextBoxDOM(obj));
            }
        });

        Object.keys(existing).forEach(function (id) {
            var el = existing[id];
            if (el.parentNode) el.parentNode.removeChild(el);
        });

        els.textLayer.innerHTML = '';
        els.textLayer.appendChild(fragment);
    }

    function renderTextBox(obj) {
        var el = els.textLayer.querySelector('.text-box[data-id="' + obj.id + '"]');
        if (el) updateTextBoxDOM(el, obj);
    }

    function createTextBoxDOM(obj) {
        var div = document.createElement('div');
        div.className = 'text-box' + (obj.id === state.selectedTextId ? ' selected' : '');
        div.dataset.id = obj.id;

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
        el.style.left = toDisplay(obj.x) + 'px';
        el.style.top = toDisplay(obj.y) + 'px';
        el.style.width = toDisplay(obj.width) + 'px';
        el.style.height = toDisplay(obj.height) + 'px';
        el.classList.toggle('selected', obj.id === state.selectedTextId);

        var content = el.querySelector('.text-content');
        if (content && !el.classList.contains('editing')) {
            content.textContent = obj.text;
            applyTextStyle(content, obj, true);
        }
    }

    function applyTextStyle(el, obj, forDisplay) {
        el.style.font = buildFontStr(obj, forDisplay);
        el.style.color = obj.color;
        var decos = [];
        if (obj.underline) decos.push('underline');
        if (obj.strikethrough) decos.push('line-through');
        el.style.textDecoration = decos.length ? decos.join(' ') : 'none';
    }

    function startDrawingRect(e) {
        if (state.activeTool !== 'text') return;
        if (e.target.classList.contains('text-content') || e.target.classList.contains('resize-handle')) return;

        var rect = els.canvasWrapper.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        state.isDrawing = true;
        state.drawStartX = x;
        state.drawStartY = y;

        var selRect = els.selectionRect;
        selRect.style.display = 'block';
        selRect.style.left = x + 'px';
        selRect.style.top = y + 'px';
        selRect.style.width = '0px';
        selRect.style.height = '0px';
    }

    function drawRectMove(e) {
        if (!state.isDrawing) return;
        var rect = els.canvasWrapper.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        var left = Math.min(state.drawStartX, x);
        var top = Math.min(state.drawStartY, y);
        var w = Math.abs(x - state.drawStartX);
        var h = Math.abs(y - state.drawStartY);

        var selRect = els.selectionRect;
        selRect.style.left = left + 'px';
        selRect.style.top = top + 'px';
        selRect.style.width = w + 'px';
        selRect.style.height = h + 'px';
    }

    function endDrawingRect(e) {
        if (!state.isDrawing) return;
        state.isDrawing = false;
        els.selectionRect.style.display = 'none';

        var rect = els.canvasWrapper.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        var left = Math.min(state.drawStartX, x);
        var top = Math.min(state.drawStartY, y);
        var w = Math.abs(x - state.drawStartX);
        var h = Math.abs(y - state.drawStartY);

        if (w < 10 && h < 10) {
            w = toDisplay(200);
            h = toDisplay(40);
            left = state.drawStartX - w / 2;
            top = state.drawStartY - h / 2;
        }

        var imgLeft = Math.max(0, toImage(left));
        var imgTop = Math.max(0, toImage(top));
        var imgW = Math.max(20, toImage(w));
        var imgH = Math.max(16, toImage(h));

        var imgObj = getActiveImage();
        imgW = Math.min(imgW, imgObj.width - imgLeft);
        imgH = Math.min(imgH, imgObj.height - imgTop);

        createTextObj(imgLeft, imgTop, imgW, imgH);
    }

    function createTextObj(x, y, w, h) {
        var imgObj = getActiveImage();
        if (!imgObj) return;

        var obj = {
            id: 'text_' + state.nextTextId++,
            x: x,
            y: y,
            width: w,
            height: h,
            text: '文字',
            fontSize: parseInt(els.fontSize.value) || 32,
            fontFamily: els.fontFamily.value,
            bold: els.boldBtn.classList.contains('active'),
            italic: els.italicBtn.classList.contains('active'),
            underline: els.underlineBtn.classList.contains('active'),
            strikethrough: els.strikethroughBtn.classList.contains('active'),
            color: els.fontColor.value
        };

        imgObj.textObjects.push(obj);
        selectTextObj(obj.id);
        renderTextBoxes();
        renderObjectList();
    }

    function deleteTextObj(id) {
        var imgObj = getActiveImage();
        if (!imgObj) return;
        var idx = imgObj.textObjects.findIndex(function (t) { return t.id === id; });
        if (idx === -1) return;
        imgObj.textObjects.splice(idx, 1);
        if (state.selectedTextId === id) {
            state.selectedTextId = null;
            updateTextPropsUI();
        }
        renderTextBoxes();
        renderObjectList();
    }

    function onTextLayerMouseDown(e) {
        if (state.isEditing) return;

        var target = e.target;

        if (target.classList.contains('resize-handle')) {
            e.preventDefault();
            e.stopPropagation();
            var textBox = target.closest('.text-box');
            var id = textBox.dataset.id;
            var obj = getActiveImage().textObjects.find(function (t) { return t.id === id; });
            if (!obj) return;

            selectTextObj(id);
            state.isResizing = true;
            state.resizeDir = target.dataset.dir;
            state.resizeStartX = e.clientX;
            state.resizeStartY = e.clientY;
            state.resizeOrigX = obj.x;
            state.resizeOrigY = obj.y;
            state.resizeOrigW = obj.width;
            state.resizeOrigH = obj.height;
            return;
        }

        var textBox = target.closest('.text-box');
        if (textBox) {
            e.preventDefault();
            var id = textBox.dataset.id;
            var obj = getActiveImage().textObjects.find(function (t) { return t.id === id; });
            if (!obj) return;

            selectTextObj(id);

            var wrapRect = els.canvasWrapper.getBoundingClientRect();
            state.isDragging = true;
            state.dragOffsetX = e.clientX - wrapRect.left - toDisplay(obj.x);
            state.dragOffsetY = e.clientY - wrapRect.top - toDisplay(obj.y);
            return;
        }

        if (state.activeTool === 'text') {
            e.preventDefault();
            startDrawingRect(e);
            return;
        }

        deselectAll();
    }

    function onMouseMove(e) {
        if (state.isDrawing) {
            drawRectMove(e);
            return;
        }

        if (state.isDragging && state.selectedTextId) {
            var obj = getActiveTextObj();
            if (!obj) return;

            var wrapRect = els.canvasWrapper.getBoundingClientRect();
            var newDisplayX = e.clientX - wrapRect.left - state.dragOffsetX;
            var newDisplayY = e.clientY - wrapRect.top - state.dragOffsetY;

            obj.x = Math.max(0, toImage(newDisplayX));
            obj.y = Math.max(0, toImage(newDisplayY));
            obj.x = Math.min(obj.x, getActiveImage().width - obj.width);
            obj.y = Math.min(obj.y, getActiveImage().height - obj.height);

            var el = els.textLayer.querySelector('.text-box[data-id="' + obj.id + '"]');
            if (el) updateTextBoxDOM(el, obj);
            return;
        }

        if (state.isResizing && state.selectedTextId) {
            var obj = getActiveTextObj();
            if (!obj) return;

            var dx = toImage(e.clientX - state.resizeStartX);
            var dy = toImage(e.clientY - state.resizeStartY);
            var dir = state.resizeDir;
            var newX = state.resizeOrigX;
            var newY = state.resizeOrigY;
            var newW = state.resizeOrigW;
            var newH = state.resizeOrigH;

            if (dir.indexOf('e') !== -1) { newW = state.resizeOrigW + dx; }
            if (dir.indexOf('w') !== -1) { newW = state.resizeOrigW - dx; newX = state.resizeOrigX + dx; }
            if (dir.indexOf('s') !== -1) { newH = state.resizeOrigH + dy; }
            if (dir.indexOf('n') !== -1) { newH = state.resizeOrigH - dy; newY = state.resizeOrigY + dy; }

            if (newW < 20) {
                if (dir.indexOf('w') !== -1) { newX = state.resizeOrigX + state.resizeOrigW - 20; }
                newW = 20;
            }
            if (newH < 16) {
                if (dir.indexOf('n') !== -1) { newY = state.resizeOrigY + state.resizeOrigH - 16; }
                newH = 16;
            }

            obj.x = Math.max(0, newX);
            obj.y = Math.max(0, newY);
            obj.width = newW;
            obj.height = newH;

            var el = els.textLayer.querySelector('.text-box[data-id="' + obj.id + '"]');
            if (el) updateTextBoxDOM(el, obj);
        }
    }

    function onMouseUp(e) {
        if (state.isDrawing) {
            endDrawingRect(e);
            return;
        }

        if (state.isDragging) {
            state.isDragging = false;
            renderObjectList();
            return;
        }

        if (state.isResizing) {
            state.isResizing = false;
            renderObjectList();
        }
    }

    function onTextBoxDblClick(e) {
        var textBox = e.target.closest('.text-box');
        if (!textBox) return;
        e.preventDefault();
        e.stopPropagation();

        var id = textBox.dataset.id;
        var obj = getActiveImage().textObjects.find(function (t) { return t.id === id; });
        if (!obj) return;

        selectTextObj(id);
        startEditing(textBox, obj);
    }

    function startEditing(textBox, obj) {
        state.isEditing = true;
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

    function onEditBlur(e) {
        setTimeout(function () {
            if (state.isEditing) stopEditing();
        }, 100);
    }

    function stopEditing() {
        if (!state.isEditing) return;
        state.isEditing = false;

        var editingEl = els.textLayer.querySelector('.text-box.editing');
        if (!editingEl) return;

        var id = editingEl.dataset.id;
        var obj = getActiveImage().textObjects.find(function (t) { return t.id === id; });
        if (obj) {
            var content = editingEl.querySelector('.text-content');
            obj.text = content.textContent || '文字';
            content.contentEditable = 'false';
            content.removeEventListener('blur', onEditBlur);
        }

        editingEl.classList.remove('editing');
        renderTextBoxes();
        renderObjectList();
    }

    function renderObjectList() {
        var imgObj = getActiveImage();
        if (!imgObj || imgObj.textObjects.length === 0) {
            els.objectList.innerHTML = '<div class="object-empty">暂无对象</div>';
            return;
        }

        var html = '';
        imgObj.textObjects.forEach(function (obj, i) {
            var cls = 'object-item' + (obj.id === state.selectedTextId ? ' selected' : '');
            var name = obj.text.length > 12 ? obj.text.substring(0, 12) + '...' : obj.text;
            html += '<div class="' + cls + '" data-id="' + obj.id + '">';
            html += '<span class="obj-icon">T</span>';
            html += '<span class="obj-name">' + escapeHtml(name) + '</span>';
            html += '<span class="obj-delete" data-del="' + obj.id + '">\u00d7</span>';
            html += '</div>';
        });
        els.objectList.innerHTML = html;

        els.objectList.querySelectorAll('.object-item').forEach(function (item) {
            item.addEventListener('click', function (e) {
                if (e.target.classList.contains('obj-delete')) {
                    deleteTextObj(e.target.dataset.del);
                    return;
                }
                selectTextObj(item.dataset.id);
                renderTextBoxes();
            });
        });

        els.objectList.querySelectorAll('.obj-delete').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                deleteTextObj(btn.dataset.del);
            });
        });
    }

    function exportImage() {
        var imgObj = getActiveImage();
        if (!imgObj) return;

        var canvas = document.createElement('canvas');
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        var ctx = canvas.getContext('2d');

        ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);

        imgObj.textObjects.forEach(function (obj) {
            ctx.save();
            ctx.font = buildFontStr(obj, false);
            ctx.fillStyle = obj.color;
            ctx.textBaseline = 'top';

            var lines = wrapText(ctx, obj.text, obj.width - 8);
            var lineHeight = obj.fontSize * 1.3;
            var startY = obj.y + 2;

            lines.forEach(function (line, i) {
                var y = startY + i * lineHeight;
                ctx.fillText(line, obj.x + 4, y);

                if (obj.underline) {
                    var metrics = ctx.measureText(line);
                    ctx.beginPath();
                    ctx.moveTo(obj.x + 4, y + obj.fontSize + 1);
                    ctx.lineTo(obj.x + 4 + metrics.width, y + obj.fontSize + 1);
                    ctx.strokeStyle = obj.color;
                    ctx.lineWidth = Math.max(1, obj.fontSize / 16);
                    ctx.stroke();
                }

                if (obj.strikethrough) {
                    var metrics = ctx.measureText(line);
                    ctx.beginPath();
                    var midY = y + obj.fontSize * 0.55;
                    ctx.moveTo(obj.x + 4, midY);
                    ctx.lineTo(obj.x + 4 + metrics.width, midY);
                    ctx.strokeStyle = obj.color;
                    ctx.lineWidth = Math.max(1, obj.fontSize / 16);
                    ctx.stroke();
                }
            });

            ctx.restore();
        });

        var link = document.createElement('a');
        link.download = imgObj.name.replace(/\.[^.]+$/, '') + '_edited.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function wrapText(ctx, text, maxWidth) {
        var paragraphs = text.split('\n');
        var lines = [];
        paragraphs.forEach(function (para) {
            if (para === '') { lines.push(''); return; }
            var words = para.split('');
            var line = '';
            for (var i = 0; i < words.length; i++) {
                var testLine = line + words[i];
                var metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && line !== '') {
                    lines.push(line);
                    line = words[i];
                } else {
                    line = testLine;
                }
            }
            if (line) lines.push(line);
        });
        return lines;
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function setupEventListeners() {
        els.uploadBtn.addEventListener('click', function () {
            els.fileInput.click();
        });

        els.exportBtn.addEventListener('click', exportImage);

        els.fileInput.addEventListener('change', function (e) {
            var files = e.target.files;
            for (var i = 0; i < files.length; i++) {
                addImage(files[i]);
            }
            els.fileInput.value = '';
        });

        els.uploadHint.addEventListener('click', function () {
            els.fileInput.click();
        });

        els.canvasContainer.addEventListener('dragover', function (e) {
            e.preventDefault();
            els.canvasContainer.classList.add('drag-over');
        });

        els.canvasContainer.addEventListener('dragleave', function (e) {
            if (!els.canvasContainer.contains(e.relatedTarget)) {
                els.canvasContainer.classList.remove('drag-over');
            }
        });

        els.canvasContainer.addEventListener('drop', function (e) {
            e.preventDefault();
            els.canvasContainer.classList.remove('drag-over');
            var files = e.dataTransfer.files;
            for (var i = 0; i < files.length; i++) {
                if (files[i].type.startsWith('image/')) {
                    addImage(files[i]);
                }
            }
        });

        els.selectTool.addEventListener('click', function () { setTool('select'); });
        els.textTool.addEventListener('click', function () { setTool('text'); });

        els.fontFamily.addEventListener('change', function () {
            applyTextProp('fontFamily', els.fontFamily.value);
        });

        els.fontSize.addEventListener('input', function () {
            var val = parseInt(els.fontSize.value);
            if (val > 0) applyTextProp('fontSize', val);
        });

        els.boldBtn.addEventListener('click', function () {
            var obj = getActiveTextObj();
            if (obj) applyTextProp('bold', !obj.bold);
        });

        els.italicBtn.addEventListener('click', function () {
            var obj = getActiveTextObj();
            if (obj) applyTextProp('italic', !obj.italic);
        });

        els.underlineBtn.addEventListener('click', function () {
            var obj = getActiveTextObj();
            if (obj) applyTextProp('underline', !obj.underline);
        });

        els.strikethroughBtn.addEventListener('click', function () {
            var obj = getActiveTextObj();
            if (obj) applyTextProp('strikethrough', !obj.strikethrough);
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

        els.textLayer.addEventListener('mousedown', onTextLayerMouseDown);
        els.textLayer.addEventListener('dblclick', onTextBoxDblClick);

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        els.zoomSlider.addEventListener('input', function () {
            setZoom(parseInt(els.zoomSlider.value));
        });

        els.zoomOutBtn.addEventListener('click', function () {
            setZoom(state.zoom - 10);
        });

        els.zoomInBtn.addEventListener('click', function () {
            setZoom(state.zoom + 10);
        });

        els.zoomFitBtn.addEventListener('click', fitToView);

        document.addEventListener('keydown', function (e) {
            if (state.isEditing) return;

            if (e.key === 'v' || e.key === 'V') {
                if (!e.ctrlKey && !e.metaKey) setTool('select');
            }
            if (e.key === 't' || e.key === 'T') {
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    setTool('text');
                }
            }
            if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedTextId) {
                if (!state.isEditing) {
                    e.preventDefault();
                    deleteTextObj(state.selectedTextId);
                }
            }
            if (e.key === 'Escape') {
                if (state.isEditing) {
                    stopEditing();
                } else {
                    deselectAll();
                }
            }
        });

        els.canvasContainer.addEventListener('wheel', function (e) {
            if (e.ctrlKey) {
                e.preventDefault();
                var delta = e.deltaY > 0 ? -5 : 5;
                setZoom(state.zoom + delta);
            }
        }, { passive: false });
    }

    setupEventListeners();
    renderObjectList();
})();
