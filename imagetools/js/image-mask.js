(function () {
    var _currentType = 'rect';

    function activate() {
        var imgObj = App.getActiveImage();
        if (!imgObj) { alert(App.i18n.t('dialog.open_image_first')); return false; }
        App.state.activeImgTool = 'mask';
        App.Text.deselectAll();
        App.els().maskPropsSection.style.display = 'block';
        onTypeChange();
        return true;
    }

    function deactivate() {
        App.els().maskPropsSection.style.display = 'none';
        App.state.activeMask = null;
        App.state.polygonPoints = [];
        App.state.isDrawingPolygon = false;
        _currentType = 'rect';
        App.clearOperationLayer();
        if (App.state.activeImgTool === 'mask') {
            App.state.activeImgTool = null;
        }
    }

    function onTypeChange() {
        _currentType = App.els().maskType.value;
        var els = App.els();
        App.state.activeMask = null;
        App.state.polygonPoints = [];
        App.state.isDrawingPolygon = false;

        if (_currentType === 'polygon') {
            els.maskSizeInfo.style.display = 'none';
            els.createMaskBtn.style.display = 'none';
            els.clearMaskPoints.style.display = 'inline-block';
            App.state.isDrawingPolygon = true;
            App.els().imgOperationLayer.classList.add('active');
            renderPolygon();
        } else {
            els.maskSizeInfo.style.display = 'block';
            els.createMaskBtn.style.display = 'inline-block';
            els.clearMaskPoints.style.display = 'none';
            buildSizeInputs();
            App.clearOperationLayer();
        }
    }

    function buildSizeInputs() {
        var cont = App.els().maskSizeContent;
        cont.innerHTML = '';
        if (_currentType === 'circle') {
            cont.innerHTML =
                '<div class="prop-group">' +
                '<label>' + App.i18n.t('mask.radius') + '</label>' +
                '<input type="number" id="maskRadius" min="5" step="1" value="' + Math.max(50, Math.floor(Math.min(App.getActiveImage().width, App.getActiveImage().height) / 4)) + '">' +
                '</div>';
        } else {
            cont.innerHTML =
                '<div class="prop-group two-col">' +
                '<div>' +
                '<label>' + App.i18n.t('mask.width') + '</label>' +
                '<input type="number" id="maskW" min="10" step="1" value="' + Math.max(200, Math.floor(App.getActiveImage().width / 2)) + '">' +
                '</div>' +
                '<div>' +
                '<label>' + App.i18n.t('mask.height') + '</label>' +
                '<input type="number" id="maskH" min="10" step="1" value="' + Math.max(150, Math.floor(App.getActiveImage().height / 2)) + '">' +
                '</div>' +
                '</div>' +
                '<div class="prop-group">' +
                '<label class="chk-label"><input type="checkbox" id="maskLockRatio"> ' + App.i18n.t('mask.lock_ratio') + '</label>' +
                '</div>';
            setTimeout(bindRatioEvents, 0);
        }
    }

    function bindRatioEvents() {
        var lock = document.getElementById('maskLockRatio');
        var wEl = document.getElementById('maskW');
        var hEl = document.getElementById('maskH');
        if (!lock || !wEl || !hEl) return;
        var ratio = parseInt(wEl.value) / parseInt(hEl.value);
        wEl.addEventListener('input', function () {
            if (lock.checked) {
                var w = parseInt(wEl.value) || 10;
                hEl.value = Math.max(10, Math.round(w / ratio));
            }
        });
        hEl.addEventListener('input', function () {
            if (lock.checked) {
                var h = parseInt(hEl.value) || 10;
                wEl.value = Math.max(10, Math.round(h * ratio));
            }
        });
    }

    function createMask() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var m;
        if (_currentType === 'circle') {
            var r = parseInt(document.getElementById('maskRadius').value) || 50;
            m = { type: 'circle', x: imgObj.width / 2, y: imgObj.height / 2, rx: r, ry: r };
        } else {
            var w = parseInt(document.getElementById('maskW').value) || 200;
            var h = parseInt(document.getElementById('maskH').value) || 150;
            m = { type: _currentType, x: (imgObj.width - w) / 2, y: (imgObj.height - h) / 2, w: w, h: h };
        }
        App.state.activeMask = m;
        renderMask();
    }

    function renderMask() {
        var m = App.state.activeMask;
        if (!m) return;
        var layer = App.els().imgOperationLayer;
        layer.classList.add('active');
        layer.innerHTML = '';

        renderDimOverlay();

        var shape = document.createElement('div');
        shape.className = 'mask-shape';

        if (m.type === 'rect') {
            shape.classList.add('rect-mask');
            shape.style.left = App.toDisplay(m.x) + 'px';
            shape.style.top = App.toDisplay(m.y) + 'px';
            shape.style.width = App.toDisplay(m.w) + 'px';
            shape.style.height = App.toDisplay(m.h) + 'px';
            ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].forEach(function (d) {
                var h = document.createElement('div');
                h.className = 'resize-handle h-' + d;
                h.dataset.dir = d;
                shape.appendChild(h);
            });
            bindShapeEvents(shape, 'rect');
        } else if (m.type === 'circle') {
            shape.classList.add('circle-mask');
            var rDisp = App.toDisplay(m.rx);
            shape.style.width = rDisp * 2 + 'px';
            shape.style.height = rDisp * 2 + 'px';
            shape.style.left = App.toDisplay(m.x - m.rx) + 'px';
            shape.style.top = App.toDisplay(m.y - m.ry) + 'px';
            bindShapeEvents(shape, 'circle');
        } else if (m.type === 'ellipse') {
            shape.classList.add('ellipse-mask');
            shape.style.left = App.toDisplay(m.x) + 'px';
            shape.style.top = App.toDisplay(m.y) + 'px';
            shape.style.width = App.toDisplay(m.w) + 'px';
            shape.style.height = App.toDisplay(m.h) + 'px';
            ['w', 'e', 'n', 's'].forEach(function (d) {
                var h = document.createElement('div');
                h.className = 'resize-handle h-' + d;
                h.dataset.dir = d;
                shape.appendChild(h);
            });
            bindShapeEvents(shape, 'ellipse');
        }
        layer.appendChild(shape);
    }

    function renderDimOverlay() {
        var imgObj = App.getActiveImage();
        var m = App.state.activeMask;
        if (!m) return;
        var layer = App.els().imgOperationLayer;
        var dim = document.createElement('div');
        dim.className = 'crop-dim';
        var disp;
        if (m.type === 'rect' || m.type === 'ellipse') {
            disp = { x: App.toDisplay(m.x), y: App.toDisplay(m.y), w: App.toDisplay(m.w), h: App.toDisplay(m.h) };
        } else if (m.type === 'circle') {
            disp = { x: App.toDisplay(m.x - m.rx), y: App.toDisplay(m.y - m.ry), w: App.toDisplay(m.rx) * 2, h: App.toDisplay(m.ry) * 2 };
        }
        dim.innerHTML =
            '<div class="crop-dim-top" style="height:' + disp.y + 'px"></div>' +
            '<div class="crop-dim-bottom" style="height:' + (App.toDisplay(imgObj.height) - disp.y - disp.h) + 'px"></div>' +
            '<div class="crop-dim-left" style="top:' + disp.y + 'px;height:' + disp.h + 'px;width:' + disp.x + 'px"></div>' +
            '<div class="crop-dim-right" style="top:' + disp.y + 'px;height:' + disp.h + 'px;width:' + (App.toDisplay(imgObj.width) - disp.x - disp.w) + 'px"></div>';
        layer.appendChild(dim);
    }

    function bindShapeEvents(shape, type) {
        var _ds = null;
        shape.addEventListener('mousedown', function (e) {
            var handle = e.target.closest('.resize-handle');
            e.stopPropagation();
            e.preventDefault();
            var m = App.state.activeMask;
            if (!m) return;

            if (handle) {
                _ds = { type: 'resize', dir: handle.dataset.dir, sx: e.clientX, sy: e.clientY, backup: JSON.parse(JSON.stringify(m)) };
            } else {
                _ds = { type: 'move', sx: e.clientX, sy: e.clientY, backup: JSON.parse(JSON.stringify(m)) };
            }

            var onMove = function (ev) {
                if (!_ds) return;
                var imgObj = App.getActiveImage();
                var dx = App.toImage(ev.clientX - _ds.sx);
                var dy = App.toImage(ev.clientY - _ds.sy);
                var b = _ds.backup;
                if (_ds.type === 'move') {
                    if (type === 'circle') {
                        m.x = App.clamp(b.x + dx, b.rx, imgObj.width - b.rx);
                        m.y = App.clamp(b.y + dy, b.ry, imgObj.height - b.ry);
                    } else {
                        m.x = App.clamp(b.x + dx, 0, imgObj.width - b.w);
                        m.y = App.clamp(b.y + dy, 0, imgObj.height - b.h);
                    }
                } else {
                    var d = _ds.dir;
                    if (type === 'rect') {
                        var x = b.x, y = b.y, w = b.w, h = b.h;
                        if (d.indexOf('e') !== -1) w = Math.max(10, w + dx);
                        if (d.indexOf('s') !== -1) h = Math.max(10, h + dy);
                        if (d.indexOf('w') !== -1) { var nw = Math.max(10, w - dx); x = x + (w - nw); w = nw; }
                        if (d.indexOf('n') !== -1) { var nh = Math.max(10, h - dy); y = y + (h - nh); h = nh; }
                        x = App.clamp(x, 0, imgObj.width);
                        y = App.clamp(y, 0, imgObj.height);
                        w = Math.min(w, imgObj.width - x);
                        h = Math.min(h, imgObj.height - y);
                        m.x = x; m.y = y; m.w = w; m.h = h;
                    } else if (type === 'ellipse') {
                        var w2 = b.w, h2 = b.h, x2 = b.x, y2 = b.y;
                        if (d === 'e') w2 = Math.max(20, w2 + dx);
                        if (d === 'w') { var nw2 = Math.max(20, w2 - dx); x2 = x2 + (w2 - nw2); w2 = nw2; }
                        if (d === 's') h2 = Math.max(20, h2 + dy);
                        if (d === 'n') { var nh2 = Math.max(20, h2 - dy); y2 = y2 + (h2 - nh2); h2 = nh2; }
                        x2 = App.clamp(x2, 0, imgObj.width);
                        y2 = App.clamp(y2, 0, imgObj.height);
                        w2 = Math.min(w2, imgObj.width - x2);
                        h2 = Math.min(h2, imgObj.height - y2);
                        m.x = x2; m.y = y2; m.w = w2; m.h = h2;
                    } else if (type === 'circle') {
                        var nr = Math.max(10, b.rx + dx);
                        var lim = Math.min(b.x, imgObj.width - b.x, b.y, imgObj.height - b.y);
                        nr = Math.min(nr, Math.max(5, lim));
                        m.rx = nr;
                        m.ry = nr;
                    }
                }
                renderMask();
            };

            var onUp = function () {
                _ds = null;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });

        shape.addEventListener('dblclick', function (e) {
            e.stopPropagation();
            executeMask();
        });
    }

    function onImgClick(e) {
        if (App.state.activeImgTool !== 'mask' || !App.state.isDrawingPolygon) return;
        var wrapper = App.els().canvasWrapper.getBoundingClientRect();
        var x = App.toImage(e.clientX - wrapper.left);
        var y = App.toImage(e.clientY - wrapper.top);
        App.state.polygonPoints.push({ x: x, y: y });
        renderPolygon();
    }

    function clearPolygonPoints() {
        App.state.polygonPoints = [];
        renderPolygon();
    }

    function renderPolygon() {
        var layer = App.els().imgOperationLayer;
        if (!App.state.isDrawingPolygon) return;
        layer.classList.add('active');
        layer.innerHTML = '';
        var pts = App.state.polygonPoints;

        if (pts.length >= 1) {
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.style.position = 'absolute';
            svg.style.left = '0';
            svg.style.top = '0';
            svg.style.width = App.toDisplay(App.getActiveImage().width) + 'px';
            svg.style.height = App.toDisplay(App.getActiveImage().height) + 'px';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '15';

            if (pts.length >= 3) {
                var dimpoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                var dimpts = [];
                pts.forEach(function (p) { dimpts.push(App.toDisplay(p.x) + ',' + App.toDisplay(p.y)); });
                dimpoly.setAttribute('points', dimpts.join(' '));
                dimpoly.setAttribute('fill', 'rgba(0,120,215,0.15)');
                dimpoly.setAttribute('stroke', '#0078d7');
                dimpoly.setAttribute('stroke-width', '1.5');
                dimpoly.setAttribute('stroke-dasharray', '4,3');
                svg.appendChild(dimpoly);
            } else if (pts.length >= 2) {
                for (var i = 0; i < pts.length - 1; i++) {
                    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', App.toDisplay(pts[i].x));
                    line.setAttribute('y1', App.toDisplay(pts[i].y));
                    line.setAttribute('x2', App.toDisplay(pts[i + 1].x));
                    line.setAttribute('y2', App.toDisplay(pts[i + 1].y));
                    line.setAttribute('stroke', '#0078d7');
                    line.setAttribute('stroke-width', '1.5');
                    line.setAttribute('stroke-dasharray', '4,3');
                    svg.appendChild(line);
                }
            }
            layer.appendChild(svg);
        }

        pts.forEach(function (p, idx) {
            var pt = document.createElement('div');
            pt.className = 'polygon-point';
            pt.style.left = App.toDisplay(p.x) + 'px';
            pt.style.top = App.toDisplay(p.y) + 'px';
            pt.title = App.i18n.t('js.point_label').replace('{index}', idx + 1);
            pt.dataset.idx = idx;
            pt.addEventListener('mousedown', function (e) {
                e.stopPropagation();
                var thisIdx = parseInt(pt.dataset.idx);
                var ds = { sx: e.clientX, sy: e.clientY, ox: App.state.polygonPoints[thisIdx].x, oy: App.state.polygonPoints[thisIdx].y };
                var onMove = function (ev) {
                    var imgObj = App.getActiveImage();
                    App.state.polygonPoints[thisIdx].x = App.clamp(ds.ox + App.toImage(ev.clientX - ds.sx), 0, imgObj.width);
                    App.state.polygonPoints[thisIdx].y = App.clamp(ds.oy + App.toImage(ev.clientY - ds.sy), 0, imgObj.height);
                    renderPolygon();
                };
                var onUp = function () {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                };
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
            pt.addEventListener('dblclick', function (e) {
                e.stopPropagation();
                if (App.state.polygonPoints.length >= 3) executeMask();
            });
            layer.appendChild(pt);
        });
    }

    function executeMask() {
        var m = App.state.activeMask;
        var pts = App.state.polygonPoints;
        var imgObj = App.getActiveImage();
        if (!imgObj) return;

        if (App.state.isDrawingPolygon) {
            if (pts.length < 3) { alert(App.i18n.t('dialog.need_3_points')); return; }
        } else if (!m) {
            alert(App.i18n.t('dialog.create_mask_first'));
            return;
        }

        var canvas = document.createElement('canvas');
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        var ctx = canvas.getContext('2d');
        ctx.save();

        if (m) {
            if (m.type === 'rect') {
                ctx.rect(m.x, m.y, m.w, m.h);
            } else if (m.type === 'circle') {
                ctx.beginPath();
                ctx.arc(m.x, m.y, m.rx, 0, Math.PI * 2);
            } else if (m.type === 'ellipse') {
                ctx.beginPath();
                ctx.ellipse(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, m.h / 2, 0, 0, Math.PI * 2);
            }
            ctx.clip();
        } else {
            ctx.beginPath();
            pts.forEach(function (p, i) {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.clip();
        }

        ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);
        ctx.restore();

        var newImg = new Image();
        newImg.onload = function () {
            imgObj.img = newImg;
            App.renderCanvas();
            App.Text.renderAllObjects();
            deactivate();
        };
        newImg.src = canvas.toDataURL('image/png');
    }

    function onImgDblClick() {
        if (App.state.activeImgTool !== 'mask') return;
        if (App.state.isDrawingPolygon && App.state.polygonPoints.length >= 3) {
            executeMask();
        }
    }

    function setupEvents() {
        var els = App.els();
        els.maskType.addEventListener('change', onTypeChange);
        els.createMaskBtn.addEventListener('click', createMask);
        els.clearMaskPoints.addEventListener('click', clearPolygonPoints);
    }

    App.ImageMask = {
        activate: activate,
        deactivate: deactivate,
        onImgClick: onImgClick,
        onImgDblClick: onImgDblClick,
        executeMask: executeMask,
        setupEvents: setupEvents
    };
})();
