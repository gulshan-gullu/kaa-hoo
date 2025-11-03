// ========================================
// 🎨 CUSTOM THEMES MODULE
// ========================================

(function() {
    'use strict';
    
    console.log('🎨 [CUSTOM-THEMES] Module loading...');
    
    // Theme presets
    const themes = {
        default: {
            name: 'Default Dark',
            emoji: '🌙',
            colors: {
                primary: '#25d366',
                background: '#0a0a0a',
                sidebar: 'rgba(17, 27, 33, 0.95)',
                chatBg: '#0a0a0a',
                messageBg: 'rgba(17, 27, 33, 0.8)',
                textPrimary: '#e9edef',
                textSecondary: '#8696a0'
            }
        },
        ocean: {
            name: 'Ocean Blue',
            emoji: '🌊',
            colors: {
                primary: '#0ea5e9',
                background: '#0f172a',
                sidebar: 'rgba(15, 23, 42, 0.95)',
                chatBg: '#0f172a',
                messageBg: 'rgba(30, 58, 138, 0.3)',
                textPrimary: '#e0f2fe',
                textSecondary: '#94a3b8'
            }
        },
        sunset: {
            name: 'Sunset Orange',
            emoji: '🌅',
            colors: {
                primary: '#f97316',
                background: '#1a0f0a',
                sidebar: 'rgba(26, 15, 10, 0.95)',
                chatBg: '#1a0f0a',
                messageBg: 'rgba(124, 45, 18, 0.3)',
                textPrimary: '#fed7aa',
                textSecondary: '#a1a1aa'
            }
        },
        forest: {
            name: 'Forest Green',
            emoji: '🌲',
            colors: {
                primary: '#10b981',
                background: '#0a1510',
                sidebar: 'rgba(10, 21, 16, 0.95)',
                chatBg: '#0a1510',
                messageBg: 'rgba(4, 120, 87, 0.2)',
                textPrimary: '#d1fae5',
                textSecondary: '#94a3b8'
            }
        },
        lavender: {
            name: 'Lavender Dream',
            emoji: '💜',
            colors: {
                primary: '#a855f7',
                background: '#1a0a1a',
                sidebar: 'rgba(26, 10, 26, 0.95)',
                chatBg: '#1a0a1a',
                messageBg: 'rgba(126, 34, 206, 0.2)',
                textPrimary: '#f3e8ff',
                textSecondary: '#a1a1aa'
            }
        },
        rose: {
            name: 'Rose Pink',
            emoji: '🌹',
            colors: {
                primary: '#f43f5e',
                background: '#1a0a0f',
                sidebar: 'rgba(26, 10, 15, 0.95)',
                chatBg: '#1a0a0f',
                messageBg: 'rgba(225, 29, 72, 0.2)',
                textPrimary: '#fce7f3',
                textSecondary: '#a1a1aa'
            }
        },
        midnight: {
            name: 'Midnight Blue',
            emoji: '🌌',
            colors: {
                primary: '#3b82f6',
                background: '#050a1a',
                sidebar: 'rgba(5, 10, 26, 0.95)',
                chatBg: '#050a1a',
                messageBg: 'rgba(37, 99, 235, 0.2)',
                textPrimary: '#dbeafe',
                textSecondary: '#94a3b8'
            }
        },
        light: {
            name: 'Light Mode',
            emoji: '☀️',
            colors: {
                primary: '#25d366',
                background: '#f0f2f5',
                sidebar: 'rgba(255, 255, 255, 0.95)',
                chatBg: '#e5ddd5',
                messageBg: 'rgba(255, 255, 255, 0.95)',
                textPrimary: '#111b21',
                textSecondary: '#667781'
            }
        }
    };
    
    // Wallpapers
    const wallpapers = {
        none: {
            name: 'None',
            emoji: '⬛',
            style: 'none'
        },
        gradient1: {
            name: 'Purple Wave',
            emoji: '🌊',
            style: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        gradient2: {
            name: 'Pink Sunset',
            emoji: '🌅',
            style: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        },
        gradient3: {
            name: 'Blue Ocean',
            emoji: '🌊',
            style: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        },
        gradient4: {
            name: 'Green Forest',
            emoji: '🌲',
            style: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
        },
        gradient5: {
            name: 'Orange Fire',
            emoji: '🔥',
            style: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
        },
        pattern1: {
            name: 'Dots',
            emoji: '•',
            style: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            size: '20px 20px'
        },
        pattern2: {
            name: 'Lines',
            emoji: '═',
            style: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)'
        }
    };
    
    // Get current theme
    let currentTheme = localStorage.getItem('custom_theme') || 'default';
    let currentWallpaper = localStorage.getItem('custom_wallpaper') || 'none';
    
    // Create theme selector modal
    function createThemeSelectorModal() {
        const modalHTML = `
            <div id="theme-selector-modal" class="theme-selector-modal" style="display: none;">
                <div class="theme-selector-overlay" onclick="window.closeThemeSelector()"></div>
                <div class="theme-selector-container">
                    <div class="theme-selector-header">
                        <h3>🎨 Customize Theme</h3>
                        <button class="theme-selector-close" onclick="window.closeThemeSelector()">✕</button>
                    </div>
                    
                    <div class="theme-selector-content">
                        <!-- Theme Selection -->
                        <div class="theme-section">
                            <h4>Color Themes</h4>
                            <div class="theme-grid" id="theme-grid"></div>
                        </div>
                        
                        <!-- Wallpaper Selection -->
                        <div class="theme-section">
                            <h4>Chat Wallpaper</h4>
                            <div class="wallpaper-grid" id="wallpaper-grid"></div>
                        </div>
                        
                        <!-- Preview -->
                        <div class="theme-section">
                            <h4>Preview</h4>
                            <div class="theme-preview-box">
                                <div class="theme-preview-message sent">
                                    <div class="theme-preview-text">This is a sent message</div>
                                    <div class="theme-preview-time">12:30 PM</div>
                                </div>
                                <div class="theme-preview-message received">
                                    <div class="theme-preview-text">This is a received message</div>
                                    <div class="theme-preview-time">12:31 PM</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="theme-selector-actions">
                            <button class="theme-reset-btn" onclick="window.resetTheme()">Reset to Default</button>
                            <button class="theme-apply-btn" onclick="window.closeThemeSelector()">Done</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        populateThemeGrid();
        populateWallpaperGrid();
    }
    
    // Populate theme grid
    function populateThemeGrid() {
        const grid = document.getElementById('theme-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        Object.keys(themes).forEach(themeKey => {
            const theme = themes[themeKey];
            const card = document.createElement('div');
            card.className = `theme-card ${themeKey === currentTheme ? 'active' : ''}`;
            card.innerHTML = `
                <div class="theme-card-preview" style="background: ${theme.colors.background};">
                    <div class="theme-card-accent" style="background: ${theme.colors.primary};"></div>
                </div>
                <div class="theme-card-info">
                    <span class="theme-card-emoji">${theme.emoji}</span>
                    <span class="theme-card-name">${theme.name}</span>
                </div>
            `;
            
            card.onclick = () => {
                applyTheme(themeKey);
                document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            };
            
            grid.appendChild(card);
        });
    }
    
    // Populate wallpaper grid
    function populateWallpaperGrid() {
        const grid = document.getElementById('wallpaper-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        Object.keys(wallpapers).forEach(wallpaperKey => {
            const wallpaper = wallpapers[wallpaperKey];
            const card = document.createElement('div');
            card.className = `wallpaper-card ${wallpaperKey === currentWallpaper ? 'active' : ''}`;
            
            let previewStyle = '';
            if (wallpaper.style !== 'none') {
                previewStyle = `background: ${wallpaper.style};`;
                if (wallpaper.size) {
                    previewStyle += `background-size: ${wallpaper.size};`;
                }
            }
            
            card.innerHTML = `
                <div class="wallpaper-card-preview" style="${previewStyle}">
                    <span class="wallpaper-card-emoji">${wallpaper.emoji}</span>
                </div>
                <div class="wallpaper-card-name">${wallpaper.name}</div>
            `;
            
            card.onclick = () => {
                applyWallpaper(wallpaperKey);
                document.querySelectorAll('.wallpaper-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            };
            
            grid.appendChild(card);
        });
    }
    
    // Apply theme
    function applyTheme(themeKey) {
        if (!themes[themeKey]) return;
        
        const theme = themes[themeKey];
        const root = document.documentElement;
        
        // Apply CSS variables
        root.style.setProperty('--primary-color', theme.colors.primary);
        root.style.setProperty('--background-color', theme.colors.background);
        root.style.setProperty('--sidebar-bg', theme.colors.sidebar);
        root.style.setProperty('--chat-bg', theme.colors.chatBg);
        root.style.setProperty('--message-bg', theme.colors.messageBg);
        root.style.setProperty('--text-primary', theme.colors.textPrimary);
        root.style.setProperty('--text-secondary', theme.colors.textSecondary);
        
        currentTheme = themeKey;
        localStorage.setItem('custom_theme', themeKey);
        
        console.log('🎨 [CUSTOM-THEMES] Theme applied:', theme.name);
    }
    
    // Apply wallpaper
    function applyWallpaper(wallpaperKey) {
        if (!wallpapers[wallpaperKey]) return;
        
        const wallpaper = wallpapers[wallpaperKey];
        const chatMessages = document.getElementById('chat-messages');
        
        if (!chatMessages) return;
        
        if (wallpaper.style === 'none') {
            chatMessages.style.background = '';
            chatMessages.style.backgroundSize = '';
        } else {
            chatMessages.style.background = wallpaper.style;
            if (wallpaper.size) {
                chatMessages.style.backgroundSize = wallpaper.size;
            }
        }
        
        currentWallpaper = wallpaperKey;
        localStorage.setItem('custom_wallpaper', wallpaperKey);
        
        console.log('🎨 [CUSTOM-THEMES] Wallpaper applied:', wallpaper.name);
    }
    
    // Reset theme
    window.resetTheme = function() {
        if (confirm('Reset to default theme?')) {
            applyTheme('default');
            applyWallpaper('none');
            populateThemeGrid();
            populateWallpaperGrid();
        }
    };
    
    // Open/close theme selector
    window.openThemeSelector = function() {
        const modal = document.getElementById('theme-selector-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    };
    
    window.closeThemeSelector = function() {
        const modal = document.getElementById('theme-selector-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };
    
    // Add theme button to header
    function addThemeButton() {
        setTimeout(() => {
            const headerButtons = document.querySelector('.header-buttons');
            if (headerButtons && !document.getElementById('theme-selector-btn')) {
                const themeBtn = document.createElement('button');
                themeBtn.id = 'theme-selector-btn';
                themeBtn.className = 'settings-btn';
                themeBtn.innerHTML = '🎨 Themes';
                themeBtn.onclick = window.openThemeSelector;
                
                headerButtons.insertBefore(themeBtn, headerButtons.firstChild);
            }
        }, 1500);
    }
    
    // Initialize
    function init() {
        createThemeSelectorModal();
        addThemeButton();
        addStyles();
        
        // Apply saved theme and wallpaper
        applyTheme(currentTheme);
        applyWallpaper(currentWallpaper);
        
        console.log('✅ [CUSTOM-THEMES] Module ready!');
        console.log(`🎨 Current theme: ${themes[currentTheme].name}`);
    }
    
    // Add styles
    function addStyles() {
        const styles = `
            <style>
            :root {
                --primary-color: #25d366;
                --background-color: #0a0a0a;
                --sidebar-bg: rgba(17, 27, 33, 0.95);
                --chat-bg: #0a0a0a;
                --message-bg: rgba(17, 27, 33, 0.8);
                --text-primary: #e9edef;
                --text-secondary: #8696a0;
            }
            
            .theme-selector-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 100003;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .theme-selector-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(8px);
            }
            
            .theme-selector-container {
                position: relative;
                width: 90%;
                max-width: 700px;
                max-height: 90vh;
                background: #1f2c33;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: themeModalScale 0.3s ease-out;
                display: flex;
                flex-direction: column;
            }
            
            @keyframes themeModalScale {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            .theme-selector-header {
                padding: 20px;
                background: rgba(0, 0, 0, 0.3);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .theme-selector-header h3 {
                margin: 0;
                color: #e9edef;
                font-size: 20px;
                font-weight: 500;
            }
            
            .theme-selector-close {
                background: none;
                border: none;
                color: #8696a0;
                font-size: 24px;
                cursor: pointer;
                padding: 5px 10px;
                border-radius: 50%;
                transition: all 0.2s;
            }
            
            .theme-selector-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #e9edef;
            }
            
            .theme-selector-content {
                flex: 1;
                overflow-y: auto;
                padding: 25px;
            }
            
            .theme-section {
                margin-bottom: 30px;
            }
            
            .theme-section h4 {
                color: #8696a0;
                font-size: 13px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 0 0 15px 0;
            }
            
            .theme-grid,
            .wallpaper-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 15px;
            }
            
            .theme-card,
            .wallpaper-card {
                cursor: pointer;
                border-radius: 12px;
                overflow: hidden;
                border: 2px solid transparent;
                transition: all 0.3s;
                background: rgba(255, 255, 255, 0.03);
            }
            
            .theme-card:hover,
            .wallpaper-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
            }
            
            .theme-card.active,
            .wallpaper-card.active {
                border-color: #25d366;
                box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.2);
            }
            
            .theme-card-preview {
                height: 80px;
                position: relative;
                overflow: hidden;
            }
            
            .theme-card-accent {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 20px;
            }
            
            .theme-card-info {
                padding: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .theme-card-emoji {
                font-size: 20px;
            }
            
            .theme-card-name {
                color: #e9edef;
                font-size: 13px;
                font-weight: 500;
            }
            
            .wallpaper-card-preview {
                height: 100px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #0a0a0a;
            }
            
            .wallpaper-card-emoji {
                font-size: 32px;
            }
            
            .wallpaper-card-name {
                padding: 10px;
                text-align: center;
                color: #e9edef;
                font-size: 13px;
                font-weight: 500;
            }
            
            .theme-preview-box {
                background: var(--chat-bg);
                padding: 20px;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .theme-preview-message {
                max-width: 70%;
                padding: 10px 15px;
                border-radius: 10px;
                margin-bottom: 10px;
                animation: messageSlideIn 0.3s ease-out;
            }
            
            @keyframes messageSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .theme-preview-message.sent {
                margin-left: auto;
                background: var(--primary-color);
                color: white;
            }
            
            .theme-preview-message.received {
                background: var(--message-bg);
                color: var(--text-primary);
            }
            
            .theme-preview-text {
                font-size: 14px;
                margin-bottom: 5px;
            }
            
            .theme-preview-time {
                font-size: 11px;
                opacity: 0.7;
                text-align: right;
            }
            
            .theme-selector-actions {
                display: flex;
                gap: 10px;
                justify-content: space-between;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .theme-reset-btn,
            .theme-apply-btn {
                padding: 12px 30px;
                border: none;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .theme-reset-btn {
                background: rgba(220, 38, 38, 0.2);
                color: #dc2626;
                border: 1px solid rgba(220, 38, 38, 0.3);
            }
            
            .theme-reset-btn:hover {
                background: rgba(220, 38, 38, 0.3);
                transform: translateY(-2px);
            }
            
            .theme-apply-btn {
                background: linear-gradient(135deg, #25d366 0%, #20bd5f 100%);
                color: white;
                box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
            }
            
            .theme-apply-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
            }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();