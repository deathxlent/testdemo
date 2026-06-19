var App = (function () {
    var state = {
        images: [],
        activeImageId: null,
        selectedObjId: null,
        activeTool: 'select',
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
        rotateStartAngle: 0
    };

    var els = {};

    function initEls() {
        els = {
            uploadBtn: document.getElementById('uploadBtn'),
            exportBtn: document.getElementById('exportBtn'),
            selectTool: document.getElementById('selectTool'),
            textTool: document.getElementById('textTool'),
            watermarkTool: document.getElementById('watermarkTool'),
            textPropsSection: document.getElementById('textPropsSection'),
            watermarkPropsSection: document.getElementById('watermarkPropsSection'),
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
            tabBar: document.getElementById('tabBar'),
            canvasContainer: document.getElementById('canvasContainer'),
            canvasScrollContent: document.getElementById('canvasScrollContent'),
            uploadHint: document.getElementById('uploadHint'),
            canvasWrapper: document.getElementById('canvasWrapper'),
            mainCanvas: document.getElementById('mainCanvas'),
            objectLayer: document.getElementById('objectLayer'),
            selectionRect: document.getElementById('selectionRect'),
            zoomBar: document.getElementById('zoomBar'),
            zoomSlider: document.getElementById('zoomSlider'),
            zoomOutBtn: document.getElementById('zoomOutBtn'),
            zoomInBtn: document.getElementById('zoomInBtn'),
            zoomFitBtn: document.getElementById('zoomFitBtn'),
            zoomDisplay: document.getElementById('zoomDisplay'),
            objectList: document.getElementById('objectList'),
            fileInput: document.getElementById('fileInput'),
            watermarkInput: document.getElementById('watermarkInput')
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
        var imgObj = getActiveImage();
        if (!imgObj) return;
        var canvas = els.mainCanvas;
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        canvas.style.width = toDisplay(imgObj.width) + 'px';
        canvas.style.height = toDisplay(imgObj.height) + 'px';

        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, imgObj.width, imgObj.height);
        ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);

        els.canvasWrapper.style.width = toDisplay(imgObj.width) + 'px';
        els.canvasWrapper.style.height = toDisplay(imgObj.height) + 'px';
    }

    function showUploadHint() {
        els.uploadHint.style.display = 'flex';
        els.canvasWrapper.style.display = 'none';
        els.zoomBar.style.display = 'none';
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
        trigger: trigger
    };
})();
