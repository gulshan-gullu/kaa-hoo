// ==================== 🔧 SIDEBAR RESIZE ====================
window.addEventListener('load', function() {
    setTimeout(function() {
        const sidebar = document.getElementById('sidebar');
        const handle = document.getElementById('resize-handle');
        
        if (!sidebar || !handle) return;
        
        console.log('✅ SIDEBAR RESIZE ACTIVATED');
        
        let isResizing = false;
        
        handle.addEventListener('mousedown', function(e) {
            isResizing = true;
            const startX = e.pageX;
            const startWidth = sidebar.offsetWidth;
            
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            
            const moveHandler = function(e) {
                if (!isResizing) return;
                const diff = e.pageX - startX;
                const newWidth = startWidth + diff;
                
                if (newWidth >= 280 && newWidth <= 600) {
                    sidebar.style.width = newWidth + 'px';
                }
            };
            
            const upHandler = function() {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
                localStorage.setItem('sidebarWidth', sidebar.offsetWidth);
            };
            
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
            
            e.preventDefault();
        });
        
        const saved = localStorage.getItem('sidebarWidth');
        if (saved) sidebar.style.width = saved + 'px';
        
    }, 500);
});

// ==================== 👨‍💼 ADMIN PANEL & SETTINGS ====================
window.addEventListener('load', function() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const adminSetting = document.getElementById('admin-setting');
    const themeToggleBtn = document.getElementById('toggle-theme');
    
    // Check if user is admin
    fetch('/api/session')
    .then(response => response.json())
    .then(data => {
        if (data.success && data.user) {
            window.currentUser = data.user;
            
            if (data.user.role === 'admin' && adminSetting) {
                adminSetting.style.display = 'block';
                adminSetting.classList.remove('hidden');
            }
        }
    })
    .catch(error => console.error('Error loading user:', error));
    
    // Settings Modal
    if (settingsBtn) settingsBtn.addEventListener('click', () => settingsModal.classList.add('show'));
    if (closeSettings) closeSettings.addEventListener('click', () => settingsModal.classList.remove('show'));
    if (settingsModal) settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.remove('show');
    });
    
    // Theme Toggle
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            const themeText = document.getElementById('current-theme');
            if (themeText) themeText.textContent = newTheme.charAt(0).toUpperCase() + newTheme.slice(1);
        });
    }
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    const themeText = document.getElementById('current-theme');
    if (themeText) themeText.textContent = savedTheme.charAt(0).toUpperCase() + savedTheme.slice(1);
    
    // Password Change
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            const currentPass = document.getElementById('current-password').value.trim();
            const newPass = document.getElementById('new-password').value.trim();
            const confirmPass = document.getElementById('confirm-password').value.trim();
            
            if (!currentPass || !newPass || !confirmPass) {
                alert('❌ Please fill in all password fields');
                return;
            }
            
            if (newPass !== confirmPass) {
                alert('❌ New passwords do not match!');
                return;
            }
            
            if (newPass.length < 3) {
                alert('❌ Password must be at least 3 characters long');
                return;
            }
            
            changePasswordBtn.disabled = true;
            changePasswordBtn.textContent = '🔄 Changing...';
            
            fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: currentPass,
                    new_password: newPass
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('✅ ' + data.message);
                    document.getElementById('current-password').value = '';
                    document.getElementById('new-password').value = '';
                    document.getElementById('confirm-password').value = '';
                } else {
                    alert('❌ ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('❌ Failed to change password');
            })
            .finally(() => {
                changePasswordBtn.disabled = false;
                changePasswordBtn.innerHTML = '🔒 Change Password';
            });
        });
    }
    
    // Google Login
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', function() {
            fetch('/api/google-login')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const width = 500, height = 600;
                        const left = (screen.width - width) / 2;
                        const top = (screen.height - height) / 2;
                        window.open(data.auth_url, 'Google Login', 
                            `width=${width},height=${height},left=${left},top=${top}`);
                    }
                })
                .catch(error => console.error('Google login error:', error));
        });
    }
    
    window.addEventListener('message', function(event) {
        if (event.data.type === 'google_login_success') {
            window.location.reload();
        }
    });
});