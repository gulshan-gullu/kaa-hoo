// ==========================================
// 🎨 HTML UTILITIES
// HTML escaping and color generation
// Dependencies: None
// ==========================================

(function() {
    'use strict';
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Get consistent color for user ID
    function getColor(userId) {
        const colors = [
            '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
            '#2196f3', '#00bcd4', '#009688', '#4caf50',
            '#ff9800', '#ff5722', '#795548', '#607d8b'
        ];
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
    
    // Expose to window
    window.HtmlUtils = {
        escapeHtml: escapeHtml,
        getColor: getColor
    };
    
    console.log('✅ [HtmlUtils] Module loaded');
    
})();