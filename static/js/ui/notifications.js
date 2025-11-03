// ==========================================
// 🔔 NOTIFICATION MANAGER
// Sound and desktop notifications
// Dependencies: None
// ==========================================

(function() {
    'use strict';
    
    let soundEnabled = true;
    
    // Load sound preferences
    function loadSoundPreferences() {
        const savedSound = localStorage.getItem('soundEnabled');
        soundEnabled = savedSound === null ? true : savedSound === 'true';
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.textContent = soundEnabled ? '🔔' : '🔇';
        }
    }
    
    // Toggle sound on/off
    function toggleSound() {
        soundEnabled = !soundEnabled;
        localStorage.setItem('soundEnabled', soundEnabled);
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.textContent = soundEnabled ? '🔔' : '🔇';
        }
    }
    
    // Play notification sound
    function playNotificationSound() {
        if (soundEnabled && document.hidden) {
            const audio = document.getElementById('notification-sound');
            if (audio) {
                audio.play().catch(e => console.log('Audio play failed:', e));
            }
        }
    }
    
    // Expose to window
    window.NotificationManager = {
        loadPreferences: loadSoundPreferences,
        toggleSound: toggleSound,
        playSound: playNotificationSound,
        isSoundEnabled: function() { return soundEnabled; }
    };
    
    console.log('✅ [NotificationManager] Module loaded');
    
})();