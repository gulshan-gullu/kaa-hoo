// ========================================
// 📂 ADVANCED FILE SHARING MODULE - FIXED
// ========================================

(function() {
    'use strict';
    
    console.log('📂 [FILE-SHARING] Module loading...');
    
    // ✅ FIXED: Use 3GB limit (will be overridden by window.MAX_FILE_SIZE from chunked-upload.js)
    const MAX_FILE_SIZE = 3 * 1024 * 1024 * 1024; // 3GB
    
    // File size formatter
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    // Get file icon based on type
    function getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('word')) return '📝';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
        return '📎';
    }
    
    // Create file upload modal
    function createFileUploadModal() {
        const modalHTML = `
            <div id="file-upload-modal" class="file-upload-modal" style="display: none;">
                <div class="file-upload-overlay"></div>
                <div class="file-upload-container">
                    <div class="file-upload-header">
                        <h3>📂 Send File</h3>
                        <button class="file-upload-close" onclick="window.closeFileUploadModal()">✕</button>
                    </div>
                    
                    <div class="file-upload-content">
                        <div class="file-drop-zone" id="file-drop-zone">
                            <div class="file-drop-icon">📤</div>
                            <p class="file-drop-text">Drag & drop files here</p>
                            <p class="file-drop-subtext">or click to browse (Max 3GB per file)</p>
                            <input type="file" id="advanced-file-input" multiple style="display: none;">
                            <button class="file-browse-btn" onclick="document.getElementById('advanced-file-input').click()">Browse Files</button>
                        </div>
                        
                        <div class="file-list" id="file-upload-list"></div>
                        
                        <div class="file-upload-actions">
                            <button class="file-cancel-btn" onclick="window.closeFileUploadModal()">Cancel</button>
                            <button class="file-send-btn" id="file-send-btn" disabled>Send Files</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        attachFileUploadEvents();
    }
    
    // Attach file upload events
    function attachFileUploadEvents() {
        const dropZone = document.getElementById('file-drop-zone');
        const fileInput = document.getElementById('advanced-file-input');
        const sendBtn = document.getElementById('file-send-btn');
        
        let selectedFiles = [];
        
        // Click to browse
        dropZone.addEventListener('click', (e) => {
            if (e.target.classList.contains('file-browse-btn')) return;
            fileInput.click();
        });
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            handleFiles(Array.from(e.target.files));
        });
        
        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            handleFiles(Array.from(e.dataTransfer.files));
        });
        
        // Handle files
        function handleFiles(files) {
            const maxSize = window.MAX_FILE_SIZE || MAX_FILE_SIZE;
            const maxSizeGB = maxSize / (1024 * 1024 * 1024);
            
            const validFiles = files.filter(file => {
                if (file.size > maxSize) {
                    alert(`❌ File "${file.name}" is too large (max ${maxSizeGB}GB)`);
                    return false;
                }
                return true;
            });
            
            selectedFiles = [...selectedFiles, ...validFiles];
            displayFiles();
        }
        
        // Display selected files
        function displayFiles() {
            const fileList = document.getElementById('file-upload-list');
            fileList.innerHTML = '';
            
            if (selectedFiles.length === 0) {
                sendBtn.disabled = true;
                return;
            }
            
            sendBtn.disabled = false;
            
            selectedFiles.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-upload-item';
                fileItem.innerHTML = `
                    <div class="file-upload-icon">${getFileIcon(file.type)}</div>
                    <div class="file-upload-info">
                        <div class="file-upload-name">${file.name}</div>
                        <div class="file-upload-size">${formatFileSize(file.size)}</div>
                    </div>
                    <button class="file-remove-btn" data-index="${index}">✕</button>
                `;
                fileList.appendChild(fileItem);
            });
            
            // Remove file button
            fileList.querySelectorAll('.file-remove-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.index);
                    selectedFiles.splice(index, 1);
                    displayFiles();
                });
            });
        }
        
        // Send files
        sendBtn.addEventListener('click', async () => {
            if (selectedFiles.length === 0) return;
            
            console.log('📤 [FILE-SHARING] Send button clicked, files:', selectedFiles.length);
            
            for (const file of selectedFiles) {
                await uploadFile(file);
            }
            
            selectedFiles = [];
            window.closeFileUploadModal();
        });
    }
    
    // ✅ FIXED: Upload file using correct approach
    async function uploadFile(file) {
        if (!window.currentChatUser) {
            console.error('❌ [FILE-SHARING] No chat user selected');
            alert('Please select a contact first!');
            return;
        }
        
        console.log('📤 [FILE-SHARING] Starting upload:', file.name, formatFileSize(file.size));
        
        const maxSize = window.MAX_FILE_SIZE || MAX_FILE_SIZE;
        
        // Check file size
        if (file.size > maxSize) {
            const maxSizeGB = maxSize / (1024 * 1024 * 1024);
            alert(`File size exceeds ${maxSizeGB}GB limit`);
            return;
        }
        
        // Show progress modal
        showUploadProgress(file.name, 0);
        
        try {
            // Use chunked upload for files > 10MB
            if (file.size > 10 * 1024 * 1024) {
                console.log('📦 [FILE-SHARING] Using chunked upload');
                
                // Check if chunked upload is available
                if (typeof window.uploadFileInChunks !== 'function') {
                    throw new Error('Chunked upload not available. Please refresh the page.');
                }
                
                const result = await window.uploadFileInChunks(
                    file,
                    window.currentChatUser.id,
                    '', // caption
                    (progress, current, total) => {
                        updateUploadProgress(progress, `Uploading chunk ${current}/${total}`);
                    }
                );
                
                if (!result.success) {
                    throw new Error(result.message || 'Upload failed');
                }
            } else {
                // ✅ FIXED: Use regular upload for small files
                console.log('📤 [FILE-SHARING] Using regular upload');
                
                const formData = new FormData();
                formData.append('file', file);
                formData.append('target_user', window.currentChatUser.id);
                
                const response = await fetch('/api/send-file', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || 'Upload failed');
                }
            }
            
            console.log('✅ [FILE-SHARING] File uploaded successfully');
            hideUploadProgress();
            
        } catch (error) {
            console.error('❌ [FILE-SHARING] Upload failed:', error);
            hideUploadProgress();
            alert('Failed to upload file: ' + error.message);
        }
    }

    // Show upload progress modal
    function showUploadProgress(filename, progress) {
        let modal = document.getElementById('upload-progress-modal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'upload-progress-modal';
            modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:100001;display:none;align-items:center;justify-content:center;';
            modal.innerHTML = `
                <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);"></div>
                <div style="position:relative;background:#1f2c33;padding:30px;border-radius:20px;min-width:400px;text-align:center;">
                    <h3 style="color:#e9edef;margin:0 0 20px 0;">📤 Uploading File</h3>
                    <p id="upload-filename" style="color:#8696a0;margin-bottom:20px;">${filename}</p>
                    <div style="width:100%;height:30px;background:rgba(0,0,0,0.3);border-radius:15px;overflow:hidden;margin:20px 0;">
                        <div id="upload-progress-fill" style="height:100%;background:linear-gradient(90deg,#25d366 0%,#20bd5f 100%);transition:width 0.3s ease;width:0%;"></div>
                    </div>
                    <p id="upload-progress-text" style="color:#25d366;font-size:24px;font-weight:bold;margin:10px 0;">0%</p>
                    <p id="upload-progress-status" style="color:#8696a0;font-size:14px;">Preparing upload...</p>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        modal.style.display = 'flex';
        document.getElementById('upload-filename').textContent = filename;
        updateUploadProgress(progress, 'Preparing upload...');
    }

    // Update upload progress
    function updateUploadProgress(progress, status) {
        const fill = document.getElementById('upload-progress-fill');
        const text = document.getElementById('upload-progress-text');
        const statusEl = document.getElementById('upload-progress-status');
        
        if (fill) fill.style.width = progress + '%';
        if (text) text.textContent = Math.round(progress) + '%';
        if (statusEl) statusEl.textContent = status;
    }

    // Hide upload progress
    function hideUploadProgress() {
        const modal = document.getElementById('upload-progress-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // Open/close modal functions
    window.openFileUploadModal = function() {
        const modal = document.getElementById('file-upload-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
        console.log('📂 [FILE-SHARING] Modal opened');
    };
    
    window.closeFileUploadModal = function() {
        const modal = document.getElementById('file-upload-modal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('file-upload-list').innerHTML = '';
            document.getElementById('advanced-file-input').value = '';
            document.getElementById('file-send-btn').disabled = true;
        }
    };
    
    // DON'T hijack the attachment button - let attachment-handler.js control it
    function addFileShareButton() {
        setTimeout(() => {
            const attachBtn = document.getElementById('file-attach-btn');
            if (attachBtn && !attachBtn.dataset.fileShareAdded) {
                attachBtn.dataset.fileShareAdded = 'true';
                console.log('✅ [FILE-SHARING] Ready (controlled by attachment-handler.js)');
            }
        }, 1000);
    }
    
    // Initialize
    function init() {
        createFileUploadModal();
        addFileShareButton();
        addStyles();
        console.log('✅ [FILE-SHARING] Module ready! Max file size:', formatFileSize(window.MAX_FILE_SIZE || MAX_FILE_SIZE));
    }
    
    // Add styles
    function addStyles() {
        const styles = `
            <style>
            .file-upload-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 100000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .file-upload-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
            }
            
            .file-upload-container {
                position: relative;
                width: 90%;
                max-width: 600px;
                background: #1f2c33;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
                animation: modalSlideIn 0.3s ease-out;
            }
            
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            .file-upload-header {
                padding: 20px;
                background: rgba(0, 0, 0, 0.3);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .file-upload-header h3 {
                margin: 0;
                color: #e9edef;
                font-size: 20px;
                font-weight: 500;
            }
            
            .file-upload-close {
                background: none;
                border: none;
                color: #8696a0;
                font-size: 24px;
                cursor: pointer;
                padding: 5px 10px;
                border-radius: 50%;
                transition: all 0.2s;
            }
            
            .file-upload-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #e9edef;
            }
            
            .file-upload-content {
                padding: 20px;
            }
            
            .file-drop-zone {
                border: 2px dashed rgba(255, 255, 255, 0.2);
                border-radius: 15px;
                padding: 40px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
                background: rgba(0, 0, 0, 0.2);
            }
            
            .file-drop-zone:hover {
                border-color: #25d366;
                background: rgba(37, 211, 102, 0.05);
            }
            
            .file-drop-zone.drag-over {
                border-color: #25d366;
                background: rgba(37, 211, 102, 0.1);
                transform: scale(1.02);
            }
            
            .file-drop-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            
            .file-drop-text {
                color: #e9edef;
                font-size: 16px;
                margin-bottom: 5px;
            }
            
            .file-drop-subtext {
                color: #8696a0;
                font-size: 14px;
                margin-bottom: 20px;
            }
            
            .file-browse-btn {
                background: linear-gradient(135deg, #25d366 0%, #20bd5f 100%);
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
            }
            
            .file-browse-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
            }
            
            .file-list {
                margin-top: 20px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .file-upload-item {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
                margin-bottom: 10px;
                transition: all 0.2s;
            }
            
            .file-upload-item:hover {
                background: rgba(0, 0, 0, 0.4);
            }
            
            .file-upload-icon {
                font-size: 32px;
                flex-shrink: 0;
            }
            
            .file-upload-info {
                flex: 1;
                min-width: 0;
            }
            
            .file-upload-name {
                color: #e9edef;
                font-size: 14px;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .file-upload-size {
                color: #8696a0;
                font-size: 12px;
                margin-top: 3px;
            }
            
            .file-remove-btn {
                background: rgba(220, 38, 38, 0.2);
                border: none;
                color: #dc2626;
                font-size: 18px;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.2s;
                flex-shrink: 0;
            }
            
            .file-remove-btn:hover {
                background: rgba(220, 38, 38, 0.3);
                transform: scale(1.1);
            }
            
            .file-upload-actions {
                display: flex;
                gap: 10px;
                margin-top: 20px;
                justify-content: flex-end;
            }
            
            .file-cancel-btn,
            .file-send-btn {
                padding: 12px 30px;
                border: none;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .file-cancel-btn {
                background: rgba(255, 255, 255, 0.1);
                color: #e9edef;
            }
            
            .file-cancel-btn:hover {
                background: rgba(255, 255, 255, 0.15);
            }
            
            .file-send-btn {
                background: linear-gradient(135deg, #25d366 0%, #20bd5f 100%);
                color: white;
                box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
            }
            
            .file-send-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
            }
            
            .file-send-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();