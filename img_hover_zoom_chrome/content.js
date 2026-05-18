let isEnabled = true;
let previewElement = null;
let currentImage = null;

chrome.storage.sync.get({ enabled: true }, (result) => {
  isEnabled = result.enabled;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.enabled) {
    isEnabled = changes.enabled.newValue;
    if (!isEnabled && previewElement) {
      removePreview();
    }
  }
});

function createPreview() {
  if (!previewElement) {
    previewElement = document.createElement('div');
    previewElement.id = 'img-hover-zoom-preview';
    previewElement.style.cssText = `
      position: fixed;
      z-index: 2147483647;
      pointer-events: none;
      border: 2px solid #333;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      background: #fff;
      display: none;
      max-width: 90vw;
      max-height: 90vh;
    `;
    document.body.appendChild(previewElement);
  }
  return previewElement;
}

function removePreview() {
  if (previewElement) {
    previewElement.style.display = 'none';
    previewElement.innerHTML = '';
  }
  currentImage = null;
}

function calculatePreviewSize(imgNaturalWidth, imgNaturalHeight) {
  const screenHalfWidth = window.innerWidth / 2;
  const screenHalfHeight = window.innerHeight / 2;
  
  const needZoomOut = imgNaturalWidth > screenHalfWidth || imgNaturalHeight > screenHalfHeight;
  
  let targetWidth, targetHeight;
  
  if (needZoomOut) {
    const widthRatio = screenHalfWidth / imgNaturalWidth;
    const heightRatio = screenHalfHeight / imgNaturalHeight;
    const ratio = Math.min(widthRatio, heightRatio, 1);
    targetWidth = imgNaturalWidth * ratio;
    targetHeight = imgNaturalHeight * ratio;
  } else {
    const widthRatio = screenHalfWidth / imgNaturalWidth;
    const heightRatio = screenHalfHeight / imgNaturalHeight;
    const ratio = Math.min(widthRatio, heightRatio, 4);
    targetWidth = imgNaturalWidth * ratio;
    targetHeight = imgNaturalHeight * ratio;
  }
  
  return { width: Math.round(targetWidth), height: Math.round(targetHeight), needZoomOut };
}

function calculatePosition(imgRect, previewWidth, previewHeight) {
  const margin = 20;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  let left = imgRect.right + margin;
  let top = imgRect.top;
  
  if (left + previewWidth > windowWidth - margin) {
    left = imgRect.left - previewWidth - margin;
  }
  
  if (left < margin) {
    left = Math.min(imgRect.left, windowWidth - previewWidth - margin);
  }
  
  if (top + previewHeight > windowHeight - margin) {
    top = windowHeight - previewHeight - margin;
  }
  
  if (top < margin) {
    top = margin;
  }
  
  return { left, top };
}

function handleMouseOver(e) {
  if (!isEnabled) return;
  
  const img = e.target.closest('img');
  if (!img || img === currentImage) return;
  
  if (img.offsetWidth < 30 || img.offsetHeight < 30) return;
  
  currentImage = img;
  
  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;
  
  if (naturalWidth === 0 || naturalHeight === 0) return;
  
  const { width, height, needZoomOut } = calculatePreviewSize(naturalWidth, naturalHeight);
  
  const imgRect = img.getBoundingClientRect();
  const { left, top } = calculatePosition(imgRect, width, height);
  
  const preview = createPreview();
  preview.innerHTML = '';
  
  const previewImg = document.createElement('img');
  previewImg.src = img.src;
  previewImg.srcset = img.srcset || '';
  previewImg.alt = img.alt || '';
  previewImg.style.cssText = `
    width: ${width}px;
    height: ${height}px;
    display: block;
    object-fit: contain;
  `;
  
  const label = document.createElement('div');
  label.style.cssText = `
    position: absolute;
    top: 4px;
    left: 4px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-family: Arial, sans-serif;
  `;
  label.textContent = needZoomOut ? '缩小显示' : '放大显示';
  
  preview.style.width = `${width}px`;
  preview.style.height = `${height}px`;
  preview.style.left = `${left}px`;
  preview.style.top = `${top}px`;
  preview.style.display = 'block';
  
  preview.appendChild(previewImg);
  preview.appendChild(label);
}

function handleMouseOut(e) {
  if (!previewElement) return;
  
  const relatedTarget = e.relatedTarget;
  if (relatedTarget && previewElement.contains(relatedTarget)) return;
  
  const img = e.target.closest('img');
  if (img && img === currentImage) {
    removePreview();
  }
}

document.addEventListener('mouseover', handleMouseOver, true);
document.addEventListener('mouseout', handleMouseOut, true);
