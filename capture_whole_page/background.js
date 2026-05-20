let isCapturing = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureFullPage') {
    if (isCapturing) {
      sendResponse({ success: false, error: '正在截图中，请稍候...' });
      return;
    }
    captureFullPage(message.tabId)
      .then(dataUrl => sendResponse({ success: true, dataUrl }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function captureFullPage(tabId) {
  isCapturing = true;
  try {
    const [originalScrollX, originalScrollY, pageWidth, pageHeight, viewportWidth, viewportHeight] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const body = document.body;
        const html = document.documentElement;
        const pageWidth = Math.max(
          body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth
        );
        const pageHeight = Math.max(
          body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight
        );
        return [window.scrollX, window.scrollY, pageWidth, pageHeight, window.innerWidth, window.innerHeight];
      }
    }).then(results => results[0].result);

    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const overlay = document.createElement('div');
        overlay.id = 'capture-overlay-extension';
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: white;
          z-index: 999999;
          opacity: 0;
        `;
        document.body.appendChild(overlay);
      }
    });

    const columns = Math.ceil(pageWidth / viewportWidth);
    const rows = Math.ceil(pageHeight / viewportHeight);
    const captures = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const scrollX = col * viewportWidth;
        const scrollY = row * viewportHeight;

        await chrome.scripting.executeScript({
          target: { tabId },
          func: (x, y) => window.scrollTo(x, y),
          args: [scrollX, scrollY]
        });

        await new Promise(resolve => setTimeout(resolve, 150));

        const dataUrl = await chrome.tabs.captureVisibleTab(tabId, { format: 'png' });
        captures.push({ scrollX, scrollY, dataUrl });
      }
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (x, y) => {
        window.scrollTo(x, y);
        const overlay = document.getElementById('capture-overlay-extension');
        if (overlay) overlay.remove();
      },
      args: [originalScrollX, originalScrollY]
    });

    await setupOffscreenDocument();

    const response = await chrome.runtime.sendMessage({
      action: 'mergeImages',
      data: { captures, pageWidth, pageHeight, viewportWidth, viewportHeight }
    });

    if (!response.success) {
      throw new Error(response.error || '图片合并失败');
    }

    return response.dataUrl;
  } finally {
    isCapturing = false;
  }
}

async function setupOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['DOM_PARSER'],
    justification: '用于合并截图图片'
  });
}
