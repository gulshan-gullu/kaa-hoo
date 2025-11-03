// ========================================
// END-TO-END ENCRYPTION MODULE
// ========================================

(function() {
    'use strict';
    
    console.log('🔐 Encryption Module Loading...');
    
    // Simple XOR encryption (For demo - use real crypto in production)
    const ENCRYPTION_KEY = 'KAA_HO_SECRET_2025';
    
    function xorEncrypt(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result); // Base64 encode
    }
    
    function xorDecrypt(encrypted, key) {
        try {
            const decoded = atob(encrypted); // Base64 decode
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        } catch (e) {
            return encrypted; // Return original if decryption fails
        }
    }
    
    // Advanced: Use Web Crypto API (Production-ready)
    async function generateKeyPair() {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            ["encrypt", "decrypt"]
        );
        return keyPair;
    }
    
    async function encryptMessage(message, publicKey) {
        const encoded = new TextEncoder().encode(message);
        const encrypted = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            encoded
        );
        return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    }
    
    async function decryptMessage(encryptedMessage, privateKey) {
        const encrypted = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encrypted
        );
        return new TextDecoder().decode(decrypted);
    }
    
    // Expose encryption functions
    window.encryption = {
        // Simple XOR (Fast, for demo)
        encrypt: function(text) {
            return xorEncrypt(text, ENCRYPTION_KEY);
        },
        decrypt: function(encrypted) {
            return xorDecrypt(encrypted, ENCRYPTION_KEY);
        },
        
        // Advanced RSA (Production)
        generateKeyPair: generateKeyPair,
        encryptAdvanced: encryptMessage,
        decryptAdvanced: decryptMessage,
        
        // Toggle encryption
        enabled: false,
        
        // Auto-encrypt outgoing messages
        interceptSend: function(originalSendFunction) {
            return function(messageData) {
                if (window.encryption.enabled && messageData.text) {
                    messageData.text = window.encryption.encrypt(messageData.text);
                    messageData.encrypted = true;
                }
                return originalSendFunction(messageData);
            };
        },
        
        // Auto-decrypt incoming messages
        interceptReceive: function(message) {
            if (message.encrypted && message.text) {
                message.text = window.encryption.decrypt(message.text);
            }
            return message;
        }
    };
    
    // Add encryption toggle button
    function addEncryptionToggle() {
        const chatHeader = document.querySelector('.chat-header .chat-user-info');
        if (!chatHeader) return;
        
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'encryption-toggle';
        toggleBtn.className = 'encryption-toggle';
        toggleBtn.innerHTML = '🔓';
        toggleBtn.title = 'Toggle Encryption';
        toggleBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #25d366;
            font-size: 20px;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 8px;
            margin-left: 12px;
            transition: all 0.2s;
        `;
        
        toggleBtn.addEventListener('click', function() {
            window.encryption.enabled = !window.encryption.enabled;
            this.innerHTML = window.encryption.enabled ? '🔐' : '🔓';
            this.style.color = window.encryption.enabled ? '#25d366' : '#999';
            
            const status = window.encryption.enabled ? 'Encryption ON' : 'Encryption OFF';
            showEncryptionToast(status);
        });
        
        chatHeader.appendChild(toggleBtn);
    }
    
    function showEncryptionToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            z-index: 10000;
            animation: fadeInOut 2s ease-in-out;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addEncryptionToggle);
    } else {
        setTimeout(addEncryptionToggle, 2000);
    }
    
    console.log('✅ Encryption Module Ready!');
})();