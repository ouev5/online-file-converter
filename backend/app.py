"""
在线文件转换工具 - Flask后端主程序

提供文件转换API接口
访问 http://localhost:8000 使用Web界面
"""
import os
import uuid
import threading
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from config import MAX_FILE_SIZE, ALLOWED_EXTENSIONS, UPLOAD_FOLDER, OUTPUT_FOLDER
from utils.file_convert import convert_file, convert_multiple_files
from utils.file_clean import clean_temp_files

# 初始化Flask应用
app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# 初始化允许的扩展名集合
ALLOWED_EXT = set()
for exts in ALLOWED_EXTENSIONS.values():
    ALLOWED_EXT.update(exts)


def get_ext(filename):
    """获取文件扩展名（从原始文件名）"""
    return '.' in filename and os.path.splitext(filename)[1].lower()


def allowed_file(filename):
    """检查文件扩展名是否允许"""
    ext = get_ext(filename)
    return ext in ALLOWED_EXT


@app.route('/')
def index():
    """返回前端页面"""
    return send_file('../frontend/index.html')


@app.route('/api/convert', methods=['POST'])
def convert():
    """
    文件转换接口
    
    接收上传的文件，执行格式转换，返回转换结果
    
    请求:
        - file: 上传的文件（支持多个同名file字段）
        - convert_type: 转换类型
    
    响应:
        - code: 状态码（200成功/400失败/500错误）
        - msg: 提示信息
        - file_url: 单个转换文件的下载路径
        - files: 多个转换文件的下载路径列表
    """
    try:
        files = request.files.getlist('file')
        convert_type = request.form.get('convert_type', '')
        
        # 参数校验
        if not files or all(f.filename == '' for f in files):
            return jsonify({'code': 400, 'msg': '请上传文件'}), 400
        
        if not convert_type:
            return jsonify({'code': 400, 'msg': '请选择转换类型'}), 400
        
        # 过滤空文件名
        files = [f for f in files if f.filename and f.filename.strip()]
        if not files:
            return jsonify({'code': 400, 'msg': '请上传有效的文件'}), 400
        
        # 检查文件格式
        for f in files:
            if not allowed_file(f.filename):
                ext = get_ext(f.filename) or '(无扩展名)'
                return jsonify({'code': 400, 'msg': f'不支持的文件格式 "{f.filename}" (扩展名: {ext})'}), 400
        
        # 保存上传的文件
        upload_paths = []
        try:
            for f in files:
                filename = secure_filename(f.filename)
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                upload_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                f.save(upload_path)
                upload_paths.append(upload_path)
            
            # 根据文件数量和转换类型决定调用哪个函数
            merge_types = ['jpg2pdf', 'png2pdf', 'merge']
            if len(upload_paths) > 1 and convert_type in merge_types:
                # 多文件合并
                success, result, message = convert_multiple_files(
                    upload_paths, convert_type, OUTPUT_FOLDER
                )
            else:
                # 单文件转换
                success, result, message = convert_file(
                    upload_paths[0], convert_type, OUTPUT_FOLDER
                )
            
            # 返回结果
            if success:
                if isinstance(result, list):
                    files_list = []
                    for path in result:
                        fname = os.path.basename(path)
                        files_list.append({
                            'name': fname,
                            'url': f'/api/download/{fname}'
                        })
                    return jsonify({
                        'code': 200,
                        'msg': '转换成功',
                        'files': files_list
                    })
                else:
                    fname = os.path.basename(result)
                    return jsonify({
                        'code': 200,
                        'msg': '转换成功',
                        'file_url': f'/api/download/{fname}',
                        'file_name': fname
                    })
            else:
                return jsonify({'code': 500, 'msg': message}), 500
        
        finally:
            # 清理上传的临时文件
            for path in upload_paths:
                if os.path.exists(path):
                    os.remove(path)
    
    except Exception as e:
        return jsonify({'code': 500, 'msg': f'转换失败: {str(e)}'}), 500


@app.route('/api/download/<filename>', methods=['GET'])
def download(filename):
    """
    文件下载接口
    
    Args:
        filename: 下载的文件名
    
    Returns:
        文件内容或错误信息
    """
    try:
        filename = secure_filename(filename)
        file_path = os.path.join(OUTPUT_FOLDER, filename)
        if not os.path.exists(file_path):
            return jsonify({'code': 404, 'msg': '文件不存在'}), 404
        return send_from_directory(OUTPUT_FOLDER, filename, as_attachment=True)
    except Exception as e:
        return jsonify({'code': 500, 'msg': str(e)}), 500


@app.route('/api/clean', methods=['POST'])
def clean():
    """手动清理临时文件接口"""
    cleaned = clean_all_temp()
    return jsonify({'code': 200, 'msg': f'已清理 {cleaned} 个文件'})


@app.route('/api/formats', methods=['GET'])
def get_formats():
    """获取支持的转换格式列表"""
    return jsonify({
        'code': 200,
        'formats': {
            'word2pdf': {'input': ['.doc', '.docx'], 'output': '.pdf', 'name': 'Word → PDF'},
            'pdf2word': {'input': ['.pdf'], 'output': '.docx', 'name': 'PDF → Word'},
            'pdf2pptx': {'input': ['.pdf'], 'output': '.pptx', 'name': 'PDF → PPT'},
            'jpg2pdf': {'input': ['.jpg', '.jpeg'], 'output': '.pdf', 'name': 'JPG → PDF'},
            'png2pdf': {'input': ['.png'], 'output': '.pdf', 'name': 'PNG → PDF'},
            'pdf2images': {'input': ['.pdf'], 'output': '.png', 'name': 'PDF → 图片'},
            'merge': {'input': ['.pdf'], 'output': '.pdf', 'name': '合并PDF'},
            'compress': {'input': ['.pdf'], 'output': '.pdf', 'name': '压缩PDF'}
        }
    })


def clean_all_temp():
    """清理所有临时文件"""
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


def start_cleaner():
    """启动定时清理线程"""
    def clean():
        while True:
            import time
            time.sleep(300)  # 每5分钟清理一次
            cleaned = clean_temp_files()
            if cleaned > 0:
                print(f"[清理] 已删除 {cleaned} 个过期临时文件")
    
    t = threading.Thread(target=clean, daemon=True)
    t.start()


if __name__ == '__main__':
    # 确保目录存在
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    
    # 启动定时清理
    start_cleaner()
    
    print("=" * 50)
    print("📁 在线文件转换工具")
    print(f"🌐 访问地址: http://localhost:8000")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=8000, debug=False)
