// ========================================
// WHATSAPP-STYLE SETTINGS MENU
// ========================================

(function() {
    'use strict';
    
    console.log('⚙️ [SETTINGS] Settings Menu Loading...');
    
    // Create Settings Panel HTML
    function createSettingsPanel() {
        const settingsHTML = `
            <div id="settings-panel" class="settings-panel" style="display: none;">
                <!-- Settings Sidebar -->
                <div class="settings-sidebar">
                    <div class="settings-sidebar-header">
                        <button onclick="window.closeSettingsPanel()" class="settings-back-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <h2>Settings</h2>
                    </div>
                    
                    <div class="settings-menu-items">
                        <div class="settings-menu-item active" data-panel="general" onclick="window.showSettingsPanel('general')">
                            <span class="settings-icon">💻</span>
                            <span>General</span>
                        </div>
                        
                        <div class="settings-menu-item" data-panel="account" onclick="window.showSettingsPanel('account')">
                            <span class="settings-icon">🔑</span>
                            <span>Account</span>
                        </div>
                        
                        <div class="settings-menu-item" data-panel="chats" onclick="window.showSettingsPanel('chats')">
                            <span class="settings-icon">💬</span>
                            <span>Chats</span>
                        </div>
                        
                        <div class="settings-menu-item" data-panel="notifications" onclick="window.showSettingsPanel('notifications')">
                            <span class="settings-icon">🔔</span>
                            <span>Notifications</span>
                        </div>
                        
                        <div class="settings-menu-item" data-panel="privacy" onclick="window.showSettingsPanel('privacy')">
                            <span class="settings-icon">🔒</span>
                            <span>Privacy</span>
                        </div>
                        
                        <div class="settings-menu-item" data-panel="storage" onclick="window.showSettingsPanel('storage')">
                            <span class="settings-icon">💾</span>
                            <span>Storage</span>
                        </div>
                        
                        <div class="settings-menu-item" data-panel="appearance" onclick="window.showSettingsPanel('appearance')">
                            <span class="settings-icon">🎨</span>
                            <span>Appearance</span>
                        </div>
                        
                        <div class="settings-menu-item" data-panel="help" onclick="window.showSettingsPanel('help')">
                            <span class="settings-icon">❓</span>
                            <span>Help</span>
                        </div>
                    </div>
                    
                    <!-- Profile Section at Bottom -->
                    <div class="settings-profile-section">
                        <div class="settings-profile-avatar" id="settings-profile-avatar">
                            ${window.currentUser ? window.currentUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div class="settings-profile-info">
                            <div class="settings-profile-name" id="settings-profile-name">
                                ${window.currentUser ? window.currentUser.name : 'User'}
                            </div>
                            <div class="settings-profile-role" id="settings-profile-role">
                                ${window.currentUser ? window.currentUser.role.toUpperCase() : 'USER'}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Settings Content -->
                <div class="settings-content">
                    ${createGeneralPanel()}
                    ${createAccountPanel()}
                    ${createChatsPanel()}
                    ${createNotificationsPanel()}
                    ${createPrivacyPanel()}
                    ${createStoragePanel()}
                    ${createAppearancePanel()}
                    ${createHelpPanel()}
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', settingsHTML);
        console.log('✅ [SETTINGS] Settings panel HTML created');
    }
    
    // General Panel
    function createGeneralPanel() {
        return `
            <div class="settings-content-panel active" id="panel-general">
                <h1>General</h1>
                
                <div class="settings-section">
                    <div class="settings-section-title">Login</div>
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <div class="settings-option-label">Start at login</div>
                            <div class="settings-option-desc">Automatically start CA360 when you login</div>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" id="setting-auto-start">
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <div class="settings-section-title">Language</div>
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <div class="settings-option-label">🌐 App Language</div>
                        </div>
                        <select class="settings-select">
                            <option value="en">English</option>
                            <option value="hi">हिंदी (Hindi)</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-section">
                    <div class="settings-section-title">Typing</div>
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <div class="settings-option-label">Replace text with emoji 😊</div>
                            <div class="settings-option-desc">Emoji will replace specific text as you type</div>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" id="setting-emoji-replace" checked>
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <div class="settings-option-label">Send message with Enter</div>
                            <div class="settings-option-desc">Press Enter to send, Shift+Enter for new line</div>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" id="setting-enter-send" checked>
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Account Panel
    function createAccountPanel() {
        return `
            <div class="settings-content-panel" id="panel-account">
                <h1>Account</h1>
                
                <div class="settings-section">
                    <div class="settings-section-title">Security</div>
                    
                    <div class="settings-option-card">
                        <div class="settings-option-info">
                            <div class="settings-option-label">🔒 Change Password</div>
                            <div class="settings-option-desc">Update your account password</div>
                        </div>
                        <button class="settings-btn" onclick="window.openChangePassword()">Change</button>
                    </div>
                    
                    <div class="settings-option-card">
                        <div class="settings-option-info">
                            <div class="settings-option-label">🛡 Two-Step Verification</div>
                            <div class="settings-option-desc">Add extra security to your account</div>
                        </div>
                        <button class="settings-btn">Enable</button>
                    </div>
                </div>
                
                <div class="settings-section">
                    <div class="settings-section-title">Account Actions</div>
                    
                    <div class="settings-option-card">
                        <div class="settings-option-info">
                            <div class="settings-option-label">📥 Request Account Info</div>
                            <div class="settings-option-desc">Download your account data</div>
                        </div>
                        <button class="settings-btn">Request</button>
                    </div>
                    
                    <div class="settings-option-card">
                        <div class="settings-option-info">
                            <div class="settings-option-label" style="color: #dc2626;">🗑️ Delete Account</div>
                            <div class="settings-option-desc">Permanently delete your account</div>
                        </div>
                        <button class="settings-btn" style="color: #dc2626; border-color: #dc2626;">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Chats Panel
    function createChatsPanel() {
        return `
            <div class="settings-content-panel" id="panel-chats">
                <h1>Chats</h1>
                
                <div class="settings-section">
                    <div class="settings-section-title">Display</div>
                    
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <div class="settings-option-label">Enter is send</div>
                            <div class="settings-option-desc">Press Enter to send message</div>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" checked>
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <div class="settings-option-label">Media visibility</div>
                            <div class="settings-option-desc">Show media in gallery</div>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" checked>
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <div class="settings-section-title">Archive</div>
                    
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <div class="settings-option-label">Keep chats archived</div>
                            <div class="settings-option-desc">Archived chats will remain archived when you receive a new message</div>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox">
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <div class="settings-section-title">Chat Backup</div>
                    
                    <div class="settings-option-card">
                        <div class="settings-option-info">
                            <div class="settings-option-label">📤 Export Chat</div>
                            <div class="settings-option-desc">Export messages to CSV</div>
                        </div>
                        <button class="settings-btn" onclick="exportMessages()">Export</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Notifications Panel
    function createNotificationsPanel() {
        return `
            <div class="settings-content-panel" id="panel-notifications">
                <h1>Notifications</h1>
                
                <div class="settings-section">
                    <div class="settings-section-title">Desktop Notifications</div>
                    
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <div class="settings-option-label">Enable notifications</div>
                            <div class="settings-option-desc">Show notifications for new messages</div>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" id="setting-notifications" checked>
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <div class="settings-option-label">Notification sounds</div>
                            <div class="settings-option-desc">Play sound for notifications</div>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" id="setting-notification-sound" checked>
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <div class="settings-option-label">Show preview</div>
                            <div class="settings-option-desc">Show message preview in notifications</div>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" checked>
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Privacy Panel
    function createPrivacyPanel() {
        return `
            <div class="settings-content-panel" id="panel-privacy">
                <h1>Privacy</h1>
                
                <div class="settings-section">
                    <div class="settings-section-title">Who can see my personal info</div>
                    
                    <div class="settings-option-card">
                        <div class="settings-option-info">
                            <div class="settings-option-label">Last seen & online</div>
                            <div class="settings-option-desc">Everyone</div>
                        </div>
                        <span style="color: var(--text-secondary);">›</span>
                    </div>
                    
                    <div class="settings-option-card">
                        <div class="settings-option-info">
                            <div class="settings-option-label">Profile photo</div>
                            <div class="settings-option-desc">Everyone</div>
                        </div>
                        <span style="color: var(--text-secondary);">›</span>
                    </div>
                    
                    <div class="settings-option-card">
                        <div class="settings-option-info">
                            <div class="settings-option-label">Status</div>
                            <div class="settings-option-desc">My contacts</div>
                        </div>
                        <span style="color: var(--text-secondary);">›</span>
                    </div>
                    
                    <div class="settings-option-card">
                        <div class="settings-option-info">
                            <div class="settings-option-label">Read receipts</div>
                            <div class="settings-option-desc">If turned off, you won't send or receive Read receipts</div>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" checked>
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <div class="settings-section-title">Disappearing Messages</div>
                    
                    <div class="settings-option-card">
                        <div class="settings-option-info">
                            <div class="settings-option-label">Default message timer</div>
                            <div class="settings-option-desc">Off</div>
                        </div>
                        <span style="color: var(--text-secondary);">›</span>
                    </div>
                </div>
                
                <div class="settings-section">
                    <div class="settings-section-title">Encryption</div>
                    
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <div class="settings-option-label">🔐 End-to-end encryption</div>
                            <div class="settings-option-desc">Your messages are encrypted</div>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" id="setting-encryption">
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Storage Panel
    function createStoragePanel() {
        return `
            <div class="settings-content-panel" id="panel-storage">
                <h1>Storage</h1>
                
                <div class="settings-section">
                    <div class="settings-section-title">Manage Storage</div>
                    
                    <div class="settings-storage-stats">
                        <div class="storage-stat-item">
                            <div class="storage-stat-label">Messages</div>
                            <div class="storage-stat-value">2.4 MB</div>
                        </div>
                        <div class="storage-stat-item">
                            <div class="storage-stat-label">Media</div>
                            <div class="storage-stat-value">45.8 MB</div>
                        </div>
                        <div class="storage-stat-item">
                            <div class="storage-stat-label">Total</div>
                            <div class="storage-stat-value">48.2 MB</div>
                        </div>
                    </div>
                    
                    <div class="settings-option-card">
                        <div class="settings-option-info">
                            <div class="settings-option-label">🗑️ Clear Cache</div>
                            <div class="settings-option-desc">Free up space by clearing cached data</div>
                        </div>
                        <button class="settings-btn" onclick="window.clearChatCache()">Clear</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Appearance Panel
    function createAppearancePanel() {
        return `
            <div class="settings-content-panel" id="panel-appearance">
                <h1>Appearance</h1>
                
                <div class="settings-section">
                    <div class="settings-section-title">Theme</div>
                    
                    <div class="settings-theme-options">
                        <div class="theme-option active" onclick="window.setTheme('dark')">
                            <div class="theme-preview theme-dark"></div>
                            <div class="theme-label">Dark</div>
                        </div>
                        <div class="theme-option" onclick="window.setTheme('light')">
                            <div class="theme-preview theme-light"></div>
                            <div class="theme-label">Light</div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <div class="settings-section-title">Chat Wallpaper</div>
                    
                    <div class="settings-wallpaper-options">
                        <div class="wallpaper-option" style="background: #0a0a0a;">Default</div>
                        <div class="wallpaper-option" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">Purple</div>
                        <div class="wallpaper-option" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">Pink</div>
                        <div class="wallpaper-option" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">Blue</div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <div class="settings-section-title">Display</div>
                    
                    <div class="settings-option">
                        <div class="settings-option-info">
                            <div class="settings-option-label">Font size</div>
                        </div>
                        <select class="settings-select">
                            <option value="small">Small</option>
                            <option value="medium" selected>Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Help Panel
    function createHelpPanel() {
        return `
            <div class="settings-content-panel" id="panel-help">
                <h1>Help</h1>
                
                <div class="settings-section">
                    <div class="settings-section-title">Support</div>
                    
                    <div class="settings-option-card">
                        <div class="settings-option-info">
                            <div class="settings-option-label">📖 Help Center</div>
                            <div class="settings-option-desc">Find answers and support</div>
                        </div>
                        <span style="color: var(--text-secondary);">›</span>
                    </div>
                    
                    <div class="settings-option-card">
                        <div class="settings-option-info">
                            <div class="settings-option-label">💬 Contact Us</div>
                            <div class="settings-option-desc">Get in touch with support</div>
                        </div>
                        <span style="color: var(--text-secondary);">›</span>
                    </div>
                    
                    <div class="settings-option-card">
                        <div class="settings-option-info">
                            <div class="settings-option-label">📱 App Info</div>
                            <div class="settings-option-desc">Version 1.0.0</div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <p style="color: rgba(255,255,255,0.5); font-size: 13px; text-align: center;">
                        © 2024 CA360 Chat. All rights reserved.
                    </p>
                </div>
            </div>
        `;
    }
    
    // ============================================
    // CORE FUNCTIONS
    // ============================================
    
    // Open Settings Panel
    window.openSettingsPanel = function() {
        console.log('🎯 [SETTINGS] Opening settings panel...');
        const panel = document.getElementById('settings-panel');
        if (panel) {
            panel.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            console.log('✅ [SETTINGS] Panel opened');
        } else {
            console.error('❌ [SETTINGS] Panel element not found!');
        }
    };
    
    // Close Settings Panel
    window.closeSettingsPanel = function() {
        console.log('[SETTINGS] Closing panel...');
        const panel = document.getElementById('settings-panel');
        if (panel) {
            panel.style.display = 'none';
            document.body.style.overflow = '';
        }
    };
    
    // Show Settings Panel
    window.showSettingsPanel = function(panelName) {
        console.log('[SETTINGS] Switching to panel:', panelName);
        
        // Update active menu item
        document.querySelectorAll('.settings-menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-panel') === panelName) {
                item.classList.add('active');
            }
        });
        
        // Update active content panel
        document.querySelectorAll('.settings-content-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const targetPanel = document.getElementById(`panel-${panelName}`);
        if (targetPanel) {
            targetPanel.classList.add('active');
            targetPanel.scrollTop = 0; // Scroll to top
        }
    };
    
    // Set Theme
    window.setTheme = function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update active theme option
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
        });
        
        // Find and activate the clicked theme
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            if (option.textContent.toLowerCase().includes(theme)) {
                option.classList.add('active');
            }
        });
        
        console.log('[SETTINGS] Theme changed to:', theme);
    };
    
    // Clear Cache
    window.clearChatCache = function() {
        if (confirm('Clear all cached data? This will free up storage space.')) {
            // Clear localStorage except important data
            const preserve = ['theme', 'archivedChats', 'userProfiles', 'currentUser'];
            Object.keys(localStorage).forEach(key => {
                if (!preserve.includes(key)) {
                    localStorage.removeItem(key);
                }
            });
            alert('✅ Cache cleared successfully!');
        }
    };
    
    // Change Password
    window.openChangePassword = function() {
        const currentPassword = prompt('Enter current password:');
        if (!currentPassword) return;
        
        const newPassword = prompt('Enter new password (min 3 characters):');
        if (!newPassword || newPassword.length < 3) {
            alert('❌ Password must be at least 3 characters');
            return;
        }
        
        const confirmPassword = prompt('Confirm new password:');
        if (newPassword !== confirmPassword) {
            alert('❌ Passwords do not match');
            return;
        }
        
        // TODO: Send to server
        alert('✅ Password will be changed (feature coming soon)');
    };
    
    // ============================================
    // BUTTON ATTACHMENT - IMPROVED
    // ============================================
    
    function attachSettingsButton() {
        console.log('[SETTINGS] Attempting to attach settings button...');
        
        // Try multiple selectors
        const selectors = [
            '#settings-btn',
            '.settings-btn',
            'button[id="settings-btn"]',
            'button.settings-btn'
        ];
        
        let settingsBtn = null;
        
        for (const selector of selectors) {
            try {
                settingsBtn = document.querySelector(selector);
                if (settingsBtn) {
                    console.log('✅ [SETTINGS] Found button with selector:', selector);
                    break;
                }
            } catch (e) {
                console.warn('[SETTINGS] Selector failed:', selector);
            }
        }
        
        // Fallback: Search by content
        if (!settingsBtn) {
            console.log('[SETTINGS] Trying content-based search...');
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                const text = btn.textContent.toLowerCase();
                if (text.includes('setting')) {
                    settingsBtn = btn;
                    console.log('✅ [SETTINGS] Found button by text content');
                    break;
                }
            }
        }
        
        if (settingsBtn) {
            // Remove existing listeners by cloning
            const newBtn = settingsBtn.cloneNode(true);
            settingsBtn.parentNode.replaceChild(newBtn, settingsBtn);
            
            // Add click event
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎯 [SETTINGS] Button clicked!');
                window.openSettingsPanel();
            });
            
            console.log('✅ [SETTINGS] Button successfully attached!');
            return true;
        } else {
            console.warn('⚠️ [SETTINGS] Button not found. Will retry...');
            return false;
        }
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    function init() {
        console.log('🚀 [SETTINGS] Initializing settings module...');
        
        // Create the panel
        createSettingsPanel();
        
        // Try to attach button multiple times
        const attempts = [100, 500, 1000, 2000, 3000];
        attempts.forEach(delay => {
            setTimeout(() => {
                const success = attachSettingsButton();
                if (success) {
                    console.log(`✅ [SETTINGS] Successfully attached after ${delay}ms`);
                }
            }, delay);
        });
        
        console.log('✅ [SETTINGS] Settings Menu Ready!');
    }
    
    // Close on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const panel = document.getElementById('settings-panel');
            if (panel && panel.style.display === 'flex') {
                window.closeSettingsPanel();
            }
        }
    });
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Also try when window fully loads
    window.addEventListener('load', function() {
        console.log('[SETTINGS] Window loaded, final attachment attempt...');
        setTimeout(attachSettingsButton, 200);
    });
    
})();