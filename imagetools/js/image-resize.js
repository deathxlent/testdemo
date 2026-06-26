(function () {
    var _ratio = 1;
    var _updating = false;

    function activate() {
        var imgObj = App.getActiveImage();
        if (!imgObj) { alert(App.i18n.t('dialog.open_image_first')); return false; }
        App.state.activeImgTool = 'resize';
        App.Text.deselectAll();
        App.clearOperationLayer();
        App.els().resizePropsSection.style.display = 'block';
        _ratio = imgObj.width / imgObj.height;
        _updating = true;
        App.els().resizeWidth.value = imgObj.width;
        App.els().resizeHeight.value = imgObj.height;
        _updating = false;
        return true;
    }

    function deactivate() {
        App.els().resizePropsSection.style.display = 'none';
        if (App.state.activeImgTool === 'resize') {
            App.state.activeImgTool = null;
        }
    }

    function onWidthChange() {
        if (_updating) return;
        var els = App.els();
        var w = parseInt(els.resizeWidth.value);
        if (!w || w <= 0) return;
        if (els.resizeLock.checked) {
            var h = Math.max(1, Math.round(w / _ratio));
            _updating = true;
            els.resizeHeight.value = h;
            _updating = false;
        }
    }

    function onHeightChange() {
        if (_updating) return;
        var els = App.els();
        var h = parseInt(els.resizeHeight.value);
        if (!h || h <= 0) return;
        if (els.resizeLock.checked) {
            var w = Math.max(1, Math.round(h * _ratio));
            _updating = true;
            els.resizeWidth.value = w;
            _updating = false;
        }
    }

    function onLockChange() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var els = App.els();
        if (els.resizeLock.checked) {
            _ratio = imgObj.width / imgObj.height;
            onWidthChange();
        }
    }

    function doResize() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var els = App.els();
        var newW = parseInt(els.resizeWidth.value);
        var newH = parseInt(els.resizeHeight.value);
        if (!newW || !newH || newW <= 0 || newH <= 0) { alert(App.i18n.t('dialog.invalid_size')); return; }
        if (App.History) App.History.push(App.i18n.t('history.resize') + ' (' + newW + '×' + newH + ')');
        var oldW = imgObj._prevW || imgObj.width;
        var oldH = imgObj._prevH || imgObj.height;

        var canvas = document.createElement('canvas');
        canvas.width = newW;
        canvas.height = newH;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height, 0, 0, newW, newH);

        var newImg = new Image();
        newImg.onload = function () {
            imgObj.img = newImg;
            imgObj.width = newW;
            imgObj.height = newH;
            imgObj._origW = newW;
            imgObj._origH = newH;

            var sX = newW / oldW;
            var sY = newH / oldH;
            imgObj.objects.forEach(function (obj) {
                obj.x = obj.x * sX;
                obj.y = obj.y * sY;
                obj.width = obj.width * sX;
                obj.height = obj.height * sY;
                if (obj.type === 'text') {
                    obj.fontSize = Math.max(6, Math.round(obj.fontSize * Math.min(sX, sY)));
                    if (obj.shadow) {
                        obj.shadow.offsetX = Math.round(obj.shadow.offsetX * Math.min(sX, sY));
                        obj.shadow.offsetY = Math.round(obj.shadow.offsetY * Math.min(sX, sY));
                        obj.shadow.blur = Math.round(obj.shadow.blur * Math.min(sX, sY));
                    }
                    if (obj.stroke) {
                        obj.stroke.width = obj.stroke.width * Math.min(sX, sY);
                    }
                }
            });
            imgObj._prevW = newW;
            imgObj._prevH = newH;

            _ratio = newW / newH;
            App.renderCanvas();
            App.Text.renderAllObjects();
            App.trigger('objects:changed');
        };
        newImg.src = canvas.toDataURL('image/png');
    }

    function setupEvents() {
        var els = App.els();
        els.resizeWidth.addEventListener('input', onWidthChange);
        els.resizeHeight.addEventListener('input', onHeightChange);
        els.resizeLock.addEventListener('change', onLockChange);
        els.applyResize.addEventListener('click', doResize);
    }

    App.ImageResize = {
        activate: activate,
        deactivate: deactivate,
        setupEvents: setupEvents
    };
})();
