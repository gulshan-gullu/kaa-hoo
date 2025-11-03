// ==========================================
// 🔐 AUTHENTICATION MANAGER
// Login, logout, session management
// Dependencies: ModalManager
// ==========================================

(function() {
    'use strict';
    
    let currentUser = null;
    
    // Ensure user is logged in
    function ensureLoggedIn() {
        if (!currentUser) {
            console.warn('[AUTH] Not logged in - redirecting');
            showLoginScreen();
            return false;
        }
        return true;
    }
    
    // Handle 401 Unauthorized
    function handle401() {
        console.warn('[AUTH] Session expired');
        currentUser = null;
        window.currentChatUser = null;
        window.allContacts = [];
        if (window.socket) window.socket.disconnect();
        showLoginScreen();
    }
    
    // Check if user has an active session
    async function checkSession() {
        try {
            const response = await fetch('/api/session', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    currentUser = data.user;
                    window.currentUser = data.user;
                    showMainApp();
                    if (window.SocketManager) {
                        window.SocketManager.init();
                    }
                    return;
                }
            }
        } catch (error) {
            console.log('[SESSION] No active session');
        }
        showLoginScreen();
    }
    
    // Handle user login
    async function doLogin() {
        const userIdInput = document.getElementById('login-user-id');
        const passwordInput = document.getElementById('login-password');
        
        if (!userIdInput || !passwordInput) {
            window.ModalManager.showError('Login form not found');
            return;
        }
        
        const userId = userIdInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!userId || !password) {
            window.ModalManager.showError('Please enter both User ID and password');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, password: password }),
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) {
                currentUser = data.user;
                window.currentUser = data.user;
                window.ModalManager.showSuccess('Login successful!');
                setTimeout(() => {
                    showMainApp();
                    if (window.SocketManager) {
                        window.SocketManager.init();
                    }
                }, 500);
            } else {
                window.ModalManager.showError(data.message || 'Login failed');
            }
        } catch (error) {
            window.ModalManager.showError('Connection error. Please try again.');
        }
    }
    
    // Handle user logout
    async function doLogout() {
        try {
            await fetch('/api/logout', { 
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('[LOGOUT] Error:', error);
        }
        
        if (window.socket) {
            window.socket.disconnect();
            window.socket = null;
        }
        
        currentUser = null;
        window.currentUser = null;
        window.currentChatUser = null;
        window.allContacts = [];
        
        const chatArea = document.getElementById('chat-area');
        const welcomeScreen = document.getElementById('welcome-screen');
        if (chatArea) chatArea.classList.add('chat-area-hidden');
        if (welcomeScreen) welcomeScreen.style.display = 'flex';
        
        showLoginScreen();
    }
    
    // Show login screen
    function showLoginScreen() {
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        const loginUserId = document.getElementById('login-user-id');
        const loginPassword = document.getElementById('login-password');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        if (loginUserId) loginUserId.value = '';
        if (loginPassword) loginPassword.value = '';
    }
    
    // Show main app
    function showMainApp() {
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'flex';
        
        if (currentUser) {
            const currentUserName = document.getElementById('current-user-name');
            const badgeEl = document.getElementById('current-user-badge');
            
            if (currentUserName) currentUserName.textContent = currentUser.name;
            if (badgeEl) {
                badgeEl.textContent = currentUser.role.toUpperCase();
                badgeEl.className = `user-badge badge-${currentUser.role}`;
            }
        }
    }
    
    // Expose to window
    window.AuthManager = {
        ensureLoggedIn: ensureLoggedIn,
        handle401: handle401,
        checkSession: checkSession,
        login: doLogin,
        logout: doLogout,
        getCurrentUser: function() { return currentUser; },
        showLoginScreen: showLoginScreen,
        showMainApp: showMainApp
    };
    
    console.log('✅ [AuthManager] Module loaded');
    
})();