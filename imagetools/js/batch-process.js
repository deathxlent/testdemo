(function () {
    'use strict';

    var BatchProcess = {
        files: [],
        operations: [],
        outputSettings: {
            format: 'same',
            quality: 85
        },
        isProcessing: false,
        isPaused: false,
        currentIndex: 0,
        results: { success: 0, failed: 0, skipped: 0 },

        activate: function () {
            if (this.isProcessing) return;
            App.clearOperationLayer();
            App.setActiveImgTool('batch');
            this.showUI();
        },

        deactivate: function () {
            this.hideUI();
        },

        showUI: function () {
            var els = App.els();
            if (els.batchProcessSection) els.batchProcessSection.style.display = 'block';
            if (els.batchTool) els.batchTool.classList.add('active');
        },

        hideUI: function () {
            var els = App.els();
            if (els.batchProcessSection) els.batchProcessSection.style.display = 'none';
            if (els.batchTool) els.batchTool.classList.remove('active');
        },

        addFiles: function (fileList) {
            var self = this;
            Array.from(fileList).forEach(function (file) {
                if (!self.isImageFile(file)) return;
                var reader = new FileReader();
                reader.onload = (function (f) {
                    return function (e) {
                        var img = new Image();
                        img.onload = function () {
                            self.files.push({
                                id: Date.now() + Math.random(),
                                name: f.name,
                                size: f.size,
                                width: img.width,
                                height: img.height,
                                dataUrl: e.target.result,
                                img: img
                            });
                            self.renderFileList();
                        };
                        img.src = e.target.result;
                    };
                })(file);
                reader.readAsDataURL(file);
            });
        },

        addFilesFromUrls: function (urls) {
            var self = this;
            urls.forEach(function (url) {
                var img = new Image();
                img.onload = function () {
                    self.files.push({
                        id: Date.now() + Math.random(),
                        name: url.name || 'image.png',
                        size: 0,
                        width: img.width,
                        height: img.height,
                        dataUrl: url.dataUrl,
                        img: img
                    });
                    self.renderFileList();
                };
                img.src = url.dataUrl;
            });
        },

        isImageFile: function (file) {
            return file.type.startsWith('image/');
        },

        clearFiles: function () {
            this.files = [];
            this.renderFileList();
        },

        removeFile: function (id) {
            this.files = this.files.filter(function (f) { return f.id !== id; });
            this.renderFileList();
        },

        renderFileList: function () {
            var els = App.els();
            if (!els.batchFileList) return;

            var list = els.batchFileList;
            list.innerHTML = '';

            if (this.files.length === 0) {
                list.innerHTML = '<div class="batch-empty">' + App.i18n.t('batch.no_files') + '</div>';
                if (els.batchFileCount) els.batchFileCount.textContent = App.i18n.t('batch.file_count').replace('{count}', 0);
                return;
            }

            var totalSize = 0;
            var self = this;
            this.files.forEach(function (file) {
                totalSize += file.size;
                var item = document.createElement('div');
                item.className = 'batch-file-item';
                item.dataset.id = file.id;

                var sizeStr = self.formatSize(file.size);
                item.innerHTML =
                    '<div class="batch-file-thumb">' +
                        '<img src="' + file.dataUrl + '" alt="">' +
                    '</div>' +
                    '<div class="batch-file-info">' +
                        '<div class="batch-file-name" title="' + file.name + '">' + file.name + '</div>' +
                        '<div class="batch-file-meta">' + file.width + '×' + file.height + ' · ' + sizeStr + '</div>' +
                    '</div>' +
                    '<button class="batch-file-remove" title="' + App.i18n.t('js.remove_tip') + '">×</button>';

                item.querySelector('.batch-file-remove').addEventListener('click', function (e) {
                    e.stopPropagation();
                    self.removeFile(file.id);
                });

                list.appendChild(item);
            }, this);

            if (els.batchFileCount) {
                var count = this.files.length;
                var sizeStr = this.formatSize(totalSize);
                els.batchFileCount.textContent = App.i18n.t('batch.file_count').replace('{count}', count) + (totalSize > 0 ? ' · ' + sizeStr : '');
            }
        },

        formatSize: function (bytes) {
            if (bytes === 0) return '0 B';
            var k = 1024;
            var sizes = ['B', 'KB', 'MB', 'GB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        },

        addOperation: function (type) {
            var op = {
                id: Date.now(),
                type: type,
                enabled: true,
                params: this.getDefaultParams(type)
            };
            this.operations.push(op);
            this.renderOperationList();
        },

        getDefaultParams: function (type) {
            switch (type) {
                case 'resize':
                    return { mode: 'longside', value: 1920, maintain: true, allowEnlarge: true };
                case 'format':
                    return { format: 'jpg', quality: 85, deleteOriginal: false };
                case 'rename':
                    return { pattern: 'prefix_num', prefix: 'photo', startNum: 1, digits: 3 };
                case 'compress':
                    return { quality: 80, mode: 'quality', targetSize: 500 };
                case 'brightness':
                    return { value: 0 };
                case 'contrast':
                    return { value: 0 };
                case 'saturation':
                    return { value: 0 };
                case 'hue':
                    return { value: 0 };
                case 'blur':
                    return { value: 5 };
                case 'sharpen':
                    return { value: 5 };
                case 'mosaic':
                    return { value: 10 };
                case 'negative':
                    return {};
                case 'rotate':
                    return { angle: 90 };
                case 'flip':
                    return { direction: 'horizontal' };
                case 'crop':
                    return { x: 0, y: 0, width: 100, height: 100, mode: 'percent' };
                case 'textWatermark':
                    return { text: App.i18n.t('batch.watermark_text'), fontSize: 24, color: '#ffffff', opacity: 50, position: 'bottom-right', xOffset: 20, yOffset: 20 };
                case 'imageWatermark':
                    return { url: '', opacity: 50, position: 'bottom-right', xOffset: 20, yOffset: 20, scale: 1 };
                default:
                    return {};
            }
        },

        removeOperation: function (id) {
            this.operations = this.operations.filter(function (op) { return op.id !== id; });
            this.renderOperationList();
        },

        toggleOperation: function (id) {
            var op = this.operations.find(function (o) { return o.id === id; });
            if (op) op.enabled = !op.enabled;
            this.renderOperationList();
        },

        updateOperationParams: function (id, params) {
            var op = this.operations.find(function (o) { return o.id === id; });
            if (op) Object.assign(op.params, params);
        },

        moveOperation: function (fromIndex, toIndex) {
            if (fromIndex < 0 || fromIndex >= this.operations.length) return;
            if (toIndex < 0 || toIndex >= this.operations.length) return;
            var item = this.operations.splice(fromIndex, 1)[0];
            this.operations.splice(toIndex, 0, item);
            this.renderOperationList();
        },

        renderOperationList: function () {
            var els = App.els();
            if (!els.batchOperationList) return;

            var list = els.batchOperationList;
            list.innerHTML = '';

            if (this.operations.length === 0) {
                list.innerHTML = '<div class="batch-op-empty">' + App.i18n.t('batch.no_operations') + '</div>';
                return;
            }

            var self = this;
            this.operations.forEach(function (op, index) {
                var item = document.createElement('div');
                item.className = 'batch-op-item' + (op.enabled ? '' : ' disabled');
                item.dataset.id = op.id;
                item.innerHTML =
                    '<div class="batch-op-header">' +
                        '<span class="batch-op-toggle">' + (op.enabled ? '●' : '○') + '</span>' +
                        '<span class="batch-op-name">' + self.getOpName(op.type) + '</span>' +
                        '<button class="batch-op-remove" title="' + App.i18n.t('js.delete_op') + '">×</button>' +
                    '</div>' +
                    '<div class="batch-op-params"></div>';

                var paramsDiv = item.querySelector('.batch-op-params');
                paramsDiv.innerHTML = self.renderOpParams(op);

                item.querySelector('.batch-op-toggle').addEventListener('click', function () {
                    self.toggleOperation(op.id);
                });

                item.querySelector('.batch-op-remove').addEventListener('click', function () {
                    self.removeOperation(op.id);
                });

                self.bindOpParamEvents(item, op);

                list.appendChild(item);
            });
        },

        getOpName: function (type) {
            var names = {
                resize: App.i18n.t('batch.resize'),
                format: App.i18n.t('batch.format'),
                rename: App.i18n.t('batch.rename'),
                compress: App.i18n.t('batch.compress'),
                brightness: App.i18n.t('batch.brightness'),
                contrast: App.i18n.t('batch.contrast'),
                saturation: App.i18n.t('batch.saturation'),
                hue: App.i18n.t('batch.hue'),
                blur: App.i18n.t('batch.blur'),
                sharpen: App.i18n.t('batch.sharpen'),
                mosaic: App.i18n.t('batch.mosaic'),
                negative: App.i18n.t('batch.negative'),
                rotate: App.i18n.t('batch.rotate'),
                flip: App.i18n.t('batch.flip'),
                crop: App.i18n.t('batch.crop'),
                textWatermark: App.i18n.t('batch.text_watermark'),
                imageWatermark: App.i18n.t('batch.image_watermark')
            };
            return names[type] || type;
        },

        renderOpParams: function (op) {
            switch (op.type) {
                case 'resize':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.method_label') + '</label>' +
                        '<select class="op-param" data-param="mode">' +
                            '<option value="longside"' + (op.params.mode === 'longside' ? ' selected' : '') + '>' + App.i18n.t('batch.by_longside') + '</option>' +
                            '<option value="shortside"' + (op.params.mode === 'shortside' ? ' selected' : '') + '>' + App.i18n.t('batch.by_shortside') + '</option>' +
                            '<option value="width"' + (op.params.mode === 'width' ? ' selected' : '') + '>' + App.i18n.t('batch.by_width') + '</option>' +
                            '<option value="height"' + (op.params.mode === 'height' ? ' selected' : '') + '>' + App.i18n.t('batch.by_height') + '</option>' +
                            '<option value="percent"' + (op.params.mode === 'percent' ? ' selected' : '') + '>' + App.i18n.t('batch.by_percent') + '</option>' +
                            '<option value="exact"' + (op.params.mode === 'exact' ? ' selected' : '') + '>' + App.i18n.t('batch.exact_size') + '</option>' +
                        '</select></div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.value_label') + '</label>' +
                            '<input type="number" class="op-param" data-param="value" value="' + op.params.value + '">' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label><input type="checkbox" class="op-param" data-param="maintain"' + (op.params.maintain ? ' checked' : '') + '> ' + App.i18n.t('batch.keep_ratio') + '</label>' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label><input type="checkbox" class="op-param" data-param="allowEnlarge"' + (op.params.allowEnlarge ? ' checked' : '') + '> ' + App.i18n.t('batch.allow_enlarge') + '</label>' +
                        '</div>';

                case 'format':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.target_format') + '</label>' +
                        '<select class="op-param" data-param="format">' +
                            '<option value="jpg"' + (op.params.format === 'jpg' ? ' selected' : '') + '>JPG</option>' +
                            '<option value="png"' + (op.params.format === 'png' ? ' selected' : '') + '>PNG</option>' +
                            '<option value="webp"' + (op.params.format === 'webp' ? ' selected' : '') + '>WebP</option>' +
                            '<option value="bmp"' + (op.params.format === 'bmp' ? ' selected' : '') + '>BMP</option>' +
                        '</select></div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.quality') + '</label>' +
                            '<input type="range" class="op-param" data-param="quality" min="1" max="100" value="' + op.params.quality + '">' +
                            '<span class="param-val">' + op.params.quality + '</span>' +
                        '</div>';

                case 'rename':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.method_label') + '</label>' +
                        '<select class="op-param" data-param="pattern">' +
                            '<option value="prefix_num"' + (op.params.pattern === 'prefix_num' ? ' selected' : '') + '>' + App.i18n.t('batch.prefix_num') + '</option>' +
                            '<option value="original_num"' + (op.params.pattern === 'original_num' ? ' selected' : '') + '>' + App.i18n.t('batch.original_num') + '</option>' +
                        '</select></div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.prefix') + '</label>' +
                            '<input type="text" class="op-param" data-param="prefix" value="' + op.params.prefix + '">' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.start_num') + '</label>' +
                            '<input type="number" class="op-param" data-param="startNum" value="' + op.params.startNum + '" min="1">' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.digits') + '</label>' +
                            '<select class="op-param" data-param="digits">' +
                                '<option value="2"' + (op.params.digits === 2 ? ' selected' : '') + '>' + App.i18n.t('batch.digits_2') + '</option>' +
                                '<option value="3"' + (op.params.digits === 3 ? ' selected' : '') + '>' + App.i18n.t('batch.digits_3') + '</option>' +
                                '<option value="4"' + (op.params.digits === 4 ? ' selected' : '') + '>' + App.i18n.t('batch.digits_4') + '</option>' +
                            '</select></div>';

                case 'compress':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.method_label') + '</label>' +
                        '<select class="op-param" data-param="mode">' +
                            '<option value="quality"' + (op.params.mode === 'quality' ? ' selected' : '') + '>' + App.i18n.t('batch.by_quality') + '</option>' +
                            '<option value="size"' + (op.params.mode === 'size' ? ' selected' : '') + '>' + App.i18n.t('batch.by_size') + '</option>' +
                        '</select></div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.quality_size') + '</label>' +
                            '<input type="number" class="op-param" data-param="quality" value="' + op.params.quality + '" min="1" max="100">' +
                            '<span class="param-val">' + (op.params.mode === 'quality' ? '' : 'KB') + '</span>' +
                        '</div>';

                case 'brightness':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.brightness') + '</label>' +
                        '<input type="range" class="op-param" data-param="value" min="-100" max="100" value="' + op.params.value + '">' +
                        '<span class="param-val">' + op.params.value + '%</span>' +
                        '</div>';

                case 'contrast':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.contrast') + '</label>' +
                        '<input type="range" class="op-param" data-param="value" min="-100" max="100" value="' + op.params.value + '">' +
                        '<span class="param-val">' + op.params.value + '%</span>' +
                        '</div>';

                case 'saturation':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.saturation') + '</label>' +
                        '<input type="range" class="op-param" data-param="value" min="-100" max="100" value="' + op.params.value + '">' +
                        '<span class="param-val">' + op.params.value + '%</span>' +
                        '</div>';

                case 'hue':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.hue') + '</label>' +
                        '<input type="range" class="op-param" data-param="value" min="-180" max="180" value="' + op.params.value + '">' +
                        '<span class="param-val">' + op.params.value + '°</span>' +
                        '</div>';

                case 'blur':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.blur') + '</label>' +
                        '<input type="range" class="op-param" data-param="value" min="1" max="50" value="' + op.params.value + '">' +
                        '<span class="param-val">' + op.params.value + 'px</span>' +
                        '</div>';

                case 'sharpen':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.sharpen') + '</label>' +
                        '<input type="range" class="op-param" data-param="value" min="1" max="20" value="' + op.params.value + '">' +
                        '<span class="param-val">' + op.params.value + '</span>' +
                        '</div>';

                case 'mosaic':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.mosaic') + '</label>' +
                        '<input type="range" class="op-param" data-param="value" min="2" max="50" value="' + op.params.value + '">' +
                        '<span class="param-val">' + op.params.value + 'px</span>' +
                        '</div>';

                case 'negative':
                    return '';

                case 'rotate':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.rotate_angle') + '</label>' +
                        '<select class="op-param" data-param="angle">' +
                            '<option value="90"' + (op.params.angle === 90 ? ' selected' : '') + '>90°</option>' +
                            '<option value="180"' + (op.params.angle === 180 ? ' selected' : '') + '>180°</option>' +
                            '<option value="270"' + (op.params.angle === 270 ? ' selected' : '') + '>270°</option>' +
                        '</select></div>';

                case 'flip':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.flip_direction') + '</label>' +
                        '<select class="op-param" data-param="direction">' +
                            '<option value="horizontal"' + (op.params.direction === 'horizontal' ? ' selected' : '') + '>' + App.i18n.t('batch.flip_horizontal') + '</option>' +
                            '<option value="vertical"' + (op.params.direction === 'vertical' ? ' selected' : '') + '>' + App.i18n.t('batch.flip_vertical') + '</option>' +
                        '</select></div>';

                case 'crop':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.crop_mode') + '</label>' +
                        '<select class="op-param" data-param="mode">' +
                            '<option value="percent"' + (op.params.mode === 'percent' ? ' selected' : '') + '>' + App.i18n.t('batch.crop_percent') + '</option>' +
                            '<option value="pixel"' + (op.params.mode === 'pixel' ? ' selected' : '') + '>' + App.i18n.t('batch.crop_pixel') + '</option>' +
                        '</select></div>' +
                        '<div class="param-row">' +
                            '<label>X</label>' +
                            '<input type="number" class="op-param" data-param="x" value="' + op.params.x + '">' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label>Y</label>' +
                            '<input type="number" class="op-param" data-param="y" value="' + op.params.y + '">' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.width') + '</label>' +
                            '<input type="number" class="op-param" data-param="width" value="' + op.params.width + '">' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.height') + '</label>' +
                            '<input type="number" class="op-param" data-param="height" value="' + op.params.height + '">' +
                        '</div>';

                case 'textWatermark':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.text') + '</label>' +
                        '<input type="text" class="op-param" data-param="text" value="' + op.params.text + '">' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.font_size') + '</label>' +
                            '<input type="number" class="op-param" data-param="fontSize" value="' + op.params.fontSize + '" min="12" max="120">' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.color') + '</label>' +
                            '<input type="color" class="op-param" data-param="color" value="' + op.params.color + '">' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.opacity') + '</label>' +
                            '<input type="range" class="op-param" data-param="opacity" min="0" max="100" value="' + op.params.opacity + '">' +
                            '<span class="param-val">' + op.params.opacity + '%</span>' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.position') + '</label>' +
                            '<select class="op-param" data-param="position">' +
                                '<option value="top-left"' + (op.params.position === 'top-left' ? ' selected' : '') + '>' + App.i18n.t('batch.pos_top_left') + '</option>' +
                                '<option value="top-right"' + (op.params.position === 'top-right' ? ' selected' : '') + '>' + App.i18n.t('batch.pos_top_right') + '</option>' +
                                '<option value="bottom-left"' + (op.params.position === 'bottom-left' ? ' selected' : '') + '>' + App.i18n.t('batch.pos_bottom_left') + '</option>' +
                                '<option value="bottom-right"' + (op.params.position === 'bottom-right' ? ' selected' : '') + '>' + App.i18n.t('batch.pos_bottom_right') + '</option>' +
                                '<option value="center"' + (op.params.position === 'center' ? ' selected' : '') + '>' + App.i18n.t('batch.pos_center') + '</option>' +
                            '</select></div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.x_offset') + '</label>' +
                            '<input type="number" class="op-param" data-param="xOffset" value="' + op.params.xOffset + '">' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.y_offset') + '</label>' +
                            '<input type="number" class="op-param" data-param="yOffset" value="' + op.params.yOffset + '">' +
                        '</div>';

                case 'imageWatermark':
                    return '<div class="param-row">' +
                        '<label>' + App.i18n.t('batch.watermark_url') + '</label>' +
                        '<input type="text" class="op-param" data-param="url" value="' + op.params.url + '" placeholder="' + App.i18n.t('batch.watermark_url_placeholder') + '"> ' +
                        '<input type="file" class="watermark-file-input" accept="image/*" style="display:none">' +
                        '<button class="small-btn" onclick="this.previousElementSibling.previousElementSibling.click()">' + App.i18n.t('batch.upload') + '</button>' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.opacity') + '</label>' +
                            '<input type="range" class="op-param" data-param="opacity" min="0" max="100" value="' + op.params.opacity + '">' +
                            '<span class="param-val">' + op.params.opacity + '%</span>' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.position') + '</label>' +
                            '<select class="op-param" data-param="position">' +
                                '<option value="top-left"' + (op.params.position === 'top-left' ? ' selected' : '') + '>' + App.i18n.t('batch.pos_top_left') + '</option>' +
                                '<option value="top-right"' + (op.params.position === 'top-right' ? ' selected' : '') + '>' + App.i18n.t('batch.pos_top_right') + '</option>' +
                                '<option value="bottom-left"' + (op.params.position === 'bottom-left' ? ' selected' : '') + '>' + App.i18n.t('batch.pos_bottom_left') + '</option>' +
                                '<option value="bottom-right"' + (op.params.position === 'bottom-right' ? ' selected' : '') + '>' + App.i18n.t('batch.pos_bottom_right') + '</option>' +
                                '<option value="center"' + (op.params.position === 'center' ? ' selected' : '') + '>' + App.i18n.t('batch.pos_center') + '</option>' +
                            '</select></div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.scale') + '</label>' +
                            '<input type="range" class="op-param" data-param="scale" min="10" max="200" value="' + (op.params.scale * 100) + '">' +
                            '<span class="param-val">' + (op.params.scale * 100) + '%</span>' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.x_offset') + '</label>' +
                            '<input type="number" class="op-param" data-param="xOffset" value="' + op.params.xOffset + '">' +
                        '</div>' +
                        '<div class="param-row">' +
                            '<label>' + App.i18n.t('batch.y_offset') + '</label>' +
                            '<input type="number" class="op-param" data-param="yOffset" value="' + op.params.yOffset + '">' +
                        '</div>';

                default:
                    return '';
            }
        },

        bindOpParamEvents: function (item, op) {
            var self = this;
            var params = item.querySelectorAll('.op-param');

            params.forEach(function (input) {
                input.addEventListener('change', function () {
                    var paramName = this.dataset.param;
                    var value;

                    if (this.type === 'checkbox') {
                        value = this.checked;
                    } else if (this.type === 'number') {
                        value = parseFloat(this.value);
                    } else {
                        value = this.value;
                    }

                    if (paramName === 'quality' && op.type === 'compress' && op.params.mode === 'size') {
                        self.updateOperationParams(op.id, { targetSize: value });
                    } else {
                        self.updateOperationParams(op.id, { [paramName]: value });
                    }
                });

                if (input.type === 'range') {
                    input.addEventListener('input', function () {
                        var valSpan = this.nextElementSibling;
                        if (valSpan && valSpan.classList.contains('param-val')) {
                            valSpan.textContent = this.value;
                        }
                    });
                }
            });
        },

        startProcessing: function () {
            if (this.files.length === 0) {
                App.showToast(App.i18n.t('batch.add_files_first'));
                return;
            }
            if (this.operations.length === 0) {
                App.showToast(App.i18n.t('batch.add_ops_first'));
                return;
            }

            this.isProcessing = true;
            this.isPaused = false;
            this.currentIndex = 0;
            this.results = { success: 0, failed: 0, skipped: 0 };

            this.showProgressUI();
            this.processNext();
        },

        processNext: function () {
            if (!this.isProcessing) return;

            if (this.isPaused) return;

            if (this.currentIndex >= this.files.length) {
                this.finishProcessing();
                return;
            }

            var file = this.files[this.currentIndex];
            this.updateProgress();

            var self = this;
            this.processFile(file, this.currentIndex, function (success) {
                if (success) {
                    self.results.success++;
                } else {
                    self.results.failed++;
                }
                self.currentIndex++;
                setTimeout(function () { self.processNext(); }, 10);
            });
        },

        processFile: function (file, index, callback) {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var img = file.img;

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            var enabledOps = this.operations.filter(function (op) { return op.enabled; });

            var self = this;
            var processIndex = 0;

            function applyNextOperation() {
                if (processIndex >= enabledOps.length) {
                    self.outputFile(canvas, file, index, callback);
                    return;
                }

                var op = enabledOps[processIndex];
                processIndex++;

                self.applyOperation(canvas, ctx, op, function () {
                    applyNextOperation();
                });
            }

            applyNextOperation();
        },

        applyOperation: function (canvas, ctx, op, callback) {
            var imgData;
            switch (op.type) {
                case 'resize':
                    this.applyResize(canvas, ctx, op.params);
                    break;
                case 'format':
                case 'compress':
                    break;
                case 'rename':
                    break;
                case 'brightness':
                    this.applyBrightness(canvas, ctx, op.params.value);
                    break;
                case 'contrast':
                    this.applyContrast(canvas, ctx, op.params.value);
                    break;
                case 'saturation':
                    this.applySaturation(canvas, ctx, op.params.value);
                    break;
                case 'hue':
                    this.applyHue(canvas, ctx, op.params.value);
                    break;
                case 'blur':
                    this.applyBlur(canvas, ctx, op.params.value);
                    break;
                case 'sharpen':
                    this.applySharpen(canvas, ctx, op.params.value);
                    break;
                case 'mosaic':
                    this.applyMosaic(canvas, ctx, op.params.value);
                    break;
                case 'negative':
                    this.applyNegative(canvas, ctx);
                    break;
                case 'rotate':
                    this.applyRotate(canvas, ctx, op.params.angle);
                    break;
                case 'flip':
                    this.applyFlip(canvas, ctx, op.params.direction);
                    break;
                case 'crop':
                    this.applyCrop(canvas, ctx, op.params);
                    break;
                case 'textWatermark':
                    this.applyTextWatermark(canvas, ctx, op.params);
                    break;
                case 'imageWatermark':
                    this.applyImageWatermark(canvas, ctx, op.params);
                    break;
            }
            callback();
        },

        applyResize: function (canvas, ctx, params) {
            var img = this.currentResizeImage;
            if (!img) {
                img = new Image();
                img.src = canvas.toDataURL();
            }

            var w = canvas.width;
            var h = canvas.height;
            var newW, newH;

            switch (params.mode) {
                case 'longside':
                    var longside = Math.max(w, h);
                    if (longside <= params.value && !params.allowEnlarge) {
                        return;
                    }
                    var ratio = params.value / longside;
                    newW = Math.round(w * ratio);
                    newH = Math.round(h * ratio);
                    break;
                case 'shortside':
                    var shortside = Math.min(w, h);
                    if (shortside <= params.value && !params.allowEnlarge) {
                        return;
                    }
                    var ratio2 = params.value / shortside;
                    newW = Math.round(w * ratio2);
                    newH = Math.round(h * ratio2);
                    break;
                case 'width':
                    newW = params.value;
                    newH = params.maintain ? Math.round(h * (params.value / w)) : h;
                    break;
                case 'height':
                    newH = params.value;
                    newW = params.maintain ? Math.round(w * (params.value / h)) : w;
                    break;
                case 'percent':
                    newW = Math.round(w * params.value / 100);
                    newH = Math.round(h * params.value / 100);
                    break;
                case 'exact':
                    newW = params.value;
                    newH = params.maintain ? Math.round(h * (params.value / w)) : (params.height || h);
                    break;
            }

            if (newW === w && newH === h) return;

            var newCanvas = document.createElement('canvas');
            newCanvas.width = newW;
            newCanvas.height = newH;
            var newCtx = newCanvas.getContext('2d');
            newCtx.drawImage(canvas, 0, 0, newW, newH);

            canvas.width = newW;
            canvas.height = newH;
            ctx.clearRect(0, 0, newW, newH);
            ctx.drawImage(newCanvas, 0, 0);
        },

        applyBrightness: function (canvas, ctx, value) {
            if (value === 0) return;
            var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imgData.data;
            var brightness = value / 100;

            for (var i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, data[i] + brightness * 255));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness * 255));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness * 255));
            }

            ctx.putImageData(imgData, 0, 0);
        },

        applyContrast: function (canvas, ctx, value) {
            if (value === 0) return;
            var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imgData.data;
            var contrast = value / 100;
            var factor = (259 * (contrast + 100)) / (100 * (259 - contrast));

            for (var i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
                data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
                data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
            }

            ctx.putImageData(imgData, 0, 0);
        },

        applySaturation: function (canvas, ctx, value) {
            if (value === 0) return;
            var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imgData.data;
            var saturation = value / 100 + 1;

            for (var i = 0; i < data.length; i += 4) {
                var r = data[i], g = data[i + 1], b = data[i + 2];
                var gray = 0.299 * r + 0.587 * g + 0.114 * b;
                data[i] = Math.min(255, Math.max(0, gray + saturation * (r - gray)));
                data[i + 1] = Math.min(255, Math.max(0, gray + saturation * (g - gray)));
                data[i + 2] = Math.min(255, Math.max(0, gray + saturation * (b - gray)));
            }

            ctx.putImageData(imgData, 0, 0);
        },

        applyHue: function (canvas, ctx, value) {
            if (value === 0) return;
            var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imgData.data;
            var hueRotate = (value / 180) * Math.PI;
            var cos = Math.cos(hueRotate);
            var sin = Math.sin(hueRotate);

            for (var i = 0; i < data.length; i += 4) {
                var r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
                var newR = 0.213 + cos * (r - 0.213) + sin * (0.715 * g + 0.072 * b - 0.287);
                var newG = 0.715 + cos * (g - 0.715) + sin * (-0.213 * r - 0.715 * g + 0.928 * b);
                var newB = 0.072 + cos * (b - 0.072) + sin * (-0.213 * r - 0.715 * g + 0.928 * b);
                data[i] = Math.min(255, Math.max(0, newR * 255));
                data[i + 1] = Math.min(255, Math.max(0, newG * 255));
                data[i + 2] = Math.min(255, Math.max(0, newB * 255));
            }

            ctx.putImageData(imgData, 0, 0);
        },

        applyBlur: function (canvas, ctx, radius) {
            ctx.filter = 'blur(' + radius + 'px)';
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
        },

        applySharpen: function (canvas, ctx, strength) {
            var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imgData.data;
            var w = canvas.width;
            var h = canvas.height;
            var outputData = new Uint8ClampedArray(data.length);

            var kernel = [
                0, -strength, 0,
                -strength, 4 * strength + 1, -strength,
                0, -strength, 0
            ];

            for (var y = 1; y < h - 1; y++) {
                for (var x = 1; x < w - 1; x++) {
                    var idx = (y * w + x) * 4;
                    for (var c = 0; c < 3; c++) {
                        var sum = 0;
                        for (var ky = -1; ky <= 1; ky++) {
                            for (var kx = -1; kx <= 1; kx++) {
                                var kIdx = ((ky + 1) * 3 + (kx + 1));
                                var pixIdx = ((y + ky) * w + (x + kx)) * 4;
                                sum += data[pixIdx + c] * kernel[kIdx];
                            }
                        }
                        outputData[idx + c] = Math.min(255, Math.max(0, sum));
                    }
                    outputData[idx + 3] = data[idx + 3];
                }
            }

            for (var i = 0; i < data.length; i++) {
                data[i] = outputData[i];
            }

            ctx.putImageData(imgData, 0, 0);
        },

        applyMosaic: function (canvas, ctx, size) {
            var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imgData.data;
            var w = canvas.width;
            var h = canvas.height;

            for (var y = 0; y < h; y += size) {
                for (var x = 0; x < w; x += size) {
                    var sumR = 0, sumG = 0, sumB = 0;
                    var count = 0;

                    for (var dy = 0; dy < size && y + dy < h; dy++) {
                        for (var dx = 0; dx < size && x + dx < w; dx++) {
                            var idx = ((y + dy) * w + (x + dx)) * 4;
                            sumR += data[idx];
                            sumG += data[idx + 1];
                            sumB += data[idx + 2];
                            count++;
                        }
                    }

                    var avgR = Math.round(sumR / count);
                    var avgG = Math.round(sumG / count);
                    var avgB = Math.round(sumB / count);

                    for (var dy = 0; dy < size && y + dy < h; dy++) {
                        for (var dx = 0; dx < size && x + dx < w; dx++) {
                            var idx = ((y + dy) * w + (x + dx)) * 4;
                            data[idx] = avgR;
                            data[idx + 1] = avgG;
                            data[idx + 2] = avgB;
                        }
                    }
                }
            }

            ctx.putImageData(imgData, 0, 0);
        },

        applyNegative: function (canvas, ctx) {
            var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imgData.data;

            for (var i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }

            ctx.putImageData(imgData, 0, 0);
        },

        applyRotate: function (canvas, ctx, angle) {
            var w = canvas.width;
            var h = canvas.height;
            var newW = w, newH = h;
            
            if (angle === 90 || angle === 270) {
                newW = h;
                newH = w;
            }

            var newCanvas = document.createElement('canvas');
            newCanvas.width = newW;
            newCanvas.height = newH;
            var newCtx = newCanvas.getContext('2d');

            newCtx.save();
            newCtx.translate(newW / 2, newH / 2);
            newCtx.rotate((angle * Math.PI) / 180);
            newCtx.drawImage(canvas, -w / 2, -h / 2);
            newCtx.restore();

            canvas.width = newW;
            canvas.height = newH;
            ctx.drawImage(newCanvas, 0, 0);
        },

        applyFlip: function (canvas, ctx, direction) {
            ctx.save();
            if (direction === 'horizontal') {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            } else {
                ctx.translate(0, canvas.height);
                ctx.scale(1, -1);
            }
            ctx.drawImage(canvas, 0, 0);
            ctx.restore();
        },

        applyCrop: function (canvas, ctx, params) {
            var x = params.x;
            var y = params.y;
            var width = params.width;
            var height = params.height;

            if (params.mode === 'percent') {
                x = Math.round((x / 100) * canvas.width);
                y = Math.round((y / 100) * canvas.height);
                width = Math.round((width / 100) * canvas.width);
                height = Math.round((height / 100) * canvas.height);
            }

            x = Math.max(0, Math.min(canvas.width - 1, x));
            y = Math.max(0, Math.min(canvas.height - 1, y));
            width = Math.max(1, Math.min(canvas.width - x, width));
            height = Math.max(1, Math.min(canvas.height - y, height));

            var imgData = ctx.getImageData(x, y, width, height);
            canvas.width = width;
            canvas.height = height;
            ctx.putImageData(imgData, 0, 0);
        },

        applyTextWatermark: function (canvas, ctx, params) {
            var text = params.text || App.i18n.t('batch.watermark_default');
            var fontSize = params.fontSize || 24;
            var color = params.color || '#ffffff';
            var opacity = (params.opacity || 50) / 100;
            var position = params.position || 'bottom-right';
            var xOffset = params.xOffset || 20;
            var yOffset = params.yOffset || 20;

            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.font = fontSize + 'px Arial';
            ctx.fillStyle = color;

            var metrics = ctx.measureText(text);
            var textWidth = metrics.width;
            var textHeight = fontSize;

            var x, y;
            switch (position) {
                case 'top-left':
                    x = xOffset;
                    y = yOffset + fontSize;
                    break;
                case 'top-right':
                    x = canvas.width - textWidth - xOffset;
                    y = yOffset + fontSize;
                    break;
                case 'bottom-left':
                    x = xOffset;
                    y = canvas.height - yOffset;
                    break;
                case 'bottom-right':
                    x = canvas.width - textWidth - xOffset;
                    y = canvas.height - yOffset;
                    break;
                case 'center':
                    x = (canvas.width - textWidth) / 2;
                    y = (canvas.height + fontSize) / 2;
                    break;
            }

            ctx.fillText(text, x, y);
            ctx.restore();
        },

        applyImageWatermark: function (canvas, ctx, params) {
            var url = params.url;
            var opacity = (params.opacity || 50) / 100;
            var position = params.position || 'bottom-right';
            var xOffset = params.xOffset || 20;
            var yOffset = params.yOffset || 20;
            var scale = params.scale || 1;

            if (!url) return;

            var watermarkImg = new Image();
            watermarkImg.crossOrigin = 'anonymous';
            watermarkImg.onload = function () {
                ctx.save();
                ctx.globalAlpha = opacity;

                var w = watermarkImg.width * scale;
                var h = watermarkImg.height * scale;

                var x, y;
                switch (position) {
                    case 'top-left':
                        x = xOffset;
                        y = yOffset;
                        break;
                    case 'top-right':
                        x = canvas.width - w - xOffset;
                        y = yOffset;
                        break;
                    case 'bottom-left':
                        x = xOffset;
                        y = canvas.height - h - yOffset;
                        break;
                    case 'bottom-right':
                        x = canvas.width - w - xOffset;
                        y = canvas.height - h - yOffset;
                        break;
                    case 'center':
                        x = (canvas.width - w) / 2;
                        y = (canvas.height - h) / 2;
                        break;
                }

                ctx.drawImage(watermarkImg, x, y, w, h);
                ctx.restore();
            };
            watermarkImg.src = url;
        },

        processedFiles: [],

        outputFile: function (canvas, file, index, callback) {
            var self = this;
            var format = this.outputSettings.format;
            var quality = this.outputSettings.quality / 100;
            var mimeType = 'image/jpeg';

            var renameOp = this.operations.find(function (op) { return op.type === 'rename' && op.enabled; });
            var newName = file.name;

            if (renameOp) {
                var params = renameOp.params;
                var num = (params.startNum || 1) + index;
                var numStr = num.toString().padStart(params.digits || 3, '0');

                if (params.pattern === 'prefix_num') {
                    newName = params.prefix + '_' + numStr;
                } else {
                    var dotIndex = file.name.lastIndexOf('.');
                    var baseName = dotIndex > 0 ? file.name.substring(0, dotIndex) : file.name;
                    newName = baseName + '_' + numStr;
                }
            }

            if (format !== 'same') {
                newName = newName.substring(0, newName.lastIndexOf('.')) + '.' + format;
            }

            switch (format) {
                case 'png':
                    mimeType = 'image/png';
                    quality = 1;
                    break;
                case 'webp':
                    mimeType = 'image/webp';
                    break;
                case 'bmp':
                    mimeType = 'image/bmp';
                    quality = 1;
                    break;
                case 'jpg':
                    mimeType = 'image/jpeg';
                    break;
                case 'same':
                default:
                    var ext = file.name.split('.').pop().toLowerCase();
                    if (ext === 'png') {
                        mimeType = 'image/png';
                        quality = 1;
                    } else if (ext === 'webp') {
                        mimeType = 'image/webp';
                    } else if (ext === 'bmp') {
                        mimeType = 'image/bmp';
                        quality = 1;
                    } else {
                        mimeType = 'image/jpeg';
                    }
                    break;
            }

            var dataUrl = canvas.toDataURL(mimeType, quality);

            this.processedFiles.push({
                name: newName,
                dataUrl: dataUrl
            });

            if (this.onFileProcessed) {
                this.onFileProcessed({
                    name: newName,
                    dataUrl: dataUrl,
                    width: canvas.width,
                    height: canvas.height
                }, this.currentIndex, this.files.length);
            }

            callback(true);
        },

        downloadFile: function (name, dataUrl) {
            var link = document.createElement('a');
            link.href = dataUrl;
            link.download = name;
            link.setAttribute('type', this.getMimeTypeFromName(name));
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        getMimeTypeFromName: function (fileName) {
            var ext = fileName.split('.').pop().toLowerCase();
            switch (ext) {
                case 'png': return 'image/png';
                case 'webp': return 'image/webp';
                case 'bmp': return 'image/bmp';
                case 'jpg':
                case 'jpeg':
                case 'jfif': return 'image/jpeg';
                default: return 'image/jpeg';
            }
        },

        downloadAllFiles: function () {
            var self = this;
            this.processedFiles.forEach(function (file, index) {
                setTimeout(function () {
                    self.downloadFile(file.name, file.dataUrl);
                }, index * 500);
            });
        },

        showProgressUI: function () {
            var els = App.els();
            if (els.batchProgressSection) {
                els.batchProgressSection.style.display = 'block';
                els.batchProgressSection.style.display = 'flex';
            }
            if (els.batchProgressOverlay) {
                els.batchProgressOverlay.style.display = 'flex';
            }
            this.updateProgress();
        },

        hideProgressUI: function () {
            var els = App.els();
            if (els.batchProgressSection) els.batchProgressSection.style.display = 'none';
            if (els.batchProgressOverlay) els.batchProgressOverlay.style.display = 'none';
        },

        updateProgress: function () {
            var els = App.els();
            var total = this.files.length;
            var current = this.currentIndex + 1;
            var percent = Math.round((current / total) * 100);

            if (els.batchProgressBar) {
                els.batchProgressBar.style.width = percent + '%';
            }
            if (els.batchProgressText) {
                els.batchProgressText.textContent = App.i18n.t('batch.processing') + ': ' + current + ' / ' + total + ' (' + percent + '%)';
            }
            if (els.batchCurrentFile) {
                var file = this.files[this.currentIndex];
                if (file) {
                    els.batchCurrentFile.innerHTML =
                        '<img src="' + file.dataUrl + '" alt="">' +
                        '<span>' + file.name + '</span>';
                }
            }
        },

        finishProcessing: function () {
            this.isProcessing = false;
            this.hideProgressUI();

            var msg = App.i18n.t('batch.complete') + App.i18n.t('batch.success_count').replace('{success}', this.results.success) + ' ' + App.i18n.t('batch.failed_count').replace('{failed}', this.results.failed);
            App.showToast(msg);

            if (this.processedFiles.length > 0) {
                setTimeout(function () {
                    BatchProcess.downloadAllFiles();
                }, 1000);
            }
        },

        pauseProcessing: function () {
            this.isPaused = true;
        },

        resumeProcessing: function () {
            this.isPaused = false;
            this.processNext();
        },

        cancelProcessing: function () {
            this.isProcessing = false;
            this.isPaused = false;
            this.hideProgressUI();
        },

        setOutputFormat: function (format) {
            this.outputSettings.format = format;
        },

        setOutputQuality: function (quality) {
            this.outputSettings.quality = quality;
        }
    };

    window.App = window.App || {};
    App.BatchProcess = BatchProcess;
})();
