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
            
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result;
                
                chrome.storage.local.set({ pixelateImage: base64data }, () => {
                    chrome.action.openPopup();
                });
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('处理图片失败:', error);
        }
    }
});
