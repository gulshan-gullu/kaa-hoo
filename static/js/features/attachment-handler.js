// ========================================
// ATTACHMENT HANDLER - COMPLETE VERSION
// ========================================

(function() {
    'use strict';
    
    console.log('📎 Attachment Handler Loading...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAttachmentHandler);
    } else {
        initAttachmentHandler();
    }
    
    function initAttachmentHandler() {
        console.log('📎 Initializing Attachment Handler...');
        
        const attachBtn = document.getElementById('file-attach-btn');
        const attachMenu = document.getElementById('attachment-menu');
        const attachBackdrop = document.getElementById('attachment-backdrop');
        const fileInput = document.getElementById('file-input');
        
        if (!attachBtn || !attachMenu || !attachBackdrop || !fileInput) {
            console.error('❌ Required elements not found');
            return;
        }
        
        // ============================================
        // HELPER FUNCTIONS (INSIDE initAttachmentHandler)
        // ============================================
        
        function openMenu() {
            attachMenu.style.display = 'block';
            attachBackdrop.style.display = 'block';
            attachMenu.classList.remove('closing');
            console.log('✅ Menu opened');
        }
        
        function closeMenu() {
            attachMenu.classList.add('closing');
            attachBackdrop.style.display = 'none';
            
            setTimeout(function() {
                attachMenu.style.display = 'none';
                attachMenu.classList.remove('closing');
            }, 200);
            
            console.log('✅ Menu closed');
        }
        
        function handleAction(action) {
            console.log('🎯 Handling action:', action);
            
            // Reset file input
            fileInput.value = '';
            fileInput.removeAttribute('capture');
            fileInput.removeAttribute('accept');
            
            switch(action) {
                case 'photos':
                    console.log('🖼️ Opening Photos & Videos Modal');
                    if (window.openFileUploadModal) {
                        window.openFileUploadModal();
                        setTimeout(() => {
                            const input = document.getElementById('advanced-file-input');
                            if (input) input.accept = 'image/*,video/*';
                        }, 100);
                    } else {
                        fileInput.accept = 'image/*,video/*';
                        fileInput.click();
                    }
                    break;
                    
                case 'camera':
                    console.log('📷 Opening Camera');
                    if (window.openCameraCapture) {
                        window.openCameraCapture();
                    } else {
                        console.error('❌ Camera capture not available');
                        fileInput.accept = 'image/*';
                        fileInput.setAttribute('capture', 'environment');
                        fileInput.click();
                    }
                    break;
                    
                case 'document':
                    console.log('📄 Opening Documents Modal');
                    if (window.openFileUploadModal) {
                        window.openFileUploadModal();
                        setTimeout(() => {
                            const input = document.getElementById('advanced-file-input');
                            if (input) input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar';
                        }, 100);
                    } else {
                        fileInput.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar';
                        fileInput.click();
                    }
                    break;
                    
                case 'contact':
                    console.log('👤 Opening Contact Sharing');
                    if (window.openContactSharing) {
                        window.openContactSharing();
                    } else {
                        console.error('❌ Contact sharing not available');
                        alert('👤 Contact sharing coming soon!');
                    }
                    break;
                    
                case 'poll':
                    console.log('📊 Opening Poll Creator');
                    if (window.openPollCreator) {
                        window.openPollCreator();
                    } else {
                        console.error('❌ Poll creator not available');
                        alert('📊 Poll feature coming soon!');
                    }
                    break;
                    
                case 'drawing':
                    console.log('✏️ Opening Drawing Tool');
                    if (window.openDrawingTool) {
                        window.openDrawingTool();
                    } else {
                        console.error('❌ Drawing tool not available');
                        alert('✏️ Drawing feature coming soon!');
                    }
                    break;
                    
                default:
                    console.warn('⚠️ Unknown action:', action);
            }
        }
        
        // ============================================
        // 1. ATTACHMENT BUTTON CLICK
        // ============================================
        attachBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📎 Attachment button clicked');
            
            const isOpen = attachMenu.style.display === 'block';
            
            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });
        
        // ============================================
        // 2. BACKDROP CLICK
        // ============================================
        attachBackdrop.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📎 Backdrop clicked');
            closeMenu();
        });
        
        // ============================================
        // 3. MENU ITEM CLICKS
        // ============================================
        const menuItems = document.querySelectorAll('.attachment-menu-item');
        console.log('📎 Found menu items:', menuItems.length);
        
        menuItems.forEach(function(item) {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const action = this.getAttribute('data-action');
                console.log('📎 Menu item clicked:', action);
                
                closeMenu();
                
                // Small delay to ensure menu closes first
                setTimeout(function() {
                    handleAction(action);
                }, 150);
            });
        });
        
        console.log('✅ Attachment Handler Initialized!');
    }
    
})();