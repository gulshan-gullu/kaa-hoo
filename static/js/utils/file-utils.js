// ==========================================
// 📁 FILE UTILITIES
// File size and type utilities
// Dependencies: None
// ==========================================

(function() {
    'use strict';
    
    // Format file size to human readable
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    // Expose to window
    window.FileUtils = {
        formatFileSize: formatFileSize
    };
    
    console.log('✅ [FileUtils] Module loaded');
    
})();