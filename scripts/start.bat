@echo off
chcp 65001 > nul
echo ========================================
echo 📁 在线文件转换工具
echo ========================================

cd /d "%~dp0backend"

echo 📦 检查依赖...
pip show flask > nul 2>&1
if errorlevel 1 (
    echo ⚠️  首次运行需要安装依赖...
    pip install -r requirements.txt
)

mkdir uploads > nul 2>&1
mkdir outputs > nul 2>&1

echo 🚀 启动服务...
echo 🌐 访问地址: http://localhost:8000
echo ========================================

python app.py
pause
