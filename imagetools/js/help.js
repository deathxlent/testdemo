(function () {
    var tools = [
        { id: 'selectTool', name: 'help.tool_select', shortcut: 'V', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2l1-1 9 7.5L8 9l2.5 6.5-1.5.6L6.5 9.5 3 12V2z"/></svg>' },
        { id: 'textTool', name: 'help.tool_text', shortcut: 'T', icon: '<span style="font-weight:700;font-size:16px;font-family:serif">T</span>' },
        { id: 'watermarkTool', name: 'help.tool_watermark', shortcut: 'W', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="14" height="14" rx="2"/><path d="M2 13l4-4 3 3 2-2 5 5"/><circle cx="7" cy="6" r="1.5"/></svg>' },
        { id: 'resizeTool', name: 'help.tool_resize', shortcut: 'R', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 10V3h7M15 8v7H8M3 3l7 7M15 15L8 8"/></svg>' },
        { id: 'cropTool', name: 'help.tool_crop', shortcut: 'C', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 1h2v2H5zM1 5h2v2H1zM11 15h2v2h-2zM15 11h2v2h-2zM5 5h10v10H5z"/></svg>' },
        { id: 'rectCropTool', name: 'help.tool_rect_crop', shortcut: '', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="12" height="8" rx="0.5" stroke-dasharray="2,2"/><path d="M3 9h12M9 5v8"/></svg>' },
        { id: 'maskTool', name: 'help.tool_mask', shortcut: 'M', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="6"/><path d="M3 9h12M9 3v12M4.7 4.7l8.6 8.6M13.3 4.7L4.7 13.3"/></svg>' },
        { id: 'rotateTool', name: 'help.tool_rotate', shortcut: 'G', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 3v3l2.5-2L9 2z"/><path d="M15 9a6 6 0 11-2.5-4.9"/></svg>' },
        { id: 'mirrorHBtn', name: 'help.tool_mirror_h', shortcut: '', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 2v14M14 5l-3 4 3 4zM7 5l3 4-3 4z"/></svg>' },
        { id: 'mirrorVBtn', name: 'help.tool_mirror_v', shortcut: '', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 9h14M5 14l4-3 4 3zM5 7l4 3 4-3z"/></svg>' },
        { id: 'sharpenTool', name: 'help.tool_sharpen', shortcut: 'H', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 2l3 6 6 1-4.5 4 1 6L9 15l-5.5 4 1-6L0 9l6-1z"/></svg>' },
        { id: 'blurTool', name: 'help.tool_blur', shortcut: 'B', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="5" stroke-dasharray="2,2"/><path d="M6 6c.5-.5 1-.8 1.5-1M12 12c-.5.5-1 .8-1.5 1M5 12c.5-.5 1-.8 1.5-1M13 6c-.5.5-1 .8-1.5 1"/></svg>' },
        { id: 'mosaicTool', name: 'help.tool_mosaic', shortcut: '', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><rect x="2" y="2" width="4" height="4" opacity="0.7"/><rect x="7" y="2" width="4" height="4" opacity="0.9"/><rect x="12" y="2" width="4" height="4" opacity="0.5"/><rect x="2" y="7" width="4" height="4" opacity="0.4"/><rect x="7" y="7" width="4" height="4" opacity="0.8"/><rect x="12" y="7" width="4" height="4" opacity="0.6"/><rect x="2" y="12" width="4" height="4" opacity="0.9"/><rect x="7" y="12" width="4" height="4" opacity="0.5"/><rect x="12" y="12" width="4" height="4" opacity="0.7"/></svg>' },
        { id: 'negativeTool', name: 'help.tool_negative', shortcut: 'N', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="2" width="12" height="14" rx="1" fill="currentColor" fill-opacity="0.08"/><path d="M3 9h12"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>' },
        { id: 'hslTool', name: 'help.tool_hsl', shortcut: '', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="6"/><circle cx="9" cy="9" r="2.5" stroke-dasharray="1.5,1.5"/></svg>' },
        { id: 'curveTool', name: 'help.tool_curve', shortcut: '', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="14" height="14" rx="1"/><path d="M3 15L12 3" stroke-dasharray="2,1"/><path d="M3 15c2-5 4-9 12-12"/></svg>' },
        { id: 'balanceTool', name: 'help.tool_balance', shortcut: '', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="6"/><circle cx="6" cy="11" r="2" fill="#f44" opacity="0.6"/><circle cx="12" cy="11" r="2" fill="#4f4" opacity="0.6"/><circle cx="9" cy="6" r="2" fill="#44f" opacity="0.6"/></svg>' },
        { id: 'localZoomTool', name: 'help.tool_local_zoom', shortcut: '', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="7" height="7" rx="1"/><rect x="10" y="7" width="6" height="8" rx="1"/><path d="M9 6l3 4M7 10l4 2"/></svg>' },
        { id: 'selectionTool', name: 'help.tool_selection', shortcut: '', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="12" height="12" rx="1" stroke-dasharray="2,2"/><circle cx="9" cy="9" r="3"/><path d="M6 6l6 6M12 6l-6 6"/></svg>' },
        { id: 'pencilTool', name: 'help.tool_pencil', shortcut: 'P', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 16l3-1L14 6l-2-2L3 13l-1 3z"/><path d="M12 4l2 2"/></svg>' },
        { id: 'batchTool', name: 'help.tool_batch', shortcut: '', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="6" height="8" rx="1"/><rect x="10" y="4" width="6" height="8" rx="1"/><rect x="6" y="2" width="6" height="8" rx="1" opacity="0.5"/><rect x="6" y="8" width="6" height="8" rx="1"/></svg>' },
        { id: 'puzzleTool', name: 'help.tool_puzzle', shortcut: '', icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="5" height="5" rx="0.5"/><rect x="11" y="2" width="5" height="5" rx="0.5"/><rect x="2" y="11" width="5" height="5" rx="0.5"/><rect x="11" y="11" width="5" height="5" rx="0.5"/></svg>' },
    ];

    var shortcuts = [
        { keys: ['Ctrl', 'Z'], desc: 'help.shortcut_undo' },
        { keys: ['Ctrl', 'Shift', 'Z'], desc: 'help.shortcut_redo' },
        { keys: ['Ctrl', 'S'], desc: 'help.shortcut_export' },
        { keys: ['Ctrl', 'O'], desc: 'help.shortcut_open' },
        { keys: ['Ctrl', 'I'], desc: 'help.shortcut_info' },
        { keys: ['Ctrl', 'C'], desc: 'help.shortcut_copy' },
        { keys: ['Ctrl', 'V'], desc: 'help.shortcut_paste' },
        { keys: ['V'], desc: 'help.shortcut_select' },
        { keys: ['T'], desc: 'help.shortcut_text' },
        { keys: ['W'], desc: 'help.shortcut_watermark' },
        { keys: ['R'], desc: 'help.shortcut_resize' },
        { keys: ['C'], desc: 'help.shortcut_crop' },
        { keys: ['M'], desc: 'help.shortcut_mask' },
        { keys: ['G'], desc: 'help.shortcut_rotate' },
        { keys: ['H'], desc: 'help.shortcut_sharpen' },
        { keys: ['B'], desc: 'help.shortcut_blur' },
        { keys: ['N'], desc: 'help.shortcut_negative' },
        { keys: ['P'], desc: 'help.shortcut_pencil' },
        { keys: ['E'], desc: 'help.shortcut_beautify' },
        { keys: ['Delete'], desc: 'help.shortcut_delete' },
        { keys: ['Escape'], desc: 'help.shortcut_escape' },
    ];

    function showHelp() {
        var dialog = document.createElement('div');
        dialog.className = 'help-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content" style="width: 600px; max-height: 80vh;">
                <div class="dialog-header">
                    <span>` + App.i18n.t('help.title') + `</span>
                    <button class="dialog-close">&times;</button>
                </div>
                <div class="dialog-body" style="display: flex; gap: 20px;">
                    <div class="help-tools">
                        <h3>` + App.i18n.t('help.tools_title') + `</h3>
                        <div class="tools-grid">
                            ${tools.map(function (t) {
                                return `
                                    <div class="tool-item">
                                        <div class="tool-icon-wrap">${t.icon}</div>
                                        <div class="tool-name">` + App.i18n.t(t.name) + `</div>
                                        ${t.shortcut ? `<div class="tool-shortcut">${t.shortcut}</div>` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <div class="help-shortcuts">
                        <h3>` + App.i18n.t('help.shortcuts_title') + `</h3>
                        <div class="shortcuts-list">
                            ${shortcuts.map(function (s) {
                                return `
                                    <div class="shortcut-item">
                                        <div class="shortcut-keys">
                                            ${s.keys.map(function (k) {
                                                return `<span class="key">${k}</span>`;
                                            }).join('')}
                                        </div>
                                        <div class="shortcut-desc">` + App.i18n.t(s.desc) + `</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn-confirm">` + App.i18n.t('dialog.close') + `</button>
                </div>
            </div>
        `;
        dialog.querySelector('.dialog-overlay').addEventListener('click', function () {
            dialog.remove();
        });
        dialog.querySelector('.dialog-close').addEventListener('click', function (e) {
            e.stopPropagation();
            dialog.remove();
        });
        dialog.querySelector('.btn-confirm').addEventListener('click', function () {
            dialog.remove();
        });
        document.body.appendChild(dialog);
    }

    function setupEvents() {
        var helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', showHelp);
        }
        
        var langBtn = document.getElementById('langSwitchBtn');
        if (langBtn && App.i18n) {
            langBtn.addEventListener('click', function() {
                var currentLang = App.i18n.getLang();
                var newLang = currentLang === 'zh' ? 'en' : 'zh';
                App.i18n.setLang(newLang);
            });
        }
    }

    App.Help = {
        showHelp: showHelp,
        setupEvents: setupEvents
    };
})();