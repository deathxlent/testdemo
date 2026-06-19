(function () {
    function uploadWatermark(file) {
        var imgObj = App.getActiveImage();
        if (!imgObj) {
            alert('请先打开一张图片');
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                var defW = Math.min(imgObj.width * 0.3, img.naturalWidth);
                var defH = defW * img.naturalHeight / img.naturalWidth;

                var wm = {
                    id: 'wm_' + App.state.nextWatermarkId++,
                    type: 'watermark',
                    name: file.name,
                    img: img,
                    src: e.target.result,
                    x: (imgObj.width - defW) / 2,
                    y: (imgObj.height - defH) / 2,
                    width: defW,
                    height: defH,
                    rotation: 0,
                    opacity: 100,
                    _baseW: img.naturalWidth,
                    _baseH: img.naturalHeight
                };

                imgObj.objects.push(wm);
                App.Text.selectObject(wm.id);
                App.Text.renderAllObjects();
                updateUIForSelected();
                App.trigger('objects:changed');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function applyWmProp(key, value) {
        var obj = App.getActiveObj();
        if (!obj || obj.type !== 'watermark') return;
        obj[key] = value;
        App.Text.renderOne(obj);
        updateUIForSelected();
    }

    function setWatermarkSizePct(pct) {
        var obj = App.getActiveObj();
        if (!obj || obj.type !== 'watermark') return;
        var ratio = obj._baseH / obj._baseW;
        var newW = obj._baseW * pct / 100;
        obj.width = newW;
        obj.height = newW * ratio;
        App.Text.renderOne(obj);
        updateUIForSelected();
    }

    function getWatermarkSizePct() {
        var obj = App.getActiveObj();
        if (!obj || obj.type !== 'watermark') return 100;
        return Math.round(obj.width / obj._baseW * 100);
    }

    function updateUIForSelected() {
        var els = App.els();
        var obj = App.getActiveObj();
        if (obj && obj.type === 'watermark') {
            els.wmSize.value = getWatermarkSizePct();
            els.wmRotate.value = obj.rotation;
            els.wmOpacity.value = obj.opacity;
            els.wmRotDisp.textContent = obj.rotation;
            els.wmOpDisp.textContent = obj.opacity;
        }
    }

    function moveLayer(delta) {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var idx = App.getActiveObjIndex();
        if (idx === -1) return;
        var target = idx + delta;
        if (target < 0 || target >= imgObj.objects.length) return;
        var arr = imgObj.objects;
        var tmp = arr[idx];
        arr[idx] = arr[target];
        arr[target] = tmp;
        App.Text.renderAllObjects();
        App.trigger('objects:changed');
    }

    function moveLayerTop() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var idx = App.getActiveObjIndex();
        if (idx === -1 || idx === imgObj.objects.length - 1) return;
        var arr = imgObj.objects;
        var obj = arr.splice(idx, 1)[0];
        arr.push(obj);
        App.Text.renderAllObjects();
        App.trigger('objects:changed');
    }

    function moveLayerBottom() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var idx = App.getActiveObjIndex();
        if (idx <= 0) return;
        var arr = imgObj.objects;
        var obj = arr.splice(idx, 1)[0];
        arr.unshift(obj);
        App.Text.renderAllObjects();
        App.trigger('objects:changed');
    }

    function setupEvents() {
        var els = App.els();

        els.uploadWatermarkBtn.addEventListener('click', function () {
            els.watermarkInput.click();
        });

        els.watermarkInput.addEventListener('change', function (e) {
            if (e.target.files[0]) uploadWatermark(e.target.files[0]);
            els.watermarkInput.value = '';
        });

        els.wmSize.addEventListener('input', function () {
            setWatermarkSizePct(parseInt(els.wmSize.value));
            App.trigger('objects:changed');
        });

        els.wmRotate.addEventListener('input', function () {
            var val = parseInt(els.wmRotate.value);
            applyWmProp('rotation', val);
            App.trigger('objects:changed');
        });

        els.wmOpacity.addEventListener('input', function () {
            var val = parseInt(els.wmOpacity.value);
            applyWmProp('opacity', val);
            App.trigger('objects:changed');
        });

        els.wmLayerUp.addEventListener('click', function () { moveLayer(1); });
        els.wmLayerDown.addEventListener('click', function () { moveLayer(-1); });
        els.wmLayerTop.addEventListener('click', moveLayerTop);
        els.wmLayerBottom.addEventListener('click', moveLayerBottom);
    }

    App.Watermark = {
        uploadWatermark: uploadWatermark,
        updateUIForSelected: updateUIForSelected,
        applyWmProp: applyWmProp,
        moveLayer: moveLayer,
        moveLayerTop: moveLayerTop,
        moveLayerBottom: moveLayerBottom,
        setupEvents: setupEvents
    };
})();
