// ==========================================
// 📅 DATE UTILITIES
// Time and date formatting functions
// Dependencies: None
// ==========================================

(function() {
    'use strict';
    
    // Get formatted time string (12-hour format with AM/PM)
    function getFormattedTime(timestamp) {
        let date;
        if (timestamp) {
            if (typeof timestamp === 'string') {
                timestamp = timestamp.replace(' ', 'T');
                date = new Date(timestamp);
            } else {
                date = new Date(timestamp);
            }
        } else {
            date = new Date();
        }
        
        if (isNaN(date.getTime())) {
            date = new Date();
        }
        
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        return `${hours}:${minutes} ${ampm}`;
    }
    
    // Format date divider
    function getDateDivider(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const dateStr = date.toDateString();
        const todayStr = today.toDateString();
        const yesterdayStr = yesterday.toDateString();
        
        if (dateStr === todayStr) {
            return 'Today';
        } else if (dateStr === yesterdayStr) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
        }
    }
    
    // Format call duration
    function formatCallDuration(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${m}:${String(s).padStart(2, '0')}`;
    }
    
    // Expose to window
    window.DateUtils = {
        getFormattedTime: getFormattedTime,
        getDateDivider: getDateDivider,
        formatCallDuration: formatCallDuration
    };
    
    console.log('✅ [DateUtils] Module loaded');
    
})();