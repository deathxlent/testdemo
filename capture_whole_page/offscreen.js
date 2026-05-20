chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'mergeImages') {
    mergeImages(message.data)
      .then(dataUrl => sendResponse({ success: true, dataUrl }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function mergeImages({ captures, pageWidth, pageHeight, viewportWidth, viewportHeight }) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const firstImg = await loadImage(captures[0].dataUrl);
  const scale = Math.min(2, firstImg.width / viewportWidth);

  canvas.width = pageWidth * scale;
  canvas.height = pageHeight * scale;

  for (const capture of captures) {
    const img = await loadImage(capture.dataUrl);
    const drawWidth = Math.min(viewportWidth, pageWidth - capture.scrollX) * scale;
    const drawHeight = Math.min(viewportHeight, pageHeight - capture.scrollY) * scale;
    ctx.drawImage(img, 0, 0, drawWidth, drawHeight, capture.scrollX * scale, capture.scrollY * scale, drawWidth, drawHeight);
  }

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
