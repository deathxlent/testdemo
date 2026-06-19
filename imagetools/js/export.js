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

        imgObj.objects.forEach(function (obj) {
            if (obj.type === 'watermark') {
                renderWatermark(ctx, obj);
            } else if (obj.type === 'text') {
                renderText(ctx, obj);
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
