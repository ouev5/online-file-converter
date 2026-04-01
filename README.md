# 📁 在线文件转换工具

一个轻量级的本地文件格式转换Web工具，支持 Word、PDF、图片等常见办公文件的双向格式转换。

## ✨ 功能特点

- 🌐 **Web界面** - 浏览器直接访问，无需安装客户端
- 📦 **本地处理** - 文件不上传至服务器，保护隐私安全
- 🔒 **开源透明** - 代码完全开放，可自行部署审查
- 🚀 **一键部署** - 简单几步即可运行服务
- 🖥️ **跨平台** - 支持 Windows、Mac、Linux 系统

## 📋 支持的转换

| 转换类型 | 说明 |
|---------|------|
| Word → PDF | Word文档转PDF |
| PDF → Word | PDF转可编辑Word |
| PDF → PPT | PDF转演示文稿（支持OCR识别扫描件） |
| JPG → PDF | 多张图片合并为一个PDF |
| PNG → PDF | 多张图片合并为一个PDF |
| PDF → 图片 | PDF导出为PNG图片 |
| 合并 PDF | 多个PDF文件合并为一个 |
| 压缩 PDF | 减小PDF文件大小 |

## 🚀 快速部署

### 环境要求

- Python 3.8+
- Windows / macOS / Linux 系统
- LibreOffice（用于Word转PDF）

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/ouev5/online-file-converter.git
cd online-file-converter

# 2. 创建Python虚拟环境（推荐，避免依赖冲突）
python -m venv venv

# Windows 激活虚拟环境
venv\Scripts\activate

# macOS/Linux 激活虚拟环境
source venv/bin/activate

# 3. 安装Python依赖（使用清华镜像源加速）
pip install -r backend/requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 4. 安装LibreOffice（用于Word转PDF）
# Ubuntu/Debian:
sudo apt-get install libreoffice

# macOS:
# 下载地址: https://www.libreoffice.org/download/download/
# 或使用 Homebrew: brew install --cask libreoffice

# Windows:
# 下载地址: https://www.libreoffice.org/download/download/
# 安装后确保添加到系统 PATH 环境变量

# 5. 安装OCR依赖（可选，用于扫描件PDF转PPT）
# Ubuntu/Debian:
sudo apt-get install tesseract-ocr tesseract-ocr-chi-sim

# macOS:
brew install tesseract tesseract-lang

# Windows:
# 下载地址: https://github.com/UB-Mannheim/tesseract/wiki
# 安装时选择中文语言包

# 6. 启动服务
cd backend
python app.py
```

### 访问

启动后访问 http://localhost:8000 或 http://你的IP:8000

## 📁 项目结构

```
online-file-converter/
├── frontend/                 # 前端文件
│   ├── index.html          # 主页面
│   ├── css/
│   │   └── style.css       # 样式文件
│   └── js/
│       └── index.js        # 前端脚本
├── backend/                 # 后端文件
│   ├── app.py              # Flask主程序
│   ├── config.py           # 配置文件
│   ├── requirements.txt     # Python依赖
│   └── utils/              # 工具模块
│       ├── file_convert.py # 文件转换核心逻辑
│       └── file_clean.py   # 临时文件清理
├── scripts/                 # 启动脚本
│   ├── start.sh            # Linux/macOS启动脚本
│   └── start.bat           # Windows启动脚本
├── uploads/                 # ⚠️ 上传文件临时目录（Git已忽略）
│   └── .gitkeep            # 保持目录追踪
├── outputs/                 # ⚠️ 输出文件临时目录（Git已忽略）
│   └── .gitkeep            # 保持目录追踪
├── .gitignore              # Git忽略配置
├── LICENSE                 # MIT开源协议
└── README.md               # 项目说明
```

> **注意**：`uploads/` 和 `outputs/` 目录用于存放临时文件，已在 `.gitignore` 中配置，部署时会自动创建，无需手动创建。

## 🔧 配置说明

后端配置文件 `backend/config.py`：

```python
MAX_FILE_SIZE = 100 * 1024 * 1024  # 最大文件大小（字节），默认100MB
TEMP_FILE_EXPIRE = 10              # 临时文件过期时间（分钟）
```

## ❓ 常见问题

### Q: Word转PDF失败？

确保已安装LibreOffice：

- **Ubuntu/Debian**: `sudo apt-get install libreoffice`
- **macOS**: [下载链接](https://www.libreoffice.org/download/download/) 或 `brew install --cask libreoffice`
- **Windows**: [下载链接](https://www.libreoffice.org/download/download/)，安装后添加 PATH

### Q: PDF转PPT时扫描件没有内容？

安装OCR支持：

- **Ubuntu/Debian**: `sudo apt-get install tesseract-ocr tesseract-ocr-chi-sim`
- **macOS**: `brew install tesseract tesseract-lang`
- **Windows**: [下载链接](https://github.com/UB-Mannheim/tesseract/wiki)

### Q: pip安装依赖太慢？

使用国内镜像源：

```bash
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

或使用阿里云镜像：

```bash
pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/
```

### Q: 如何修改端口？

修改 `backend/app.py` 最后一行：

```python
app.run(host='0.0.0.0', port=你想要的端口)
```

### Q: 部署后提示静态文件404？

确保从项目根目录启动，而不是从 backend 目录启动：

```bash
cd /path/to/online-file-converter
cd backend
python app.py
```

## 📝 使用示例

1. 打开网页，选择转换类型
2. 点击或拖拽上传文件
3. 点击"开始转换"
4. 转换完成后点击下载

## ⚠️ 免责声明

本工具仅供学习和个人使用：
- 所有文件转换在本地完成，不会上传至任何服务器
- 请勿使用本工具处理涉密或敏感文件
- 作者不对使用本工具造成的任何损失负责

## 📄 开源协议

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
