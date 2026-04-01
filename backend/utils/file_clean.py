"""
临时文件清理模块
自动清理过期的上传文件和转换结果
"""
import os
import time
from config import UPLOAD_FOLDER, OUTPUT_FOLDER, TEMP_FILE_EXPIRE


def clean_temp_files():
    """
    清理过期临时文件
    
    检查并删除超过指定时间的临时文件
    
    Returns:
        int: 清理的文件数量
    """
    now = time.time()
    expire_seconds = TEMP_FILE_EXPIRE * 60
    cleaned = 0
    
    for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER]:
        if not os.path.exists(folder):
            continue
        
        for filename in os.listdir(folder):
            filepath = os.path.join(folder, filename)
            
            if not os.path.isfile(filepath):
                continue
            
            file_age = now - os.path.getmtime(filepath)
            if file_age > expire_seconds:
                try:
                    os.remove(filepath)
                    cleaned += 1
                except Exception:
                    pass
    
    return cleaned


def clean_all_temp():
    """
    清理所有临时文件
    
    不检查时间，直接删除uploads和outputs目录下的所有文件
    
    Returns:
        int: 清理的文件数量
    """
    cleaned = 0
    
    for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER]:
        if not os.path.exists(folder):
            continue
        
        for filename in os.listdir(folder):
            filepath = os.path.join(folder, filename)
            if os.path.isfile(filepath):
                try:
                    os.remove(filepath)
                    cleaned += 1
                except Exception:
                    pass
    
    return cleaned


if __name__ == "__main__":
    print(f"已清理 {clean_temp_files()} 个过期临时文件")
