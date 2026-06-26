(function () {
    function addImage(fileOrObj) {
        if (fileOrObj instanceof File || fileOrObj instanceof Blob) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var img = new Image();
                img.onload = function () {
                    var pencilCanvas = document.createElement('canvas');
                    pencilCanvas.width = img.naturalWidth;
                    pencilCanvas.height = img.naturalHeight;
                    var imageObj = {
                        id: 'img_' + App.state.nextImageId++,
                        name: fileOrObj.name,
                        img: img,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        objects: [],
                        _lastZoom: 100,
                        _origW: img.naturalWidth,
                        _origH: img.naturalHeight,
                        _prevW: img.naturalWidth,
                        _prevH: img.naturalHeight,
                        pencilCanvas: pencilCanvas
                    };
                    App.state.images.push(imageObj);
                    switchImage(imageObj.id);
                    fitToView();
                    setTimeout(function () {
                        if (App.History) App.History.initForImage(imageObj);
                    }, 10);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(fileOrObj);
        } else if (fileOrObj && fileOrObj.img && fileOrObj.width && fileOrObj.height) {
            App.state.images.push(fileOrObj);
            switchImage(fileOrObj.id);
            fitToView();
            setTimeout(function () {
                if (App.History) App.History.initForImage(fileOrObj);
            }, 10);
        }
    }

    function renderTabs() {
        var els = App.els();
        var html = '';
        App.state.images.forEach(function (img) {
            var cls = img.id === App.state.activeImageId ? 'tab-item active' : 'tab-item';
            html += '<div class="' + cls + '" data-id="' + img.id + '">';
            html += '<span class="tab-name">' + App.escapeHtml(img.name) + '</span>';
            html += '<span class="tab-close" data-close="' + img.id + '">\u00d7</span>';
            html += '</div>';
        });
        els.tabBar.innerHTML = html;

        els.tabBar.querySelectorAll('.tab-item').forEach(function (tab) {
            tab.addEventListener('click', function (e) {
                if (e.target.classList.contains('tab-close')) return;
                switchImage(tab.dataset.id);
            });
        });
        els.tabBar.querySelectorAll('.tab-close').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                closeImage(btn.dataset.close);
            });
        });
    }

    function switchImage(id) {
        if (App.Puzzle && App.Puzzle.isActive) {
            App.Puzzle.saveStateToImage();
        }
        App.state.activeImageId = id;
        App.state.selectedObjId = null;
        App.state.isEditing = false;
        App.state.zoom = 100;
        var img = App.getActiveImage();
        if (img) {
            App.state.zoom = img._lastZoom || 100;
        }
        renderTabs();
        App.renderCanvas();
        App.showCanvasArea();
        App.updateZoomUI();
        if (App.Selection) {
            App.Selection.clearSelection();
        }
        if (App.Puzzle && App.Puzzle.isActive) {
            App.Puzzle.loadStateFromImage(img);
            App.Puzzle.renderPuzzleGrid();
        }
        App.trigger('image:switched');
    }

    function closeImage(id) {
        var idx = App.state.images.findIndex(function (img) { return img.id === id; });
        if (idx === -1) return;
        App.state.images.splice(idx, 1);
        if (App.state.activeImageId === id) {
            if (App.state.images.length > 0) {
                var newIdx = Math.min(idx, App.state.images.length - 1);
                switchImage(App.state.images[newIdx].id);
            } else {
                App.state.activeImageId = null;
                App.state.selectedObjId = null;
                renderTabs();
                App.showUploadHint();
                App.trigger('image:closed');
            }
        } else {
            renderTabs();
        }
    }

    function fitToView() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        var els = App.els();
        var container = els.canvasContainer;
        var cw = container.clientWidth - 80;
        var ch = container.clientHeight - 80;
        var scaleW = cw / imgObj.width * 100;
        var scaleH = ch / imgObj.height * 100;
        var z = Math.min(scaleW, scaleH, 100);
        z = Math.max(5, Math.round(z));
        setZoom(z);
    }

    function setZoom(val) {
        val = App.clamp(Math.round(val), 5, 500);
        App.state.zoom = val;
        var imgObj = App.getActiveImage();
        if (imgObj) imgObj._lastZoom = val;
        if (App.state.isEditing) {
            App.state.isEditing = false;
            var editingEl = document.querySelector('.text-box.editing');
            if (editingEl) {
                editingEl.classList.remove('editing');
                var content = editingEl.querySelector('.text-content');
                if (content) content.contentEditable = 'false';
            }
        }
        App.renderCanvas();
        App.updateZoomUI();
        App.trigger('zoom:changed');
    }

    function resizePencilCanvas(imgObj, oldW, oldH, newW, newH, cropX, cropY) {
        if (!imgObj) return;
        cropX = cropX || 0;
        cropY = cropY || 0;
        var src = imgObj.pencilCanvas;
        var dst = document.createElement('canvas');
        dst.width = newW;
        dst.height = newH;
        var ctx = dst.getContext('2d');
        if (src) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            try {
                ctx.drawImage(src, cropX, cropY, oldW, oldH, 0, 0, newW, newH);
            } catch (e) {}
        }
        imgObj.pencilCanvas = dst;
    }

    function resizeCanvas() {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        App.renderCanvas();
        App.updateZoomUI();
        App.trigger('zoom:changed');
    }

    App.Images = {
        addImage: addImage,
        renderTabs: renderTabs,
        switchImage: switchImage,
        closeImage: closeImage,
        fitToView: fitToView,
        setZoom: setZoom,
        resizePencilCanvas: resizePencilCanvas,
        resizeCanvas: resizeCanvas,
        get tabs() {
            return App.state.images.map(function (img) {
                return { id: img.id, image: img };
            });
        }
    };
})();
