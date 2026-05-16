const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const controlsSection = document.getElementById('controlsSection');
const previewSection = document.getElementById('previewSection');
const pixelWidthInput = document.getElementById('pixelWidth');
const startBtn = document.getElementById('startBtn');
const originalCanvas = document.getElementById('originalCanvas');
const pixelatedCanvas = document.getElementById('pixelatedCanvas');

const originalCtx = originalCanvas.getContext('2d');
const pixelatedCtx = pixelatedCanvas.getContext('2d');

let originalImage = null;

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
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    
    tempCtx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);
    
    const pixelatedData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
    
    const outputCanvas = document.createElement('canvas');
    const outputCtx = outputCanvas.getContext('2d');
    
    outputCanvas.width = originalCanvas.width;
    outputCanvas.height = originalCanvas.height;
    
    const pixelSizeX = originalCanvas.width / targetWidth;
    const pixelSizeY = originalCanvas.height / targetHeight;
    
    for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
            const index = (y * targetWidth + x) * 4;
            const r = pixelatedData.data[index];
            const g = pixelatedData.data[index + 1];
            const b = pixelatedData.data[index + 2];
            const a = pixelatedData.data[index + 3];
            
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
}