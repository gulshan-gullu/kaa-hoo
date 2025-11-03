// ==========================================
// 🎯 CA360 CHAT APPLICATION - MAIN ENTRY POINT
// Modular architecture with clean separation of concerns
// Dependencies: All modules loaded before this file
// ==========================================

// ==================== 🛡️ ERROR FIREWALL ====================
(function() {
    'use strict';
    
    const IGNORED_ERRORS = [
        'message channel closed',
        'Extension context invalidated',
        'asynchronous response',
        'Could not establish connection',
        'chrome-extension://'
    ];
    
    function isExtensionError(error) {
        if (!error) return false;
        const message = error.message || error.toString();
        return IGNORED_ERRORS.some(pattern => message.includes(pattern));
    }
    
    window.addEventListener('error', function(event) {
        if (isExtensionError(event.error)) {
            console.log('🛡️ Extension error blocked');
            event.preventDefault();
            return false;
        }
    }, true);
    
    window.addEventListener('unhandledrejection', function(event) {
        if (isExtensionError(event.reason)) {
            console.log('🛡️ Extension promise rejection blocked');
            event.preventDefault();
            return false;
        }
    }, true);
    
    console.log('🛡️ Error firewall active');
})();

// ==================== 📦 GLOBAL STATE ====================
// Keep minimal global state for backward compatibility
window.currentUser = null;
window.currentChatUser = null;
window.allContacts = [];

// ==================== 🚀 APPLICATION INITIALIZATION ====================
window.onload = function() {
    console.log('[INIT] Starting CA360 Chat Application...');
    console.log('[INIT] Modular architecture loaded');
    
    // Load all preferences
    if (window.ThemeManager) window.ThemeManager.loadPreferences();
    if (window.NotificationManager) window.NotificationManager.loadPreferences();
    if (window.ContactsManager) window.ContactsManager.loadUserProfiles();
    
    // Check for existing session
    if (window.AuthManager) {
        window.AuthManager.checkSession();
    }
    
    // Setup all event listeners
    setupEventListeners();
    
    // Setup emoji listeners
    if (window.EmojiPicker) {
        window.EmojiPicker.setupListeners();
    }
    
    console.log('[INIT] ✅ Application initialized successfully');
};

// ==================== 🎛️ EVENT LISTENERS SETUP ====================
function setupEventListeners() {
    console.log('[INIT] Setting up event listeners...');
    
    // ===== LOGIN & LOGOUT =====
    const loginBtn = document.getElementById('login-btn');
    const loginPassword = document.getElementById('login-password');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginBtn) loginBtn.addEventListener('click', () => window.AuthManager.login());
    if (loginPassword) {
        loginPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') window.AuthManager.login();
        });
    }
    if (logoutBtn) logoutBtn.addEventListener('click', () => window.AuthManager.logout());
    
// ===== THEME & SOUND =====
    const themeToggle = document.getElementById('theme-toggle');
    const soundToggle = document.getElementById('sound-toggle');
    
    if (themeToggle) themeToggle.addEventListener('click', () => window.ThemeManager.toggle());
    if (soundToggle) soundToggle.addEventListener('click', () => window.NotificationManager.toggleSound());
    
    // ===== PROFILE PICTURE =====
    const profileUpload = document.getElementById('profile-upload');
    if (profileUpload) {
        profileUpload.addEventListener('change', function(e) {
            if (window.ContactsManager) {
                window.ContactsManager.uploadProfilePic(e.target);
            }
        });
    }
    
    // ===== CHAT INPUT =====
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => window.TypingManager.handleKeyPress(e));
        chatInput.addEventListener('keyup', () => window.TypingManager.handleKeyUp());
    }
    
    // ===== CAMERA & GALLERY BUTTONS =====
    const cameraBtn = document.getElementById('camera-btn');
    const galleryBtn = document.getElementById('gallery-btn');
    
    if (cameraBtn) {
        cameraBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📷 Camera button clicked');
            const fileInput = document.getElementById('file-input');
            if (fileInput) {
                fileInput.value = '';
                fileInput.accept = 'image/*';
                fileInput.setAttribute('capture', 'environment');
                fileInput.click();
            }
        });
    }
    
    if (galleryBtn) {
        galleryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖼️ Gallery button clicked');
            const fileInput = document.getElementById('file-input');
            if (fileInput) {
                fileInput.value = '';
                fileInput.accept = 'image/*,video/*';
                fileInput.removeAttribute('capture');
                fileInput.click();
            }
        });
    }
    
    // ===== SEND BUTTON =====
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.addEventListener('click', () => window.MessagingManager.sendMessage());
    
    // ===== EMOJI PICKER =====
    const emojiBtn = document.getElementById('emoji-btn');
    if (emojiBtn) emojiBtn.addEventListener('click', () => window.EmojiPicker.toggle());
    
    // ===== FILE ATTACHMENT =====
    const fileInput = document.getElementById('file-input');
    const clearFileBtn = document.getElementById('clear-file-btn');
    
    if (fileInput) fileInput.addEventListener('change', () => window.MessagingManager.handleFileSelect());
    if (clearFileBtn) clearFileBtn.addEventListener('click', () => window.MessagingManager.clearFileSelection());
    
    // ===== VOICE RECORDING =====
    const voiceBtn = document.getElementById('voice-btn');
    const stopRecordingBtn = document.getElementById('stop-recording');
    const cancelRecordingBtn = document.getElementById('cancel-recording');
    
    if (voiceBtn) voiceBtn.addEventListener('click', () => window.VoiceRecorder.start());
    if (stopRecordingBtn) stopRecordingBtn.addEventListener('click', () => window.VoiceRecorder.stop());
    if (cancelRecordingBtn) cancelRecordingBtn.addEventListener('click', () => window.VoiceRecorder.cancel());
    
    // ===== SEARCH =====
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') window.MessagingManager.searchMessages();
        });
    }
    
    // ===== EXPORT =====
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) exportBtn.addEventListener('click', () => window.MessagingManager.exportMessages());
    
    // ===== KEYBOARD SHORTCUTS =====
    document.addEventListener('keydown', function(e) {
        if (!window.currentUser || document.activeElement.tagName === 'INPUT') return;
        
        // Ctrl/Cmd + 1-9: Select contact
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
            e.preventDefault();
            const index = parseInt(e.key) - 1;
            const contacts = window.ContactsManager ? window.ContactsManager.getAllContacts() : [];
            if (contacts[index]) {
                window.ContactsManager.selectContact(contacts[index].id);
            }
        }
        
        // ESC: Close search/emoji picker
        if (e.key === 'Escape') {
            const searchResults = document.getElementById('search-results');
            const searchInputEl = document.getElementById('search-input');
            const emojiPicker = document.getElementById('emoji-picker');
            
            if (searchResults) searchResults.style.display = 'none';
            if (searchInputEl) searchInputEl.value = '';
            if (emojiPicker) emojiPicker.style.display = 'none';
        }
    });
    
    // ===== CLICK OUTSIDE TO CLOSE =====
    document.addEventListener('click', function(e) {
        const emojiPicker = document.getElementById('emoji-picker');
        const emojiButton = document.getElementById('emoji-btn');
        
        // Close emoji picker if click is outside
        if (emojiPicker && emojiButton && 
            !emojiPicker.contains(e.target) && 
            e.target !== emojiButton) {
            emojiPicker.style.display = 'none';
        }
    });
    
    console.log('[INIT] ✅ Event listeners setup complete');
}

// ==================== ⌨️ GLOBAL ESC KEY HANDLER ====================
(function() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            console.log('⌨️ ESC pressed!');
            
            // Check for modals/menus and close them
            const attachmentMenu = document.getElementById('attachment-menu');
            const attachmentBackdrop = document.getElementById('attachment-backdrop');
            
            if (attachmentMenu) {
                const menuStyle = window.getComputedStyle(attachmentMenu);
                if (menuStyle.display === 'block') {
                    console.log('📎 Closing attachment menu...');
                    attachmentMenu.style.display = 'none';
                    attachmentMenu.classList.remove('closing');
                    if (attachmentBackdrop) attachmentBackdrop.style.display = 'none';
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            }
            
            // Close other modals if they exist
            const cameraModal = document.getElementById('camera-modal');
            if (cameraModal && window.getComputedStyle(cameraModal).display !== 'none') {
                if (window.closeCameraCapture) {
                    window.closeCameraCapture();
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            }
        }
    }, true);
    
    console.log('⌨️ ESC key handler activated');
})();

// ==================== 🔵 GOOGLE LOGIN HANDLER ====================
(function() {
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('🔵 Google login clicked - fetching auth URL...');
            
            try {
                const response = await fetch('/api/google-login');
                const data = await response.json();
                
                if (data.success && data.auth_url) {
                    console.log('✅ Got auth URL, redirecting...');
                    window.location.href = data.auth_url;
                } else {
                    alert('Failed to start Google login');
                }
            } catch (error) {
                console.error('❌ Google login error:', error);
                alert('Failed to start Google login');
            }
        });
        console.log('✅ Google login button configured');
    }
})();

// ==================== 📱 ICON SIDEBAR ====================
(function() {
    console.log('🎯 Icon Sidebar: Initializing...');
    
    // Update user initial in icon sidebar
    function updateIconSidebarUser() {
        const userName = document.getElementById('current-user-name')?.textContent || 'User';
        const initial = userName.charAt(0).toUpperCase();
        const iconInitial = document.getElementById('icon-user-initial');
        if (iconInitial) {
            iconInitial.textContent = initial;
        }
    }
    
    // Icon sidebar button handlers
    const iconHandlers = {
        'icon-user-avatar': () => document.getElementById('settings-btn')?.click(),
        'icon-chats': function() {
            document.querySelectorAll('.icon-sidebar-item').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
        },
        'icon-search': () => document.getElementById('search-input')?.focus(),
        'icon-themes': () => window.ThemeManager?.toggle(),
        'icon-settings': () => document.getElementById('settings-btn')?.click(),
        'icon-logout': () => {
            if (confirm('Are you sure you want to logout?')) {
                window.AuthManager?.logout();
            }
        }
    };
    
    // Attach handlers
    Object.keys(iconHandlers).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', iconHandlers[id]);
        }
    });
    
    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateIconSidebarUser);
    } else {
        updateIconSidebarUser();
    }
    
    // Watch for user name changes
    const userNameElement = document.getElementById('current-user-name');
    if (userNameElement) {
        const observer = new MutationObserver(updateIconSidebarUser);
        observer.observe(userNameElement, { 
            childList: true, 
            characterData: true, 
            subtree: true 
        });
    }
    
    // Mobile sidebar toggle
    if (window.innerWidth <= 768) {
        document.querySelectorAll('.icon-sidebar-item').forEach(item => {
            item.addEventListener('click', function() {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.toggle('mobile-open');
            });
        });
    }
    
    console.log('✅ Icon Sidebar: Initialization complete!');
})();

// ==================== 📊 AUTO-REFRESH STATISTICS ====================
setInterval(() => {
    const currentUser = window.AuthManager?.getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
        if (window.ContactsManager) {
            window.ContactsManager.loadStatistics();
        }
    }
}, 30000); // Every 30 seconds


// ==================== 📞 CALL BUTTON SETUP ====================
function setupCallButtons() {
    const voiceBtn = document.getElementById('voice-call-btn');
    const videoBtn = document.getElementById('video-call-btn');
    
    if (voiceBtn) {
        voiceBtn.addEventListener('click', function() {
            const currentUser = window.currentChatUser;
            const userName = document.getElementById('chat-user-name')?.textContent;
            
            if (!currentUser || userName === 'Select a contact') {
                alert('Please select a contact first!');
                return;
            }
            
            console.log('📞 Starting voice call to:', currentUser);
            window.CallingManager.initiateCall(currentUser.id, window.AuthManager.getCurrentUser().name, 'audio');
        });
    }
    
    if (videoBtn) {
        videoBtn.addEventListener('click', function() {
            const currentUser = window.currentChatUser;
            const userName = document.getElementById('chat-user-name')?.textContent;
            
            if (!currentUser || userName === 'Select a contact') {
                alert('Please select a contact first!');
                return;
            }
            
            console.log('📹 Starting video call to:', currentUser);
            window.CallingManager.initiateCall(currentUser.id, window.AuthManager.getCurrentUser().name, 'video');
        });
    }
    
    console.log('✅ Call buttons setup complete');
}

// Initialize call buttons
setupCallButtons();

// ==================== 🎉 INITIALIZATION COMPLETE ====================
console.log('');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║           CA360 CHAT - MODULAR ARCHITECTURE v2.0          ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('📦 Modules Loaded:');
console.log('  ✅ Utils: DateUtils, FileUtils, HtmlUtils');
console.log('  ✅ UI: ThemeManager, NotificationManager, ModalManager');
console.log('  ✅ Core: AuthManager, ContactsManager, MessagingManager, SocketManager');
console.log('  ✅ Features: TypingManager, EmojiPicker, VoiceRecorder, CallingManager');
console.log('  ✅ Features: FileSharing, ChunkedUpload');
console.log('');
console.log('🚀 Application ready!');
console.log('');



