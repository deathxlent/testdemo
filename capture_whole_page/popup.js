document.getElementById('captureBtn').addEventListener('click', async () => {
  const btn = document.getElementById('captureBtn');
  const status = document.getElementById('status');

  btn.disabled = true;
  status.innerHTML = '<span class="spinner"></span>正在截取整页...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const dataUrl = await captureFullPage(tab.id);

    status.textContent = '截图完成，正在下载...';

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${timestamp}.png`;

    await chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: true
    });

    status.textContent = '✓ 截图保存成功！';
    setTimeout(() => window.close(), 1500);
  } catch (error) {
    status.textContent = '❌ ' + error.message;
    btn.disabled = false;
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
      `;
      document.body.appendChild(overlay);
    }
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const firstCapture = await chrome.tabs.captureVisibleTab(tabId, { format: 'png' });
  const firstImg = await loadImage(firstCapture);
  const scale = Math.min(2, firstImg.width / viewportWidth);

  canvas.width = pageWidth * scale;
  canvas.height = pageHeight * scale;

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

      await new Promise(resolve => setTimeout(resolve, 150));

      const dataUrl = await chrome.tabs.captureVisibleTab(tabId, { format: 'png' });
      const img = await loadImage(dataUrl);

      const drawWidth = Math.min(viewportWidth, pageWidth - scrollX) * scale;
      const drawHeight = Math.min(viewportHeight, pageHeight - scrollY) * scale;
      ctx.drawImage(img, 0, 0, drawWidth, drawHeight, scrollX * scale, scrollY * scale, drawWidth, drawHeight);
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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
