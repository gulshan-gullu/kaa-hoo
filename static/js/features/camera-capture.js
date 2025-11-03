// ========================================
// CAMERA CAPTURE - WHATSAPP STYLE
// ========================================

(function() {
    'use strict';
    
    let cameraStream = null;
    let capturedPhoto = null;
    
    window.openCameraCapture = async function() {
        console.log('📷 Opening camera capture...');
        
        try {
            // Request camera access
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            showCameraUI();
            
            // Set video stream
            const video = document.getElementById('camera-preview');
            if (video) {
                video.srcObject = cameraStream;
                video.play();
            }
            
        } catch (error) {
            console.error('❌ Camera error:', error);
            alert('Unable to access camera. Please check permissions.');
        }
    };
    
    function showCameraUI() {
        const cameraHTML = `
            <div id="camera-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000; z-index: 10000; display: flex; flex-direction: column;">
                <!-- Header -->
                <div style="padding: 20px; background: rgba(0,0,0,0.8); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="color: white; margin: 0; font-size: 18px;">Take a photo</h2>
                    <button onclick="closeCameraCapture()" style="background: none; border: none; color: white; font-size: 28px; cursor: pointer;">×</button>
                </div>
                
                <!-- Camera Preview -->
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #000; position: relative;">
                    <video id="camera-preview" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
                    <canvas id="camera-canvas" style="display: none;"></canvas>
                </div>
                
                <!-- Controls -->
                <div style="padding: 30px; background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center; gap: 40px;">
                    <button onclick="switchCamera()" style="width: 50px; height: 50px; border-radius: 50%; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 24px; cursor: pointer;">🔄</button>
                    <button onclick="capturePhoto()" style="width: 70px; height: 70px; border-radius: 50%; background: #25d366; border: 5px solid white; cursor: pointer; box-shadow: 0 4px 20px rgba(37,211,102,0.5);"></button>
                    <button onclick="toggleFlash()" style="width: 50px; height: 50px; border-radius: 50%; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 24px; cursor: pointer;">⚡</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', cameraHTML);
    }
    
    window.capturePhoto = function() {
        console.log('📸 Capturing photo...');
        
        const video = document.getElementById('camera-preview');
        const canvas = document.getElementById('camera-canvas');
        
        if (!video || !canvas) return;
        
        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Convert to blob
        canvas.toBlob(function(blob) {
            capturedPhoto = blob;
            showPhotoPreview(canvas.toDataURL());
        }, 'image/jpeg', 0.95);
    };
    
    function showPhotoPreview(dataURL) {
        const cameraModal = document.getElementById('camera-modal');
        if (!cameraModal) return;
        
        cameraModal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000; z-index: 10000; display: flex; flex-direction: column;">
                <!-- Header -->
                <div style="padding: 20px; background: rgba(0,0,0,0.8); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="color: white; margin: 0; font-size: 18px;">Preview</h2>
                    <button onclick="closeCameraCapture()" style="background: none; border: none; color: white; font-size: 28px; cursor: pointer;">×</button>
                </div>
                
                <!-- Photo Preview -->
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #000;">
                    <img src="${dataURL}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                
                <!-- Controls -->
                <div style="padding: 30px; background: rgba(0,0,0,0.9); display: flex; justify-content: center; gap: 40px;">
                    <button onclick="retakePhoto()" style="padding: 15px 30px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 25px; cursor: pointer; font-size: 16px;">Retake</button>
                    <button onclick="sendCapturedPhoto()" style="padding: 15px 40px; background: #25d366; border: none; color: white; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: 600;">Send</button>
                </div>
            </div>
        `;
    }
    
    window.retakePhoto = function() {
        capturedPhoto = null;
        const cameraModal = document.getElementById('camera-modal');
        if (cameraModal) cameraModal.remove();
        window.openCameraCapture();
    };
    
    window.sendCapturedPhoto = function() {
        if (!capturedPhoto) return;
        
        console.log('📤 Sending captured photo...');
        
        // Create a File object
        const file = new File([capturedPhoto], 'camera_photo.jpg', { type: 'image/jpeg' });
        
        // Send the photo
        if (window.currentChatUser) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('target_user', window.currentChatUser.id);
            
            fetch('/api/send-file', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('✅ Photo sent successfully!');
                    closeCameraCapture();
                } else {
                    alert('Failed to send photo: ' + data.message);
                }
            })
            .catch(error => {
                console.error('❌ Error sending photo:', error);
                alert('Failed to send photo');
            });
        }
    };
    
    window.closeCameraCapture = function() {
        console.log('📷 Closing camera...');
        
        // Stop camera stream
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        
        // Remove UI
        const cameraModal = document.getElementById('camera-modal');
        if (cameraModal) cameraModal.remove();
        
        capturedPhoto = null;
    };
    
    window.switchCamera = function() {
        console.log('🔄 Switching camera...');
        // TODO: Implement camera switching
        alert('Camera switching coming soon!');
    };
    
    window.toggleFlash = function() {
        console.log('⚡ Toggle flash...');
        // TODO: Implement flash toggle
        alert('Flash toggle coming soon!');
    };
    
})();