// ==========================================
// 👥 CONTACTS MANAGER - WHATSAPP STYLE
// ==========================================

(function() {
    'use strict';
    
    let allContacts = [];
    let userProfiles = {};
    
    function loadUserProfiles() {
        const savedProfiles = localStorage.getItem('userProfiles');
        if (savedProfiles) {
            userProfiles = JSON.parse(savedProfiles);
        }
    }
    
    function uploadProfilePic(input) {
        const file = input.files[0];
        const currentUser = window.AuthManager.getCurrentUser();
        
        if (file && file.type.startsWith('image/') && currentUser) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64 = e.target.result;
                userProfiles[currentUser.id] = base64;
                localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
                displayContacts();
                window.ModalManager.showSuccess('Profile picture updated!');
            };
            reader.readAsDataURL(file);
        }
    }
    
    async function loadContacts() {
        if (!window.AuthManager.ensureLoggedIn()) return;
        
        try {
            const response = await fetch('/api/contacts', {
                credentials: 'include'
            });
            
            if (response.status === 401) {
                window.AuthManager.handle401();
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                allContacts = data.contacts;
                window.allContacts = data.contacts;
                displayContacts();
                updateOnlineCount();
            }
        } catch (error) {
            console.error('[CONTACTS] Error:', error);
        }
    }
    
    function formatMessageTime(timestamp) {
        if (!timestamp) return '';
        
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffMs = now - messageTime;
        const diffDays = Math.floor(diffMs / 86400000);
        
        // Today - show time
        if (diffDays === 0) {
            return messageTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        }
        
        // Yesterday
        if (diffDays === 1) {
            return 'Yesterday';
        }
        
        // This week - show day name
        if (diffDays < 7) {
            return messageTime.toLocaleDateString('en-US', { weekday: 'short' });
        }
        
        // Older - show date
        return messageTime.toLocaleDateString('en-US', { 
            day: 'numeric', 
            month: 'short' 
        });
    }
    
    function displayContacts(contactsToDisplay = null) {
        const contactsList = document.getElementById('contacts-list');
        if (!contactsList) return;
        
        const contacts = contactsToDisplay || allContacts;
        
        if (!contacts || contacts.length === 0) {
            contactsList.innerHTML = '<div class="no-contacts">No contacts available</div>';
            return;
        }
        
        // Sort by: 1. Pinned first, 2. Last message time, 3. Name
        const sortedContacts = [...contacts].sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            
            if (a.last_message_time && b.last_message_time) {
                return new Date(b.last_message_time) - new Date(a.last_message_time);
            }
            if (a.last_message_time) return -1;
            if (b.last_message_time) return 1;
            
            return (a.name || '').localeCompare(b.name || '');
        });
        
        contactsList.innerHTML = sortedContacts.map(contact => {
            const initial = (contact.name || '?').charAt(0).toUpperCase();
            const isOnline = contact.online || false;
            const unreadCount = contact.unread_count || 0;
            const lastMessage = contact.last_message_text || 'No messages yet';
            const lastMessageTime = contact.last_message_time ? formatMessageTime(contact.last_message_time) : '';
            const isPinned = contact.is_pinned || false;
            
            // Truncate last message (WhatsApp style)
            const truncatedMessage = lastMessage.length > 35 ? lastMessage.substring(0, 35) + '...' : lastMessage;
            
            const profilePic = userProfiles[contact.id];
            const currentChatUser = window.currentChatUser;
            
            return `
                <div class="contact-item ${currentChatUser && currentChatUser.id === contact.id ? 'active' : ''}" 
                     data-contact-id="${contact.id}"
                     onclick="window.ContactsManager.selectContact('${contact.id}')">
                    <div class="contact-avatar" style="${!profilePic ? `background: ${window.HtmlUtils.getColor(contact.id)};` : ''}">
                        ${profilePic ? 
                            `<img src="${profilePic}" alt="${contact.name}">` : 
                            `<span class="avatar-initial">${initial}</span>`
                        }
                        ${isOnline ? '<span class="online-dot"></span>' : ''}
                    </div>
                    
                    <div class="contact-info">
                        <div class="contact-header">
                            <h4 class="contact-name">
                                ${isPinned ? '<i class="fas fa-thumbtack pin-icon"></i> ' : ''}
                                ${contact.name || 'Unknown'}
                            </h4>
                            <span class="message-time">${lastMessageTime}</span>
                        </div>
                        
                        <div class="contact-footer">
                            <p class="last-message">${truncatedMessage}</p>
                            ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        updateOnlineCount();
    }
    
    function updateOnlineCount() {
        const onlineUsersCount = document.getElementById('online-users-count');
        if (onlineUsersCount) {
            const onlineCount = allContacts.filter(c => c.online).length;
            onlineUsersCount.textContent = onlineCount + 1;
        }
    }
    
    function selectContact(contactId, element) {
        const contact = allContacts.find(c => c.id === contactId);
        if (!contact) return;

        const currentChatUser = window.currentChatUser;
        
        if (currentChatUser && currentChatUser.id === contactId) {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) chatInput.focus();
            return;
        }

        if (currentChatUser && window.TypingManager && window.TypingManager.isTyping()) {
            window.TypingManager.stop();
        }

        document.querySelectorAll('.contact-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (!element) {
            element = document.querySelector(`.contact-item[data-contact-id="${contactId}"]`);
        }
        if (element) element.classList.add('active');

        window.currentChatUser = contact;
        contact.unread_count = 0;
        
        const profilePic = userProfiles[contact.id];
        const chatAvatar = document.getElementById('chat-avatar');
        if (chatAvatar) {
            if (profilePic) {
                chatAvatar.innerHTML = `<img src="${profilePic}" class="profile-pic" alt="${contact.name}">`;
                chatAvatar.style.background = 'none';
            } else {
                chatAvatar.textContent = contact.name.charAt(0).toUpperCase();
                chatAvatar.style.backgroundColor = window.HtmlUtils.getColor(contact.id);
            }
        }
        
        const welcomeScreen = document.getElementById('welcome-screen');
        const chatArea = document.getElementById('chat-area');
        
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        if (chatArea) chatArea.classList.remove('chat-area-hidden');
        
        const chatUserName = document.getElementById('chat-user-name');
        if (chatUserName) chatUserName.textContent = contact.name;
        
        const statusEl = document.getElementById('chat-user-status');
        if (statusEl) {
            statusEl.textContent = contact.online ? 'Online' : 'Offline';
            statusEl.className = `status-text ${contact.online ? 'online' : 'offline'}`;
        }
        
        const typingIndicator = document.getElementById('typing-indicator');
        const searchResults = document.getElementById('search-results');
        const searchInput = document.getElementById('search-input');
        
        if (typingIndicator) typingIndicator.style.display = 'none';
        if (searchResults) searchResults.style.display = 'none';
        if (searchInput) searchInput.value = '';

        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Loading messages...</div>';
        }
        
        if (window.MessagingManager) {
            window.MessagingManager.loadMessages(contactId);
        }
        
        const inputField = document.getElementById('chat-input');
        if (inputField) {
            inputField.value = '';
            inputField.placeholder = `Message ${contact.name}...`;
            inputField.focus();
        }
        
        displayContacts();
    }
    
    function updateUserStatus(userId, isOnline) {
        console.log(`[STATUS] Updating ${userId} to ${isOnline ? 'online' : 'offline'}`);
        
        const contact = allContacts.find(c => c.id === userId);
        if (contact) {
            const wasOnline = contact.online;
            contact.online = isOnline;
            
            console.log(`[STATUS] Contact ${userId} status changed: ${wasOnline} -> ${isOnline}`);
            
            displayContacts();
            updateOnlineCount();
            
            const currentChatUser = window.currentChatUser;
            if (currentChatUser && currentChatUser.id === userId) {
                currentChatUser.online = isOnline;
                const statusEl = document.getElementById('chat-user-status');
                if (statusEl) {
                    statusEl.textContent = isOnline ? 'Online' : 'Offline';
                    statusEl.className = `status-text ${isOnline ? 'online' : 'offline'}`;
                }
            }
        }
    }
    
    async function loadStatistics() {
        if (!window.AuthManager.ensureLoggedIn()) return;
        
        const currentUser = window.AuthManager.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') return;
        
        try {
            const response = await fetch('/api/statistics', {
                credentials: 'include'
            });
            
            if (response.status === 401) {
                window.AuthManager.handle401();
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                const statsPanel = document.getElementById('stats-panel');
                const totalMessages = document.getElementById('total-messages');
                const messagesToday = document.getElementById('messages-today');
                
                if (statsPanel) statsPanel.style.display = 'block';
                if (totalMessages) totalMessages.textContent = data.stats.total_messages;
                if (messagesToday) messagesToday.textContent = data.stats.messages_today;
            }
        } catch (error) {
            console.error('[STATS] Error:', error);
        }
    }
    
    window.ContactsManager = {
        loadUserProfiles: loadUserProfiles,
        uploadProfilePic: uploadProfilePic,
        loadContacts: loadContacts,
        displayContacts: displayContacts,
        updateOnlineCount: updateOnlineCount,
        selectContact: selectContact,
        updateUserStatus: updateUserStatus,
        loadStatistics: loadStatistics,
        getAllContacts: function() { return allContacts; }
    };
    
    console.log('✅ [ContactsManager] Module loaded');
    
})();