// 文件转换工具 - 前端脚本
// 状态管理
let selectedType = '';
let selectedFiles = [];
let convertedFiles = [];

// DOM 元素
const $ = (id) => document.getElementById(id);
const convertBtns = document.querySelectorAll('.convert-btn');
const dropZone = $('dropZone');
const fileInput = $('fileInput');
const fileList = $('fileList');
const convertBtn = $('convertBtn');
const clearBtn = $('clearBtn');
const uploadSection = $('uploadSection');
const progressSection = $('progressSection');
const progressFill = $('progressFill');
const progressText = $('progressText');
const resultSection = $('resultSection');
const resultContent = $('resultContent');
const resetBtn = $('resetBtn');
const errorModal = $('errorModal');
const successModal = $('successModal');
const modalClose = $('modalClose');
const modalMessage = $('modalMessage');
const selectedTypeHint = $('selectedTypeHint');
const uploadTip = $('uploadTip');

// 支持的文件格式映射
const FORMAT_MAP = {
    'word2pdf': { ext: ['.doc', '.docx'], name: 'Word', accept: '.doc,.docx', multi: false },
    'pdf2word': { ext: ['.pdf'], name: 'PDF', accept: '.pdf', multi: false },
    'pdf2pptx': { ext: ['.pdf'], name: 'PDF', accept: '.pdf', multi: false },
    'jpg2pdf': { ext: ['.jpg', '.jpeg'], name: 'JPG', accept: '.jpg,.jpeg', multi: true, merge: true },
    'png2pdf': { ext: ['.png'], name: 'PNG', accept: '.png', multi: true, merge: true },
    'pdf2images': { ext: ['.pdf'], name: 'PDF', accept: '.pdf', multi: false },
    'merge': { ext: ['.pdf'], name: 'PDF', accept: '.pdf', multi: true, merge: true },
    'compress': { ext: ['.pdf'], name: 'PDF', accept: '.pdf', multi: false }
};

// 最大文件大小 (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// 初始化
function init() {
    // 转换类型选择
    convertBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            convertBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedType = btn.dataset.type;
            
            const format = FORMAT_MAP[selectedType];
            if (format) {
                const multiHint = format.multi ? ' (多个文件合并)' : ' (单个文件)';
                selectedTypeHint.textContent = `(已选: ${format.name}${multiHint})`;
                uploadTip.textContent = `支持: ${format.ext.join(', ').toUpperCase()} (最大100MB)${format.multi ? '，可选择多个文件' : ''}`;
                fileInput.accept = format.accept;
            }
            
            if (selectedFiles.length > 0) {
                validateExistingFiles();
            }
            
            updateConvertBtn();
        });
    });
    
    // 拖拽事件
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        if (!selectedType) {
            showError('请先选择转换类型');
            return;
        }
        
        handleFiles(e.dataTransfer.files);
    });
    
    // 点击上传
    dropZone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
            if (!selectedType) {
                showError('请先选择转换类型');
                return;
            }
            fileInput.click();
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        fileInput.value = '';
    });
    
    // 转换按钮
    convertBtn.addEventListener('click', startConvert);
    
    // 清空按钮
    clearBtn.addEventListener('click', clearFiles);
    
    // 继续转换按钮
    resetBtn.addEventListener('click', resetUI);
    
    // 弹窗关闭
    modalClose.addEventListener('click', closeModal);
    errorModal.addEventListener('click', (e) => {
        if (e.target === errorModal) closeModal();
    });
}

// 验证已有文件是否符合当前选择的格式
function validateExistingFiles() {
    if (!selectedType || selectedFiles.length === 0) return;
    
    const format = FORMAT_MAP[selectedType];
    if (!format) return;
    
    const validExts = format.ext.map(e => e.toLowerCase());
    const invalidFiles = selectedFiles.filter(f => {
        const ext = '.' + f.name.split('.').pop().toLowerCase();
        return !validExts.includes(ext);
    });
    
    if (invalidFiles.length > 0) {
        const names = invalidFiles.map(f => f.name).join(', ');
        showError(`以下文件格式不支持 ${format.name} 转换：\n${names}`);
        selectedFiles = selectedFiles.filter(f => {
            const ext = '.' + f.name.split('.').pop().toLowerCase();
            return validExts.includes(ext);
        });
        renderFileList();
        updateConvertBtn();
    }
}

// 处理文件
function handleFiles(files) {
    if (!selectedType) {
        showError('请先选择转换类型');
        return;
    }
    
    const format = FORMAT_MAP[selectedType];
    const validExts = format.ext.map(e => e.toLowerCase());
    
    for (let file of files) {
        if (file.size > MAX_FILE_SIZE) {
            showError(`文件 "${file.name}" 超过100MB限制`);
            continue;
        }
        
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!validExts.includes(ext)) {
            showError(`文件 "${file.name}" 格式不支持，请选择 ${validExts.join(', ').toUpperCase()} 格式`);
            continue;
        }
        
        const exists = selectedFiles.some(f => f.name === file.name && f.size === file.size);
        if (exists) continue;
        
        selectedFiles.push(file);
    }
    
    renderFileList();
    updateConvertBtn();
}

// 渲染文件列表
function renderFileList() {
    if (selectedFiles.length === 0) {
        fileList.innerHTML = '';
        return;
    }
    
    let html = '';
    selectedFiles.forEach((file, index) => {
        const ext = file.name.split('.').pop().toLowerCase();
        const icon = getFileIcon(ext);
        const size = formatSize(file.size);
        
        html += `
            <div class="file-item">
                <div class="file-info">
                    <span class="file-icon">${icon}</span>
                    <span class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
                    <span class="file-size">${size}</span>
                </div>
                <button class="file-remove" data-index="${index}" title="移除">✕</button>
            </div>
        `;
    });
    
    fileList.innerHTML = html;
    
    fileList.querySelectorAll('.file-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            removeFile(index);
        });
    });
}

// 获取文件图标
function getFileIcon(ext) {
    const icons = {
        'doc': '📄', 'docx': '📄',
        'pdf': '📕',
        'ppt': '📊', 'pptx': '📊',
        'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'bmp': '🖼️'
    };
    return icons[ext] || '📁';
}

// 格式化文件大小
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 移除文件
function removeFile(index) {
    if (index >= 0 && index < selectedFiles.length) {
        selectedFiles.splice(index, 1);
        renderFileList();
        updateConvertBtn();
    }
}

// 清空文件
function clearFiles() {
    selectedFiles = [];
    fileInput.value = '';
    renderFileList();
    updateConvertBtn();
}

// 更新转换按钮状态
function updateConvertBtn() {
    const canConvert = selectedType && selectedFiles.length > 0;
    convertBtn.disabled = !canConvert;
}

// 开始转换
async function startConvert() {
    if (!selectedType) {
        showError('请选择转换类型');
        return;
    }
    
    if (selectedFiles.length === 0) {
        showError('请上传文件');
        return;
    }
    
    uploadSection.classList.add('hidden');
    progressSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
    
    progressFill.style.width = '0%';
    progressText.textContent = '开始转换...';
    
    convertedFiles = [];
    let successCount = 0;
    let failCount = 0;
    
    try {
        // 检查是否是合并类型
        const mergeTypes = ['jpg2pdf', 'png2pdf', 'merge'];
        const isMerge = mergeTypes.includes(selectedType) && selectedFiles.length > 1;
        
        if (isMerge) {
            // 多文件合并：一次性发送所有文件
            progressText.textContent = `正在合并 ${selectedFiles.length} 个文件...`;
            
            const formData = new FormData();
            for (const file of selectedFiles) {
                formData.append('file', file);
            }
            formData.append('convert_type', selectedType);
            
            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.code === 200) {
                successCount = selectedFiles.length;
                if (result.files && result.files.length > 0) {
                    result.files.forEach(f => {
                        convertedFiles.push({ name: f.name, url: f.url });
                    });
                } else if (result.file_url) {
                    convertedFiles.push({
                        name: result.file_name || result.file_url.split('/').pop(),
                        url: result.file_url
                    });
                }
            } else {
                failCount = selectedFiles.length;
                showError(result.msg || '合并失败');
                setTimeout(() => resetToUpload(), 2000);
                return;
            }
            
            progressFill.style.width = '100%';
            progressText.textContent = '合并完成！';
            
        } else {
            // 单文件转换：逐个处理
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                progressText.textContent = `正在转换: ${file.name}`;
                
                const formData = new FormData();
                formData.append('file', file);
                formData.append('convert_type', selectedType);
                
                try {
                    const response = await fetch('/api/convert', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    if (result.code === 200) {
                        successCount++;
                        if (result.files && result.files.length > 0) {
                            result.files.forEach(f => {
                                convertedFiles.push({ name: f.name, url: f.url });
                            });
                        } else if (result.file_url) {
                            convertedFiles.push({
                                name: result.file_name || result.file_url.split('/').pop(),
                                url: result.file_url
                            });
                        }
                    } else {
                        failCount++;
                        console.error(`转换失败: ${result.msg}`);
                    }
                } catch (err) {
                    failCount++;
                    console.error(`请求错误: ${err.message}`);
                }
                
                const percent = Math.round(((i + 1) / selectedFiles.length) * 100);
                progressFill.style.width = percent + '%';
                progressText.textContent = `已完成: ${i + 1}/${selectedFiles.length}`;
            }
            
            if (failCount > 0 && successCount === 0) {
                progressText.textContent = '转换失败';
                showError(`全部 ${selectedFiles.length} 个文件转换失败`);
                setTimeout(() => resetToUpload(), 2000);
                return;
            }
            
            progressText.textContent = `转换完成！成功 ${successCount} 个${failCount > 0 ? '，失败 ' + failCount + ' 个' : ''}`;
        }
        
        setTimeout(() => showResult(successCount, failCount), 500);
        
    } catch (error) {
        showError('转换过程出错: ' + error.message);
        setTimeout(() => resetToUpload(), 2000);
    }
}

// 显示结果
function showResult(successCount, failCount) {
    progressSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
    
    if (convertedFiles.length === 0) {
        resultContent.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">转换失败，未生成文件</p>';
        return;
    }
    
    let html = '';
    
    if (convertedFiles.length === 1) {
        const file = convertedFiles[0];
        const ext = file.name.split('.').pop().toLowerCase();
        const icon = getFileIcon(ext);
        html = `
            <div class="result-item" style="display:flex;align-items:center;justify-content:space-between;padding:15px;background:#f5f5f5;border-radius:8px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:2rem;">${icon}</span>
                    <div>
                        <div style="font-weight:500;">${escapeHtml(file.name)}</div>
                        <div style="color:#888;font-size:12px;">转换成功</div>
                    </div>
                </div>
                <button class="btn-primary" onclick="downloadFile('${encodeURIComponent(file.url)}', '${encodeURIComponent(file.name)}')" style="padding:10px 25px;">
                    ⬇️ 下载
                </button>
            </div>
        `;
    } else {
        html = `<p style="margin-bottom:15px;color:#27ae60;">✓ 成功生成 ${successCount} 个文件：</p>`;
        convertedFiles.forEach((file, index) => {
            const ext = file.name.split('.').pop().toLowerCase();
            const icon = getFileIcon(ext);
            html += `
                <div class="result-item">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="file-icon">${icon}</span>
                        <span class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
                    </div>
                    <button class="btn-secondary" onclick="downloadFile('${encodeURIComponent(file.url)}', '${encodeURIComponent(file.name)}')" style="padding:5px 12px;font-size:12px;">
                        下载
                    </button>
                </div>
            `;
        });
        
        html += `
            <div style="margin-top:15px;text-align:center;">
                <button class="btn-primary" onclick="downloadAll()" style="padding:12px 30px;">
                    ⬇️ 全部下载 (${convertedFiles.length})
                </button>
            </div>
        `;
    }
    
    resultContent.innerHTML = html;
}

// 下载单个文件
function downloadFile(url, name) {
    url = decodeURIComponent(url);
    name = decodeURIComponent(name);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 下载全部文件
function downloadAll() {
    if (convertedFiles.length === 0) return;
    
    convertedFiles.forEach((file, index) => {
        setTimeout(() => {
            downloadFile(
                encodeURIComponent(file.url),
                encodeURIComponent(file.name)
            );
        }, index * 500);
    });
}

// 返回上传界面
function resetToUpload() {
    progressSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
    progressFill.style.width = '0%';
}

// 重置整个界面
function resetUI() {
    selectedFiles = [];
    convertedFiles = [];
    selectedType = '';
    fileInput.value = '';
    
    convertBtns.forEach(b => b.classList.remove('active'));
    selectedTypeHint.textContent = '';
    uploadTip.textContent = '支持: DOC, DOCX, PDF, JPG, PNG, BMP (最大100MB)';
    fileInput.accept = '';
    
    uploadSection.classList.remove('hidden');
    progressSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    
    progressFill.style.width = '0%';
    progressText.textContent = '准备中...';
    
    updateConvertBtn();
    renderFileList();
}

// 显示错误
function showError(message) {
    modalMessage.textContent = message;
    errorModal.classList.remove('hidden');
}

// 关闭错误弹窗
function closeModal() {
    errorModal.classList.add('hidden');
}

// 关闭成功弹窗
function closeSuccessModal() {
    successModal.classList.add('hidden');
}

// 清理临时文件
async function cleanTemp() {
    try {
        const response = await fetch('/api/clean', { method: 'POST' });
        const result = await response.json();
        if (result.code === 200) {
            showSuccess('临时文件已清理');
        } else {
            showError(result.msg || '清理失败');
        }
    } catch (err) {
        showError('清理失败: ' + err.message);
    }
}

// 显示成功
function showSuccess(message) {
    $('successMessage').textContent = message;
    successModal.classList.remove('hidden');
}

// 启动
init();
