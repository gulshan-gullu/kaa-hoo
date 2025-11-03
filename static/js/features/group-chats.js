// ========================================
// GROUP CHAT MODULE
// ========================================

(function() {
    'use strict';
    
    console.log('👥 Group Chat Module Loading...');
    
    let groups = [];
    
    // Create group chat UI
    function createGroupChatUI() {
        const modal = document.createElement('div');
        modal.id = 'group-chat-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            overflow-y: auto;
        `;
        
        modal.innerHTML = `
            <div style="max-width: 500px; margin: 40px auto; background: var(--background-color); border-radius: 12px; padding: 0; box-shadow: 0 8px 40px rgba(0,0,0,0.3);">
                <div style="padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: var(--text-primary);">Create Group Chat</h2>
                    <button onclick="window.closeGroupModal()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: var(--text-secondary);">×</button>
                </div>
                
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">Group Name</label>
                        <input type="text" id="group-name-input" placeholder="Enter group name..." style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px;">
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: var(--text-primary); font-weight: 500;">Select Members</label>
                        <div id="group-members-list" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px; padding: 8px;">
                            <!-- Members loaded here -->
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <button onclick="window.closeGroupModal()" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: var(--text-primary); cursor: pointer; font-size: 14px;">Cancel</button>
                        <button onclick="window.createGroup()" style="flex: 1; padding: 12px; background: #25d366; border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 14px; font-weight: 500;">Create Group</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    function loadGroupMembers() {
        const container = document.getElementById('group-members-list');
        if (!container || !window.allContacts) return;
        
        container.innerHTML = window.allContacts.map(contact => `
            <label style="display: flex; align-items: center; padding: 12px; cursor: pointer; border-radius: 8px; transition: background 0.2s;" 
                   onmouseover="this.style.background='rgba(255,255,255,0.05)'" 
                   onmouseout="this.style.background='transparent'">
                <input type="checkbox" class="group-member-checkbox" value="${contact.id}" style="margin-right: 12px; cursor: pointer;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${getColor(contact.id)}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; margin-right: 12px;">
                    ${contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style="color: var(--text-primary); font-weight: 500;">${contact.name}</div>
                    <div style="color: var(--text-secondary); font-size: 12px;">${contact.role.toUpperCase()}</div>
                </div>
            </label>
        `).join('');
    }
    
    function getColor(userId) {
        const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50'];
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
    
    window.openGroupModal = function() {
        const modal = document.getElementById('group-chat-modal');
        if (modal) {
            modal.style.display = 'block';
            loadGroupMembers();
        }
    };
    
    window.closeGroupModal = function() {
        const modal = document.getElementById('group-chat-modal');
        if (modal) modal.style.display = 'none';
    };
    
    window.createGroup = function() {
        const nameInput = document.getElementById('group-name-input');
        const checkboxes = document.querySelectorAll('.group-member-checkbox:checked');
        
        if (!nameInput || !nameInput.value.trim()) {
            alert('Please enter a group name');
            return;
        }
        
        if (checkboxes.length < 2) {
            alert('Please select at least 2 members');
            return;
        }
        
        const groupName = nameInput.value.trim();
        const members = Array.from(checkboxes).map(cb => cb.value);
        
        const group = {
            id: 'group_' + Date.now(),
            name: groupName,
            members: members,
            created_at: new Date().toISOString(),
            creator: window.currentUser ? window.currentUser.id : 'unknown'
        };
        
        groups.push(group);
        
        // TODO: Send to server
        console.log('✅ Group created:', group);
        
        alert(`✅ Group "${groupName}" created with ${members.length} members!`);
        window.closeGroupModal();
    };
    
    // Add group chat button
    function addGroupChatButton() {
        const sidebar = document.querySelector('.sidebar-header .header-buttons');
        if (!sidebar) return;
        
        const btn = document.createElement('button');
        btn.className = 'settings-btn';
        btn.innerHTML = '👥 New Group';
        btn.onclick = window.openGroupModal;
        sidebar.insertBefore(btn, sidebar.firstChild);
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        createGroupChatUI();
        setTimeout(addGroupChatButton, 2000);
        console.log('✅ Group Chat Module Ready!');
    }
    
})();