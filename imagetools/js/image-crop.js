(function () {
    var _rectUpdating = false;
    var _rectRatio = 4 / 3;
    var _mode = null;

    function activateCrop() {
        var imgObj = App.getActiveImage();
        if (!imgObj) { alert('请先打开一张图片'); return false; }
        App.state.activeImgTool = 'crop';
        _mode = 'crop';
        App.Text.deselectAll();
        App.els().cropPropsSection.style.display = 'block';

        var c = { x: 0, y: 0, w: imgObj.width, h: imgObj.height };
        App.state.activeCrop = c;
        resetCropDims(c);
        renderCropBox();
        return true;
    }

    function activateRectCrop() {
        var imgObj = App.getActiveImage();
        if (!imgObj) { alert('请先打开一张图片'); return false; }
        App.state.activeImgTool = 'rectcrop';
        _mode = 'rectcrop';
        App.Text.deselectAll();
        App.els().rectCropPropsSection.style.display = 'block';
        return true;
    }

    function deactivate() {
        App.els().cropPropsSection.style.display = 'none';
        App.els().rectCropPropsSection.style.display = 'none';
        App.state.activeCrop = null;
        App.state.activeRectCrop = null;
        _mode = null;
        App.clearOperationLayer();
        if (['crop', 'rectcrop'].indexOf(App.state.activeImgTool) >= 0) {
            App.state.activeImgTool = null;
        }
    }

    function resetCropDims(c) {
        var els = App.els();
        els.cropX.value = Math.round(c.x);
        els.cropY.value = Math.round(c.y);
        els.cropW.value = Math.round(c.w);
        els.cropH.value = Math.round(c.h);
    }

    function renderCropBox() {
        var els = App.els();
        var layer = els.imgOperationLayer;
        var c = App.state.activeCrop;
        if (!c) return;
        layer.classList.add('active');
        layer.innerHTML = '';

        var dim = document.createElement('div');
        dim.className = 'crop-dim';
        dim.innerHTML =
            '<div class="crop-dim-top" style="height:' + App.toDisplay(c.y) + 'px"></div>' +
            '<div class="crop-dim-bottom" style="height:' + App.toDisplay(App.getActiveImage().height - c.y - c.h) + 'px"></div>' +
            '<div class="crop-dim-left" style="top:' + App.toDisplay(c.y) + 'px;height:' + App.toDisplay(c.h) + 'px;width:' + App.toDisplay(c.x) + 'px"></div>' +
            '<div class="crop-dim-right" style="top:' + App.toDisplay(c.y) + 'px;height:' + App.toDisplay(c.h) + 'px;width:' + App.toDisplay(App.getActiveImage().width - c.x - c.w) + 'px"></div>';
        layer.appendChild(dim);

        var box = document.createElement('div');
        box.className = 'crop-box';
        box.dataset.crop = '1';
        box.style.left = App.toDisplay(c.x) + 'px';
        box.style.top = App.toDisplay(c.y) + 'px';
        box.style.width = App.toDisplay(c.w) + 'px';
        box.style.height = App.toDisplay(c.h) + 'px';
        ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].forEach(function (d) {
            var h = document.createElement('div');
            h.className = 'resize-handle h-' + d;
            h.dataset.dir = d;
            box.appendChild(h);
        });
        layer.appendChild(box);

        bindBoxEvents(box, 'crop');
    }

    function createRectCropBox() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var els = App.els();
        var w = parseInt(els.rectCropW.value) || 400;
        var h = parseInt(els.rectCropH.value) || 300;
        w = Math.min(w, imgObj.width);
        h = Math.min(h, imgObj.height);
        var x = (imgObj.width - w) / 2;
        var y = (imgObj.height - h) / 2;

        App.state.activeRectCrop = { x: x, y: y, w: w, h: h };
        _rectRatio = w / h;
        renderRectCropBox();
    }

    function renderRectCropBox() {
        var els = App.els();
        var layer = els.imgOperationLayer;
        var r = App.state.activeRectCrop;
        if (!r) return;
        layer.classList.add('active');
        layer.innerHTML = '';

        var dim = document.createElement('div');
        dim.className = 'crop-dim';
        dim.innerHTML =
            '<div class="crop-dim-top" style="height:' + App.toDisplay(r.y) + 'px"></div>' +
            '<div class="crop-dim-bottom" style="height:' + App.toDisplay(App.getActiveImage().height - r.y - r.h) + 'px"></div>' +
            '<div class="crop-dim-left" style="top:' + App.toDisplay(r.y) + 'px;height:' + App.toDisplay(r.h) + 'px;width:' + App.toDisplay(r.x) + 'px"></div>' +
            '<div class="crop-dim-right" style="top:' + App.toDisplay(r.y) + 'px;height:' + App.toDisplay(r.h) + 'px;width:' + App.toDisplay(App.getActiveImage().width - r.x - r.w) + 'px"></div>';
        layer.appendChild(dim);

        var box = document.createElement('div');
        box.className = 'rectcrop-box';
        box.dataset.rectcrop = '1';
        box.style.left = App.toDisplay(r.x) + 'px';
        box.style.top = App.toDisplay(r.y) + 'px';
        box.style.width = App.toDisplay(r.w) + 'px';
        box.style.height = App.toDisplay(r.h) + 'px';
        ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].forEach(function (d) {
            var h = document.createElement('div');
            h.className = 'resize-handle h-' + d;
            h.dataset.dir = d;
            box.appendChild(h);
        });
        layer.appendChild(box);

        bindBoxEvents(box, 'rectcrop');
    }

    function bindBoxEvents(box, mode) {
        var _dragState = null;

        box.addEventListener('mousedown', function (e) {
            var handle = e.target.closest('.resize-handle');
            e.stopPropagation();
            e.preventDefault();

            var target = mode === 'crop' ? App.state.activeCrop : App.state.activeRectCrop;
            if (!target) return;

            if (handle) {
                _dragState = { type: 'resize', dir: handle.dataset.dir, sx: e.clientX, sy: e.clientY, ox: target.x, oy: target.y, ow: target.w, oh: target.h };
            } else {
                _dragState = { type: 'move', sx: e.clientX, sy: e.clientY, ox: target.x, oy: target.y };
            }

            var onMove = function (ev) {
                if (!_dragState) return;
                var imgObj = App.getActiveImage();
                var dx = App.toImage(ev.clientX - _dragState.sx);
                var dy = App.toImage(ev.clientY - _dragState.sy);

                if (_dragState.type === 'move') {
                    target.x = App.clamp(_dragState.ox + dx, 0, Math.max(0, imgObj.width - target.w));
                    target.y = App.clamp(_dragState.oy + dy, 0, Math.max(0, imgObj.height - target.h));
                } else {
                    var x = _dragState.ox, y = _dragState.oy, w = _dragState.ow, h = _dragState.oh;
                    var d = _dragState.dir;
                    if (mode === 'rectcrop' && App.els().rectCropLock.checked) {
                        var lockRatio = _rectRatio;
                        if (d === 'n' || d === 's') {
                            if (d === 's') h = Math.max(20, h + dy);
                            else { h = Math.max(20, h - dy); y = _dragState.oy + (_dragState.oh - h); }
                            w = h * lockRatio;
                        } else if (d === 'e' || d === 'w') {
                            if (d === 'e') w = Math.max(20, w + dx);
                            else { w = Math.max(20, w - dx); x = _dragState.ox + (_dragState.ow - w); }
                            h = w / lockRatio;
                        } else {
                            if (d.indexOf('e') !== -1) w = Math.max(20, w + dx);
                            else { w = Math.max(20, w - dx); x = _dragState.ox + (_dragState.ow - w); }
                            h = w / lockRatio;
                            if (d.indexOf('n') !== -1) { y = _dragState.oy + (_dragState.oh - h); }
                        }
                    } else {
                        if (d.indexOf('e') !== -1) w = Math.max(10, w + dx);
                        if (d.indexOf('s') !== -1) h = Math.max(10, h + dy);
                        if (d.indexOf('w') !== -1) {
                            var nw = Math.max(10, w - dx);
                            x = x + (w - nw); w = nw;
                        }
                        if (d.indexOf('n') !== -1) {
                            var nh = Math.max(10, h - dy);
                            y = y + (h - nh); h = nh;
                        }
                    }
                    x = App.clamp(x, 0, imgObj.width);
                    y = App.clamp(y, 0, imgObj.height);
                    w = Math.min(w, imgObj.width - x);
                    h = Math.min(h, imgObj.height - y);
                    target.x = x; target.y = y; target.w = w; target.h = h;

                    if (mode === 'rectcrop') {
                        App.els().rectCropW.value = Math.round(target.w);
                        App.els().rectCropH.value = Math.round(target.h);
                    }
                }
                if (mode === 'crop') { resetCropDims(target); renderCropBox(); }
                else { renderRectCropBox(); }
            };

            var onUp = function () {
                _dragState = null;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });

        box.addEventListener('dblclick', function (e) {
            e.stopPropagation();
            if (mode === 'crop') doCrop();
            else doCropRectCrop();
        });
    }

    function syncCropFromInputs() {
        if (_mode !== 'crop' || !App.state.activeCrop) return;
        var els = App.els();
        var imgObj = App.getActiveImage();
        var x = parseInt(els.cropX.value) || 0;
        var y = parseInt(els.cropY.value) || 0;
        var w = parseInt(els.cropW.value) || 0;
        var h = parseInt(els.cropH.value) || 0;
        x = App.clamp(x, 0, imgObj.width - 1);
        y = App.clamp(y, 0, imgObj.height - 1);
        w = App.clamp(w, 1, imgObj.width - x);
        h = App.clamp(h, 1, imgObj.height - y);
        App.state.activeCrop.x = x;
        App.state.activeCrop.y = y;
        App.state.activeCrop.w = w;
        App.state.activeCrop.h = h;
        renderCropBox();
    }

    function resetCrop() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        App.state.activeCrop = { x: 0, y: 0, w: imgObj.width, h: imgObj.height };
        resetCropDims(App.state.activeCrop);
        renderCropBox();
    }

    function doCrop() {
        var c = App.state.activeCrop;
        if (!c) return;
        if (c.w < 2 || c.h < 2) { alert('裁剪区域太小'); return; }
        applyCropToImage(c);
    }

    function doCropRectCrop() {
        var c = App.state.activeRectCrop;
        if (!c) return;
        if (c.w < 2 || c.h < 2) { alert('裁剪区域太小'); return; }
        applyCropToImage(c);
    }

    function applyCropToImage(c) {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        if (App.History) App.History.push('裁剪 (' + c.w + '×' + c.h + ')');
        var canvas = document.createElement('canvas');
        canvas.width = c.w;
        canvas.height = c.h;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imgObj.img, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);

        var newImg = new Image();
        newImg.onload = function () {
            imgObj.img = newImg;
            imgObj.width = c.w;
            imgObj.height = c.h;
            if (imgObj._prevW) imgObj._prevW = c.w;
            if (imgObj._prevH) imgObj._prevH = c.h;

            var filtered = [];
            imgObj.objects.forEach(function (obj) {
                var newX = obj.x - c.x;
                var newY = obj.y - c.y;
                var newRight = newX + obj.width;
                var newBottom = newY + obj.height;
                if (newRight > 0 && newBottom > 0 && newX < c.w && newY < c.h) {
                    obj.x = App.clamp(newX, 0, c.w);
                    obj.y = App.clamp(newY, 0, c.h);
                    obj.width = App.clamp(obj.width, 1, c.w - obj.x);
                    obj.height = App.clamp(obj.height, 1, c.h - obj.y);
                    filtered.push(obj);
                }
            });
            imgObj.objects = filtered;

            App.renderCanvas();
            App.Text.renderAllObjects();
            App.trigger('objects:changed');
            App.Text.deselectAll();
            deactivate();
        };
        newImg.src = canvas.toDataURL('image/png');
    }

    function onRectWChange() {
        if (!App.els().rectCropLock.checked) return;
        var w = parseInt(App.els().rectCropW.value);
        if (!w) return;
        _rectUpdating = true;
        App.els().rectCropH.value = Math.max(1, Math.round(w / _rectRatio));
        _rectUpdating = false;
    }

    function onRectHChange() {
        if (!App.els().rectCropLock.checked) return;
        var h = parseInt(App.els().rectCropH.value);
        if (!h) return;
        _rectUpdating = true;
        App.els().rectCropW.value = Math.max(1, Math.round(h * _rectRatio));
        _rectUpdating = false;
    }

    function onRectLockChange() {
        if (App.els().rectCropLock.checked) {
            var w = parseInt(App.els().rectCropW.value) || 400;
            var h = parseInt(App.els().rectCropH.value) || 300;
            _rectRatio = w / h;
        }
    }

    function setupEvents() {
        var els = App.els();
        els.applyCrop.addEventListener('click', doCrop);
        els.resetCropBtn.addEventListener('click', resetCrop);
        els.cropX.addEventListener('change', syncCropFromInputs);
        els.cropY.addEventListener('change', syncCropFromInputs);
        els.cropW.addEventListener('change', syncCropFromInputs);
        els.cropH.addEventListener('change', syncCropFromInputs);

        els.createRectCrop.addEventListener('click', createRectCropBox);
        els.rectCropW.addEventListener('input', function () { if (!_rectUpdating) onRectWChange(); });
        els.rectCropH.addEventListener('input', function () { if (!_rectUpdating) onRectHChange(); });
        els.rectCropLock.addEventListener('change', onRectLockChange);
    }

    App.ImageCrop = {
        activateCrop: activateCrop,
        activateRectCrop: activateRectCrop,
        deactivate: deactivate,
        setupEvents: setupEvents
    };
})();
