#!/bin/bash
# 在线文件转换工具 - 启动脚本

echo "========================================"
echo "📁 在线文件转换工具"
echo "========================================"

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到Python3"
    exit 1
fi

# 进入后端目录
cd "$(dirname "$0")/backend" || exit 1

# 检查依赖
echo "📦 检查依赖..."
pip show flask > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  首次运行需要安装依赖..."
    pip install -r requirements.txt --quiet
fi

# 创建必要目录
mkdir -p uploads outputs

# 启动服务
echo "🚀 启动服务..."
echo "🌐 访问地址: http://localhost:8000"
echo "========================================"

python3 app.py
