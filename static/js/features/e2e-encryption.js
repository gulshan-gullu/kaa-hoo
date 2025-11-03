// ==========================================
// 🔐 END-TO-END ENCRYPTION (E2EE)
// Signal Protocol style encryption
// Dependencies: Web Crypto API
// ==========================================

(function() {
    'use strict';
    
    let keyPair = null;
    let publicKeys = {}; // Store other users' public keys
    let privateKey = null;
    
    // Generate key pair for current user
    async function generateKeyPair() {
        try {
            console.log('🔐 [E2EE] Generating key pair...');
            
            keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256"
                },
                true,
                ["encrypt", "decrypt"]
            );
            
            privateKey = keyPair.privateKey;
            
            // Export public key
            const exportedPublicKey = await window.crypto.subtle.exportKey(
                "spki",
                keyPair.publicKey
            );
            
            const publicKeyBase64 = arrayBufferToBase64(exportedPublicKey);
            
            console.log('✅ [E2EE] Key pair generated');
            
            // Send public key to server
            await uploadPublicKey(publicKeyBase64);
            
            // Store private key locally (encrypted with password in production)
            await storePrivateKey();
            
            return publicKeyBase64;
            
        } catch (error) {
            console.error('❌ [E2EE] Key generation failed:', error);
            return null;
        }
    }
    
    // Store private key in localStorage (encrypted in production)
    async function storePrivateKey() {
        try {
            const exportedPrivateKey = await window.crypto.subtle.exportKey(
                "pkcs8",
                privateKey
            );
            
            const privateKeyBase64 = arrayBufferToBase64(exportedPrivateKey);
            localStorage.setItem('e2ee_private_key', privateKeyBase64);
            
            console.log('💾 [E2EE] Private key stored');
        } catch (error) {
            console.error('❌ [E2EE] Failed to store private key:', error);
        }
    }
    
    // Load private key from localStorage
    async function loadPrivateKey() {
        try {
            const privateKeyBase64 = localStorage.getItem('e2ee_private_key');
            
            if (!privateKeyBase64) {
                console.log('🔐 [E2EE] No stored private key, generating new one');
                await generateKeyPair();
                return true;
            }
            
            const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
            
            privateKey = await window.crypto.subtle.importKey(
                "pkcs8",
                privateKeyBuffer,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256"
                },
                true,
                ["decrypt"]
            );
            
            console.log('✅ [E2EE] Private key loaded');
            return true;
            
        } catch (error) {
            console.error('❌ [E2EE] Failed to load private key:', error);
            return false;
        }
    }
    
    // Upload public key to server
    async function uploadPublicKey(publicKeyBase64) {
        try {
            const response = await fetch('/api/upload-public-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    public_key: publicKeyBase64
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ [E2EE] Public key uploaded to server');
            }
            
        } catch (error) {
            console.error('❌ [E2EE] Failed to upload public key:', error);
        }
    }
    
    // Fetch public key for a user
    async function fetchPublicKey(userId) {
        try {
            // Check cache first
            if (publicKeys[userId]) {
                return publicKeys[userId];
            }
            
            const response = await fetch(`/api/get-public-key/${userId}`, {
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success && data.public_key) {
                const publicKeyBuffer = base64ToArrayBuffer(data.public_key);
                
                const publicKey = await window.crypto.subtle.importKey(
                    "spki",
                    publicKeyBuffer,
                    {
                        name: "RSA-OAEP",
                        hash: "SHA-256"
                    },
                    true,
                    ["encrypt"]
                );
                
                publicKeys[userId] = publicKey;
                console.log('✅ [E2EE] Public key fetched for user:', userId);
                
                return publicKey;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ [E2EE] Failed to fetch public key:', error);
            return null;
        }
    }
    
    // Encrypt message
    async function encryptMessage(plainText, recipientUserId) {
        try {
            console.log('🔐 [E2EE] Encrypting message for:', recipientUserId);
            
            // Get recipient's public key
            const recipientPublicKey = await fetchPublicKey(recipientUserId);
            
            if (!recipientPublicKey) {
                console.warn(⚠️ [E2EE] No public key for recipient, sending unencrypted');
                return {
                    encrypted: false,
                    text: plainText
                };
            }
            
            // Generate AES key for this message
            const aesKey = await window.crypto.subtle.generateKey(
                {
                    name: "AES-GCM",
                    length: 256
                },
                true,
                ["encrypt", "decrypt"]
            );
            
            // Encrypt message with AES
            const encoder = new TextEncoder();
            const messageData = encoder.encode(plainText);
            
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            const encryptedMessage = await window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                aesKey,
                messageData
            );
            
            // Export AES key
            const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
            
            // Encrypt AES key with recipient's RSA public key
            const encryptedAesKey = await window.crypto.subtle.encrypt(
                {
                    name: "RSA-OAEP"
                },
                recipientPublicKey,
                exportedAesKey
            );
            
            // Convert to base64 for transmission
            const encryptedData = {
                encrypted: true,
                encryptedMessage: arrayBufferToBase64(encryptedMessage),
                encryptedKey: arrayBufferToBase64(encryptedAesKey),
                iv: arrayBufferToBase64(iv)
            };
            
            console.log('✅ [E2EE] Message encrypted');
            
            return encryptedData;
            
        } catch (error) {
            console.error('❌ [E2EE] Encryption failed:', error);
            // Fallback to unencrypted
            return {
                encrypted: false,
                text: plainText
            };
        }
    }
    
    // Decrypt message
    async function decryptMessage(encryptedData) {
        try {
            console.log('🔓 [E2EE] Decrypting message...');
            
            if (!encryptedData.encrypted) {
                return encryptedData.text;
            }
            
            if (!privateKey) {
                await loadPrivateKey();
            }
            
            if (!privateKey) {
                console.error('❌ [E2EE] No private key available');
                return '[🔒 Encrypted message - Cannot decrypt]';
            }
            
            // Decrypt AES key with RSA private key
            const encryptedAesKeyBuffer = base64ToArrayBuffer(encryptedData.encryptedKey);
            
            const aesKeyBuffer = await window.crypto.subtle.decrypt(
                {
                    name: "RSA-OAEP"
                },
                privateKey,
                encryptedAesKeyBuffer
            );
            
            // Import AES key
            const aesKey = await window.crypto.subtle.importKey(
                "raw",
                aesKeyBuffer,
                {
                    name: "AES-GCM",
                    length: 256
                },
                false,
                ["decrypt"]
            );
            
            // Decrypt message with AES key
            const encryptedMessageBuffer = base64ToArrayBuffer(encryptedData.encryptedMessage);
            const ivBuffer = base64ToArrayBuffer(encryptedData.iv);
            
            const decryptedMessage = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: ivBuffer
                },
                aesKey,
                encryptedMessageBuffer
            );
            
            const decoder = new TextDecoder();
            const plainText = decoder.decode(decryptedMessage);
            
            console.log('✅ [E2EE] Message decrypted');
            
            return plainText;
            
        } catch (error) {
            console.error('❌ [E2EE] Decryption failed:', error);
            return '[🔒 Encrypted message - Decryption failed]';
        }
    }
    
    // Helper: ArrayBuffer to Base64
    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
    
    // Helper: Base64 to ArrayBuffer
    function base64ToArrayBuffer(base64) {
        const binary = window.atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
    
    // Initialize encryption
    async function init() {
        try {
            console.log('🔐 [E2EE] Initializing...');
            
            const currentUser = window.AuthManager?.getCurrentUser();
            if (!currentUser) {
                console.log('🔐 [E2EE] No user logged in');
                return false;
            }
            
            // Load or generate keys
            const loaded = await loadPrivateKey();
            
            if (!loaded) {
                await generateKeyPair();
            }
            
            console.log('✅ [E2EE] Initialized successfully');
            
            // Show encryption status
            showEncryptionBadge(true);
            
            return true;
            
        } catch (error) {
            console.error('❌ [E2EE] Initialization failed:', error);
            return false;
        }
    }
    
    // Show encryption badge in UI
    function showEncryptionBadge(enabled) {
        const badge = document.getElementById('encryption-badge');
        if (badge) {
            badge.style.display = enabled ? 'flex' : 'none';
            badge.innerHTML = enabled ? 
                '🔒 <span style="font-size: 12px; margin-left: 4px;">Encrypted</span>' : 
                '';
        }
    }
    
    // Check if encryption is available
    function isAvailable() {
        return window.crypto && window.crypto.subtle;
    }
    
    // Expose to window
    window.E2EEncryption = {
        init: init,
        encrypt: encryptMessage,
        decrypt: decryptMessage,
        generateKeys: generateKeyPair,
        isAvailable: isAvailable,
        isEnabled: function() { return privateKey !== null; }
    };
    
    console.log('✅ [E2EEncryption] Module loaded');
    
})();