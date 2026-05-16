const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const controlsSection = document.getElementById('controlsSection');
const previewSection = document.getElementById('previewSection');
const colorStatsSection = document.getElementById('colorStatsSection');
const beadStatsSection = document.getElementById('beadStatsSection');
const pixelWidthInput = document.getElementById('pixelWidth');
const pixelWidthSlider = document.getElementById('pixelWidthSlider');
const showGridCheckbox = document.getElementById('showGrid');
const startBtn = document.getElementById('startBtn');
const originalCanvas = document.getElementById('originalCanvas');
const pixelatedCanvas = document.getElementById('pixelatedCanvas');
const beadCanvas = document.getElementById('beadCanvas');
const pixelSizeInfo = document.getElementById('pixelSizeInfo');
const beadSizeInfo = document.getElementById('beadSizeInfo');
const colorCount = document.getElementById('colorCount');
const colorPalette = document.getElementById('colorPalette');
const colorTableBody = document.getElementById('colorTableBody');
const beadColorCount = document.getElementById('beadColorCount');
const beadColorPalette = document.getElementById('beadColorPalette');
const beadColorTableBody = document.getElementById('beadColorTableBody');

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
        const response = await fetch('bead_color.json');
        const data = await response.json();
        beadColors = Object.entries(data).map(([name, hex]) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { name, r, g, b, hex };
        });
        console.log(`已加载 ${beadColors.length} 种拼豆颜色`);
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
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            controlsSection.style.display = 'flex';
            previewSection.style.display = 'block';
            
            const maxWidth = 400;
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
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
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
    
    calculateColorStats(pixelatedData, targetWidth, targetHeight);
    generateBeadImage(pixelatedData, targetWidth, targetHeight);
    
    colorStatsSection.style.display = 'block';
    beadStatsSection.style.display = 'block';
    
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

function generateBeadImage(pixelatedData, targetWidth, targetHeight) {
    const colorMap = new Map();
    const totalPixels = targetWidth * targetHeight;

    for (let i = 0; i < pixelatedData.data.length; i += 4) {
        const r = pixelatedData.data[i];
        const g = pixelatedData.data[i + 1];
        const b = pixelatedData.data[i + 2];

        const closestColor = findClosestBeadColor(r, g, b);
        const colorKey = closestColor.name;

        if (colorMap.has(colorKey)) {
            colorMap.set(colorKey, colorMap.get(colorKey) + 1);
        } else {
            colorMap.set(colorKey, 1);
        }
    }

    const colorArray = Array.from(colorMap.entries()).map(([name, count]) => {
        const color = beadColors.find(c => c.name === name);
        return {
            name: color.name,
            r: color.r,
            g: color.g,
            b: color.b,
            hex: color.hex,
            count,
            percentage: (count / totalPixels * 100).toFixed(2)
        };
    });

    colorArray.sort((a, b) => b.count - a.count);

    displayBeadColorPalette(colorArray);
    displayBeadColorTable(colorArray);
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

function displayBeadColorPalette(colors) {
    beadColorPalette.innerHTML = '';
    
    colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color.hex;
        swatch.title = `${color.name} - RGB(${color.r}, ${color.g}, ${color.b}) - ${color.count} pixels (${color.percentage}%)`;
        beadColorPalette.appendChild(swatch);
    });

    beadColorCount.textContent = colors.length;
}

function displayBeadColorTable(colors) {
    beadColorTableBody.innerHTML = '';
    
    colors.forEach(color => {
        const row = document.createElement('tr');
        
        const colorCell = document.createElement('td');
        colorCell.className = 'color-cell';
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color.hex;
        colorCell.appendChild(swatch);
        
        const nameCell = document.createElement('td');
        nameCell.textContent = color.name;
        
        const rgbCell = document.createElement('td');
        rgbCell.textContent = `${color.r}, ${color.g}, ${color.b}`;
        
        const countCell = document.createElement('td');
        countCell.textContent = color.count;
        
        const percentCell = document.createElement('td');
        percentCell.textContent = `${color.percentage}%`;
        
        row.appendChild(colorCell);
        row.appendChild(nameCell);
        row.appendChild(rgbCell);
        row.appendChild(countCell);
        row.appendChild(percentCell);
        
        beadColorTableBody.appendChild(row);
    });
}