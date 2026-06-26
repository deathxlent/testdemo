(function () {
    'use strict';

    var Pencil = {
        previewCanvas: null,
        previewCtx: null,
        tmpStroke: null,

        activate: function () {
            if (!App.getActiveImage()) { App.showToast(App.i18n.t('dialog.open_image_first')); return; }
            App.Text.deselectAll();
            this.ensurePencilCanvas();
            App.setActiveImgTool('pencil');
            App.state.pencilActive = true;
            App.state.pencilDrawing = false;
            App.state.pencilMode = 'free';
            App.state.pencilStartPoint = null;
            App.state.pencilLastPoint = null;
            App.state.pencilCurvePoints = [];
            App.state.pencilCurveAnchors = [];
            App.clearOperationLayer();
            if (App.els().pencilPropsSection) App.els().pencilPropsSection.style.display = 'block';
            this.refreshOpacityLabel();
            this.initPreviewCanvas();
            this.renderAnchors();
        },

        deactivate: function () {
            App.state.pencilActive = false;
            App.state.pencilDrawing = false;
            App.state.pencilCurvePoints = [];
            App.state.pencilCurveAnchors = [];
            App.clearOperationLayer();
            if (this.previewCanvas) {
                if (this.previewCanvas.parentNode) this.previewCanvas.parentNode.removeChild(this.previewCanvas);
                this.previewCanvas = null;
                this.previewCtx = null;
            }
            if (App.els().pencilPropsSection) App.els().pencilPropsSection.style.display = 'none';
        },

        refreshOpacityLabel: function () {
            if (App.els().pencilOpacityDisp) {
                App.els().pencilOpacityDisp.textContent = App.els().pencilOpacity.value;
            }
        },

        ensurePencilCanvas: function () {
            var imgObj = App.getActiveImage();
            if (!imgObj) return;
            if (!imgObj.pencilCanvas || imgObj.pencilCanvas.width !== imgObj.width || imgObj.pencilCanvas.height !== imgObj.height) {
                var pc = document.createElement('canvas');
                pc.width = imgObj.width;
                pc.height = imgObj.height;
                var pctx = pc.getContext('2d');
                if (imgObj.pencilCanvas) {
                    pctx.drawImage(imgObj.pencilCanvas, 0, 0);
                }
                imgObj.pencilCanvas = pc;
            }
        },

        initPreviewCanvas: function () {
            var imgObj = App.getActiveImage();
            if (!imgObj) return;
            var layer = App.els().imgOperationLayer;
            var zoom = App.state.zoom / 100;
            if (this.previewCanvas && this.previewCanvas.parentNode) {
                this.previewCanvas.parentNode.removeChild(this.previewCanvas);
            }
            var c = document.createElement('canvas');
            c.className = 'pencil-canvas';
            c.width = imgObj.width;
            c.height = imgObj.height;
            c.style.width = (imgObj.width * zoom) + 'px';
            c.style.height = (imgObj.height * zoom) + 'px';
            layer.appendChild(c);
            this.previewCanvas = c;
            this.previewCtx = c.getContext('2d');
        },

        clearPreview: function () {
            if (!this.previewCtx) return;
            this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        },

        strokeStyle: function (ctx) {
            ctx.strokeStyle = App.els().pencilColor.value || '#000000';
            ctx.lineWidth = parseFloat(App.els().pencilWidth.value) || 2;
            ctx.globalAlpha = Math.max(0.01, (parseFloat(App.els().pencilOpacity.value) || 100) / 100);
            var cap = App.els().pencilCap.value || 'round';
            ctx.lineCap = cap;
            ctx.lineJoin = cap;
        },

        onCanvasMouseDown: function (imgX, imgY, e) {
            if (!App.state.pencilActive) return;
            this.ensurePencilCanvas();
            if (!this.previewCanvas) this.initPreviewCanvas();

            var shift = e.shiftKey;
            var ctrl = e.ctrlKey || e.metaKey;

            if (ctrl) {
                App.state.pencilMode = 'curve';
                var anchor = { x: imgX, y: imgY, inC: null, outC: null };
                App.state.pencilCurveAnchors.push(anchor);
                App.state._pencilDraggingAnchor = App.state.pencilCurveAnchors.length - 1;
                App.state._pencilDragMode = 'anchor';
                App.state.pencilDrawing = true;
                this.renderAnchors();
                this.drawCurvePreview();
                return;
            }

            if (shift) {
                App.state.pencilMode = 'line';
                App.state.pencilStartPoint = { x: imgX, y: imgY };
                App.state.pencilLastPoint = { x: imgX, y: imgY };
                App.state.pencilDrawing = true;
                return;
            }

            App.state.pencilMode = 'free';
            App.state.pencilStartPoint = { x: imgX, y: imgY };
            App.state.pencilLastPoint = { x: imgX, y: imgY };
            App.state.pencilDrawing = true;
            var ctx = App.getActiveImage().pencilCanvas.getContext('2d');
            this.strokeStyle(ctx);
            ctx.beginPath();
            ctx.arc(imgX, imgY, (parseFloat(App.els().pencilWidth.value) || 2) / 2, 0, Math.PI * 2);
            ctx.fillStyle = App.els().pencilColor.value || '#000';
            ctx.globalAlpha = Math.max(0.01, (parseFloat(App.els().pencilOpacity.value) || 100) / 100);
            ctx.fill();
            App.renderCanvas();
        },

        onCanvasMouseMove: function (imgX, imgY, e) {
            if (!App.state.pencilActive) return;
            var shift = e.shiftKey;
            var ctrl = e.ctrlKey || e.metaKey;

            if (App.state.pencilDrawing && App.state._pencilDragMode === 'anchor') {
                var idx = App.state._pencilDraggingAnchor;
                var anchor = App.state.pencilCurveAnchors[idx];
                if (!anchor) return;
                var sx = anchor.x, sy = anchor.y;
                var dx = imgX - sx, dy = imgY - sy;
                anchor.outC = { x: imgX, y: imgY };
                anchor.inC = { x: sx - dx, y: sy - dy };
                this.clearPreview();
                this.renderAnchors();
                this.drawCurvePreview();
                return;
            }
            if (App.state.pencilDrawing && App.state._pencilDragMode) {
                this.handleControlDrag(imgX, imgY);
                return;
            }

            if (!App.state.pencilDrawing) return;

            if (App.state.pencilMode === 'line') {
                this.clearPreview();
                this.strokeStyle(this.previewCtx);
                this.previewCtx.beginPath();
                this.previewCtx.moveTo(App.state.pencilStartPoint.x, App.state.pencilStartPoint.y);
                this.previewCtx.lineTo(imgX, imgY);
                this.previewCtx.stroke();
                App.state.pencilLastPoint = { x: imgX, y: imgY };
                return;
            }

            if (App.state.pencilMode === 'free') {
                var ctx = App.getActiveImage().pencilCanvas.getContext('2d');
                this.strokeStyle(ctx);
                ctx.beginPath();
                ctx.moveTo(App.state.pencilLastPoint.x, App.state.pencilLastPoint.y);
                ctx.lineTo(imgX, imgY);
                ctx.stroke();
                App.state.pencilLastPoint = { x: imgX, y: imgY };
                App.renderCanvas();
            }
        },

        onCanvasMouseUp: function (imgX, imgY, e) {
            if (!App.state.pencilActive) return;
            if (App.state._pencilDragMode) {
                App.state._pencilDragMode = null;
                App.state._pencilDraggingAnchor = null;
                App.state.pencilDrawing = false;
                this.renderAnchors();
                this.drawCurvePreview();
                return;
            }
            if (!App.state.pencilDrawing) return;

            if (App.state.pencilMode === 'line') {
                var ctx = App.getActiveImage().pencilCanvas.getContext('2d');
                this.strokeStyle(ctx);
                ctx.beginPath();
                ctx.moveTo(App.state.pencilStartPoint.x, App.state.pencilStartPoint.y);
                ctx.lineTo(imgX, imgY);
                ctx.stroke();
                App.renderCanvas();
                this.clearPreview();
                App.state.pencilDrawing = false;
                App.state.pencilStartPoint = null;
                App.state.pencilLastPoint = null;
                if (App.History) App.History.push(App.i18n.t('history.pencil_line'));
                return;
            }

            if (App.state.pencilMode === 'free') {
                App.state.pencilDrawing = false;
                if (App.History) App.History.push(App.i18n.t('history.pencil_freehand'));
                return;
            }

            if (App.state.pencilMode === 'curve') {
                App.state.pencilDrawing = false;
                App.state._pencilDragMode = null;
                App.state._pencilDraggingAnchor = null;
                this.renderAnchors();
                this.drawCurvePreview();
                return;
            }
        },

        onCanvasDblClick: function (imgX, imgY, e) {
            if (!App.state.pencilActive) return;
            if (App.state.pencilMode === 'curve' && App.state.pencilCurveAnchors.length >= 2) {
                this.finishCurve();
            }
        },

        onCanvasClick: function (imgX, imgY, e) {
            if (!App.state.pencilActive) return;
            var ctrl = e.ctrlKey || e.metaKey;
            if (!ctrl && App.state.pencilMode === 'curve' && App.state.pencilCurveAnchors.length >= 2) {
                return;
            }
        },

        handleControlDrag: function (imgX, imgY) {
            var mode = App.state._pencilDragMode;
            var idx = App.state._pencilDraggingAnchor;
            if (idx == null) return;
            var anchor = App.state.pencilCurveAnchors[idx];
            if (!anchor) return;
            if (mode === 'inC') {
                anchor.inC = { x: imgX, y: imgY };
                if (anchor.outC) {
                    var dx = anchor.x - imgX, dy = anchor.y - imgY;
                    anchor.outC = { x: anchor.x + dx, y: anchor.y + dy };
                }
            } else if (mode === 'outC') {
                anchor.outC = { x: imgX, y: imgY };
                if (anchor.inC) {
                    var dx = anchor.x - imgX, dy = anchor.y - imgY;
                    anchor.inC = { x: anchor.x + dx, y: anchor.y + dy };
                }
            } else if (mode === 'anchor') {
                var dx = imgX - anchor.x, dy = imgY - anchor.y;
                anchor.x = imgX; anchor.y = imgY;
                if (anchor.inC) { anchor.inC.x += dx; anchor.inC.y += dy; }
                if (anchor.outC) { anchor.outC.x += dx; anchor.outC.y += dy; }
            }
            this.clearPreview();
            this.renderAnchors();
            this.drawCurvePreview();
        },

        renderAnchors: function () {
            var layer = App.els().imgOperationLayer;
            if (!layer) return;
            var zoom = App.state.zoom / 100;
            var self = this;
            App.state.pencilCurveAnchors.forEach(function (anchor, i) {
                var a = document.createElement('div');
                a.className = 'pencil-path-anchor';
                a.style.left = (anchor.x * zoom) + 'px';
                a.style.top = (anchor.y * zoom) + 'px';
                a.addEventListener('mousedown', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (e.detail === 2) {
                        App.state.pencilCurveAnchors.splice(i, 1);
                        self.renderAnchors();
                        self.drawCurvePreview();
                        return;
                    }
                    App.state._pencilDragMode = 'anchor';
                    App.state._pencilDraggingAnchor = i;
                    App.state.pencilDrawing = true;
                });
                layer.appendChild(a);
                if (anchor.inC) self.renderControlHandle(anchor, anchor.inC, 'inC', i);
                if (anchor.outC) self.renderControlHandle(anchor, anchor.outC, 'outC', i);
                if (anchor.inC) self.renderControlLine(anchor.x, anchor.y, anchor.inC.x, anchor.inC.y);
                if (anchor.outC) self.renderControlLine(anchor.x, anchor.y, anchor.outC.x, anchor.outC.y);
            });
        },

        renderControlHandle: function (anchor, pt, kind, idx) {
            var layer = App.els().imgOperationLayer;
            var zoom = App.state.zoom / 100;
            var h = document.createElement('div');
            h.className = 'pencil-path-anchor is-control';
            h.style.left = (pt.x * zoom) + 'px';
            h.style.top = (pt.y * zoom) + 'px';
            h.addEventListener('mousedown', function (e) {
                e.stopPropagation();
                e.preventDefault();
                App.state._pencilDragMode = kind;
                App.state._pencilDraggingAnchor = idx;
                App.state.pencilDrawing = true;
            });
            layer.appendChild(h);
        },

        renderControlLine: function (x1, y1, x2, y2) {
            var layer = App.els().imgOperationLayer;
            var zoom = App.state.zoom / 100;
            var line = document.createElement('div');
            line.className = 'pencil-path-control-line';
            var dx = (x2 - x1) * zoom;
            var dy = (y2 - y1) * zoom;
            var len = Math.sqrt(dx * dx + dy * dy);
            var ang = Math.atan2(dy, dx) * 180 / Math.PI;
            line.style.left = (x1 * zoom) + 'px';
            line.style.top = (y1 * zoom) + 'px';
            line.style.width = len + 'px';
            line.style.transform = 'rotate(' + ang + 'deg)';
            layer.appendChild(line);
        },

        drawCurvePreview: function () {
            if (!this.previewCtx) return;
            this.clearPreview();
            if (App.state.pencilCurveAnchors.length < 2) return;
            var anchors = App.state.pencilCurveAnchors;
            this.strokeStyle(this.previewCtx);
            var ctx = this.previewCtx;
            ctx.beginPath();
            ctx.moveTo(anchors[0].x, anchors[0].y);
            for (var i = 0; i < anchors.length - 1; i++) {
                var p0 = anchors[i];
                var p1 = anchors[i + 1];
                var cp1 = p0.outC || { x: p0.x + (p1.x - p0.x) / 3, y: p0.y + (p1.y - p0.y) / 3 };
                var cp2 = p1.inC || { x: p1.x - (p1.x - p0.x) / 3, y: p1.y - (p1.y - p0.y) / 3 };
                ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p1.x, p1.y);
            }
            ctx.stroke();
        },

        finishCurve: function () {
            if (App.state.pencilCurveAnchors.length < 2) {
                App.state.pencilCurveAnchors = [];
                this.renderAnchors();
                this.clearPreview();
                return;
            }
            var imgObj = App.getActiveImage();
            if (!imgObj) return;
            var ctx = imgObj.pencilCanvas.getContext('2d');
            this.strokeStyle(ctx);
            var anchors = App.state.pencilCurveAnchors;
            ctx.beginPath();
            ctx.moveTo(anchors[0].x, anchors[0].y);
            for (var i = 0; i < anchors.length - 1; i++) {
                var p0 = anchors[i];
                var p1 = anchors[i + 1];
                var cp1 = p0.outC || { x: p0.x + (p1.x - p0.x) / 3, y: p0.y + (p1.y - p0.y) / 3 };
                var cp2 = p1.inC || { x: p1.x - (p1.x - p0.x) / 3, y: p1.y - (p1.y - p0.y) / 3 };
                ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p1.x, p1.y);
            }
            ctx.stroke();
            if (App.History) App.History.push(App.i18n.t('history.pencil_curve'));
            App.state.pencilCurveAnchors = [];
            App.state.pencilMode = 'free';
            App.clearOperationLayer();
            this.clearPreview();
            App.renderCanvas();
        },

        cancelCurve: function () {
            App.state.pencilCurveAnchors = [];
            App.state.pencilMode = 'free';
            App.clearOperationLayer();
            this.clearPreview();
        },

        clearPencilLayer: function () {
            var imgObj = App.getActiveImage();
            if (!imgObj) return;
            if (App.History) App.History.push(App.i18n.t('history.pencil_clear'));
            if (imgObj.pencilCanvas) {
                var c = imgObj.pencilCanvas.getContext('2d');
                c.clearRect(0, 0, imgObj.pencilCanvas.width, imgObj.pencilCanvas.height);
            }
            App.renderCanvas();
        }
    };

    App.Pencil = Pencil;
})();
