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
            if (App.ImageTransform) App.ImageTransform.mirrorHorizontal();
        });
        els.mirrorVBtn.addEventListener('click', function () {
            if (!App.getActiveImage()) { App.showToast('请先打开一张图片'); return; }
            if (App.ImageTransform) App.ImageTransform.mirrorVertical();
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

    function setupTooltipSystem() {
        var tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        document.body.appendChild(tooltip);

        var showDelay = 250;
        var hideDelay = 100;
        var showTimer = null;
        var hideTimer = null;

        function showTip(target, e) {
            var tip = target.dataset.tip;
            if (!tip) return;
            var parts = tip.split('|');
            var title = parts[0] || '';
            var desc = parts[1] || '';

            tooltip.innerHTML =
                '<div class="tip-title">' + title + '</div>' +
                (desc ? '<div class="tip-desc">' + desc + '</div>' : '');

            clearTimeout(hideTimer);
            clearTimeout(showTimer);

            showTimer = setTimeout(function () {
                var rect = target.getBoundingClientRect();
                var tipRect = tooltip.getBoundingClientRect();
                var x = rect.left + (rect.width / 2) - (tipRect.width / 2);
                var y = rect.bottom + 10;

                if (x < 8) x = 8;
                if (x + tipRect.width > window.innerWidth - 8) {
                    x = window.innerWidth - tipRect.width - 8;
                }
                if (y + tipRect.height > window.innerHeight - 8) {
                    y = rect.top - tipRect.height - 10;
                }

                tooltip.style.left = x + 'px';
                tooltip.style.top = y + 'px';
                tooltip.classList.add('visible');
            }, showDelay);
        }

        function hideTip() {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
            hideTimer = setTimeout(function () {
                tooltip.classList.remove('visible');
            }, hideDelay);
        }

        document.addEventListener('mouseover', function (e) {
            var target = e.target.closest('[data-tip]');
            if (target) showTip(target, e);
        });

        document.addEventListener('mouseout', function (e) {
            var target = e.target.closest('[data-tip]');
            if (target) hideTip();
        });

        document.addEventListener('mousemove', function (e) {
            if (tooltip.classList.contains('visible')) {
                var target = e.target.closest('[data-tip]');
                if (!target) hideTip();
            }
        });
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function getImageMetadata() {
        var img = App.getActiveImage();
        if (!img) return null;

        var meta = {
            basic: {},
            file: {},
            display: {},
            pixels: {}
        };

        meta.basic = {
            width: img.width + ' px',
            height: img.height + ' px',
            resolution: img.width + ' × ' + img.height,
            aspectRatio: (img.width / img.height).toFixed(4) + ' : 1',
            totalPixels: (img.width * img.height).toLocaleString(),
            megapixels: (img.width * img.height / 1000000).toFixed(2) + ' MP'
        };

        if (img.file) {
            var f = img.file;
            var fname = f.name || '';
            var ext = fname.indexOf('.') > -1 ? fname.split('.').pop().toUpperCase() : 'UNKNOWN';
            var lastMod = f.lastModified ? new Date(f.lastModified) : null;

            meta.file = {
                fileName: f.name || '（已修改，未保存）',
                fileType: f.type || 'image/' + ext.toLowerCase(),
                fileFormat: ext,
                fileSize: f.size ? formatBytes(f.size) : '—',
                rawSize: f.size ? f.size.toLocaleString() + ' bytes' : '—',
                lastModified: lastMod ? lastMod.toLocaleString('zh-CN') : '—'
            };
        } else {
            meta.file = {
                fileName: '（新文件，未保存）',
                fileType: '—',
                fileFormat: '—',
                fileSize: '—',
                rawSize: '—',
                lastModified: '—'
            };
        }

        var zoom = App.state.zoom || 100;
        var dispW = Math.round(img.width * zoom / 100);
        var dispH = Math.round(img.height * zoom / 100);

        meta.display = {
            zoomLevel: zoom + '%',
            displaySize: dispW + ' × ' + dispH + ' px',
            fitMode: '自适应窗口',
            colorDepth: '24-bit RGB (每通道8位)',
            colorChannels: 'R · G · B (Alpha: ' + (img.hasTransparency ? '是' : '否') + ')'
        };

        var canvas = App.els().mainCanvas;
        if (canvas) {
            try {
                var ctx = canvas.getContext('2d', { willReadFrequently: true });
                var w = Math.min(img.width, 300);
                var h = Math.min(img.height, 300);
                var sx = img.width > w ? Math.floor((img.width - w) / 2) : 0;
                var sy = img.height > h ? Math.floor((img.height - h) / 2) : 0;
                var sw = Math.min(w, img.width);
                var sh = Math.min(h, img.height);
                var data = ctx.getImageData(sx, sy, sw, sh).data;
                var total = data.length / 4;
                var rSum = 0, gSum = 0, bSum = 0;
                var opaque = 0;
                for (var i = 0; i < data.length; i += 4) {
                    rSum += data[i];
                    gSum += data[i + 1];
                    bSum += data[i + 2];
                    if (data[i + 3] > 0) opaque++;
                }
                meta.pixels = {
                    sampledPixels: total.toLocaleString() + ' (采样)',
                    avgBrightness: Math.round((rSum + gSum + bSum) / (3 * total)),
                    avgR: Math.round(rSum / total),
                    avgG: Math.round(gSum / total),
                    avgB: Math.round(bSum / total),
                    avgColor: 'rgb(' + Math.round(rSum / total) + ', ' + Math.round(gSum / total) + ', ' + Math.round(bSum / total) + ')',
                    opaqueRatio: ((opaque / total) * 100).toFixed(1) + '%'
                };
            } catch (err) {
                meta.pixels = {
                    sampledPixels: '（无法读取）',
                    avgBrightness: '—',
                    avgR: '—',
                    avgG: '—',
                    avgB: '—',
                    avgColor: '—',
                    opaqueRatio: '—'
                };
            }
        }

        return meta;
    }

    function buildInfoHtml(meta) {
        function section(title) {
            return '<div class="info-section-title">' + title + '</div>';
        }
        function row(label, value) {
            return '<div class="info-row"><div class="info-label">' + label + '</div><div class="info-value">' + value + '</div></div>';
        }
        function grid(rows) {
            return '<div class="info-grid">' + rows + '</div>';
        }

        var html = '';
        html += section('基础信息');
        html += grid(
            row('宽度', meta.basic.width) +
            row('高度', meta.basic.height) +
            row('分辨率', meta.basic.resolution) +
            row('宽高比', meta.basic.aspectRatio) +
            row('总像素', meta.basic.totalPixels) +
            row('百万像素', meta.basic.megapixels)
        );

        html += section('文件信息');
        html += grid(
            row('文件名', meta.file.fileName) +
            row('格式', meta.file.fileFormat) +
            row('MIME类型', meta.file.fileType) +
            row('文件大小', meta.file.fileSize) +
            row('原始大小', meta.file.rawSize) +
            row('修改时间', meta.file.lastModified)
        );

        html += section('显示信息');
        html += grid(
            row('缩放比例', meta.display.zoomLevel) +
            row('显示尺寸', meta.display.displaySize) +
            row('适配模式', meta.display.fitMode) +
            row('色彩深度', meta.display.colorDepth) +
            row('颜色通道', meta.display.colorChannels)
        );

        html += section('像素统计');
        html += grid(
            row('采样像素', meta.pixels.sampledPixels) +
            row('平均亮度', meta.pixels.avgBrightness + ' / 255') +
            row('平均 R', meta.pixels.avgR) +
            row('平均 G', meta.pixels.avgG) +
            row('平均 B', meta.pixels.avgB) +
            row('平均色', meta.pixels.avgColor) +
            row('不透明率', meta.pixels.opaqueRatio)
        );

        return html;
    }

    function setupInfoModal() {
        var els = App.els();
        if (!els.infoBtn || !els.infoModal) return;

        function openInfo() {
            var img = App.getActiveImage();
            if (!img) { App.showToast('请先打开一张图片'); return; }

            var meta = getImageMetadata();
            if (!meta) return;

            els.infoModal.querySelector('.modal-body').innerHTML = buildInfoHtml(meta);
            els.infoModal.style.display = 'flex';
        }

        function closeInfo() {
            els.infoModal.style.display = 'none';
        }

        els.infoBtn.addEventListener('click', openInfo);
        els.infoModal.addEventListener('click', function (e) {
            if (e.target === els.infoModal || e.target.classList.contains('modal-close')) {
                closeInfo();
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && els.infoModal.style.display === 'flex') {
                closeInfo();
            }
        });
    }

    function computeHistogramData(channel) {
        var img = App.getActiveImage();
        var canvas = App.els().mainCanvas;
        if (!img || !canvas) return null;

        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        var data;
        try {
            data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        } catch (err) {
            return null;
        }

        var hist = new Array(256).fill(0);
        var total = 0;
        var minV = 255, maxV = 0;
        var sumV = 0;

        for (var i = 0; i < data.length; i += 4) {
            var v;
            if (channel === 'r') v = data[i];
            else if (channel === 'g') v = data[i + 1];
            else if (channel === 'b') v = data[i + 2];
            else if (channel === 'a') v = data[i + 3];
            else v = Math.round((data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114));

            hist[v]++;
            total++;
            if (v < minV) minV = v;
            if (v > maxV) maxV = v;
            sumV += v;
        }

        var meanV = total > 0 ? sumV / total : 0;
        var variance = 0;
        var medianV = 0;
        var p25 = 0, p75 = 0;
        if (total > 0) {
            for (var j = 0; j < 256; j++) {
                variance += hist[j] * (j - meanV) * (j - meanV);
            }
            variance = variance / total;

            var acc = 0;
            var p25Count = Math.floor(total * 0.25);
            var p50Count = Math.floor(total * 0.5);
            var p75Count = Math.floor(total * 0.75);
            for (var k = 0; k < 256; k++) {
                acc += hist[k];
                if (p25 === 0 && acc >= p25Count) p25 = k;
                if (medianV === 0 && acc >= p50Count) medianV = k;
                if (p75 === 0 && acc >= p75Count) { p75 = k; break; }
            }
        }

        var maxCount = 0;
        for (var m = 0; m < 256; m++) {
            if (hist[m] > maxCount) maxCount = hist[m];
        }

        return {
            hist: hist,
            max: maxCount,
            min: minV,
            maxV: maxV,
            mean: meanV,
            median: medianV,
            std: Math.sqrt(variance),
            p25: p25,
            p75: p75,
            total: total
        };
    }

    function getChannelColor(channel) {
        if (channel === 'r') return '#ff5555';
        if (channel === 'g') return '#55dd55';
        if (channel === 'b') return '#5599ff';
        if (channel === 'a') return '#dddddd';
        if (channel === 'rgb') return '#cccccc';
        return '#d0d0d0';
    }

    function renderHistogram(channel) {
        var data = computeHistogramData(channel);
        var canvas = document.getElementById('histogramCanvas');
        if (!canvas || !data) return;

        var dpr = window.devicePixelRatio || 1;
        var w = canvas.clientWidth;
        var h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (var gx = 0; gx <= 4; gx++) {
            var x = (w - 1) * (gx / 4);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (var gy = 0; gy <= 4; gy++) {
            var y = (h - 1) * (gy / 4);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        var color = getChannelColor(channel);
        var hist = data.hist;
        var maxCount = data.max || 1;
        var padding = 2;

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;

        if (channel === 'rgb') {
            var rData = computeHistogramData('r');
            var gData = computeHistogramData('g');
            var bData = computeHistogramData('b');
            if (rData && gData && bData) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#ff5555';
                for (var i = 0; i < 256; i++) {
                    var bh = Math.max(1, (rData.hist[i] / maxCount) * (h - padding * 2));
                    var bx = (i / 255) * (w - 2) + 1;
                    ctx.fillRect(bx - 0.5, h - padding - bh, 2, bh);
                }
                ctx.fillStyle = '#55dd55';
                for (var i2 = 0; i2 < 256; i2++) {
                    var bh2 = Math.max(1, (gData.hist[i2] / maxCount) * (h - padding * 2));
                    var bx2 = (i2 / 255) * (w - 2) + 1;
                    ctx.fillRect(bx2 - 0.5, h - padding - bh2, 2, bh2);
                }
                ctx.fillStyle = '#5599ff';
                for (var i3 = 0; i3 < 256; i3++) {
                    var bh3 = Math.max(1, (bData.hist[i3] / maxCount) * (h - padding * 2));
                    var bx3 = (i3 / 255) * (w - 2) + 1;
                    ctx.fillRect(bx3 - 0.5, h - padding - bh3, 2, bh3);
                }
            }
        } else {
            for (var n = 0; n < 256; n++) {
                var barH = Math.max(1, (hist[n] / maxCount) * (h - padding * 2));
                var barX = (n / 255) * (w - 2) + 1;
                ctx.fillRect(barX - 0.5, h - padding - barH, 2, barH);
            }
        }

        ctx.globalAlpha = 1;
        var meanX = (data.mean / 255) * (w - 2) + 1;
        ctx.strokeStyle = 'rgba(255,215,0,0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(meanX, 4);
        ctx.lineTo(meanX, h - 4);
        ctx.stroke();
        ctx.setLineDash([]);

        var stats = document.getElementById('histogramStats');
        if (stats) {
            stats.innerHTML =
                '<div class="stats-row">' +
                '<div class="stat-item"><div class="stat-label">最小值</div><div class="stat-value">' + data.min + '</div></div>' +
                '<div class="stat-item"><div class="stat-label">最大值</div><div class="stat-value">' + data.maxV + '</div></div>' +
                '<div class="stat-item"><div class="stat-label">均值</div><div class="stat-value">' + data.mean.toFixed(1) + '</div></div>' +
                '<div class="stat-item"><div class="stat-label">中位数</div><div class="stat-value">' + data.median + '</div></div>' +
                '</div>' +
                '<div class="stats-row" style="margin-top:10px;">' +
                '<div class="stat-item"><div class="stat-label">标准差</div><div class="stat-value">' + data.std.toFixed(1) + '</div></div>' +
                '<div class="stat-item"><div class="stat-label">25%分位</div><div class="stat-value">' + data.p25 + '</div></div>' +
                '<div class="stat-item"><div class="stat-label">75%分位</div><div class="stat-value">' + data.p75 + '</div></div>' +
                '<div class="stat-item"><div class="stat-label">像素总数</div><div class="stat-value">' + data.total.toLocaleString() + '</div></div>' +
                '</div>';
        }
    }

    function setupHistogramModal() {
        var els = App.els();
        if (!els.histogramBtn || !els.histogramModal) return;

        var currentChannel = 'luma';

        function setActiveTab(channel) {
            currentChannel = channel;
            var tabs = document.querySelectorAll('.hist-tab');
            tabs.forEach(function (tab) {
                tab.classList.toggle('active', tab.dataset.channel === channel);
            });
            renderHistogram(channel);
        }

        function openHist() {
            var img = App.getActiveImage();
            if (!img) { App.showToast('请先打开一张图片'); return; }
            els.histogramModal.style.display = 'flex';
            setActiveTab(currentChannel);
        }

        function closeHist() {
            els.histogramModal.style.display = 'none';
        }

        els.histogramBtn.addEventListener('click', openHist);
        els.histogramModal.addEventListener('click', function (e) {
            if (e.target === els.histogramModal || e.target.classList.contains('modal-close')) {
                closeHist();
            }
            if (e.target.classList.contains('hist-tab')) {
                setActiveTab(e.target.dataset.channel);
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && els.histogramModal.style.display === 'flex') {
                closeHist();
            }
        });

        window.addEventListener('resize', function () {
            if (els.histogramModal.style.display === 'flex') {
                renderHistogram(currentChannel);
            }
        });
    }

    function init() {
        App.initEls();
        App.showUploadHint();
        setTool('select');

        setupTooltipSystem();
        setupImageEvents();
        setupToolEvents();
        setupMirrorEvents();
        setupFilterEvents();
        setupLocalZoomEvents();
        setupPencilEvents();
        setupCanvasEvents();
        setupGlobalListeners();

        setupInfoModal();
        setupHistogramModal();

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
