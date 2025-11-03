// ========================================
// CONTACT SHARING FEATURE
// ========================================

(function() {
    'use strict';
    
    window.openContactSharing = function() {
        console.log('👤 Opening contact sharing...');
        
        if (!window.currentChatUser) {
            alert('Please select a contact first');
            return;
        }
        
        showContactSelectionUI();
    };
    
    function showContactSelectionUI() {
        const contactsHTML = `
            <div id="contact-sharing-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; flex-direction: column;">
                <!-- Header -->
                <div style="padding: 20px; background: rgba(0,0,0,0.95); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h2 style="color: white; margin: 0; font-size: 20px;">Share Contact</h2>
                    <button onclick="closeContactSharing()" style="background: none; border: none; color: white; font-size: 32px; cursor: pointer; line-height: 1;">×</button>
                </div>
                
                <!-- Search -->
                <div style="padding: 15px 20px; background: rgba(0,0,0,0.8);">
                    <input type="text" id="contact-search" placeholder="Search contacts..." 
                           oninput="filterContacts(this.value)"
                           style="width: 100%; padding: 12px 15px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 15px;">
                </div>
                
                <!-- Contact List -->
                <div id="contact-list-container" style="flex: 1; overflow-y: auto; padding: 10px;">
                    ${generateContactList()}
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', contactsHTML);
    }
    
    function generateContactList() {
        if (!window.allContacts || window.allContacts.length === 0) {
            return '<p style="color: rgba(255,255,255,0.6); text-align: center; padding: 40px;">No contacts available</p>';
        }
        
        return window.allContacts
            .filter(c => c.id !== window.currentChatUser.id)
            .map(contact => `
                <div class="shareable-contact" data-name="${contact.name.toLowerCase()}" 
                     onclick="shareContact('${contact.id}', '${contact.name}')"
                     style="padding: 15px 20px; background: rgba(255,255,255,0.05); margin-bottom: 8px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 15px; transition: all 0.2s;"
                     onmouseover="this.style.background='rgba(255,255,255,0.1)'"
                     onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                    <div style="width: 45px; height: 45px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: 600;">
                        ${contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div style="flex: 1;">
                        <div style="color: white; font-size: 16px; font-weight: 500;">${contact.name}</div>
                        <div style="color: rgba(255,255,255,0.6); font-size: 13px; margin-top: 2px;">${contact.role.toUpperCase()}</div>
                    </div>
                    <div style="color: rgba(37,211,102,1); font-size: 20px;">→</div>
                </div>
            `).join('');
    }
    
    window.filterContacts = function(searchQuery) {
        const query = searchQuery.toLowerCase();
        const contacts = document.querySelectorAll('.shareable-contact');
        
        contacts.forEach(contact => {
            const name = contact.getAttribute('data-name');
            if (name.includes(query)) {
                contact.style.display = 'flex';
            } else {
                contact.style.display = 'none';
            }
        });
    };
    
    window.shareContact = function(contactId, contactName) {
        console.log('📤 Sharing contact:', contactName);
        
        const message = `👤 Contact: ${contactName}\nID: ${contactId}`;
        
        fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: message,
                target_user: window.currentChatUser.id
            }),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Contact shared successfully!');
                closeContactSharing();
            } else {
                alert('Failed to share contact');
            }
        })
        .catch(error => {
            console.error('❌ Error sharing contact:', error);
            alert('Failed to share contact');
        });
    };
    
    window.closeContactSharing = function() {
        const modal = document.getElementById('contact-sharing-modal');
        if (modal) modal.remove();
    };
    
})();