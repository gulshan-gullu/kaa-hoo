// ========================================
// ⏰ SCHEDULED MESSAGES MODULE
// ========================================

(function() {
    'use strict';
    
    console.log('⏰ [SCHEDULED-MESSAGES] Module loading...');
    
    let scheduledMessages = JSON.parse(localStorage.getItem('scheduled_messages') || '[]');
    let checkInterval;
    
    // Create scheduled message modal
    function createScheduledMessageModal() {
        const modalHTML = `
            <div id="scheduled-message-modal" class="scheduled-message-modal" style="display: none;">
                <div class="scheduled-modal-overlay" onclick="window.closeScheduledMessageModal()"></div>
                <div class="scheduled-modal-container">
                    <div class="scheduled-modal-header">
                        <h3>⏰ Schedule Message</h3>
                        <button class="scheduled-modal-close" onclick="window.closeScheduledMessageModal()">✕</button>
                    </div>
                    
                    <div class="scheduled-modal-content">
                        <div class="scheduled-form-group">
                            <label>📝 Message</label>
                            <textarea id="scheduled-message-text" placeholder="Type your message..." rows="4"></textarea>
                        </div>
                        
                        <div class="scheduled-form-row">
                            <div class="scheduled-form-group">
                                <label>📅 Date</label>
                                <input type="date" id="scheduled-date" min="${getTodayDate()}">
                            </div>
                            
                            <div class="scheduled-form-group">
                                <label>🕐 Time</label>
                                <input type="time" id="scheduled-time">
                            </div>
                        </div>
                        
                        <div class="scheduled-quick-options">
                            <div class="scheduled-quick-label">Quick Schedule:</div>
                            <button class="scheduled-quick-btn" onclick="window.setQuickSchedule(30)">30 min</button>
                            <button class="scheduled-quick-btn" onclick="window.setQuickSchedule(60)">1 hour</button>
                            <button class="scheduled-quick-btn" onclick="window.setQuickSchedule(180)">3 hours</button>
                            <button class="scheduled-quick-btn" onclick="window.setQuickSchedule(1440)">Tomorrow</button>
                        </div>
                        
                        <div class="scheduled-preview" id="scheduled-preview" style="display: none;">
                            <div class="scheduled-preview-icon">⏰</div>
                            <div class="scheduled-preview-text">
                                <strong>Will be sent:</strong>
                                <span id="scheduled-preview-time"></span>
                            </div>
                        </div>
                        
                        <div class="scheduled-modal-actions">
                            <button class="scheduled-cancel-btn" onclick="window.closeScheduledMessageModal()">Cancel</button>
                            <button class="scheduled-send-btn" id="scheduled-send-btn" onclick="window.scheduleMessage()">Schedule</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        attachScheduledEvents();
    }
    
    // Get today's date in YYYY-MM-DD format
    function getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }
    
    // Attach scheduled message events
    function attachScheduledEvents() {
        const dateInput = document.getElementById('scheduled-date');
        const timeInput = document.getElementById('scheduled-time');
        const messageInput = document.getElementById('scheduled-message-text');
        
        // Update preview when date/time changes
        [dateInput, timeInput].forEach(input => {
            input.addEventListener('change', updateScheduledPreview);
        });
        
        // Enable/disable send button
        messageInput.addEventListener('input', () => {
            const sendBtn = document.getElementById('scheduled-send-btn');
            sendBtn.disabled = messageInput.value.trim().length === 0;
        });
        
        // Set default time to 1 hour from now
        const now = new Date();
        now.setHours(now.getHours() + 1);
        timeInput.value = now.toTimeString().substring(0, 5);
        dateInput.value = getTodayDate();
        updateScheduledPreview();
    }
    
    // Update scheduled preview
    function updateScheduledPreview() {
        const dateInput = document.getElementById('scheduled-date');
        const timeInput = document.getElementById('scheduled-time');
        const preview = document.getElementById('scheduled-preview');
        const previewTime = document.getElementById('scheduled-preview-time');
        
        if (dateInput.value && timeInput.value) {
            const scheduled = new Date(`${dateInput.value}T${timeInput.value}`);
            const now = new Date();
            
            if (scheduled <= now) {
                previewTime.textContent = '⚠️ Please select a future date and time';
                previewTime.style.color = '#dc2626';
            } else {
                const timeUntil = getTimeUntil(scheduled);
                previewTime.textContent = `${scheduled.toLocaleString()} (${timeUntil})`;
                previewTime.style.color = '#25d366';
            }
            
            preview.style.display = 'flex';
        } else {
            preview.style.display = 'none';
        }
    }
    
    // Get time until scheduled
    function getTimeUntil(scheduledDate) {
        const now = new Date();
        const diff = scheduledDate - now;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
        return 'in less than a minute';
    }
    
    // Set quick schedule
    window.setQuickSchedule = function(minutes) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + minutes);
        
        document.getElementById('scheduled-date').value = now.toISOString().split('T')[0];
        document.getElementById('scheduled-time').value = now.toTimeString().substring(0, 5);
        
        updateScheduledPreview();
    };
    
    // Schedule message
    window.scheduleMessage = function() {
        const messageText = document.getElementById('scheduled-message-text').value.trim();
        const date = document.getElementById('scheduled-date').value;
        const time = document.getElementById('scheduled-time').value;
        
        if (!messageText || !date || !time) {
            alert('⚠️ Please fill in all fields');
            return;
        }
        
        if (!window.currentChatUser) {
            alert('⚠️ Please select a contact first');
            return;
        }
        
        const scheduledTime = new Date(`${date}T${time}`);
        const now = new Date();
        
        if (scheduledTime <= now) {
            alert('⚠️ Please select a future date and time');
            return;
        }
        
        const scheduledMsg = {
            id: Date.now() + Math.random(),
            message: messageText,
            recipient: window.currentChatUser,
            recipientName: window.currentChatUser, // You can get actual name
            scheduledTime: scheduledTime.getTime(),
            createdAt: Date.now(),
            status: 'pending'
        };
        
        scheduledMessages.push(scheduledMsg);
        saveScheduledMessages();
        
        console.log('⏰ [SCHEDULED-MESSAGES] Message scheduled:', scheduledMsg);
        
        // Show success message
        showNotification(`✅ Message scheduled for ${scheduledTime.toLocaleString()}`);
        
        // Close modal and reset
        window.closeScheduledMessageModal();
        
        // Update scheduled messages list
        updateScheduledMessagesList();
    };
    
    // Save scheduled messages
    function saveScheduledMessages() {
        localStorage.setItem('scheduled_messages', JSON.stringify(scheduledMessages));
    }
    
    // Open/close modal
    window.openScheduledMessageModal = function() {
        if (!window.currentChatUser) {
            alert('⚠️ Please select a contact first');
            return;
        }
        
        const modal = document.getElementById('scheduled-message-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Reset form
            document.getElementById('scheduled-message-text').value = '';
            const now = new Date();
            now.setHours(now.getHours() + 1);
            document.getElementById('scheduled-time').value = now.toTimeString().substring(0, 5);
            document.getElementById('scheduled-date').value = getTodayDate();
            updateScheduledPreview();
        }
    };
    
    window.closeScheduledMessageModal = function() {
        const modal = document.getElementById('scheduled-message-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };
    
    // Check and send scheduled messages
    function checkScheduledMessages() {
        const now = Date.now();
        
        scheduledMessages.forEach((msg, index) => {
            if (msg.status === 'pending' && msg.scheduledTime <= now) {
                // Send the message
                if (window.socket) {
                    window.socket.emit('send_message', {
                        text: msg.message,
                        recipient: msg.recipient,
                        sender: window.currentUser?.id,
                        timestamp: Date.now(),
                        scheduled: true
                    });
                    
                    console.log('⏰ [SCHEDULED-MESSAGES] Sent scheduled message:', msg.id);
                    
                    // Update status
                    scheduledMessages[index].status = 'sent';
                    scheduledMessages[index].sentAt = now;
                    saveScheduledMessages();
                    
                    // Show notification
                    showNotification(`✅ Scheduled message sent to ${msg.recipientName}`);
                    
                    // Update list
                    updateScheduledMessagesList();
                }
            }
        });
        
        // Remove old sent messages (older than 7 days)
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        scheduledMessages = scheduledMessages.filter(msg => {
            return msg.status === 'pending' || (msg.status === 'sent' && msg.sentAt > sevenDaysAgo);
        });
        saveScheduledMessages();
    }
    
    // Create scheduled messages list modal
    function createScheduledMessagesListModal() {
        const modalHTML = `
            <div id="scheduled-messages-list-modal" class="scheduled-list-modal" style="display: none;">
                <div class="scheduled-list-overlay" onclick="window.closeScheduledMessagesList()"></div>
                <div class="scheduled-list-container">
                    <div class="scheduled-list-header">
                        <h3>⏰ Scheduled Messages</h3>
                        <button class="scheduled-list-close" onclick="window.closeScheduledMessagesList()">✕</button>
                    </div>
                    
                    <div class="scheduled-list-content" id="scheduled-messages-list-content">
                        <div class="scheduled-list-empty">
                            <div class="scheduled-list-empty-icon">⏰</div>
                            <p>No scheduled messages</p>
                            <span>Schedule messages to send later</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Update scheduled messages list
    function updateScheduledMessagesList() {
        const content = document.getElementById('scheduled-messages-list-content');
        if (!content) return;
        
        const pending = scheduledMessages.filter(msg => msg.status === 'pending');
        const sent = scheduledMessages.filter(msg => msg.status === 'sent');
        
        if (pending.length === 0 && sent.length === 0) {
            content.innerHTML = `
                <div class="scheduled-list-empty">
                    <div class="scheduled-list-empty-icon">⏰</div>
                    <p>No scheduled messages</p>
                    <span>Schedule messages to send later</span>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        // Pending messages
        if (pending.length > 0) {
            html += '<div class="scheduled-list-section"><h4>📋 Pending Messages</h4>';
            pending.forEach(msg => {
                const scheduledDate = new Date(msg.scheduledTime);
                const timeUntil = getTimeUntil(scheduledDate);
                
                html += `
                    <div class="scheduled-list-item">
                        <div class="scheduled-list-item-icon">⏰</div>
                        <div class="scheduled-list-item-content">
                            <div class="scheduled-list-item-recipient">To: ${msg.recipientName}</div>
                            <div class="scheduled-list-item-message">${msg.message}</div>
                            <div class="scheduled-list-item-time">
                                ${scheduledDate.toLocaleString()} (${timeUntil})
                            </div>
                        </div>
                        <button class="scheduled-list-item-delete" onclick="window.cancelScheduledMessage('${msg.id}')">
                            🗑️
                        </button>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // Sent messages
        if (sent.length > 0) {
            html += '<div class="scheduled-list-section"><h4>✅ Recently Sent</h4>';
            sent.forEach(msg => {
                const sentDate = new Date(msg.sentAt);
                
                html += `
                    <div class="scheduled-list-item sent">
                        <div class="scheduled-list-item-icon">✅</div>
                        <div class="scheduled-list-item-content">
                            <div class="scheduled-list-item-recipient">To: ${msg.recipientName}</div>
                            <div class="scheduled-list-item-message">${msg.message}</div>
                            <div class="scheduled-list-item-time">
                                Sent: ${sentDate.toLocaleString()}
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        content.innerHTML = html;
    }
    
    // Cancel scheduled message
    window.cancelScheduledMessage = function(msgId) {
        if (confirm('Cancel this scheduled message?')) {
            scheduledMessages = scheduledMessages.filter(msg => msg.id != msgId);
            saveScheduledMessages();
            updateScheduledMessagesList();
            showNotification('Scheduled message cancelled');
            console.log('⏰ [SCHEDULED-MESSAGES] Message cancelled:', msgId);
        }
    };
    
    // Show scheduled messages list
    window.showScheduledMessagesList = function() {
        const modal = document.getElementById('scheduled-messages-list-modal');
        if (modal) {
            modal.style.display = 'flex';
            updateScheduledMessagesList();
        }
    };
    
    window.closeScheduledMessagesList = function() {
        const modal = document.getElementById('scheduled-messages-list-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };
    
    // Show notification
    function showNotification(message) {
        // Try to use existing notification system
        if (window.showToast) {
            window.showToast(message);
        } else {
            // Fallback
            const notification = document.createElement('div');
            notification.className = 'scheduled-notification';
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(37, 211, 102, 0.95);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                z-index: 999999;
                animation: slideInRight 0.3s ease-out;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }
    
    // Add schedule button to chat input
    function addScheduleButton() {
        setTimeout(() => {
            const inputWrapper = document.querySelector('.chat-input-wrapper');
            if (inputWrapper && !document.getElementById('schedule-message-btn')) {
                const scheduleBtn = document.createElement('button');
                scheduleBtn.id = 'schedule-message-btn';
                scheduleBtn.className = 'input-icon';
                scheduleBtn.title = 'Schedule Message';
                scheduleBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                `;
                scheduleBtn.onclick = window.openScheduledMessageModal;
                
                const emojiBtn = document.getElementById('emoji-btn');
                if (emojiBtn) {
                    emojiBtn.parentNode.insertBefore(scheduleBtn, emojiBtn);
                }
            }
        }, 1500);
    }
    
    // Add menu item to header
    function addScheduledMessagesMenuItem() {
        setTimeout(() => {
            const headerButtons = document.querySelector('.header-buttons');
            if (headerButtons && !document.getElementById('scheduled-messages-menu-btn')) {
                const menuBtn = document.createElement('button');
                menuBtn.id = 'scheduled-messages-menu-btn';
                menuBtn.className = 'settings-btn';
                menuBtn.innerHTML = '⏰ Scheduled';
                menuBtn.onclick = window.showScheduledMessagesList;
                
                headerButtons.insertBefore(menuBtn, headerButtons.firstChild);
            }
        }, 1500);
    }
    
    // Initialize
    function init() {
        createScheduledMessageModal();
        createScheduledMessagesListModal();
        addScheduleButton();
        addScheduledMessagesMenuItem();
        addStyles();
        
        // Start checking every 10 seconds
        checkInterval = setInterval(checkScheduledMessages, 10000);
        
        // Check immediately
        checkScheduledMessages();
        
        console.log('✅ [SCHEDULED-MESSAGES] Module ready!');
        console.log(`📋 ${scheduledMessages.filter(m => m.status === 'pending').length} pending scheduled messages`);
    }
    
    // Add styles
    function addStyles() {
        const styles = `
            <style>
            .scheduled-message-modal,
            .scheduled-list-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 100002;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .scheduled-modal-overlay,
            .scheduled-list-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(5px);
            }
            
            .scheduled-modal-container,
            .scheduled-list-container {
                position: relative;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                background: #1f2c33;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: modalSlideUp 0.3s ease-out;
                display: flex;
                flex-direction: column;
            }
            
            @keyframes modalSlideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100px);
                }
            }
            
            .scheduled-modal-header,
            .scheduled-list-header {
                padding: 20px;
                background: rgba(0, 0, 0, 0.3);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .scheduled-modal-header h3,
            .scheduled-list-header h3 {
                margin: 0;
                color: #e9edef;
                font-size: 20px;
                font-weight: 500;
            }
            
            .scheduled-modal-close,
            .scheduled-list-close {
                background: none;
                border: none;
                color: #8696a0;
                font-size: 24px;
                cursor: pointer;
                padding: 5px 10px;
                border-radius: 50%;
                transition: all 0.2s;
            }
            
            .scheduled-modal-close:hover,
            .scheduled-list-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #e9edef;
            }
            
            .scheduled-modal-content {
                padding: 25px;
                overflow-y: auto;
            }
            
            .scheduled-form-group {
                margin-bottom: 20px;
            }
            
            .scheduled-form-group label {
                display: block;
                color: #8696a0;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 8px;
            }
            
            .scheduled-form-group input,
            .scheduled-form-group textarea {
                width: 100%;
                padding: 12px 15px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                color: #e9edef;
                font-size: 14px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                transition: all 0.2s;
            }
            
            .scheduled-form-group input:focus,
            .scheduled-form-group textarea:focus {
                outline: none;
                border-color: #25d366;
                background: rgba(0, 0, 0, 0.4);
            }
            
            .scheduled-form-group textarea {
                resize: vertical;
                min-height: 80px;
            }
            
            .scheduled-form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .scheduled-quick-options {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            
            .scheduled-quick-label {
                color: #8696a0;
                font-size: 14px;
                font-weight: 600;
            }
            
            .scheduled-quick-btn {
                background: rgba(37, 211, 102, 0.1);
                border: 1px solid rgba(37, 211, 102, 0.3);
                color: #25d366;
                padding: 6px 15px;
                border-radius: 20px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .scheduled-quick-btn:hover {
                background: rgba(37, 211, 102, 0.2);
                transform: translateY(-2px);
            }
            
            .scheduled-preview {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 15px;
                background: rgba(37, 211, 102, 0.1);
                border: 1px solid rgba(37, 211, 102, 0.3);
                border-radius: 12px;
                margin-bottom: 20px;
            }
            
            .scheduled-preview-icon {
                font-size: 24px;
            }
            
            .scheduled-preview-text {
                flex: 1;
                color: #e9edef;
                font-size: 14px;
            }
            
            .scheduled-preview-text strong {
                display: block;
                margin-bottom: 4px;
                color: #8696a0;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .scheduled-modal-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            
            .scheduled-cancel-btn,
            .scheduled-send-btn {
                padding: 12px 30px;
                border: none;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .scheduled-cancel-btn {
                background: rgba(255, 255, 255, 0.1);
                color: #e9edef;
            }
            
            .scheduled-cancel-btn:hover {
                background: rgba(255, 255, 255, 0.15);
            }
            
            .scheduled-send-btn {
                background: linear-gradient(135deg, #25d366 0%, #20bd5f 100%);
                color: white;
                box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
            }
            
            .scheduled-send-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
            }
            
            .scheduled-send-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            /* Scheduled Messages List */
            .scheduled-list-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .scheduled-list-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
                text-align: center;
            }
            
            .scheduled-list-empty-icon {
                font-size: 64px;
                opacity: 0.3;
                margin-bottom: 20px;
            }
            
            .scheduled-list-empty p {
                color: #e9edef;
                font-size: 18px;
                margin-bottom: 8px;
            }
            
            .scheduled-list-empty span {
                color: #8696a0;
                font-size: 14px;
            }
            
            .scheduled-list-section {
                margin-bottom: 30px;
            }
            
            .scheduled-list-section h4 {
                color: #8696a0;
                font-size: 13px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 0 0 15px 0;
            }
            
            .scheduled-list-item {
                display: flex;
                align-items: flex-start;
                gap: 15px;
                padding: 15px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 12px;
                margin-bottom: 10px;
                transition: all 0.2s;
            }
            
            .scheduled-list-item:hover {
                background: rgba(255, 255, 255, 0.07);
            }
            
            .scheduled-list-item.sent {
                opacity: 0.7;
            }
            
            .scheduled-list-item-icon {
                font-size: 24px;
                flex-shrink: 0;
            }
            
            .scheduled-list-item-content {
                flex: 1;
                min-width: 0;
            }
            
            .scheduled-list-item-recipient {
                color: #25d366;
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 5px;
            }
            
            .scheduled-list-item-message {
                color: #e9edef;
                font-size: 14px;
                margin-bottom: 8px;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            
            .scheduled-list-item-time {
                color: #8696a0;
                font-size: 12px;
            }
            
            .scheduled-list-item-delete {
                background: rgba(220, 38, 38, 0.2);
                border: none;
                color: #dc2626;
                font-size: 18px;
                padding: 8px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                flex-shrink: 0;
            }
            
            .scheduled-list-item-delete:hover {
                background: rgba(220, 38, 38, 0.3);
                transform: scale(1.1);
            }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (checkInterval) {
            clearInterval(checkInterval);
        }
    });
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();