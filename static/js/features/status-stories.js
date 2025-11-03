// ========================================
// STATUS/STORIES MODULE (WhatsApp Style)
// ========================================

(function() {
    'use strict';
    
    console.log('📖 Status/Stories Module Loading...');
    
    let statuses = [];
    
    // Create status UI
    function createStatusUI() {
        const modal = document.createElement('div');
        modal.id = 'status-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="height: 100%; display: flex; flex-direction: column;">
                <!-- Header -->
                <div style="padding: 20px; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.5);">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div id="status-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: #25d366; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">?</div>
                        <div>
                            <div id="status-username" style="color: white; font-weight: 500;">Username</div>
                            <div id="status-time" style="color: rgba(255,255,255,0.6); font-size: 12px;">Just now</div>
                        </div>
                    </div>
                    <button onclick="window.closeStatusViewer()" style="background: none; border: none; color: white; font-size: 28px; cursor: pointer;">×</button>
                </div>
                
                <!-- Progress bars -->
                <div style="display: flex; gap: 4px; padding: 0 20px;">
                    <div id="status-progress" style="flex: 1; height: 2px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
                        <div style="height: 100%; background: white; width: 0%; transition: width 5s linear;"></div>
                    </div>
                </div>
                
                <!-- Status content -->
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; position: relative;">
                    <div id="status-content" style="max-width: 90%; text-align: center;">
                        <!-- Status text/image here -->
                    </div>
                    
                    <!-- Navigation -->
                    <button onclick="window.previousStatus()" style="position: absolute; left: 20px; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 24px; width: 48px; height: 48px; border-radius: 50%; cursor: pointer;">‹</button>
                    <button onclick="window.nextStatus()" style="position: absolute; right: 20px; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 24px; width: 48px; height: 48px; border-radius: 50%; cursor: pointer;">›</button>
                </div>
                
                <!-- Reply input -->
                <div style="padding: 20px; background: rgba(0,0,0,0.5);">
                    <input type="text" id="status-reply-input" placeholder="Reply to status..." style="width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 24px; color: white; font-size: 14px;">
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Create add status button
        const addModal = document.createElement('div');
        addModal.id = 'add-status-modal';
        addModal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
        `;
        
        addModal.innerHTML = `
            <div style="max-width: 500px; margin: 80px auto; background: var(--background-color); border-radius: 12px; padding: 0;">
                <div style="padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: var(--text-primary);">Add Status</h2>
                    <button onclick="window.closeAddStatus()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: var(--text-secondary);">×</button>
                </div>
                
                <div style="padding: 20px;">
                    <textarea id="new-status-text" placeholder="What's on your mind?" style="width: 100%; height: 120px; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; resize: none;"></textarea>
                    
                    <div style="margin-top: 20px; display: flex; gap: 12px;">
                        <button onclick="window.closeAddStatus()" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: var(--text-primary); cursor: pointer;">Cancel</button>
                        <button onclick="window.postStatus()" style="flex: 1; padding: 12px; background: #25d366; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 500;">Post Status</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(addModal);
    }
    
    window.openAddStatus = function() {
        document.getElementById('add-status-modal').style.display = 'block';
    };
    
    window.closeAddStatus = function() {
        document.getElementById('add-status-modal').style.display = 'none';
    };
    
    window.postStatus = function() {
        const input = document.getElementById('new-status-text');
        if (!input || !input.value.trim()) {
            alert('Please enter status text');
            return;
        }
        
        const status = {
            id: 'status_' + Date.now(),
            user_id: window.currentUser ? window.currentUser.id : 'unknown',
            user_name: window.currentUser ? window.currentUser.name : 'User',
            text: input.value.trim(),
            timestamp: new Date().toISOString(),
            views: 0
        };
        
        statuses.unshift(status);
        
        alert('✅ Status posted!');
        input.value = '';
        window.closeAddStatus();
        
        console.log('Status posted:', status);
    };
    
    window.closeStatusViewer = function() {
        document.getElementById('status-modal').style.display = 'none';
    };
    
    window.viewStatus = function(statusId) {
        document.getElementById('status-modal').style.display = 'block';
        // Load status content
        console.log('Viewing status:', statusId);
    };
    
    window.previousStatus = function() {
        console.log('Previous status');
    };
    
    window.nextStatus = function() {
        console.log('Next status');
    };
    
    // Add status button to sidebar
    function addStatusButton() {
        const sidebar = document.querySelector('.sidebar-header');
        if (!sidebar) return;
        
        const statusSection = document.createElement('div');
        statusSection.style.cssText = 'padding: 16px; border-bottom: 1px solid var(--border-color); cursor: pointer;';
        statusSection.onclick = window.openAddStatus;
        statusSection.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: #25d366; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">+</div>
                <div>
                    <div style="color: var(--text-primary); font-weight: 500;">My Status</div>
                    <div style="color: var(--text-secondary); font-size: 12px;">Tap to add status</div>
                </div>
            </div>
        `;
        
        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            searchBar.parentNode.insertBefore(statusSection, searchBar.nextSibling);
        }
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        createStatusUI();
        setTimeout(addStatusButton, 2000);
        console.log('✅ Status/Stories Module Ready!');
    }
    
})();