/**
 * 🔌 WEBSOCKET HANDLERS
 * Centralized WebSocket event handlers for all features
 */

class WebSocketHandlers {
    constructor() {
        this.socket = null;
        this.handlers = {};
        console.log('✅ [WS-HANDLERS] Module initialized');
    }

    init() {
        // Wait for socket to be available
        let attempts = 0;
        const maxAttempts = 20; // Try for 10 seconds (20 * 500ms)
        
        const checkSocket = setInterval(() => {
            attempts++;
            
            if (window.socket) {
                this.socket = window.socket;
                clearInterval(checkSocket);
                this.registerHandlers();
                console.log('✅ [WS-HANDLERS] Connected to socket after', attempts, 'attempts');
            } else if (attempts >= maxAttempts) {
                clearInterval(checkSocket);
                console.warn('⚠️ [WS-HANDLERS] Socket not available after', (maxAttempts * 500 / 1000), 'seconds');
            }
        }, 500); // Check every 500ms
    }

    registerHandlers() {
        if (!this.socket) return;

        // ============================================
        // 📍 LOCATION HANDLERS
        // ============================================

        this.socket.on('new_location', (data) => {
            console.log('📍 [WS] Received location:', data);
            this.handleNewLocation(data);
        });

        this.socket.on('live_location_update', (data) => {
            console.log('📡 [WS] Live location update:', data);
            this.handleLiveLocationUpdate(data);
        });

        this.socket.on('live_location_stopped', (data) => {
            console.log('🛑 [WS] Live location stopped:', data);
            this.handleLiveLocationStopped(data);
        });

        this.socket.on('location_requested', (data) => {
            console.log('📍 [WS] Location requested by:', data.from_user);
            this.handleLocationRequest(data);
        });

        // ============================================
        // 🎙️ MEDIA HANDLERS
        // ============================================

        this.socket.on('new_voice_message', (data) => {
            console.log('🎙️ [WS] Received voice message:', data);
            this.handleVoiceMessage(data);
        });

        this.socket.on('new_media_message', (data) => {
            console.log('📁 [WS] Received media message:', data);
            this.handleMediaMessage(data);
        });

        this.socket.on('user_recording_voice', (data) => {
            console.log('🎙️ [WS] User recording voice:', data.username);
            this.handleUserRecording(data);
        });

        this.socket.on('file_upload_progress', (data) => {
            console.log('📤 [WS] Upload progress:', data.progress);
            this.handleUploadProgress(data);
        });

        console.log('✅ [WS-HANDLERS] All handlers registered');
    }

    // ============================================
    // 📍 LOCATION HANDLER METHODS
    // ============================================

    handleNewLocation(data) {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;

        const location = data.location;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-received ${data.is_live ? 'live-location-message' : ''}`;
        
        let liveIndicator = '';
        if (data.is_live) {
            liveIndicator = `
                <div class="live-location-pulse"></div>
                <div class="live-location-timer">
                    📡 Live · ${data.duration} min
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="location-message">
                    <div class="location-preview-map">
                        ${liveIndicator}
                        <div class="location-preview-marker">📍</div>
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(233, 237, 239, 0.6);">
                            🗺️ Map Preview
                        </div>
                    </div>
                    <div class="location-message-info">
                        <div class="location-message-address">
                            ${location.address || 'Shared Location'}
                        </div>
                        <div class="location-message-coords">
                            ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}
                        </div>
                        <div class="location-message-actions">
                            <button class="location-open-btn" onclick="window.open('https://maps.google.com/?q=${location.lat},${location.lng}', '_blank')">
                                Open in Maps
                            </button>
                        </div>
                    </div>
                </div>
                <span class="message-time">${new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Play notification sound
        this.playNotificationSound();
    }

    handleLiveLocationUpdate(data) {
        // Find and update live location marker
        const liveMessages = document.querySelectorAll('.live-location-message');
        liveMessages.forEach(msg => {
            const coords = msg.querySelector('.location-message-coords');
            if (coords) {
                coords.textContent = `${data.location.lat.toFixed(6)}, ${data.location.lng.toFixed(6)}`;
            }
        });
    }

    handleLiveLocationStopped(data) {
        // Update UI to show location sharing stopped
        const liveMessages = document.querySelectorAll('.live-location-message');
        liveMessages.forEach(msg => {
            const timer = msg.querySelector('.live-location-timer');
            if (timer) {
                timer.textContent = '🛑 Stopped';
                timer.style.background = 'rgba(239, 68, 68, 0.7)';
            }
        });
    }

    handleLocationRequest(data) {
        if (window.showNotification) {
            window.showNotification(`${data.from_user} requested your location`, 'info');
        }
    }

    // ============================================
    // 🎙️ MEDIA HANDLER METHODS
    // ============================================

    handleVoiceMessage(data) {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-received';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="voice-message">
                    <button class="voice-msg-play-btn" data-audio-url="${data.url}">
                        ▶️
                    </button>
                    <div class="voice-msg-waveform">
                        ${this.generateWaveformBars(20)}
                    </div>
                    <span class="voice-msg-duration">${this.formatDuration(data.duration)}</span>
                </div>
                <span class="message-time">${new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
                    audio = new Audio(data.url);
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

        this.playNotificationSound();
    }

    handleMediaMessage(data) {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-received';
        
        let mediaHTML = '';
        
        if (data.type === 'image') {
            mediaHTML = `<img src="${data.url}" style="max-width: 100%; border-radius: 10px; display: block;" alt="Image">`;
        } else if (data.type === 'video') {
            mediaHTML = `<video src="${data.url}" controls style="max-width: 100%; border-radius: 10px; display: block;"></video>`;
        } else {
            mediaHTML = `
                <div style="padding: 15px; background: rgba(42, 57, 66, 0.5); border-radius: 10px; display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 32px;">📄</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 5px;">${data.original_filename}</div>
                        <div style="font-size: 12px; opacity: 0.7;">${this.formatFileSize(data.size)}</div>
                    </div>
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-content">
                ${mediaHTML}
                ${data.caption ? `<p style="margin-top: 10px;">${data.caption}</p>` : ''}
                <span class="message-time">${new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        this.playNotificationSound();
    }

    handleUserRecording(data) {
        // Show recording indicator for user
        console.log(`User ${data.username} is ${data.is_recording ? 'recording' : 'stopped recording'}`);
    }

    handleUploadProgress(data) {
        // Show upload progress
        console.log(`Upload progress: ${data.progress}%`);
    }

    // ============================================
    // 🛠️ UTILITY METHODS
    // ============================================

    generateWaveformBars(count) {
        let bars = '';
        for (let i = 0; i < count; i++) {
            bars += '<div class="voice-msg-bar"></div>';
        }
        return bars;
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        return (bytes / 1073741824).toFixed(1) + ' GB';
    }

    playNotificationSound() {
        // Play notification sound if available
        const audio = new Audio('/static/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
            // Ignore if sound doesn't exist or autoplay blocked
        });
    }
}

// Export to global scope and auto-initialize
window.websocketHandlers = new WebSocketHandlers();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 [WS-HANDLERS] DOM ready, initializing...');
        setTimeout(() => window.websocketHandlers.init(), 2000); // Wait 2 seconds for socket
    });
} else {
    console.log('📄 [WS-HANDLERS] DOM already ready, initializing...');
    setTimeout(() => window.websocketHandlers.init(), 2000);
}

console.log('✅ [WS-HANDLERS] Module loaded');