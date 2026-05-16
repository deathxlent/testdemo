chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'pixelate-image',
        title: '像素化此图片',
        contexts: ['image']
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'pixelate-image') {
        try {
            const imageUrl = info.srcUrl;
            
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (url) => {
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.naturalWidth;
                            canvas.height = img.naturalHeight;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/png'));
                        };
                        img.onerror = () => {
                            resolve(null);
                        };
                        img.src = url;
                    });
                },
                args: [imageUrl]
            }).then((results) => {
                if (results[0].result) {
                    chrome.storage.local.set({ pixelateImage: results[0].result }, () => {
                        chrome.action.openPopup();
                    });
                } else {
                    console.error('无法获取图片数据');
                }
            }).catch((error) => {
                console.error('处理图片失败:', error);
            });
        } catch (error) {
            console.error('处理图片失败:', error);
        }
    }
});
