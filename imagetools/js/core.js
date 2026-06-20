var App = (function () {
    var state = {
        images: [],
        activeImageId: null,
        selectedObjId: null,
        activeTool: 'select',
        activeImgTool: null,
        zoom: 100,
        nextImageId: 1,
        nextTextId: 1,
        nextWatermarkId: 1,
        isEditing: false,
        isDrawing: false,
        drawStartX: 0,
        drawStartY: 0,
        isDragging: false,
        dragOffsetX: 0,
        dragOffsetY: 0,
        isResizing: false,
        resizeDir: '',
        resizeStartX: 0,
        resizeStartY: 0,
        resizeOrigX: 0,
        resizeOrigY: 0,
        resizeOrigW: 0,
        resizeOrigH: 0,
        isRotating: false,
        rotateOrigAngle: 0,
        rotateStartAngle: 0,
        rotateAngle: 0,
        rotateCenterX: null,
        rotateCenterY: null,
        isMovingRotateCenter: false,
        mirrorH: false,
        mirrorV: false,
        polygonPoints: [],
        isDrawingPolygon: false,
        activeCrop: null,
        activeRectCrop: null,
        activeMask: null,
        filterKind: null,
        activeFilterSel: null,
        filterPolygonPoints: [],
        activeLzSel: null,
        activeCurveSel: null,
        curvePolygonPoints: [],
        activeBalanceSel: null,
        balancePolygonPoints: [],
        pencilActive: false,
        pencilDrawing: false,
        pencilMode: 'free',
        pencilStartPoint: null,
        pencilLastPoint: null,
        pencilCurvePoints: [],
        pencilCurveAnchors: []
    };

    var els = {};

    function initEls() {
        els = {
            uploadBtn: document.getElementById('uploadBtn'),
            exportBtn: document.getElementById('exportBtn'),
            selectTool: document.getElementById('selectTool'),
            textTool: document.getElementById('textTool'),
            watermarkTool: document.getElementById('watermarkTool'),
            resizeTool: document.getElementById('resizeTool'),
            cropTool: document.getElementById('cropTool'),
            rectCropTool: document.getElementById('rectCropTool'),
            maskTool: document.getElementById('maskTool'),
            rotateTool: document.getElementById('rotateTool'),
            mirrorHBtn: document.getElementById('mirrorHBtn'),
            mirrorVBtn: document.getElementById('mirrorVBtn'),
            sharpenTool: document.getElementById('sharpenTool'),
            blurTool: document.getElementById('blurTool'),
            mosaicTool: document.getElementById('mosaicTool'),
            negativeTool: document.getElementById('negativeTool'),
            hslTool: document.getElementById('hslTool'),
            localZoomTool: document.getElementById('localZoomTool'),
            pencilTool: document.getElementById('pencilTool'),
            textPropsSection: document.getElementById('textPropsSection'),
            watermarkPropsSection: document.getElementById('watermarkPropsSection'),
            resizePropsSection: document.getElementById('resizePropsSection'),
            cropPropsSection: document.getElementById('cropPropsSection'),
            rectCropPropsSection: document.getElementById('rectCropPropsSection'),
            maskPropsSection: document.getElementById('maskPropsSection'),
            rotatePropsSection: document.getElementById('rotatePropsSection'),
            filterPropsSection: document.getElementById('filterPropsSection'),
            filterTitle: document.getElementById('filterTitle'),
            filterSelType: document.getElementById('filterSelType'),
            filterSizeContent: document.getElementById('filterSizeContent'),
            createFilterSel: document.getElementById('createFilterSel'),
            clearFilterSel: document.getElementById('clearFilterSel'),
            filterStrengthGroup: document.getElementById('filterStrengthGroup'),
            filterStrengthDisp: document.getElementById('filterStrengthDisp'),
            filterStrength: document.getElementById('filterStrength'),
            filterMosaicGroup: document.getElementById('filterMosaicGroup'),
            mosaicSizeDisp: document.getElementById('mosaicSizeDisp'),
            mosaicSize: document.getElementById('mosaicSize'),
            applyFilter: document.getElementById('applyFilter'),
            hslPropsSection: document.getElementById('hslPropsSection'),
            hslSelType: document.getElementById('hslSelType'),
            hslSelSizeContent: document.getElementById('hslSelSizeContent'),
            hslSelSizeSub: document.getElementById('hslSelSizeSub'),
            createHslSel: document.getElementById('createHslSel'),
            clearHslSel: document.getElementById('clearHslSel'),
            hueAdjust: document.getElementById('hueAdjust'),
            hueDisp: document.getElementById('hueDisp'),
            satAdjust: document.getElementById('satAdjust'),
            satDisp: document.getElementById('satDisp'),
            lumAdjust: document.getElementById('lumAdjust'),
            lumDisp: document.getElementById('lumDisp'),
            resetHsl: document.getElementById('resetHsl'),
            applyHsl: document.getElementById('applyHsl'),
            curveTool: document.getElementById('curveTool'),
            curvePropsSection: document.getElementById('curvePropsSection'),
            curveSelType: document.getElementById('curveSelType'),
            curveSelSizeContent: document.getElementById('curveSelSizeContent'),
            curveSelSizeSub: document.getElementById('curveSelSizeSub'),
            createCurveSel: document.getElementById('createCurveSel'),
            clearCurveSel: document.getElementById('clearCurveSel'),
            curveChannel: document.getElementById('curveChannel'),
            curveEditor: document.getElementById('curveEditor'),
            curvePreset: document.getElementById('curvePreset'),
            resetCurve: document.getElementById('resetCurve'),
            resetAllCurves: document.getElementById('resetAllCurves'),
            applyCurve: document.getElementById('applyCurve'),
            balanceTool: document.getElementById('balanceTool'),
            balancePropsSection: document.getElementById('balancePropsSection'),
            balanceSelType: document.getElementById('balanceSelType'),
            balanceSelSizeContent: document.getElementById('balanceSelSizeContent'),
            balanceSelSizeSub: document.getElementById('balanceSelSizeSub'),
            createBalanceSel: document.getElementById('createBalanceSel'),
            clearBalanceSel: document.getElementById('clearBalanceSel'),
            shRCyan: document.getElementById('shRCyan'), shRCyanDisp: document.getElementById('shRCyanDisp'),
            shGMagenta: document.getElementById('shGMagenta'), shGMagentaDisp: document.getElementById('shGMagentaDisp'),
            shBYellow: document.getElementById('shBYellow'), shBYellowDisp: document.getElementById('shBYellowDisp'),
            miRCyan: document.getElementById('miRCyan'), miRCyanDisp: document.getElementById('miRCyanDisp'),
            miGMagenta: document.getElementById('miGMagenta'), miGMagentaDisp: document.getElementById('miGMagentaDisp'),
            miBYellow: document.getElementById('miBYellow'), miBYellowDisp: document.getElementById('miBYellowDisp'),
            hiRCyan: document.getElementById('hiRCyan'), hiRCyanDisp: document.getElementById('hiRCyanDisp'),
            hiGMagenta: document.getElementById('hiGMagenta'), hiGMagentaDisp: document.getElementById('hiGMagentaDisp'),
            hiBYellow: document.getElementById('hiBYellow'), hiBYellowDisp: document.getElementById('hiBYellowDisp'),
            balanceLuminosity: document.getElementById('balanceLuminosity'),
            resetBalance: document.getElementById('resetBalance'),
            applyBalance: document.getElementById('applyBalance'),
            liveHistogram: document.getElementById('liveHistogram'),
            lhLum: document.getElementById('lhLum'),
            lhR: document.getElementById('lhR'),
            lhG: document.getElementById('lhG'),
            lhB: document.getElementById('lhB'),
            lhOverlay: document.getElementById('lhOverlay'),
            localZoomPropsSection: document.getElementById('localZoomPropsSection'),
            lzShape: document.getElementById('lzShape'),
            createLzSel: document.getElementById('createLzSel'),
            lzBorderColor: document.getElementById('lzBorderColor'),
            lzBorderWidth: document.getElementById('lzBorderWidth'),
            lzBorderStyle: document.getElementById('lzBorderStyle'),
            lzZoom: document.getElementById('lzZoom'),
            lzZoomDisp: document.getElementById('lzZoomDisp'),
            pencilPropsSection: document.getElementById('pencilPropsSection'),
            pencilColor: document.getElementById('pencilColor'),
            pencilColorText: document.getElementById('pencilColorText'),
            pencilWidth: document.getElementById('pencilWidth'),
            pencilOpacity: document.getElementById('pencilOpacity'),
            pencilOpacityDisp: document.getElementById('pencilOpacityDisp'),
            pencilCap: document.getElementById('pencilCap'),
            clearPencilLayer: document.getElementById('clearPencilLayer'),
            uploadWatermarkBtn: document.getElementById('uploadWatermarkBtn'),
            fontFamily: document.getElementById('fontFamily'),
            fontSize: document.getElementById('fontSize'),
            boldBtn: document.getElementById('boldBtn'),
            italicBtn: document.getElementById('italicBtn'),
            underlineBtn: document.getElementById('underlineBtn'),
            strikethroughBtn: document.getElementById('strikethroughBtn'),
            fontColor: document.getElementById('fontColor'),
            fontColorText: document.getElementById('fontColorText'),
            shadowEnabled: document.getElementById('shadowEnabled'),
            shadowOffsetX: document.getElementById('shadowOffsetX'),
            shadowOffsetY: document.getElementById('shadowOffsetY'),
            shadowBlur: document.getElementById('shadowBlur'),
            shadowColor: document.getElementById('shadowColor'),
            strokeEnabled: document.getElementById('strokeEnabled'),
            strokeWidth: document.getElementById('strokeWidth'),
            strokeColor: document.getElementById('strokeColor'),
            wmSize: document.getElementById('wmSize'),
            wmRotate: document.getElementById('wmRotate'),
            wmOpacity: document.getElementById('wmOpacity'),
            wmRotDisp: document.getElementById('wmRotDisp'),
            wmOpDisp: document.getElementById('wmOpDisp'),
            wmLayerUp: document.getElementById('wmLayerUp'),
            wmLayerDown: document.getElementById('wmLayerDown'),
            wmLayerTop: document.getElementById('wmLayerTop'),
            wmLayerBottom: document.getElementById('wmLayerBottom'),
            resizeWidth: document.getElementById('resizeWidth'),
            resizeHeight: document.getElementById('resizeHeight'),
            resizeLock: document.getElementById('resizeLock'),
            applyResize: document.getElementById('applyResize'),
            cropX: document.getElementById('cropX'),
            cropY: document.getElementById('cropY'),
            cropW: document.getElementById('cropW'),
            cropH: document.getElementById('cropH'),
            resetCropBtn: document.getElementById('resetCropBtn'),
            applyCrop: document.getElementById('applyCrop'),
            rectCropW: document.getElementById('rectCropW'),
            rectCropH: document.getElementById('rectCropH'),
            rectCropLock: document.getElementById('rectCropLock'),
            createRectCrop: document.getElementById('createRectCrop'),
            maskType: document.getElementById('maskType'),
            maskSizeInfo: document.getElementById('maskSizeInfo'),
            maskSizeContent: document.getElementById('maskSizeContent'),
            createMaskBtn: document.getElementById('createMaskBtn'),
            clearMaskPoints: document.getElementById('clearMaskPoints'),
            rotateAngle: document.getElementById('rotateAngle'),
            rotateAngleDisp: document.getElementById('rotateAngleDisp'),
            rotateCX: document.getElementById('rotateCX'),
            rotateCY: document.getElementById('rotateCY'),
            rotateLeft90: document.getElementById('rotateLeft90'),
            rotateRight90: document.getElementById('rotateRight90'),
            rotateReset: document.getElementById('rotateReset'),
            applyRotate: document.getElementById('applyRotate'),
            historyPanel: document.getElementById('historyPanel'),
            historyList: document.getElementById('historyList'),
            historyClearBtn: document.getElementById('historyClearBtn'),
            tabBar: document.getElementById('tabBar'),
            canvasContainer: document.getElementById('canvasContainer'),
            canvasScrollContent: document.getElementById('canvasScrollContent'),
            uploadHint: document.getElementById('uploadHint'),
            canvasWrapper: document.getElementById('canvasWrapper'),
            mainCanvas: document.getElementById('mainCanvas'),
            objectLayer: document.getElementById('objectLayer'),
            selectionRect: document.getElementById('selectionRect'),
            imgOperationLayer: document.getElementById('imgOperationLayer'),
            rotateCenterHandle: document.getElementById('rotateCenterHandle'),
            zoomBar: document.getElementById('zoomBar'),
            zoomSlider: document.getElementById('zoomSlider'),
            zoomOutBtn: document.getElementById('zoomOutBtn'),
            zoomInBtn: document.getElementById('zoomInBtn'),
            zoomFitBtn: document.getElementById('zoomFitBtn'),
            zoomDisplay: document.getElementById('zoomDisplay'),
            objectList: document.getElementById('objectList'),
            fileInput: document.getElementById('fileInput'),
            watermarkInput: document.getElementById('watermarkInput'),
            infoBtn: document.getElementById('infoBtn'),
            infoModal: document.getElementById('infoModal'),
            histogramBtn: document.getElementById('histogramBtn'),
            histogramModal: document.getElementById('histogramModal')
        };
    }

    function toDisplay(v) { return v * state.zoom / 100; }
    function toImage(v) { return v * 100 / state.zoom; }
    function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function buildFontStr(obj, forDisplay) {
        var size = forDisplay ? toDisplay(obj.fontSize) : obj.fontSize;
        var parts = [];
        if (obj.italic) parts.push('italic');
        if (obj.bold) parts.push('bold');
        parts.push(size + 'px');
        parts.push('"' + obj.fontFamily + '"');
        return parts.join(' ');
    }

    function getActiveImage() {
        return state.images.find(function (img) { return img.id === state.activeImageId; });
    }

    function getActiveObj() {
        var img = getActiveImage();
        if (!img || !state.selectedObjId) return null;
        return img.objects.find(function (o) { return o.id === state.selectedObjId; });
    }

    function getActiveObjIndex() {
        var img = getActiveImage();
        if (!img || !state.selectedObjId) return -1;
        return img.objects.findIndex(function (o) { return o.id === state.selectedObjId; });
    }

    function renderCanvas() {
        var imgObj = getActiveImage(); if (!imgObj) { return; }
        var src = imgObj.img;
        if (imgObj._balancePreview) src = imgObj._balancePreview;
        else if (imgObj._curvePreview) src = imgObj._curvePreview;
        else if (imgObj._hslPreview) src = imgObj._hslPreview;
        var canvas = els.mainCanvas;
        canvas.width = imgObj.width; canvas.height = imgObj.height;
        canvas.style.width = toDisplay(imgObj.width) + 'px';
        canvas.style.height = toDisplay(imgObj.height) + 'px';
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, imgObj.width, imgObj.height);
        ctx.drawImage(src, 0, 0, imgObj.width, imgObj.height);
        if (imgObj.pencilCanvas) ctx.drawImage(imgObj.pencilCanvas, 0, 0);
        els.canvasWrapper.style.width = toDisplay(imgObj.width) + 'px';
        els.canvasWrapper.style.height = toDisplay(imgObj.height) + 'px';
    }

    function clearOperationLayer() {
        if (els.imgOperationLayer) {
            els.imgOperationLayer.innerHTML = '';
            els.imgOperationLayer.classList.remove('active');
        }
    }

    function showUploadHint() {
        els.uploadHint.style.display = 'flex';
        els.canvasWrapper.style.display = 'none';
        els.zoomBar.style.display = 'none';
        clearOperationLayer();
        if (els.rotateCenterHandle) els.rotateCenterHandle.style.display = 'none';
    }

    function showCanvasArea() {
        els.uploadHint.style.display = 'none';
        els.canvasWrapper.style.display = 'inline-block';
        els.zoomBar.style.display = 'flex';
    }

    function updateZoomUI() {
        els.zoomSlider.value = state.zoom;
        els.zoomDisplay.textContent = state.zoom + '%';
    }

    function trigger(name, data) {
        var ev = new CustomEvent(name, { detail: data || {} });
        document.dispatchEvent(ev);
    }

    function setActiveImgTool(tool) {
        deactivateAllImgTools();
        state.activeImgTool = tool;
    }

    function deactivateAllImgTools() {
        if (state.activeImgTool === 'resize' && App.ImageResize) App.ImageResize.deactivate();
        else if ((state.activeImgTool === 'crop' || state.activeImgTool === 'rectcrop') && App.ImageCrop) App.ImageCrop.deactivate();
        else if (state.activeImgTool === 'mask' && App.ImageMask) App.ImageMask.deactivate();
        else if (state.activeImgTool === 'rotate' && App.ImageTransform) App.ImageTransform.deactivateRotate();
        else if ((state.activeImgTool === 'filter') && App.Filters) App.Filters.deactivate();
        else if (state.activeImgTool === 'hsl' && App.Filters) App.Filters.deactivateHsl();
        else if (state.activeImgTool === 'curve' && App.Filters) App.Filters.deactivateCurve();
        else if (state.activeImgTool === 'balance' && App.Filters) App.Filters.deactivateBalance();
        else if (state.activeImgTool === 'localzoom' && App.LocalZoom) App.LocalZoom.deactivate();
        else if (state.activeImgTool === 'pencil' && App.Pencil) App.Pencil.deactivate();
        state.activeImgTool = null;
        if (els.rotateCenterHandle) els.rotateCenterHandle.style.display = 'none';
        trigger('tool:deactivated');
    }

    var _toastTimer = null;
    function showToast(msg, duration) {
        var old = document.getElementById('__app_toast');
        if (old) old.parentNode.removeChild(old);
        var t = document.createElement('div');
        t.id = '__app_toast';
        t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:10px 20px;border-radius:6px;font-size:13px;z-index:99999;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,0.4);';
        t.textContent = msg;
        document.body.appendChild(t);
        if (_toastTimer) clearTimeout(_toastTimer);
        _toastTimer = setTimeout(function () {
            if (t.parentNode) t.parentNode.removeChild(t);
        }, duration || 2000);
    }

    function renderAll() {
        renderCanvas();
        if (App.Text) App.Text.renderAllObjects();
        if (App.Objects) App.Objects.renderObjectList();
    }

    return {
        state: state,
        els: function () { return els; },
        initEls: initEls,
        toDisplay: toDisplay,
        toImage: toImage,
        clamp: clamp,
        escapeHtml: escapeHtml,
        buildFontStr: buildFontStr,
        getActiveImage: getActiveImage,
        getActiveObj: getActiveObj,
        getActiveObjIndex: getActiveObjIndex,
        renderCanvas: renderCanvas,
        showUploadHint: showUploadHint,
        showCanvasArea: showCanvasArea,
        updateZoomUI: updateZoomUI,
        clearOperationLayer: clearOperationLayer,
        trigger: trigger,
        setActiveImgTool: setActiveImgTool,
        deactivateAllImgTools: deactivateAllImgTools,
        showToast: showToast,
        renderAll: renderAll
    };
})();
