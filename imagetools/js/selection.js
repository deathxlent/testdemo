(function () {
    'use strict';

    var active = false;
    var selections = [];
    var currentSelection = null;
    var drawing = false;
    var startPoint = null;
    var mode = 'add';
    var selectionType = 'rect';
    var magicWandTolerance = 30;
    var polygonPoints = [];

    function activate() {
        var imgObj = App.getActiveImage();
        if (!imgObj) { App.showToast('请先打开一张图片'); return false; }
        App.Text.deselectAll();
        App.clearOperationLayer();
        App.setActiveImgTool('selection');
        active = true;
        selections = [];
        currentSelection = null;
        drawing = false;
        startPoint = null;
        mode = 'add';
        polygonPoints = [];
        var els = App.els();
        if (els.selectionTool) els.selectionTool.classList.add('active');
        if (els.selectionPropsSection) els.selectionPropsSection.style.display = 'block';
        render();
        return true;
    }

    function deactivate() {
        active = false;
        selections = [];
        currentSelection = null;
        drawing = false;
        startPoint = null;
        polygonPoints = [];
        var els = App.els();
        if (els.selectionTool) els.selectionTool.classList.remove('active');
        if (els.selectionPropsSection) els.selectionPropsSection.style.display = 'none';
        clearSelectionLayer();
    }

    function clearSelectionLayer() {
        var layer = App.els().imgOperationLayer;
        if (!layer) return;
        layer.innerHTML = '';
        layer.classList.remove('active');
    }

    function render() {
        clearSelectionLayer();
        var layer = App.els().imgOperationLayer;
        if (!layer) return;
        layer.classList.add('active');
        var imgObj = App.getActiveImage();
        if (!imgObj) return;

        selections.forEach(function (sel, idx) {
            renderSelection(sel, idx);
        });

        if (currentSelection) {
            renderSelection(currentSelection, -1);
        }

        if (polygonPoints.length > 0) {
            renderPolygonPreview();
        }
    }

    function renderSelection(sel, idx) {
        var layer = App.els().imgOperationLayer;
        if (!layer) return;
        var imgObj = App.getActiveImage();
        if (!imgObj) return;

        var el = document.createElement('div');
        el.className = 'selection-box';
        el.style.position = 'absolute';
        el.style.border = '2px dashed #00aaff';
        el.style.background = 'rgba(0, 170, 255, 0.15)';
        el.style.pointerEvents = 'none';
        el.style.boxSizing = 'border-box';
        el.style.zIndex = '10';

        if (sel.type === 'rect') {
            el.style.left = App.toDisplay(sel.x) + 'px';
            el.style.top = App.toDisplay(sel.y) + 'px';
            el.style.width = App.toDisplay(sel.w) + 'px';
            el.style.height = App.toDisplay(sel.h) + 'px';
            layer.appendChild(el);
        } else if (sel.type === 'circle') {
            var d = App.toDisplay(sel.r * 2);
            el.style.left = App.toDisplay(sel.cx - sel.r) + 'px';
            el.style.top = App.toDisplay(sel.cy - sel.r) + 'px';
            el.style.width = d + 'px';
            el.style.height = d + 'px';
            el.style.borderRadius = '50%';
            layer.appendChild(el);
        } else if (sel.type === 'ellipse') {
            el.style.left = App.toDisplay(sel.cx - sel.rx) + 'px';
            el.style.top = App.toDisplay(sel.cy - sel.ry) + 'px';
            el.style.width = App.toDisplay(sel.rx * 2) + 'px';
            el.style.height = App.toDisplay(sel.ry * 2) + 'px';
            el.style.borderRadius = '50%';
            layer.appendChild(el);
        } else if (sel.type === 'polygon' && sel.points && sel.points.length >= 3) {
            var poly = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            poly.setAttribute('class', 'selection-polygon');
            poly.style.position = 'absolute';
            poly.style.left = '0';
            poly.style.top = '0';
            poly.style.width = App.toDisplay(imgObj.width) + 'px';
            poly.style.height = App.toDisplay(imgObj.height) + 'px';
            poly.style.pointerEvents = 'none';
            poly.style.zIndex = '10';
            var pointsStr = sel.points.map(function (p) {
                return App.toDisplay(p.x) + ',' + App.toDisplay(p.y);
            }).join(' ');
            var pol = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            pol.setAttribute('points', pointsStr);
            pol.setAttribute('fill', 'rgba(0, 170, 255, 0.15)');
            pol.setAttribute('stroke', '#00aaff');
            pol.setAttribute('stroke-width', '2');
            pol.setAttribute('stroke-dasharray', '4,3');
            poly.appendChild(pol);
            layer.appendChild(poly);
        } else if (sel.type === 'magic' && sel.mask) {
            var maskCanvas = document.createElement('canvas');
            maskCanvas.width = imgObj.width;
            maskCanvas.height = imgObj.height;
            var maskCtx = maskCanvas.getContext('2d');
            var maskData = new Uint8ClampedArray(sel.mask);
            maskCtx.putImageData(new ImageData(maskData, imgObj.width, imgObj.height), 0, 0);

            var displayCanvas = document.createElement('canvas');
            displayCanvas.width = App.toDisplay(imgObj.width);
            displayCanvas.height = App.toDisplay(imgObj.height);
            displayCanvas.style.position = 'absolute';
            displayCanvas.style.left = '0';
            displayCanvas.style.top = '0';
            displayCanvas.style.zIndex = '10';
            displayCanvas.style.pointerEvents = 'none';
            var displayCtx = displayCanvas.getContext('2d');
            displayCtx.drawImage(maskCanvas, 0, 0, displayCanvas.width, displayCanvas.height);
            displayCtx.globalCompositeOperation = 'source-in';
            displayCtx.fillStyle = 'rgba(0, 170, 255, 0.15)';
            displayCtx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);
            layer.appendChild(displayCanvas);
        }
    }

    function renderPolygonPreview() {
        var layer = App.els().imgOperationLayer;
        if (!layer) return;
        var imgObj = App.getActiveImage();
        if (!imgObj) return;

        var poly = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        poly.setAttribute('class', 'polygon-preview');
        poly.style.position = 'absolute';
        poly.style.left = '0';
        poly.style.top = '0';
        poly.style.width = App.toDisplay(imgObj.width) + 'px';
        poly.style.height = App.toDisplay(imgObj.height) + 'px';
        poly.style.pointerEvents = 'none';
        poly.style.zIndex = '11';

        if (polygonPoints.length >= 2) {
            var pointsStr = polygonPoints.map(function (p) {
                return App.toDisplay(p.x) + ',' + App.toDisplay(p.y);
            }).join(' ');
            var line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            line.setAttribute('points', pointsStr);
            line.setAttribute('fill', 'none');
            line.setAttribute('stroke', '#00aaff');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('stroke-dasharray', '4,3');
            poly.appendChild(line);
        }

        polygonPoints.forEach(function (p, idx) {
            var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', App.toDisplay(p.x));
            dot.setAttribute('cy', App.toDisplay(p.y));
            dot.setAttribute('r', '5');
            dot.setAttribute('fill', '#00aaff');
            dot.setAttribute('stroke', '#fff');
            dot.setAttribute('stroke-width', '2');
            poly.appendChild(dot);
        });

        layer.appendChild(poly);
    }

    function handleMouseDown(e) {
        if (!active) return;
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var rect = App.els().canvasWrapper.getBoundingClientRect();
        var x = App.toImage(e.clientX - rect.left);
        var y = App.toImage(e.clientY - rect.top);

        if (e.shiftKey) {
            mode = 'add';
        } else if (e.ctrlKey) {
            mode = 'subtract';
        } else {
            mode = 'add';
            selections = [];
        }

        if (selectionType === 'polygon') {
            polygonPoints.push({ x: x, y: y });
            render();
            return;
        }

        if (selectionType === 'magic') {
            var mask = magicWandSelect(imgObj, Math.floor(x), Math.floor(y), magicWandTolerance);
            if (mask) {
                if (mode === 'subtract') {
                    subtractMask(mask);
                } else {
                    selections.push({ type: 'magic', mask: mask });
                }
            }
            render();
            return;
        }

        drawing = true;
        startPoint = { x: x, y: y };
        currentSelection = { type: selectionType };
    }

    function handleMouseMove(e) {
        if (!active || !drawing) return;
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var rect = App.els().canvasWrapper.getBoundingClientRect();
        var x = App.toImage(e.clientX - rect.left);
        var y = App.toImage(e.clientY - rect.top);

        if (selectionType === 'rect') {
            var minX = Math.min(startPoint.x, x);
            var minY = Math.min(startPoint.y, y);
            var maxX = Math.max(startPoint.x, x);
            var maxY = Math.max(startPoint.y, y);
            currentSelection = {
                type: 'rect',
                x: minX,
                y: minY,
                w: maxX - minX,
                h: maxY - minY
            };
        } else if (selectionType === 'circle') {
            var dx = x - startPoint.x;
            var dy = y - startPoint.y;
            var r = Math.sqrt(dx * dx + dy * dy);
            currentSelection = {
                type: 'circle',
                cx: startPoint.x,
                cy: startPoint.y,
                r: r
            };
        } else if (selectionType === 'ellipse') {
            var rx = Math.abs(x - startPoint.x);
            var ry = Math.abs(y - startPoint.y);
            currentSelection = {
                type: 'ellipse',
                cx: startPoint.x,
                cy: startPoint.y,
                rx: rx,
                ry: ry
            };
        }

        render();
    }

    function handleMouseUp(e) {
        if (!active || !drawing) return;
        drawing = false;

        if (currentSelection && currentSelection.type !== 'polygon') {
            if (mode === 'subtract') {
                subtractSelection(currentSelection);
            } else {
                selections.push(currentSelection);
            }
        }

        currentSelection = null;
        startPoint = null;
        render();
    }

    function handleDoubleClick(e) {
        if (!active || selectionType !== 'polygon') return;
        if (polygonPoints.length >= 3) {
            var sel = {
                type: 'polygon',
                points: polygonPoints.slice()
            };
            if (mode === 'subtract') {
                subtractSelection(sel);
            } else {
                selections.push(sel);
            }
            polygonPoints = [];
            render();
        }
    }

    function handleKeyDown(e) {
        if (!active) return;
        if (e.key === 'Escape') {
            selections = [];
            currentSelection = null;
            polygonPoints = [];
            render();
        } else if (e.key === 'Enter' && selectionType === 'polygon') {
            handleDoubleClick(e);
        }
    }

    function magicWandSelect(imgObj, startX, startY, tolerance) {
        var canvas = document.createElement('canvas');
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);
        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imgData.data;
        var w = canvas.width;
        var h = canvas.height;

        var startIdx = (startY * w + startX) * 4;
        var targetR = data[startIdx];
        var targetG = data[startIdx + 1];
        var targetB = data[startIdx + 2];

        var mask = new Uint8ClampedArray(w * h * 4);
        var visited = new Uint8Array(w * h);
        var stack = [startY * w + startX];
        visited[startY * w + startX] = 1;

        while (stack.length > 0) {
            var idx = stack.pop();
            var px = idx % w;
            var py = Math.floor(idx / w);
            var pixelIdx = idx * 4;

            mask[pixelIdx] = 255;
            mask[pixelIdx + 1] = 255;
            mask[pixelIdx + 2] = 255;
            mask[pixelIdx + 3] = 255;

            var neighbors = [
                { x: px - 1, y: py },
                { x: px + 1, y: py },
                { x: px, y: py - 1 },
                { x: px, y: py + 1 }
            ];

            for (var i = 0; i < neighbors.length; i++) {
                var nx = neighbors[i].x;
                var ny = neighbors[i].y;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    var nIdx = ny * w + nx;
                    if (!visited[nIdx]) {
                        var nPixelIdx = nIdx * 4;
                        var dr = Math.abs(data[nPixelIdx] - targetR);
                        var dg = Math.abs(data[nPixelIdx + 1] - targetG);
                        var db = Math.abs(data[nPixelIdx + 2] - targetB);
                        if (dr + dg + db <= tolerance * 3) {
                            visited[nIdx] = 1;
                            stack.push(nIdx);
                        }
                    }
                }
            }
        }

        return mask;
    }

    function subtractSelection(sel) {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;

        var combinedMask = combineSelectionsToMask(selections);
        var subtractMask = selectionToMask(sel);

        if (!combinedMask) return;

        for (var i = 0; i < combinedMask.length; i += 4) {
            if (subtractMask[i + 3] > 0) {
                combinedMask[i + 3] = 0;
            }
        }

        selections = [{ type: 'magic', mask: combinedMask }];
    }

    function subtractMask(mask) {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;

        var combinedMask = combineSelectionsToMask(selections);
        if (!combinedMask) {
            selections = [];
            return;
        }

        for (var i = 0; i < combinedMask.length; i += 4) {
            if (mask[i + 3] > 0) {
                combinedMask[i + 3] = 0;
            }
        }

        selections = [{ type: 'magic', mask: combinedMask }];
    }

    function selectionToMask(sel) {
        var imgObj = App.getActiveImage();
        if (!imgObj) return null;

        var canvas = document.createElement('canvas');
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';

        if (sel.type === 'rect') {
            ctx.fillRect(sel.x, sel.y, sel.w, sel.h);
        } else if (sel.type === 'circle') {
            ctx.beginPath();
            ctx.arc(sel.cx, sel.cy, sel.r, 0, Math.PI * 2);
            ctx.fill();
        } else if (sel.type === 'ellipse') {
            ctx.save();
            ctx.translate(sel.cx, sel.cy);
            ctx.scale(sel.rx, sel.ry);
            ctx.beginPath();
            ctx.arc(0, 0, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (sel.type === 'polygon' && sel.points && sel.points.length >= 3) {
            ctx.beginPath();
            ctx.moveTo(sel.points[0].x, sel.points[0].y);
            for (var i = 1; i < sel.points.length; i++) {
                ctx.lineTo(sel.points[i].x, sel.points[i].y);
            }
            ctx.closePath();
            ctx.fill();
        } else if (sel.type === 'magic' && sel.mask) {
            return sel.mask;
        }

        return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    }

    function combineSelectionsToMask(sels) {
        if (sels.length === 0) return null;

        var imgObj = App.getActiveImage();
        if (!imgObj) return null;

        var canvas = document.createElement('canvas');
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        var ctx = canvas.getContext('2d');

        sels.forEach(function (sel) {
            var mask = selectionToMask(sel);
            if (mask) {
                var tempCanvas = document.createElement('canvas');
                tempCanvas.width = imgObj.width;
                tempCanvas.height = imgObj.height;
                var tempCtx = tempCanvas.getContext('2d');
                tempCtx.putImageData(new ImageData(new Uint8ClampedArray(mask), imgObj.width, imgObj.height), 0, 0);
                ctx.drawImage(tempCanvas, 0, 0);
            }
        });

        return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    }

    function invertSelection() {
        if (selections.length === 0) {
            App.showToast('请先创建选择区域');
            return;
        }

        var imgObj = App.getActiveImage();
        if (!imgObj) return;

        var combinedMask = combineSelectionsToMask(selections);
        if (!combinedMask) return;

        for (var i = 0; i < combinedMask.length; i += 4) {
            combinedMask[i + 3] = combinedMask[i + 3] > 0 ? 0 : 255;
        }

        selections = [{ type: 'magic', mask: combinedMask }];
        render();
    }

    function deleteSelection() {
        if (selections.length === 0) {
            App.showToast('请先创建选择区域');
            return;
        }

        var imgObj = App.getActiveImage();
        if (!imgObj) return;

        var canvas = document.createElement('canvas');
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);
        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imgData.data;

        var combinedMask = combineSelectionsToMask(selections);
        if (!combinedMask) return;

        for (var i = 0; i < data.length; i += 4) {
            if (combinedMask[i + 3] > 0) {
                data[i] = 255;
                data[i + 1] = 255;
                data[i + 2] = 255;
                data[i + 3] = 0;
            }
        }

        ctx.putImageData(imgData, 0, 0);

        var newImg = new Image();
        newImg.onload = function () {
            imgObj.img = newImg;
            imgObj.canvas = canvas;
            App.renderCanvas();
            selections = [];
            render();
            App.Images.saveHistory();
        };
        newImg.src = canvas.toDataURL('image/png');
    }

    function copySelection() {
        if (selections.length === 0) {
            App.showToast('请先创建选择区域');
            return;
        }

        var imgObj = App.getActiveImage();
        if (!imgObj) return;

        var combinedMask = combineSelectionsToMask(selections);
        if (!combinedMask) return;

        var bounds = getSelectionBounds(combinedMask, imgObj.width, imgObj.height);
        if (!bounds) return;

        var copyCanvas = document.createElement('canvas');
        copyCanvas.width = bounds.w;
        copyCanvas.height = bounds.h;
        var copyCtx = copyCanvas.getContext('2d');

        var sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = imgObj.width;
        sourceCanvas.height = imgObj.height;
        var sourceCtx = sourceCanvas.getContext('2d');
        sourceCtx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);
        var sourceData = sourceCtx.getImageData(0, 0, imgObj.width, imgObj.height);

        var copyData = copyCtx.createImageData(bounds.w, bounds.h);
        for (var y = 0; y < bounds.h; y++) {
            for (var x = 0; x < bounds.w; x++) {
                var srcIdx = ((bounds.y + y) * imgObj.width + bounds.x + x) * 4;
                var dstIdx = (y * bounds.w + x) * 4;
                var maskIdx = srcIdx;
                if (combinedMask[maskIdx + 3] > 0) {
                    copyData.data[dstIdx] = sourceData.data[srcIdx];
                    copyData.data[dstIdx + 1] = sourceData.data[srcIdx + 1];
                    copyData.data[dstIdx + 2] = sourceData.data[srcIdx + 2];
                    copyData.data[dstIdx + 3] = sourceData.data[srcIdx + 3];
                } else {
                    copyData.data[dstIdx + 3] = 0;
                }
            }
        }

        copyCtx.putImageData(copyData, 0, 0);

        copyCanvas.toBlob(function (blob) {
            try {
                var item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item]).then(function () {
                    App.showToast('已复制到剪贴板');
                }).catch(function (err) {
                    App.showToast('复制失败: ' + err.message);
                });
            } catch (e) {
                App.showToast('浏览器不支持剪贴板API');
            }
        }, 'image/png');
    }

    function fillSelection(color) {
        if (selections.length === 0) {
            App.showToast('请先创建选择区域');
            return;
        }

        var imgObj = App.getActiveImage();
        if (!imgObj) return;

        var canvas = document.createElement('canvas');
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);
        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imgData.data;

        var combinedMask = combineSelectionsToMask(selections);
        if (!combinedMask) return;

        var r = parseInt(color.slice(1, 3), 16);
        var g = parseInt(color.slice(3, 5), 16);
        var b = parseInt(color.slice(5, 7), 16);

        for (var i = 0; i < data.length; i += 4) {
            if (combinedMask[i + 3] > 0) {
                var alpha = combinedMask[i + 3] / 255;
                data[i] = Math.round(data[i] * (1 - alpha) + r * alpha);
                data[i + 1] = Math.round(data[i + 1] * (1 - alpha) + g * alpha);
                data[i + 2] = Math.round(data[i + 2] * (1 - alpha) + b * alpha);
            }
        }

        ctx.putImageData(imgData, 0, 0);

        var newImg = new Image();
        newImg.onload = function () {
            imgObj.img = newImg;
            imgObj.canvas = canvas;
            App.renderCanvas();
            selections = [];
            render();
            App.Images.saveHistory();
        };
        newImg.src = canvas.toDataURL('image/png');
    }

    function getSelectionBounds(mask, w, h) {
        var minX = w, minY = h, maxX = 0, maxY = 0;
        var hasSelection = false;

        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var idx = (y * w + x) * 4;
                if (mask[idx + 3] > 0) {
                    hasSelection = true;
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        if (!hasSelection) return null;
        return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    }

    function setSelectionType(type) {
        selectionType = type;
        polygonPoints = [];
        render();
    }

    function setTolerance(val) {
        magicWandTolerance = parseInt(val, 10);
    }

    function hasSelection() {
        return selections.length > 0;
    }

    function getMask() {
        if (selections.length === 0) return null;
        return combineSelectionsToMask(selections);
    }

    App.Selection = {
        activate: activate,
        deactivate: deactivate,
        handleMouseDown: handleMouseDown,
        handleMouseMove: handleMouseMove,
        handleMouseUp: handleMouseUp,
        handleDoubleClick: handleDoubleClick,
        handleKeyDown: handleKeyDown,
        invert: invertSelection,
        delete: deleteSelection,
        copy: copySelection,
        fill: fillSelection,
        setSelectionType: setSelectionType,
        setTolerance: setTolerance,
        hasSelection: hasSelection,
        getMask: getMask,
        clear: function () {
            selections = [];
            currentSelection = null;
            polygonPoints = [];
            render();
        }
    };
})();