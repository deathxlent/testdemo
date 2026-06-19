(function () {
    function doExport() {
        var imgObj = App.getActiveImage();
        if (!imgObj) {
            alert('请先打开一张图片');
            return;
        }

        var canvas = document.createElement('canvas');
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        var ctx = canvas.getContext('2d');

        ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);

        if (imgObj.pencilCanvas) {
            ctx.drawImage(imgObj.pencilCanvas, 0, 0);
        }

        imgObj.objects.forEach(function (obj) {
            if (obj.type === 'watermark') {
                renderWatermark(ctx, obj);
            } else if (obj.type === 'text') {
                renderText(ctx, obj);
            } else if (obj.type === 'localzoom') {
                renderLocalZoom(ctx, obj, imgObj);
            }
        });

        canvas.toBlob(function (blob) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'edited_' + imgObj.name.replace(/\.[^.]+$/, '') + '.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    function renderWatermark(ctx, obj) {
        if (!obj.img || !obj.width || !obj.height) return;

        var cx = obj.x + obj.width / 2;
        var cy = obj.y + obj.height / 2;

        ctx.save();
        ctx.globalAlpha = obj.opacity / 100;
        ctx.translate(cx, cy);
        ctx.rotate(obj.rotation * Math.PI / 180);
        ctx.drawImage(obj.img, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
        ctx.restore();
    }

    function renderText(ctx, obj) {
        if (!obj.text) return;

        var padLeft = obj.fontSize * 0.1;
        var padTop = obj.fontSize * 0.2;

        var fontStr = App.buildFontStr(obj, false);
        ctx.font = fontStr;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';

        var lines = obj.text.split('\n');
        var lineHeight = obj.fontSize * 1.2;

        lines.forEach(function (line, i) {
            var x = obj.x + padLeft;
            var y = obj.y + padTop + i * lineHeight;

            if (obj.shadow && obj.shadow.enabled) {
                ctx.save();
                ctx.shadowColor = obj.shadow.color;
                ctx.shadowOffsetX = obj.shadow.offsetX;
                ctx.shadowOffsetY = obj.shadow.offsetY;
                ctx.shadowBlur = obj.shadow.blur;
                ctx.fillStyle = obj.color;
                ctx.fillText(line, x, y);
                ctx.restore();
            }

            if (obj.stroke && obj.stroke.enabled && obj.stroke.width > 0) {
                ctx.save();
                ctx.strokeStyle = obj.stroke.color;
                ctx.lineWidth = obj.stroke.width;
                ctx.lineJoin = 'round';
                ctx.strokeText(line, x, y);
                ctx.restore();
            }

            ctx.fillStyle = obj.color;
            ctx.fillText(line, x, y);
        });
    }

    function drawBorder(ctx, x, y, w, h, border) {
        if (!border || !border.width || border.style === 'none') return;
        ctx.save();
        ctx.strokeStyle = border.color;
        ctx.lineWidth = border.width;
        var b = border.width / 2;
        if (border.style === 'dashed') ctx.setLineDash([border.width * 2, border.width]);
        else if (border.style === 'dotted') ctx.setLineDash([border.width, border.width]);
        else if (border.style === 'double') ctx.lineWidth = border.width * 3;
        ctx.strokeRect(x + b, y + b, w - 2 * b, h - 2 * b);
        ctx.restore();
    }

    function renderLocalZoom(ctx, obj, imgObj) {
        drawBorder(ctx, obj.srcX, obj.srcY, obj.srcW, obj.srcH, obj.srcBorder);
        var bw = Math.round(obj.srcW * obj.scale);
        var bh = Math.round(obj.srcH * obj.scale);
        var tmp = document.createElement('canvas');
        tmp.width = bw;
        tmp.height = bh;
        var tctx = tmp.getContext('2d');
        tctx.save();
        if (obj.srcShape === 'ellipse') {
            tctx.beginPath();
            tctx.ellipse(bw / 2, bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2);
            tctx.clip();
        }
        tctx.imageSmoothingQuality = 'high';
        tctx.drawImage(
            imgObj.img,
            obj.srcX, obj.srcY, obj.srcW, obj.srcH,
            0, 0, bw, bh
        );
        tctx.restore();
        ctx.drawImage(tmp, obj.x, obj.y, bw, bh);
        drawBorder(ctx, obj.x, obj.y, bw, bh, obj.srcBorder);
    }

    function setupEvents() {
        App.els().exportBtn.addEventListener('click', doExport);
    }

    App.Export = {
        doExport: doExport,
        renderWatermark: renderWatermark,
        renderText: renderText,
        setupEvents: setupEvents
    };
})();
