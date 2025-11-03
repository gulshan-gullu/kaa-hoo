// ==================== SMART MUTE DETECTION ====================

let isMuted = false;
let audioContext = null;
let analyser = null;
let microphone = null;
let muteDetectionInterval = null;
let lastSpeechTime = 0;

function startMuteDetection(stream) {
    console.log('ðŸ”‡ [MUTE] Starting smart mute detection...');
    
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;
        microphone.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        muteDetectionInterval = setInterval(() => {
            if (!isMuted) return;
            
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            
            if (average > 20) {
                const now = Date.now();
                
                if (now - lastSpeechTime > 2000) {
                    showMuteWarning();
                    lastSpeechTime = now;
                    console.log('ðŸ”‡ [MUTE] Speech detected while muted! Volume:', average);
                }
            }
        }, 100);
        
        console.log('âœ… [MUTE] Detection started');
    } catch (error) {
        console.error('âŒ [MUTE] Failed to start detection:', error);
    }
}

function stopMuteDetection() {
    if (muteDetectionInterval) {
        clearInterval(muteDetectionInterval);
        muteDetectionInterval = null;
    }
    
    if (microphone) {
        microphone.disconnect();
        microphone = null;
    }
    
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    
    analyser = null;
    console.log('ðŸ”‡ [MUTE] Detection stopped');
}

function showMuteWarning() {
    const warning = document.getElementById('muteWarning');
    if (!warning) return;
    
    warning.classList.add('show');
    
    setTimeout(() => {
        warning.classList.remove('show');
    }, 3000);
}

function initMuteDetection() {
    const muteBtn = document.getElementById('muteBtn');
    
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            
            const unmutedIcon = muteBtn.querySelector('.icon-unmuted');
            const mutedIcon = muteBtn.querySelector('.icon-muted');
            
            if (isMuted) {
                unmutedIcon.style.display = 'none';
                mutedIcon.style.display = 'block';
                muteBtn.style.background = 'rgba(239, 68, 68, 0.3)';
                console.log('ðŸ”‡ [MUTE] Microphone muted');
            } else {
                unmutedIcon.style.display = 'block';
                mutedIcon.style.display = 'none';
                muteBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                console.log('ðŸŽ¤ [MUTE] Microphone unmuted');
            }
            
            if (window.localStream) {
                const audioTrack = window.localStream.getAudioTracks()[0];
                if (audioTrack) {
                    audioTrack.enabled = !isMuted;
                }
            }
        });
    }
    
    console.log('âœ… Mute Detection Module Loaded');
}



