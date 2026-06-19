(function () {

    function activateRotate() {
        var imgObj = App.getActiveImage();
        if (!imgObj) { alert('请先打开一张图片'); return false; }
        App.state.activeImgTool = 'rotate';
        App.Text.deselectAll();
        App.els().rotatePropsSection.style.display = 'block';
        if (App.state.rotateCenterX === null || App.state.rotateCenterY === null) {
            resetCenterToDefault();
        }
        syncRotateUI();
        renderRotateOverlay();
        return true;
    }

    function deactivateRotate() {
        App.els().rotatePropsSection.style.display = 'none';
        App.clearOperationLayer();
        if (App.els().rotateCenterHandle) {
            App.els().rotateCenterHandle.style.display = 'none';
        }
        if (App.state.activeImgTool === 'rotate') {
            App.state.activeImgTool = null;
        }
    }

    function resetCenterToDefault() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        App.state.rotateCenterX = imgObj.width / 2;
        App.state.rotateCenterY = imgObj.height / 2;
    }

    function syncRotateUI() {
        var els = App.els();
        els.rotateAngle.value = App.state.rotateAngle;
        els.rotateAngleDisp.textContent = App.state.rotateAngle + '°';
        els.rotateCX.value = Math.round(App.state.rotateCenterX);
        els.rotateCY.value = Math.round(App.state.rotateCenterY);
    }

    function renderRotateOverlay() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var layer = App.els().imgOperationLayer;
        layer.classList.add('active');
        layer.innerHTML = '';

        var handle = App.els().rotateCenterHandle;
        handle.style.display = 'block';
        handle.style.left = App.toDisplay(App.state.rotateCenterX) + 'px';
        handle.style.top = App.toDisplay(App.state.rotateCenterY) + 'px';

        var canvas = document.createElement('canvas');
        canvas.width = App.toDisplay(imgObj.width);
        canvas.height = App.toDisplay(imgObj.height);
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.pointerEvents = 'none';
        var ctx = canvas.getContext('2d');
        var cx = App.toDisplay(App.state.rotateCenterX);
        var cy = App.toDisplay(App.state.rotateCenterY);
        var angle = App.state.rotateAngle * Math.PI / 180;
        var radius = Math.min(80, Math.min(cx, cy, canvas.width - cx, canvas.height - cy));

        ctx.strokeStyle = 'rgba(0,120,215,0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(20, radius), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        var len = Math.max(30, radius);
        ctx.strokeStyle = 'rgba(231,76,60,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - len, cy); ctx.lineTo(cx + len, cy);
        ctx.moveTo(cx, cy - len); ctx.lineTo(cx, cy + len);
        ctx.stroke();

        ctx.strokeStyle = '#0078d7';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(20, radius), -Math.PI / 2, -Math.PI / 2 + angle);
        ctx.stroke();

        layer.appendChild(canvas);
    }

    function onAngleInput() {
        App.state.rotateAngle = parseInt(App.els().rotateAngle.value) || 0;
        App.state.rotateAngle = App.clamp(App.state.rotateAngle, -180, 360);
        syncRotateUI();
        renderRotateOverlay();
    }

    function onCXChange() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var v = parseInt(App.els().rotateCX.value);
        if (isNaN(v)) return;
        App.state.rotateCenterX = App.clamp(v, 0, imgObj.width);
        renderRotateOverlay();
    }

    function onCYChange() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var v = parseInt(App.els().rotateCY.value);
        if (isNaN(v)) return;
        App.state.rotateCenterY = App.clamp(v, 0, imgObj.height);
        renderRotateOverlay();
    }

    function rotateLeft90() {
        App.state.rotateAngle = (App.state.rotateAngle - 90 + 360) % 360;
        if (App.state.rotateAngle > 180) App.state.rotateAngle = App.state.rotateAngle - 360;
        syncRotateUI();
        if (App.state.activeImgTool === 'rotate') renderRotateOverlay();
    }

    function rotateRight90() {
        App.state.rotateAngle = (App.state.rotateAngle + 90 + 360) % 360;
        if (App.state.rotateAngle > 180) App.state.rotateAngle = App.state.rotateAngle - 360;
        syncRotateUI();
        if (App.state.activeImgTool === 'rotate') renderRotateOverlay();
    }

    function rotateReset() {
        App.state.rotateAngle = 0;
        resetCenterToDefault();
        syncRotateUI();
        if (App.state.activeImgTool === 'rotate') renderRotateOverlay();
    }

    function applyRotate() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var angle = App.state.rotateAngle % 360;
        if (angle < 0) angle += 360;

        if (angle === 0) {
            alert('未设置旋转角度');
            return;
        }

        if (App.History) App.History.push('旋转 ' + angle + '°');
        var cx = App.state.rotateCenterX;
        var cy = App.state.rotateCenterY;
        var rad = angle * Math.PI / 180;
        var cos = Math.cos(rad);
        var sin = Math.sin(rad);

        var corners = [
            { x: 0, y: 0 },
            { x: imgObj.width, y: 0 },
            { x: imgObj.width, y: imgObj.height },
            { x: 0, y: imgObj.height }
        ];
        var tCorners = corners.map(function (p) {
            var dx = p.x - cx;
            var dy = p.y - cy;
            return {
                x: cx + dx * cos - dy * sin,
                y: cy + dx * sin + dy * cos
            };
        });

        var minX = Math.min.apply(null, tCorners.map(function (c) { return c.x; }));
        var maxX = Math.max.apply(null, tCorners.map(function (c) { return c.x; }));
        var minY = Math.min.apply(null, tCorners.map(function (c) { return c.y; }));
        var maxY = Math.max.apply(null, tCorners.map(function (c) { return c.y; }));

        var newW = Math.ceil(maxX - minX);
        var newH = Math.ceil(maxY - minY);
        var offX = -minX;
        var offY = -minY;

        var canvas = document.createElement('canvas');
        canvas.width = newW;
        canvas.height = newH;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.save();
        ctx.translate(cx + offX, cy + offY);
        ctx.rotate(rad);
        ctx.drawImage(imgObj.img, -cx, -cy);
        ctx.restore();

        var newImg = new Image();
        newImg.onload = function () {
            imgObj.img = newImg;
            var oldW = imgObj.width;
            var oldH = imgObj.height;
            imgObj.width = newW;
            imgObj.height = newH;

            var transformPoint = function (x, y) {
                var dx = x - cx;
                var dy = y - cy;
                return {
                    x: cx + dx * cos - dy * sin + offX,
                    y: cy + dx * sin + dy * cos + offY
                };
            };

            imgObj.objects.forEach(function (obj) {
                var tl = transformPoint(obj.x, obj.y);
                var tr = transformPoint(obj.x + obj.width, obj.y);
                var br = transformPoint(obj.x + obj.width, obj.y + obj.height);
                var bl = transformPoint(obj.x, obj.y + obj.height);
                var xs = [tl.x, tr.x, br.x, bl.x];
                var ys = [tl.y, tr.y, br.y, bl.y];
                obj.x = Math.max(0, Math.min.apply(null, xs));
                obj.y = Math.max(0, Math.min.apply(null, ys));
                obj.width = Math.min(newW - obj.x, Math.max.apply(null, xs) - obj.x);
                obj.height = Math.min(newH - obj.y, Math.max.apply(null, ys) - obj.y);
            });

            App.state.rotateAngle = 0;
            App.state.rotateCenterX = newW / 2;
            App.state.rotateCenterY = newH / 2;
            App.renderCanvas();
            App.Text.renderAllObjects();
            App.trigger('objects:changed');
            App.Text.deselectAll();
            deactivateRotate();
        };
        newImg.src = canvas.toDataURL('image/png');
    }

    function bindCenterHandle() {
        var handle = App.els().rotateCenterHandle;
        if (!handle) return;
        var _ds = null;
        handle.addEventListener('mousedown', function (e) {
            if (App.state.activeImgTool !== 'rotate') return;
            e.stopPropagation();
            e.preventDefault();
            var imgObj = App.getActiveImage();
            _ds = {
                sx: e.clientX, sy: e.clientY,
                ox: App.state.rotateCenterX, oy: App.state.rotateCenterY
            };
            var onMove = function (ev) {
                if (!_ds) return;
                App.state.rotateCenterX = App.clamp(_ds.ox + App.toImage(ev.clientX - _ds.sx), 0, imgObj.width);
                App.state.rotateCenterY = App.clamp(_ds.oy + App.toImage(ev.clientY - _ds.sy), 0, imgObj.height);
                syncRotateUI();
                renderRotateOverlay();
            };
            var onUp = function () {
                _ds = null;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }

    function mirrorHorizontal() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        if (App.History) App.History.push('水平翻转');
        var canvas = document.createElement('canvas');
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        var ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(imgObj.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(imgObj.img, 0, 0);
        ctx.restore();
        var newImg = new Image();
        newImg.onload = function () {
            imgObj.img = newImg;
            imgObj.objects.forEach(function (obj) {
                obj.x = imgObj.width - obj.x - obj.width;
            });
            App.renderCanvas();
            App.Text.renderAllObjects();
            App.trigger('objects:changed');
        };
        newImg.src = canvas.toDataURL('image/png');
    }

    function mirrorVertical() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        if (App.History) App.History.push('垂直翻转');
        var canvas = document.createElement('canvas');
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        var ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(0, imgObj.height);
        ctx.scale(1, -1);
        ctx.drawImage(imgObj.img, 0, 0);
        ctx.restore();
        var newImg = new Image();
        newImg.onload = function () {
            imgObj.img = newImg;
            imgObj.objects.forEach(function (obj) {
                obj.y = imgObj.height - obj.y - obj.height;
            });
            App.renderCanvas();
            App.Text.renderAllObjects();
            App.trigger('objects:changed');
        };
        newImg.src = canvas.toDataURL('image/png');
    }

    function setupEvents() {
        var els = App.els();
        els.rotateAngle.addEventListener('input', onAngleInput);
        els.rotateCX.addEventListener('change', onCXChange);
        els.rotateCY.addEventListener('change', onCYChange);
        els.rotateLeft90.addEventListener('click', rotateLeft90);
        els.rotateRight90.addEventListener('click', rotateRight90);
        els.rotateReset.addEventListener('click', rotateReset);
        els.applyRotate.addEventListener('click', applyRotate);

        els.mirrorHBtn.addEventListener('click', mirrorHorizontal);
        els.mirrorVBtn.addEventListener('click', mirrorVertical);

        bindCenterHandle();
    }

    App.ImageTransform = {
        activateRotate: activateRotate,
        deactivateRotate: deactivateRotate,
        applyRotate: applyRotate,
        rotateLeft90: rotateLeft90,
        rotateRight90: rotateRight90,
        rotateReset: rotateReset,
        mirrorHorizontal: mirrorHorizontal,
        mirrorVertical: mirrorVertical,
        setupEvents: setupEvents
    };
})();
