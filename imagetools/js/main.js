(function () {
    function setTool(tool) {
        App.state.activeTool = tool;
        var els = App.els();
        els.selectTool.classList.toggle('active', tool === 'select');
        els.textTool.classList.toggle('active', tool === 'text');
        els.watermarkTool.classList.toggle('active', tool === 'watermark');

        var wrapper = els.canvasWrapper;
        if (tool === 'text') {
            wrapper.style.cursor = 'crosshair';
        } else if (tool === 'watermark') {
            wrapper.style.cursor = 'default';
        } else {
            wrapper.style.cursor = 'default';
        }
    }

    function updateRightPanel() {
        var els = App.els();
        var obj = App.getActiveObj();

        els.textPropsSection.style.display = (obj && obj.type === 'text') ? 'block' : 'none';
        els.watermarkPropsSection.style.display = (obj && obj.type === 'watermark') ? 'block' : 'none';

        if (obj && obj.type === 'text') {
            App.TextStyle.updateUIForSelected();
        } else if (obj && obj.type === 'watermark') {
            App.Watermark.updateUIForSelected();
        }
    }

    function setupImageEvents() {
        var els = App.els();

        els.uploadBtn.addEventListener('click', function () {
            els.fileInput.click();
        });

        els.fileInput.addEventListener('change', function (e) {
            if (e.target.files[0]) App.Images.addImage(e.target.files[0]);
            els.fileInput.value = '';
        });

        els.canvasContainer.addEventListener('dragover', function (e) {
            e.preventDefault();
            els.canvasContainer.classList.add('drag-over');
        });

        els.canvasContainer.addEventListener('dragleave', function () {
            els.canvasContainer.classList.remove('drag-over');
        });

        els.canvasContainer.addEventListener('drop', function (e) {
            e.preventDefault();
            els.canvasContainer.classList.remove('drag-over');
            if (e.dataTransfer.files[0]) App.Images.addImage(e.dataTransfer.files[0]);
        });

        els.zoomOutBtn.addEventListener('click', function () {
            App.Images.setZoom(App.state.zoom - 10);
        });

        els.zoomInBtn.addEventListener('click', function () {
            App.Images.setZoom(App.state.zoom + 10);
        });

        els.zoomFitBtn.addEventListener('click', App.Images.fitToView);

        els.zoomSlider.addEventListener('input', function () {
            App.Images.setZoom(parseInt(els.zoomSlider.value));
        });
    }

    function setupToolEvents() {
        var els = App.els();

        els.selectTool.addEventListener('click', function () { setTool('select'); });
        els.textTool.addEventListener('click', function () { setTool('text'); });
        els.watermarkTool.addEventListener('click', function () {
            setTool('watermark');
            els.watermarkInput.click();
        });

        document.addEventListener('keydown', function (e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
            if (e.key === 'v' || e.key === 'V') { setTool('select'); }
            else if (e.key === 't' || e.key === 'T') { setTool('text'); }
            else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (App.state.selectedObjId) App.Text.deleteObject(App.state.selectedObjId);
            }
        });
    }

    function setupCanvasEvents() {
        var els = App.els();

        els.canvasWrapper.addEventListener('mousedown', function (e) {
            var editingEl = document.querySelector('.text-box.editing');
            if (editingEl && !editingEl.contains(e.target)) {
                App.Text.stopEditing();
            }

            var box = e.target.closest('.text-box, .watermark-box');
            var resizeHandle = e.target.closest('.resize-handle');
            var rotateHandle = e.target.closest('.watermark-rotate');

            if (rotateHandle) {
                e.stopPropagation();
                e.preventDefault();
                var wm = box;
                startRotate(wm, e);
                return;
            }

            if (resizeHandle && box) {
                e.stopPropagation();
                e.preventDefault();
                startResize(box, resizeHandle.dataset.dir, e);
                return;
            }

            if (box) {
                e.stopPropagation();
                var id = box.dataset.id;
                App.Text.selectObject(id);

                if (box.dataset.type === 'text' && e.detail >= 2 && !resizeHandle) {
                    var obj = App.getActiveObj();
                    if (obj) App.Text.startEditing(box, obj);
                    return;
                }

                startDrag(box, e);
                return;
            }

            if (App.state.activeTool === 'text') {
                App.Text.startDrawingRect(e);
            } else if (App.state.activeTool === 'select' && !box) {
                App.Text.deselectAll();
            }
        });

        document.addEventListener('mousemove', function (e) {
            if (App.state.isDrawing) {
                App.Text.drawRectMove(e);
            } else if (App.state.isDragging) {
                doDrag(e);
            } else if (App.state.isResizing) {
                doResize(e);
            } else if (App.state.isRotating) {
                doRotate(e);
            }
        });

        document.addEventListener('mouseup', function (e) {
            if (App.state.isDrawing) App.Text.endDrawingRect(e);
            if (App.state.isDragging) {
                App.state.isDragging = false;
                App.trigger('objects:changed');
            }
            if (App.state.isResizing) {
                App.state.isResizing = false;
                App.trigger('objects:changed');
            }
            if (App.state.isRotating) {
                App.state.isRotating = false;
                App.trigger('objects:changed');
            }
        });
    }

    function startDrag(el, e) {
        var obj = App.getActiveImage().objects.find(function (o) { return o.id === el.dataset.id; });
        if (!obj) return;

        App.state.isDragging = true;
        App.state.dragOffsetX = e.clientX - App.toDisplay(obj.x);
        App.state.dragOffsetY = e.clientY - App.toDisplay(obj.y);
    }

    function doDrag(e) {
        var obj = App.getActiveObj();
        if (!obj) return;
        var imgObj = App.getActiveImage();
        var maxX = imgObj.width - obj.width;
        var maxY = imgObj.height - obj.height;

        var newX = App.clamp(App.toImage(e.clientX - App.state.dragOffsetX), 0, maxX);
        var newY = App.clamp(App.toImage(e.clientY - App.state.dragOffsetY), 0, maxY);

        obj.x = newX;
        obj.y = newY;
        App.Text.renderOne(obj);
    }

    function startResize(el, dir, e) {
        var obj = App.getActiveImage().objects.find(function (o) { return o.id === el.dataset.id; });
        if (!obj) return;

        App.state.isResizing = true;
        App.state.resizeDir = dir;
        App.state.resizeStartX = e.clientX;
        App.state.resizeStartY = e.clientY;
        App.state.resizeOrigX = obj.x;
        App.state.resizeOrigY = obj.y;
        App.state.resizeOrigW = obj.width;
        App.state.resizeOrigH = obj.height;
    }

    function doResize(e) {
        var obj = App.getActiveObj();
        if (!obj) return;
        var imgObj = App.getActiveImage();

        var dx = App.toImage(e.clientX - App.state.resizeStartX);
        var dy = App.toImage(e.clientY - App.state.resizeStartY);

        var x = App.state.resizeOrigX;
        var y = App.state.resizeOrigY;
        var w = App.state.resizeOrigW;
        var h = App.state.resizeOrigH;

        var d = App.state.resizeDir;
        if (d.indexOf('e') !== -1) w = Math.max(10, w + dx);
        if (d.indexOf('s') !== -1) h = Math.max(10, h + dy);
        if (d.indexOf('w') !== -1) {
            var nw = Math.max(10, w - dx);
            x = x + (w - nw);
            w = nw;
        }
        if (d.indexOf('n') !== -1) {
            var nh = Math.max(10, h - dy);
            y = y + (h - nh);
            h = nh;
        }

        x = App.clamp(x, 0, imgObj.width - w);
        y = App.clamp(y, 0, imgObj.height - h);
        w = Math.min(w, imgObj.width - x);
        h = Math.min(h, imgObj.height - y);

        obj.x = x;
        obj.y = y;
        obj.width = w;
        obj.height = h;
        App.Text.renderOne(obj);
    }

    function startRotate(el, e) {
        var obj = App.getActiveImage().objects.find(function (o) { return o.id === el.dataset.id; });
        if (!obj) return;

        App.state.isRotating = true;
        App.state.rotateOrigAngle = obj.rotation;

        var wrapper = App.els().canvasWrapper;
        var rect = wrapper.getBoundingClientRect();
        var cx = App.toDisplay(obj.x + obj.width / 2) + rect.left;
        var cy = App.toDisplay(obj.y + obj.height / 2) + rect.top;

        App.state.rotateStartAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
    }

    function doRotate(e) {
        var obj = App.getActiveObj();
        if (!obj) return;

        var wrapper = App.els().canvasWrapper;
        var rect = wrapper.getBoundingClientRect();
        var cx = App.toDisplay(obj.x + obj.width / 2) + rect.left;
        var cy = App.toDisplay(obj.y + obj.height / 2) + rect.top;

        var curAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
        var delta = curAngle - App.state.rotateStartAngle;
        var angle = Math.round(App.state.rotateOrigAngle + delta);
        obj.rotation = ((angle % 360) + 360) % 360;
        App.Text.renderOne(obj);
        if (obj.type === 'watermark') App.Watermark.updateUIForSelected();
    }

    function setupGlobalListeners() {
        document.addEventListener('image:switched', function () {
            App.Text.renderAllObjects();
            App.Objects.renderObjectList();
            updateRightPanel();
        });

        document.addEventListener('image:closed', function () {
            App.Text.renderAllObjects();
            App.Objects.renderObjectList();
            updateRightPanel();
        });

        document.addEventListener('zoom:changed', function () {
            App.Text.renderAllObjects();
        });

        document.addEventListener('object:selected', function () {
            App.Objects.renderObjectList();
            updateRightPanel();
        });

        document.addEventListener('object:deselected', function () {
            App.Objects.renderObjectList();
            updateRightPanel();
        });

        document.addEventListener('objects:changed', function () {
            App.Objects.renderObjectList();
            App.Text.renderAllObjects();
        });
    }

    function init() {
        App.initEls();
        App.showUploadHint();
        setTool('select');

        setupImageEvents();
        setupToolEvents();
        setupCanvasEvents();
        setupGlobalListeners();

        App.TextStyle.setupEvents();
        App.Watermark.setupEvents();
        App.Export.setupEvents();

        App.Objects.renderObjectList();
        updateRightPanel();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
