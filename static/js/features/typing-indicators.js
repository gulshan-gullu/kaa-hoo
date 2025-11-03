// ==========================================
// ⌨️ TYPING INDICATORS - OPTIMIZED
// Real-time typing with minimal socket overhead
// Dependencies: SocketManager
// ==========================================

(function() {
    'use strict';
    
    let typingTimeout = null;
    let isCurrentlyTyping = false;
    let lastEmit = 0;
    const TYPING_EMIT_THROTTLE = 3000; // Emit once every 3 seconds MAX
    const TYPING_TIMEOUT = 3000; // Stop after 3 seconds of no input
    
    // Handle Enter key press
    function handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            stop();
            if (window.MessagingManager) {
                window.MessagingManager.sendMessage();
            }
            return;
        }
    }
    
    // Handle key up events
    function handleKeyUp() {
        const now = Date.now();
        
        // Throttle: Only process if enough time has passed
        if (now - lastEmit < TYPING_EMIT_THROTTLE) {
            // Just reset the timeout, don't emit
            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(stop, TYPING_TIMEOUT);
            return;
        }
        
        // Clear existing timeout
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }
        
        // Start typing if not already
        if (!isCurrentlyTyping) {
            start();
        }
        
        // Auto-stop after timeout
        typingTimeout = setTimeout(stop, TYPING_TIMEOUT);
    }
    
    // Start typing indicator
    function start() {
        if (isCurrentlyTyping) return;
        
        const socket = window.SocketManager ? window.SocketManager.getSocket() : window.socket;
        const currentChatUser = window.currentChatUser;
        
        if (!socket || !socket.connected || !currentChatUser) {
            return;
        }
        
        console.log('[TYPING] 📝 Emitting typing indicator to:', currentChatUser.id);
        
        socket.emit('typing', {
            target_user: currentChatUser.id,
            typing: true
        });
        
        isCurrentlyTyping = true;
        lastEmit = Date.now();
    }
    
    // Stop typing indicator
    function stop() {
        if (!isCurrentlyTyping) return;
        
        const socket = window.SocketManager ? window.SocketManager.getSocket() : window.socket;
        const currentChatUser = window.currentChatUser;
        
        if (!socket || !socket.connected || !currentChatUser) {
            isCurrentlyTyping = false;
            return;
        }
        
        console.log('[TYPING] ⏸️ Stopping typing indicator');
        
        socket.emit('typing', {
            target_user: currentChatUser.id,
            typing: false
        });
        
        isCurrentlyTyping = false;
        
        if (typingTimeout) {
            clearTimeout(typingTimeout);
            typingTimeout = null;
        }
    }
    
    // Check if currently typing
    function isTyping() {
        return isCurrentlyTyping;
    }
    
    // Force stop (for cleanup)
    function forceStop() {
        if (typingTimeout) {
            clearTimeout(typingTimeout);
            typingTimeout = null;
        }
        isCurrentlyTyping = false;
    }
    
    // Expose to window
    window.TypingManager = {
        handleKeyPress: handleKeyPress,
        handleKeyUp: handleKeyUp,
        start: start,
        stop: stop,
        isTyping: isTyping,
        forceStop: forceStop
    };
    
    console.log('✅ [TypingManager] Optimized module loaded - Max 1 emit per 3 seconds');
    
})();