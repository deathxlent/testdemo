const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const controlsSection = document.getElementById('controlsSection');
const previewSection = document.getElementById('previewSection');
const pixelWidthInput = document.getElementById('pixelWidth');
const pixelWidthSlider = document.getElementById('pixelWidthSlider');
const showGridCheckbox = document.getElementById('showGrid');
const startBtn = document.getElementById('startBtn');
const originalCanvas = document.getElementById('originalCanvas');
const pixelatedCanvas = document.getElementById('pixelatedCanvas');
const beadCanvas = document.getElementById('beadCanvas');
const pixelSizeInfo = document.getElementById('pixelSizeInfo');
const beadSizeInfo = document.getElementById('beadSizeInfo');

const originalCtx = originalCanvas.getContext('2d');
const pixelatedCtx = pixelatedCanvas.getContext('2d');
const beadCtx = beadCanvas.getContext('2d');

let originalImage = null;
let currentPixelData = null;
let currentTargetWidth = 0;
let currentTargetHeight = 0;
let beadColors = [];

async function loadBeadColors() {
    try {
        const response = await fetch(chrome.runtime.getURL('bead_color.json'));
        const data = await response.json();
        beadColors = Object.entries(data).map(([name, hex]) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { name, r, g, b, hex };
        });
    } catch (error) {
        console.error('加载拼豆颜色失败:', error);
    }
}

loadBeadColors();

function findClosestBeadColor(r, g, b) {
    let closestColor = null;
    let minDistance = Infinity;

    for (const color of beadColors) {
        const distance = Math.sqrt(
            Math.pow(r - color.r, 2) +
            Math.pow(g - color.g, 2) +
            Math.pow(b - color.b, 2)
        );
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = color;
        }
    }

    return closestColor;
}

pixelWidthSlider.addEventListener('input', (e) => {
    pixelWidthInput.value = e.target.value;
});

pixelWidthInput.addEventListener('input', (e) => {
    let value = parseInt(e.target.value);
    if (value < 8) value = 8;
    if (value > 200) value = 200;
    pixelWidthSlider.value = value;
    e.target.value = value;
});

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        alert('请上传JPG或PNG格式的图片');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        loadImage(e.target.result);
    };
    reader.readAsDataURL(file);
}

function loadImage(imageSrc) {
    const img = new Image();
    img.onload = () => {
        originalImage = img;
        controlsSection.style.display = 'flex';
        previewSection.style.display = 'block';
        
        const maxWidth = 300;
        const ratio = Math.min(maxWidth / img.width, 1);
        const displayWidth = img.width * ratio;
        const displayHeight = img.height * ratio;
        
        originalCanvas.width = displayWidth;
        originalCanvas.height = displayHeight;
        pixelatedCanvas.width = displayWidth;
        pixelatedCanvas.height = displayHeight;
        beadCanvas.width = displayWidth;
        beadCanvas.height = displayHeight;
        
        originalCtx.drawImage(img, 0, 0, displayWidth, displayHeight);
    };
    img.src = imageSrc;
}

showGridCheckbox.addEventListener('change', () => {
    if (currentPixelData) {
        redrawPixelatedImage();
        redrawBeadImage();
    }
});

startBtn.addEventListener('click', () => {
    if (!originalImage) return;
    
    const pixelWidth = parseInt(pixelWidthInput.value);
    if (pixelWidth < 8 || pixelWidth > 200) {
        alert('宽度请在8-200之间');
        return;
    }
    
    pixelateImage(pixelWidth);
});

function pixelateImage(targetWidth) {
    const ratio = originalImage.height / originalImage.width;
    const targetHeight = Math.round(targetWidth * ratio);
    
    currentTargetWidth = targetWidth;
    currentTargetHeight = targetHeight;
    
    pixelSizeInfo.textContent = `${targetWidth} × ${targetHeight}`;
    beadSizeInfo.textContent = `${targetWidth} × ${targetHeight}`;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    
    tempCtx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);
    
    const pixelatedData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
    currentPixelData = pixelatedData;
    
    redrawPixelatedImage();
    redrawBeadImage();
}

function redrawPixelatedImage() {
    const outputCanvas = document.createElement('canvas');
    const outputCtx = outputCanvas.getContext('2d');
    
    outputCanvas.width = originalCanvas.width;
    outputCanvas.height = originalCanvas.height;
    
    const pixelSizeX = originalCanvas.width / currentTargetWidth;
    const pixelSizeY = originalCanvas.height / currentTargetHeight;
    
    for (let y = 0; y < currentTargetHeight; y++) {
        for (let x = 0; x < currentTargetWidth; x++) {
            const index = (y * currentTargetWidth + x) * 4;
            const r = currentPixelData.data[index];
            const g = currentPixelData.data[index + 1];
            const b = currentPixelData.data[index + 2];
            const a = currentPixelData.data[index + 3];
            
            outputCtx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
            outputCtx.fillRect(
                x * pixelSizeX,
                y * pixelSizeY,
                pixelSizeX,
                pixelSizeY
            );
        }
    }
    
    pixelatedCtx.drawImage(outputCanvas, 0, 0);
    
    if (showGridCheckbox.checked) {
        drawGrid(pixelatedCtx, pixelSizeX, pixelSizeY);
    }
}

function redrawBeadImage() {
    const outputCanvas = document.createElement('canvas');
    const outputCtx = outputCanvas.getContext('2d');
    
    outputCanvas.width = beadCanvas.width;
    outputCanvas.height = beadCanvas.height;
    
    const pixelSizeX = beadCanvas.width / currentTargetWidth;
    const pixelSizeY = beadCanvas.height / currentTargetHeight;
    
    for (let y = 0; y < currentTargetHeight; y++) {
        for (let x = 0; x < currentTargetWidth; x++) {
            const index = (y * currentTargetWidth + x) * 4;
            const r = currentPixelData.data[index];
            const g = currentPixelData.data[index + 1];
            const b = currentPixelData.data[index + 2];
            
            const closestColor = findClosestBeadColor(r, g, b);
            
            outputCtx.fillStyle = closestColor.hex;
            outputCtx.fillRect(
                x * pixelSizeX,
                y * pixelSizeY,
                pixelSizeX,
                pixelSizeY
            );
        }
    }
    
    beadCtx.drawImage(outputCanvas, 0, 0);
    
    if (showGridCheckbox.checked) {
        drawGrid(beadCtx, pixelSizeX, pixelSizeY);
    }
}

function drawGrid(ctx, pixelSizeX, pixelSizeY) {
    const gridStep = 5;
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.font = '10px Arial';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let x = 0; x <= currentTargetWidth; x += gridStep) {
        const posX = x * pixelSizeX;
        ctx.beginPath();
        ctx.moveTo(posX, 0);
        ctx.lineTo(posX, canvasHeight);
        ctx.stroke();
        
        if (x < currentTargetWidth) {
            ctx.fillText(x.toString(), posX + (gridStep * pixelSizeX) / 2, 8);
        }
    }
    
    ctx.textAlign = 'left';
    for (let y = 0; y <= currentTargetHeight; y += gridStep) {
        const posY = y * pixelSizeY;
        ctx.beginPath();
        ctx.moveTo(0, posY);
        ctx.lineTo(canvasWidth, posY);
        ctx.stroke();
        
        if (y < currentTargetHeight) {
            ctx.fillText(y.toString(), 2, posY + (gridStep * pixelSizeY) / 2);
        }
    }
}

chrome.storage.local.get('pixelateImage', (result) => {
    if (result.pixelateImage) {
        chrome.storage.local.remove('pixelateImage');
        loadImage(result.pixelateImage);
        
        setTimeout(() => {
            pixelateImage(32);
        }, 500);
    }
});
