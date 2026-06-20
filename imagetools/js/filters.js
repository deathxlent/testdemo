(function () {
    'use strict';

    var _hslPreviewCanvas = null;
    var _hslPreviewActive = false;

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
            var els = App.els();
            if (els.hslPropsSection) els.hslPropsSection.style.display = 'block';
            if (els.hslSelType) els.hslSelType.value = 'full';
            if (els.hslSelSizeSub) els.hslSelSizeSub.style.display = 'none';
            if (els.createHslSel) els.createHslSel.style.display = 'none';
            this.resetHslVals();
            this.refreshHslLabels();
            this.clearHslPreview();
            App.state.activeHslSel = null;
            App.state.hslPolygonPoints = [];
            this.renderHslSizeInputs();
            var imgObj = App.getActiveImage();
            Filters.showLiveHistogram();
            Filters.updateLiveHistogram(imgObj._hslPreview || imgObj.img);
        },

        deactivateHsl: function () {
            this.clearHslPreview();
            App.clearOperationLayer();
            Filters.hideLiveHistogram();
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

        renderHslSizeInputs: function () { App.FilterSelection.renderSizeInputs('hsl'); },

        createHslSelection: function () { App.FilterSelection.createSelection('hsl'); },

        clearHslPolygon: function () { App.FilterSelection.clearPolygon('hsl'); },

        renderHsl: function () { App.FilterSelection.renderGenericSelBox('hsl'); App.FilterSelection.bindGenericSelEvents('hsl'); },

        clearHslPreview: function () {
            _hslPreviewActive = false;
            _hslPreviewCanvas = null;
            var imgObj = App.getActiveImage();
            if (imgObj) {
                delete imgObj._hslPreview;
            }
            App.renderCanvas();
        },

        updateHslPreview: function () {
            var imgObj = App.getActiveImage();
            if (!imgObj) return;
            var h = parseFloat(App.els().hueAdjust.value) || 0;
            var s = parseFloat(App.els().satAdjust.value) || 0;
            var l = parseFloat(App.els().lumAdjust.value) || 0;
            var sel = App.state.activeHslSel;

            if (h === 0 && s === 0 && l === 0) {
                this.clearHslPreview();
                return;
            }

            var canvas = document.createElement('canvas');
            canvas.width = imgObj.width;
            canvas.height = imgObj.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);
            var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var selHasArea = false;
            if (sel) {
                if (sel.type === 'polygon') {
                    if (App.state.hslPolygonPoints && App.state.hslPolygonPoints.length >= 3) selHasArea = true;
                } else {
                    selHasArea = true;
                }
            }
            var maskData = selHasArea ? buildMaskFromSelection(sel, App.state.hslPolygonPoints, imgObj.width, imgObj.height) : null;

            applyHslToImageData(imgData, h, s / 100, l / 100, maskData);
            ctx.putImageData(imgData, 0, 0);

            var previewImg = new Image();
            var self = this;
            previewImg.onload = function () {
                _hslPreviewCanvas = canvas;
                _hslPreviewActive = true;
                imgObj._hslPreview = previewImg;
                App.renderCanvas();
            };
            previewImg.src = canvas.toDataURL('image/png');
        },

        applyHsl: function () {
            var imgObj = App.getActiveImage();
            if (!imgObj) return;
            var h = parseFloat(App.els().hueAdjust.value) || 0;
            var s = parseFloat(App.els().satAdjust.value) || 0;
            var l = parseFloat(App.els().lumAdjust.value) || 0;
            if (h === 0 && s === 0 && l === 0) {
                App.showToast('请先调整参数');
                return;
            }
            var sel = App.state.activeHslSel;
            var hasSel = false;
            if (sel) {
                if (sel.type === 'polygon') {
                    if (App.state.hslPolygonPoints && App.state.hslPolygonPoints.length >= 3) hasSel = true;
                } else {
                    hasSel = true;
                }
            }
            var desc = '色彩调整';
            if (hasSel) desc = '局部' + desc;
            if (App.History) App.History.push(desc);

            var canvas = document.createElement('canvas');
            canvas.width = imgObj.width;
            canvas.height = imgObj.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);
            var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var maskData = hasSel ? buildMaskFromSelection(sel, App.state.hslPolygonPoints, imgObj.width, imgObj.height) : null;

            applyHslToImageData(imgData, h, s / 100, l / 100, maskData);
            ctx.putImageData(imgData, 0, 0);
            var loaded = new Image();
            var self = this;
            loaded.onload = function () {
                imgObj.img = loaded;
                imgObj._prevW = imgObj.width;
                imgObj._prevH = imgObj.height;
                self.clearHslPreview();
                self.resetHslVals();
                self.refreshHslLabels();
                App.renderCanvas();
            };
            loaded.src = canvas.toDataURL('image/png');
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

        onImageClick: function (x, y, tool) {
            if (!tool) tool = 'filter';
            if (tool === 'filter') {
                if (App.els().filterSelType.value !== 'polygon') return;
                if (!App.state.activeFilterSel || App.state.activeFilterSel.type !== 'polygon') {
                    App.state.activeFilterSel = { type: 'polygon' };
                    App.state.filterPolygonPoints = [];
                }
                App.state.filterPolygonPoints.push({ x: x, y: y });
                this.render();
            } else if (tool === 'hsl') {
                if (App.els().hslSelType.value !== 'polygon') return;
                if (!App.state.activeHslSel || App.state.activeHslSel.type !== 'polygon') {
                    App.state.activeHslSel = { type: 'polygon' };
                    App.state.hslPolygonPoints = [];
                }
                App.state.hslPolygonPoints.push({ x: x, y: y });
                this.renderHsl();
                this.updateHslPreview();
            } else if (tool === 'curve') {
                if (App.els().curveSelType.value !== 'polygon') return;
                if (!App.state.activeCurveSel || App.state.activeCurveSel.type !== 'polygon') {
                    App.state.activeCurveSel = { type: 'polygon' };
                    App.state.curvePolygonPoints = [];
                }
                App.state.curvePolygonPoints.push({ x: x, y: y });
                this.renderCurve();
                this.updateCurvePreview();
            } else if (tool === 'balance') {
                if (App.els().balanceSelType.value !== 'polygon') return;
                if (!App.state.activeBalanceSel || App.state.activeBalanceSel.type !== 'polygon') {
                    App.state.activeBalanceSel = { type: 'polygon' };
                    App.state.balancePolygonPoints = [];
                }
                App.state.balancePolygonPoints.push({ x: x, y: y });
                this.renderBalance();
                this.updateBalancePreview();
            }
        },

        onImageDblClick: function (tool) {
            if (!tool) tool = 'filter';
            if (tool === 'filter') {
                if (App.state.filterKind && App.els().filterSelType.value === 'polygon' && App.state.filterPolygonPoints.length >= 3) {
                    this.apply();
                }
            } else if (tool === 'hsl') {
                // 双击不直接应用，HSL有应用按钮
            } else if (tool === 'curve' || tool === 'balance') {
                // 双击不直接应用，有应用按钮
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

            var srcData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var dstData = this.applyKindToPixels(srcData, this.activeKind);
            var maskData = buildMaskFromSelection(sel, App.state.filterPolygonPoints, canvas.width, canvas.height);
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

    function applyHslToImageData(imgData, dh, ds, dl, maskData) {
        var data = imgData.data;
        for (var i = 0; i < data.length; i += 4) {
            if (maskData) {
                var a = maskData[i + 3] / 255;
                if (a <= 0) continue;
            }
            var hsl = rgbToHsl(data[i], data[i + 1], data[i + 2]);
            hsl.h = (hsl.h + dh / 360 + 1) % 1;
            hsl.s = Math.max(0, Math.min(1, hsl.s + ds));
            hsl.l = Math.max(0, Math.min(1, hsl.l + dl));
            var rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
            if (maskData) {
                var a = maskData[i + 3] / 255;
                if (a < 1) {
                    data[i] = data[i] + (rgb[0] - data[i]) * a;
                    data[i + 1] = data[i + 1] + (rgb[1] - data[i + 1]) * a;
                    data[i + 2] = data[i + 2] + (rgb[2] - data[i + 2]) * a;
                    continue;
                }
            }
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

    /* ============================================================
     * 色彩曲线 CURVE
     * ============================================================ */
    var _curvePoints = {
        rgb: [{x:0,y:255},{x:255,y:0}],
        r:   [{x:0,y:255},{x:255,y:0}],
        g:   [{x:0,y:255},{x:255,y:0}],
        b:   [{x:0,y:255},{x:255,y:0}]
    };
    var _curveActiveChannel = 'rgb';
    var _curveDraggingPoint = -1;
    var _curveLUTCache = { rgb:null, r:null, g:null, b:null };

    function buildCurveLUT(points) {
        var sorted = points.slice().sort(function(a,b){ return a.x-b.x; });
        var lut = new Uint8ClampedArray(256);
        if (sorted.length < 2) {
            for (var i = 0; i < 256; i++) lut[i] = 255 - i;
            return lut;
        }
        for (var x = 0; x < 256; x++) {
            var y = 0;
            if (x <= sorted[0].x) {
                y = sorted[0].y;
            } else if (x >= sorted[sorted.length-1].x) {
                y = sorted[sorted.length-1].y;
            } else {
                for (var j = 0; j < sorted.length - 1; j++) {
                    if (x >= sorted[j].x && x <= sorted[j+1].x) {
                        var x0 = sorted[j].x, y0 = sorted[j].y;
                        var x1 = sorted[j+1].x, y1 = sorted[j+1].y;
                        if (x1 === x0) { y = y1; break; }
                        var t = (x - x0) / (x1 - x0);
                        y = y0 + (y1 - y0) * t;
                        break;
                    }
                }
            }
            var out = Math.max(0, Math.min(255, Math.round(255 - y)));
            lut[x] = out;
        }
        return lut;
    }

    function applyCurveToImageData(imgData, lutR, lutG, lutB, lutAll, maskData) {
        var data = imgData.data;
        for (var i = 0; i < data.length; i += 4) {
            if (maskData) {
                var a = maskData[i + 3] / 255;
                if (a <= 0) continue;
            }
            var r = data[i], g = data[i+1], b = data[i+2];
            if (lutAll) { r = lutAll[r]; g = lutAll[g]; b = lutAll[b]; }
            if (lutR) r = lutR[r];
            if (lutG) g = lutG[g];
            if (lutB) b = lutB[b];
            if (maskData && a < 1) {
                data[i]   = Math.round(data[i]   + (r - data[i])   * a);
                data[i+1] = Math.round(data[i+1] + (g - data[i+1]) * a);
                data[i+2] = Math.round(data[i+2] + (b - data[i+2]) * a);
            } else {
                data[i] = r; data[i+1] = g; data[i+2] = b;
            }
        }
    }

    function renderCurveEditor() {
        var cv = App.els().curveEditor;
        if (!cv) return;
        var W = cv.width, H = cv.height;
        var pad = 8;
        var plotW = W - pad * 2, plotH = H - pad * 2;
        var ctx = cv.getContext('2d');
        ctx.clearRect(0, 0, W, H);

        ctx.fillStyle = '#151515';
        ctx.fillRect(pad, pad, plotW, plotH);

        ctx.strokeStyle = '#252525';
        ctx.lineWidth = 1;
        for (var i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(pad + plotW * i / 4, pad);
            ctx.lineTo(pad + plotW * i / 4, pad + plotH);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pad, pad + plotH * i / 4);
            ctx.lineTo(pad + plotW, pad + plotH * i / 4);
            ctx.stroke();
        }

        ctx.strokeStyle = '#3a3a3a';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pad, pad + plotH);
        ctx.lineTo(pad + plotW, pad);
        ctx.stroke();
        ctx.setLineDash([]);

        var ch = _curveActiveChannel;
        var strokeColor = ch === 'rgb' ? '#fff' : (ch === 'r' ? '#ff6060' : ch === 'g' ? '#60ff60' : '#6080ff');

        ['r', 'g', 'b'].forEach(function(c) {
            if (c === ch || ch !== 'rgb') return;
            var col = c === 'r' ? 'rgba(255,96,96,0.35)' : c === 'g' ? 'rgba(96,255,96,0.35)' : 'rgba(96,128,255,0.35)';
            drawCurvePath(ctx, _curvePoints[c], pad, plotW, plotH, col, 1);
        });

        if (ch === 'rgb') {
            drawCurvePath(ctx, _curvePoints['rgb'], pad, plotW, plotH, '#ffffff', 2);
        } else {
            drawCurvePath(ctx, _curvePoints[ch], pad, plotW, plotH, strokeColor, 2.5);
        }

        var pts = _curvePoints[ch];
        for (var k = 0; k < pts.length; k++) {
            var px = pad + (pts[k].x / 255) * plotW;
            var py = pad + (pts[k].y / 255) * plotH;
            ctx.beginPath();
            ctx.arc(px, py, k === _curveDraggingPoint ? 6 : 4, 0, Math.PI * 2);
            ctx.fillStyle = k === _curveDraggingPoint ? '#ffff00' : strokeColor;
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    function drawCurvePath(ctx, pts, pad, plotW, plotH, color, width) {
        ctx.beginPath();
        var sorted = pts.slice().sort(function(a,b){ return a.x-b.x; });
        for (var i = 0; i < sorted.length; i++) {
            var px = pad + (sorted[i].x / 255) * plotW;
            var py = pad + (sorted[i].y / 255) * plotH;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }

    function getCurveEditorPointFromEvent(e) {
        var cv = App.els().curveEditor;
        var rect = cv.getBoundingClientRect();
        var scaleX = cv.width / rect.width;
        var scaleY = cv.height / rect.height;
        var mx = (e.clientX - rect.left) * scaleX;
        var my = (e.clientY - rect.top) * scaleY;
        var pad = 8, plotW = cv.width - pad*2, plotH = cv.height - pad*2;
        var x = Math.max(0, Math.min(255, Math.round(((mx - pad) / plotW) * 255)));
        var y = Math.max(0, Math.min(255, Math.round(((my - pad) / plotH) * 255)));
        return { x: x, y: y, mx: mx, my: my, pad: pad, plotW: plotW, plotH: plotH };
    }

    function bindCurveEditorEvents() {
        var cv = App.els().curveEditor;
        if (!cv || cv._bound) return;
        cv._bound = true;

        cv.addEventListener('mousedown', function(e) {
            if (App.state.activeImgTool !== 'curve') return;
            e.preventDefault();
            var info = getCurveEditorPointFromEvent(e);
            var pts = _curvePoints[_curveActiveChannel];

            for (var i = 0; i < pts.length; i++) {
                var px = info.pad + (pts[i].x / 255) * info.plotW;
                var py = info.pad + (pts[i].y / 255) * info.plotH;
                if (Math.abs(info.mx - px) <= 8 && Math.abs(info.my - py) <= 8) {
                    if (e.button === 2) {
                        if (pts[i].x === 0 || pts[i].x === 255) { App.showToast('端点不可删除'); return; }
                        pts.splice(i, 1);
                        renderCurveEditor();
                        rebuildAllCurveLUTs();
                        Filters.updateCurvePreview();
                        return;
                    }
                    _curveDraggingPoint = i;
                    renderCurveEditor();
                    return;
                }
            }
            if (e.button === 0) {
                pts.push({ x: info.x, y: info.y });
                _curveDraggingPoint = pts.length - 1;
                renderCurveEditor();
                rebuildAllCurveLUTs();
                Filters.updateCurvePreview();
            }
        });

        cv.addEventListener('contextmenu', function(e) { e.preventDefault(); });

        window.addEventListener('mousemove', function(e) {
            if (_curveDraggingPoint < 0) return;
            if (App.state.activeImgTool !== 'curve') return;
            var info = getCurveEditorPointFromEvent(e);
            var pts = _curvePoints[_curveActiveChannel];
            var idx = _curveDraggingPoint;
            if (pts[idx].x === 0) info.x = 0;
            if (pts[idx].x === 255) info.x = 255;
            pts[idx].x = info.x;
            pts[idx].y = info.y;
            renderCurveEditor();
        });

        window.addEventListener('mouseup', function(e) {
            if (_curveDraggingPoint < 0) return;
            _curveDraggingPoint = -1;
            renderCurveEditor();
            rebuildAllCurveLUTs();
            Filters.updateCurvePreview();
        });
    }

    function rebuildAllCurveLUTs() {
        _curveLUTCache.rgb = buildCurveLUT(_curvePoints.rgb);
        _curveLUTCache.r   = buildCurveLUT(_curvePoints.r);
        _curveLUTCache.g   = buildCurveLUT(_curvePoints.g);
        _curveLUTCache.b   = buildCurveLUT(_curvePoints.b);
    }

    function resetCurveChannel(ch) {
        _curvePoints[ch] = [{x:0,y:255},{x:255,y:0}];
        _curveLUTCache[ch] = buildCurveLUT(_curvePoints[ch]);
    }

    function applyCurvePreset(name) {
        switch (name) {
            case 'linear':
                resetCurveChannel('rgb'); resetCurveChannel('r'); resetCurveChannel('g'); resetCurveChannel('b');
                break;
            case 'contrast':
                _curvePoints.rgb = [{x:0,y:255},{x:64,y:200},{x:191,y:55},{x:255,y:0}];
                break;
            case 'bright':
                _curvePoints.rgb = [{x:0,y:220},{x:128,y:110},{x:255,y:0}];
                break;
            case 'dark':
                _curvePoints.rgb = [{x:0,y:255},{x:128,y:180},{x:255,y:35}];
                break;
            case 'negate':
                _curvePoints.rgb = [{x:0,y:0},{x:255,y:255}];
                break;
            case 's-shape':
                _curvePoints.rgb = [{x:0,y:255},{x:60,y:215},{x:128,y:128},{x:195,y:40},{x:255,y:0}];
                break;
        }
        rebuildAllCurveLUTs();
        renderCurveEditor();
        Filters.updateCurvePreview();
    }

    Filters.renderHslSizeInputs = function() { App.FilterSelection.renderSizeInputs('hsl'); };
    Filters.renderCurveSizeInputs = function() { App.FilterSelection.renderSizeInputs('curve'); };
    Filters.renderBalanceSizeInputs = function() { App.FilterSelection.renderSizeInputs('balance'); };

    Filters.createHslSelection = function() { App.FilterSelection.createSelection('hsl'); };
    Filters.createCurveSelection = function() { App.FilterSelection.createSelection('curve'); };
    Filters.createBalanceSelection = function() { App.FilterSelection.createSelection('balance'); };

    Filters.clearHslPolygon = function() { App.FilterSelection.clearPolygon('hsl'); };
    Filters.clearCurvePolygon = function() { App.FilterSelection.clearPolygon('curve'); };
    Filters.clearBalancePolygon = function() { App.FilterSelection.clearPolygon('balance'); };

    function renderHsl() { App.FilterSelection.renderGenericSelBox('hsl'); App.FilterSelection.bindGenericSelEvents('hsl'); }
    function renderCurve() { App.FilterSelection.renderGenericSelBox('curve'); App.FilterSelection.bindGenericSelEvents('curve'); }
    function renderBalance() { App.FilterSelection.renderGenericSelBox('balance'); App.FilterSelection.bindGenericSelEvents('balance'); }
    Filters.renderHsl = renderHsl;
    Filters.renderCurve = renderCurve;
    Filters.renderBalance = renderBalance;

    /* ============================================================
     * 曲线 CURVE：公开方法
     * ============================================================ */
    Filters.activateCurve = function() {
        var imgObj = App.getActiveImage(); if (!imgObj) return false;
        App.setActiveImgTool('curve');
        var els = App.els();
        els.curvePropsSection.style.display = 'block';
        els.curveTool.classList.add('active');
        App.state.activeCurveSel = null;
        App.state.curvePolygonPoints = [];
        if (els.curveSelType) els.curveSelType.value = 'full';
        if (els.curveSelSizeSub) els.curveSelSizeSub.style.display = 'none';
        if (els.createCurveSel) els.createCurveSel.style.display = 'none';
        if (els.curveChannel) els.curveChannel.value = 'rgb';
        if (els.curvePreset) els.curvePreset.value = 'linear';
        _curveActiveChannel = 'rgb';
        bindCurveEditorEvents();
        rebuildAllCurveLUTs();
        renderCurveEditor();
        Filters.showLiveHistogram();
        Filters.updateLiveHistogram(imgObj._curvePreview || imgObj.img);
        return true;
    };

    Filters.deactivateCurve = function() {
        var els = App.els();
        els.curvePropsSection.style.display = 'none';
        els.curveTool.classList.remove('active');
        App.clearOperationLayer();
        Filters.clearCurvePreview();
        Filters.hideLiveHistogram();
        App.state.activeCurveSel = null;
        App.state.curvePolygonPoints = [];
    };

    Filters.updateCurvePreview = function() {
        var imgObj = App.getActiveImage(); if (!imgObj) return;
        var sel = App.state.activeCurveSel;
        rebuildAllCurveLUTs();
        var hasChanges = false;
        var chans = ['rgb','r','g','b'];
        for (var ci = 0; ci < chans.length; ci++) {
            var pt = _curvePoints[chans[ci]];
            if (pt.length !== 2 || pt[0].x !== 0 || pt[0].y !== 255 || pt[1].x !== 255 || pt[1].y !== 0) { hasChanges = true; break; }
        }
        if (!hasChanges && !sel) { Filters.clearCurvePreview(); return; }

        var canvas = document.createElement('canvas');
        canvas.width = imgObj.width; canvas.height = imgObj.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);
        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var maskData = buildMaskFromSelection(sel, App.state.curvePolygonPoints, imgObj.width, imgObj.height);
        applyCurveToImageData(imgData, _curveLUTCache.r, _curveLUTCache.g, _curveLUTCache.b, _curveLUTCache.rgb, maskData);
        ctx.putImageData(imgData, 0, 0);
        var previewImg = new Image();
        previewImg.onload = function() {
            imgObj._curvePreview = previewImg;
            App.renderCanvas();
            Filters.updateLiveHistogram(previewImg);
        };
        previewImg.src = canvas.toDataURL('image/png');
    };

    Filters.clearCurvePreview = function() {
        var imgObj = App.getActiveImage(); if (!imgObj) return;
        if (imgObj._curvePreview) {
            delete imgObj._curvePreview;
            App.renderCanvas();
        }
    };

    Filters.applyCurve = function() {
        var imgObj = App.getActiveImage(); if (!imgObj) return;
        Filters.updateCurvePreview();
        if (!imgObj._curvePreview) return;
        var canvas = document.createElement('canvas');
        canvas.width = imgObj.width; canvas.height = imgObj.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(imgObj._curvePreview, 0, 0);
        var newImg = new Image();
        newImg.onload = function() {
            var oldCanvas = imgObj.canvas;
            imgObj.img = newImg;
            imgObj.canvas = canvas;
            var oldCtx = oldCanvas ? oldCanvas.getContext('2d') : null;
            var newCtx = canvas.getContext('2d');
            if (oldCtx) newCtx.drawImage(oldCanvas, 0, 0);
            delete imgObj._curvePreview;
            Filters.hideLiveHistogram();
            App.clearOperationLayer();
            App.state.activeCurveSel = null;
            App.state.curvePolygonPoints = [];
            App.renderCanvas();
            App.deactivateAllImgTools();
            var sel = App.state.activeCurveSel || (App.state.curvePolygonPoints && App.state.curvePolygonPoints.length >= 3 ? {type:'polygon'} : null);
            var opName = sel ? '局部色彩曲线' : '色彩曲线';
            if (App.History) App.History.push(opName);
            App.showToast('已应用' + opName);
        };
        newImg.src = canvas.toDataURL('image/png');
    };

    Filters.setCurveChannel = function(ch) {
        _curveActiveChannel = ch || 'rgb';
        renderCurveEditor();
    };
    Filters.applyCurvePreset = applyCurvePreset;
    Filters.resetCurveChannel = function() {
        resetCurveChannel(_curveActiveChannel);
        renderCurveEditor();
        Filters.updateCurvePreview();
    };
    Filters.resetAllCurveChannels = function() {
        resetCurveChannel('rgb'); resetCurveChannel('r'); resetCurveChannel('g'); resetCurveChannel('b');
        if (App.els().curvePreset) App.els().curvePreset.value = 'linear';
        renderCurveEditor();
        Filters.updateCurvePreview();
    };

    /* ============================================================
     * 色彩平衡 BALANCE
     * ============================================================ */
    function getBalanceMask(lum) {
        var shadow = Math.max(0, (80 - lum) / 80);
        var highlight = Math.max(0, (lum - 175) / 80);
        var mid = 1 - shadow - highlight;
        return { s: shadow, m: mid, h: highlight };
    }

    function applyBalanceToImageData(imgData, params, maskData) {
        var data = imgData.data;
        var sh = params.shadow, mi = params.mid, hi = params.high;
        var preserve = !!params.preserveLuminosity;
        for (var i = 0; i < data.length; i += 4) {
            if (maskData) {
                var a = maskData[i + 3] / 255;
                if (a <= 0) continue;
            }
            var r0 = data[i], g0 = data[i+1], b0 = data[i+2];
            var yLum = 0.299 * r0 + 0.587 * g0 + 0.114 * b0;
            var mk = getBalanceMask(yLum);
            var rc = sh[0]*mk.s + mi[0]*mk.m + hi[0]*mk.h;
            var gc = sh[1]*mk.s + mi[1]*mk.m + hi[1]*mk.h;
            var bc = sh[2]*mk.s + mi[2]*mk.m + hi[2]*mk.h;
            var nr = r0 + rc * 0.5;
            var ng = g0 + gc * 0.5;
            var nb = b0 + bc * 0.5;
            if (preserve) {
                var newLum = 0.299*nr + 0.587*ng + 0.114*nb;
                if (newLum > 0) {
                    var k = yLum / newLum;
                    nr *= k; ng *= k; nb *= k;
                }
            }
            nr = Math.max(0, Math.min(255, nr));
            ng = Math.max(0, Math.min(255, ng));
            nb = Math.max(0, Math.min(255, nb));
            if (maskData && a < 1) {
                data[i]   = Math.round(r0 + (nr - r0) * a);
                data[i+1] = Math.round(g0 + (ng - g0) * a);
                data[i+2] = Math.round(b0 + (nb - b0) * a);
            } else {
                data[i] = nr|0; data[i+1] = ng|0; data[i+2] = nb|0;
            }
        }
    }

    function getBalanceParamsFromUI() {
        var els = App.els();
        return {
            shadow:  [ +els.shRCyan.value, +els.shGMagenta.value, +els.shBYellow.value ],
            mid:     [ +els.miRCyan.value, +els.miGMagenta.value, +els.miBYellow.value ],
            high:    [ +els.hiRCyan.value, +els.hiGMagenta.value, +els.hiBYellow.value ],
            preserveLuminosity: els.balanceLuminosity ? els.balanceLuminosity.checked : true
        };
    }

    function balanceIsZero(p) {
        var all = [p.shadow, p.mid, p.high];
        for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) if (Math.abs(all[i][j]) > 0.5) return false;
        return true;
    }

    Filters.activateBalance = function() {
        var imgObj = App.getActiveImage(); if (!imgObj) return false;
        App.setActiveImgTool('balance');
        var els = App.els();
        els.balancePropsSection.style.display = 'block';
        els.balanceTool.classList.add('active');
        App.state.activeBalanceSel = null;
        App.state.balancePolygonPoints = [];
        if (els.balanceSelType) els.balanceSelType.value = 'full';
        if (els.balanceSelSizeSub) els.balanceSelSizeSub.style.display = 'none';
        if (els.createBalanceSel) els.createBalanceSel.style.display = 'none';
        Filters.resetBalanceVals();
        Filters.refreshBalanceLabels();
        Filters.showLiveHistogram();
        Filters.updateLiveHistogram(imgObj._balancePreview || imgObj.img);
        return true;
    };

    Filters.deactivateBalance = function() {
        var els = App.els();
        els.balancePropsSection.style.display = 'none';
        els.balanceTool.classList.remove('active');
        App.clearOperationLayer();
        Filters.clearBalancePreview();
        Filters.hideLiveHistogram();
        App.state.activeBalanceSel = null;
        App.state.balancePolygonPoints = [];
    };

    Filters.updateBalancePreview = function() {
        var imgObj = App.getActiveImage(); if (!imgObj) return;
        var sel = App.state.activeBalanceSel;
        var params = getBalanceParamsFromUI();
        if (balanceIsZero(params) && !sel) { Filters.clearBalancePreview(); return; }
        var canvas = document.createElement('canvas');
        canvas.width = imgObj.width; canvas.height = imgObj.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);
        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var maskData = buildMaskFromSelection(sel, App.state.balancePolygonPoints, imgObj.width, imgObj.height);
        applyBalanceToImageData(imgData, params, maskData);
        ctx.putImageData(imgData, 0, 0);
        var previewImg = new Image();
        previewImg.onload = function() {
            imgObj._balancePreview = previewImg;
            App.renderCanvas();
            Filters.updateLiveHistogram(previewImg);
        };
        previewImg.src = canvas.toDataURL('image/png');
    };

    Filters.clearBalancePreview = function() {
        var imgObj = App.getActiveImage(); if (!imgObj) return;
        if (imgObj._balancePreview) { delete imgObj._balancePreview; App.renderCanvas(); }
    };

    Filters.applyBalance = function() {
        var imgObj = App.getActiveImage(); if (!imgObj) return;
        Filters.updateBalancePreview();
        if (!imgObj._balancePreview) return;
        var canvas = document.createElement('canvas');
        canvas.width = imgObj.width; canvas.height = imgObj.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(imgObj._balancePreview, 0, 0);
        var newImg = new Image();
        newImg.onload = function() {
            var oldCanvas = imgObj.canvas;
            imgObj.img = newImg;
            imgObj.canvas = canvas;
            var newCtx = canvas.getContext('2d');
            if (oldCanvas) newCtx.drawImage(oldCanvas, 0, 0);
            delete imgObj._balancePreview;
            Filters.hideLiveHistogram();
            App.clearOperationLayer();
            App.state.activeBalanceSel = null;
            App.state.balancePolygonPoints = [];
            App.renderCanvas();
            App.deactivateAllImgTools();
            var sel = App.state.activeBalanceSel || (App.state.balancePolygonPoints && App.state.balancePolygonPoints.length >= 3 ? {type:'polygon'} : null);
            var opName = sel ? '局部色彩平衡' : '色彩平衡';
            if (App.History) App.History.push(opName);
            App.showToast('已应用' + opName);
        };
        newImg.src = canvas.toDataURL('image/png');
    };

    Filters.refreshBalanceLabels = function() {
        var els = App.els();
        if (!els) return;
        var pairs = [['shRCyan','shRCyanDisp'],['shGMagenta','shGMagentaDisp'],['shBYellow','shBYellowDisp'],
                     ['miRCyan','miRCyanDisp'],['miGMagenta','miGMagentaDisp'],['miBYellow','miBYellowDisp'],
                     ['hiRCyan','hiRCyanDisp'],['hiGMagenta','hiGMagentaDisp'],['hiBYellow','hiBYellowDisp']];
        for (var i = 0; i < pairs.length; i++) {
            if (els[pairs[i][0]] && els[pairs[i][1]]) els[pairs[i][1]].textContent = els[pairs[i][0]].value;
        }
    };

    Filters.resetBalanceVals = function() {
        var els = App.els(); if (!els) return;
        ['shRCyan','shGMagenta','shBYellow','miRCyan','miGMagenta','miBYellow','hiRCyan','hiGMagenta','hiBYellow'].forEach(function(k){
            if (els[k]) els[k].value = 0;
        });
        if (els.balanceLuminosity) els.balanceLuminosity.checked = true;
    };

    /* ============================================================
     * 通用：选区 → 蒙版
     * ============================================================ */
    function buildMaskFromSelection(sel, polygonPoints, w, h) {
        if (!sel && (!polygonPoints || polygonPoints.length < 3)) return null;
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        if (sel) {
            if (sel.type === 'rect') ctx.fillRect(sel.x, sel.y, sel.w, sel.h);
            else if (sel.type === 'circle') {
                ctx.beginPath(); ctx.arc(sel.cx, sel.cy, sel.r, 0, Math.PI*2); ctx.fill();
            } else if (sel.type === 'ellipse') {
                ctx.save();
                ctx.translate(sel.cx, sel.cy); ctx.scale(sel.rx, sel.ry);
                ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI*2); ctx.fill();
                ctx.restore();
            } else if (sel.type === 'polygon' && polygonPoints && polygonPoints.length >= 3) {
                ctx.beginPath();
                for (var i = 0; i < polygonPoints.length; i++) {
                    if (i === 0) ctx.moveTo(polygonPoints[i].x, polygonPoints[i].y);
                    else ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
                }
                ctx.closePath(); ctx.fill();
            }
        } else if (polygonPoints && polygonPoints.length >= 3) {
            ctx.beginPath();
            for (var j = 0; j < polygonPoints.length; j++) {
                if (j === 0) ctx.moveTo(polygonPoints[j].x, polygonPoints[j].y);
                else ctx.lineTo(polygonPoints[j].x, polygonPoints[j].y);
            }
            ctx.closePath(); ctx.fill();
        }
        return ctx.getImageData(0, 0, w, h).data;
    }

    /* ============================================================
     * 实时直方图悬浮窗
     * ============================================================ */
    Filters.showLiveHistogram = function() { App.FilterHistogram.show(); };
    Filters.hideLiveHistogram = function() { App.FilterHistogram.hide(); };
    Filters.updateLiveHistogram = function(imgSrc) { App.FilterHistogram.update(imgSrc); };

    /* 覆写 renderCanvas：扩展支持多种预览 */
    var _origRenderCanvas = App.renderCanvas;
    App.renderCanvas = function() {
        var imgObj = App.getActiveImage(); if (!imgObj) { if (_origRenderCanvas) _origRenderCanvas(); return; }
        var src = imgObj.img;
        if (imgObj._balancePreview) src = imgObj._balancePreview;
        else if (imgObj._curvePreview) src = imgObj._curvePreview;
        else if (imgObj._hslPreview) src = imgObj._hslPreview;
        var canvas = App.els().mainCanvas;
        canvas.width = imgObj.width; canvas.height = imgObj.height;
        canvas.style.width = App.toDisplay(imgObj.width) + 'px';
        canvas.style.height = App.toDisplay(imgObj.height) + 'px';
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, imgObj.width, imgObj.height);
        ctx.drawImage(src, 0, 0, imgObj.width, imgObj.height);
        if (imgObj.pencilCanvas) ctx.drawImage(imgObj.pencilCanvas, 0, 0);
        App.els().canvasWrapper.style.width = App.toDisplay(imgObj.width) + 'px';
        App.els().canvasWrapper.style.height = App.toDisplay(imgObj.height) + 'px';
    };

    App.Filters = Filters;
})();
