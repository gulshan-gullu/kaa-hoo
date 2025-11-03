// ========================================
// POLL CREATOR FEATURE
// ========================================

(function() {
    'use strict';
    
    window.openPollCreator = function() {
        console.log('📊 Opening poll creator...');
        
        if (!window.currentChatUser) {
            alert('Please select a contact first');
            return;
        }
        
        showPollCreatorUI();
    };
    
    function showPollCreatorUI() {
        const pollHTML = `
            <div id="poll-creator-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; flex-direction: column;">
                <!-- Header -->
                <div style="padding: 20px; background: rgba(0,0,0,0.95); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h2 style="color: white; margin: 0; font-size: 20px;">Create Poll</h2>
                    <button onclick="closePollCreator()" style="background: none; border: none; color: white; font-size: 32px; cursor: pointer; line-height: 1;">×</button>
                </div>
                
                <!-- Poll Form -->
                <div style="flex: 1; overflow-y: auto; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto;">
                        <!-- Question -->
                        <div style="margin-bottom: 25px;">
                            <label style="color: rgba(255,255,255,0.8); font-size: 14px; display: block; margin-bottom: 8px;">Question</label>
                            <input type="text" id="poll-question" placeholder="Ask a question..." 
                                   style="width: 100%; padding: 15px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white; font-size: 16px;">
                        </div>
                        
                        <!-- Options -->
                        <div style="margin-bottom: 25px;">
                            <label style="color: rgba(255,255,255,0.8); font-size: 14px; display: block; margin-bottom: 12px;">Options</label>
                            <div id="poll-options">
                                <div style="margin-bottom: 10px; display: flex; gap: 10px;">
                                    <input type="text" class="poll-option" placeholder="Option 1" 
                                           style="flex: 1; padding: 12px 15px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 15px;">
                                </div>
                                <div style="margin-bottom: 10px; display: flex; gap: 10px;">
                                    <input type="text" class="poll-option" placeholder="Option 2" 
                                           style="flex: 1; padding: 12px 15px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 15px;">
                                </div>
                            </div>
                            <button onclick="addPollOption()" style="margin-top: 10px; padding: 10px 20px; background: rgba(37,211,102,0.2); border: 1px solid rgba(37,211,102,0.3); border-radius: 8px; color: #25d366; cursor: pointer; font-size: 14px;">+ Add Option</button>
                        </div>
                        
                        <!-- Settings -->
                        <div style="margin-bottom: 25px;">
                            <label style="display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.8); cursor: pointer;">
                                <input type="checkbox" id="poll-multiple" style="width: 18px; height: 18px;">
                                <span>Allow multiple answers</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="padding: 20px; background: rgba(0,0,0,0.95); border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: flex-end; gap: 15px;">
                    <button onclick="closePollCreator()" style="padding: 12px 30px; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 15px;">Cancel</button>
                    <button onclick="sendPoll()" style="padding: 12px 30px; background: #25d366; border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 15px; font-weight: 600;">Send Poll</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', pollHTML);
    }
    
    window.addPollOption = function() {
        const optionsContainer = document.getElementById('poll-options');
        const optionCount = document.querySelectorAll('.poll-option').length + 1;
        
        if (optionCount > 10) {
            alert('Maximum 10 options allowed');
            return;
        }
        
        const newOption = `
            <div style="margin-bottom: 10px; display: flex; gap: 10px;">
                <input type="text" class="poll-option" placeholder="Option ${optionCount}" 
                       style="flex: 1; padding: 12px 15px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 15px;">
                <button onclick="this.parentElement.remove()" style="padding: 0 15px; background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; color: #ef4444; cursor: pointer;">×</button>
            </div>
        `;
        
        optionsContainer.insertAdjacentHTML('beforeend', newOption);
    };
    
    window.sendPoll = function() {
        const question = document.getElementById('poll-question').value.trim();
        const optionInputs = document.querySelectorAll('.poll-option');
        const options = Array.from(optionInputs)
            .map(input => input.value.trim())
            .filter(option => option.length > 0);
        const allowMultiple = document.getElementById('poll-multiple').checked;
        
        if (!question) {
            alert('Please enter a question');
            return;
        }
        
        if (options.length < 2) {
            alert('Please add at least 2 options');
            return;
        }
        
        const pollMessage = `📊 POLL: ${question}\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\n${allowMultiple ? '(Multiple answers allowed)' : '(Single answer only)'}`;
        
        fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: pollMessage,
                target_user: window.currentChatUser.id
            }),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Poll sent successfully!');
                closePollCreator();
            } else {
                alert('Failed to send poll');
            }
        })
        .catch(error => {
            console.error('❌ Error sending poll:', error);
            alert('Failed to send poll');
        });
    };
    
    window.closePollCreator = function() {
        const modal = document.getElementById('poll-creator-modal');
        if (modal) modal.remove();
    };
    
})();