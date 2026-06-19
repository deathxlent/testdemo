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
            } else {
                iconSvg = '<svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="14" height="14" rx="2"/><path d="M2 13l4-4 3 3 2-2 5 5"/><circle cx="7" cy="6" r="1.5"/></svg>';
                label = obj.name || '水印';
            }

            item.innerHTML =
                '<div class="object-icon">' + iconSvg + '</div>' +
                '<div class="object-name" title="' + App.escapeHtml(label) + '">' + App.escapeHtml(label) + '</div>' +
                '<div class="object-actions">' +
                    '<button class="object-btn" data-action="up" title="上移一层">\u2191</button>' +
                    '<button class="object-btn" data-action="down" title="下移一层">\u2193</button>' +
                    '<button class="object-btn" data-action="delete" title="删除">\u2715</button>' +
                '</div>';

            item.addEventListener('click', function (e) {
                if (e.target.classList.contains('object-btn')) return;
                App.Text.selectObject(obj.id);
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

    function handleObjectAction(id, action) {
        switch (action) {
            case 'delete':
                App.Text.deleteObject(id);
                break;
            case 'up':
                App.Watermark.moveLayer(1);
                break;
            case 'down':
                App.Watermark.moveLayer(-1);
                break;
        }
    }

    App.Objects = {
        renderObjectList: renderObjectList,
        handleObjectAction: handleObjectAction
    };
})();
