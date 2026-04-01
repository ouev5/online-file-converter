"""
配置文件 - 在线文件转换工具
"""
import os

# 项目根目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 文件大小限制 (100MB)
MAX_FILE_SIZE = 100 * 1024 * 1024

# 允许的文件格式
ALLOWED_EXTENSIONS = {
    'word': ['.doc', '.docx'],
    'pdf': ['.pdf'],
    'ppt': ['.ppt', '.pptx'],
    'image': ['.jpg', '.jpeg', '.png', '.bmp']
}

# 临时文件目录
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')

# 临时文件有效期（分钟）
TEMP_FILE_EXPIRE = 10

# 确保目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
