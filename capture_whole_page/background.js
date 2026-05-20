chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureFullPage') {
    captureFullPage(message.tabId)
      .then(dataUrl => sendResponse({ success: true, dataUrl }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function captureFullPage(tabId) {
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
        transition: opacity 0.2s;
      `;
      document.body.appendChild(overlay);
    }
  });

  const canvas = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const scale = Math.min(2, img.width / viewportWidth);
      canvas.width = pageWidth * scale;
      canvas.height = pageHeight * scale;
      ctx.scale(scale, scale);
      
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = '';
  });

  const ctx = canvas.getContext('2d');
  const scale = canvas.width / pageWidth;

  const columns = Math.ceil(pageWidth / viewportWidth);
  const rows = Math.ceil(pageHeight / viewportHeight);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const scrollX = col * viewportWidth;
      const scrollY = row * viewportHeight;

      await chrome.scripting.executeScript({
        target: { tabId },
        func: (x, y) => window.scrollTo(x, y),
        args: [scrollX, scrollY]
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await chrome.tabs.captureVisibleTab(tabId, { format: 'png' });

      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = dataUrl;
      });

      const drawWidth = Math.min(viewportWidth, pageWidth - scrollX);
      const drawHeight = Math.min(viewportHeight, pageHeight - scrollY);
      ctx.drawImage(img, 0, 0, drawWidth * scale, drawHeight * scale, scrollX * scale, scrollY * scale, drawWidth * scale, drawHeight * scale);
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

  return canvas.toDataURL('image/png');
}
