// ========================================
// BROWSER NOTIFICATION SYSTEM
// ========================================

(function() {
    'use strict';
    
    console.log('🔔 Notification Module Loading...');
    
    let notificationsEnabled = false;
    
    // Request notification permission
    async function requestNotificationPermission() {
        if (!("Notification" in window)) {
            console.log("❌ This browser doesn't support notifications");
            return false;
        }
        
        if (Notification.permission === "granted") {
            notificationsEnabled = true;
            return true;
        }
        
        if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            notificationsEnabled = permission === "granted";
            return notificationsEnabled;
        }
        
        return false;
    }
    
    // Show notification
    function showNotification(title, options = {}) {
        if (!notificationsEnabled || Notification.permission !== "granted") {
            return;
        }
        
        // Don't show if window is focused
        if (document.hasFocus()) {
            return;
        }
        
        const defaultOptions = {
            icon: '/static/logo.png',
            badge: '/static/logo.png',
            vibrate: [200, 100, 200],
            tag: 'kaa-ho-chat',
            renotify: true,
            requireInteraction: false,
            ...options
        };
        
        const notification = new Notification(title, defaultOptions);
        
        notification.onclick = function() {
            window.focus();
            this.close();
        };
        
        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
        
        return notification;
    }
    
    // Intercept new messages to show notifications
    if (window.socket) {
        const originalOnMessage = window.socket._callbacks?.$new_message;
        
        window.socket.on('new_message', function(message) {
            // Show notification for new messages
            if (message.receiver_id === window.currentUser?.id) {
                const sender = window.allContacts?.find(c => c.id === message.sender_id);
                const senderName = sender?.name || 'Someone';
                
                showNotification(senderName, {
                    body: message.text?.substring(0, 100) || 'Sent a message',
                    icon: '/static/logo.png'
                });
            }
            
            // Call original handler
            if (originalOnMessage) {
                originalOnMessage.forEach(fn => fn(message));
            }
        });
    }
    
    // Add notification toggle button
    function addNotificationToggle() {
        const headerButtons = document.querySelector('.sidebar-header .header-buttons');
        if (!headerButtons) return;
        
        const btn = document.createElement('button');
        btn.id = 'notification-toggle';
        btn.className = 'settings-btn';
        btn.innerHTML = notificationsEnabled ? '🔔 ON' : '🔔 OFF';
        btn.title = 'Toggle Notifications';
        
        btn.addEventListener('click', async () => {
            if (!notificationsEnabled) {
                const granted = await requestNotificationPermission();
                if (granted) {
                    btn.innerHTML = '🔔 ON';
                    showNotification('Notifications Enabled', {
                        body: 'You will now receive message notifications'
                    });
                } else {
                    alert('Please enable notifications in your browser settings');
                }
            } else {
                notificationsEnabled = false;
                btn.innerHTML = '🔔 OFF';
            }
        });
        
        headerButtons.insertBefore(btn, headerButtons.firstChild);
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        // Auto-request permission after 3 seconds
        setTimeout(requestNotificationPermission, 3000);
        setTimeout(addNotificationToggle, 2000);
        console.log('✅ Notification Module Ready!');
    }
    
    // Expose functions
    window.notifications = {
        show: showNotification,
        requestPermission: requestNotificationPermission,
        enabled: () => notificationsEnabled
    };
    
})();