(function () {
    'use strict';

    var Puzzle = {
        isActive: false,
        currentTemplate: null,
        cells: [],
        cellImages: {},
        canvasWidth: 1920,
        canvasHeight: 1080,
        canvasSizeSet: false,
        gap: 5,
        gapColor: '#ffffff',
        borderRadius: 0,
        shadowEnabled: false,
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowBlur: 10,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        cellRatio: 1,
        bgImage: null,
        backupImage: null,
        editingCellIndex: null,
        editingImage: null,
        editingRotation: 0,
        editingFlipH: false,
        editingFlipV: false,
        editingImgDisplayWidth: 0,
        editingImgDisplayHeight: 0,
        editingImgOriginalWidth: 0,
        editingImgOriginalHeight: 0,

        templates: [
            { id: 't2', name: 'puzzle.template_2h', cols: 2, rows: 1 },
            { id: 't3', name: 'puzzle.template_2v', cols: 1, rows: 2 },
            { id: 't4', name: 'puzzle.template_3h', cols: 3, rows: 1 },
            { id: 't5', name: 'puzzle.template_3v', cols: 1, rows: 3 },
            { id: 't6', name: 'puzzle.template_grid', cols: 2, rows: 2 },
            { id: 't12', name: 'puzzle.template_4h', cols: 4, rows: 1 },
            { id: 't13', name: 'puzzle.template_4v', cols: 1, rows: 4 },
            { id: 't14', name: 'puzzle.template_9grid', cols: 3, rows: 3 },
            { id: 'circle', name: 'puzzle.shape_circle', shape: 'circle', cols: 1, rows: 1 }
        ],
        
        customShapes: [
            { id: 'rect', name: 'puzzle.shape_square' },
            { id: 'circle', name: 'puzzle.shape_circle' },
            { id: 'ellipse', name: 'puzzle.shape_ellipse' },
            { id: 'star', name: 'puzzle.shape_star' },
            { id: 'triangle', name: 'puzzle.shape_triangle' }
        ],
        
        customCells: [],

        activate: function () {
            var imgObj = App.getActiveImage();
            if (imgObj) {
                this.backupImage = {
                    img: imgObj.img,
                    width: imgObj.width,
                    height: imgObj.height,
                    canvas: imgObj.canvas
                };
                if (!imgObj._puzzleState) {
                    imgObj._puzzleState = {
                        currentTemplate: null,
                        cells: [],
                        cellImages: {},
                        canvasSizeSet: false,
                        customCells: []
                    };
                }
                this.loadStateFromImage(imgObj);
            }

            this.isActive = true;
            App.setActiveImgTool('puzzle');
            this.showUI();
            this.initTemplates();
            App.showCanvasArea();
            return true;
        },

        loadStateFromImage: function (imgObj) {
            if (imgObj._puzzleState) {
                this.currentTemplate = imgObj._puzzleState.currentTemplate ? JSON.parse(JSON.stringify(imgObj._puzzleState.currentTemplate)) : null;
                this.cells = imgObj._puzzleState.cells ? JSON.parse(JSON.stringify(imgObj._puzzleState.cells)) : [];
                this.canvasSizeSet = imgObj._puzzleState.canvasSizeSet || false;
                this.cellImages = {};
                if (imgObj._puzzleState.cellImages) {
                    var saved = imgObj._puzzleState.cellImages;
                    for (var key in saved) {
                        var savedData = saved[key];
                        var cellImgData = {
                            dataUrl: savedData.dataUrl,
                            rotation: savedData.rotation || 0,
                            flipH: savedData.flipH || false,
                            flipV: savedData.flipV || false,
                            offsetX: savedData.offsetX || 0,
                            offsetY: savedData.offsetY || 0,
                            scale: savedData.scale || 1
                        };
                        if (savedData.dataUrl) {
                            var img = new Image();
                            img.src = savedData.dataUrl;
                            cellImgData.img = img;
                        }
                        this.cellImages[key] = cellImgData;
                    }
                }
                this.customCells = [];
                if (imgObj._puzzleState.customCells) {
                    var self = this;
                    imgObj._puzzleState.customCells.forEach(function(savedCell) {
                        var cell = {
                            id: savedCell.id,
                            shape: savedCell.shape,
                            x: savedCell.x,
                            y: savedCell.y,
                            width: savedCell.width,
                            height: savedCell.height,
                            rotation: savedCell.rotation || 0
                        };
                        if (savedCell.imageData && savedCell.imageData.dataUrl) {
                            var img = new Image();
                            img.src = savedCell.imageData.dataUrl;
                            cell.imageData = {
                                img: img,
                                dataUrl: savedCell.imageData.dataUrl,
                                width: savedCell.imageData.width,
                                height: savedCell.imageData.height,
                                rotation: savedCell.imageData.rotation || 0,
                                flipH: savedCell.imageData.flipH || false,
                                flipV: savedCell.imageData.flipV || false
                            };
                        }
                        self.customCells.push(cell);
                    });
                }
            } else {
                this.currentTemplate = null;
                this.cells = [];
                this.cellImages = {};
                this.canvasSizeSet = false;
                this.customCells = [];
            }
        },

        saveStateToImage: function () {
            var imgObj = App.getActiveImage();
            if (!imgObj) return;
            
            var savedCellImages = {};
            for (var key in this.cellImages) {
                savedCellImages[key] = {
                    dataUrl: this.cellImages[key].dataUrl,
                    rotation: this.cellImages[key].rotation || 0,
                    flipH: this.cellImages[key].flipH || false,
                    flipV: this.cellImages[key].flipV || false,
                    offsetX: this.cellImages[key].offsetX || 0,
                    offsetY: this.cellImages[key].offsetY || 0,
                    scale: this.cellImages[key].scale || 1
                };
            }
            
            var savedCustomCells = this.customCells.map(function(cell) {
                var saved = {
                    id: cell.id,
                    shape: cell.shape,
                    x: cell.x,
                    y: cell.y,
                    width: cell.width,
                    height: cell.height,
                    rotation: cell.rotation || 0
                };
                if (cell.imageData) {
                    saved.imageData = {
                        dataUrl: cell.imageData.dataUrl,
                        width: cell.imageData.width,
                        height: cell.imageData.height,
                        rotation: cell.imageData.rotation || 0,
                        flipH: cell.imageData.flipH || false,
                        flipV: cell.imageData.flipV || false
                    };
                }
                return saved;
            });
            
            imgObj._puzzleState = {
                currentTemplate: this.currentTemplate ? JSON.parse(JSON.stringify(this.currentTemplate)) : null,
                cells: JSON.parse(JSON.stringify(this.cells)),
                cellImages: savedCellImages,
                canvasSizeSet: this.canvasSizeSet,
                customCells: savedCustomCells
            };
        },

        deactivate: function () {
            this.saveStateToImage();
            this.reset();
            this.isActive = false;
            this.hideUI();
        },

        reset: function () {
            this.currentTemplate = null;
            this.cells = [];
            this.cellImages = {};
            this.canvasSizeSet = false;
            this.bgImage = null;
            this.customCells = [];
            this.editingCellIndex = null;
            this.editingCustomCell = null;
            this.editingImage = null;
            this.editingRotation = 0;
            this.editingFlipH = false;
            this.editingFlipV = false;
            this.editingImgDisplayWidth = 0;
            this.editingImgDisplayHeight = 0;
            this.editingImgOriginalWidth = 0;
            this.editingImgOriginalHeight = 0;
            var layer = App.els().puzzleLayer;
            if (layer) {
                layer.innerHTML = '';
            }
        },

        showUI: function () {
            if (App.els().puzzlePropsSection) {
                App.els().puzzlePropsSection.style.display = 'block';
            }
            if (App.els().puzzleLayer) {
                App.els().puzzleLayer.style.display = 'block';
            }
        },

        hideUI: function () {
            if (App.els().puzzlePropsSection) {
                App.els().puzzlePropsSection.style.display = 'none';
            }
            if (App.els().puzzleLayer) {
                App.els().puzzleLayer.style.display = 'none';
            }
            if (App.els().puzzleImageModal) {
                App.els().puzzleImageModal.style.display = 'none';
            }
        },

        initTemplates: function () {
            var container = App.els().puzzleTemplateList;
            if (!container) return;

            container.innerHTML = '';
            this.templates.forEach(function (tmpl) {
                var item = document.createElement('div');
                item.className = 'puzzle-template-item';
                item.dataset.id = tmpl.id;
                
                var preview = Puzzle.generateTemplatePreview(tmpl);
                item.innerHTML = preview;
                
                item.addEventListener('click', function () {
                    Puzzle.selectTemplate(tmpl);
                });
                container.appendChild(item);
            });
            
            var customItem = document.createElement('div');
            customItem.className = 'puzzle-template-item custom-toggle';
            customItem.innerHTML = '<div class="puzzle-template-preview" style="background: #2d2d2d; justify-content: center; align-items: center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m6-6H6"/></svg></div><div class="puzzle-template-name">' + App.i18n.t('puzzle.custom') + '</div>';
            customItem.addEventListener('click', function () {
                Puzzle.toggleCustomPanel();
            });
            container.appendChild(customItem);
        },

        toggleCustomPanel: function () {
            var panel = document.getElementById('puzzleCustomPanel');
            if (!panel) {
                panel = Puzzle.createCustomPanel();
            }
            
            if (!panel) {
                App.showToast(App.i18n.t('puzzle.cannot_create_custom'));
                return;
            }
            
            if (panel.style.display === 'block') {
                panel.style.display = 'none';
            } else {
                panel.style.display = 'block';
            }
        },

        createCustomPanel: function () {
            var container = App.els().puzzlePropsSection;
            if (!container) {
                console.error('puzzlePropsSection not found');
                return null;
            }

            var panel = document.createElement('div');
            panel.id = 'puzzleCustomPanel';
            panel.className = 'puzzle-custom-panel';
            panel.style.display = 'none';

            var html = `
                <div class="puzzle-custom-header">
                    <span class="puzzle-custom-title">` + App.i18n.t('puzzle.custom_template') + `</span>
                    <button class="puzzle-custom-close" onclick="Puzzle.toggleCustomPanel()">×</button>
                </div>
                <div class="puzzle-custom-body">
                    <div class="puzzle-custom-row">
                        <label class="puzzle-custom-label">` + App.i18n.t('puzzle.select_shape') + `</label>
                        <select id="puzzleShapeSelect" class="puzzle-custom-select">
            `;
            
            this.customShapes.forEach(function (shape) {
                html += `<option value="${shape.id}">` + App.i18n.t(shape.name) + `</option>`;
            });
            
            html += `
                        </select>
                    </div>
                    <div class="puzzle-custom-row">
                        <button id="puzzleAddCellBtn" class="puzzle-custom-btn">` + App.i18n.t('puzzle.add_template') + `</button>
                    </div>
                    <div class="puzzle-custom-row">
                        <button id="puzzleClearCustomBtn" class="puzzle-custom-btn secondary">` + App.i18n.t('puzzle.clear_all_custom') + `</button>
                    </div>
                </div>
            `;
            
            panel.innerHTML = html;
            container.appendChild(panel);

            document.getElementById('puzzleAddCellBtn').addEventListener('click', function () {
                var shapeSelect = document.getElementById('puzzleShapeSelect');
                var shapeId = shapeSelect.value;
                Puzzle.addCustomCell(shapeId);
            });

            document.getElementById('puzzleClearCustomBtn').addEventListener('click', function () {
                Puzzle.clearCustomCells();
            });
            
            return panel;
        },

        addCustomCell: function (shapeId) {
            var imgObj = App.getActiveImage();
            if (!imgObj) {
                App.showToast(App.i18n.t('dialog.open_image_first'));
                return;
            }

            if (!imgObj.canvas) {
                imgObj.canvas = document.createElement('canvas');
                imgObj.canvas.width = imgObj.width;
                imgObj.canvas.height = imgObj.height;
                var ctx = imgObj.canvas.getContext('2d');
                ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);
            }

            var scaleX = imgObj.canvas.width / this.canvasWidth;
            var scaleY = imgObj.canvas.height / this.canvasHeight;
            var scale = Math.min(scaleX, scaleY);

            var defaultSize = Math.min(this.canvasWidth, this.canvasHeight) * 0.2;
            var cell = {
                id: 'custom_' + Date.now(),
                shape: shapeId,
                x: (this.canvasWidth - defaultSize) / 2,
                y: (this.canvasHeight - defaultSize) / 2,
                width: defaultSize,
                height: defaultSize,
                rotation: 0
            };

            this.customCells.push(cell);
            this.renderCustomCells();
            App.showToast(App.i18n.t('puzzle.custom_added'));
        },

        clearCustomCells: function () {
            this.customCells = [];
            this.renderCustomCells();
            App.showToast(App.i18n.t('puzzle.custom_cleared'));
        },

        enterCustomCellEditMode: function (cellDiv, cell) {
            cellDiv.classList.add('puzzle-custom-cell-editing');
            
            var editToolbar = document.createElement('div');
            editToolbar.className = 'puzzle-custom-edit-toolbar';
            
            var confirmBtn = document.createElement('button');
            confirmBtn.className = 'puzzle-custom-edit-btn confirm';
            confirmBtn.innerHTML = '✓';
            confirmBtn.title = App.i18n.t('js.confirm_modify');
            confirmBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                Puzzle.exitCustomCellEditMode(cellDiv, cell);
            });
            
            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'puzzle-custom-edit-btn delete';
            deleteBtn.innerHTML = '✕';
            deleteBtn.title = App.i18n.t('js.delete_template');
            deleteBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                Puzzle.deleteCustomCell(cell.id);
            });
            
            editToolbar.appendChild(confirmBtn);
            editToolbar.appendChild(deleteBtn);
            cellDiv.appendChild(editToolbar);
            
            var resizeHandle = document.createElement('div');
            resizeHandle.className = 'puzzle-custom-resize-handle';
            cellDiv.appendChild(resizeHandle);
            
            document.querySelectorAll('.puzzle-custom-cell').forEach(function (otherCell) {
                if (otherCell !== cellDiv) {
                    otherCell.style.pointerEvents = 'none';
                }
            });
            
            Puzzle.makeCustomCellResizable(cellDiv, cell);
        },

        makeCustomCellResizable: function (cellDiv, cell) {
            var isResizing = false;
            var startX, startY, startWidth, startHeight;
            var resizeHandle = cellDiv.querySelector('.puzzle-custom-resize-handle');
            
            if (!resizeHandle) return;
            
            resizeHandle.addEventListener('mousedown', function (e) {
                e.stopPropagation();
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                startWidth = cell.width;
                startHeight = cell.height;
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
            
            function onMouseMove(e) {
                if (!isResizing) return;
                
                var imgObj = App.getActiveImage();
                if (!imgObj) return;
                
                var scaleX = imgObj.canvas.width / Puzzle.canvasWidth;
                var scaleY = imgObj.canvas.height / Puzzle.canvasHeight;
                var scale = Math.min(scaleX, scaleY);
                var viewZoom = App.state.zoom / 100;
                
                var dx = (e.clientX - startX) / scale / viewZoom;
                var dy = (e.clientY - startY) / scale / viewZoom;
                
                var aspectRatio = startWidth / startHeight;
                var delta = Math.max(Math.abs(dx), Math.abs(dy));
                var direction = dx > 0 || dy > 0 ? 1 : -1;
                
                var newWidth = Math.max(50, startWidth + direction * delta);
                var newHeight = newWidth / aspectRatio;
                
                if (newHeight < 50) {
                    newHeight = 50;
                    newWidth = newHeight * aspectRatio;
                }
                
                var maxWidth = Puzzle.canvasWidth - cell.x;
                var maxHeight = Puzzle.canvasHeight - cell.y;
                
                newWidth = Math.min(newWidth, maxWidth);
                newHeight = Math.min(newHeight, maxHeight);
                
                cell.width = newWidth;
                cell.height = newHeight;
                
                cellDiv.style.width = cell.width * scale * viewZoom + 'px';
                cellDiv.style.height = cell.height * scale * viewZoom + 'px';
            }
            
            function onMouseUp() {
                isResizing = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }
        },

        exitCustomCellEditMode: function (cellDiv, cell) {
            cellDiv.classList.remove('puzzle-custom-cell-editing');
            
            var toolbar = cellDiv.querySelector('.puzzle-custom-edit-toolbar');
            if (toolbar) toolbar.remove();
            
            var resizeHandle = cellDiv.querySelector('.puzzle-custom-resize-handle');
            if (resizeHandle) resizeHandle.remove();
            
            document.querySelectorAll('.puzzle-custom-cell').forEach(function (otherCell) {
                otherCell.style.pointerEvents = 'auto';
            });
            
            this.renderCustomCells();
            App.showToast(App.i18n.t('puzzle.template_updated'));
        },

        deleteCustomCell: function (cellId) {
            this.customCells = this.customCells.filter(function (cell) {
                return cell.id !== cellId;
            });
            
            document.querySelectorAll('.puzzle-custom-cell').forEach(function (cell) {
                cell.style.pointerEvents = 'auto';
            });
            
            this.renderCustomCells();
            App.showToast(App.i18n.t('puzzle.templateDeleted'));
        },

        renderCustomCells: function () {
            var layer = App.els().puzzleLayer;
            if (!layer) return;

            var customCellDivs = layer.querySelectorAll('.puzzle-custom-cell');
            customCellDivs.forEach(function (el) {
                el.remove();
            });

            var imgObj = App.getActiveImage();
            if (!imgObj) return;

            if (!imgObj.canvas) {
                imgObj.canvas = document.createElement('canvas');
                imgObj.canvas.width = imgObj.width;
                imgObj.canvas.height = imgObj.height;
                var ctx = imgObj.canvas.getContext('2d');
                ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);
            }

            var scaleX = imgObj.canvas.width / this.canvasWidth;
            var scaleY = imgObj.canvas.height / this.canvasHeight;
            var scale = Math.min(scaleX, scaleY);
            
            var viewZoom = App.state.zoom / 100;

            this.customCells.forEach(function (cell) {
                var cellDiv = document.createElement('div');
                cellDiv.className = 'puzzle-custom-cell';
                cellDiv.dataset.id = cell.id;
                cellDiv.style.left = cell.x * scale * viewZoom + 'px';
                cellDiv.style.top = cell.y * scale * viewZoom + 'px';
                cellDiv.style.width = cell.width * scale * viewZoom + 'px';
                cellDiv.style.height = cell.height * scale * viewZoom + 'px';
                cellDiv.style.transform = 'rotate(' + cell.rotation + 'deg)';

                // 根据形状设置样式
                if (cell.shape === 'circle') {
                    cellDiv.style.borderRadius = '50%';
                } else if (cell.shape === 'ellipse') {
                    cellDiv.style.borderRadius = '50%';
                } else if (cell.shape === 'rounded-rect') {
                    cellDiv.style.borderRadius = '20px';
                } else if (cell.shape === 'triangle') {
                    cellDiv.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
                } else if (cell.shape === 'star') {
                    cellDiv.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
                } else if (cell.shape === 'heart') {
                    cellDiv.style.clipPath = 'path("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z")';
                }

                cellDiv.innerHTML = '';
                
                var topPanel = document.createElement('div');
                topPanel.className = 'puzzle-custom-cell-top';
                
                var editBtn = document.createElement('button');
                editBtn.className = 'puzzle-custom-edit-btn';
                editBtn.innerHTML = '⊕';
                editBtn.title = App.i18n.t('js.edit_template');
                editBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    Puzzle.enterCustomCellEditMode(cellDiv, cell);
                });
                topPanel.appendChild(editBtn);
                
                cellDiv.appendChild(topPanel);
                
                var bottomPanel = document.createElement('div');
                bottomPanel.className = 'puzzle-custom-cell-bottom';
                
                var fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.className = 'puzzle-cell-input';
                fileInput.addEventListener('change', function (e) {
                    var file = e.target.files[0];
                    if (file) {
                        Puzzle.loadCustomCellImage(cell.id, file);
                    }
                });
                bottomPanel.appendChild(fileInput);

                if (cell.imageData) {
                    var innerContainer = document.createElement('div');
                    innerContainer.className = 'puzzle-custom-cell-inner';
                    
                    var img = document.createElement('img');
                    img.src = cell.imageData.dataUrl;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    innerContainer.appendChild(img);
                    bottomPanel.appendChild(innerContainer);
                    
                    bottomPanel.addEventListener('click', function (e) {
                        e.stopPropagation();
                        if (!cellDiv.classList.contains('puzzle-custom-cell-editing')) {
                            Puzzle.showCustomCellImageEditor(cell);
                        }
                    });
                } else {
                    var placeholder = document.createElement('div');
                    placeholder.className = 'puzzle-cell-placeholder';
                    placeholder.innerHTML = '+';
                    bottomPanel.appendChild(placeholder);
                    
                    bottomPanel.addEventListener('click', function (e) {
                        e.stopPropagation();
                        if (!cellDiv.classList.contains('puzzle-custom-cell-editing')) {
                            fileInput.click();
                        }
                    });
                }
                
                cellDiv.appendChild(bottomPanel);

                layer.appendChild(cellDiv);

                Puzzle.makeCustomCellDraggable(cellDiv, cell);
            });
        },

        getShapeStyle: function (shapeId) {
            switch (shapeId) {
                case 'circle':
                    return '<div class="puzzle-shape-circle"></div>';
                case 'ellipse':
                    return '<div class="puzzle-shape-ellipse"></div>';
                case 'star':
                    return '<div class="puzzle-shape-star"></div>';
                case 'triangle':
                    return '<div class="puzzle-shape-triangle"></div>';
                case 'rect':
                default:
                    return '<div class="puzzle-shape-rect"></div>';
            }
        },

        showCustomCellMenu: function (e, cell) {
            var existingMenu = document.querySelector('.puzzle-custom-menu');
            if (existingMenu) {
                existingMenu.remove();
            }

            var menu = document.createElement('div');
            menu.className = 'puzzle-custom-menu';
            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';

            menu.innerHTML = `
                <div class="puzzle-menu-item" data-action="resize">` + App.i18n.t('puzzle.zoom_in_out') + `</div>
                <div class="puzzle-menu-item" data-action="delete">` + App.i18n.t('puzzle.delete') + `</div>
            `;

            document.body.appendChild(menu);

            menu.querySelectorAll('.puzzle-menu-item').forEach(function (item) {
                item.addEventListener('click', function () {
                    var action = item.dataset.action;
                    if (action === 'delete') {
                        Puzzle.deleteCustomCell(cell.id);
                    } else if (action === 'resize') {
                        Puzzle.resizeCustomCell(cell);
                    }
                    menu.remove();
                });
            });

            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }, { once: true });
        },

        deleteCustomCell: function (cellId) {
            this.customCells = this.customCells.filter(function (cell) {
                return cell.id !== cellId;
            });
            this.renderCustomCells();
        },

        loadCustomCellImage: function (cellId, file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var cell = Puzzle.customCells.find(function (c) {
                    return c.id === cellId;
                });
                
                if (cell) {
                    var img = new Image();
                    img.onload = function () {
                        cell.imageData = {
                            img: img,
                            dataUrl: e.target.result,
                            width: img.width,
                            height: img.height,
                            cropX: 0,
                            cropY: 0,
                            cropWidth: img.width,
                            cropHeight: img.height
                        };
                        Puzzle.renderCustomCells();
                    };
                    img.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        },

        showCustomCellImageEditor: function (cell) {
            this.editingCustomCell = cell;
            this.editingCellIndex = null;

            var cellImg = cell.imageData;
            if (!cellImg) return;

            this.editingImage = cellImg.img;
            this.editingRotation = cellImg.rotation || 0;
            this.editingFlipH = cellImg.flipH || false;
            this.editingFlipV = cellImg.flipV || false;
            this.editingImgDisplayWidth = 0;
            this.editingImgDisplayHeight = 0;

            var els = App.els();
            var frame = els.puzzleEditorFrame;
            var crop = els.puzzleEditorCrop;
            var self = this;

            frame.innerHTML = '<img src="' + cellImg.dataUrl + '" id="puzzleEditorImg">';
            
            var img = document.getElementById('puzzleEditorImg');
            img.onload = function() {
                var frameWidth = frame.clientWidth;
                var frameHeight = frame.clientHeight;
                var imgRatio = img.width / img.height;
                var frameRatio = frameWidth / frameHeight;

                var displayWidth, displayHeight;
                if (imgRatio > frameRatio) {
                    displayWidth = frameWidth;
                    displayHeight = frameWidth / imgRatio;
                } else {
                    displayHeight = frameHeight;
                    displayWidth = frameHeight * imgRatio;
                }

                img.style.width = displayWidth + 'px';
                img.style.height = displayHeight + 'px';
                img.style.position = 'absolute';
                img.style.top = '50%';
                img.style.left = '50%';
                img.style.transform = 'translate(-50%, -50%)';
                img.style.transformOrigin = 'center center';

                self.editingImgDisplayWidth = displayWidth;
                self.editingImgDisplayHeight = displayHeight;
                self.editingImgOriginalWidth = img.naturalWidth;
                self.editingImgOriginalHeight = img.naturalHeight;

                var cellRatio = cell.width / cell.height;
                
                // 计算最大选择框尺寸，使其尽可能大但保持在图片范围内
                var displayRatio = displayWidth / displayHeight;
                var cropWidth, cropHeight;
                
                if (cellRatio > displayRatio) {
                    // 选择框比显示区域更宽，以宽度为准
                    cropWidth = displayWidth;
                    cropHeight = displayWidth / cellRatio;
                } else {
                    // 选择框比显示区域更高，以高度为准
                    cropHeight = displayHeight;
                    cropWidth = displayHeight * cellRatio;
                }

                crop.style.width = cropWidth + 'px';
                crop.style.height = cropHeight + 'px';
                crop.style.left = (frameWidth - cropWidth) / 2 + 'px';
                crop.style.top = (frameHeight - cropHeight) / 2 + 'px';

                crop.innerHTML = '<div class="resize-handle tl"></div><div class="resize-handle tr"></div><div class="resize-handle bl"></div><div class="resize-handle br"></div>';

                self.setupEditorCropResize(crop, cellRatio);
            };

            els.puzzleImageModal.style.display = 'flex';
        },

        resizeCustomCell: function (cell) {
            var factor = 1.2;
            var centerX = cell.x + cell.width / 2;
            var centerY = cell.y + cell.height / 2;

            cell.width *= factor;
            cell.height *= factor;
            cell.x = centerX - cell.width / 2;
            cell.y = centerY - cell.height / 2;

            this.renderCustomCells();
        },

        makeCustomCellDraggable: function (cellDiv, cell) {
            var isDragging = false;
            var isResizing = false;
            var startX, startY, startCellX, startCellY;
            var startWidth, startHeight;

            cellDiv.addEventListener('mousedown', function (e) {
                if (e.target.classList.contains('puzzle-custom-edit-btn')) return;
                
                if (e.target.classList.contains('puzzle-custom-resize-handle')) {
                    isResizing = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    startWidth = cell.width;
                    startHeight = cell.height;
                } else {
                    isDragging = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    startCellX = cell.x;
                    startCellY = cell.y;
                }

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });

            function onMouseMove(e) {
                var imgObj = App.getActiveImage();
                if (!imgObj) return;

                var scaleX = imgObj.canvas.width / Puzzle.canvasWidth;
                var scaleY = imgObj.canvas.height / Puzzle.canvasHeight;
                var scale = Math.min(scaleX, scaleY);
                var viewZoom = App.state.zoom / 100;

                if (isResizing) {
                    var dx = (e.clientX - startX) / scale / viewZoom;
                    var dy = (e.clientY - startY) / scale / viewZoom;
                    
                    var aspectRatio = startWidth / startHeight;
                    var newWidth = Math.max(50, startWidth + dx);
                    var newHeight = newWidth / aspectRatio;
                    
                    if (newHeight < 50) {
                        newHeight = 50;
                        newWidth = newHeight * aspectRatio;
                    }
                    
                    var maxWidth = Puzzle.canvasWidth - cell.x;
                    var maxHeight = Puzzle.canvasHeight - cell.y;
                    
                    newWidth = Math.min(newWidth, maxWidth);
                    newHeight = Math.min(newHeight, maxHeight);
                    
                    cell.width = newWidth;
                    cell.height = newHeight;

                    cellDiv.style.width = cell.width * scale * viewZoom + 'px';
                    cellDiv.style.height = cell.height * scale * viewZoom + 'px';
                } else if (isDragging) {
                    var dx = (e.clientX - startX) / scale / viewZoom;
                    var dy = (e.clientY - startY) / scale / viewZoom;

                    cell.x = Math.max(0, Math.min(Puzzle.canvasWidth - cell.width, startCellX + dx));
                    cell.y = Math.max(0, Math.min(Puzzle.canvasHeight - cell.height, startCellY + dy));

                    cellDiv.style.left = cell.x * scale * viewZoom + 'px';
                    cellDiv.style.top = cell.y * scale * viewZoom + 'px';
                }
            }

            function onMouseUp() {
                isDragging = false;
                isResizing = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }
        },

        generateTemplatePreview: function (tmpl) {
            var html = '<div class="puzzle-template-preview">';
            
            if (tmpl.layout) {
                html += Puzzle.generateLayoutPreview(tmpl.layout, tmpl.cols, tmpl.rows);
            } else {
                for (var i = 0; i < tmpl.rows; i++) {
                    html += '<div class="puzzle-template-row">';
                    for (var j = 0; j < tmpl.cols; j++) {
                        html += '<div class="puzzle-template-cell"></div>';
                    }
                    html += '</div>';
                }
            }
            
            html += '</div><div class="puzzle-template-name">' + tmpl.name + '</div>';
            return html;
        },

        generateLayoutPreview: function (layout, cols, rows) {
            var html = '';
            
            switch (layout) {
                case 'leftBig':
                    html += '<div class="puzzle-template-row">';
                    html += '<div class="puzzle-template-cell" style="flex: 2;"></div>';
                    html += '<div class="puzzle-template-cell"></div>';
                    html += '</div>';
                    html += '<div class="puzzle-template-row">';
                    html += '<div class="puzzle-template-cell"></div>';
                    html += '<div class="puzzle-template-cell"></div>';
                    html += '</div>';
                    break;
                case 'rightBig':
                    html += '<div class="puzzle-template-row">';
                    html += '<div class="puzzle-template-cell"></div>';
                    html += '<div class="puzzle-template-cell" style="flex: 2;"></div>';
                    html += '</div>';
                    html += '<div class="puzzle-template-row">';
                    html += '<div class="puzzle-template-cell"></div>';
                    html += '<div class="puzzle-template-cell"></div>';
                    html += '</div>';
                    break;
                case 'topBig':
                    html += '<div class="puzzle-template-row">';
                    html += '<div class="puzzle-template-cell"></div>';
                    html += '<div class="puzzle-template-cell"></div>';
                    html += '</div>';
                    html += '<div class="puzzle-template-row">';
                    html += '<div class="puzzle-template-cell" style="flex: 2;"></div>';
                    html += '<div class="puzzle-template-cell"></div>';
                    html += '</div>';
                    break;
                case 'bottomBig':
                    html += '<div class="puzzle-template-row">';
                    html += '<div class="puzzle-template-cell"></div>';
                    html += '<div class="puzzle-template-cell" style="flex: 2;"></div>';
                    html += '</div>';
                    html += '<div class="puzzle-template-row">';
                    html += '<div class="puzzle-template-cell"></div>';
                    html += '<div class="puzzle-template-cell"></div>';
                    html += '</div>';
                    break;
                case 'pinzi':
                    html += '<div class="puzzle-template-row">';
                    html += '<div class="puzzle-template-cell"></div>';
                    html += '<div class="puzzle-template-cell" style="flex: 0.5;"></div>';
                    html += '<div class="puzzle-template-cell"></div>';
                    html += '</div>';
                    html += '<div class="puzzle-template-row">';
                    html += '<div class="puzzle-template-cell" style="flex: 0.5;"></div>';
                    html += '<div class="puzzle-template-cell"></div>';
                    html += '<div class="puzzle-template-cell" style="flex: 0.5;"></div>';
                    html += '</div>';
                    break;
                default:
                    for (var i = 0; i < rows; i++) {
                        html += '<div class="puzzle-template-row">';
                        for (var j = 0; j < cols; j++) {
                            html += '<div class="puzzle-template-cell"></div>';
                        }
                        html += '</div>';
                    }
            }
            
            return html;
        },

        showCustomTemplateDialog: function () {
            if (App.els().puzzleCustomDialog) {
                App.els().puzzleCustomDialog.style.display = 'block';
            } else {
                App.showToast(App.i18n.t('puzzle.custom_developing'));
            }
        },

        selectTemplate: function (tmpl) {
            this.currentTemplate = JSON.parse(JSON.stringify(tmpl));
            this.cellRatio = tmpl.cellRatio || 1;
            this.generateCells(tmpl);
            this.renderPuzzleGrid();
            this.saveStateToImage();
        },

        generateCells: function (tmpl) {
            this.cells = [];
            var totalWidth = this.canvasWidth - (tmpl.cols - 1) * this.gap;
            var totalHeight = this.canvasHeight - (tmpl.rows - 1) * this.gap;
            var cellW = totalWidth / tmpl.cols;
            var cellH = totalHeight / tmpl.rows;

            var layout = tmpl.layout;
            if (layout) {
                var bigCellW = cellW * 2 + this.gap;
                var bigCellH = cellH * 2 + this.gap;
                
                if (layout === 'leftBig') {
                    this.cells.push({ x: 0, y: 0, width: bigCellW, height: bigCellH });
                    this.cells.push({ x: bigCellW, y: 0, width: cellW, height: cellH });
                    this.cells.push({ x: bigCellW, y: cellH + this.gap, width: cellW, height: cellH });
                    this.cellRatio = bigCellW / bigCellH;
                } else if (layout === 'rightBig') {
                    this.cells.push({ x: cellW, y: 0, width: bigCellW, height: bigCellH });
                    this.cells.push({ x: 0, y: 0, width: cellW, height: cellH });
                    this.cells.push({ x: 0, y: cellH + this.gap, width: cellW, height: cellH });
                    this.cellRatio = bigCellW / bigCellH;
                } else if (layout === 'topBig') {
                    this.cells.push({ x: 0, y: 0, width: bigCellW, height: bigCellH });
                    this.cells.push({ x: 0, y: bigCellH, width: cellW, height: cellH });
                    this.cells.push({ x: cellW + this.gap, y: bigCellH, width: cellW, height: cellH });
                    this.cellRatio = bigCellW / bigCellH;
                } else if (layout === 'bottomBig') {
                    this.cells.push({ x: 0, y: cellH, width: bigCellW, height: bigCellH });
                    this.cells.push({ x: 0, y: 0, width: cellW, height: cellH });
                    this.cells.push({ x: cellW + this.gap, y: 0, width: cellW, height: cellH });
                    this.cellRatio = bigCellW / bigCellH;
                } else if (layout === 'pinzi') {
                    var pinziTopY = 0;
                    var pinziMidY = cellH + this.gap;
                    var pinziBottomY = cellH * 2 + this.gap * 2;
                    
                    this.cells.push({ x: cellW, y: pinziTopY, width: cellW, height: cellH });
                    this.cells.push({ x: 0, y: pinziMidY, width: cellW, height: cellH });
                    this.cells.push({ x: cellW * 2 + this.gap, y: pinziMidY, width: cellW, height: cellH });
                    this.cells.push({ x: cellW, y: pinziBottomY, width: cellW, height: cellH });
                    this.cellRatio = 1;
                }
            } else if (tmpl.shape) {
                var cx = this.canvasWidth / 2;
                var cy = this.canvasHeight / 2;
                var size = Math.min(this.canvasWidth, this.canvasHeight) * 0.35;
                
                if (tmpl.shape === 'heart') {
                    this.createHeartCells(cx, cy, size);
                } else if (tmpl.shape === 'diamond') {
                    this.createDiamondCells(cx, cy, size);
                } else if (tmpl.shape === 'circle') {
                    this.createCircleCells(cx, cy, size);
                } else if (tmpl.shape === 'star') {
                    this.createStarCells(cx, cy, size);
                }
            } else {
                for (var r = 0; r < tmpl.rows; r++) {
                    for (var c = 0; c < tmpl.cols; c++) {
                        this.cells.push({
                            x: c * (cellW + this.gap),
                            y: r * (cellH + this.gap),
                            width: cellW,
                            height: cellH
                        });
                    }
                }
                this.cellRatio = cellW / cellH;
            }
        },

        createHeartCells: function (cx, cy, size) {
            var cellSize = size * 0.4;
            var cells = [
                { x: cx - size * 0.1, y: cy - size * 0.8, w: size * 0.5, h: size * 0.5 },
                { x: cx + size * 0.1, y: cy - size * 0.8, w: size * 0.5, h: size * 0.5 },
                { x: cx - size * 0.5, y: cy - size * 0.3, w: size * 0.55, h: size * 0.55 },
                { x: cx + size * 0.05, y: cy - size * 0.3, w: size * 0.55, h: size * 0.55 },
                { x: cx - size * 0.5, y: cy + size * 0.3, w: size * 0.5, h: size * 0.5 },
                { x: cx, y: cy + size * 0.3, w: size * 0.5, h: size * 0.5 },
                { x: cx - size * 0.25, y: cy + size * 0.85, w: size * 0.45, h: size * 0.45 }
            ];
            
            cells.forEach(function (cell) {
                this.cells.push({
                    x: Math.max(0, cell.x - cell.w / 2),
                    y: Math.max(0, cell.y - cell.h / 2),
                    width: Math.min(cell.w, this.canvasWidth),
                    height: Math.min(cell.h, this.canvasHeight),
                    shape: 'heart'
                });
            }, this);
        },

        createDiamondCells: function (cx, cy, size) {
            var cells = [
                { x: cx, y: cy - size * 0.9, w: size * 0.8, h: size * 0.8 },
                { x: cx - size * 0.85, y: cy - size * 0.15, w: size * 0.75, h: size * 0.75 },
                { x: cx + size * 0.85, y: cy - size * 0.15, w: size * 0.75, h: size * 0.75 },
                { x: cx - size * 0.85, y: cy + size * 0.7, w: size * 0.75, h: size * 0.75 },
                { x: cx + size * 0.85, y: cy + size * 0.7, w: size * 0.75, h: size * 0.75 },
                { x: cx, y: cy + size * 1.5, w: size * 0.8, h: size * 0.8 }
            ];
            
            cells.forEach(function (cell) {
                this.cells.push({
                    x: Math.max(0, cell.x - cell.w / 2),
                    y: Math.max(0, cell.y - cell.h / 2),
                    width: Math.min(cell.w, this.canvasWidth),
                    height: Math.min(cell.h, this.canvasHeight),
                    shape: 'diamond'
                });
            }, this);
        },

        createCircleCells: function (cx, cy, size) {
            var cellSize = size * 0.35;
            var angleStep = (Math.PI * 2) / 8;
            
            for (var i = 0; i < 8; i++) {
                var angle = i * angleStep - Math.PI / 2;
                var x = cx + Math.cos(angle) * size * 0.65;
                var y = cy + Math.sin(angle) * size * 0.65;
                
                this.cells.push({
                    x: Math.max(0, x - cellSize / 2),
                    y: Math.max(0, y - cellSize / 2),
                    width: cellSize,
                    height: cellSize,
                    shape: 'circle'
                });
            }
            
            this.cells.push({
                x: Math.max(0, cx - cellSize / 2),
                y: Math.max(0, cy - cellSize / 2),
                width: cellSize,
                height: cellSize,
                shape: 'circle'
            });
        },

        createStarCells: function (cx, cy, size) {
            var outerRadius = size;
            var innerRadius = size * 0.4;
            var points = 5;
            var cellSize = size * 0.35;
            
            for (var i = 0; i < points * 2; i++) {
                var radius = i % 2 === 0 ? outerRadius : innerRadius;
                var angle = (i * Math.PI) / points - Math.PI / 2;
                var x = cx + Math.cos(angle) * radius * 0.75;
                var y = cy + Math.sin(angle) * radius * 0.75;
                
                this.cells.push({
                    x: Math.max(0, x - cellSize / 2),
                    y: Math.max(0, y - cellSize / 2),
                    width: cellSize,
                    height: cellSize,
                    shape: 'star'
                });
            }
        },

        renderPuzzleGrid: function () {
            var layer = App.els().puzzleLayer;
            if (!layer) return;
            
            if (!this.currentTemplate) {
                layer.innerHTML = '';
                return;
            }

            var imgObj = App.getActiveImage();
            if (!imgObj) return;

            if (!imgObj.canvas) {
                imgObj.canvas = document.createElement('canvas');
                imgObj.canvas.width = imgObj.width;
                imgObj.canvas.height = imgObj.height;
                var ctx = imgObj.canvas.getContext('2d');
                ctx.drawImage(imgObj.img, 0, 0, imgObj.width, imgObj.height);
            }

            var scaleX = imgObj.canvas.width / this.canvasWidth;
            var scaleY = imgObj.canvas.height / this.canvasHeight;
            var scale = Math.min(scaleX, scaleY);
            
            var viewZoom = App.state.zoom / 100;
            
            var effectiveWidth = this.canvasWidth * scale;
            var effectiveHeight = this.canvasHeight * scale;
            var offsetX = (imgObj.canvas.width - effectiveWidth) / 2;
            var offsetY = (imgObj.canvas.height - effectiveHeight) / 2;

            layer.innerHTML = '';

            if (this.bgImage) {
                var bgDiv = document.createElement('div');
                bgDiv.className = 'puzzle-bg';
                bgDiv.style.backgroundImage = 'url(' + this.bgImage.dataUrl + ')';
                bgDiv.style.backgroundSize = 'cover';
                bgDiv.style.backgroundPosition = 'center';
                bgDiv.style.width = effectiveWidth * viewZoom + 'px';
                bgDiv.style.height = effectiveHeight * viewZoom + 'px';
                bgDiv.style.position = 'absolute';
                bgDiv.style.top = offsetY * viewZoom + 'px';
                bgDiv.style.left = offsetX * viewZoom + 'px';
                layer.appendChild(bgDiv);
            }

            this.cells.forEach(function (cell, index) {
                var cellDiv = document.createElement('div');
                cellDiv.className = 'puzzle-cell';
                cellDiv.dataset.index = index;
                cellDiv.style.left = (offsetX + cell.x * scale) * viewZoom + 'px';
                cellDiv.style.top = (offsetY + cell.y * scale) * viewZoom + 'px';
                cellDiv.style.width = cell.width * scale * viewZoom + 'px';
                cellDiv.style.height = cell.height * scale * viewZoom + 'px';
                cellDiv.style.borderRadius = Puzzle.borderRadius * scale * viewZoom + 'px';

                if (Puzzle.cellImages[index]) {
                    var img = document.createElement('img');
                    img.src = Puzzle.cellImages[index].dataUrl;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = Puzzle.borderRadius * scale + 'px';
                    
                    var transform = [];
                    if (Puzzle.cellImages[index].rotation) {
                        transform.push('rotate(' + Puzzle.cellImages[index].rotation + 'deg)');
                    }
                    if (Puzzle.cellImages[index].flipH) {
                        transform.push('scaleX(-1)');
                    }
                    if (Puzzle.cellImages[index].flipV) {
                        transform.push('scaleY(-1)');
                    }
                    if (transform.length > 0) {
                        img.style.transform = transform.join(' ');
                    }
                    
                    cellDiv.appendChild(img);
                } else {
                    var input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.className = 'puzzle-cell-input';
                    input.dataset.index = index;
                    input.addEventListener('change', function (e) {
                        var file = e.target.files[0];
                        var idx = parseInt(e.target.dataset.index);
                        if (file && !isNaN(idx)) {
                            Puzzle.loadCellImage(idx, file);
                        }
                    });
                    cellDiv.appendChild(input);
                    cellDiv.classList.add('empty');
                }

                cellDiv.addEventListener('click', function (e) {
                    if (!Puzzle.cellImages[index]) {
                        var input = cellDiv.querySelector('input.puzzle-cell-input');
                        if (input) {
                            input.click();
                        }
                    } else {
                        Puzzle.showImageEditor(index);
                    }
                });

                layer.appendChild(cellDiv);
            });
        },

        loadCellImage: function (index, file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var img = new Image();
                img.onload = function () {
                    Puzzle.cellImages[index] = {
                        img: img,
                        dataUrl: e.target.result,
                        rotation: 0,
                        flipH: false,
                        flipV: false,
                        offsetX: 0,
                        offsetY: 0,
                        scale: 1
                    };
                    Puzzle.renderPuzzleGrid();
                    Puzzle.saveStateToImage();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        },

        showImageEditor: function (index) {
            this.editingCellIndex = index;
            var cellImg = this.cellImages[index];
            if (!cellImg) return;

            this.editingImage = cellImg.img;
            this.editingRotation = cellImg.rotation || 0;
            this.editingFlipH = cellImg.flipH || false;
            this.editingFlipV = cellImg.flipV || false;
            this.editingImgDisplayWidth = 0;
            this.editingImgDisplayHeight = 0;

            var els = App.els();
            var frame = els.puzzleEditorFrame;
            var crop = els.puzzleEditorCrop;
            var self = this;

            frame.innerHTML = '<img src="' + cellImg.dataUrl + '" id="puzzleEditorImg">';
            
            var img = document.getElementById('puzzleEditorImg');
            img.onload = function() {
                var frameWidth = frame.clientWidth;
                var frameHeight = frame.clientHeight;
                var imgRatio = img.width / img.height;
                var frameRatio = frameWidth / frameHeight;

                var displayWidth, displayHeight;
                if (imgRatio > frameRatio) {
                    displayWidth = frameWidth;
                    displayHeight = frameWidth / imgRatio;
                } else {
                    displayHeight = frameHeight;
                    displayWidth = frameHeight * imgRatio;
                }

                img.style.width = displayWidth + 'px';
                img.style.height = displayHeight + 'px';
                img.style.position = 'absolute';
                img.style.top = '50%';
                img.style.left = '50%';
                img.style.transform = 'translate(-50%, -50%)';
                img.style.transformOrigin = 'center center';

                self.editingImgDisplayWidth = displayWidth;
                self.editingImgDisplayHeight = displayHeight;
                self.editingImgOriginalWidth = img.naturalWidth;
                self.editingImgOriginalHeight = img.naturalHeight;

                var cellRatio = self.cellRatio || 1;
                
                // 计算最大选择框尺寸，使其尽可能大但保持在图片范围内
                var displayRatio = displayWidth / displayHeight;
                var cropWidth, cropHeight;
                
                if (cellRatio > displayRatio) {
                    // 选择框比显示区域更宽，以宽度为准
                    cropWidth = displayWidth;
                    cropHeight = displayWidth / cellRatio;
                } else {
                    // 选择框比显示区域更高，以高度为准
                    cropHeight = displayHeight;
                    cropWidth = displayHeight * cellRatio;
                }

                crop.style.width = cropWidth + 'px';
                crop.style.height = cropHeight + 'px';
                crop.style.left = (frameWidth - cropWidth) / 2 + 'px';
                crop.style.top = (frameHeight - cropHeight) / 2 + 'px';

                crop.innerHTML = '<div class="resize-handle tl"></div><div class="resize-handle tr"></div><div class="resize-handle bl"></div><div class="resize-handle br"></div>';

                self.setupEditorCropResize(crop, cellRatio);
            };

            els.puzzleImageModal.style.display = 'flex';
        },

        hideImageEditor: function () {
            var els = App.els();
            els.puzzleImageModal.style.display = 'none';
            this.editingCellIndex = null;
            this.editingCustomCell = null;
            this.editingImage = null;
            this.editingRotation = 0;
            this.editingFlipH = false;
            this.editingFlipV = false;
        },

        rotateImage: function () {
            this.editingRotation += 90;
            this.updateEditorPreview();
        },

        flipImageH: function () {
            this.editingFlipH = !this.editingFlipH;
            this.updateEditorPreview();
        },

        flipImageV: function () {
            this.editingFlipV = !this.editingFlipV;
            this.updateEditorPreview();
        },

        replaceImage: function () {
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            var self = this;

            input.onchange = function (e) {
                var file = e.target.files[0];
                if (!file) return;

                var reader = new FileReader();
                reader.onload = function (ev) {
                    var img = new Image();
                    img.onload = function () {
                        self.editingImage = img;
                        self.editingRotation = 0;
                        self.editingFlipH = false;
                        self.editingFlipV = false;

                        var els = App.els();
                        var frame = els.puzzleEditorFrame;
                        var crop = els.puzzleEditorCrop;

                        frame.innerHTML = '<img src="' + ev.target.result + '" id="puzzleEditorImg">';
                        
                        var editorImg = document.getElementById('puzzleEditorImg');
                        editorImg.onload = function() {
                            var frameWidth = frame.clientWidth;
                            var frameHeight = frame.clientHeight;
                            var imgRatio = editorImg.width / editorImg.height;
                            var frameRatio = frameWidth / frameHeight;

                            var displayWidth, displayHeight;
                            if (imgRatio > frameRatio) {
                                displayWidth = frameWidth;
                                displayHeight = frameWidth / imgRatio;
                            } else {
                                displayHeight = frameHeight;
                                displayWidth = frameHeight * imgRatio;
                            }

                            editorImg.style.width = displayWidth + 'px';
                            editorImg.style.height = displayHeight + 'px';
                            editorImg.style.position = 'absolute';
                            editorImg.style.top = '50%';
                            editorImg.style.left = '50%';
                            editorImg.style.transform = 'translate(-50%, -50%)';
                            editorImg.style.transformOrigin = 'center center';

                            self.editingImgDisplayWidth = displayWidth;
                            self.editingImgDisplayHeight = displayHeight;
                            self.editingImgOriginalWidth = editorImg.naturalWidth;
                            self.editingImgOriginalHeight = editorImg.naturalHeight;

                            var cellRatio;
                            if (self.editingCustomCell) {
                                cellRatio = self.editingCustomCell.width / self.editingCustomCell.height;
                            } else {
                                cellRatio = self.cellRatio || 1;
                            }
                            
                            // 计算最大选择框尺寸，使其尽可能大但保持在图片范围内
                            var displayRatio = displayWidth / displayHeight;
                            var cropWidth, cropHeight;
                            
                            if (cellRatio > displayRatio) {
                                // 选择框比显示区域更宽，以宽度为准
                                cropWidth = displayWidth;
                                cropHeight = displayWidth / cellRatio;
                            } else {
                                // 选择框比显示区域更高，以高度为准
                                cropHeight = displayHeight;
                                cropWidth = displayHeight * cellRatio;
                            }

                            crop.style.width = cropWidth + 'px';
                            crop.style.height = cropHeight + 'px';
                            crop.style.left = (frameWidth - cropWidth) / 2 + 'px';
                            crop.style.top = (frameHeight - cropHeight) / 2 + 'px';

                            crop.innerHTML = '<div class="resize-handle tl"></div><div class="resize-handle tr"></div><div class="resize-handle bl"></div><div class="resize-handle br"></div>';

                            self.setupEditorCropResize(crop, cellRatio);
                        };
                    };
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            };

            input.click();
        },

        saveImageEdit: function () {
            var crop = App.els().puzzleEditorCrop;
            var cropWidth = parseFloat(crop.style.width) || 200;
            var cropHeight = parseFloat(crop.style.height) || 200;
            var cropLeft = parseFloat(crop.style.left) || 0;
            var cropTop = parseFloat(crop.style.top) || 0;

            var frameWidth = App.els().puzzleEditorFrame.clientWidth;
            var frameHeight = App.els().puzzleEditorFrame.clientHeight;

            // 图片使用 translate(-50%, -50%) 居中，所以图片左边缘在 frameWidth/2 - displayWidth/2 处
            var imgOffsetX = (frameWidth - this.editingImgDisplayWidth) / 2;
            var imgOffsetY = (frameHeight - this.editingImgDisplayHeight) / 2;

            // 确保裁剪区域在图片范围内
            var cropXInImg = Math.max(0, (cropLeft - imgOffsetX) * (this.editingImgOriginalWidth / this.editingImgDisplayWidth));
            var cropYInImg = Math.max(0, (cropTop - imgOffsetY) * (this.editingImgOriginalHeight / this.editingImgDisplayHeight));
            var cropWidthInImg = Math.min(
                this.editingImgOriginalWidth - cropXInImg,
                cropWidth * (this.editingImgOriginalWidth / this.editingImgDisplayWidth)
            );
            var cropHeightInImg = Math.min(
                this.editingImgOriginalHeight - cropYInImg,
                cropHeight * (this.editingImgOriginalHeight / this.editingImgDisplayHeight)
            );
            
            // 确定使用哪个图片源
            var sourceImage = this.editingImage;
            if (!sourceImage && this.editingCustomCell && this.editingCustomCell.imageData) {
                sourceImage = this.editingCustomCell.imageData.img;
            }
            
            if (!sourceImage) {
                console.error('[Puzzle] saveImageEdit - no source image available!');
                return;
            }

            var canvas = document.createElement('canvas');
            canvas.width = cropWidthInImg;
            canvas.height = cropHeightInImg;
            var ctx = canvas.getContext('2d');

            ctx.save();
            ctx.translate(cropWidthInImg / 2, cropHeightInImg / 2);
            if (this.editingRotation !== 0) {
                ctx.rotate((this.editingRotation * Math.PI) / 180);
            }
            if (this.editingFlipH) {
                ctx.scale(-1, 1);
            }
            if (this.editingFlipV) {
                ctx.scale(1, -1);
            }
            ctx.translate(-cropWidthInImg / 2, -cropHeightInImg / 2);
            ctx.drawImage(sourceImage, cropXInImg, cropYInImg, cropWidthInImg, cropHeightInImg, 0, 0, cropWidthInImg, cropHeightInImg);
            ctx.restore();

            var croppedImg = new Image();
            croppedImg.src = canvas.toDataURL('image/png');
            
            croppedImg.onload = function () {
                if (Puzzle.editingCustomCell) {
                    Puzzle.editingCustomCell.imageData = {
                        img: croppedImg,
                        dataUrl: canvas.toDataURL('image/png'),
                        width: cropWidthInImg,
                        height: cropHeightInImg,
                        rotation: 0,
                        flipH: false,
                        flipV: false
                    };
                    Puzzle.renderCustomCells();
                } else if (Puzzle.editingCellIndex !== null) {
                    Puzzle.cellImages[Puzzle.editingCellIndex] = {
                        img: croppedImg,
                        dataUrl: canvas.toDataURL('image/png'),
                        rotation: 0,
                        flipH: false,
                        flipV: false,
                        offsetX: 0,
                        offsetY: 0,
                        scale: 1
                    };
                    Puzzle.renderPuzzleGrid();
                }
                Puzzle.hideImageEditor();
                App.showToast(App.i18n.t('puzzle.imageUpdated'));
            };
        },

        updateEditorPreview: function () {
            var img = document.getElementById('puzzleEditorImg');
            if (!img) return;

            var transform = ['translate(-50%, -50%)'];
            if (this.editingRotation !== 0) {
                transform.push('rotate(' + this.editingRotation + 'deg)');
            }
            if (this.editingFlipH) {
                transform.push('scaleX(-1)');
            }
            if (this.editingFlipV) {
                transform.push('scaleY(-1)');
            }

            img.style.transform = transform.join(' ');
        },

        setupEditorCropResize: function (crop, cellRatio) {
            var isDragging = false;
            var isResizing = false;
            var startX, startY, startLeft, startTop, startWidth, startHeight;
            var resizeHandle = null;

            crop.addEventListener('mousedown', function(e) {
                if (e.target.classList.contains('resize-handle')) {
                    resizeHandle = e.target;
                    isResizing = true;
                } else {
                    isDragging = true;
                }
                startX = e.clientX;
                startY = e.clientY;
                startLeft = parseFloat(crop.style.left) || 0;
                startTop = parseFloat(crop.style.top) || 0;
                startWidth = parseFloat(crop.style.width) || 100;
                startHeight = parseFloat(crop.style.height) || 100;
            });

            document.addEventListener('mousemove', function(e) {
                var frame = crop.parentElement;
                var minSize = 50;

                if (isDragging) {
                    var deltaX = e.clientX - startX;
                    var deltaY = e.clientY - startY;
                    var newLeft = Math.max(0, Math.min(frame.clientWidth - crop.clientWidth, startLeft + deltaX));
                    var newTop = Math.max(0, Math.min(frame.clientHeight - crop.clientHeight, startTop + deltaY));
                    crop.style.left = newLeft + 'px';
                    crop.style.top = newTop + 'px';
                } else if (isResizing && resizeHandle) {
                    var deltaX = e.clientX - startX;
                    var deltaY = e.clientY - startY;
                    
                    var newWidth = startWidth;
                    var newHeight = startHeight;
                    var newLeft = startLeft;
                    var newTop = startTop;

                    if (resizeHandle.classList.contains('br') || resizeHandle.classList.contains('tl')) {
                        if (resizeHandle.classList.contains('br')) {
                            newWidth = Math.max(minSize, startWidth + deltaX);
                            newHeight = newWidth / cellRatio;
                        } else {
                            newWidth = Math.max(minSize, startWidth - deltaX);
                            newHeight = newWidth / cellRatio;
                            newLeft = startLeft + (startWidth - newWidth);
                            newTop = startTop + (startHeight - newHeight);
                        }
                    } else if (resizeHandle.classList.contains('tr') || resizeHandle.classList.contains('bl')) {
                        if (resizeHandle.classList.contains('tr')) {
                            newWidth = Math.max(minSize, startWidth + deltaX);
                            newHeight = newWidth / cellRatio;
                            newTop = startTop + (startHeight - newHeight);
                        } else {
                            newWidth = Math.max(minSize, startWidth - deltaX);
                            newHeight = newWidth / cellRatio;
                            newLeft = startLeft + (startWidth - newWidth);
                        }
                    }

                    newWidth = Math.min(newWidth, frame.clientWidth - newLeft);
                    newHeight = Math.min(newHeight, frame.clientHeight - newTop);

                    crop.style.width = newWidth + 'px';
                    crop.style.height = newHeight + 'px';
                    crop.style.left = newLeft + 'px';
                    crop.style.top = newTop + 'px';
                }
            });

            document.addEventListener('mouseup', function() {
                isDragging = false;
                isResizing = false;
                resizeHandle = null;
            });
        },

        uploadBgImage: function () {
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            var self = this;

            input.onchange = function (e) {
                var file = e.target.files[0];
                if (!file) return;

                var reader = new FileReader();
                reader.onload = function (ev) {
                    var img = new Image();
                    img.onload = function () {
                        self.bgImage = {
                            dataUrl: ev.target.result,
                            img: img
                        };
                        App.showToast(App.i18n.t('puzzle.bg_uploaded'));
                        if (self.currentTemplate) {
                            self.renderPuzzleGrid();
                        }
                    };
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            };

            input.click();
        },

        exportPuzzle: function () {
            var imgObj = App.getActiveImage();
            if (!imgObj) {
                App.showToast(App.i18n.t('dialog.open_image_first'));
                return;
            }
            
            var hasTemplate = this.currentTemplate && this.cells.length > 0;
            var hasCustomCells = this.customCells.length > 0 && this.customCells.some(function(c) { return c.imageData; });
            
            if (!hasTemplate && !hasCustomCells) {
                App.showToast(App.i18n.t('puzzle.selectTemplateAndFill'));
                return;
            }

            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');

            canvas.width = this.canvasWidth || imgObj.width;
            canvas.height = this.canvasHeight || imgObj.height;

            if (this.bgImage) {
                ctx.drawImage(this.bgImage.img, 0, 0, canvas.width, canvas.height);
            } else {
                ctx.fillStyle = this.gapColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            var self = this;
            var scale = 1;

            this.cells.forEach(function (cell, index) {
                if (self.cellImages[index]) {
                    var img = self.cellImages[index].img;
                    var cellImg = self.cellImages[index];

                    var cellCanvas = document.createElement('canvas');
                    cellCanvas.width = cell.width;
                    cellCanvas.height = cell.height;
                    var cellCtx = cellCanvas.getContext('2d');

                    cellCtx.fillStyle = self.gapColor;
                    cellCtx.fillRect(0, 0, cell.width, cell.height);

                    if (self.borderRadius > 0) {
                        cellCtx.save();
                        cellCtx.beginPath();
                        cellCtx.roundRect(0, 0, cell.width, cell.height, self.borderRadius);
                        cellCtx.clip();
                    }

                    cellCtx.drawImage(img, 0, 0, cell.width, cell.height);

                    if (self.borderRadius > 0) {
                        cellCtx.restore();
                    }

                    if (self.shadowEnabled) {
                        ctx.save();
                        ctx.shadowColor = self.shadowColor;
                        ctx.shadowBlur = self.shadowBlur * scale;
                        ctx.shadowOffsetX = self.shadowOffsetX * scale;
                        ctx.shadowOffsetY = self.shadowOffsetY * scale;
                    }

                    if (self.borderRadius > 0) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.roundRect(
                            cell.x * scale,
                            cell.y * scale,
                            cell.width * scale,
                            cell.height * scale,
                            self.borderRadius * scale
                        );
                        ctx.clip();
                    }

                    ctx.drawImage(
                        cellCanvas,
                        cell.x * scale,
                        cell.y * scale,
                        cell.width * scale,
                        cell.height * scale
                    );

                    if (self.shadowEnabled) {
                        ctx.restore();
                    }

                    if (self.borderRadius > 0) {
                        ctx.restore();
                    }
                }
            });
            
            // 渲染自定义模板
            this.customCells.forEach(function (cell) {
                if (cell.imageData && cell.imageData.img) {
                    var img = cell.imageData.img;
                    
                    var cellCanvas = document.createElement('canvas');
                    cellCanvas.width = cell.width;
                    cellCanvas.height = cell.height;
                    var cellCtx = cellCanvas.getContext('2d');
                    
                    cellCtx.fillStyle = self.gapColor;
                    cellCtx.fillRect(0, 0, cell.width, cell.height);
                    
                    // 根据形状裁剪
                    if (cell.shape === 'circle' || cell.shape === 'ellipse') {
                        cellCtx.save();
                        cellCtx.beginPath();
                        cellCtx.ellipse(cell.width / 2, cell.height / 2, cell.width / 2, cell.height / 2, 0, 0, Math.PI * 2);
                        cellCtx.clip();
                    } else if (cell.shape === 'rounded-rect') {
                        cellCtx.save();
                        cellCtx.beginPath();
                        cellCtx.roundRect(0, 0, cell.width, cell.height, 20);
                        cellCtx.clip();
                    } else if (cell.shape === 'triangle') {
                        cellCtx.save();
                        cellCtx.beginPath();
                        cellCtx.moveTo(cell.width / 2, 0);
                        cellCtx.lineTo(0, cell.height);
                        cellCtx.lineTo(cell.width, cell.height);
                        cellCtx.closePath();
                        cellCtx.clip();
                    } else if (cell.shape === 'star') {
                        cellCtx.save();
                        cellCtx.beginPath();
                        var cx = cell.width / 2, cy = cell.height / 2;
                        var outerR = Math.min(cell.width, cell.height) / 2;
                        var innerR = outerR * 0.4;
                        for (var i = 0; i < 10; i++) {
                            var r = i % 2 === 0 ? outerR : innerR;
                            var angle = (i * Math.PI / 5) - Math.PI / 2;
                            var x = cx + r * Math.cos(angle);
                            var y = cy + r * Math.sin(angle);
                            if (i === 0) cellCtx.moveTo(x, y);
                            else cellCtx.lineTo(x, y);
                        }
                        cellCtx.closePath();
                        cellCtx.clip();
                    }
                    
                    cellCtx.drawImage(img, 0, 0, cell.width, cell.height);
                    
                    if (cell.shape !== 'rect' && cell.shape !== 'square') {
                        cellCtx.restore();
                    }
                    
                    if (self.shadowEnabled) {
                        ctx.save();
                        ctx.shadowColor = self.shadowColor;
                        ctx.shadowBlur = self.shadowBlur * scale;
                        ctx.shadowOffsetX = self.shadowOffsetX * scale;
                        ctx.shadowOffsetY = self.shadowOffsetY * scale;
                    }
                    
                    // 应用旋转到导出
                    if (cell.rotation) {
                        ctx.save();
                        ctx.translate((cell.x + cell.width / 2) * scale, (cell.y + cell.height / 2) * scale);
                        ctx.rotate((cell.rotation * Math.PI) / 180);
                        ctx.translate(-(cell.x + cell.width / 2) * scale, -(cell.y + cell.height / 2) * scale);
                    }
                    
                    ctx.drawImage(
                        cellCanvas,
                        cell.x * scale,
                        cell.y * scale,
                        cell.width * scale,
                        cell.height * scale
                    );
                    
                    if (self.shadowEnabled) {
                        ctx.restore();
                    }
                    
                    if (cell.rotation) {
                        ctx.restore();
                    }
                }
            });

            var dataUrl = canvas.toDataURL('image/png');
            var link = document.createElement('a');
            link.download = 'puzzle_' + Date.now() + '.png';
            link.href = dataUrl;
            link.click();

            App.showToast(App.i18n.t('puzzle.exported'));
        },

        setGap: function (gap) {
            this.gap = gap;
            if (this.currentTemplate) {
                this.selectTemplate(this.currentTemplate);
            }
        },

        setGapColor: function (color) {
            this.gapColor = color;
            if (this.currentTemplate) {
                this.renderPuzzleGrid();
            }
        },

        setCanvasSize: function (width, height) {
            this.canvasWidth = width;
            this.canvasHeight = height;
            this.canvasSizeSet = true;
            
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, width, height);
            
            var img = new Image();
            img.onload = function() {
                var pencilCanvas = document.createElement('canvas');
                pencilCanvas.width = width;
                pencilCanvas.height = height;
                
                var imageObj = {
                    id: 'img_' + App.state.nextImageId++,
                    name: App.i18n.t('puzzle.canvas_name'),
                    img: img,
                    width: width,
                    height: height,
                    objects: [],
                    _lastZoom: 100,
                    _origW: width,
                    _origH: height,
                    _prevW: width,
                    _prevH: height,
                    pencilCanvas: pencilCanvas,
                    _puzzleState: {
                        currentTemplate: null,
                        cells: [],
                        cellImages: {},
                        canvasSizeSet: false,
                        customCells: []
                    }
                };
                
                App.state.images.push(imageObj);
                App.Images.switchImage(imageObj.id);
                App.Images.fitToView();
                setTimeout(function () {
                    if (App.History) App.History.initForImage(imageObj);
                }, 10);
            };
            img.src = canvas.toDataURL('image/png');
        },

        setBorderRadius: function (radius) {
            this.borderRadius = radius;
            if (this.currentTemplate) {
                this.renderPuzzleGrid();
            }
        },

        setShadowEnabled: function (enabled) {
            this.shadowEnabled = enabled;
            if (this.currentTemplate) {
                this.renderPuzzleGrid();
            }
        },

        setShadowColor: function (color) {
            this.shadowColor = color;
            if (this.currentTemplate) {
                this.renderPuzzleGrid();
            }
        },

        setShadowBlur: function (blur) {
            this.shadowBlur = blur;
            if (this.currentTemplate) {
                this.renderPuzzleGrid();
            }
        },

        setShadowOffsetX: function (offset) {
            this.shadowOffsetX = offset;
            if (this.currentTemplate) {
                this.renderPuzzleGrid();
            }
        },

        setShadowOffsetY: function (offset) {
            this.shadowOffsetY = offset;
            if (this.currentTemplate) {
                this.renderPuzzleGrid();
            }
        },

        setCustomCols: function (cols) {
            this.customCols = cols;
        },

        setCustomRows: function (rows) {
            this.customRows = rows;
        },

        setCellRatio: function (ratio) {
            this.cellRatio = ratio;
        }
    };

    App.Puzzle = Puzzle;
})();