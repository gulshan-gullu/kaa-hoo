// ==========================================
// 🎤 VOICE RECORDING
// Record and send voice messages
// Dependencies: MessagingManager, ModalManager
// ==========================================

(function() {
    'use strict';
    
    let mediaRecorder = null;
    let audioChunks = [];
    let recordingTimer = null;
    let recordingSeconds = 0;
    
    // Start voice recording
    async function startVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            recordingSeconds = 0;
            
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                await sendVoiceMessage(audioBlob);
            };
            
            mediaRecorder.start();
            const recordingModal = document.getElementById('recording-modal');
            if (recordingModal) recordingModal.style.display = 'block';
            
            recordingTimer = setInterval(() => {
                recordingSeconds++;
                const minutes = Math.floor(recordingSeconds / 60);
                const seconds = recordingSeconds % 60;
                const timerElement = document.getElementById('recording-timer');
                if (timerElement) {
                    timerElement.textContent = 
                        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
                
                if (recordingSeconds >= 120) stopRecording();
            }, 1000);
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Unable to access microphone. Please check permissions.');
        }
    }
    
    // Stop recording
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            clearInterval(recordingTimer);
            const recordingModal = document.getElementById('recording-modal');
            if (recordingModal) recordingModal.style.display = 'none';
        }
    }
    
    // Cancel recording
    function cancelRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.ondataavailable = null;
            mediaRecorder.onstop = null;
            mediaRecorder.stop();
            if (mediaRecorder.stream) {
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
        }
        clearInterval(recordingTimer);
        const recordingModal = document.getElementById('recording-modal');
        if (recordingModal) recordingModal.style.display = 'none';
        audioChunks = [];
    }
    
    // Send voice message
    async function sendVoiceMessage(audioBlob) {
        const currentChatUser = window.currentChatUser;
        
        if (!currentChatUser) {
            alert('Please select a contact first');
            return;
        }
        
        console.log('🎤 Preparing voice message...');
        console.log('📊 Blob size:', audioBlob.size);
        console.log('📊 Blob type:', audioBlob.type);
        console.log('👤 Target user:', currentChatUser.id);
        
        const formData = new FormData();
        
        // Create a proper File object with correct MIME type
        const voiceFile = new File([audioBlob], 'voice_message.webm', { 
            type: 'audio/webm'
        });
        
        formData.append('file', voiceFile);
        formData.append('target_user', currentChatUser.id);
        formData.append('caption', `🎤 Voice message (${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, '0')})`);
        
        console.log('📤 Sending voice message to server...');
        
        try {
            const response = await fetch('/api/send-voice', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', response.headers.get('content-type'));
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
                throw new Error('Server error: ' + response.status);
            }
            
            const data = await response.json();
            console.log('📥 Server response:', data);
            
            if (data.success) {
                console.log('✅ Voice message sent successfully!');
            } else {
                console.error('❌ Server rejected voice message:', data.message);
                alert('Failed to send voice message: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Error sending voice message:', error);
            alert('Failed to send voice message: ' + error.message);
        }
    }
    
    // Expose to window
    window.VoiceRecorder = {
        start: startVoiceRecording,
        stop: stopRecording,
        cancel: cancelRecording
    };
    
    console.log('✅ [VoiceRecorder] Module loaded');
    
})();