(function () {
    'use strict';

    function showLiveHistogram() {
        var els = App.els();
        if (els.liveHistogram) els.liveHistogram.style.display = 'block';
    }

    function hideLiveHistogram() {
        var els = App.els();
        if (els.liveHistogram) els.liveHistogram.style.display = 'none';
    }

    function updateLiveHistogram(imgSrc) {
        if (!imgSrc) return;
        var els = App.els();
        if (!els.liveHistogram || els.liveHistogram.style.display === 'none') return;
        var w = imgSrc.naturalWidth || imgSrc.width;
        var h = imgSrc.naturalHeight || imgSrc.height;
        if (!w || !h) return;
        var maxPx = 400 * 400;
        var scale = Math.min(1, Math.sqrt(maxPx / (w * h)));
        var sw = Math.max(32, Math.round(w * scale));
        var sh = Math.max(32, Math.round(h * scale));
        var cv = document.createElement('canvas');
        cv.width = sw; cv.height = sh;
        var c = cv.getContext('2d');
        try {
            c.drawImage(imgSrc, 0, 0, sw, sh);
        } catch(e) { return; }
        var data = c.getImageData(0, 0, sw, sh).data;
        var lumH = new Uint32Array(256);
        var rH = new Uint32Array(256), gH = new Uint32Array(256), bH = new Uint32Array(256);
        var maxLum = 0, maxR = 0, maxG = 0, maxB = 0;
        var total = 0;
        for (var i = 0; i < data.length; i += 4) {
            var rv = data[i], gv = data[i+1], bv = data[i+2];
            var y = (0.299 * rv + 0.587 * gv + 0.114 * bv) | 0;
            if (y < 0) y = 0; if (y > 255) y = 255;
            lumH[y]++; rH[rv]++; gH[gv]++; bH[bv]++;
            if (lumH[y] > maxLum) maxLum = lumH[y];
            if (rH[rv] > maxR) maxR = rH[rv];
            if (gH[gv] > maxG) maxG = gH[gv];
            if (bH[bv] > maxB) maxB = bH[bv];
            total++;
        }
        maxR = Math.max(maxR, 1); maxG = Math.max(maxG, 1); maxB = Math.max(maxB, 1); maxLum = Math.max(maxLum, 1);
        var maxOverlay = Math.max(rH[0], gH[0], bH[0]);
        for (var bi = 1; bi < 256; bi++) {
            var t = Math.max(rH[bi], gH[bi], bH[bi]);
            if (t > maxOverlay) maxOverlay = t;
        }
        maxOverlay = Math.max(maxOverlay, 1);

        drawHistogramBar(els.lhLum, lumH, maxLum, '#e0e0e0', '#909090');
        drawHistogramBar(els.lhR, rH, maxR, '#ff6060', '#b03030');
        drawHistogramBar(els.lhG, gH, maxG, '#60ff60', '#30b030');
        drawHistogramBar(els.lhB, bH, maxB, '#6080ff', '#3050c0');
        drawHistogramOverlay(els.lhOverlay, rH, gH, bH, maxOverlay);
    }

    function drawHistogramBar(canvas, hist, maxV, color, lineColor) {
        if (!canvas) return;
        var W = canvas.width, H = canvas.height;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);
        var grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, color);
        grad.addColorStop(1, lineColor || color);
        var barW = W / 256;
        for (var i = 0; i < 256; i++) {
            var bh = (hist[i] / maxV) * (H - 2);
            ctx.fillStyle = i % 32 === 0 ? 'rgba(120,120,120,0.15)' : grad;
            ctx.fillRect(i * barW, H - bh, Math.max(1, barW), bh);
        }
        if (lineColor) {
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (var j = 0; j < 256; j++) {
                var jh = (hist[j] / maxV) * (H - 2);
                if (j === 0) ctx.moveTo(j * barW + barW/2, H - jh);
                else ctx.lineTo(j * barW + barW/2, H - jh);
            }
            ctx.stroke();
        }
    }

    function drawHistogramOverlay(canvas, rH, gH, bH, maxV) {
        if (!canvas) return;
        var W = canvas.width, H = canvas.height;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);
        var barW = W / 256;
        function draw(hist, col) {
            ctx.fillStyle = col;
            for (var i = 0; i < 256; i++) {
                var bh = (hist[i] / maxV) * (H - 2);
                ctx.globalAlpha = 0.45;
                ctx.fillRect(i * barW, H - bh, Math.max(1, barW), bh);
            }
            ctx.globalAlpha = 1;
        }
        draw(rH, '#ff3030');
        draw(gH, '#30ff30');
        draw(bH, '#3060ff');
    }

    App.FilterHistogram = {
        show: showLiveHistogram,
        hide: hideLiveHistogram,
        update: updateLiveHistogram
    };
})();
