// ==========================================
// 🔐 LOGIN PAGE CONTROLLER
// Handles all login page interactions
// With comprehensive error handling
// ==========================================

(function() {
    'use strict';
    
    // ==========================================
    // 📊 ENHANCED STATUS MESSAGE SYSTEM
    // ==========================================
    const StatusManager = {
        statusEl: null,
        statusText: null,
        statusIcon: null,
        currentTimeout: null,
        
        init: function() {
            this.statusEl = document.getElementById('status-message');
            if (this.statusEl) {
                this.statusText = this.statusEl.querySelector('.status-text');
                this.statusIcon = this.statusEl.querySelector('.status-icon');
            }
        },
        
        show: function(message, type = 'info', duration = 5000) {
            if (!this.statusEl) {
                // Fallback to alert if status element not found
                alert(message);
                console.error('[STATUS] Status element not found, using alert fallback');
                return;
            }
            
            // Clear any existing timeout
            if (this.currentTimeout) {
                clearTimeout(this.currentTimeout);
                this.currentTimeout = null;
            }
            
            try {
                if (this.statusText) this.statusText.textContent = message;
                this.statusEl.className = 'status-message ' + type;
                this.statusEl.style.display = 'flex';
                
                const icons = {
                    success: '✓',
                    error: '✗',
                    info: 'ℹ',
                    warning: '⚠'
                };
                
                if (this.statusIcon) {
                    this.statusIcon.textContent = icons[type] || 'ℹ';
                }
                
                // Auto-hide for success/info messages
                if (type === 'success' || type === 'info') {
                    this.currentTimeout = setTimeout(() => {
                        this.hide();
                    }, duration);
                }
                
                // Log to console for debugging
                console.log(`[STATUS] ${type.toUpperCase()}: ${message}`);
            } catch (error) {
                console.error('[STATUS] Error showing status:', error);
                alert(message); // Fallback
            }
        },
        
        hide: function() {
            if (this.statusEl) {
                this.statusEl.style.display = 'none';
            }
            if (this.currentTimeout) {
                clearTimeout(this.currentTimeout);
                this.currentTimeout = null;
            }
        },
        
        success: function(message, duration) {
            this.show(message, 'success', duration);
        },
        
        error: function(message, duration = 0) {
            this.show(message, 'error', duration);
        },
        
        warning: function(message, duration) {
            this.show(message, 'warning', duration);
        },
        
        info: function(message, duration) {
            this.show(message, 'info', duration);
        }
    };

    // ==========================================
    // 🔧 ERROR HANDLER
    // ==========================================
    const ErrorHandler = {
        logError: function(context, error, userMessage) {
            const errorInfo = {
                context: context,
                message: error.message || 'Unknown error',
                stack: error.stack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            console.error(`[ERROR] ${context}:`, errorInfo);
            
            // Show user-friendly message
            if (userMessage) {
                StatusManager.error(userMessage);
            }
            
            // You can send errors to a logging service here
            // this.sendToLogService(errorInfo);
        },
        
        handleNetworkError: function(error, context) {
            console.error(`[NETWORK ERROR] ${context}:`, error);
            
            let message = 'Connection error. Please check your internet and try again.';
            
            // Specific error messages
            if (error.message && error.message.includes('Failed to fetch')) {
                message = 'Unable to reach the server. Please check your connection.';
            } else if (error.message && error.message.includes('NetworkError')) {
                message = 'Network error occurred. Please try again.';
            } else if (error.name === 'AbortError') {
                message = 'Request timed out. Please try again.';
            }
            
            StatusManager.error(message);
        },
        
        handleAPIError: function(response, data, context) {
            console.error(`[API ERROR] ${context}:`, {
                status: response.status,
                statusText: response.statusText,
                data: data
            });
            
            let message = 'An error occurred. Please try again.';
            
            // HTTP status code specific messages
            switch (response.status) {
                case 400:
                    message = data.message || 'Invalid request. Please check your input.';
                    break;
                case 401:
                    message = data.message || 'Invalid credentials. Please try again.';
                    break;
                case 403:
                    message = 'Access denied. Please contact support.';
                    break;
                case 404:
                    message = 'Service not found. Please contact support.';
                    break;
                case 429:
                    message = 'Too many attempts. Please wait a moment and try again.';
                    break;
                case 500:
                case 502:
                case 503:
                case 504:
                    message = 'Server error. Please try again later.';
                    break;
                default:
                    message = data.message || 'An unexpected error occurred.';
            }
            
            StatusManager.error(message);
        },
        
        handleValidationError: function(field, message) {
            console.warn(`[VALIDATION] ${field}: ${message}`);
            StatusManager.warning(message, 4000);
        }
    };

    // ==========================================
    // 🔒 INPUT VALIDATOR
    // ==========================================
    const Validator = {
        validateUserId: function(userId) {
            if (!userId || userId.trim() === '') {
                return { valid: false, message: 'User ID is required' };
            }
            
            if (userId.length < 3) {
                return { valid: false, message: 'User ID must be at least 3 characters' };
            }
            
            if (userId.length > 100) {
                return { valid: false, message: 'User ID is too long' };
            }
            
            return { valid: true };
        },
        
        validatePassword: function(password) {
            if (!password || password.trim() === '') {
                return { valid: false, message: 'Password is required' };
            }
            
            if (password.length < 3) {
                return { valid: false, message: 'Password must be at least 3 characters' };
            }
            
            if (password.length > 200) {
                return { valid: false, message: 'Password is too long' };
            }
            
            return { valid: true };
        },
        
        validateCredentials: function(userId, password) {
            const userIdValidation = this.validateUserId(userId);
            if (!userIdValidation.valid) {
                return userIdValidation;
            }
            
            const passwordValidation = this.validatePassword(password);
            if (!passwordValidation.valid) {
                return passwordValidation;
            }
            
            return { valid: true };
        }
    };

    // ==========================================
    // 🎮 BUTTON CONTROLLER
    // ==========================================
    const ButtonController = {
        disable: function(button) {
            if (!button) return;
            
            try {
                button.disabled = true;
                button.style.opacity = '0.6';
                button.style.cursor = 'not-allowed';
                button.dataset.originalText = button.querySelector('.btn-text')?.textContent || '';
                
                const btnText = button.querySelector('.btn-text');
                if (btnText) {
                    btnText.textContent = 'Please wait...';
                }
            } catch (error) {
                console.error('[BUTTON] Error disabling button:', error);
            }
        },
        
        enable: function(button) {
            if (!button) return;
            
            try {
                button.disabled = false;
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                
                const btnText = button.querySelector('.btn-text');
                if (btnText && button.dataset.originalText) {
                    btnText.textContent = button.dataset.originalText;
                }
            } catch (error) {
                console.error('[BUTTON] Error enabling button:', error);
            }
        },
        
        reset: function(button) {
            this.enable(button);
        }
    };

    // ==========================================
    // 🔑 PASSWORD LOGIN HANDLER
    // ==========================================
    async function handlePasswordLogin() {
        console.log('[LOGIN] Password login initiated');
        
        let userIdInput, passwordInput, loginBtn;
        
        try {
            // Get elements
            userIdInput = document.getElementById('user-id');
            passwordInput = document.getElementById('password');
            loginBtn = document.getElementById('password-login-btn');
            
            // Check if elements exist
            if (!userIdInput || !passwordInput) {
                throw new Error('Login form elements not found');
            }
            
            // Get values
            const userId = userIdInput.value.trim();
            const password = passwordInput.value.trim();
            
            // Validate input
            const validation = Validator.validateCredentials(userId, password);
            if (!validation.valid) {
                ErrorHandler.handleValidationError('credentials', validation.message);
                userIdInput.focus();
                return;
            }
            
            // Disable button
            ButtonController.disable(loginBtn);
            StatusManager.info('Signing in...', 3000);
            
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            // Make API request
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    user_id: userId, 
                    password: password 
                }),
                credentials: 'include',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Check if response is ok
            if (!response.ok) {
                const data = await response.json().catch(() => ({ message: 'Server error' }));
                ErrorHandler.handleAPIError(response, data, 'Password Login');
                ButtonController.enable(loginBtn);
                passwordInput.focus();
                passwordInput.select();
                return;
            }
            
            // Parse response
            const data = await response.json();
            
            if (data.success) {
                StatusManager.success('Login successful! Redirecting...', 2000);
                
                // Clear sensitive data
                userIdInput.value = '';
                passwordInput.value = '';
                
                // Redirect
                setTimeout(() => {
                    window.location.href = '/';
                }, 500);
            } else {
                ErrorHandler.handleAPIError(response, data, 'Password Login');
                ButtonController.enable(loginBtn);
                passwordInput.focus();
                passwordInput.select();
            }
            
        } catch (error) {
            console.error('[LOGIN] Exception:', error);
            
            if (error.name === 'AbortError') {
                StatusManager.error('Request timed out. Please try again.');
            } else {
                ErrorHandler.handleNetworkError(error, 'Password Login');
            }
            
            ButtonController.enable(loginBtn);
            
            if (passwordInput) {
                passwordInput.focus();
                passwordInput.select();
            }
        }
    }

    // ==========================================
    // 👆 BIOMETRIC LOGIN HANDLER
    // ==========================================
    async function handleBiometricLogin() {
        console.log('[BIOMETRIC] Login initiated');
        
        let userIdInput, bioBtn;
        
        try {
            // Get elements
            userIdInput = document.getElementById('bio-user-id');
            bioBtn = document.getElementById('biometric-login-btn');
            
            if (!userIdInput) {
                throw new Error('Biometric form elements not found');
            }
            
            // Get value
            const userId = userIdInput.value.trim();
            
            // Validate
            const validation = Validator.validateUserId(userId);
            if (!validation.valid) {
                ErrorHandler.handleValidationError('userId', validation.message);
                userIdInput.focus();
                return;
            }
            
            // Disable button
            ButtonController.disable(bioBtn);
            StatusManager.info('Authenticating with biometrics...', 3000);
            
            // Create abort controller
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            // Make API request
            const response = await fetch('/api/biometric_login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ user_id: userId }),
                credentials: 'include',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const data = await response.json().catch(() => ({ message: 'Server error' }));
                ErrorHandler.handleAPIError(response, data, 'Biometric Login');
                ButtonController.enable(bioBtn);
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                StatusManager.success('Biometric authentication successful!', 2000);
                userIdInput.value = '';
                setTimeout(() => {
                    window.location.href = '/';
                }, 500);
            } else {
                ErrorHandler.handleAPIError(response, data, 'Biometric Login');
                ButtonController.enable(bioBtn);
            }
            
        } catch (error) {
            console.error('[BIOMETRIC] Exception:', error);
            
            if (error.name === 'AbortError') {
                StatusManager.error('Request timed out. Please try again.');
            } else {
                ErrorHandler.handleNetworkError(error, 'Biometric Login');
            }
            
            ButtonController.enable(bioBtn);
        }
    }

    // ==========================================
    // 🌐 GOOGLE LOGIN HANDLER
    // ==========================================
    function handleGoogleLogin() {
        try {
            console.log('[GOOGLE] Login initiated');
            StatusManager.info('Redirecting to Google...', 2000);
            
            setTimeout(() => {
                window.location.href = '/api/google_login';
            }, 300);
            
        } catch (error) {
            ErrorHandler.logError('Google Login', error, 'Failed to redirect to Google. Please try again.');
        }
    }

    // ==========================================
    // 🔄 TAB SWITCHING
    // ==========================================
    function switchTab(method) {
        try {
            console.log(`[TAB] Switching to ${method}`);
            
            // Update tabs
            document.querySelectorAll('.auth-tab').forEach(tab => {
                if (tab.dataset.method === method) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            
            // Update methods
            document.querySelectorAll('.auth-method').forEach(methodEl => {
                if (methodEl.id === method + '-method') {
                    methodEl.classList.add('active');
                } else {
                    methodEl.classList.remove('active');
                }
            });
            
            // Focus first input
            setTimeout(() => {
                const activeMethod = document.querySelector('.auth-method.active');
                if (activeMethod) {
                    const firstInput = activeMethod.querySelector('input');
                    if (firstInput) firstInput.focus();
                }
            }, 100);
            
        } catch (error) {
            ErrorHandler.logError('Tab Switch', error, null);
        }
    }

    // ==========================================
    // 👁️ PASSWORD VISIBILITY TOGGLE
    // ==========================================
    function setupPasswordToggle() {
        try {
            const toggleBtn = document.querySelector('.toggle-password');
            const passwordInput = document.getElementById('password');
            
            if (!toggleBtn || !passwordInput) {
                console.warn('[PASSWORD TOGGLE] Elements not found');
                return;
            }
            
            toggleBtn.addEventListener('click', function(e) {
                try {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const isPassword = passwordInput.type === 'password';
                    passwordInput.type = isPassword ? 'text' : 'password';
                    
                    const eyeOpen = toggleBtn.querySelector('.eye-open');
                    const eyeClosed = toggleBtn.querySelector('.eye-closed');
                    
                    if (eyeOpen) eyeOpen.style.display = isPassword ? 'none' : 'inline';
                    if (eyeClosed) eyeClosed.style.display = isPassword ? 'inline' : 'none';
                } catch (error) {
                    ErrorHandler.logError('Password Toggle Click', error, null);
                }
            });
            
            console.log('✓ Password toggle connected');
            
        } catch (error) {
            ErrorHandler.logError('Password Toggle Setup', error, null);
        }
    }

    // ==========================================
    // 🚀 INITIALIZATION
    // ==========================================
    function init() {
        try {
            console.log('🔐 [CA360 Login] Initializing...');
            
            // Initialize status manager
            StatusManager.init();
            
            // 1. Password Login Button
            const passwordBtn = document.getElementById('password-login-btn');
            if (passwordBtn) {
                passwordBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    handlePasswordLogin();
                });
                console.log('✓ Password login button connected');
            } else {
                console.warn('⚠ Password login button not found');
            }

            // 2. Biometric Login Button
            const biometricBtn = document.getElementById('biometric-login-btn');
            if (biometricBtn) {
                biometricBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    handleBiometricLogin();
                });
                console.log('✓ Biometric login button connected');
            } else {
                console.warn('⚠ Biometric login button not found');
            }

            // 3. Google Login Button
            const googleBtn = document.getElementById('google-login-btn');
            if (googleBtn) {
                googleBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    handleGoogleLogin();
                });
                console.log('✓ Google login button connected');
            } else {
                console.warn('⚠ Google login button not found');
            }

            // 4. Enter Key Support - Password Fields
            const userIdInput = document.getElementById('user-id');
            const passwordInput = document.getElementById('password');
            
            if (userIdInput) {
                userIdInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handlePasswordLogin();
                    }
                });
            }
            
            if (passwordInput) {
                passwordInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handlePasswordLogin();
                    }
                });
            }

            // 5. Enter Key Support - Biometric Field
            const bioInput = document.getElementById('bio-user-id');
            if (bioInput) {
                bioInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBiometricLogin();
                    }
                });
            }

            // 6. Tab Switching
            document.querySelectorAll('.auth-tab').forEach(tab => {
                tab.addEventListener('click', function(e) {
                    e.preventDefault();
                    const method = this.dataset.method;
                    if (method) {
                        switchTab(method);
                    }
                });
            });

            // 7. Password Toggle
            setupPasswordToggle();

            // 8. Auto-focus first input
            if (userIdInput) {
                setTimeout(() => userIdInput.focus(), 100);
            }

            console.log('✅ [CA360 Login] All systems ready!');
            console.log('📊 Status:', {
                passwordLogin: !!passwordBtn,
                biometricLogin: !!biometricBtn,
                googleLogin: !!googleBtn,
                statusManager: !!StatusManager.statusEl,
                errorHandler: true,
                validator: true
            });
            
        } catch (error) {
            console.error('[INIT] Fatal initialization error:', error);
            alert('Failed to initialize login page. Please refresh and try again.');
        }
    }

    // ==========================================
    // 🛡️ GLOBAL ERROR BOUNDARY
    // ==========================================
    window.addEventListener('error', function(e) {
        ErrorHandler.logError(
            'Global Window Error',
            e.error || new Error(e.message),
            'An unexpected error occurred. Please refresh the page.'
        );
    });

    window.addEventListener('unhandledrejection', function(e) {
        ErrorHandler.logError(
            'Unhandled Promise Rejection',
            new Error(e.reason),
            'Connection error. Please try again.'
        );
    });

    // ==========================================
    // 🎬 START APPLICATION
    // ==========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();