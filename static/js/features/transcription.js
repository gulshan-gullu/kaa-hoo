// ==================== LIVE TRANSCRIPTION ====================

let recognition = null;
let isTranscribing = false;
let transcriptHistory = [];

function startTranscription() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.warn('âš ï¸ [TRANSCRIPT] Not supported in this browser');
        alert('Speech recognition not supported. Try Chrome or Edge.');
        return false;
    }
    
    console.log('ðŸ’¬ [TRANSCRIPT] Starting...');
    
    try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
            isTranscribing = true;
            console.log('âœ… [TRANSCRIPT] Started');
        };
        
        recognition.onresult = (event) => {
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                }
            }
            
            if (finalTranscript) {
                addTranscriptLine('You', finalTranscript.trim());
            }
        };
        
        recognition.onerror = (event) => {
            console.error('âŒ [TRANSCRIPT] Error:', event.error);
        };
        
        recognition.onend = () => {
            if (isTranscribing) {
                setTimeout(() => {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.warn('âš ï¸ [TRANSCRIPT] Restart failed');
                    }
                }, 100);
            }
        };
        
        recognition.start();
        return true;
        
    } catch (error) {
        console.error('âŒ [TRANSCRIPT] Failed:', error);
        return false;
    }
}

function stopTranscription() {
    if (recognition) {
        isTranscribing = false;
        recognition.stop();
        recognition = null;
        console.log('ðŸ›‘ [TRANSCRIPT] Stopped');
    }
}

function addTranscriptLine(speaker, text) {
    const container = document.getElementById('transcriptionText');
    if (!container) return;
    
    if (container.querySelector('[style*="italic"]')) {
        container.innerHTML = '';
    }
    
    const line = document.createElement('div');
    line.className = 'transcript-line';
    
    const speakerSpan = document.createElement('span');
    speakerSpan.className = speaker === 'You' ? 'transcript-speaker you' : 'transcript-speaker';
    speakerSpan.textContent = speaker + ':';
    
    const textSpan = document.createElement('span');
    textSpan.textContent = ' ' + text;
    
    line.appendChild(speakerSpan);
    line.appendChild(textSpan);
    container.appendChild(line);
    
    transcriptHistory.push({ speaker, text, time: new Date() });
    
    container.scrollTop = container.scrollHeight;
}

function initTranscription() {
    const toggleBtn = document.getElementById('transcriptionToggleBtn');
    const container = document.getElementById('transcriptionContainer');
    
    if (toggleBtn && container) {
        toggleBtn.addEventListener('click', () => {
            const isActive = container.classList.contains('show');
            
            if (isActive) {
                container.classList.remove('show');
                toggleBtn.classList.remove('active');
                stopTranscription();
            } else {
                container.classList.add('show');
                toggleBtn.classList.add('active');
                startTranscription();
            }
        });
    }
    
    console.log('âœ… Transcription Module Loaded');
}

function getTranscriptHistory() {
    return transcriptHistory;
}

function clearTranscript() {
    transcriptHistory = [];
    const container = document.getElementById('transcriptionText');
    if (container) {
        container.innerHTML = '<div style="color: rgba(233, 237, 239, 0.5); font-style: italic;">Transcription will appear here...</div>';
    }
}
