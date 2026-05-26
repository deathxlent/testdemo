$ErrorActionPreference = "Stop"

Write-Host "检查依赖..." -ForegroundColor Yellow

$requiredModules = @("pystray", "PIL", "win32gui")
$needsInstall = $false

foreach ($module in $requiredModules) {
    try {
        python -c "import $module" 2>&1 | Out-Null
    } catch {
        $needsInstall = $true
        break
    }
}

if ($needsInstall) {
    Write-Host "安装依赖..." -ForegroundColor Yellow
    python -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "依赖安装失败" -ForegroundColor Red
        exit 1
    }
}

Write-Host "启动 TopIt..." -ForegroundColor Green
python topit.py
