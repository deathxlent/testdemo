(function () {
    'use strict';

    function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function getRenderFn(kind) {
        var Fn = App.Filters;
        return Fn ? Fn['render' + capital(kind)] : null;
    }

    function getUpdateFnName(kind) { return 'update' + capital(kind) + 'Preview'; }
    function getApplyFnName(kind) { return 'apply' + capital(kind); }

    function renderSizeInputs(kind) {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var els = App.els();
        var type, sizeContent;
        if (kind === 'hsl') { type = els.hslSelType.value; sizeContent = els.hslSelSizeContent; }
        else if (kind === 'curve') { type = els.curveSelType.value; sizeContent = els.curveSelSizeContent; }
        else if (kind === 'balance') { type = els.balanceSelType.value; sizeContent = els.balanceSelSizeContent; }
        if (!sizeContent) return;
        sizeContent.innerHTML = '';
        var W = imgObj.width, H = imgObj.height;
        if (type === 'rect') {
            sizeContent.innerHTML =
                '<div class="prop-group two-col"><div><label>X</label><input type="number" id="'+kind+'rectx" min="0" max="'+(W-1)+'" value="'+Math.round(W*0.2)+'"></div>' +
                '<div><label>Y</label><input type="number" id="'+kind+'recty" min="0" max="'+(H-1)+'" value="'+Math.round(H*0.2)+'"></div></div>' +
                '<div class="prop-group two-col"><div><label>' + App.i18n.t('filter.width') + '</label><input type="number" id="'+kind+'rectw" min="10" max="'+W+'" value="'+Math.round(W*0.6)+'"></div>' +
                '<div><label>' + App.i18n.t('filter.height') + '</label><input type="number" id="'+kind+'recth" min="10" max="'+H+'" value="'+Math.round(H*0.6)+'"></div></div>';
        } else if (type === 'circle') {
            sizeContent.innerHTML =
                '<div class="prop-group two-col"><div><label>' + App.i18n.t('filter.center_x') + '</label><input type="number" id="'+kind+'ccx" min="0" max="'+(W-1)+'" value="'+Math.round(W*0.5)+'"></div>' +
                '<div><label>' + App.i18n.t('filter.center_y') + '</label><input type="number" id="'+kind+'ccy" min="0" max="'+(H-1)+'" value="'+Math.round(H*0.5)+'"></div></div>' +
                '<div class="prop-group"><label>' + App.i18n.t('filter.radius') + '</label><input type="number" id="'+kind+'cr" min="5" value="'+Math.round(Math.min(W,H)*0.25)+'"></div>';
        } else if (type === 'ellipse') {
            sizeContent.innerHTML =
                '<div class="prop-group two-col"><div><label>' + App.i18n.t('filter.center_x') + '</label><input type="number" id="'+kind+'ecx" min="0" max="'+(W-1)+'" value="'+Math.round(W*0.5)+'"></div>' +
                '<div><label>' + App.i18n.t('filter.center_y') + '</label><input type="number" id="'+kind+'ecy" min="0" max="'+(H-1)+'" value="'+Math.round(H*0.5)+'"></div></div>' +
                '<div class="prop-group two-col"><div><label>' + App.i18n.t('filter.x_radius') + '</label><input type="number" id="'+kind+'erx" min="5" value="'+Math.round(W*0.3)+'"></div>' +
                '<div><label>' + App.i18n.t('filter.y_radius') + '</label><input type="number" id="'+kind+'ery" min="5" value="'+Math.round(H*0.3)+'"></div></div>';
        }
    }

    function createSelection(kind) {
        var imgObj = App.getActiveImage(); if (!imgObj) return;
        var els = App.els();
        var stateSelKey = 'active' + capital(kind) + 'Sel';
        var polyKey = kind + 'PolygonPoints';
        var type;
        if (kind === 'hsl') {
            type = els.hslSelType.value;
            App.state.activeHslSel = null;
            App.state.hslPolygonPoints = [];
        } else if (kind === 'curve') {
            type = els.curveSelType.value;
            App.state.activeCurveSel = null;
            App.state.curvePolygonPoints = [];
        } else if (kind === 'balance') {
            type = els.balanceSelType.value;
            App.state.activeBalanceSel = null;
            App.state.balancePolygonPoints = [];
        }
        var sel = { type: type };
        try {
            if (type === 'rect') sel = { type: type, x: +document.getElementById(kind+'rectx').value, y: +document.getElementById(kind+'recty').value,
                w: +document.getElementById(kind+'rectw').value, h: +document.getElementById(kind+'recth').value };
            else if (type === 'circle') sel = { type: type, cx: +document.getElementById(kind+'ccx').value, cy: +document.getElementById(kind+'ccy').value, r: +document.getElementById(kind+'cr').value };
            else if (type === 'ellipse') sel = { type: type, cx: +document.getElementById(kind+'ecx').value, cy: +document.getElementById(kind+'ecy').value,
                rx: +document.getElementById(kind+'erx').value, ry: +document.getElementById(kind+'ery').value };
            else if (type === 'polygon') sel = { type: type, points: [] };
        } catch(e) { App.showToast(App.i18n.t('filter.invalid_value')); return; }
        sel.w = Math.max(10, Math.min(imgObj.width - sel.x, sel.w | 0));
        sel.h = Math.max(10, Math.min(imgObj.height - sel.y, sel.h | 0));
        App.state[stateSelKey] = sel;
        var Fn = App.Filters;
        var renderFn = getRenderFn(kind);
        var updateFnName = getUpdateFnName(kind);
        if (renderFn) renderFn();
        if (Fn && Fn[updateFnName]) Fn[updateFnName]();
    }

    function clearPolygon(kind) {
        var polyKey = kind + 'PolygonPoints';
        var selKey = 'active' + capital(kind) + 'Sel';
        App.state[polyKey] = [];
        App.state[selKey] = null;
        var Fn = App.Filters;
        var renderFn = getRenderFn(kind);
        var updateFnName = getUpdateFnName(kind);
        if (renderFn) renderFn();
        if (Fn && Fn[updateFnName]) Fn[updateFnName]();
    }

    function renderGenericSelBox(kind) {
        var layer = App.els().imgOperationLayer; if (!layer) return;
        var selKey = 'active' + capital(kind) + 'Sel';
        var polyKey = kind + 'PolygonPoints';
        var sel = App.state[selKey];
        var pts = App.state[polyKey] || [];
        var old = document.getElementById('sel-box-' + kind);
        if (old) old.remove();
        var oldPoly = document.getElementById('sel-polygon-' + kind);
        if (oldPoly) oldPoly.remove();
        var oldDots = document.getElementById('sel-polygon-dots-' + kind);
        if (oldDots) oldDots.remove();
        var imgObj = App.getActiveImage(); if (!imgObj) return;
        var tint = kind === 'hsl' ? 'rgba(255,150,0,0.15)' : kind === 'curve' ? 'rgba(120,200,255,0.15)' : 'rgba(200,120,255,0.15)';
        var border = kind === 'hsl' ? '#ffa040' : kind === 'curve' ? '#40b0ff' : '#c060ff';

        if (sel && (sel.type === 'rect' || sel.type === 'circle' || sel.type === 'ellipse')) {
            var el = document.createElement('div');
            el.id = 'sel-box-' + kind;
            el.className = 'sel-box';
            el.style.position = 'absolute';
            el.style.border = '1.5px dashed ' + border;
            el.style.background = tint;
            el.style.pointerEvents = 'none';
            el.style.boxSizing = 'border-box';

            if (sel.type === 'rect') {
                el.style.left = App.toDisplay(sel.x) + 'px';
                el.style.top = App.toDisplay(sel.y) + 'px';
                el.style.width = App.toDisplay(sel.w) + 'px';
                el.style.height = App.toDisplay(sel.h) + 'px';
                el.style.zIndex = '10';
                layer.appendChild(el);
                appendResizeHandles(el, kind, 'rect');
            } else if (sel.type === 'circle') {
                var d = App.toDisplay(sel.r * 2);
                el.style.left = App.toDisplay(sel.cx - sel.r) + 'px';
                el.style.top = App.toDisplay(sel.cy - sel.r) + 'px';
                el.style.width = d + 'px';
                el.style.height = d + 'px';
                el.style.borderRadius = '50%';
                el.style.zIndex = '10';
                layer.appendChild(el);
                appendResizeHandles(el, kind, 'circle');
            } else if (sel.type === 'ellipse') {
                el.style.left = App.toDisplay(sel.cx - sel.rx) + 'px';
                el.style.top = App.toDisplay(sel.cy - sel.ry) + 'px';
                el.style.width = App.toDisplay(sel.rx * 2) + 'px';
                el.style.height = App.toDisplay(sel.ry * 2) + 'px';
                el.style.borderRadius = '50%';
                el.style.zIndex = '10';
                layer.appendChild(el);
                appendResizeHandles(el, kind, 'ellipse');
            }
        }

        if (sel && sel.type === 'polygon' && pts.length > 0) {
            var poly = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            poly.id = 'sel-polygon-' + kind;
            poly.setAttribute('class', 'sel-polygon');
            poly.style.position = 'absolute';
            poly.style.left = '0'; poly.style.top = '0';
            poly.style.width = App.toDisplay(imgObj.width) + 'px';
            poly.style.height = App.toDisplay(imgObj.height) + 'px';
            poly.style.pointerEvents = 'none';
            poly.style.zIndex = '9';
            var pointsStr = pts.map(function(p){ return App.toDisplay(p.x)+','+App.toDisplay(p.y); }).join(' ');
            var pol = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            pol.setAttribute('points', pointsStr);
            pol.setAttribute('fill', tint);
            pol.setAttribute('stroke', border);
            pol.setAttribute('stroke-width', '1.5');
            pol.setAttribute('stroke-dasharray', '4,3');
            poly.appendChild(pol);
            layer.appendChild(poly);

            if (pts.length >= 3) {
                var dots = document.createElement('div');
                dots.id = 'sel-polygon-dots-' + kind;
                dots.style.position = 'absolute'; dots.style.left = '0'; dots.style.top = '0';
                dots.style.width = App.toDisplay(imgObj.width) + 'px'; dots.style.height = App.toDisplay(imgObj.height) + 'px';
                dots.style.zIndex = '11'; dots.style.pointerEvents = 'none';
                for (var pi = 0; pi < pts.length; pi++) {
                    (function(idx){
                        var dot = document.createElement('div');
                        dot.className = 'sel-poly-dot';
                        dot.style.position = 'absolute';
                        dot.style.left = (App.toDisplay(pts[idx].x) - 5) + 'px';
                        dot.style.top = (App.toDisplay(pts[idx].y) - 5) + 'px';
                        dot.style.width = '10px'; dot.style.height = '10px';
                        dot.style.background = border; dot.style.border = '1.5px solid #fff';
                        dot.style.borderRadius = '50%'; dot.style.cursor = 'pointer';
                        dot.style.pointerEvents = 'auto'; dot.style.zIndex = '20';
                        dot._ptIdx = idx; dot._kind = kind;
                        dots.appendChild(dot);
                    })(pi);
                }
                layer.appendChild(dots);
                bindPolygonDrag(dots, kind);
            }
        }
    }

    function bindPolygonDrag(dotsDiv, kind) {
        var polyKey = kind + 'PolygonPoints';
        var renderFn = getRenderFn(kind);
        var updateFnName = getUpdateFnName(kind);
        var dragging = null, startX, startY, startPt;
        var dotNodes = dotsDiv.querySelectorAll('.sel-poly-dot');
        dotNodes.forEach(function(d){
            d.addEventListener('mousedown', function(e){
                e.preventDefault(); e.stopPropagation();
                dragging = d._ptIdx;
                startX = e.clientX; startY = e.clientY;
                startPt = App.state[polyKey][dragging];
            });
            d.addEventListener('contextmenu', function(e){
                e.preventDefault();
                if (App.state[polyKey].length <= 3) { App.showToast(App.i18n.t('filter.min_points')); return; }
                App.state[polyKey].splice(d._ptIdx, 1);
                if (renderFn) renderFn();
                var Fn = App.Filters;
                if (Fn && Fn[updateFnName]) Fn[updateFnName]();
            });
        });
        window.addEventListener('mousemove', function(e){
            if (dragging === null) return;
            var pts = App.state[polyKey];
            var imgObj = App.getActiveImage(); if (!imgObj) return;
            var rect = App.els().canvasWrapper.getBoundingClientRect();
            var nx = App.toImage(e.clientX - rect.left);
            var ny = App.toImage(e.clientY - rect.top);
            pts[dragging].x = Math.max(0, Math.min(imgObj.width-1, nx));
            pts[dragging].y = Math.max(0, Math.min(imgObj.height-1, ny));
            if (renderFn) renderFn();
        });
        window.addEventListener('mouseup', function(){
            if (dragging !== null) {
                dragging = null;
                var Fn = App.Filters;
                if (Fn && Fn[updateFnName]) Fn[updateFnName]();
            }
        });
    }

    function appendResizeHandles(box, kind, shape) {
        var handles = shape === 'circle' ? ['e','w','n','s','ne','nw','se','sw'] : (shape === 'ellipse' ? ['e','w','n','s'] : ['nw','n','ne','e','se','s','sw','w']);
        handles.forEach(function(h){
            var el = document.createElement('div');
            el.className = 'resize-handle resize-handle-' + h;
            el._handle = h; el._kind = kind; el._shape = shape;
            el.style.zIndex = '30';
            box.appendChild(el);
        });
    }

    function bindGenericSelEvents(kind) {
        var layer = App.els().imgOperationLayer; if (!layer) return;
        var selKey = 'active' + capital(kind) + 'Sel';
        var renderFn = getRenderFn(kind);
        var updateFnName = getUpdateFnName(kind);
        var applyFnName = getApplyFnName(kind);
        var box = document.getElementById('sel-box-' + kind);
        if (box && !box._bound) {
            box._bound = true;
            box.style.pointerEvents = 'auto';
            box.style.cursor = 'move';
            var dragging = false, startX, startY, startSel;
            box.addEventListener('mousedown', function(e){
                if (e.target && e.target.classList.contains('resize-handle')) return;
                dragging = true; startX = e.clientX; startY = e.clientY;
                startSel = JSON.parse(JSON.stringify(App.state[selKey]));
                e.preventDefault(); e.stopPropagation();
            });
            box.addEventListener('dblclick', function(e){
                e.preventDefault(); e.stopPropagation();
                var Fn = App.Filters;
                if (Fn && Fn[applyFnName]) Fn[applyFnName]();
            });
            window.addEventListener('mousemove', function(e){
                if (!dragging) return;
                var imgObj = App.getActiveImage(); if (!imgObj) return;
                var dx = App.toImage(e.clientX - startX);
                var dy = App.toImage(e.clientY - startY);
                var s = startSel;
                var ns = JSON.parse(JSON.stringify(s));
                if (s.type === 'rect') {
                    ns.x = Math.max(0, Math.min(imgObj.width - s.w, s.x + dx));
                    ns.y = Math.max(0, Math.min(imgObj.height - s.h, s.y + dy));
                } else if (s.type === 'circle') {
                    ns.cx = Math.max(s.r, Math.min(imgObj.width - s.r, s.cx + dx));
                    ns.cy = Math.max(s.r, Math.min(imgObj.height - s.r, s.cy + dy));
                } else if (s.type === 'ellipse') {
                    ns.cx = Math.max(s.rx, Math.min(imgObj.width - s.rx, s.cx + dx));
                    ns.cy = Math.max(s.ry, Math.min(imgObj.height - s.ry, s.cy + dy));
                }
                App.state[selKey] = ns;
                if (renderFn) renderFn();
            });
            window.addEventListener('mouseup', function(){
                if (dragging) {
                    dragging = false;
                    var Fn = App.Filters;
                    if (Fn && Fn[updateFnName]) Fn[updateFnName]();
                }
            });

            box.querySelectorAll('.resize-handle').forEach(function(h){
                var rDragging = false, rStartX, rStartY, rStartSel;
                h.addEventListener('mousedown', function(e){
                    rDragging = true; rStartX = e.clientX; rStartY = e.clientY;
                    rStartSel = JSON.parse(JSON.stringify(App.state[selKey]));
                    e.preventDefault(); e.stopPropagation();
                });
                window.addEventListener('mousemove', function(e){
                    if (!rDragging) return;
                    var imgObj = App.getActiveImage(); if (!imgObj) return;
                    var dx = App.toImage(e.clientX - rStartX);
                    var dy = App.toImage(e.clientY - rStartY);
                    var s = rStartSel;
                    var ns = JSON.parse(JSON.stringify(s));
                    var handle = h._handle;
                    if (s.type === 'rect') {
                        if (handle.indexOf('e') >= 0) ns.w = Math.max(10, s.w + dx);
                        if (handle.indexOf('w') >= 0) { ns.w = Math.max(10, s.w - dx); ns.x = s.x + (s.w - ns.w); }
                        if (handle.indexOf('s') >= 0) ns.h = Math.max(10, s.h + dy);
                        if (handle.indexOf('n') >= 0) { ns.h = Math.max(10, s.h - dy); ns.y = s.y + (s.h - ns.h); }
                        ns.x = Math.max(0, Math.min(imgObj.width - ns.w, ns.x));
                        ns.y = Math.max(0, Math.min(imgObj.height - ns.h, ns.y));
                    } else if (s.type === 'circle') {
                        var dr = 0;
                        if (handle === 'e' || handle === 'se' || handle === 'ne') dr = dx;
                        else if (handle === 'w' || handle === 'sw' || handle === 'nw') dr = -dx;
                        else if (handle === 's') dr = dy;
                        else if (handle === 'n') dr = -dy;
                        ns.r = Math.max(5, s.r + dr);
                        var maxR = Math.min(ns.cx, imgObj.width - ns.cx, ns.cy, imgObj.height - ns.cy);
                        ns.r = Math.min(ns.r, maxR);
                    } else if (s.type === 'ellipse') {
                        if (handle === 'e') ns.rx = Math.max(5, s.rx + dx);
                        if (handle === 'w') ns.rx = Math.max(5, s.rx - dx);
                        if (handle === 's') ns.ry = Math.max(5, s.ry + dy);
                        if (handle === 'n') ns.ry = Math.max(5, s.ry - dy);
                        var maxRx = Math.min(ns.cx, imgObj.width - ns.cx);
                        var maxRy = Math.min(ns.cy, imgObj.height - ns.cy);
                        ns.rx = Math.min(ns.rx, maxRx);
                        ns.ry = Math.min(ns.ry, maxRy);
                    }
                    App.state[selKey] = ns;
                    if (renderFn) renderFn();
                });
                window.addEventListener('mouseup', function(){
                    if (rDragging) {
                        rDragging = false;
                        var Fn = App.Filters;
                        if (Fn && Fn[updateFnName]) Fn[updateFnName]();
                    }
                });
            });
        }
    }

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

    App.FilterSelection = {
        capital: capital,
        renderSizeInputs: renderSizeInputs,
        createSelection: createSelection,
        clearPolygon: clearPolygon,
        renderGenericSelBox: renderGenericSelBox,
        bindGenericSelEvents: bindGenericSelEvents,
        buildMaskFromSelection: buildMaskFromSelection
    };
})();
