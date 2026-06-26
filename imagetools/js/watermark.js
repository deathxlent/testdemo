(function () {
    function uploadWatermark(file) {
        var imgObj = App.getActiveImage();
        if (!imgObj) {
            alert(App.i18n.t('dialog.open_image_first'));
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
                    _imgDataURL: e.target.result,
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

    function showWatermarkDialog() {
        var existingDialog = document.getElementById('watermarkDialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        var dialog = document.createElement('div');
        dialog.id = 'watermarkDialog';
        dialog.className = 'watermark-dialog';
        
        dialog.innerHTML = `
            <div class="watermark-dialog-overlay" onclick="App.Watermark.closeWatermarkDialog()"></div>
            <div class="watermark-dialog-content">
                <div class="watermark-dialog-header">
                    <span>` + App.i18n.t('watermark.add') + `</span>
                    <button class="watermark-dialog-close" onclick="App.Watermark.closeWatermarkDialog()">×</button>
                </div>
                <div class="watermark-dialog-body">
                    <div class="watermark-upload-area" id="watermarkDropArea">
                        <div class="watermark-upload-icon">📷</div>
                        <p>` + App.i18n.t('watermark.drop_tip') + `</p>
                        <input type="file" id="watermarkFileInput" accept="image/*" style="display:none">
                        <button class="watermark-upload-btn" onclick="document.getElementById('watermarkFileInput').click()">` + App.i18n.t('watermark.select_image') + `</button>
                    </div>
                    <div class="watermark-images-section">
                        <h4>` + App.i18n.t('watermark.from_current') + `</h4>
                        <div class="watermark-images-grid" id="watermarkImagesGrid"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        var dropArea = document.getElementById('watermarkDropArea');
        var fileInput = document.getElementById('watermarkFileInput');
        var imagesGrid = document.getElementById('watermarkImagesGrid');

        dropArea.addEventListener('dragover', function (e) {
            e.preventDefault();
            dropArea.classList.add('dragover');
        });

        dropArea.addEventListener('dragleave', function () {
            dropArea.classList.remove('dragover');
        });

        dropArea.addEventListener('drop', function (e) {
            e.preventDefault();
            dropArea.classList.remove('dragover');
            var files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                uploadWatermark(files[0]);
                App.Watermark.closeWatermarkDialog();
            }
        });

        fileInput.addEventListener('change', function (e) {
            if (e.target.files[0]) {
                uploadWatermark(e.target.files[0]);
                App.Watermark.closeWatermarkDialog();
            }
        });

        loadCurrentImages(imagesGrid);
    }

    function loadCurrentImages(container) {
        var images = App.Images.getAll();
        if (images.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;">' + App.i18n.t('watermark.no_editing_image') + '</p>';
            return;
        }

        images.forEach(function (imgObj, index) {
            var imgItem = document.createElement('div');
            imgItem.className = 'watermark-image-item';
            imgItem.title = App.i18n.t('js.image_label').replace('{index}', index + 1);
            
            var img = document.createElement('img');
            img.src = imgObj.img.src;
            img.style.width = '80px';
            img.style.height = '80px';
            img.style.objectFit = 'cover';
            
            imgItem.appendChild(img);
            imgItem.addEventListener('click', function () {
                var imgData = {
                    name: App.i18n.t('js.image_label').replace('{index}', index + 1),
                    type: 'image/png'
                };
                
                var canvas = document.createElement('canvas');
                canvas.width = imgObj.width;
                canvas.height = imgObj.height;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(imgObj.img, 0, 0);
                
                canvas.toBlob(function (blob) {
                    uploadWatermark(blob);
                    App.Watermark.closeWatermarkDialog();
                }, 'image/png');
            });
            
            container.appendChild(imgItem);
        });
    }

    function closeWatermarkDialog() {
        var dialog = document.getElementById('watermarkDialog');
        if (dialog) {
            dialog.remove();
        }
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
            showWatermarkDialog();
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

    function addImageWatermark(img) {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;

        var defW = Math.min(imgObj.width * 0.3, img.naturalWidth || img.width);
        var defH = defW * (img.naturalHeight || img.height) / (img.naturalWidth || img.width);

        var canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var dataUrl = canvas.toDataURL('image/png');

        var wm = {
            id: 'wm_' + App.state.nextWatermarkId++,
            type: 'watermark',
            name: App.i18n.t('watermark.clipboard_image'),
            img: img,
            src: dataUrl,
            _imgDataURL: dataUrl,
            x: (imgObj.width - defW) / 2,
            y: (imgObj.height - defH) / 2,
            width: defW,
            height: defH,
            rotation: 0,
            opacity: 100,
            _baseW: img.naturalWidth || img.width,
            _baseH: img.naturalHeight || img.height
        };

        imgObj.objects.push(wm);
        App.Text.selectObject(wm.id);
        App.Text.renderAllObjects();
        updateUIForSelected();
        App.trigger('objects:changed');
    }

    App.Watermark = {
        uploadWatermark: uploadWatermark,
        addImageWatermark: addImageWatermark,
        showWatermarkDialog: showWatermarkDialog,
        closeWatermarkDialog: closeWatermarkDialog,
        updateUIForSelected: updateUIForSelected,
        applyWmProp: applyWmProp,
        moveLayer: moveLayer,
        moveLayerTop: moveLayerTop,
        moveLayerBottom: moveLayerBottom,
        setupEvents: setupEvents
    };
})();
