(function () {
    function setTool(tool) {
        App.deactivateAllImgTools();
        App.state.activeTool = tool;
        var els = App.els();
        els.selectTool.classList.toggle('active', tool === 'select');
        els.textTool.classList.toggle('active', tool === 'text');
        els.watermarkTool.classList.toggle('active', tool === 'watermark');
        els.resizeTool.classList.toggle('active', false);
        els.cropTool.classList.toggle('active', false);
        els.rectCropTool.classList.toggle('active', false);
        els.maskTool.classList.toggle('active', false);
        els.rotateTool.classList.toggle('active', false);
        els.sharpenTool.classList.toggle('active', false);
        els.blurTool.classList.toggle('active', false);
        els.mosaicTool.classList.toggle('active', false);
        els.negativeTool.classList.toggle('active', false);
        els.hslTool.classList.toggle('active', false);
        els.localZoomTool.classList.toggle('active', false);
        els.pencilTool.classList.toggle('active', false);

        var wrapper = els.canvasWrapper;
        if (tool === 'text') {
            wrapper.style.cursor = 'crosshair';
        } else if (tool === 'watermark') {
            wrapper.style.cursor = 'default';
        } else {
            wrapper.style.cursor = 'default';
        }
    }

    function activateImgTool(tool) {
        App.deactivateAllImgTools();
        setTool('select');
        App.Text.deselectAll();
        var els = App.els();
        if (tool === 'resize') {
            if (App.ImageResize.activate()) els.resizeTool.classList.add('active');
        } else if (tool === 'crop') {
            if (App.ImageCrop.activateCrop()) els.cropTool.classList.add('active');
        } else if (tool === 'rectcrop') {
            if (App.ImageCrop.activateRectCrop()) els.rectCropTool.classList.add('active');
        } else if (tool === 'mask') {
            if (App.ImageMask.activate()) els.maskTool.classList.add('active');
        } else if (tool === 'rotate') {
            if (App.ImageTransform.activateRotate()) els.rotateTool.classList.add('active');
        } else if (tool === 'sharpen') {
            App.Filters.activate('sharpen');
            els.sharpenTool.classList.add('active');
        } else if (tool === 'blur') {
            App.Filters.activate('blur');
            els.blurTool.classList.add('active');
        } else if (tool === 'mosaic') {
            App.Filters.activate('mosaic');
            els.mosaicTool.classList.add('active');
        } else if (tool === 'negative') {
            App.Filters.activate('negative');
        } else if (tool === 'hsl') {
            App.Filters.activateHsl();
            els.hslTool.classList.add('active');
        } else if (tool === 'localzoom') {
            App.LocalZoom.activate();
            els.localZoomTool.classList.add('active');
        } else if (tool === 'pencil') {
            App.Pencil.activate();
            els.pencilTool.classList.add('active');
        }
        updateRightPanel();
    }

    function updateRightPanel() {
        var els = App.els();
        var obj = App.getActiveObj();

        els.textPropsSection.style.display = (obj && obj.type === 'text') ? 'block' : 'none';
        els.watermarkPropsSection.style.display = (obj && obj.type === 'watermark') ? 'block' : 'none';

        if (App.state.activeImgTool === 'resize') {
        } else {
            els.resizePropsSection.style.display = 'none';
        }
        if (App.state.activeImgTool === 'crop') {
        } else {
            els.cropPropsSection.style.display = 'none';
        }
        if (App.state.activeImgTool === 'rectcrop') {
        } else {
            els.rectCropPropsSection.style.display = 'none';
        }
        if (App.state.activeImgTool === 'mask') {
        } else {
            els.maskPropsSection.style.display = 'none';
        }
        if (App.state.activeImgTool === 'rotate') {
        } else {
            els.rotatePropsSection.style.display = 'none';
        }
        if (App.state.activeImgTool === 'filter') {
        } else {
            els.filterPropsSection.style.display = 'none';
        }
        if (App.state.activeImgTool === 'hsl') {
        } else {
            els.hslPropsSection.style.display = 'none';
        }
        if (App.state.activeImgTool === 'localzoom') {
        } else {
            els.localZoomPropsSection.style.display = 'none';
        }
        if (App.state.activeImgTool === 'pencil') {
        } else {
            els.pencilPropsSection.style.display = 'none';
        }

        if (obj && obj.type === 'text') {
            App.TextStyle.updateUIForSelected();
        } else if (obj && obj.type === 'watermark') {
            App.Watermark.updateUIForSelected();
        }
    }

    function getImgCoords(e) {
        var els = App.els();
        var rect = els.canvasWrapper.getBoundingClientRect();
        var x = (e.clientX - rect.left);
        var y = (e.clientY - rect.top);
        return {
            x: App.toImage(x),
            y: App.toImage(y)
        };
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

    function setupMirrorEvents() {
        var els = App.els();
        els.mirrorHBtn.addEventListener('click', function () {
            if (!App.getActiveImage()) { App.showToast('请先打开一张图片'); return; }
            if (App.ImageTransform) App.ImageTransform.doMirrorH();
        });
        els.mirrorVBtn.addEventListener('click', function () {
            if (!App.getActiveImage()) { App.showToast('请先打开一张图片'); return; }
            if (App.ImageTransform) App.ImageTransform.doMirrorV();
        });
    }

    function setupFilterEvents() {
        var els = App.els();
        if (!els.createFilterSel) return;
        els.createFilterSel.addEventListener('click', function () {
            App.Filters.createSelection();
        });
        if (els.clearFilterSel) {
            els.clearFilterSel.addEventListener('click', function () {
                App.Filters.clearPolygon();
            });
        }
        if (els.filterSelType) {
            els.filterSelType.addEventListener('change', function () {
                App.Filters.renderSizeInputs();
            });
        }
        if (els.filterStrength) {
            els.filterStrength.addEventListener('input', function () {
                if (els.filterStrengthDisp) els.filterStrengthDisp.textContent = els.filterStrength.value;
            });
        }
        if (els.mosaicSize) {
            els.mosaicSize.addEventListener('input', function () {
                if (els.mosaicSizeDisp) els.mosaicSizeDisp.textContent = els.mosaicSize.value;
            });
        }
        if (els.applyFilter) {
            els.applyFilter.addEventListener('click', function () {
                App.Filters.apply();
            });
        }

        if (els.hueAdjust) {
            els.hueAdjust.addEventListener('input', function () { App.Filters.refreshHslLabels(); });
        }
        if (els.satAdjust) {
            els.satAdjust.addEventListener('input', function () { App.Filters.refreshHslLabels(); });
        }
        if (els.lumAdjust) {
            els.lumAdjust.addEventListener('input', function () { App.Filters.refreshHslLabels(); });
        }
        if (els.resetHsl) {
            els.resetHsl.addEventListener('click', function () {
                App.Filters.resetHslVals();
                App.Filters.refreshHslLabels();
            });
        }
        if (els.applyHsl) {
            els.applyHsl.addEventListener('click', function () {
                App.Filters.applyHsl();
            });
        }
    }

    function setupLocalZoomEvents() {
        var els = App.els();
        if (!els.createLzSel) return;
        els.createLzSel.addEventListener('click', function () {
            App.LocalZoom.createSelection();
        });
        if (els.lzZoom) {
            els.lzZoom.addEventListener('input', function () {
                App.LocalZoom.refreshZoomLabel();
            });
        }
    }

    function setupPencilEvents() {
        var els = App.els();
        if (!els.pencilColor) return;
        els.pencilColor.addEventListener('input', function () {
            if (els.pencilColorText) els.pencilColorText.value = els.pencilColor.value;
        });
        if (els.pencilColorText) {
            els.pencilColorText.addEventListener('change', function () {
                var v = els.pencilColorText.value.trim();
                if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                    els.pencilColor.value = v;
                } else {
                    els.pencilColorText.value = els.pencilColor.value;
                }
            });
        }
        if (els.pencilOpacity) {
            els.pencilOpacity.addEventListener('input', function () {
                App.Pencil.refreshOpacityLabel();
            });
        }
        if (els.clearPencilLayer) {
            els.clearPencilLayer.addEventListener('click', function () {
                if (confirm('确定要清除所有铅笔绘制吗？')) {
                    App.Pencil.clearPencilLayer();
                }
            });
        }
    }

    function setupToolEvents() {
        var els = App.els();

        els.selectTool.addEventListener('click', function () { setTool('select'); });
        els.textTool.addEventListener('click', function () { setTool('text'); });
        els.watermarkTool.addEventListener('click', function () {
            setTool('watermark');
            els.watermarkInput.click();
        });
        els.resizeTool.addEventListener('click', function () { activateImgTool('resize'); });
        els.cropTool.addEventListener('click', function () { activateImgTool('crop'); });
        els.rectCropTool.addEventListener('click', function () { activateImgTool('rectcrop'); });
        els.maskTool.addEventListener('click', function () { activateImgTool('mask'); });
        els.rotateTool.addEventListener('click', function () { activateImgTool('rotate'); });
        els.sharpenTool.addEventListener('click', function () { activateImgTool('sharpen'); });
        els.blurTool.addEventListener('click', function () { activateImgTool('blur'); });
        els.mosaicTool.addEventListener('click', function () { activateImgTool('mosaic'); });
        els.negativeTool.addEventListener('click', function () { activateImgTool('negative'); });
        els.hslTool.addEventListener('click', function () { activateImgTool('hsl'); });
        els.localZoomTool.addEventListener('click', function () { activateImgTool('localzoom'); });
        els.pencilTool.addEventListener('click', function () { activateImgTool('pencil'); });

        document.addEventListener('keydown', function (e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
            if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) return;
            if (e.key === 'v' || e.key === 'V') { setTool('select'); }
            else if (e.key === 't' || e.key === 'T') { setTool('text'); }
            else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (App.state.selectedObjId) App.Text.deleteObject(App.state.selectedObjId);
            } else if (e.key === 'Escape') {
                App.deactivateAllImgTools();
                App.Text.deselectAll();
                updateRightPanel();
            } else if (e.key === 'Enter') {
                if (App.state.activeImgTool === 'pencil' && App.Pencil) {
                    if (App.state.pencilCurveAnchors && App.state.pencilCurveAnchors.length >= 2) {
                        App.Pencil.finishCurve();
                    }
                }
            }
        });
    }

    function setupCanvasEvents() {
        var els = App.els();
        var wrapper = els.canvasWrapper;

        wrapper.addEventListener('mousedown', function (e) {
            var editingEl = document.querySelector('.text-box.editing');
            if (editingEl && !editingEl.contains(e.target)) {
                App.Text.stopEditing();
            }

            var box = e.target.closest('.text-box, .watermark-box, .localzoom-box, .localzoom-source');
            var resizeHandle = e.target.closest('.resize-handle');
            var rotateHandle = e.target.closest('.watermark-rotate');

            if (rotateHandle) {
                e.stopPropagation();
                e.preventDefault();
                var wm = box;
                startRotate(wm, e);
                return;
            }

            if (resizeHandle && box && !box.classList.contains('localzoom-source') && !box.classList.contains('localzoom-box')) {
                e.stopPropagation();
                e.preventDefault();
                startResize(box, resizeHandle.dataset.dir, e);
                return;
            }

            if (box && !box.classList.contains('localzoom-source') && !box.classList.contains('localzoom-box')) {
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

            var coords = getImgCoords(e);

            if (App.state.activeImgTool === 'pencil' && App.Pencil) {
                e.preventDefault();
                e.stopPropagation();
                App.Pencil.onCanvasMouseDown(coords.x, coords.y, e);
                return;
            }

            if (App.state.activeImgTool === 'filter' && App.Filters) {
                e.preventDefault();
                e.stopPropagation();
                App.Filters.onImageClick(coords.x, coords.y);
                return;
            }

            if (App.state.activeImgTool === 'mask') {
                App.ImageMask.onImgClick(e);
                return;
            }

            if (App.state.activeTool === 'text') {
                App.Text.startDrawingRect(e);
            } else if (App.state.activeTool === 'select' && !box) {
                App.Text.deselectAll();
            }
        });

        wrapper.addEventListener('mousemove', function (e) {
            var coords = getImgCoords(e);

            if (App.state.activeImgTool === 'pencil' && App.Pencil) {
                App.Pencil.onCanvasMouseMove(coords.x, coords.y, e);
            }
        });

        wrapper.addEventListener('mouseup', function (e) {
            var coords = getImgCoords(e);

            if (App.state.activeImgTool === 'pencil' && App.Pencil) {
                App.Pencil.onCanvasMouseUp(coords.x, coords.y, e);
            }
        });

        wrapper.addEventListener('click', function (e) {
            var coords = getImgCoords(e);
            if (App.state.activeImgTool === 'pencil' && App.Pencil) {
                App.Pencil.onCanvasClick(coords.x, coords.y, e);
            }
        });

        wrapper.addEventListener('dblclick', function (e) {
            var coords = getImgCoords(e);

            if (App.state.activeImgTool === 'pencil' && App.Pencil) {
                App.Pencil.onCanvasDblClick(coords.x, coords.y, e);
                return;
            }

            if (App.state.activeImgTool === 'filter' && App.Filters) {
                App.Filters.onImageDblClick();
                return;
            }

            if (App.state.activeImgTool === 'mask') {
                App.ImageMask.onImgDblClick(e);
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
        var maxX = imgObj.width - (obj.width || (obj.srcW * (obj.scale || 1)));
        var maxY = imgObj.height - (obj.height || (obj.srcH * (obj.scale || 1)));
        maxX = Math.max(0, maxX);
        maxY = Math.max(0, maxY);

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
            if (App.History) App.History.render();
        });

        document.addEventListener('image:closed', function () {
            App.Text.renderAllObjects();
            App.Objects.renderObjectList();
            updateRightPanel();
            if (App.History) App.History.render();
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

        document.addEventListener('tool:deactivated', function () {
            updateRightPanel();
        });
    }

    function init() {
        App.initEls();
        App.showUploadHint();
        setTool('select');

        setupImageEvents();
        setupToolEvents();
        setupMirrorEvents();
        setupFilterEvents();
        setupLocalZoomEvents();
        setupPencilEvents();
        setupCanvasEvents();
        setupGlobalListeners();

        App.TextStyle.setupEvents();
        App.Watermark.setupEvents();
        App.Export.setupEvents();
        App.ImageResize.setupEvents();
        App.ImageCrop.setupEvents();
        App.ImageMask.setupEvents();
        App.ImageTransform.setupEvents();

        App.Objects.renderObjectList();
        updateRightPanel();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
