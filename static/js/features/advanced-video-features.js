// ==========================================
// 🎥 CA360 ADVANCED VIDEO FEATURES
// Screen Share • Virtual Backgrounds • Grid View
// Recording • Picture-in-Picture • Beauty Filters
// ==========================================

(function() {
    'use strict';
    
    // ==================== CONFIGURATION ====================
    const VIDEO_CONFIG = {
        screenShare: {
            enabled: true,
            maxWidth: 1920,
            maxHeight: 1080,
            frameRate: 30
        },
        virtualBackground: {
            enabled: true,
            blurAmount: 15,
            segmentationModel: 'meet', // 'meet' or 'general'
            edgeBlurAmount: 3
        },
        gridView: {
            enabled: true,
            maxParticipants: 9,
            layout: 'auto' // 'auto', 'grid', 'spotlight'
        },
        recording: {
            enabled: true,
            mimeType: 'video/webm;codecs=vp8,opus',
            videoBitsPerSecond: 2500000,
            audioBitsPerSecond: 128000
        },
        pip: {
            enabled: true,
            width: 320,
            height: 240
        },
        beautyFilter: {
            enabled: true,
            smoothness: 0.5,
            brightness: 0.1,
            contrast: 0.05
        }
    };

    // ==================== STATE MANAGEMENT ====================
    let screenShareStream = null;
    let screenShareActive = false;
    let virtualBackgroundEnabled = false;
    let backgroundBlurEnabled = false;
    let mediaRecorder = null;
    let recordedChunks = [];
    let isRecording = false;
    let pipWindow = null;
    let beautyFilterEnabled = false;
    let videoProcessor = null;

    // ==================== 1. SCREEN SHARING ====================
    
    async function startScreenShare() {
        console.log('🖥️ [SCREEN] Starting screen share...');
        
        try {
            // Check if already sharing
            if (screenShareActive) {
                console.warn('⚠️ [SCREEN] Already sharing');
                return false;
            }

            // Get screen share stream
            screenShareStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: VIDEO_CONFIG.screenShare.maxWidth },
                    height: { ideal: VIDEO_CONFIG.screenShare.maxHeight },
                    frameRate: { ideal: VIDEO_CONFIG.screenShare.frameRate }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 48000
                }
            });

            console.log('✅ [SCREEN] Screen capture started');

            // Get the video track
            const videoTrack = screenShareStream.getVideoTracks()[0];
            
            // Handle screen share stop (user clicks browser "Stop Sharing")
            videoTrack.onended = () => {
                console.log('🛑 [SCREEN] User stopped sharing');
                stopScreenShare();
            };

            // Replace camera track with screen track in peer connection
            const peerConnection = window.CallingManager?.getState()?.peerConnection;
            if (peerConnection) {
                const senders = peerConnection.getSenders();
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                
                if (videoSender) {
                    await videoSender.replaceTrack(videoTrack);
                    console.log('✅ [SCREEN] Track replaced in peer connection');
                }
            }

            // Update local video display
            const localVideo = document.getElementById('local-video');
            if (localVideo) {
                localVideo.srcObject = screenShareStream;
            }

            // Update UI
            screenShareActive = true;
            updateScreenShareButton(true);

            // Notify other participants
            notifyScreenShareStatus(true);

            return true;

        } catch (error) {
            console.error('❌ [SCREEN] Error:', error);
            
            if (error.name === 'NotAllowedError') {
                showNotification('Screen sharing permission denied', 'error');
            } else if (error.name === 'NotFoundError') {
                showNotification('No screen available to share', 'error');
            } else {
                showNotification('Failed to start screen sharing', 'error');
            }
            
            return false;
        }
    }

    async function stopScreenShare() {
        console.log('🛑 [SCREEN] Stopping screen share...');
        
        if (!screenShareActive) return;

        // Stop screen share tracks
        if (screenShareStream) {
            screenShareStream.getTracks().forEach(track => track.stop());
            screenShareStream = null;
        }

        // Restore camera stream
        const callingState = window.CallingManager?.getState();
        if (callingState && callingState.localStream) {
            const peerConnection = callingState.peerConnection;
            const cameraTrack = callingState.localStream.getVideoTracks()[0];
            
            if (peerConnection && cameraTrack) {
                const senders = peerConnection.getSenders();
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                
                if (videoSender) {
                    await videoSender.replaceTrack(cameraTrack);
                    console.log('✅ [SCREEN] Camera track restored');
                }
            }

            // Restore local video display
            const localVideo = document.getElementById('local-video');
            if (localVideo) {
                localVideo.srcObject = callingState.localStream;
            }
        }

        // Update UI
        screenShareActive = false;
        updateScreenShareButton(false);

        // Notify other participants
        notifyScreenShareStatus(false);

        console.log('✅ [SCREEN] Screen share stopped');
    }

    function toggleScreenShare() {
        if (screenShareActive) {
            stopScreenShare();
        } else {
            startScreenShare();
        }
    }

    // ==================== 2. VIRTUAL BACKGROUNDS ====================

    async function initVirtualBackground() {
        console.log('🎨 [BACKGROUND] Initializing virtual background...');
        
        try {
            // Check if BodyPix is available (for background segmentation)
            if (typeof bodyPix === 'undefined') {
                console.warn('⚠️ [BACKGROUND] BodyPix not loaded, loading from CDN...');
                await loadBodyPixLibrary();
            }

            // Load the segmentation model
            videoProcessor = await bodyPix.load({
                architecture: 'MobileNetV1',
                outputStride: 16,
                multiplier: 0.75,
                quantBytes: 2
            });

            console.log('✅ [BACKGROUND] Virtual background ready');
            return true;

        } catch (error) {
            console.error('❌ [BACKGROUND] Initialization failed:', error);
            return false;
        }
    }

    async function loadBodyPixLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.2.0';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async function enableBackgroundBlur() {
        console.log('🎨 [BACKGROUND] Enabling blur...');
        
        if (!videoProcessor) {
            const initialized = await initVirtualBackground();
            if (!initialized) {
                showNotification('Virtual background not available', 'error');
                return false;
            }
        }

        backgroundBlurEnabled = true;
        await applyBackgroundEffect();
        updateBackgroundButton('blur');
        showNotification('Background blur enabled', 'success');
        
        return true;
    }

    async function enableVirtualBackground(imageUrl) {
        console.log('🎨 [BACKGROUND] Enabling virtual background...');
        
        if (!videoProcessor) {
            const initialized = await initVirtualBackground();
            if (!initialized) {
                showNotification('Virtual background not available', 'error');
                return false;
            }
        }

        virtualBackgroundEnabled = true;
        await applyBackgroundEffect(imageUrl);
        updateBackgroundButton('virtual');
        showNotification('Virtual background enabled', 'success');
        
        return true;
    }

    async function disableBackgroundEffects() {
        console.log('🎨 [BACKGROUND] Disabling effects...');
        
        backgroundBlurEnabled = false;
        virtualBackgroundEnabled = false;
        
        // Restore original video stream
        const callingState = window.CallingManager?.getState();
        if (callingState && callingState.localStream) {
            const localVideo = document.getElementById('local-video');
            if (localVideo) {
                localVideo.srcObject = callingState.localStream;
            }
        }
        
        updateBackgroundButton('none');
        showNotification('Background effects disabled', 'info');
    }

    async function applyBackgroundEffect(backgroundImage = null) {
        const callingState = window.CallingManager?.getState();
        if (!callingState || !callingState.localStream) return;

        const sourceVideo = document.createElement('video');
        sourceVideo.srcObject = callingState.localStream;
        sourceVideo.play();

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        sourceVideo.onloadedmetadata = async () => {
            canvas.width = sourceVideo.videoWidth;
            canvas.height = sourceVideo.videoHeight;

            const processFrame = async () => {
                if (!backgroundBlurEnabled && !virtualBackgroundEnabled) return;

                // Perform segmentation
                const segmentation = await videoProcessor.segmentPerson(sourceVideo, {
                    flipHorizontal: false,
                    internalResolution: 'medium',
                    segmentationThreshold: 0.7
                });

                // Draw the frame
                ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);

                if (backgroundBlurEnabled) {
                    // Apply blur effect
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    bodyPix.drawBokehEffect(
                        canvas, sourceVideo, segmentation,
                        VIDEO_CONFIG.virtualBackground.blurAmount,
                        VIDEO_CONFIG.virtualBackground.edgeBlurAmount
                    );
                } else if (virtualBackgroundEnabled && backgroundImage) {
                    // Apply virtual background
                    bodyPix.drawMask(
                        canvas, sourceVideo, segmentation,
                        1, 0, false
                    );
                }

                requestAnimationFrame(processFrame);
            };

            processFrame();

            // Replace video track with canvas stream
            const processedStream = canvas.captureStream(30);
            const processedTrack = processedStream.getVideoTracks()[0];

            const peerConnection = callingState.peerConnection;
            if (peerConnection) {
                const senders = peerConnection.getSenders();
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                if (videoSender) {
                    await videoSender.replaceTrack(processedTrack);
                }
            }

            // Update local display
            const localVideo = document.getElementById('local-video');
            if (localVideo) {
                localVideo.srcObject = processedStream;
            }
        };
    }

    // ==================== 3. GRID VIEW (MULTIPLE PARTICIPANTS) ====================

    function createGridView(participants) {
        console.log('📊 [GRID] Creating grid view for', participants.length, 'participants');
        
        const container = document.getElementById('video-grid-container') || createGridContainer();
        container.innerHTML = ''; // Clear existing

        const layout = calculateGridLayout(participants.length);
        container.style.gridTemplateColumns = `repeat(${layout.cols}, 1fr)`;
        container.style.gridTemplateRows = `repeat(${layout.rows}, 1fr)`;

        participants.forEach(participant => {
            const videoElement = createParticipantTile(participant);
            container.appendChild(videoElement);
        });

        console.log('✅ [GRID] Grid view created');
    }

    function createGridContainer() {
        const container = document.createElement('div');
        container.id = 'video-grid-container';
        container.style.cssText = `
            display: grid;
            gap: 8px;
            width: 100%;
            height: 100%;
            padding: 8px;
            background: #000;
        `;
        
        const callContainer = document.getElementById('call-video-area');
        if (callContainer) {
            callContainer.appendChild(container);
        }
        
        return container;
    }

    function calculateGridLayout(participantCount) {
        // Calculate optimal grid layout
        if (participantCount <= 1) return { rows: 1, cols: 1 };
        if (participantCount <= 2) return { rows: 1, cols: 2 };
        if (participantCount <= 4) return { rows: 2, cols: 2 };
        if (participantCount <= 6) return { rows: 2, cols: 3 };
        if (participantCount <= 9) return { rows: 3, cols: 3 };
        return { rows: 4, cols: 3 }; // Max 12
    }

    function createParticipantTile(participant) {
        const tile = document.createElement('div');
        tile.className = 'participant-tile';
        tile.style.cssText = `
            position: relative;
            background: #1a1a1a;
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const video = document.createElement('video');
        video.srcObject = participant.stream;
        video.autoplay = true;
        video.playsInline = true;
        video.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;

        const nameLabel = document.createElement('div');
        nameLabel.textContent = participant.name;
        nameLabel.style.cssText = `
            position: absolute;
            bottom: 8px;
            left: 8px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        `;

        tile.appendChild(video);
        tile.appendChild(nameLabel);

        return tile;
    }

    // ==================== 4. CALL RECORDING ====================

    async function startRecording() {
        console.log('🎬 [RECORD] Starting recording...');
        
        try {
            const callingState = window.CallingManager?.getState();
            if (!callingState || !callingState.localStream) {
                throw new Error('No active call to record');
            }

            // Create a combined stream (local + remote)
            const combinedStream = new MediaStream();
            
            // Add local tracks
            callingState.localStream.getTracks().forEach(track => {
                combinedStream.addTrack(track);
            });

            // Add remote tracks
            if (callingState.remoteStream) {
                callingState.remoteStream.getTracks().forEach(track => {
                    combinedStream.addTrack(track);
                });
            }

            // Create MediaRecorder
            const options = {
                mimeType: VIDEO_CONFIG.recording.mimeType,
                videoBitsPerSecond: VIDEO_CONFIG.recording.videoBitsPerSecond,
                audioBitsPerSecond: VIDEO_CONFIG.recording.audioBitsPerSecond
            };

            mediaRecorder = new MediaRecorder(combinedStream, options);
            recordedChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                    console.log('📦 [RECORD] Chunk received:', event.data.size, 'bytes');
                }
            };

            mediaRecorder.onstop = () => {
                console.log('🛑 [RECORD] Recording stopped');
                saveRecording();
            };

            mediaRecorder.onerror = (error) => {
                console.error('❌ [RECORD] Error:', error);
                showNotification('Recording error occurred', 'error');
            };

            // Start recording (capture every 1 second)
            mediaRecorder.start(1000);
            isRecording = true;

            updateRecordButton(true);
            showNotification('Recording started', 'success');

            console.log('✅ [RECORD] Recording started successfully');
            return true;

        } catch (error) {
            console.error('❌ [RECORD] Failed to start:', error);
            showNotification('Failed to start recording: ' + error.message, 'error');
            return false;
        }
    }

    function stopRecording() {
        console.log('🛑 [RECORD] Stopping recording...');
        
        if (!isRecording || !mediaRecorder) {
            console.warn('⚠️ [RECORD] No active recording');
            return;
        }

        mediaRecorder.stop();
        isRecording = false;
        updateRecordButton(false);
    }

    function saveRecording() {
        console.log('💾 [RECORD] Saving recording...');
        
        if (recordedChunks.length === 0) {
            console.warn('⚠️ [RECORD] No data to save');
            return;
        }

        const blob = new Blob(recordedChunks, { type: VIDEO_CONFIG.recording.mimeType });
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `CA360_Call_${timestamp}.webm`;

        // Create download link
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        console.log(`✅ [RECORD] Saved ${filename} (${sizeMB} MB)`);
        showNotification(`Recording saved: ${sizeMB} MB`, 'success');

        // Clear recorded chunks
        recordedChunks = [];
    }

    function toggleRecording() {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }

    // ==================== 5. PICTURE-IN-PICTURE ====================

    async function enablePictureInPicture() {
        console.log('📱 [PIP] Enabling picture-in-picture...');
        
        try {
            const remoteVideo = document.getElementById('remote-video');
            
            if (!remoteVideo) {
                throw new Error('No video element found');
            }

            if (!document.pictureInPictureEnabled) {
                throw new Error('Picture-in-picture not supported');
            }

            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                pipWindow = null;
                updatePipButton(false);
                console.log('🛑 [PIP] Disabled');
                return;
            }

            pipWindow = await remoteVideo.requestPictureInPicture();
            
            pipWindow.addEventListener('resize', () => {
                console.log('📐 [PIP] Resized:', pipWindow.width, 'x', pipWindow.height);
            });

            remoteVideo.addEventListener('leavepictureinpicture', () => {
                console.log('🛑 [PIP] User closed PIP');
                pipWindow = null;
                updatePipButton(false);
            });

            updatePipButton(true);
            showNotification('Picture-in-picture enabled', 'success');
            console.log('✅ [PIP] Enabled');

        } catch (error) {
            console.error('❌ [PIP] Error:', error);
            showNotification('Picture-in-picture not available', 'error');
        }
    }

    async function disablePictureInPicture() {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
            pipWindow = null;
            updatePipButton(false);
        }
    }

    // ==================== 6. BEAUTY FILTERS ====================

    async function enableBeautyFilter() {
        console.log('✨ [BEAUTY] Enabling beauty filter...');
        
        beautyFilterEnabled = true;
        await applyBeautyFilter();
        updateBeautyButton(true);
        showNotification('Beauty filter enabled', 'success');
    }

    async function disableBeautyFilter() {
        console.log('🛑 [BEAUTY] Disabling beauty filter...');
        
        beautyFilterEnabled = false;
        
        // Restore original video
        const callingState = window.CallingManager?.getState();
        if (callingState && callingState.localStream) {
            const localVideo = document.getElementById('local-video');
            if (localVideo) {
                localVideo.srcObject = callingState.localStream;
            }
        }
        
        updateBeautyButton(false);
        showNotification('Beauty filter disabled', 'info');
    }

    async function applyBeautyFilter() {
        const callingState = window.CallingManager?.getState();
        if (!callingState || !callingState.localStream) return;

        const sourceVideo = document.createElement('video');
        sourceVideo.srcObject = callingState.localStream;
        sourceVideo.play();

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        sourceVideo.onloadedmetadata = () => {
            canvas.width = sourceVideo.videoWidth;
            canvas.height = sourceVideo.videoHeight;

            const processFrame = () => {
                if (!beautyFilterEnabled) return;

                // Draw original frame
                ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);

                // Apply beauty filter
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                applyBeautyEffect(imageData);
                ctx.putImageData(imageData, 0, 0);

                requestAnimationFrame(processFrame);
            };

            processFrame();

            // Replace video track
            const processedStream = canvas.captureStream(30);
            const processedTrack = processedStream.getVideoTracks()[0];

            const peerConnection = callingState.peerConnection;
            if (peerConnection) {
                const senders = peerConnection.getSenders();
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                if (videoSender) {
                    videoSender.replaceTrack(processedTrack);
                }
            }

            const localVideo = document.getElementById('local-video');
            if (localVideo) {
                localVideo.srcObject = processedStream;
            }
        };
    }

    function applyBeautyEffect(imageData) {
        const data = imageData.data;
        const smoothness = VIDEO_CONFIG.beautyFilter.smoothness;
        const brightness = VIDEO_CONFIG.beautyFilter.brightness;
        const contrast = VIDEO_CONFIG.beautyFilter.contrast;

        for (let i = 0; i < data.length; i += 4) {
            // Smoothing (simple blur approximation)
            data[i] = data[i] * (1 - smoothness) + 128 * smoothness;
            data[i + 1] = data[i + 1] * (1 - smoothness) + 128 * smoothness;
            data[i + 2] = data[i + 2] * (1 - smoothness) + 128 * smoothness;

            // Brightness
            data[i] = Math.min(255, data[i] * (1 + brightness));
            data[i + 1] = Math.min(255, data[i + 1] * (1 + brightness));
            data[i + 2] = Math.min(255, data[i + 2] * (1 + brightness));

            // Contrast
            data[i] = Math.max(0, Math.min(255, (data[i] - 128) * (1 + contrast) + 128));
            data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - 128) * (1 + contrast) + 128));
            data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - 128) * (1 + contrast) + 128));
        }
    }

    function toggleBeautyFilter() {
        if (beautyFilterEnabled) {
            disableBeautyFilter();
        } else {
            enableBeautyFilter();
        }
    }

    // ==================== UI UPDATES ====================

    function updateScreenShareButton(active) {
        const btn = document.getElementById('screen-share-btn');
        if (btn) {
            btn.innerHTML = active ? '🛑' : '🖥️';
            btn.style.background = active ? '#ef4444' : 'rgba(255,255,255,0.1)';
            btn.title = active ? 'Stop sharing screen' : 'Share screen';
        }
    }

    function updateBackgroundButton(mode) {
        const btn = document.getElementById('background-btn');
        if (btn) {
            const icons = { none: '🎨', blur: '🌫️', virtual: '🖼️' };
            btn.innerHTML = icons[mode] || '🎨';
            btn.style.background = mode !== 'none' ? '#8b5cf6' : 'rgba(255,255,255,0.1)';
        }
    }

    function updateRecordButton(recording) {
        const btn = document.getElementById('record-btn');
        if (btn) {
            btn.innerHTML = recording ? '⏹️' : '🎬';
            btn.style.background = recording ? '#ef4444' : 'rgba(255,255,255,0.1)';
            btn.title = recording ? 'Stop recording' : 'Start recording';
            
            if (recording) {
                btn.classList.add('recording-pulse');
            } else {
                btn.classList.remove('recording-pulse');
            }
        }
    }

    function updatePipButton(active) {
        const btn = document.getElementById('pip-btn');
        if (btn) {
            btn.innerHTML = active ? '📺' : '📱';
            btn.style.background = active ? '#3b82f6' : 'rgba(255,255,255,0.1)';
            btn.title = active ? 'Exit picture-in-picture' : 'Enable picture-in-picture';
        }
    }

    function updateBeautyButton(active) {
        const btn = document.getElementById('beauty-btn');
        if (btn) {
            btn.innerHTML = '✨';
            btn.style.background = active ? '#ec4899' : 'rgba(255,255,255,0.1)';
            btn.title = active ? 'Disable beauty filter' : 'Enable beauty filter';
        }
    }

    // ==================== NOTIFICATIONS ====================

    function showNotification(message, type = 'info') {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10002;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function notifyScreenShareStatus(active) {
        // Notify other participants via WebSocket
        if (window.socket) {
            window.socket.emit('screen_share_status', {
                active: active,
                userId: window.AuthManager?.getCurrentUser()?.id
            });
        }
    }

    // ==================== PUBLIC API ====================

    window.AdvancedVideoFeatures = {
        // Screen Sharing
        startScreenShare,
        stopScreenShare,
        toggleScreenShare,
        isScreenSharing: () => screenShareActive,
        
        // Virtual Backgrounds
        enableBackgroundBlur,
        enableVirtualBackground,
        disableBackgroundEffects,
        isBackgroundEnabled: () => backgroundBlurEnabled || virtualBackgroundEnabled,
        
        // Grid View
        createGridView,
        
        // Recording
        startRecording,
        stopRecording,
        toggleRecording,
        isRecording: () => isRecording,
        
        // Picture-in-Picture
        enablePictureInPicture,
        disablePictureInPicture,
        isPipActive: () => pipWindow !== null,
        
        // Beauty Filter
        enableBeautyFilter,
        disableBeautyFilter,
        toggleBeautyFilter,
        isBeautyFilterEnabled: () => beautyFilterEnabled
    };

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
        .recording-pulse {
            animation: recordingPulse 1.5s infinite;
        }
        @keyframes recordingPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);

    console.log('✅ [AdvancedVideoFeatures] Module loaded');
    console.log('🎥 [AdvancedVideoFeatures] All 6 features available!');

})();