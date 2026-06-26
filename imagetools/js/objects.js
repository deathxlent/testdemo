(function () {
    function renderObjectList() {
        var els = App.els();
        var imgObj = App.getActiveImage();
        els.objectList.innerHTML = '';

        if (!imgObj) return;

        var list = imgObj.objects.slice().reverse();

        list.forEach(function (obj) {
            var item = document.createElement('div');
            item.className = 'object-item' + (obj.id === App.state.selectedObjId ? ' active' : '');
            item.dataset.id = obj.id;

            var iconSvg = '';
            var label = '';
            if (obj.type === 'text') {
                iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><text x="3" y="18" font-family="serif" font-weight="bold" font-size="20">T</text></svg>';
                label = obj.text;
            } else if (obj.type === 'localzoom') {
                iconSvg = '<svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="7" height="7" rx="1"/><rect x="10" y="7" width="6" height="8" rx="1"/><path d="M9 6l3 4M7 10l4 2"/></svg>';
                label = (obj.name || App.i18n.t('object.local_zoom')) + ' ' + obj.scale.toFixed(1) + '×';
            } else {
                iconSvg = '<svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="14" height="14" rx="2"/><path d="M2 13l4-4 3 3 2-2 5 5"/><circle cx="7" cy="6" r="1.5"/></svg>';
                label = obj.name || App.i18n.t('object.watermark');
            }

            item.innerHTML =
                '<div class="object-icon">' + iconSvg + '</div>' +
                '<div class="object-name" title="' + App.escapeHtml(label) + '">' + App.escapeHtml(label) + '</div>' +
                '<div class="object-actions">' +
                    '<button class="object-btn" data-action="up" title="' + App.i18n.t('js.move_up') + '">\u2191</button>' +
                    '<button class="object-btn" data-action="down" title="' + App.i18n.t('js.move_down') + '">\u2193</button>' +
                    '<button class="object-btn" data-action="delete" title="' + App.i18n.t('js.delete_obj') + '">\u2715</button>' +
                '</div>';

            item.addEventListener('click', function (e) {
                if (e.target.classList.contains('object-btn')) return;
                selectObject(obj.id);
            });

            item.querySelectorAll('.object-btn').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var action = btn.dataset.action;
                    handleObjectAction(obj.id, action);
                });
            });

            els.objectList.appendChild(item);
        });
    }

    function selectObject(id) {
        App.Text.selectObject(id);
    }

    function refreshList() {
        renderObjectList();
    }

    function moveLayer(imgObj, objId, delta) {
        var idx = imgObj.objects.findIndex(function (o) { return o.id === objId; });
        if (idx === -1) return;
        var target = idx + delta;
        if (target < 0 || target >= imgObj.objects.length) return;
        var arr = imgObj.objects;
        var tmp = arr[idx];
        arr[idx] = arr[target];
        arr[target] = tmp;
        App.trigger('objects:changed');
    }

    function handleObjectAction(id, action) {
        var imgObj = App.getActiveImage();
        if (!imgObj) return;
        switch (action) {
            case 'delete':
                App.Text.deleteObject(id);
                break;
            case 'up':
                moveLayer(imgObj, id, 1);
                break;
            case 'down':
                moveLayer(imgObj, id, -1);
                break;
        }
    }

    App.Objects = {
        renderObjectList: renderObjectList,
        handleObjectAction: handleObjectAction,
        selectObject: selectObject,
        refreshList: refreshList,
        moveLayer: moveLayer
    };
})();
