// ==========================================
// 😀 EMOJI PICKER
// Emoji selection and insertion
// Dependencies: None
// ==========================================

(function() {
    'use strict';
    
    // Toggle emoji picker
    function toggleEmojiPicker() {
        const picker = document.getElementById('emoji-picker');
        if (!picker) {
            console.error('❌ Emoji picker element not found');
            return;
        }
        
        if (picker.style.display === 'grid') {
            picker.style.display = 'none';
            console.log('😀 Emoji picker closed');
        } else {
            picker.style.display = 'grid';
            console.log('😀 Emoji picker opened');
        }
    }
    
    // Insert emoji into input
    function insertEmoji(emoji) {
        const input = document.getElementById('chat-input');
        
        if (!input) {
            console.error('❌ Chat input element not found');
            return;
        }
        
        emoji = emoji.trim();
        console.log('😀 Inserting emoji:', emoji);
        
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const currentText = input.value;
        
        const newText = currentText.substring(0, start) + emoji + currentText.substring(end);
        input.value = newText;
        
        const newCursorPos = start + emoji.length;
        input.selectionStart = newCursorPos;
        input.selectionEnd = newCursorPos;
        
        input.focus();
        
        const picker = document.getElementById('emoji-picker');
        if (picker) {
            picker.style.display = 'none';
            console.log('😀 Emoji picker closed');
        }
        
        console.log('✅ Emoji inserted successfully');
    }
    
    // Setup emoji item listeners
    function setupEmojiListeners() {
        setTimeout(function() {
            const emojiItems = document.querySelectorAll('.emoji-item');
            console.log('😀 Found emoji items:', emojiItems.length);
            
            emojiItems.forEach(function(item, index) {
                item.onclick = function(e) {
                    e.stopPropagation();
                    const emoji = this.textContent.trim();
                    console.log('😀 Emoji clicked:', emoji);
                    insertEmoji(emoji);
                };
            });
            console.log('✅ Emoji listeners added');
        }, 500);
    }
    
    // Expose to window
    window.EmojiPicker = {
        toggle: toggleEmojiPicker,
        insert: insertEmoji,
        setupListeners: setupEmojiListeners
    };
    
    console.log('✅ [EmojiPicker] Module loaded');
    
})();