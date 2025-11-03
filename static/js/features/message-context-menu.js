// ========================================
// MESSAGE CONTEXT MENU - Complete WhatsApp Style
// ========================================

(function() {
    'use strict';
    
    console.log('💬 Message Context Menu Loading...');
    
    let currentContextMenu = null;
    let currentMessageId = null;
    let currentMessageElement = null;
    let selectedMessages = new Set();
    let selectionMode = false;
    
    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        console.log('💬 Initializing Message Context Menu...');
        
        // Create context menu HTML
        createContextMenuHTML();
        
        // Add long-press and right-click listeners to messages
        setupMessageListeners();
        
        // Close menu on click outside
        document.addEventListener('click', closeContextMenu);
        
        // Close menu on ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (currentContextMenu) {
                    closeContextMenu();
                } else if (selectionMode) {
                    exitSelectionMode();
                }
            }
        });
        
        console.log('✅ Message Context Menu Initialized!');
    }
    
    function createContextMenuHTML() {
        const menuHTML = `
            <div id="message-context-menu" class="message-context-menu" style="display: none;">
                <div class="context-menu-item" data-action="reply">
                    <span class="context-icon">↩️</span>
                    <span>Reply</span>
                </div>
                <div class="context-menu-item" data-action="copy">
                    <span class="context-icon">📋</span>
                    <span>Copy</span>
                </div>
                <div class="context-menu-item" data-action="save">
                    <span class="context-icon">💾</span>
                    <span>Save as...</span>
                </div>
                <div class="context-menu-item" data-action="forward">
                    <span class="context-icon">➡️</span>
                    <span>Forward</span>
                </div>
                <div class="context-menu-item" data-action="star">
                    <span class="context-icon">⭐</span>
                    <span>Star</span>
                </div>
                <div class="context-menu-item" data-action="pin">
                    <span class="context-icon">📌</span>
                    <span>Pin</span>
                </div>
                <div class="context-menu-item" data-action="select">
                    <span class="context-icon">☑️</span>
                    <span>Select</span>
                </div>
                <div class="context-menu-item" data-action="share">
                    <span class="context-icon">📤</span>
                    <span>Share</span>
                </div>
                <div class="context-menu-item context-delete" data-action="delete">
                    <span class="context-icon">🗑️</span>
                    <span>Delete</span>
                </div>
                <div class="context-menu-item" data-action="info">
                    <span class="context-icon">ℹ️</span>
                    <span>Info</span>
                </div>
            </div>
            
            <!-- Delete Options Submenu -->
            <div id="delete-options-menu" class="message-context-menu" style="display: none;">
                <div class="context-menu-item" data-action="delete-me">
                    <span class="context-icon">🗑️</span>
                    <span>Delete for me</span>
                </div>
                <div class="context-menu-item" data-action="delete-everyone">
                    <span class="context-icon">🗑️</span>
                    <span>Delete for everyone</span>
                </div>
                <div class="context-menu-item" data-action="cancel-delete">
                    <span class="context-icon">❌</span>
                    <span>Cancel</span>
                </div>
            </div>
            
            <!-- Emoji Quick Reactions -->
            <div id="message-reactions" class="message-reactions" style="display: none;">
                <span class="reaction-emoji" data-emoji="👍">👍</span>
                <span class="reaction-emoji" data-emoji="❤️">❤️</span>
                <span class="reaction-emoji" data-emoji="😂">😂</span>
                <span class="reaction-emoji" data-emoji="😮">😮</span>
                <span class="reaction-emoji" data-emoji="😢">😢</span>
                <span class="reaction-emoji" data-emoji="🙏">🙏</span>
                <span class="reaction-emoji" data-emoji="+">➕</span>
            </div>
            
            <!-- Selection Mode Toolbar -->
            <div id="selection-toolbar" class="selection-toolbar" style="display: none;">
                <div class="selection-header">
                    <button class="selection-close" onclick="window.exitSelectionMode()">✕</button>
                    <span class="selection-count">0 selected</span>
                </div>
                <div class="selection-actions">
                    <button class="selection-action" onclick="window.deleteSelectedMessages()">
                        <span>🗑️</span>
                        <span>Delete</span>
                    </button>
                    <button class="selection-action" onclick="window.forwardSelectedMessages()">
                        <span>➡️</span>
                        <span>Forward</span>
                    </button>
                    <button class="selection-action" onclick="window.starSelectedMessages()">
                        <span>⭐</span>
                        <span>Star</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', menuHTML);
        
        // Add event listeners to menu items
        const menuItems = document.querySelectorAll('.context-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                const action = this.getAttribute('data-action');
                handleContextAction(action);
            });
        });
        
        // Add reaction listeners
        const reactions = document.querySelectorAll('.reaction-emoji');
        reactions.forEach(reaction => {
            reaction.addEventListener('click', function(e) {
                e.stopPropagation();
                const emoji = this.getAttribute('data-emoji');
                handleReaction(emoji);
            });
        });
    }
    
    function setupMessageListeners() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        // Right-click (desktop)
        chatMessages.addEventListener('contextmenu', function(e) {
            const messageEl = e.target.closest('.message');
            if (messageEl && !selectionMode) {
                e.preventDefault();
                showContextMenu(e.clientX, e.clientY, messageEl);
            }
        });
        
        // Long press (mobile)
        let longPressTimer;
        chatMessages.addEventListener('touchstart', function(e) {
            const messageEl = e.target.closest('.message');
            if (messageEl && !selectionMode) {
                longPressTimer = setTimeout(() => {
                    const touch = e.touches[0];
                    showContextMenu(touch.clientX, touch.clientY, messageEl);
                }, 500);
            }
        });
        
        chatMessages.addEventListener('touchend', function() {
            clearTimeout(longPressTimer);
        });
        
        chatMessages.addEventListener('touchmove', function() {
            clearTimeout(longPressTimer);
        });
        
        // Click in selection mode
        chatMessages.addEventListener('click', function(e) {
            if (selectionMode) {
                const messageEl = e.target.closest('.message');
                if (messageEl) {
                    toggleMessageSelection(messageEl);
                }
            }
        });
    }
    
    function showContextMenu(x, y, messageElement) {
        console.log('💬 Showing context menu for message');
        
        currentMessageElement = messageElement;
        currentMessageId = messageElement.getAttribute('data-message-id');
        
        const menu = document.getElementById('message-context-menu');
        const reactions = document.getElementById('message-reactions');
        
        if (!menu) return;
        
        // Position menu
        menu.style.display = 'block';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        
        // Adjust if menu goes off screen
        setTimeout(() => {
            const menuRect = menu.getBoundingClientRect();
            if (menuRect.right > window.innerWidth) {
                menu.style.left = (x - menuRect.width) + 'px';
            }
            if (menuRect.bottom > window.innerHeight) {
                menu.style.top = (y - menuRect.height) + 'px';
            }
        }, 10);
        
        // Show reactions above menu
        if (reactions) {
            reactions.style.display = 'flex';
            reactions.style.left = menu.style.left;
            reactions.style.top = (parseInt(menu.style.top) - 60) + 'px';
        }
        
        currentContextMenu = menu;
    }
    
    function closeContextMenu() {
        const menu = document.getElementById('message-context-menu');
        const deleteMenu = document.getElementById('delete-options-menu');
        const reactions = document.getElementById('message-reactions');
        
        if (menu) menu.style.display = 'none';
        if (deleteMenu) deleteMenu.style.display = 'none';
        if (reactions) reactions.style.display = 'none';
        
        currentContextMenu = null;
        if (!selectionMode) {
            currentMessageId = null;
            currentMessageElement = null;
        }
    }
    
    function handleContextAction(action) {
        console.log('💬 Action:', action, 'for message:', currentMessageId);
        
        if (!currentMessageElement && !['cancel-delete'].includes(action)) {
            closeContextMenu();
            return;
        }
        
        const messageText = currentMessageElement?.querySelector('.message-bubble')?.textContent || '';
        const isSentMessage = currentMessageElement?.classList.contains('sent');
        
        switch(action) {
            case 'reply':
                handleReply(messageText);
                closeContextMenu();
                break;
            case 'copy':
                handleCopy(messageText);
                closeContextMenu();
                break;
            case 'save':
                handleSaveAs(messageText);
                closeContextMenu();
                break;
            case 'forward':
                handleForward();
                closeContextMenu();
                break;
            case 'star':
                handleStar();
                closeContextMenu();
                break;
            case 'pin':
                handlePin();
                closeContextMenu();
                break;
            case 'select':
                handleSelect();
                closeContextMenu();
                break;
            case 'share':
                handleShare(messageText);
                closeContextMenu();
                break;
            case 'delete':
                showDeleteOptions(isSentMessage);
                break;
            case 'delete-me':
                handleDeleteForMe();
                closeContextMenu();
                break;
            case 'delete-everyone':
                handleDeleteForEveryone();
                closeContextMenu();
                break;
            case 'cancel-delete':
                closeContextMenu();
                break;
            case 'info':
                handleInfo();
                closeContextMenu();
                break;
        }
    }
    
    function showDeleteOptions(isSentMessage) {
        const mainMenu = document.getElementById('message-context-menu');
        const deleteMenu = document.getElementById('delete-options-menu');
        
        if (!deleteMenu) return;
        
        // Hide main menu
        if (mainMenu) mainMenu.style.display = 'none';
        
        // Position delete menu
        deleteMenu.style.display = 'block';
        deleteMenu.style.left = mainMenu.style.left;
        deleteMenu.style.top = mainMenu.style.top;
        
        // Show/hide "Delete for everyone" based on message ownership
        const deleteEveryoneOption = deleteMenu.querySelector('[data-action="delete-everyone"]');
        if (deleteEveryoneOption) {
            deleteEveryoneOption.style.display = isSentMessage ? 'flex' : 'none';
        }
    }
    
    function handleReply(messageText) {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            const preview = messageText.substring(0, 50) + (messageText.length > 50 ? '...' : '');
            chatInput.value = `↩️ Replying to: "${preview}"\n\n`;
            chatInput.focus();
            showToast('✅ Reply mode activated');
        }
    }
    
    function handleCopy(messageText) {
        navigator.clipboard.writeText(messageText).then(() => {
            showToast('✅ Message copied!');
        }).catch(err => {
            console.error('❌ Copy failed:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = messageText;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast('✅ Message copied!');
            } catch (err) {
                showToast('❌ Copy failed');
            }
            document.body.removeChild(textArea);
        });
    }
    
    function handleSaveAs(messageText) {
        const blob = new Blob([messageText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `message_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('💾 Message saved!');
    }
    
    function handleForward() {
        showToast('➡️ Forward feature coming soon!');
    }
    
    function handleStar() {
        if (currentMessageElement) {
            currentMessageElement.classList.toggle('starred');
            const isStarred = currentMessageElement.classList.contains('starred');
            showToast(isStarred ? '⭐ Message starred' : '☆ Star removed');
        }
    }
    
    function handlePin() {
        if (currentMessageElement) {
            currentMessageElement.classList.toggle('pinned');
            const isPinned = currentMessageElement.classList.contains('pinned');
            showToast(isPinned ? '📌 Message pinned' : '📌 Pin removed');
        }
    }
    
    function handleSelect() {
        enterSelectionMode();
        if (currentMessageElement) {
            toggleMessageSelection(currentMessageElement);
        }
    }
    
    function handleShare(messageText) {
        if (navigator.share) {
            navigator.share({
                text: messageText,
                title: 'Shared from KAA HO Chat'
            }).then(() => {
                showToast('📤 Message shared!');
            }).catch(err => {
                console.log('Share cancelled or failed:', err);
            });
        } else {
            // Fallback - copy to clipboard
            handleCopy(messageText);
            showToast('📋 Copied! (Share API not supported)');
        }
    }
    
    function handleDeleteForMe() {
        if (confirm('Delete this message for yourself?')) {
            if (currentMessageElement) {
                currentMessageElement.style.opacity = '0.5';
                currentMessageElement.querySelector('.message-bubble').textContent = '🚫 You deleted this message';
                showToast('🗑️ Message deleted for you');
            }
        }
    }
    
    function handleDeleteForEveryone() {
        if (confirm('Delete this message for everyone? This cannot be undone.')) {
            if (currentMessageElement) {
                currentMessageElement.remove();
                showToast('🗑️ Message deleted for everyone');
                // TODO: Send delete request to server
                console.log('Delete for everyone:', currentMessageId);
            }
        }
    }
    
    function handleInfo() {
        const timestamp = currentMessageElement?.getAttribute('data-timestamp') || 'Unknown';
        const isSent = currentMessageElement?.classList.contains('sent');
        const isStarred = currentMessageElement?.classList.contains('starred');
        const isPinned = currentMessageElement?.classList.contains('pinned');
        
        let info = `Message Info:\n\n`;
        info += `ID: ${currentMessageId}\n`;
        info += `Time: ${timestamp}\n`;
        info += `Type: ${isSent ? 'Sent' : 'Received'}\n`;
        if (isStarred) info += `⭐ Starred\n`;
        if (isPinned) info += `📌 Pinned\n`;
        
        alert(info);
    }
    
    // Selection Mode Functions
    function enterSelectionMode() {
        selectionMode = true;
        selectedMessages.clear();
        
        const toolbar = document.getElementById('selection-toolbar');
        if (toolbar) {
            toolbar.style.display = 'block';
        }
        
        // Add selection indicators to all messages
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => {
            msg.classList.add('selectable');
        });
        
        updateSelectionCount();
    }
    
    function exitSelectionMode() {
        selectionMode = false;
        selectedMessages.clear();
        
        const toolbar = document.getElementById('selection-toolbar');
        if (toolbar) {
            toolbar.style.display = 'none';
        }
        
        // Remove selection indicators
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => {
            msg.classList.remove('selectable', 'selected');
        });
        
        currentMessageId = null;
        currentMessageElement = null;
    }
    
    function toggleMessageSelection(messageElement) {
        const msgId = messageElement.getAttribute('data-message-id');
        
        if (selectedMessages.has(msgId)) {
            selectedMessages.delete(msgId);
            messageElement.classList.remove('selected');
        } else {
            selectedMessages.add(msgId);
            messageElement.classList.add('selected');
        }
        
        updateSelectionCount();
    }
    
    function updateSelectionCount() {
        const countEl = document.querySelector('.selection-count');
        if (countEl) {
            countEl.textContent = `${selectedMessages.size} selected`;
        }
    }
    
    window.exitSelectionMode = exitSelectionMode;
    
    window.deleteSelectedMessages = function() {
        if (selectedMessages.size === 0) return;
        
        if (confirm(`Delete ${selectedMessages.size} message(s)?`)) {
            selectedMessages.forEach(msgId => {
                const msgEl = document.querySelector(`[data-message-id="${msgId}"]`);
                if (msgEl) msgEl.remove();
            });
            showToast(`🗑️ ${selectedMessages.size} message(s) deleted`);
            exitSelectionMode();
        }
    };
    
    window.forwardSelectedMessages = function() {
        showToast(`➡️ Forward ${selectedMessages.size} message(s) - Coming soon!`);
    };
    
    window.starSelectedMessages = function() {
        selectedMessages.forEach(msgId => {
            const msgEl = document.querySelector(`[data-message-id="${msgId}"]`);
            if (msgEl) msgEl.classList.add('starred');
        });
        showToast(`⭐ ${selectedMessages.size} message(s) starred`);
        exitSelectionMode();
    };
    
    function handleReaction(emoji) {
        if (emoji === '+') {
            showToast('➕ More reactions coming soon!');
        } else if (currentMessageElement) {
            let reactionContainer = currentMessageElement.querySelector('.message-reactions-bar');
            if (!reactionContainer) {
                reactionContainer = document.createElement('div');
                reactionContainer.className = 'message-reactions-bar';
                currentMessageElement.querySelector('.message-content').appendChild(reactionContainer);
            }
            
            const reactionSpan = document.createElement('span');
            reactionSpan.className = 'message-reaction';
            reactionSpan.textContent = emoji;
            reactionContainer.appendChild(reactionSpan);
            
            showToast(`${emoji} Reaction added!`);
        }
        
        closeContextMenu();
    }
    
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'context-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            z-index: 10000;
            animation: fadeInOut 2s ease-in-out;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2000);
    }
    
    // Expose functions
    window.closeMessageContextMenu = closeContextMenu;
    
})();

console.log('✅ Message Context Menu loaded!');