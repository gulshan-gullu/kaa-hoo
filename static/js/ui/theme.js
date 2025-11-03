// ==========================================
// 🎨 THEME MANAGER
// Dark/Light theme switching and persistence
// Dependencies: None
// ==========================================

(function() {
    'use strict';
    
    // Load saved theme preferences
    function loadThemePreferences() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        }
    }
    
    // Toggle between dark and light theme
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        }
    }
    
    // Expose to window
    window.ThemeManager = {
        loadPreferences: loadThemePreferences,
        toggle: toggleTheme
    };
    
    console.log('✅ [ThemeManager] Module loaded');
    
})();