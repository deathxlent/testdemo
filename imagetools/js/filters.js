(function () {
    'use strict';

    var Filters = {
        activeKind: null,

        activate: function (kind) {
            if (!App.getActiveImage()) { App.showToast('请先打开一张图片'); return; }
            App.Text.deselectAll();
            App.clearOperationLayer();
            App.setActiveImgTool('filter');
            this.activeKind = kind;
            App.state.filterKind = kind;
            App.state.activeFilterSel = null;
            App.state.filterPolygonPoints = [];

            var titles = { sharpen: '锐化', blur: '模糊化', mosaic: '马赛克化', negative: '底片化' };
            if (App.els().filterTitle) App.els().filterTitle.textContent = titles[kind] || '滤镜';
            if (App.els().filterPropsSection) App.els().filterPropsSection.style.display = 'block';
            if (App.els().filterStrengthGroup && (kind === 'sharpen' || kind === 'blur')) {
                App.els().filterStrengthGroup.style.display = 'block';
            } else if (App.els().filterStrengthGroup) {
                App.els().filterStrengthGroup.style.display = 'none';
            }
            if (App.els().filterMosaicGroup) App.els().filterMosaicGroup.style.display = (kind === 'mosaic') ? 'block' : 'none';
            if (kind === 'negative') {
                this.applyNegative();
                App.deactivateAllImgTools();
                return;
            }
            this.renderSizeInputs();
        },

        deactivate: function () {
            this.activeKind = null;
            App.state.filterKind = null;
            App.state.activeFilterSel = null;
            App.state.filterPolygonPoints = [];
            App.clearOperationLayer();
            if (App.els().filterPropsSection) App.els().filterPropsSection.style.display = 'none';
        },

        activateHsl: function () {
            if (!App.getActiveImage()) { App.showToast('请先打开一张图片'); return; }
            App.Text.deselectAll();
            App.clearOperationLayer();
            App.setActiveImgTool('hsl');
            if (App.els().hslPropsSection) App.els().hslPropsSection.style.display = 'block';
            this.resetHslVals();
            this.refreshHslLabels();
        },

        deactivateHsl: function () {
            App.clearOperationLayer();
            if (App.els().hslPropsSection) App.els().hslPropsSection.style.display = 'none';
        },

        resetHslVals: function () {
            if (App.els().hueAdjust) App.els().hueAdjust.value = 0;
            if (App.els().satAdjust) App.els().satAdjust.value = 0;
            if (App.els().lumAdjust) App.els().lumAdjust.value = 0;
        },

        refreshHslLabels: function () {
            if (App.els().hueDisp) App.els().hueDisp.textContent = App.els().hueAdjust.value;
            if (App.els().satDisp) App.els().satDisp.textContent = App.els().satAdjust.value;
            if (App.els().lumDisp) App.els().lumDisp.textContent = App.els().lumAdjust.value;
        },

        applyHsl: function () {
            var imgObj = App.getActiveImage();
            if (!imgObj) return;
            if (App.History) App.History.push('色彩调整');
            var h = parseFloat(App.els().hueAdjust.value) || 0;
            var s = parseFloat(App.els().satAdjust.value) || 0;
            var l = parseFloat(App.els().lumAdjust.value) || 0;
            var canvas = document.createElement('canvas');
            canvas.width = imgObj.width;
            canvas.height = imgObj.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);
            var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            applyHslToImageData(imgData, h, s / 100, l / 100);
            ctx.putImageData(imgData, 0, 0);
            var loaded = new Image();
            loaded.onload = function () {
                imgObj.img = loaded;
                imgObj._prevW = imgObj.width;
                imgObj._prevH = imgObj.height;
                App.renderCanvas();
            };
            loaded.src = canvas.toDataURL('image/png');
            this.resetHslVals();
            this.refreshHslLabels();
        },

        renderSizeInputs: function () {
            var el = App.els().filterSizeContent;
            if (!el) return;
            var type = App.els().filterSelType.value;
            var html = '';
            if (type === 'rect') {
                html += '<div class="prop-group two-col"><div><label>宽</label><input type="number" id="fw" min="1" value="' + Math.round(App.getActiveImage().width * 0.5) + '"></div>';
                html += '<div><label>高</label><input type="number" id="fh" min="1" value="' + Math.round(App.getActiveImage().height * 0.5) + '"></div></div>';
                html += '<div class="prop-group two-col"><div><label>X</label><input type="number" id="fx" min="0" value="' + Math.round(App.getActiveImage().width * 0.25) + '"></div>';
                html += '<div><label>Y</label><input type="number" id="fy" min="0" value="' + Math.round(App.getActiveImage().height * 0.25) + '"></div></div>';
            } else if (type === 'circle') {
                html += '<div class="prop-group"><label>半径</label><input type="number" id="fr" min="1" value="' + Math.round(Math.min(App.getActiveImage().width, App.getActiveImage().height) * 0.25) + '"></div>';
                html += '<div class="prop-group two-col"><div><label>中心 X</label><input type="number" id="fcx" min="0" value="' + Math.round(App.getActiveImage().width / 2) + '"></div>';
                html += '<div><label>中心 Y</label><input type="number" id="fcy" min="0" value="' + Math.round(App.getActiveImage().height / 2) + '"></div></div>';
            } else if (type === 'ellipse') {
                html += '<div class="prop-group two-col"><div><label>宽半径</label><input type="number" id="ferx" min="1" value="' + Math.round(App.getActiveImage().width * 0.3) + '"></div>';
                html += '<div><label>高半径</label><input type="number" id="fery" min="1" value="' + Math.round(App.getActiveImage().height * 0.3) + '"></div></div>';
                html += '<div class="prop-group two-col"><div><label>中心 X</label><input type="number" id="fecx" min="0" value="' + Math.round(App.getActiveImage().width / 2) + '"></div>';
                html += '<div><label>中心 Y</label><input type="number" id="fecy" min="0" value="' + Math.round(App.getActiveImage().height / 2) + '"></div></div>';
            } else {
                html = '<div class="panel-tip" style="margin:4px 0 8px">在图片上点击以增加多边形节点，至少 3 个节点，双击任意空白处或点应用按钮执行。</div>';
            }
            el.innerHTML = html;
            if (App.els().clearFilterSel) App.els().clearFilterSel.style.display = (type === 'polygon') ? 'block' : 'none';
        },

        createSelection: function () {
            var imgObj = App.getActiveImage();
            if (!imgObj) return;
            var type = App.els().filterSelType.value;
            var sel = { type: type };
            if (type === 'rect') {
                sel.x = parseInt(document.getElementById('fx').value) || 0;
                sel.y = parseInt(document.getElementById('fy').value) || 0;
                sel.w = parseInt(document.getElementById('fw').value) || 0;
                sel.h = parseInt(document.getElementById('fh').value) || 0;
            } else if (type === 'circle') {
                sel.cx = parseInt(document.getElementById('fcx').value) || 0;
                sel.cy = parseInt(document.getElementById('fcy').value) || 0;
                sel.r = parseInt(document.getElementById('fr').value) || 0;
            } else if (type === 'ellipse') {
                sel.cx = parseInt(document.getElementById('fecx').value) || 0;
                sel.cy = parseInt(document.getElementById('fecy').value) || 0;
                sel.rx = parseInt(document.getElementById('ferx').value) || 0;
                sel.ry = parseInt(document.getElementById('fery').value) || 0;
            } else {
                return;
            }
            App.state.activeFilterSel = sel;
            this.render();
        },

        clearPolygon: function () {
            App.state.filterPolygonPoints = [];
            this.render();
        },

        render: function () {
            var layer = App.els().imgOperationLayer;
            if (!layer) return;
            layer.innerHTML = '';
            layer.classList.add('active');
            var zoom = App.state.zoom / 100;
            var sel = App.state.activeFilterSel;
            if (sel && sel.type !== 'polygon') {
                var el = document.createElement('div');
                el.className = 'crop-box';
                if (sel.type === 'rect') {
                    el.style.left = (sel.x * zoom) + 'px';
                    el.style.top = (sel.y * zoom) + 'px';
                    el.style.width = (sel.w * zoom) + 'px';
                    el.style.height = (sel.h * zoom) + 'px';
                    el.style.background = 'rgba(0,120,215,0.15)';
                } else if (sel.type === 'circle') {
                    var R = sel.r;
                    el.style.left = ((sel.cx - R) * zoom) + 'px';
                    el.style.top = ((sel.cy - R) * zoom) + 'px';
                    el.style.width = (R * 2 * zoom) + 'px';
                    el.style.height = (R * 2 * zoom) + 'px';
                    el.style.borderRadius = '50%';
                    el.style.background = 'rgba(0,120,215,0.15)';
                } else if (sel.type === 'ellipse') {
                    el.style.left = ((sel.cx - sel.rx) * zoom) + 'px';
                    el.style.top = ((sel.cy - sel.ry) * zoom) + 'px';
                    el.style.width = (sel.rx * 2 * zoom) + 'px';
                    el.style.height = (sel.ry * 2 * zoom) + 'px';
                    el.style.borderRadius = '50%';
                    el.style.background = 'rgba(0,120,215,0.15)';
                }
                this.bindBoxEvents(el, sel);
                for (var i = 0; i < 8; i++) {
                    var h = document.createElement('span');
                    var dirs = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
                    h.className = 'resize-handle h-' + dirs[i];
                    el.appendChild(h);
                }
                this.bindHandles(el, sel);
                el.addEventListener('dblclick', function (e) {
                    e.stopPropagation();
                    Filters.apply();
                });
                layer.appendChild(el);
            }
            if (sel && sel.type === 'polygon' && App.state.filterPolygonPoints.length >= 3) {
                this.renderPolygonMask(layer);
            }
            this.renderPolygonPoints(layer);
        },

        renderPolygonPoints: function (layer) {
            var pts = App.state.filterPolygonPoints;
            var zoom = App.state.zoom / 100;
            for (var i = 0; i < pts.length; i++) {
                var p = pts[i];
                var el = document.createElement('div');
                el.className = 'polygon-point';
                el.style.left = (p.x * zoom) + 'px';
                el.style.top = (p.y * zoom) + 'px';
                el.dataset.idx = i;
                (function (idx, node) {
                    node.addEventListener('mousedown', function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        var startX = e.clientX, startY = e.clientY;
                        var ox = pts[idx].x, oy = pts[idx].y;
                        function onMove(ev) {
                            var dx = (ev.clientX - startX) * 100 / App.state.zoom;
                            var dy = (ev.clientY - startY) * 100 / App.state.zoom;
                            pts[idx].x = Math.max(0, Math.min(App.getActiveImage().width, ox + dx));
                            pts[idx].y = Math.max(0, Math.min(App.getActiveImage().height, oy + dy));
                            Filters.render();
                        }
                        function onUp() {
                            document.removeEventListener('mousemove', onMove);
                            document.removeEventListener('mouseup', onUp);
                        }
                        document.addEventListener('mousemove', onMove);
                        document.addEventListener('mouseup', onUp);
                    });
                })(i, el);
                layer.appendChild(el);
            }
        },

        renderPolygonMask: function (layer) {
            var pts = App.state.filterPolygonPoints;
            var zoom = App.state.zoom / 100;
            var svgNS = 'http://www.w3.org/2000/svg';
            var svg = document.createElementNS(svgNS, 'svg');
            var img = App.getActiveImage();
            svg.setAttribute('width', img.width * zoom);
            svg.setAttribute('height', img.height * zoom);
            svg.style.position = 'absolute';
            svg.style.left = '0';
            svg.style.top = '0';
            svg.style.pointerEvents = 'none';
            var path = document.createElementNS(svgNS, 'polygon');
            var coords = pts.map(function (p) { return (p.x * zoom) + ',' + (p.y * zoom); }).join(' ');
            path.setAttribute('points', coords);
            path.setAttribute('fill', 'rgba(0,120,215,0.15)');
            path.setAttribute('stroke', '#0078d7');
            path.setAttribute('stroke-dasharray', '4 4');
            path.setAttribute('stroke-width', '1.5');
            svg.appendChild(path);
            layer.appendChild(svg);
        },

        bindBoxEvents: function (el, sel) {
            var self = this;
            el.addEventListener('mousedown', function (e) {
                if (e.target.classList.contains('resize-handle')) return;
                e.preventDefault();
                e.stopPropagation();
                var startX = e.clientX, startY = e.clientY;
                var sx, sy, srx, sry, sr;
                if (sel.type === 'rect') { sx = sel.x; sy = sel.y; }
                else if (sel.type === 'circle') { srx = sel.cx; sry = sel.cy; }
                else if (sel.type === 'ellipse') { srx = sel.cx; sry = sel.cy; }
                function onMove(ev) {
                    var dx = (ev.clientX - startX) * 100 / App.state.zoom;
                    var dy = (ev.clientY - startY) * 100 / App.state.zoom;
                    if (sel.type === 'rect') {
                        sel.x = Math.max(0, Math.min(App.getActiveImage().width - sel.w, sx + dx));
                        sel.y = Math.max(0, Math.min(App.getActiveImage().height - sel.h, sy + dy));
                    } else if (sel.type === 'circle') {
                        sel.cx = Math.max(sel.r, Math.min(App.getActiveImage().width - sel.r, srx + dx));
                        sel.cy = Math.max(sel.r, Math.min(App.getActiveImage().height - sel.r, sry + dy));
                    } else if (sel.type === 'ellipse') {
                        sel.cx = Math.max(sel.rx, Math.min(App.getActiveImage().width - sel.rx, srx + dx));
                        sel.cy = Math.max(sel.ry, Math.min(App.getActiveImage().height - sel.ry, sry + dy));
                    }
                    self.render();
                }
                function onUp() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                }
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        },

        bindHandles: function (el, sel) {
            var self = this;
            var handles = el.querySelectorAll('.resize-handle');
            for (var i = 0; i < handles.length; i++) {
                handles[i].addEventListener('mousedown', (function (h) {
                    return function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        var dir = '';
                        ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].forEach(function (d) {
                            if (h.classList.contains('h-' + d)) dir = d;
                        });
                        var startX = e.clientX, startY = e.clientY;
                        var o = JSON.parse(JSON.stringify(sel));
                        function onMove(ev) {
                            var dx = (ev.clientX - startX) * 100 / App.state.zoom;
                            var dy = (ev.clientY - startY) * 100 / App.state.zoom;
                            self.resizeFromDir(sel, o, dir, dx, dy);
                            self.render();
                        }
                        function onUp() {
                            document.removeEventListener('mousemove', onMove);
                            document.removeEventListener('mouseup', onUp);
                        }
                        document.addEventListener('mousemove', onMove);
                        document.addEventListener('mouseup', onUp);
                    };
                })(handles[i]));
            }
        },

        resizeFromDir: function (sel, o, dir, dx, dy) {
            if (sel.type === 'rect') {
                if (dir.indexOf('e') >= 0) sel.w = Math.max(5, o.w + dx);
                if (dir.indexOf('s') >= 0) sel.h = Math.max(5, o.h + dy);
                if (dir.indexOf('w') >= 0) { sel.w = Math.max(5, o.w - dx); sel.x = o.x + dx; if (sel.w === 5) sel.x = o.x + o.w - 5; }
                if (dir.indexOf('n') >= 0) { sel.h = Math.max(5, o.h - dy); sel.y = o.y + dy; if (sel.h === 5) sel.y = o.y + o.h - 5; }
            } else if (sel.type === 'circle') {
                var sign = (dir === 'n' || dir === 'w' || dir === 'nw' || dir === 'ne' || dir === 'sw') ? -1 : 1;
                sel.r = Math.max(5, o.r + (Math.abs(dx) > Math.abs(dy) ? dx : dy) * sign * (dir === 'se' || dir === 'nw' ? 1 : 0.7));
            } else if (sel.type === 'ellipse') {
                if (dir === 'e' || dir === 'w') sel.rx = Math.max(5, o.rx + Math.abs(dx) * (dir === 'e' ? 1 : -1));
                else if (dir === 'n' || dir === 's') sel.ry = Math.max(5, o.ry + Math.abs(dy) * (dir === 's' ? 1 : -1));
                else { sel.rx = Math.max(5, o.rx + Math.abs(dx) * (dir.indexOf('e') >= 0 ? 1 : -1)); sel.ry = Math.max(5, o.ry + Math.abs(dy) * (dir.indexOf('s') >= 0 ? 1 : -1)); }
            }
        },

        onImageClick: function (x, y) {
            if (App.els().filterSelType.value !== 'polygon') return;
            if (!App.state.activeFilterSel || App.state.activeFilterSel.type !== 'polygon') {
                App.state.activeFilterSel = { type: 'polygon' };
                App.state.filterPolygonPoints = [];
            }
            App.state.filterPolygonPoints.push({ x: x, y: y });
            this.render();
        },

        onImageDblClick: function () {
            if (App.state.filterKind && App.els().filterSelType.value === 'polygon' && App.state.filterPolygonPoints.length >= 3) {
                this.apply();
            }
        },

        apply: function () {
            var imgObj = App.getActiveImage();
            if (!imgObj) return;
            var sel = App.state.activeFilterSel;
            if (!sel) return;
            if (sel.type === 'polygon' && App.state.filterPolygonPoints.length < 3) return;
            if (App.History) App.History.push(this.descForKind(this.activeKind));
            var self = this;
            var canvas = document.createElement('canvas');
            canvas.width = imgObj.width;
            canvas.height = imgObj.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);

            var maskCanvas = document.createElement('canvas');
            maskCanvas.width = canvas.width;
            maskCanvas.height = canvas.height;
            var mctx = maskCanvas.getContext('2d');
            mctx.fillStyle = '#fff';
            if (sel.type === 'rect') mctx.fillRect(sel.x, sel.y, sel.w, sel.h);
            else if (sel.type === 'circle') {
                mctx.beginPath();
                mctx.arc(sel.cx, sel.cy, sel.r, 0, Math.PI * 2);
                mctx.fill();
            } else if (sel.type === 'ellipse') {
                mctx.beginPath();
                mctx.ellipse(sel.cx, sel.cy, sel.rx, sel.ry, 0, 0, Math.PI * 2);
                mctx.fill();
            } else if (sel.type === 'polygon') {
                mctx.beginPath();
                var pts = App.state.filterPolygonPoints;
                mctx.moveTo(pts[0].x, pts[0].y);
                for (var i = 1; i < pts.length; i++) mctx.lineTo(pts[i].x, pts[i].y);
                mctx.closePath();
                mctx.fill();
            }
            var srcData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var dstData = this.applyKindToPixels(srcData, this.activeKind);
            var maskData = mctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
            var srcPix = srcData.data;
            var dstPix = dstData.data;
            for (var p = 0; p < srcPix.length; p += 4) {
                var a = maskData[p + 3] / 255;
                if (a <= 0) {
                    for (var k = 0; k < 4; k++) dstPix[p + k] = srcPix[p + k];
                } else if (a < 1) {
                    dstPix[p] = srcPix[p] + (dstPix[p] - srcPix[p]) * a;
                    dstPix[p + 1] = srcPix[p + 1] + (dstPix[p + 1] - srcPix[p + 1]) * a;
                    dstPix[p + 2] = srcPix[p + 2] + (dstPix[p + 2] - srcPix[p + 2]) * a;
                }
            }
            dstData.data.set(dstPix);
            ctx.putImageData(dstData, 0, 0);
            var loaded = new Image();
            loaded.onload = function () {
                imgObj.img = loaded;
                imgObj._prevW = imgObj.width;
                imgObj._prevH = imgObj.height;
                App.renderCanvas();
            };
            loaded.src = canvas.toDataURL('image/png');
        },

        descForKind: function (k) {
            return { sharpen: '锐化', blur: '模糊', mosaic: '马赛克化' }[k] || '滤镜';
        },

        applyNegative: function () {
            var imgObj = App.getActiveImage();
            if (!imgObj) return;
            if (App.History) App.History.push('底片化');
            var canvas = document.createElement('canvas');
            canvas.width = imgObj.width;
            canvas.height = imgObj.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);
            var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var d = imgData.data;
            for (var i = 0; i < d.length; i += 4) {
                d[i] = 255 - d[i];
                d[i + 1] = 255 - d[i + 1];
                d[i + 2] = 255 - d[i + 2];
            }
            ctx.putImageData(imgData, 0, 0);
            var loaded = new Image();
            loaded.onload = function () {
                imgObj.img = loaded;
                imgObj._prevW = imgObj.width;
                imgObj._prevH = imgObj.height;
                App.renderCanvas();
            };
            loaded.src = canvas.toDataURL('image/png');
        },

        applyKindToPixels: function (imgData, kind) {
            var canvas2 = document.createElement('canvas');
            canvas2.width = imgData.width;
            canvas2.height = imgData.height;
            var ctx2 = canvas2.getContext('2d');
            ctx2.putImageData(imgData, 0, 0);
            var outData = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);
            if (kind === 'sharpen') {
                var strength = (parseInt(App.els().filterStrength.value) || 50) / 100;
                applySharpen(outData, strength);
            } else if (kind === 'blur') {
                var passes = Math.max(1, Math.round((parseInt(App.els().filterStrength.value) || 50) / 12));
                for (var i = 0; i < passes; i++) applyBoxBlur(outData);
            } else if (kind === 'mosaic') {
                var size = Math.max(2, parseInt(App.els().mosaicSize.value) || 10);
                applyMosaic(outData, size);
            }
            return outData;
        }
    };

    function applyMosaic(data, size) {
        var w = data.width, h = data.height;
        var src = data.data;
        for (var y = 0; y < h; y += size) {
            for (var x = 0; x < w; x += size) {
                var r = 0, g = 0, b = 0, c = 0;
                for (var dy = 0; dy < size && y + dy < h; dy++) {
                    for (var dx = 0; dx < size && x + dx < w; dx++) {
                        var idx = ((y + dy) * w + (x + dx)) * 4;
                        r += src[idx]; g += src[idx + 1]; b += src[idx + 2]; c++;
                    }
                }
                r = Math.round(r / c); g = Math.round(g / c); b = Math.round(b / c);
                for (dy = 0; dy < size && y + dy < h; dy++) {
                    for (dx = 0; dx < size && x + dx < w; dx++) {
                        idx = ((y + dy) * w + (x + dx)) * 4;
                        src[idx] = r; src[idx + 1] = g; src[idx + 2] = b;
                    }
                }
            }
        }
        data.data.set(src);
    }

    function applyBoxBlur(data) {
        var w = data.width, h = data.height;
        var src = new Uint8ClampedArray(data.data);
        var dst = data.data;
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var r = 0, g = 0, b = 0, c = 0;
                for (var dy = -1; dy <= 1; dy++) {
                    for (var dx = -1; dx <= 1; dx++) {
                        var yy = y + dy, xx = x + dx;
                        if (yy < 0 || yy >= h || xx < 0 || xx >= w) continue;
                        var idx = (yy * w + xx) * 4;
                        r += src[idx]; g += src[idx + 1]; b += src[idx + 2]; c++;
                    }
                }
                var i = (y * w + x) * 4;
                dst[i] = (r / c) | 0;
                dst[i + 1] = (g / c) | 0;
                dst[i + 2] = (b / c) | 0;
            }
        }
        data.data.set(dst);
    }

    function applySharpen(data, strength) {
        var w = data.width, h = data.height;
        var src = new Uint8ClampedArray(data.data);
        var dst = data.data;
        var amount = 0.5 + strength * 1.2;
        for (var y = 1; y < h - 1; y++) {
            for (var x = 1; x < w - 1; x++) {
                for (var ch = 0; ch < 3; ch++) {
                    var center = src[(y * w + x) * 4 + ch];
                    var sum = 0;
                    for (var dy = -1; dy <= 1; dy++) {
                        for (var dx = -1; dx <= 1; dx++) {
                            var k = 0;
                            if (dx === 0 && dy === 0) k = 1 + amount;
                            else if (dx === 0 || dy === 0) k = -amount / 4;
                            else k = -amount / 8;
                            sum += src[((y + dy) * w + (x + dx)) * 4 + ch] * k;
                        }
                    }
                    var v = center * 0.6 + sum * 0.4;
                    dst[(y * w + x) * 4 + ch] = v < 0 ? 0 : (v > 255 ? 255 : v | 0);
                }
            }
        }
        data.data.set(dst);
    }

    function applyHslToImageData(imgData, dh, ds, dl) {
        var data = imgData.data;
        for (var i = 0; i < data.length; i += 4) {
            var hsl = rgbToHsl(data[i], data[i + 1], data[i + 2]);
            hsl.h = (hsl.h + dh / 360 + 1) % 1;
            hsl.s = Math.max(0, Math.min(1, hsl.s + ds));
            hsl.l = Math.max(0, Math.min(1, hsl.l + dl));
            var rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
            data[i] = rgb[0];
            data[i + 1] = rgb[1];
            data[i + 2] = rgb[2];
        }
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; }
        else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h, s: s, l: l };
    }

    function hslToRgb(h, s, l) {
        var r, g, b;
        if (s === 0) { r = g = b = l; }
        else {
            var hue2rgb = function (p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    App.Filters = Filters;
})();
