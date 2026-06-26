(function () {
    'use strict';

    var LocalZoom = {
        activate: function () {
            if (!App.getActiveImage()) { App.showToast(App.i18n.t('dialog.open_image_first')); return; }
            App.Text.deselectAll();
            App.clearOperationLayer();
            App.setActiveImgTool('localzoom');
            App.state.activeLzSel = null;
            if (App.els().localZoomPropsSection) App.els().localZoomPropsSection.style.display = 'block';
            this.refreshZoomLabel();
        },

        deactivate: function () {
            App.state.activeLzSel = null;
            App.clearOperationLayer();
            if (App.els().localZoomPropsSection) App.els().localZoomPropsSection.style.display = 'none';
        },

        refreshZoomLabel: function () {
            if (!App.els().lzZoomDisp) return;
            App.els().lzZoomDisp.textContent = parseFloat(App.els().lzZoom.value).toFixed(2);
        },

        createSelection: function () {
            var img = App.getActiveImage();
            if (!img) return;
            var shape = App.els().lzShape.value;
            var w = Math.round(img.width * 0.3);
            var h = Math.round(img.height * 0.3);
            var x = Math.round((img.width - w) / 2);
            var y = Math.round((img.height - h) / 2);
            App.state.activeLzSel = { shape: shape, x: x, y: y, w: w, h: h };
            this.render();
        },

        render: function () {
            var layer = App.els().imgOperationLayer;
            if (!layer) return;
            layer.innerHTML = '';
            layer.classList.add('active');
            var sel = App.state.activeLzSel;
            if (!sel) return;
            var zoom = App.state.zoom / 100;
            var el = document.createElement('div');
            el.className = 'crop-box';
            el.style.left = (sel.x * zoom) + 'px';
            el.style.top = (sel.y * zoom) + 'px';
            el.style.width = (sel.w * zoom) + 'px';
            el.style.height = (sel.h * zoom) + 'px';
            el.style.border = '2px dashed #0078d7';
            el.style.background = 'rgba(0,120,215,0.1)';
            if (sel.shape === 'ellipse') el.style.borderRadius = '50%';
            for (var i = 0; i < 8; i++) {
                var h = document.createElement('span');
                var dirs = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
                h.className = 'resize-handle h-' + dirs[i];
                el.appendChild(h);
            }
            this.bindBoxEvents(el, sel);
            this.bindHandles(el, sel);
            el.addEventListener('dblclick', function (e) {
                e.stopPropagation();
                LocalZoom.apply();
            });
            layer.appendChild(el);
        },

        bindBoxEvents: function (el, sel) {
            var self = this;
            el.addEventListener('mousedown', function (e) {
                if (e.target.classList.contains('resize-handle')) return;
                e.preventDefault();
                e.stopPropagation();
                var startX = e.clientX, startY = e.clientY;
                var ox = sel.x, oy = sel.y;
                function onMove(ev) {
                    var dx = (ev.clientX - startX) * 100 / App.state.zoom;
                    var dy = (ev.clientY - startY) * 100 / App.state.zoom;
                    sel.x = Math.max(0, Math.min(App.getActiveImage().width - sel.w, ox + dx));
                    sel.y = Math.max(0, Math.min(App.getActiveImage().height - sel.h, oy + dy));
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
                        var o = { x: sel.x, y: sel.y, w: sel.w, h: sel.h };
                        function onMove(ev) {
                            var dx = (ev.clientX - startX) * 100 / App.state.zoom;
                            var dy = (ev.clientY - startY) * 100 / App.state.zoom;
                            if (dir.indexOf('e') >= 0) sel.w = Math.max(5, o.w + dx);
                            if (dir.indexOf('s') >= 0) sel.h = Math.max(5, o.h + dy);
                            if (dir.indexOf('w') >= 0) { sel.w = Math.max(5, o.w - dx); sel.x = o.x + dx; if (sel.w === 5) sel.x = o.x + o.w - 5; }
                            if (dir.indexOf('n') >= 0) { sel.h = Math.max(5, o.h - dy); sel.y = o.y + dy; if (sel.h === 5) sel.y = o.y + o.h - 5; }
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

        apply: function () {
            var sel = App.state.activeLzSel;
            if (!sel) return;
            var imgObj = App.getActiveImage();
            if (!imgObj) return;
            if (App.History) App.History.push(App.i18n.t('history.local_zoom'));
            var scale = parseFloat(App.els().lzZoom.value) || 2;
            var borderColor = App.els().lzBorderColor.value || '#ff0000';
            var borderWidth = parseInt(App.els().lzBorderWidth.value) || 0;
            var borderStyle = App.els().lzBorderStyle.value || 'solid';
            var bw = sel.w * scale;
            var bh = sel.h * scale;
            var lx = sel.x + sel.w + 20;
            if (lx + bw > imgObj.width) lx = Math.max(0, sel.x - bw - 20);
            var ly = sel.y;
            if (ly + bh > imgObj.height) ly = imgObj.height - bh;
            if (ly < 0) ly = 0;

            var obj = {
                id: 'lz_' + (Date.now()),
                type: 'localzoom',
                name: App.i18n.t('history.local_zoom'),
                srcShape: sel.shape,
                srcX: sel.x,
                srcY: sel.y,
                srcW: sel.w,
                srcH: sel.h,
                srcBorder: { color: borderColor, width: borderWidth, style: borderStyle },
                scale: scale,
                x: lx,
                y: ly
            };
            obj.zoomDataUrl = this.buildZoomCanvas(imgObj, obj).toDataURL('image/png');
            imgObj.objects.push(obj);
            App.deactivateAllImgTools();
            App.Objects.refreshList();
            App.Objects.selectObject(obj.id);
            App.renderAll();
        },

        buildZoomCanvas: function (imgObj, obj) {
            var canvas = document.createElement('canvas');
            canvas.width = Math.round(obj.srcW * obj.scale);
            canvas.height = Math.round(obj.srcH * obj.scale);
            var ctx = canvas.getContext('2d');
            ctx.save();
            if (obj.srcShape === 'ellipse') {
                ctx.beginPath();
                ctx.ellipse(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2, 0, 0, Math.PI * 2);
                ctx.clip();
            }
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(
                imgObj.img,
                obj.srcX, obj.srcY, obj.srcW, obj.srcH,
                0, 0, canvas.width, canvas.height
            );
            ctx.restore();
            this.drawBorder(ctx, canvas.width, canvas.height, obj.srcBorder);
            return canvas;
        },

        drawBorder: function (ctx, w, h, border) {
            if (!border || !border.width || border.style === 'none') return;
            ctx.save();
            ctx.lineWidth = border.width;
            ctx.strokeStyle = border.color;
            var b = border.width / 2;
            if (border.style === 'dashed') ctx.setLineDash([border.width * 2, border.width]);
            else if (border.style === 'dotted') ctx.setLineDash([border.width, border.width]);
            else if (border.style === 'double') ctx.lineWidth = border.width * 3;
            ctx.strokeRect(b, b, w - 2 * b, h - 2 * b);
            ctx.restore();
        },

        drawToObjectLayer: function (obj, layer) {
            if (!layer) return;
            var zoom = App.state.zoom / 100;
            var selected = (App.state.selectedObjId === obj.id);
            if (!obj.zoomDataUrl) {
                var imgObj = App.getActiveImage();
                if (imgObj) obj.zoomDataUrl = this.buildZoomCanvas(imgObj, obj).toDataURL('image/png');
            }
            var source = document.createElement('div');
            source.className = 'localzoom-source';
            if (obj.srcShape === 'ellipse') source.style.borderRadius = '50%';
            source.style.left = (obj.srcX * zoom) + 'px';
            source.style.top = (obj.srcY * zoom) + 'px';
            source.style.width = (obj.srcW * zoom) + 'px';
            source.style.height = (obj.srcH * zoom) + 'px';
            source.style.borderColor = obj.srcBorder.color;
            source.style.borderWidth = (obj.srcBorder.width * zoom) + 'px';
            source.style.borderStyle = obj.srcBorder.style || 'solid';
            source.style.boxSizing = 'border-box';
            if (selected) {
                source.style.boxShadow = '0 0 0 1px #fff inset';
            }
            var sl = document.createElement('div');
            sl.className = 'lz-label';
            sl.textContent = App.i18n.t('localzoom.source_area') + ' · ' + obj.srcW + '×' + obj.srcH;
            source.appendChild(sl);

            var img = new Image();
            img.onload = function () {
                box.style.background = '#000';
                var canvas = document.createElement('canvas');
                canvas.width = Math.round(obj.srcW * obj.scale);
                canvas.height = Math.round(obj.srcH * obj.scale);
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                canvas.style.width = (obj.srcW * obj.scale * zoom) + 'px';
                canvas.style.height = (obj.srcH * obj.scale * zoom) + 'px';
                box.appendChild(canvas);
            };
            img.src = obj.zoomDataUrl;

            var box = document.createElement('div');
            box.className = 'localzoom-box';
            box.style.left = (obj.x * zoom) + 'px';
            box.style.top = (obj.y * zoom) + 'px';
            box.style.width = (obj.srcW * obj.scale * zoom) + 'px';
            box.style.height = (obj.srcH * obj.scale * zoom) + 'px';
            box.style.borderColor = obj.srcBorder.color;
            box.style.borderWidth = (obj.srcBorder.width * zoom) + 'px';
            box.style.borderStyle = obj.srcBorder.style || 'solid';
            box.dataset.objId = obj.id;
            box.style.userSelect = 'none';
            if (selected) {
                box.style.outline = '2px solid #fff';
                box.style.outlineOffset = '-2px';
            }
            var bl = document.createElement('div');
            bl.className = 'lz-label';
            bl.textContent = App.i18n.t('localzoom.zoom_label') + ' ' + obj.scale.toFixed(1) + '×';
            box.appendChild(bl);

            var self = this;
            this.bindObjectDrag(box, obj, 'pos');
            this.bindObjectDrag(source, obj, 'src');
            if (selected) this.drawHandles(box, obj);
            layer.appendChild(source);
            layer.appendChild(box);
        },

        bindObjectDrag: function (el, obj, kind) {
            el.addEventListener('mousedown', function (e) {
                e.preventDefault();
                e.stopPropagation();
                App.Objects.selectObject(obj.id);
                if (e.target.classList.contains('resize-handle')) return;
                var startX = e.clientX, startY = e.clientY;
                var ox, oy;
                if (kind === 'pos') { ox = obj.x; oy = obj.y; }
                else { ox = obj.srcX; oy = obj.srcY; }
                function onMove(ev) {
                    var dx = (ev.clientX - startX) * 100 / App.state.zoom;
                    var dy = (ev.clientY - startY) * 100 / App.state.zoom;
                    if (kind === 'pos') {
                        obj.x = Math.round(ox + dx);
                        obj.y = Math.round(oy + dy);
                    } else {
                        var img = App.getActiveImage();
                        obj.srcX = Math.max(0, Math.min(img.width - obj.srcW, Math.round(ox + dx)));
                        obj.srcY = Math.max(0, Math.min(img.height - obj.srcH, Math.round(oy + dy)));
                        var imgObj = App.getActiveImage();
                        if (imgObj) obj.zoomDataUrl = LocalZoom.buildZoomCanvas(imgObj, obj).toDataURL('image/png');
                    }
                    App.renderAll();
                }
                function onUp() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                }
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        },

        drawHandles: function (el, obj) {
            var zoom = App.state.zoom / 100;
            for (var i = 0; i < 8; i++) {
                var h = document.createElement('span');
                var dirs = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
                h.className = 'resize-handle h-' + dirs[i];
                h.style.zIndex = 100;
                h.style.display = 'block';
                (function (dir, hnd, o) {
                    hnd.addEventListener('mousedown', function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        var startX = e.clientX, startY = e.clientY;
                        var oSc = o.scale, oX = o.x, oY = o.y;
                        function onMove(ev) {
                            var dx = (ev.clientX - startX) * 100 / App.state.zoom;
                            var dy = (ev.clientY - startY) * 100 / App.state.zoom;
                            var d = Math.max(Math.abs(dx), Math.abs(dy));
                            var base = Math.sqrt(o.srcW * o.srcW + o.srcH * o.srcH);
                            var delta = (dir === 'ne' || dir === 'se' || dir === 'e' || dir === 's') ? d : -d;
                            var newScale = Math.max(1, Math.min(10, oSc + delta / base));
                            var newW = o.srcW * newScale;
                            var newH = o.srcH * newScale;
                            var oldW = o.srcW * oSc;
                            var oldH = o.srcH * oSc;
                            if (dir === 'nw') { o.x = oX + (oldW - newW); o.y = oY + (oldH - newH); }
                            else if (dir === 'n') { o.y = oY + (oldH - newH); }
                            else if (dir === 'ne') { o.y = oY + (oldH - newH); }
                            else if (dir === 'w') { o.x = oX + (oldW - newW); }
                            else if (dir === 'sw') { o.x = oX + (oldW - newW); }
                            else { }
                            o.scale = newScale;
                            var imgObj = App.getActiveImage();
                            if (imgObj) o.zoomDataUrl = LocalZoom.buildZoomCanvas(imgObj, o).toDataURL('image/png');
                            App.renderAll();
                        }
                        function onUp() {
                            document.removeEventListener('mousemove', onMove);
                            document.removeEventListener('mouseup', onUp);
                        }
                        document.addEventListener('mousemove', onMove);
                        document.addEventListener('mouseup', onUp);
                    });
                })(dirs[i], h, obj);
                el.appendChild(h);
            }
        }
    };

    App.LocalZoom = LocalZoom;
})();
