(function () {
    'use strict';

    var MAX_STEPS = 8;

    var History = {
        perImage: {},
        currentPointer: {},

        snapshotImage: function (imgObj) {
            if (!imgObj) return null;
            var canvas = document.createElement('canvas');
            canvas.width = imgObj.width;
            canvas.height = imgObj.height;
            var ctx = canvas.getContext('2d');
            if (imgObj.img && imgObj.img.naturalWidth) {
                ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);
            }
            var pencilCanvas = document.createElement('canvas');
            pencilCanvas.width = imgObj.width;
            pencilCanvas.height = imgObj.height;
            var pctx = pencilCanvas.getContext('2d');
            if (imgObj.pencilCanvas) {
                pctx.drawImage(imgObj.pencilCanvas, 0, 0);
            }
            var snapshot = {
                width: imgObj.width,
                height: imgObj.height,
                _origW: imgObj._origW,
                _origH: imgObj._origH,
                _prevW: imgObj._prevW,
                _prevH: imgObj._prevH,
                mirrorH: !!imgObj.mirrorH,
                mirrorV: !!imgObj.mirrorV,
                rotateAngle: imgObj.rotateAngle || 0,
                imgDataURL: canvas.toDataURL('image/png'),
                pencilDataURL: pencilCanvas.toDataURL('image/png'),
                objects: JSON.stringify(imgObj.objects.map(function (o) {
                    var c = Object.assign({}, o);
                    if (c.type === 'watermark' && o._imgDataURL) c._imgDataURL = o._imgDataURL;
                    return c;
                }))
            };
            try {
                canvas.width = 0; pencilCanvas.width = 0;
            } catch (e) {}
            return snapshot;
        },

        restoreSnapshot: function (imgObj, snap, done) {
            var need = 0;
            var ready = 0;
            var finish = function () {
                ready++;
                if (ready === need && done) done();
            };
            imgObj.width = snap.width;
            imgObj.height = snap.height;
            imgObj._origW = snap._origW;
            imgObj._origH = snap._origH;
            imgObj._prevW = snap._prevW;
            imgObj._prevH = snap._prevH;
            imgObj.mirrorH = snap.mirrorH;
            imgObj.mirrorV = snap.mirrorV;
            imgObj.rotateAngle = snap.rotateAngle || 0;

            need++;
            var im1 = new Image();
            im1.onload = function () { imgObj.img = im1; finish(); };
            im1.src = snap.imgDataURL;

            need++;
            var im2 = new Image();
            im2.onload = function () {
                var pc = document.createElement('canvas');
                pc.width = snap.width;
                pc.height = snap.height;
                pc.getContext('2d').drawImage(im2, 0, 0);
                imgObj.pencilCanvas = pc;
                finish();
            };
            im2.src = snap.pencilDataURL;

            imgObj.objects = [];
            var arr = JSON.parse(snap.objects);
            for (var i = 0; i < arr.length; i++) {
                (function (src) {
                    var obj = Object.assign({}, src);
                    if (obj.type === 'watermark' && src._imgDataURL) {
                        need++;
                        var wm = new Image();
                        wm.onload = function () { obj.wmImg = wm; imgObj.objects.push(obj); finish(); };
                        wm.src = src._imgDataURL;
                    } else {
                        imgObj.objects.push(obj);
                    }
                })(arr[i]);
            }
            if (need === 0) {
                need = 1;
                finish();
            }
        },

        push: function (desc) {
            var imgObj = App.getActiveImage();
            if (!imgObj) return;
            var id = imgObj.id;
            if (!this.perImage[id]) {
                this.perImage[id] = [];
                this.currentPointer[id] = -1;
            }
            var list = this.perImage[id];
            if (this.currentPointer[id] < list.length - 1) {
                list.splice(this.currentPointer[id] + 1);
            }
            var snap = this.snapshotImage(imgObj);
            if (!snap) return;
            list.push({ desc: desc || App.i18n.t('history.operation'), snapshot: snap, time: Date.now() });
            while (list.length > MAX_STEPS) {
                list.shift();
            }
            this.currentPointer[id] = list.length - 1;
            this.render();
        },

        undo: function () {
            var imgObj = App.getActiveImage();
            if (!imgObj) return;
            var id = imgObj.id;
            var list = this.perImage[id];
            if (!list || this.currentPointer[id] <= 0) return;
            this.currentPointer[id]--;
            this._apply(id);
        },

        undoTo: function (index) {
            var imgObj = App.getActiveImage();
            if (!imgObj) return;
            var id = imgObj.id;
            var list = this.perImage[id];
            if (!list) return;
            if (index < 0) index = 0;
            if (index >= list.length) index = list.length - 1;
            if (index === this.currentPointer[id]) return;
            this.currentPointer[id] = index;
            this._apply(id);
        },

        _apply: function (id) {
            var list = this.perImage[id];
            var p = this.currentPointer[id];
            if (!list || p < 0 || p >= list.length) return;
            var snap = list[p].snapshot;
            var tab = App.Images.tabs.find(function (t) { return t.id === id; });
            if (!tab) return;
            this.restoreSnapshot(tab.image, snap, function () {
                App.Images.resizeCanvas();
                App.renderCanvas();
                App.Objects.refreshList();
            });
            this.render();
        },

        clear: function (id) {
            if (id) {
                delete this.perImage[id];
                delete this.currentPointer[id];
            } else {
                this.perImage = {};
                this.currentPointer = {};
            }
            this.render();
        },

        clearAll: function () { this.clear(null); },

        initForImage: function (imgObj) {
            if (!imgObj) return;
            var id = imgObj.id;
            this.perImage[id] = [];
            this.currentPointer[id] = -1;
            var self = this;
            setTimeout(function () {
                var snap = self.snapshotImage(imgObj);
                if (snap) {
                    self.perImage[id].push({ desc: App.i18n.t('history.open_image'), snapshot: snap, time: Date.now() });
                    self.currentPointer[id] = 0;
                    self.render();
                }
            }, 50);
        },

        render: function () {
            var imgObj = App.getActiveImage();
            var listEl = document.getElementById('historyList');
            if (!listEl) return;
            var historyTitleBar = listEl.previousElementSibling;
            if (!imgObj) {
                listEl.innerHTML = '<div class="object-empty">' + App.i18n.t('history.no_records') + '</div>';
                return;
            }
            var id = imgObj.id;
            var list = this.perImage[id] || [];
            var ptr = this.currentPointer[id];
            if (list.length === 0) {
                listEl.innerHTML = '<div class="object-empty">' + App.i18n.t('history.no_records') + '</div>';
                return;
            }
            listEl.innerHTML = '';
            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                var div = document.createElement('div');
                div.className = 'history-item';
                if (i < ptr) div.classList.add('active');
                else if (i > ptr) div.classList.add('future');
                else div.classList.add('active');
                if (i === ptr) {
                    div.classList.remove('future');
                    div.classList.add('active');
                }
                var idx = document.createElement('div');
                idx.className = 'hi-index';
                idx.textContent = (i + 1);
                div.appendChild(idx);
                var txt = document.createElement('div');
                txt.className = 'hi-text';
                txt.textContent = item.desc;
                txt.title = item.desc;
                div.appendChild(txt);
                if (i > 0) {
                    var btn = document.createElement('button');
                    btn.className = 'hi-undo';
                    btn.title = App.i18n.t('js.undo_to_step');
                    btn.innerHTML = '↺';
                    btn.addEventListener('click', (function (idx2) {
                        return function (e) {
                            e.stopPropagation();
                            History.undoTo(idx2);
                        };
                    })(i - 1));
                    div.appendChild(btn);
                }
                div.addEventListener('click', (function (idx2) {
                    return function () { History.undoTo(idx2); };
                })(i));
                listEl.appendChild(div);
            }
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        var clearBtn = document.getElementById('historyClearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                var img = App.getActiveImage();
                if (img) History.clear(img.id);
            });
        }
        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                History.undo();
            }
        });
    });

    App.History = History;
})();
