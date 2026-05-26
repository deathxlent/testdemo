Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TopIt - 窗口置顶工具构建脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

Write-Host "[1/4] 检查Python环境..." -ForegroundColor Yellow
python --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 未找到Python，请先安装Python 3.8+" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Python环境检查通过" -ForegroundColor Green
Write-Host ""

Write-Host "[2/4] 安装依赖..." -ForegroundColor Yellow
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 依赖安装失败" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 依赖安装完成" -ForegroundColor Green
Write-Host ""

Write-Host "[3/4] 使用Nuitka编译成本机程序..." -ForegroundColor Yellow
Write-Host "  (首次编译需要下载C编译器，可能需要几分钟)" -ForegroundColor Gray
Write-Host ""

$buildArgs = @(
    "-m", "nuitka",
    "--standalone",
    "--onefile",
    "--windows-disable-console",
    "--enable-plugin=tk-inter",
    "--lto=yes",
    "--remove-output",
    "--assume-yes-for-downloads",
    "--output-filename=TopIt.exe",
    "--product-name=TopIt",
    "--file-description=窗口置顶工具",
    "--company-name=TopIt",
    "--product-version=1.0.0.0",
    "--file-version=1.0.0.0",
    "topit.py"
)

python @buildArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "错误: 编译失败" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ 编译完成!" -ForegroundColor Green
Write-Host ""
Write-Host "[4/4] 验证输出..." -ForegroundColor Yellow

if (Test-Path "TopIt.exe") {
    $fileSize = (Get-Item "TopIt.exe").Length / 1MB
    Write-Host "✓ 生成文件: TopIt.exe ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "警告: 未找到输出文件，请检查编译日志" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  构建完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "使用方法:" -ForegroundColor White
Write-Host "  1. 双击 TopIt.exe 运行" -ForegroundColor Gray
Write-Host "  2. 右键点击右下角托盘图标" -ForegroundColor Gray
Write-Host "  3. 选择要置顶的窗口" -ForegroundColor Gray
Write-Host "  4. 再次点击取消置顶" -ForegroundColor Gray
Write-Host ""
Write-Host "  直接运行(不编译): python topit.py" -ForegroundColor Gray
Write-Host ""
