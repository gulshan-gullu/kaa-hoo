// 🎙️ WHATSAPP-STYLE MEDIA HANDLER
// Voice messages, camera, and file uploads

class WhatsAppMediaHandler {
    constructor() {
        // Voice Recording
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordingStartTime = null;
        this.recordingTimer = null;
        this.audioStream = null;

        // Camera
        this.cameraStream = null;
        this.facingMode = 'user'; // 'user' or 'environment'
        this.capturedImage = null;

        // File Upload
        this.selectedFiles = [];
        this.currentFilePreview = null;

        console.log('✅ [WHATSAPP-MEDIA] Module initialized');
    }

    init() {
        this.attachEventListeners();
        this.checkMediaPermissions();
        console.log('✅ [WHATSAPP-MEDIA] Event listeners attached');
    }

    attachEventListeners() {
        // Voice Recording Button - Hold to record
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            // Desktop: Click and hold
            voiceBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.startVoiceRecording();
            });

            voiceBtn.addEventListener('mouseup', () => {
                if (this.isRecording) {
                    this.showRecordingInterface();
                }
            });

            // Mobile: Touch and hold
            voiceBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.startVoiceRecording();
            });

            voiceBtn.addEventListener('touchend', () => {
                if (this.isRecording) {
                    this.showRecordingInterface();
                }
            });
        }

        // Voice Recording Controls
        const voiceCancelBtn = document.getElementById('voice-rec-cancel');
        const voiceSendBtn = document.getElementById('voice-rec-send');

        if (voiceCancelBtn) {
            voiceCancelBtn.addEventListener('click', () => {
                this.cancelVoiceRecording();
            });
        }

        if (voiceSendBtn) {
            voiceSendBtn.addEventListener('click', () => {
                this.sendVoiceMessage();
            });
        }

        // Camera Button
        const cameraBtn = document.getElementById('camera-btn');
        if (cameraBtn) {
            cameraBtn.addEventListener('click', () => {
                this.openCamera();
            });
        }

        // Camera Controls
        const cameraFlipBtn = document.getElementById('camera-flip-btn');
        const cameraCaptureBtn = document.getElementById('camera-capture-btn');
        const cameraCloseBtn = document.getElementById('camera-modal-close');

        if (cameraFlipBtn) {
            cameraFlipBtn.addEventListener('click', () => {
                this.flipCamera();
            });
        }

        if (cameraCaptureBtn) {
            cameraCaptureBtn.addEventListener('click', () => {
                this.capturePhoto();
            });
        }

        if (cameraCloseBtn) {
            cameraCloseBtn.addEventListener('click', () => {
                this.closeCamera();
            });
        }

        // Gallery/File Button
        const galleryBtn = document.getElementById('gallery-btn');
        const fileInput = document.getElementById('file-input');

        if (galleryBtn && fileInput) {
            galleryBtn.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e);
            });
        }

        // Media Preview Controls
        const previewCloseBtn = document.getElementById('media-preview-close');
        const mediaCancelBtn = document.getElementById('media-cancel-btn');
        const mediaSendBtn = document.getElementById('media-send-btn');

        if (previewCloseBtn) {
            previewCloseBtn.addEventListener('click', () => {
                this.closeMediaPreview();
            });
        }

        if (mediaCancelBtn) {
            mediaCancelBtn.addEventListener('click', () => {
                this.closeMediaPreview();
            });
        }

        if (mediaSendBtn) {
            mediaSendBtn.addEventListener('click', () => {
                this.sendMediaMessage();
            });
        }
    }

    // ============================================
    // 🎙️ VOICE RECORDING
    // ============================================

    async startVoiceRecording() {
        try {
            console.log('🎙️ [VOICE] Starting recording...');

            // Request microphone permission
            this.audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Setup MediaRecorder
            const mimeType = this.getBestAudioMimeType();
            this.mediaRecorder = new MediaRecorder(this.audioStream, {
                mimeType: mimeType,
                audioBitsPerSecond: 128000
            });

            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                console.log('🎙️ [VOICE] Recording stopped');
            };

            // Start recording
            this.mediaRecorder.start(100);
            this.isRecording = true;
            this.recordingStartTime = Date.now();

            // Start timer
            this.startRecordingTimer();

            console.log('✅ [VOICE] Recording started');

        } catch (error) {
            console.error('❌ [VOICE] Failed to start recording:', error);
            
            let errorMessage = 'Microphone access denied';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Please allow microphone access in your browser settings';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No microphone found';
            }

            if (window.showNotification) {
                window.showNotification(errorMessage, 'error');
            }
        }
    }

    showRecordingInterface() {
        const recordingInterface = document.getElementById('voice-recording-interface');
        if (recordingInterface) {
            recordingInterface.classList.add('show');
        }
    }

    hideRecordingInterface() {
        const recordingInterface = document.getElementById('voice-recording-interface');
        if (recordingInterface) {
            recordingInterface.classList.remove('show');
        }
    }

    startRecordingTimer() {
        const timeDisplay = document.getElementById('voice-rec-time');
        if (!timeDisplay) return;

        this.recordingTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    async sendVoiceMessage() {
        if (!this.mediaRecorder || !this.isRecording) return;

        // Stop recording
        this.mediaRecorder.stop();
        this.isRecording = false;
        this.stopRecordingTimer();

        // Stop audio stream
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }

        // Hide interface
        this.hideRecordingInterface();

        // Create blob
        const audioBlob = new Blob(this.audioChunks, { 
            type: this.mediaRecorder.mimeType 
        });

        const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);

        console.log('📤 [VOICE] Uploading voice message...');

        // Get current chat user
        const currentChatUser = window.currentChatUser || 'Unknown';

        // Upload to server
        const formData = new FormData();
        formData.append('voice', audioBlob, 'voice-message.webm');
        formData.append('from_user', window.currentUser || 'Unknown');
        formData.append('to_user', currentChatUser);
        formData.append('duration', duration);

        try {
            const response = await fetch('/api/upload-voice', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ [VOICE] Upload successful:', result);

                // Display locally
                this.displayVoiceMessage(audioBlob, duration);

                // Broadcast via WebSocket
                if (window.socket) {
                    window.socket.emit('send_voice_message', {
                        room: currentChatUser,
                        from_user: window.currentUser,
                        filename: result.filename,
                        url: result.url,
                        duration: result.duration,
                        size: result.size
                    });
                }

                if (window.showNotification) {
                    window.showNotification('Voice message sent', 'success');
                }
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('❌ [VOICE] Upload failed:', error);
            if (window.showNotification) {
                window.showNotification('Failed to send voice message: ' + error.message, 'error');
            }
        }
    }

    cancelVoiceRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.stopRecordingTimer();

            // Stop audio stream
            if (this.audioStream) {
                this.audioStream.getTracks().forEach(track => track.stop());
            }

            this.hideRecordingInterface();

            if (window.showNotification) {
                window.showNotification('Voice message cancelled', 'info');
            }
        }
    }

    displayVoiceMessage(audioBlob, duration) {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;

        const audioUrl = URL.createObjectURL(audioBlob);

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-sent';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="voice-message">
                    <button class="voice-msg-play-btn" data-audio-url="${audioUrl}">
                        ▶️
                    </button>
                    <div class="voice-msg-waveform">
                        ${this.generateWaveformBars(20)}
                    </div>
                    <span class="voice-msg-duration">${this.formatDuration(duration)}</span>
                </div>
                <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Add play functionality
        const playBtn = messageDiv.querySelector('.voice-msg-play-btn');
        if (playBtn) {
            let audio = null;
            playBtn.addEventListener('click', () => {
                if (!audio) {
                    audio = new Audio(audioUrl);
                    audio.onended = () => {
                        playBtn.textContent = '▶️';
                    };
                }

                if (audio.paused) {
                    audio.play();
                    playBtn.textContent = '⏸️';
                } else {
                    audio.pause();
                    playBtn.textContent = '▶️';
                }
            });
        }
    }

    generateWaveformBars(count) {
        let bars = '';
        for (let i = 0; i < count; i++) {
            bars += '<div class="voice-msg-bar"></div>';
        }
        return bars;
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    getBestAudioMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return 'audio/webm';
    }

    // ============================================
    // 📷 CAMERA FUNCTIONALITY
    // ============================================

    async openCamera() {
        try {
            console.log('📷 [CAMERA] Opening camera...');

            const cameraModal = document.getElementById('camera-modal');
            const cameraVideo = document.getElementById('camera-stream');

            if (!cameraModal || !cameraVideo) return;

            // Request camera permission
            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: this.facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            cameraVideo.srcObject = this.cameraStream;
            cameraModal.classList.add('show');

            console.log('✅ [CAMERA] Camera opened');

        } catch (error) {
            console.error('❌ [CAMERA] Failed to open camera:', error);
            
            let errorMessage = 'Camera access denied';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Please allow camera access in your browser settings';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera found';
            }

            if (window.showNotification) {
                window.showNotification(errorMessage, 'error');
            }
        }
    }

    async flipCamera() {
        this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
        
        // Close current stream
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
        }

        // Reopen with new facing mode
        await this.openCamera();
    }

    capturePhoto() {
        const cameraVideo = document.getElementById('camera-stream');
        const cameraCanvas = document.getElementById('camera-canvas');

        if (!cameraVideo || !cameraCanvas) return;

        // Set canvas size to video size
        cameraCanvas.width = cameraVideo.videoWidth;
        cameraCanvas.height = cameraVideo.videoHeight;

        // Draw video frame to canvas
        const ctx = cameraCanvas.getContext('2d');
        ctx.drawImage(cameraVideo, 0, 0);

        // Convert to blob
        cameraCanvas.toBlob((blob) => {
            this.capturedImage = blob;
            
            // Close camera
            this.closeCamera();

            // Show preview
            this.showMediaPreview(blob, 'image');

            console.log('📸 [CAMERA] Photo captured');
        }, 'image/jpeg', 0.95);
    }

    closeCamera() {
        const cameraModal = document.getElementById('camera-modal');
        
        if (cameraModal) {
            cameraModal.classList.remove('show');
        }

        // Stop camera stream
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
    }

    // ============================================
    // 📁 FILE HANDLING
    // ============================================

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        // For now, handle first file only
        const file = files[0];

        console.log('📁 [FILE] Selected:', file.name, file.type, this.formatFileSize(file.size));

        // Validate file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
            if (window.showNotification) {
                window.showNotification('File too large (max 100MB)', 'error');
            }
            return;
        }

        // Determine type
        let type = 'file';
        if (file.type.startsWith('image/')) {
            type = 'image';
        } else if (file.type.startsWith('video/')) {
            type = 'video';
        }

        this.currentFilePreview = { file, type };
        this.showMediaPreview(file, type);

        // Reset input
        event.target.value = '';
    }

    showMediaPreview(file, type) {
        const modal = document.getElementById('media-preview-modal');
        const content = document.getElementById('media-preview-content');

        if (!modal || !content) return;

        content.innerHTML = '';

        if (type === 'image') {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            content.appendChild(img);
        } else if (type === 'video') {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.controls = true;
            content.appendChild(video);
        } else {
            // Show file info for other types
            content.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #e9edef;">
                    <div style="font-size: 64px; margin-bottom: 20px;">📄</div>
                    <div style="font-size: 16px; font-weight: 600;">${file.name}</div>
                    <div style="font-size: 14px; opacity: 0.7; margin-top: 10px;">
                        ${this.formatFileSize(file.size)}
                    </div>
                </div>
            `;
        }

        modal.classList.add('show');
    }

    closeMediaPreview() {
        const modal = document.getElementById('media-preview-modal');
        const content = document.getElementById('media-preview-content');
        const caption = document.getElementById('media-preview-caption');

        if (modal) {
            modal.classList.remove('show');
        }

        if (content) {
            // Clean up blob URLs
            const media = content.querySelector('img, video');
            if (media) {
                URL.revokeObjectURL(media.src);
            }
            content.innerHTML = '';
        }

        if (caption) {
            caption.value = '';
        }

        this.currentFilePreview = null;
        this.capturedImage = null;
    }

    async sendMediaMessage() {
        if (!this.currentFilePreview && !this.capturedImage) return;

        const caption = document.getElementById('media-preview-caption')?.value || '';
        const file = this.capturedImage || this.currentFilePreview.file;
        const type = this.capturedImage ? 'image' : this.currentFilePreview.type;

        console.log('📤 [MEDIA] Uploading media...');

        // Show notification
        if (window.showNotification) {
            window.showNotification('Uploading...', 'info');
        }

        // Get current chat user
        const currentChatUser = window.currentChatUser || 'Unknown';

        // Upload to server
        const formData = new FormData();
        formData.append('file', file, file.name || 'captured-image.jpg');
        formData.append('from_user', window.currentUser || 'Unknown');
        formData.append('to_user', currentChatUser);
        formData.append('caption', caption);

        try {
            const response = await fetch('/api/upload-media', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ [MEDIA] Upload successful:', result);

                // Display locally
                this.displayMediaMessage(file, type, caption);

                // Broadcast via WebSocket
                if (window.socket) {
                    window.socket.emit('send_media_message', {
                        room: currentChatUser,
                        from_user: window.currentUser,
                        media_type: result.type,
                        filename: result.filename,
                        original_filename: result.original_filename,
                        url: result.url,
                        caption: result.caption,
                        size: result.size,
                        mime_type: result.mime_type
                    });
                }

                // Close preview
                this.closeMediaPreview();

                if (window.showNotification) {
                    window.showNotification('Media sent successfully', 'success');
                }
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('❌ [MEDIA] Upload failed:', error);
            if (window.showNotification) {
                window.showNotification('Failed to send media: ' + error.message, 'error');
            }
        }
    }

    displayMediaMessage(file, type, caption) {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;

        const url = URL.createObjectURL(file);

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-sent';
        
        let mediaHTML = '';
        
        if (type === 'image') {
            mediaHTML = `<img src="${url}" style="max-width: 100%; border-radius: 10px; display: block;" alt="Image">`;
        } else if (type === 'video') {
            mediaHTML = `<video src="${url}" controls style="max-width: 100%; border-radius: 10px; display: block;"></video>`;
        } else {
            const fileName = file.name || 'file';
            mediaHTML = `
                <div style="padding: 15px; background: rgba(42, 57, 66, 0.5); border-radius: 10px; display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 32px;">📄</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 5px;">${fileName}</div>
                        <div style="font-size: 12px; opacity: 0.7;">${this.formatFileSize(file.size)}</div>
                    </div>
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-content">
                ${mediaHTML}
                ${caption ? `<p style="margin-top: 10px;">${caption}</p>` : ''}
                <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        return (bytes / 1073741824).toFixed(1) + ' GB';
    }

    // ============================================
    // ✅ PERMISSIONS CHECK
    // ============================================

    async checkMediaPermissions() {
        try {
            // Check microphone permission
            const audioPermission = await navigator.permissions.query({ name: 'microphone' });
            console.log('🎙️ Microphone permission:', audioPermission.state);

            // Check camera permission
            const videoPermission = await navigator.permissions.query({ name: 'camera' });
            console.log('📷 Camera permission:', videoPermission.state);

        } catch (error) {
            console.log('⚠️ Permissions API not supported');
        }
    }
}

// Export to global scope
window.whatsappMedia = new WhatsAppMediaHandler();