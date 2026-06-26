(function () {
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatDate(date) {
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    function showImageInfo() {
        var imgObj = App.getActiveImage();
        if (!imgObj) {
            App.showToast(App.i18n.t('dialog.open_image_first'));
            return;
        }

        var now = new Date();
        var canvas = document.createElement('canvas');
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(imgObj.img, 0, 0);
        
        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imgData.data;
        
        var totalR = 0, totalG = 0, totalB = 0;
        var pixelCount = data.length / 4;
        
        for (var i = 0; i < data.length; i += 4) {
            totalR += data[i];
            totalG += data[i + 1];
            totalB += data[i + 2];
        }
        
        var avgR = Math.round(totalR / pixelCount);
        var avgG = Math.round(totalG / pixelCount);
        var avgB = Math.round(totalB / pixelCount);

        var dialog = document.createElement('div');
        dialog.className = 'export-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay" onclick="this.parentElement.remove()"></div>
            <div class="dialog-content" style="width: 450px;">
                <div class="dialog-header">
                    <span>` + App.i18n.t('info.title') + `</span>
                    <button class="dialog-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="dialog-body" style="max-height: 400px; overflow-y: auto;">
                    <div class="info-section">
                        <div class="info-title">` + App.i18n.t('info.basic') + `</div>
                        <div class="info-row">
                            <span class="info-label">` + App.i18n.t('info.filename') + `</span>
                            <span class="info-value">${imgObj.name}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">` + App.i18n.t('info.filesize') + `</span>
                            <span class="info-value">${formatFileSize(imgObj.size || 0)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">` + App.i18n.t('info.format') + `</span>
                            <span class="info-value">${imgObj.name.split('.').pop().toUpperCase()}</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-title">` + App.i18n.t('info.dimensions') + `</div>
                        <div class="info-row">
                            <span class="info-label">` + App.i18n.t('info.width') + `</span>
                            <span class="info-value">${imgObj.width} px</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">` + App.i18n.t('info.height') + `</span>
                            <span class="info-value">${imgObj.height} px</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">` + App.i18n.t('info.resolution') + `</span>
                            <span class="info-value">${imgObj.width} × ${imgObj.height}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">` + App.i18n.t('info.aspect_ratio') + `</span>
                            <span class="info-value">${(imgObj.width / imgObj.height).toFixed(4)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">` + App.i18n.t('info.total_pixels') + `</span>
                            <span class="info-value">${(imgObj.width * imgObj.height).toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-title">` + App.i18n.t('info.color') + `</div>
                        <div class="info-row">
                            <span class="info-label">` + App.i18n.t('info.avg_color') + `</span>
                            <span class="info-value">
                                <span class="color-box" style="background: rgb(${avgR},${avgG},${avgB})"></span>
                                RGB(${avgR}, ${avgG}, ${avgB})
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">` + App.i18n.t('info.bit_depth') + `</span>
                            <span class="info-value">24 ` + App.i18n.t('info.bit') + ` (RGB)</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">` + App.i18n.t('info.color_mode') + `</span>
                            <span class="info-value">RGB</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-title">` + App.i18n.t('info.other') + `</div>
                        <div class="info-row">
                            <span class="info-label">` + App.i18n.t('info.view_time') + `</span>
                            <span class="info-value">${formatDate(now)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">` + App.i18n.t('info.objects') + `</span>
                            <span class="info-value">${imgObj.objects ? imgObj.objects.length : 0}</span>
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn-confirm" onclick="this.parentElement.parentElement.remove()">` + App.i18n.t('dialog.close') + `</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    function setupEvents() {
        var infoBtn = document.getElementById('infoBtn');
        if (infoBtn) {
            infoBtn.addEventListener('click', showImageInfo);
        }
        var zoomInfoBtn = document.getElementById('zoomInfoBtn');
        if (zoomInfoBtn) {
            zoomInfoBtn.addEventListener('click', showImageInfo);
        }
    }

    App.Info = {
        showImageInfo: showImageInfo,
        setupEvents: setupEvents
    };
})();