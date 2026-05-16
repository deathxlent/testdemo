const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const controlsSection = document.getElementById('controlsSection');
const previewSection = document.getElementById('previewSection');
const colorStatsSection = document.getElementById('colorStatsSection');
const pixelWidthInput = document.getElementById('pixelWidth');
const pixelWidthSlider = document.getElementById('pixelWidthSlider');
const showGridCheckbox = document.getElementById('showGrid');
const startBtn = document.getElementById('startBtn');
const originalCanvas = document.getElementById('originalCanvas');
const pixelatedCanvas = document.getElementById('pixelatedCanvas');
const pixelSizeInfo = document.getElementById('pixelSizeInfo');
const colorCount = document.getElementById('colorCount');
const colorPalette = document.getElementById('colorPalette');
const colorTableBody = document.getElementById('colorTableBody');

const originalCtx = originalCanvas.getContext('2d');
const pixelatedCtx = pixelatedCanvas.getContext('2d');

let originalImage = null;
let currentPixelData = null;
let currentTargetWidth = 0;
let currentTargetHeight = 0;

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
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            controlsSection.style.display = 'flex';
            previewSection.style.display = 'block';
            
            const maxWidth = 500;
            const ratio = Math.min(maxWidth / img.width, 1);
            const displayWidth = img.width * ratio;
            const displayHeight = img.height * ratio;
            
            originalCanvas.width = displayWidth;
            originalCanvas.height = displayHeight;
            pixelatedCanvas.width = displayWidth;
            pixelatedCanvas.height = displayHeight;
            
            originalCtx.drawImage(img, 0, 0, displayWidth, displayHeight);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

showGridCheckbox.addEventListener('change', () => {
    if (currentPixelData) {
        redrawPixelatedImage();
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
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    
    tempCtx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);
    
    const pixelatedData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
    currentPixelData = pixelatedData;
    
    calculateColorStats(pixelatedData, targetWidth, targetHeight);
    
    colorStatsSection.style.display = 'block';
    
    redrawPixelatedImage();
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
        drawGrid(pixelSizeX, pixelSizeY);
    }
}

function drawGrid(pixelSizeX, pixelSizeY) {
    const gridStep = 5;
    const canvasWidth = pixelatedCanvas.width;
    const canvasHeight = pixelatedCanvas.height;
    
    pixelatedCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    pixelatedCtx.lineWidth = 1;
    pixelatedCtx.font = '10px Arial';
    pixelatedCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    pixelatedCtx.textAlign = 'center';
    pixelatedCtx.textBaseline = 'middle';
    
    for (let x = 0; x <= currentTargetWidth; x += gridStep) {
        const posX = x * pixelSizeX;
        pixelatedCtx.beginPath();
        pixelatedCtx.moveTo(posX, 0);
        pixelatedCtx.lineTo(posX, canvasHeight);
        pixelatedCtx.stroke();
        
        if (x < currentTargetWidth) {
            pixelatedCtx.fillText(x.toString(), posX + (gridStep * pixelSizeX) / 2, 8);
        }
    }
    
    pixelatedCtx.textAlign = 'left';
    for (let y = 0; y <= currentTargetHeight; y += gridStep) {
        const posY = y * pixelSizeY;
        pixelatedCtx.beginPath();
        pixelatedCtx.moveTo(0, posY);
        pixelatedCtx.lineTo(canvasWidth, posY);
        pixelatedCtx.stroke();
        
        if (y < currentTargetHeight) {
            pixelatedCtx.fillText(y.toString(), 2, posY + (gridStep * pixelSizeY) / 2);
        }
    }
}

function calculateColorStats(pixelData, width, height) {
    const colorMap = new Map();
    const totalPixels = width * height;
    
    for (let i = 0; i < pixelData.data.length; i += 4) {
        const r = pixelData.data[i];
        const g = pixelData.data[i + 1];
        const b = pixelData.data[i + 2];
        const colorKey = `${r},${g},${b}`;
        
        if (colorMap.has(colorKey)) {
            colorMap.set(colorKey, colorMap.get(colorKey) + 1);
        } else {
            colorMap.set(colorKey, 1);
        }
    }
    
    const colorArray = Array.from(colorMap.entries()).map(([key, count]) => {
        const [r, g, b] = key.split(',').map(Number);
        return { r, g, b, count, percentage: (count / totalPixels * 100).toFixed(2) };
    });
    
    colorArray.sort((a, b) => b.count - a.count);
    
    colorCount.textContent = colorArray.length;
    
    displayColorPalette(colorArray);
    displayColorTable(colorArray);
}

function displayColorPalette(colors) {
    colorPalette.innerHTML = '';
    
    colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = `rgb(${color.r},${color.g},${color.b})`;
        swatch.title = `RGB(${color.r}, ${color.g}, ${color.b}) - ${color.count} pixels (${color.percentage}%)`;
        colorPalette.appendChild(swatch);
    });
}

function displayColorTable(colors) {
    colorTableBody.innerHTML = '';
    
    colors.forEach(color => {
        const row = document.createElement('tr');
        
        const colorCell = document.createElement('td');
        colorCell.className = 'color-cell';
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = `rgb(${color.r},${color.g},${color.b})`;
        colorCell.appendChild(swatch);
        
        const rgbCell = document.createElement('td');
        rgbCell.textContent = `${color.r}, ${color.g}, ${color.b}`;
        
        const countCell = document.createElement('td');
        countCell.textContent = color.count;
        
        const percentCell = document.createElement('td');
        percentCell.textContent = `${color.percentage}%`;
        
        row.appendChild(colorCell);
        row.appendChild(rgbCell);
        row.appendChild(countCell);
        row.appendChild(percentCell);
        
        colorTableBody.appendChild(row);
    });
}