// Add this at the top of socket.js or chat.js

// Prevent duplicate message display
let displayedMessages = new Set();
let messageDisplayTimeout = 1000; // 1 second

function displayMessageOnce(messageData) {
    // Create unique ID for message
    const msgId = `${messageData.from_user}_${messageData.timestamp}_${messageData.message}`;
    
    // Check if already displayed recently
    if (displayedMessages.has(msgId)) {
        console.log('?? [DEDUPE] Duplicate message blocked:', msgId);
        return false;
    }
    
    // Add to set
    displayedMessages.add(msgId);
    
    // Remove after timeout
    setTimeout(() => {
        displayedMessages.delete(msgId);
    }, messageDisplayTimeout);
    
    return true;
}

// Wrap your message display function
// BEFORE:
// function displayMessage(data) {
//     appendMessageToChat(data);
// }

// AFTER:
function displayMessage(data) {
    if (displayMessageOnce(data)) {
        appendMessageToChat(data);
    }
}
