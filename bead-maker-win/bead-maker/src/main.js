import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const controlsSection = document.getElementById('controlsSection');
const previewSection = document.getElementById('previewSection');
const statsSection = document.getElementById('statsSection');
const pixelWidthInput = document.getElementById('pixelWidth');
const pixelWidthSlider = document.getElementById('pixelWidthSlider');
const startBtn = document.getElementById('startBtn');
const originalImage = document.getElementById('originalImage');
const beadImage = document.getElementById('beadImage');
const originalSizeInfo = document.getElementById('originalSizeInfo');
const beadSizeInfo = document.getElementById('beadSizeInfo');
const colorCount = document.getElementById('colorCount');
const colorPalette = document.getElementById('colorPalette');
const saveBtn = document.getElementById('saveBtn');
const registerMenuBtn = document.getElementById('registerMenuBtn');
const unregisterMenuBtn = document.getElementById('unregisterMenuBtn');
const messageArea = document.getElementById('messageArea');

let beadColors = [];
let currentImagePath = '';
let currentBeadData = null;
let currentStats = [];

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
        showMessage('加载拼豆颜色失败', 'error');
    }
}

function showMessage(text, type = 'info') {
    messageArea.textContent = text;
    messageArea.className = `message-area ${type}`;
    setTimeout(() => {
        messageArea.className = 'message-area';
    }, 5000);
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

fileInput.addEventListener('click', async (e) => {
    e.preventDefault();
    await selectFile();
});

async function selectFile() {
    try {
        const selected = await open({
            multiple: false,
            filters: [
                { name: '图片', extensions: ['jpg', 'jpeg', 'png'] }
            ]
        });
        
        if (selected) {
            const fileName = selected.split(/[/\\]/).pop();
            const fileExtension = fileName.split('.').pop().toLowerCase();
            const file = { 
                path: selected, 
                name: fileName,
                type: `image/${fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'jpeg' : 'png'}`
            };
            handleFile(file);
        }
    } catch (error) {
        console.error('选择文件失败:', error);
        showMessage('选择文件失败', 'error');
    }
}

function readFileAsDataURL(filePath, callback) {
    invoke('read_file_as_base64', { filePath })
        .then(base64Data => {
            callback(`data:image/${filePath.split('.').pop().toLowerCase() === 'jpg' ? 'jpeg' : 'png'};base64,${base64Data}`);
        })
        .catch(error => {
            console.error('读取文件失败:', error);
            callback(null);
        });
}

async function handleFile(file) {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'jpg' && fileExtension !== 'jpeg' && fileExtension !== 'png') {
        showMessage('请上传JPG或PNG格式的图片', 'error');
        return;
    }

    currentImagePath = file.path || file.name;

    if (file.path) {
        readFileAsDataURL(file.path, (dataUrl) => {
            if (dataUrl) {
                originalImage.src = dataUrl;
                originalSizeInfo.textContent = `${fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'JPG' : 'PNG'}`;
                controlsSection.style.display = 'flex';
                previewSection.style.display = 'block';
                statsSection.style.display = 'none';
                showMessage(`已选择图片: ${file.name}`, 'success');
            } else {
                showMessage('读取图片失败', 'error');
            }
        });
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage.src = e.target.result;
            originalSizeInfo.textContent = `${file.type.includes('jpeg') ? 'JPG' : 'PNG'}`;
            controlsSection.style.display = 'flex';
            previewSection.style.display = 'block';
            statsSection.style.display = 'none';
            showMessage(`已选择图片: ${file.name}`, 'success');
        };
        reader.readAsDataURL(file);
    }
}

startBtn.addEventListener('click', async () => {
    if (!currentImagePath) {
        showMessage('请先选择图片', 'error');
        return;
    }

    const pixelWidth = parseInt(pixelWidthInput.value);
    if (pixelWidth < 8 || pixelWidth > 200) {
        showMessage('宽度请在8-200之间', 'error');
        return;
    }

    startBtn.disabled = true;
    startBtn.textContent = '处理中...';

    try {
        const beadColorsJson = JSON.stringify(
            Object.fromEntries(beadColors.map(c => [c.name, c.hex]))
        );

        showMessage('正在处理图片...', 'info');

        const result = await invoke('process_image', {
            imagePath: currentImagePath,
            pixelWidth: pixelWidth,
            beadColorsJson: beadColorsJson
        });

        currentBeadData = result[0];
        currentStats = result[1];

        beadImage.src = currentBeadData;
        beadSizeInfo.textContent = `${pixelWidth} 像素`;

        displayColorPalette(currentStats);
        colorCount.textContent = currentStats.length;

        statsSection.style.display = 'block';
        showMessage('拼豆图生成成功!', 'success');
    } catch (error) {
        console.error('处理图片失败:', error);
        showMessage(`处理图片失败: ${error}`, 'error');
    } finally {
        startBtn.disabled = false;
        startBtn.textContent = '生成拼豆图';
    }
});

function displayColorPalette(stats) {
    colorPalette.innerHTML = '';

    stats.forEach(stat => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = stat.hex;
        swatch.title = `${stat.name} - RGB(${stat.r}, ${stat.g}, ${stat.b}) - ${stat.count}个`;
        colorPalette.appendChild(swatch);
    });
}

saveBtn.addEventListener('click', async () => {
    if (!currentImagePath || !currentBeadData) {
        showMessage('请先生成拼豆图', 'error');
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';

    try {
        const beadColorsJson = JSON.stringify(
            Object.fromEntries(beadColors.map(c => [c.name, c.hex]))
        );

        const result = await invoke('save_files', {
            imagePath: currentImagePath,
            pixelWidth: parseInt(pixelWidthInput.value),
            beadColorsJson: beadColorsJson,
            stats: currentStats,
            imageData: currentBeadData
        });

        showMessage(result, 'success');
    } catch (error) {
        console.error('保存文件失败:', error);
        showMessage(`保存失败: ${error}`, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '保存图片和PDF';
    }
});

registerMenuBtn.addEventListener('click', async () => {
    registerMenuBtn.disabled = true;
    registerMenuBtn.textContent = '注册中...';

    try {
        const exePath = await invoke('get_exe_path');
        const result = await invoke('register_context_menu', { exePath });
        showMessage(result, 'success');
    } catch (error) {
        console.error('注册右键菜单失败:', error);
        showMessage(`注册失败: ${error}\n\n提示：可能需要以管理员身份运行此程序`, 'error');
    } finally {
        registerMenuBtn.disabled = false;
        registerMenuBtn.textContent = '注册右键菜单';
    }
});

unregisterMenuBtn.addEventListener('click', async () => {
    unregisterMenuBtn.disabled = true;
    unregisterMenuBtn.textContent = '移除中...';

    try {
        const result = await invoke('unregister_context_menu');
        showMessage(result, 'success');
    } catch (error) {
        console.error('移除右键菜单失败:', error);
        showMessage(`移除失败: ${error}\n\n提示：可能需要以管理员身份运行此程序`, 'error');
    } finally {
        unregisterMenuBtn.disabled = false;
        unregisterMenuBtn.textContent = '移除右键菜单';
    }
});

loadBeadColors();

window.addEventListener('DOMContentLoaded', async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const win = getCurrentWindow();

    win.onDragDropEvent((event) => {
        console.log('Drag drop event:', event);
        if (event.payload.type === 'drop') {
            const paths = event.payload.paths;
            if (paths && paths.length > 0) {
                const fileName = paths[0].split(/[/\\]/).pop();
                const fileExtension = fileName.split('.').pop().toLowerCase();
                if (fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png') {
                    const file = { 
                        path: paths[0], 
                        name: fileName,
                        type: `image/${fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'jpeg' : 'png'}`
                    };
                    handleFile(file);
                } else {
                    showMessage('请拖放JPG或PNG格式的图片', 'error');
                }
            }
        }
    });
});