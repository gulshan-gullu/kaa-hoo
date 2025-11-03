// ==========================================
// 💬 ENTERPRISE MESSAGING MANAGER
// Text message sending/receiving ONLY
// WhatsApp-grade reliability
// ==========================================

(function() {
    'use strict';
    
    // ==========================================
    // 📊 CONFIGURATION & STATE
    // ==========================================
    
    const CONFIG = {
        SEND_THROTTLE: 100,           // 100ms between messages
        MAX_RETRIES: 3,               // Retry failed sends 3 times
        RETRY_DELAY: 1000,            // 1 second between retries
        OFFLINE_QUEUE_MAX: 100,       // Max messages to queue offline
        MESSAGE_TIMEOUT: 30000,       // 30s timeout for API calls
        DUPLICATE_WINDOW: 5000        // 5s window for duplicate detection
    };
    
    let sendInProgress = false;
    let lastSendTime = 0;
    let offlineQueue = loadOfflineQueue();
    let messageCache = new Map(); // Prevent duplicates
    
    // ==========================================
    // 🔍 UTILITY FUNCTIONS
    // ==========================================
    
    function generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    function isOnline() {
        return navigator.onLine;
    }
    
    function isDuplicateMessage(messageId) {
        if (messageCache.has(messageId)) {
            const timestamp = messageCache.get(messageId);
            if (Date.now() - timestamp < CONFIG.DUPLICATE_WINDOW) {
                console.warn('[MESSAGING] ⚠️ Duplicate message blocked:', messageId);
                return true;
            }
            messageCache.delete(messageId);
        }
        return false;
    }
    
    function cacheMessage(messageId) {
        messageCache.set(messageId, Date.now());
        // Clean old entries
        if (messageCache.size > 1000) {
            const oldestKey = messageCache.keys().next().value;
            messageCache.delete(oldestKey);
        }
    }
    
    function sanitizeMessage(text) {
        if (!text) return '';
        // Use DOM API to properly escape HTML - prevents ALL XSS attacks
        const tempDiv = document.createElement('div');
        tempDiv.textContent = text;
        return tempDiv.innerHTML
                   .trim()
                   .substring(0, 10000); // Max 10k chars
    }
    
    // ==========================================
    // 💾 OFFLINE QUEUE (PERSISTENT)
    // ==========================================
    
    function saveOfflineQueue() {
        try {
            localStorage.setItem('offlineMessageQueue', JSON.stringify(offlineQueue));
            console.log('[OFFLINE] ✅ Queue saved to localStorage');
        } catch (error) {
            console.error('[OFFLINE] ❌ Failed to save queue:', error);
        }
    }
    
    function loadOfflineQueue() {
        try {
            const storedQueue = localStorage.getItem('offlineMessageQueue');
            if (storedQueue) {
                const queue = JSON.parse(storedQueue);
                console.log(`[OFFLINE] 📥 Loaded ${queue.length} queued messages`);
                return queue;
            }
            return [];
        } catch (error) {
            console.error('[OFFLINE] ❌ Failed to load queue:', error);
            return [];
        }
    }
    
    function addToOfflineQueue(message) {
        if (offlineQueue.length >= CONFIG.OFFLINE_QUEUE_MAX) {
            console.warn('[OFFLINE] Queue full, removing oldest message');
            offlineQueue.shift();
        }
        
        offlineQueue.push({
            ...message,
            queuedAt: Date.now(),
            tempId: generateMessageId()
        });
        
        console.log(`[OFFLINE] 📴 Added to queue (${offlineQueue.length} pending)`);
        saveOfflineQueue();
    }
    
    async function processOfflineQueue() {
        if (offlineQueue.length === 0 || !isOnline()) {
            return;
        }
        
        console.log(`[OFFLINE] 🔄 Processing ${offlineQueue.length} queued messages...`);
        
        const queue = [...offlineQueue];
        offlineQueue = [];
        saveOfflineQueue();
        
        for (const queuedMsg of queue) {
            try {
                await doSendMessage(queuedMsg.text, queuedMsg.tempId);
                console.log('[OFFLINE] ✅ Sent queued message');
                saveOfflineQueue();
            } catch (error) {
                console.error('[OFFLINE] ❌ Failed to send queued message:', error);
                addToOfflineQueue(queuedMsg);
            }
        }
    }
    
    // ==========================================
    // 📡 API WRAPPER WITH RETRY & TIMEOUT
    // ==========================================
    
    async function fetchWithTimeout(url, options = {}, timeout = CONFIG.MESSAGE_TIMEOUT) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }
    
    async function apiCallWithRetry(url, options, maxRetries = CONFIG.MAX_RETRIES) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[API] 🔄 Attempt ${attempt}/${maxRetries}: ${url}`);
                
                const response = await fetchWithTimeout(url, options);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (!data.success && data.error) {
                    throw new Error(data.error);
                }
                
                console.log(`[API] ✅ Success on attempt ${attempt}`);
                return data;
                
            } catch (error) {
                lastError = error;
                console.error(`[API] ❌ Attempt ${attempt} failed:`, error.message);
                
                // Don't retry on client errors (4xx)
                if (error.message.includes('HTTP 4')) {
                    console.log('[API] Client error - not retrying');
                    throw error;
                }
                
                // Wait before retry (exponential backoff)
                if (attempt < maxRetries) {
                    const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
                    console.log(`[API] ⏳ Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
    }
    
    // ==========================================
    // 📥 LOAD MESSAGES
    // ==========================================
    
    async function loadMessages(contactId) {
        try {
            console.log(`[MESSAGES] 📥 Loading messages for contact: ${contactId}`);
            
            const data = await apiCallWithRetry(
                `/api/messages/${contactId}`,
                { credentials: 'include' }
            );
            
            if (data.success && Array.isArray(data.messages)) {
                console.log(`[MESSAGES] ✅ Loaded ${data.messages.length} messages`);
                displayMessages(data.messages);
            } else {
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            console.error('[MESSAGES] ❌ Failed to load messages:', error);
            showError('Failed to load messages. Please refresh the page.');
        }
    }
    
    // ==========================================
    // 📺 DISPLAY MESSAGES (BATCH READ RECEIPTS)
    // ==========================================
    
    function displayMessages(messages) {
        const container = document.getElementById('chat-messages');
        if (!container) {
            console.error('[MESSAGES] ❌ Container not found');
            return;
        }
        
        if (!Array.isArray(messages)) {
            console.error('[MESSAGES] ❌ Invalid messages array');
            return;
        }
        
        if (messages.length === 0) {
            container.innerHTML = `
                <div class="empty-chat">
                    <div class="empty-chat-icon">💭</div>
                    <p>No messages yet. Start the conversation!</p>
                </div>`;
            return;
        }

        let html = '';
        let lastDate = null;
        const currentUser = window.AuthManager?.getCurrentUser();
        
        if (!currentUser) {
            console.error('[MESSAGES] ❌ No current user');
            return;
        }

        // ✅ BATCH READ RECEIPTS - Collect unread message IDs
        const unreadMessageIds = [];
        let senderId = null;

        messages.forEach(msg => {
            try {
                const msgTimestamp = msg.timestamp ? msg.timestamp.replace(' ', 'T') : new Date().toISOString();
                const msgDate = new Date(msgTimestamp).toDateString();
                
                if (msgDate !== lastDate) {
                    html += `<div class="date-divider"><span>${window.DateUtils.getDateDivider(msgTimestamp)}</span></div>`;
                    lastDate = msgDate;
                }

                const isSent = msg.sender_id === currentUser.id;
                const time = window.DateUtils.getFormattedTime(msg.timestamp);
                
                // Collect unread messages for batch processing
                if (!isSent && !msg.is_read) {
                    unreadMessageIds.push(msg.id);
                    if (!senderId) senderId = msg.sender_id;
                }
                
                let messageContent = window.HtmlUtils.escapeHtml(msg.text || '');
                let readStatus = '';
                
                if (isSent) {
                    readStatus = msg.is_read ? 
                        '<span class="read-receipt tick-read">✓✓</span>' :
                        '<span class="read-receipt tick-delivered">✓✓</span>';
                }

                // Let other modules handle voice/file rendering
                if (msg.message_type === 'voice' && msg.file_info && window.VoiceManager?.createVoiceMessageHtml) {
                    messageContent = window.VoiceManager.createVoiceMessageHtml(msg);
                } else if (msg.message_type === 'file' && msg.file_info && window.FileManager?.createFileMessageHtml) {
                    messageContent = window.FileManager.createFileMessageHtml(msg, isSent);
                }
                
                html += `
                    <div class="message ${isSent ? 'sent' : 'received'}" data-message-id="${msg.id}" data-timestamp="${msgTimestamp}">
                        <div class="message-content">
                            <div class="message-bubble">
                                ${messageContent}
                            </div>
                            <div class="message-time">
                                ${time}
                                ${readStatus}
                            </div>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('[MESSAGES] ❌ Error rendering message:', error, msg);
            }
        });

        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
        
        // ✅ ONE BATCH CALL instead of N calls
        if (unreadMessageIds.length > 0) {
            console.log(`[READ] 📨 Marking ${unreadMessageIds.length} messages as read in ONE batch`);
            markMessagesAsRead(unreadMessageIds, senderId);
        }
    }
    
    // ==========================================
    // ➕ ADD MESSAGE (DEDUPLICATION)
    // ==========================================
    
    function addMessage(message) {
        try {
            if (!message || !message.id) {
                console.error('[MESSAGING] ❌ Invalid message object:', message);
                return;
            }
            
            // Prevent duplicates
            if (isDuplicateMessage(message.id)) {
                return;
            }
            cacheMessage(message.id);
            
            console.log('[MESSAGING] 📩 Adding message:', message.id);
            
            const container = document.getElementById('chat-messages');
            if (!container) {
                console.error('[MESSAGING] ❌ Container not found');
                return;
            }
            
            const currentUser = window.AuthManager?.getCurrentUser();
            const currentChatUser = window.currentChatUser;
            
            if (!currentUser || !currentChatUser) {
                console.log('[MESSAGING] No current chat');
                return;
            }
            
            const currentUserId = currentChatUser.id || currentChatUser;
            const isForCurrentChat = 
                (message.sender_id === currentUserId && message.receiver_id === currentUser.id) ||
                (message.sender_id === currentUser.id && message.receiver_id === currentUserId);
            
            if (!isForCurrentChat) {
                console.log('[MESSAGING] Message not for current chat');
                return;
            }
            
            const emptyChat = container.querySelector('.empty-chat');
            if (emptyChat) emptyChat.remove();
            
            const isSent = message.sender_id === currentUser.id;
            const time = window.DateUtils.getFormattedTime(message.timestamp);
            const messageContent = window.HtmlUtils.escapeHtml(message.text || '');
            const msgTimestamp = message.timestamp ? message.timestamp.replace(' ', 'T') : new Date().toISOString();
            
            let readStatus = '';
            if (isSent) {
                readStatus = message.is_read ? 
                    '<span class="read-receipt tick-read">✓✓</span>' :
                    '<span class="read-receipt tick-delivered">✓✓</span>';
            }
            
            const messageHtml = `
                <div class="message ${isSent ? 'sent' : 'received'}" data-message-id="${message.id}" data-timestamp="${msgTimestamp}">
                    <div class="message-content">
                        <div class="message-bubble">
                            ${messageContent}
                        </div>
                        <div class="message-time">
                            ${time}
                            ${readStatus}
                        </div>
                    </div>
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', messageHtml);
            container.scrollTop = container.scrollHeight;
            
            if (!isSent) {
                markMessagesAsRead([message.id], message.sender_id);
                if (window.NotificationManager?.playSound) {
                    window.NotificationManager.playSound();
                }
            }
            
            console.log('[MESSAGING] ✅ Message added successfully');
            
        } catch (error) {
            console.error('[MESSAGING] ❌ Failed to add message:', error);
        }
    }
    
    // ==========================================
    // 📤 SEND MESSAGE (ROBUST)
    // ==========================================
    
    async function doSendMessage(textOverride = null, tempId = null) {
        try {
            // Prevent double-sending
            if (sendInProgress) {
                console.log('[SEND] ⏳ Already sending, skipping...');
                return { success: false, error: 'Send in progress' };
            }
            
            // Throttle rapid sends
            const now = Date.now();
            if (now - lastSendTime < CONFIG.SEND_THROTTLE) {
                const waitTime = CONFIG.SEND_THROTTLE - (now - lastSendTime);
                console.log(`[SEND] ⏳ Throttling - waiting ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            
            sendInProgress = true;
            lastSendTime = Date.now();
            
            console.log('🚀 [SEND] doSendMessage CALLED');
            
            const input = document.getElementById('chat-input');
            const text = sanitizeMessage(textOverride || input?.value);
            
            if (!text) {
                console.log('❌ [SEND] No text to send');
                sendInProgress = false;
                return { success: false, error: 'No content' };
            }
            
            if (!window.currentChatUser) {
                console.log('❌ [SEND] No chat user selected');
                showError('Please select a contact first');
                sendInProgress = false;
                return { success: false, error: 'No recipient' };
            }
            
            // Check online status
            if (!isOnline()) {
                console.log('[SEND] 📴 Offline - adding to queue');
                addToOfflineQueue({
                    text: text,
                    recipient: window.currentChatUser.id
                });
                showInfo('Message queued. Will send when online.');
                if (input) input.value = '';
                sendInProgress = false;
                return { success: true, queued: true };
            }

            if (window.TypingManager?.isTyping()) {
                window.TypingManager.stop();
            }
            
            const sendBtn = document.getElementById('send-btn');
            if (sendBtn) sendBtn.disabled = true;

            // Send text message
            console.log('💬 [SEND] Sending text message');
            
            const data = await apiCallWithRetry(
                '/api/send',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        text: text, 
                        target_user: window.currentChatUser.id,
                        temp_id: tempId
                    }),
                    credentials: 'include'
                }
            );
            
            console.log('✅ [SEND] Message sent successfully');
            if (input) input.value = '';
            
            // Add message to UI (optimistic update)
            if (data.message) {
                addMessage({
                    id: data.message.id,
                    sender_id: data.message.sender_id,
                    receiver_id: data.message.receiver_id,
                    text: data.message.text,
                    message_type: data.message.message_type || 'text',
                    timestamp: data.message.timestamp,
                    is_read: false
                });
            }
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ [SEND] Error:', error);
            showError(`Failed to send: ${error.message}`);
            return { success: false, error: error.message };
        } finally {
            sendInProgress = false;
            const sendBtn = document.getElementById('send-btn');
            if (sendBtn) sendBtn.disabled = false;
            const input = document.getElementById('chat-input');
            if (input) input.focus();
        }
    }
    
    // ==========================================
    // ✅ READ RECEIPTS (BATCH)
    // ==========================================
    
    async function markMessagesAsRead(messageIds, senderId) {
        if (!messageIds || messageIds.length === 0) return;
        
        try {
            await fetchWithTimeout('/api/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message_ids: messageIds,
                    sender_id: senderId
                }),
                credentials: 'include'
            }, 5000); // 5s timeout for read receipts
            
            console.log(`[READ] ✅ Marked ${messageIds.length} messages as read`);
        } catch (error) {
            console.error('[READ] ❌ Error marking as read:', error);
            // Don't show error to user - non-critical
        }
    }
    
    // ==========================================
    // 🔔 USER NOTIFICATIONS
    // ==========================================
    
    function showError(message) {
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            console.error('[UI]', message);
        }
    }
    
    function showInfo(message) {
        if (window.showNotification) {
            window.showNotification(message, 'info');
        } else {
            console.log('[UI]', message);
        }
    }
    
    // ==========================================
    // 🌐 ONLINE/OFFLINE HANDLERS
    // ==========================================
    
    window.addEventListener('online', () => {
        console.log('[NETWORK] 🟢 Back online');
        showInfo('Connection restored');
        processOfflineQueue();
    });
    
    window.addEventListener('offline', () => {
        console.log('[NETWORK] 🔴 Offline');
        showInfo('No internet connection');
    });
    
    // ==========================================
    // 📤 EXPORT API
    // ==========================================
    
    window.MessagingManager = {
        loadMessages,
        displayMessages,
        addMessage,
        sendMessage: doSendMessage,
        markMessagesAsRead,
        isOnline,
        getQueueSize: () => offlineQueue.length,
        clearCache: () => messageCache.clear(),
        processOfflineQueue
    };
    
    console.log('✅ [MessagingManager] Enterprise module loaded');
    console.log(`📊 Config: ${CONFIG.MAX_RETRIES} retries, ${CONFIG.MESSAGE_TIMEOUT}ms timeout`);
    console.log(`📴 Offline queue: ${offlineQueue.length} pending messages`);
    
    // Try to send queued messages on load
    if (offlineQueue.length > 0 && isOnline()) {
        setTimeout(() => processOfflineQueue(), 2000);
    }
    
})();