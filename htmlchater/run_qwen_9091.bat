@echo off
chcp 65001 >nul
echo ============================================
echo  Qwen3.5-4B (普通版) - Port 9091
echo ============================================
G:\llamacpp\llama-server.exe ^
    -m "G:\models\qwen3.5-4b-q5\Qwen3.5-4B.Q5_K_M.gguf" ^
    --port 9091 ^
    --host 0.0.0.0 ^
    -ngl 99 ^
    --no-kv-offload ^
    --flash-attn on ^
    -c 32768
pause
