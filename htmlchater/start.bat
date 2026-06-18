@echo off
chcp 65001 >nul
title LLM Chat - 本地服务器

cd /d "%~dp0"

echo ========================================
echo   LLM Chat 本地服务器启动中...
echo ========================================
echo.

where python >nul 2>nul
if %errorlevel%==0 (
    echo [1/2] 检测到 Python，使用 Python HTTP 服务器
    echo.
    echo 启动成功！请在浏览器中打开:
    echo   http://localhost:8000/chat.html
    echo.
    echo 按 Ctrl+C 停止服务器
    echo ========================================
    echo.
    python -m http.server 8000
    goto :end
)

where py >nul 2>nul
if %errorlevel%==0 (
    echo [1/2] 检测到 Python (py 命令)，使用 Python HTTP 服务器
    echo.
    echo 启动成功！请在浏览器中打开:
    echo   http://localhost:8000/chat.html
    echo.
    echo 按 Ctrl+C 停止服务器
    echo ========================================
    echo.
    py -m http.server 8000
    goto :end
)

echo [1/2] 未检测到 Python，尝试使用 PowerShell 启动简易服务器...
echo.

powershell -Command "$listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:8000/'); $listener.Start(); Write-Host '启动成功！请在浏览器中打开:' -ForegroundColor Green; Write-Host '  http://localhost:8000/chat.html' -ForegroundColor Cyan; Write-Host ''; Write-Host '按 Ctrl+C 停止服务器'; Write-Host '========================================'; while($listener.IsListening) { $context = $listener.GetContext(); $request = $context.Request; $response = $context.Response; $path = $request.Url.LocalPath; if($path -eq '/') { $path = '/chat.html' }; $file = Join-Path $PWD $path.TrimStart('/'); if(Test-Path $file) { $content = [System.IO.File]::ReadAllBytes($file); $response.ContentType = [System.Web.MimeMapping]::GetMimeMapping($file); if(-not $response.ContentType) { $ext = [System.IO.Path]::GetExtension($file).ToLower(); switch($ext) { '.html' { $response.ContentType = 'text/html; charset=utf-8' } '.js' { $response.ContentType = 'application/javascript; charset=utf-8' } '.css' { $response.ContentType = 'text/css; charset=utf-8' } '.json' { $response.ContentType = 'application/json; charset=utf-8' } default { $response.ContentType = 'application/octet-stream' } } }; $response.ContentLength64 = $content.Length; $response.OutputStream.Write($content, 0, $content.Length) } else { $response.StatusCode = 404; $msg = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found'); $response.ContentLength64 = $msg.Length; $response.OutputStream.Write($msg, 0, $msg.Length) }; $response.Close() }"

:end
echo.
echo 服务器已停止。
pause
