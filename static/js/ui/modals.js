// ==========================================
// 💬 MODAL MANAGER
// Error, success, and info messages
// Dependencies: None
// ==========================================

(function() {
    'use strict';
    
    // Show error message
    function showError(message) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => { errorDiv.style.display = 'none'; }, 4000);
        }
    }
    
    // Show success message
    function showSuccess(message) {
        const successDiv = document.getElementById('success-message');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => { successDiv.style.display = 'none'; }, 2000);
        }
    }
    
    // Show info message
    function showInfo(message, duration = 3000) {
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed;top:20px;right:20px;background:#2196f3;color:white;padding:15px 25px;border-radius:10px;z-index:10001;';
        div.textContent = message;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), duration);
    }
    
    // Expose to window
    window.ModalManager = {
        showError: showError,
        showSuccess: showSuccess,
        showInfo: showInfo
    };
    
    console.log('✅ [ModalManager] Module loaded');
    
})();