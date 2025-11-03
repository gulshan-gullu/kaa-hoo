// ==========================================
// 🔌 ENTERPRISE SOCKET MANAGER
// Military-grade reliability for mission-critical messaging
// Zero-tolerance for message loss
// ==========================================

(function() {
    'use strict';
    
    let socket = null;
    let reconnectionAttempts = 0;
    let messageQueue = [];
    let heartbeatInterval = null;
    let connectionMonitor = null;
    let lastMessageId = null;
    let messageBuffer = new Map();
    let pendingAcks = new Map();
    
    const CONFIG = {
        RECONNECTION_DELAY: 1000,
        RECONNECTION_DELAY_MAX: 10000,
        RECONNECTION_ATTEMPTS: Infinity,
        TIMEOUT: 30000,
        HEARTBEAT_INTERVAL: 15000,
        MESSAGE_RETRY_LIMIT: 5,
        MESSAGE_TIMEOUT: 10000,
        BUFFER_SIZE: 1000,
        CONNECTION_CHECK_INTERVAL: 5000
    };
    
    // ==================== INITIALIZATION ====================
    
    function initSocket() {
        console.log('[SOCKET] 🚀 Initializing enterprise-grade Socket.IO connection...');
        console.log('[SOCKET] 📊 Configuration:', CONFIG);
        
        try {
            socket = io(window.location.origin, {
                transports: ['websocket'], secure: true,
                upgrade: true,
                reconnection: true,
                reconnectionDelay: CONFIG.RECONNECTION_DELAY,
                reconnectionDelayMax: CONFIG.RECONNECTION_DELAY_MAX,
                reconnectionAttempts: CONFIG.RECONNECTION_ATTEMPTS,
                timeout: CONFIG.TIMEOUT,
                forceNew: false,
                autoConnect: true,
                path: '/socket.io/',
                query: {
                    timestamp: Date.now()
                }
            });
            
            window.socket = socket;
            console.log('✅ [SOCKET] Socket instance created and exposed globally');
            
            setupSocketHandlers();
            startConnectionMonitor();
            startHeartbeat();
            
            return true;
        } catch (error) {
            console.error('[SOCKET] ❌ CRITICAL: Socket initialization failed:', error);
            handleCriticalError('Socket initialization failed', error);
            return false;
        }
    }
    
    // ==================== EVENT HANDLERS ====================
    
    function setupSocketHandlers() {
        console.log('[SOCKET] 📡 Setting up enterprise event handlers...');
        
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('new_message', handleNewMessage);
        socket.on('user_online', handleUserOnline);
        socket.on('user_offline', handleUserOffline);
        socket.on('typing_start', handleTypingStart);
        socket.on('typing_stop', handleTypingStop);
        socket.on('read_receipt', handleReadReceipt);
        socket.on('message_ack', handleMessageAck);
        socket.on('error', handleSocketError);
        socket.on('connect_error', handleConnectError);
        socket.on('connect_timeout', handleConnectTimeout);
        socket.on('reconnect', handleReconnect);
        socket.on('reconnect_attempt', handleReconnectAttempt);
        socket.on('reconnect_error', handleReconnectError);
        socket.on('reconnect_failed', handleReconnectFailed);
        socket.on('pong', handlePong);
        
        console.log('[SOCKET] ✅ All event handlers registered successfully');
    }
    
    // ==================== CONNECTION HANDLERS ====================
    
    function handleConnect() {
        console.log('[SOCKET] ✅ CONNECTION ESTABLISHED');
        console.log('[SOCKET] 🆔 Socket ID:', socket.id);
        console.log('[SOCKET] 🔌 Transport:', socket.io.engine.transport.name);
        
        reconnectionAttempts = 0;
        updateConnectionStatus('connected');
        
        safeExecute(() => {
            if (window.ContactsManager) {
                console.log('[SOCKET] 📇 Loading contacts...');
                window.ContactsManager.loadContacts();
            }
        }, 'Load contacts on connect');
        
        safeExecute(() => {
            const currentUser = window.AuthManager?.getCurrentUser();
            if (currentUser) {
                console.log('[SOCKET] 👤 User:', currentUser.id, '-', currentUser.name);
                
                if (currentUser.role === 'admin') {
                    console.log('[SOCKET] 👑 Admin privileges detected - loading statistics');
                    window.ContactsManager?.loadStatistics();
                }
            }
        }, 'Load user data');
        
        safeExecute(() => {
            if (window.CallingManager) {
                console.log('[SOCKET] 📞 Initializing calling features');
                window.CallingManager.initialize();
            }
        }, 'Initialize calling');
        
        flushMessageQueue();
        resumeMessageBuffer();
        
        console.log('[SOCKET] 🎉 Connection setup complete');
    }
    
    function handleDisconnect(reason) {
        console.warn('[SOCKET] ⚠️ DISCONNECTED - Reason:', reason);
        
        updateConnectionStatus('disconnected');
        
        safeExecute(() => {
            const allContacts = window.ContactsManager?.getAllContacts() || [];
            console.log('[SOCKET] 😴 Setting', allContacts.length, 'contacts to offline');
            
            allContacts.forEach(contact => {
                contact.online = false;
            });
            
            if (window.ContactsManager) {
                window.ContactsManager.displayContacts();
                window.ContactsManager.updateOnlineCount();
            }
        }, 'Set contacts offline');
        
        if (reason === 'io server disconnect') {
            console.error('[SOCKET] ❌ Server forcefully disconnected - attempting manual reconnect');
            setTimeout(() => socket.connect(), 1000);
        } else if (reason === 'transport close') {
            console.warn('[SOCKET] 🔌 Transport closed - automatic reconnection in progress');
        } else if (reason === 'ping timeout') {
            console.error('[SOCKET] ⏱️ Ping timeout - connection lost');
        }
    }
    
    // ==================== MESSAGE HANDLERS ====================
    
    function handleNewMessage(message) {
        console.log('[SOCKET] 📩 NEW MESSAGE RECEIVED');
        console.log('[SOCKET] 📋 Message data:', {
            id: message.id,
            from: message.sender_id,
            to: message.receiver_id,
            type: message.message_type,
            timestamp: message.timestamp
        });
        
        // ✅ CRITICAL: Check if message already exists in DOM (prevent duplicates)
        const existingMessage = document.querySelector(`[data-message-id="${message.id}"]`);
        if (existingMessage) {
            console.log('[SOCKET] ⚠️ Message already in DOM, skipping');
            sendMessageAck(message.id);
            return;
        }
        
        // Deduplicate messages in buffer
        if (messageBuffer.has(message.id)) {
            console.log('[SOCKET] ⚠️ Duplicate message in buffer - ignoring:', message.id);
            return;
        }
        
        messageBuffer.set(message.id, {
            message: message,
            receivedAt: Date.now()
        });
        
        cleanMessageBuffer();
        
        if (!validateMessage(message)) {
            console.error('[SOCKET] ❌ Invalid message format:', message);
            return;
        }
        
        const currentUser = safeExecute(() => window.AuthManager?.getCurrentUser(), 'Get current user');
        const currentChatUser = window.currentChatUser;
        
        if (!currentUser) {
            console.error('[SOCKET] ❌ CRITICAL: No current user found');
            return;
        }
        
        const isForCurrentChat = currentChatUser && (
            (message.sender_id === currentChatUser.id && message.receiver_id === currentUser.id) ||
            (message.sender_id === currentUser.id && message.receiver_id === currentChatUser.id)
        );
        
        console.log('[SOCKET] 🎯 Message routing:', {
            currentUser: currentUser.id,
            currentChat: currentChatUser?.id || 'none',
            isForCurrentChat: isForCurrentChat
        });
        
        if (isForCurrentChat) {
            console.log('[SOCKET] ✅ Adding message to current chat');
            
            safeExecute(() => {
                if (window.MessagingManager?.addMessage) {
                    window.MessagingManager.addMessage(message);
                    console.log('[SOCKET] ✅ Message added to UI');
                    sendMessageAck(message.id);
                } else {
                    console.error('[SOCKET] ❌ MessagingManager.addMessage not available');
                    throw new Error('MessagingManager not available');
                }
            }, 'Add message to chat', () => {
                queueMessage(message);
            });
        } else if (message.receiver_id === currentUser.id) {
            console.log('[SOCKET] 🔔 Message for different chat - updating unread count');
            
            safeExecute(() => {
                window.NotificationManager?.playSound();
                
                const allContacts = window.ContactsManager?.getAllContacts() || [];
                const contact = allContacts.find(c => c.id === message.sender_id);
                
                if (contact) {
                    contact.unread_count = (contact.unread_count || 0) + 1;
                    console.log('[SOCKET] 📬 Unread count for', contact.name, ':', contact.unread_count);
                    
                    window.ContactsManager?.displayContacts();
                }
            }, 'Update unread count');
        }
        
        lastMessageId = message.id;
        
        console.log('[SOCKET] ✅ Message handler complete');
    }
    
    function handleMessageAck(data) {
        console.log('[SOCKET] ✓ Message acknowledgment received:', data.message_id);
        
        if (pendingAcks.has(data.message_id)) {
            clearTimeout(pendingAcks.get(data.message_id).timeout);
            pendingAcks.delete(data.message_id);
            console.log('[SOCKET] ✅ Message delivery confirmed:', data.message_id);
        }
    }
    
    // ==================== STATUS HANDLERS ====================
    
    function handleUserOnline(data) {
        console.log('[STATUS] 🟢 User online:', data.user_id);
        safeExecute(() => {
            window.ContactsManager?.updateUserStatus(data.user_id, true);
        }, 'Update user online status');
    }
    
    function handleUserOffline(data) {
        console.log('[STATUS] 🔴 User offline:', data.user_id);
        safeExecute(() => {
            window.ContactsManager?.updateUserStatus(data.user_id, false);
        }, 'Update user offline status');
    }
    
    function handleTypingStart(data) {
        const currentChatUser = window.currentChatUser;
        
        if (currentChatUser && data.user_id === currentChatUser.id) {
            requestAnimationFrame(() => {
                safeExecute(() => {
                    const statusEl = document.getElementById('chat-user-status');
                    if (statusEl && statusEl.textContent !== 'Typing...') {
                        statusEl.textContent = 'Typing...';
                        statusEl.className = 'status-text typing';
                    }
                    
                    const typingIndicator = document.getElementById('typing-indicator');
                    const typingUser = document.getElementById('typing-user');
                    
                    if (typingIndicator && typingIndicator.style.display !== 'block') {
                        typingIndicator.style.display = 'block';
                    }
                    if (typingUser && typingUser.textContent !== currentChatUser.name) {
                        typingUser.textContent = currentChatUser.name;
                    }
                }, 'Show typing indicator');
            });
        }
    }
    
    function handleTypingStop(data) {
        const currentChatUser = window.currentChatUser;
        
        if (currentChatUser && data.user_id === currentChatUser.id) {
            requestAnimationFrame(() => {
                safeExecute(() => {
                    const statusEl = document.getElementById('chat-user-status');
                    const statusText = currentChatUser.online ? 'Online' : 'Offline';
                    if (statusEl && statusEl.textContent !== statusText) {
                        statusEl.textContent = statusText;
                        statusEl.className = `status-text ${currentChatUser.online ? 'online' : 'offline'}`;
                    }
                    
                    const typingIndicator = document.getElementById('typing-indicator');
                    if (typingIndicator && typingIndicator.style.display !== 'none') {
                        typingIndicator.style.display = 'none';
                    }
                }, 'Hide typing indicator');
            });
        }
    }
    
    function handleReadReceipt(data) {
        console.log('[RECEIPT] ✓✓ Read receipt:', data);
        
        if (!data.message_ids || !Array.isArray(data.message_ids)) {
            console.warn('[RECEIPT] ⚠️ Invalid read receipt data');
            return;
        }
        
        safeExecute(() => {
            data.message_ids.forEach(msgId => {
                const messageEl = document.querySelector(`[data-message-id="${msgId}"]`);
                
                if (messageEl) {
                    const tickElement = messageEl.querySelector('.read-receipt');
                    
                    if (tickElement) {
                        tickElement.className = 'read-receipt tick-read';
                        console.log('[RECEIPT] ✅ Updated message', msgId);
                    }
                }
            });
        }, 'Update read receipts');
    }
    
    // ==================== ERROR HANDLERS ====================
    
    function handleSocketError(error) {
        console.error('[SOCKET] ❌ Socket error:', error);
        logError('Socket error', error);
    }
    
    function handleConnectError(error) {
        console.error('[SOCKET] ❌ Connection error:', error);
        reconnectionAttempts++;
        updateConnectionStatus('error');
        
        if (reconnectionAttempts > 10) {
            console.error('[SOCKET] 🚨 Multiple connection failures detected');
            showConnectionError();
        }
    }
    
    function handleConnectTimeout() {
        console.error('[SOCKET] ⏱️ Connection timeout');
        updateConnectionStatus('timeout');
    }
    
    // ==================== RECONNECTION HANDLERS ====================
    
    function handleReconnect(attemptNumber) {
        console.log('[SOCKET] 🔄 RECONNECTED after', attemptNumber, 'attempts');
        
        reconnectionAttempts = 0;
        updateConnectionStatus('reconnected');
        
        safeExecute(() => {
            if (window.ContactsManager) {
                console.log('[SOCKET] 📇 Reloading contacts after reconnection');
                window.ContactsManager.loadContacts();
            }
        }, 'Reload contacts on reconnect');
        
        safeExecute(() => {
            if (window.currentChatUser && window.MessagingManager) {
                console.log('[SOCKET] 💬 Reloading messages for current chat');
                window.MessagingManager.loadMessages(window.currentChatUser.id);
            }
        }, 'Reload messages on reconnect');
        
        flushMessageQueue();
        showNotification('Connection restored', 'success');
    }
    
    function handleReconnectAttempt(attemptNumber) {
        console.log('[SOCKET] 🔄 Reconnection attempt #' + attemptNumber);
        
        if (attemptNumber === 1) {
            updateConnectionStatus('reconnecting');
            showNotification('Reconnecting...', 'info');
        }
        
        if (attemptNumber % 5 === 0) {
            console.warn('[SOCKET] ⚠️ Still reconnecting... Attempt #' + attemptNumber);
        }
    }
    
    function handleReconnectError(error) {
        console.error('[SOCKET] ❌ Reconnection error:', error);
        logError('Reconnection error', error);
    }
    
    function handleReconnectFailed() {
        console.error('[SOCKET] 🚨 CRITICAL: Reconnection failed completely');
        updateConnectionStatus('failed');
        
        showCriticalError(
            'Connection Lost',
            'Unable to reconnect to server. Please check your internet connection and refresh the page.',
            () => window.location.reload()
        );
    }
    
    function handlePong(latency) {
        console.log('[SOCKET] 🏓 Pong received - Latency:', latency, 'ms');
        
        if (latency > 1000) {
            console.warn('[SOCKET] ⚠️ High latency detected:', latency, 'ms');
        }
    }
    
    // ==================== MESSAGE QUEUE ====================
    
    function queueMessage(message) {
        console.log('[QUEUE] 📥 Adding message to queue:', message.id || 'pending');
        
        messageQueue.push({
            message: message,
            timestamp: Date.now(),
            retries: 0
        });
        
        if (messageQueue.length > 100) {
            console.warn('[QUEUE] ⚠️ Queue size exceeds 100 messages');
        }
    }
    
    function flushMessageQueue() {
        if (messageQueue.length === 0) return;
        
        console.log('[QUEUE] 📤 Flushing', messageQueue.length, 'queued messages');
        
        const queue = [...messageQueue];
        messageQueue = [];
        
        queue.forEach((item, index) => {
            setTimeout(() => {
                safeExecute(() => {
                    if (window.MessagingManager?.addMessage) {
                        window.MessagingManager.addMessage(item.message);
                        console.log('[QUEUE] ✅ Flushed message', index + 1, 'of', queue.length);
                    }
                }, 'Flush queued message');
            }, index * 100);
        });
    }
    
    // ==================== MESSAGE BUFFER ====================
    
    function cleanMessageBuffer() {
        const now = Date.now();
        const maxAge = 60000;
        
        for (const [id, entry] of messageBuffer.entries()) {
            if (now - entry.receivedAt > maxAge) {
                messageBuffer.delete(id);
            }
        }
        
        if (messageBuffer.size > CONFIG.BUFFER_SIZE) {
            const entries = Array.from(messageBuffer.entries());
            const toDelete = entries.slice(0, entries.length - CONFIG.BUFFER_SIZE);
            toDelete.forEach(([id]) => messageBuffer.delete(id));
            
            console.log('[BUFFER] 🧹 Cleaned', toDelete.length, 'old entries');
        }
    }
    
    function resumeMessageBuffer() {
        console.log('[BUFFER] 🔄 Resuming message buffer with', messageBuffer.size, 'entries');
    }
    
    // ==================== HEARTBEAT ====================
    
    function startHeartbeat() {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        
        heartbeatInterval = setInterval(() => {
            if (socket && socket.connected) {
                socket.emit('ping', Date.now());
            }
        }, CONFIG.HEARTBEAT_INTERVAL);
        
        console.log('[HEARTBEAT] 💓 Started with interval:', CONFIG.HEARTBEAT_INTERVAL, 'ms');
    }
    
    function stopHeartbeat() {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
            console.log('[HEARTBEAT] 🛑 Stopped');
        }
    }
    
    // ==================== CONNECTION MONITOR ====================
    
    function startConnectionMonitor() {
        if (connectionMonitor) clearInterval(connectionMonitor);
        
        connectionMonitor = setInterval(() => {
            if (!socket || !socket.connected) {
                console.warn('[MONITOR] ⚠️ Connection lost - attempting reconnect');
                
                if (socket) {
                    socket.connect();
                } else {
                    console.error('[MONITOR] 🚨 Socket instance lost - reinitializing');
                    initSocket();
                }
            }
        }, CONFIG.CONNECTION_CHECK_INTERVAL);
        
        console.log('[MONITOR] 👀 Started connection monitoring');
    }
    
    function stopConnectionMonitor() {
        if (connectionMonitor) {
            clearInterval(connectionMonitor);
            connectionMonitor = null;
            console.log('[MONITOR] 🛑 Stopped');
        }
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    
    function safeExecute(fn, description, onError) {
        try {
            return fn();
        } catch (error) {
            console.error(`[SOCKET] ❌ Error in ${description}:`, error);
            logError(description, error);
            
            if (onError && typeof onError === 'function') {
                try {
                    onError(error);
                } catch (fallbackError) {
                    console.error('[SOCKET] ❌ Fallback error handler failed:', fallbackError);
                }
            }
            
            return null;
        }
    }
    
    function validateMessage(message) {
        if (!message || typeof message !== 'object') {
            console.error('[VALIDATION] ❌ Message is not an object');
            return false;
        }
        
        const required = ['id', 'sender_id', 'receiver_id', 'timestamp'];
        const missing = required.filter(field => !message[field]);
        
        if (missing.length > 0) {
            console.error('[VALIDATION] ❌ Missing required fields:', missing);
            return false;
        }
        
        return true;
    }
    
    function sendMessageAck(messageId) {
        if (socket && socket.connected) {
            socket.emit('message_received', { message_id: messageId });
            console.log('[ACK] ✓ Sent acknowledgment for message:', messageId);
        }
    }
    
    function updateConnectionStatus(status) {
        console.log('[STATUS] 📡 Connection status:', status);
        
        const statusMap = {
            'connected': { color: '#00d9a5', text: 'Connected', icon: '🟢' },
            'disconnected': { color: '#dc2626', text: 'Disconnected', icon: '🔴' },
            'reconnecting': { color: '#f59e0b', text: 'Reconnecting...', icon: '🟡' },
            'reconnected': { color: '#00d9a5', text: 'Reconnected', icon: '✅' },
            'error': { color: '#dc2626', text: 'Connection Error', icon: '❌' },
            'timeout': { color: '#f59e0b', text: 'Connection Timeout', icon: '⏱️' },
            'failed': { color: '#dc2626', text: 'Connection Failed', icon: '🚨' }
        };
        
        const info = statusMap[status] || statusMap['error'];
        
        const statusEl = document.getElementById('connection-status');
        if (statusEl) {
            statusEl.textContent = info.icon + ' ' + info.text;
            statusEl.style.color = info.color;
        }
        
        window.dispatchEvent(new CustomEvent('socketStatusChange', { 
            detail: { status, ...info } 
        }));
    }
    
    function showNotification(message, type = 'info') {
        console.log(`[NOTIFICATION] ${type.toUpperCase()}:`, message);
        
        if (window.NotificationManager?.show) {
            window.NotificationManager.show(message, type);
        }
    }
    
    function showConnectionError() {
        const message = 'Connection issues detected. Some messages may be delayed.';
        showNotification(message, 'warning');
    }
    
    function showCriticalError(title, message, actionCallback) {
        console.error('[CRITICAL]', title, '-', message);
        
        if (window.ModalManager?.showError) {
            window.ModalManager.showError(title, message, actionCallback);
        } else {
            if (confirm(`${title}\n\n${message}\n\nClick OK to reload.`)) {
                if (actionCallback) actionCallback();
            }
        }
    }
    
    function handleCriticalError(description, error) {
        console.error('[CRITICAL] 🚨', description, ':', error);
        logError(description, error, true);
        
        showCriticalError(
            'Critical Error',
            `${description}. The application may not function correctly. Please refresh the page.`,
            () => window.location.reload()
        );
    }
    
    function logError(description, error, isCritical = false) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            description: description,
            error: {
                message: error?.message || String(error),
                stack: error?.stack,
                type: error?.constructor?.name
            },
            critical: isCritical,
            socketId: socket?.id,
            connected: socket?.connected,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        console.error('[ERROR LOG]', JSON.stringify(errorLog, null, 2));
        
        if (navigator.sendBeacon) {
            try {
                navigator.sendBeacon('/api/log-error', JSON.stringify(errorLog));
            } catch (e) {
                console.error('[ERROR LOG] Failed to send error log:', e);
            }
        }
    }
    
    // ==================== PUBLIC API ====================
    
    function getSocket() {
        return socket;
    }
    
    function disconnect() {
        console.log('[SOCKET] 🔌 Disconnecting...');
        
        stopHeartbeat();
        stopConnectionMonitor();
        
        if (socket) {
            socket.disconnect();
            socket = null;
            window.socket = null;
            console.log('[SOCKET] ✅ Disconnected cleanly');
        }
    }
    
    function isConnected() {
        return socket && socket.connected;
    }
    
    function getConnectionInfo() {
        if (!socket) return null;
        
        return {
            connected: socket.connected,
            id: socket.id,
            transport: socket.io?.engine?.transport?.name,
            reconnectionAttempts: reconnectionAttempts,
            queueSize: messageQueue.length,
            bufferSize: messageBuffer.size,
            pendingAcks: pendingAcks.size
        };
    }
    
    function getHealthStatus() {
        return {
            socket: {
                initialized: socket !== null,
                connected: socket?.connected || false,
                id: socket?.id || null,
                transport: socket?.io?.engine?.transport?.name || null
            },
            queue: {
                size: messageQueue.length,
                maxSize: 100
            },
            buffer: {
                size: messageBuffer.size,
                maxSize: CONFIG.BUFFER_SIZE
            },
            reconnection: {
                attempts: reconnectionAttempts,
                maxAttempts: CONFIG.RECONNECTION_ATTEMPTS
            },
            monitoring: {
                heartbeat: heartbeatInterval !== null,
                connectionMonitor: connectionMonitor !== null
            }
        };
    }
    
    // ==================== EXPOSE TO WINDOW ====================
    
    window.SocketManager = {
        init: initSocket,
        getSocket: getSocket,
        disconnect: disconnect,
        isConnected: isConnected,
        getConnectionInfo: getConnectionInfo,
        getHealthStatus: getHealthStatus
    };
    
    console.log('✅ [SocketManager] Enterprise-grade module loaded');
    console.log('📊 [SocketManager] Health check available via: window.SocketManager.getHealthStatus()');
    
})();
