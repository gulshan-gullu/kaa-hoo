// ========================================
// 🤖 CLAUDE AI INTEGRATION - COMPLETE SYSTEM
// ========================================

(function() {
    'use strict';
    
    console.log('🤖 [CLAUDE-AI] Module loading...');
    
    // User preferences
    let claudeEnabled = localStorage.getItem('claude_enabled') === 'true';
    let claudeFeatures = JSON.parse(localStorage.getItem('claude_features') || JSON.stringify({
        chatCommand: true,
        smartReplies: true,
        autoTranslate: false,
        documentAnalysis: true,
        chatSummary: true,
        smartCompose: true,
        grammarCheck: true,
        sentimentAnalysis: false
    }));
    
    // Usage tracking
    let usageStats = JSON.parse(localStorage.getItem('claude_usage') || JSON.stringify({
        questionsAsked: 0,
        repliesGenerated: 0,
        documentsAnalyzed: 0,
        translationsMade: 0,
        lastReset: Date.now()
    }));
    
    // Free tier limits
    const FREE_LIMITS = {
        questionsPerDay: 10,
        repliesPerDay: 20,
        documentsPerDay: 3,
        translationsPerDay: 15
    };
    
    // Check if usage limit reached
    function checkUsageLimit(type) {
        resetDailyUsageIfNeeded();
        
        const limits = {
            questions: FREE_LIMITS.questionsPerDay,
            replies: FREE_LIMITS.repliesPerDay,
            documents: FREE_LIMITS.documentsPerDay,
            translations: FREE_LIMITS.translationsPerDay
        };
        
        const usage = {
            questions: usageStats.questionsAsked,
            replies: usageStats.repliesGenerated,
            documents: usageStats.documentsAnalyzed,
            translations: usageStats.translationsMade
        };
        
        if (usage[type] >= limits[type]) {
            showUpgradeModal(type);
            return false;
        }
        
        return true;
    }
    
    // Reset daily usage if needed
    function resetDailyUsageIfNeeded() {
        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;
        
        if (now - usageStats.lastReset > dayInMs) {
            usageStats = {
                questionsAsked: 0,
                repliesGenerated: 0,
                documentsAnalyzed: 0,
                translationsMade: 0,
                lastReset: now
            };
            saveUsageStats();
        }
    }
    
    // Save usage stats
    function saveUsageStats() {
        localStorage.setItem('claude_usage', JSON.stringify(usageStats));
    }
    
    // Increment usage
    function incrementUsage(type) {
        const typeMap = {
            questions: 'questionsAsked',
            replies: 'repliesGenerated',
            documents: 'documentsAnalyzed',
            translations: 'translationsMade'
        };
        
        if (typeMap[type]) {
            usageStats[typeMap[type]]++;
            saveUsageStats();
        }
    }
    
    // Call Claude API
    async function callClaudeAPI(messages, maxTokens = 1000) {
        try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: maxTokens,
                    messages: messages
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            return data.content[0].text;
            
        } catch (error) {
            console.error('🤖 [CLAUDE-AI] API Error:', error);
            showNotification('❌ Claude AI is temporarily unavailable');
            return null;
        }
    }
    
    // ========================================
    // FEATURE 1: /claude CHAT COMMAND
    // ========================================
    
    function initChatCommand() {
        // Intercept chat input
        const originalSendMessage = window.sendMessage;
        
        if (typeof originalSendMessage === 'function') {
            window.sendMessage = async function(message, recipientId) {
                // Check if it's a Claude command
                if (message.trim().startsWith('/claude ')) {
                    if (!claudeEnabled) {
                        showNotification('⚠️ Claude AI is disabled. Enable it in settings.');
                        return;
                    }
                    
                    if (!checkUsageLimit('questions')) return;
                    
                    const question = message.replace('/claude ', '').trim();
                    
                    // Show typing indicator
                    addClaudeTypingIndicator();
                    
                    // Call Claude API
                    const answer = await callClaudeAPI([
                        { role: "user", content: question }
                    ]);
                    
                    removeClaudeTypingIndicator();
                    
                    if (answer) {
                        // Display Claude's response
                        displayClaudeMessage(answer);
                        incrementUsage('questions');
                    }
                    
                    return; // Don't send the command as a regular message
                }
                
                // Regular message - proceed normally
                return originalSendMessage.call(this, message, recipientId);
            };
        }
    }
    
    // Add typing indicator for Claude
    function addClaudeTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'claude-typing-indicator';
        indicator.className = 'claude-typing-indicator';
        indicator.innerHTML = `
            <div class="claude-avatar">🤖</div>
            <div class="typing-bubble">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Remove typing indicator
    function removeClaudeTypingIndicator() {
        const indicator = document.getElementById('claude-typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // Display Claude message
    function displayClaudeMessage(text) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'claude-message-wrapper';
        messageDiv.innerHTML = `
            <div class="claude-message">
                <div class="claude-message-header">
                    <span class="claude-icon">🤖</span>
                    <span class="claude-label">Claude Assistant</span>
                    <span class="claude-badge">AI</span>
                </div>
                <div class="claude-message-text">${formatClaudeText(text)}</div>
                <div class="claude-message-actions">
                    <button class="claude-action-btn" onclick="window.copyClaudeMessage(this)" title="Copy">
                        📋 Copy
                    </button>
                    <button class="claude-action-btn" onclick="window.shareClaudeMessage(this)" title="Share">
                        📤 Share
                    </button>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Animate in
        setTimeout(() => {
            messageDiv.classList.add('visible');
        }, 10);
    }
    
    // Format Claude text with markdown-like features
    function formatClaudeText(text) {
        // Convert **bold** to <strong>
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Convert *italic* to <em>
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Convert line breaks
        text = text.replace(/\n/g, '<br>');
        
        // Convert bullet points
        text = text.replace(/^- (.+)$/gm, '• $1');
        
        return text;
    }
    
    // Copy Claude message
    window.copyClaudeMessage = function(button) {
        const messageDiv = button.closest('.claude-message');
        const textDiv = messageDiv.querySelector('.claude-message-text');
        const text = textDiv.innerText;
        
        navigator.clipboard.writeText(text).then(() => {
            showNotification('✅ Copied to clipboard');
        });
    };
    
    // Share Claude message
    window.shareClaudeMessage = function(button) {
        const messageDiv = button.closest('.claude-message');
        const textDiv = messageDiv.querySelector('.claude-message-text');
        const text = textDiv.innerText;
        
        // Insert into chat input
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.value = text;
            chatInput.focus();
        }
    };
    
    // ========================================
    // FEATURE 2: SMART REPLY SUGGESTIONS
    // ========================================
    
    let smartRepliesCache = {};
    
    async function generateSmartReplies(incomingMessage, context = '') {
        if (!claudeEnabled || !claudeFeatures.smartReplies) return;
        if (!checkUsageLimit('replies')) return;
        
        // Check cache
        const cacheKey = incomingMessage.trim().toLowerCase();
        if (smartRepliesCache[cacheKey]) {
            displaySmartReplies(smartRepliesCache[cacheKey]);
            return;
        }
        
        const prompt = `Generate 3 short, professional reply suggestions (max 10 words each) for this message: "${incomingMessage}"
        
Context: ${context || 'Professional business chat'}

Respond ONLY with a JSON array of 3 strings, nothing else. Example format:
["Reply 1", "Reply 2", "Reply 3"]`;
        
        const response = await callClaudeAPI([
            { role: "user", content: prompt }
        ], 200);
        
        if (response) {
            try {
                // Clean response
                let cleanResponse = response.trim();
                cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                
                const replies = JSON.parse(cleanResponse);
                
                if (Array.isArray(replies) && replies.length > 0) {
                    smartRepliesCache[cacheKey] = replies;
                    displaySmartReplies(replies);
                    incrementUsage('replies');
                }
            } catch (e) {
                console.error('🤖 [CLAUDE-AI] Failed to parse smart replies:', e);
            }
        }
    }
    
    // Display smart replies
    function displaySmartReplies(replies) {
        // Remove existing
        const existing = document.getElementById('smart-replies-container');
        if (existing) existing.remove();
        
        const container = document.createElement('div');
        container.id = 'smart-replies-container';
        container.className = 'smart-replies-container';
        container.innerHTML = `
            <div class="smart-replies-header">
                <span class="smart-replies-icon">✨</span>
                <span class="smart-replies-label">Quick Replies</span>
                <button class="smart-replies-close" onclick="this.closest('.smart-replies-container').remove()">✕</button>
            </div>
            <div class="smart-replies-buttons">
                ${replies.map(reply => `
                    <button class="smart-reply-btn" onclick="window.useSmartReply('${escapeHtml(reply)}')">
                        ${escapeHtml(reply)}
                    </button>
                `).join('')}
            </div>
        `;
        
        const chatInput = document.querySelector('.chat-input-container');
        if (chatInput) {
            chatInput.insertAdjacentElement('beforebegin', container);
        }
    }
    
    // Use smart reply
    window.useSmartReply = function(text) {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.value = text;
            chatInput.focus();
        }
        
        // Remove smart replies
        const container = document.getElementById('smart-replies-container');
        if (container) container.remove();
    };
    
    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ========================================
    // FEATURE 3: SMART COMPOSE
    // ========================================
    
    function createSmartComposeModal() {
        const modalHTML = `
            <div id="smart-compose-modal" class="smart-compose-modal" style="display: none;">
                <div class="smart-compose-overlay" onclick="window.closeSmartCompose()"></div>
                <div class="smart-compose-container">
                    <div class="smart-compose-header">
                        <h3>✨ Smart Compose</h3>
                        <button class="smart-compose-close" onclick="window.closeSmartCompose()">✕</button>
                    </div>
                    
                    <div class="smart-compose-content">
                        <div class="smart-compose-tabs">
                            <button class="smart-compose-tab active" data-mode="generate" onclick="window.switchComposeMode('generate')">
                                Generate
                            </button>
                            <button class="smart-compose-tab" data-mode="improve" onclick="window.switchComposeMode('improve')">
                                Improve
                            </button>
                            <button class="smart-compose-tab" data-mode="translate" onclick="window.switchComposeMode('translate')">
                                Translate
                            </button>
                            <button class="smart-compose-tab" data-mode="tone" onclick="window.switchComposeMode('tone')">
                                Change Tone
                            </button>
                        </div>
                        
                        <!-- Generate Mode -->
                        <div class="smart-compose-mode active" id="compose-mode-generate">
                            <label>What do you want to write about?</label>
                            <textarea id="compose-generate-prompt" placeholder="E.g., Write a professional email about project deadline extension..." rows="3"></textarea>
                            <button class="smart-compose-action-btn" onclick="window.generateText()">
                                ✨ Generate
                            </button>
                        </div>
                        
                        <!-- Improve Mode -->
                        <div class="smart-compose-mode" id="compose-mode-improve">
                            <label>Paste your text to improve:</label>
                            <textarea id="compose-improve-text" placeholder="Paste your message here..." rows="4"></textarea>
                            <button class="smart-compose-action-btn" onclick="window.improveText()">
                                🔧 Improve
                            </button>
                        </div>
                        
                        <!-- Translate Mode -->
                        <div class="smart-compose-mode" id="compose-mode-translate">
                            <label>Text to translate:</label>
                            <textarea id="compose-translate-text" placeholder="Enter text..." rows="3"></textarea>
                            <label>Target language:</label>
                            <select id="compose-translate-lang">
                                <option value="Hindi">Hindi (हिंदी)</option>
                                <option value="Spanish">Spanish (Español)</option>
                                <option value="French">French (Français)</option>
                                <option value="German">German (Deutsch)</option>
                                <option value="Chinese">Chinese (中文)</option>
                                <option value="Japanese">Japanese (日本語)</option>
                                <option value="Arabic">Arabic (العربية)</option>
                                <option value="Russian">Russian (Русский)</option>
                            </select>
                            <button class="smart-compose-action-btn" onclick="window.translateText()">
                                🌐 Translate
                            </button>
                        </div>
                        
                        <!-- Tone Mode -->
                        <div class="smart-compose-mode" id="compose-mode-tone">
                            <label>Your message:</label>
                            <textarea id="compose-tone-text" placeholder="Enter your message..." rows="3"></textarea>
                            <label>Change tone to:</label>
                            <div class="tone-buttons">
                                <button class="tone-btn" onclick="window.changeTone('professional')">👔 Professional</button>
                                <button class="tone-btn" onclick="window.changeTone('casual')">😊 Casual</button>
                                <button class="tone-btn" onclick="window.changeTone('friendly')">🤗 Friendly</button>
                                <button class="tone-btn" onclick="window.changeTone('formal')">🎩 Formal</button>
                            </div>
                        </div>
                        
                        <!-- Result Area -->
                        <div class="smart-compose-result" id="compose-result" style="display: none;">
                            <div class="smart-compose-result-header">
                                <span>✨ Result</span>
                                <div>
                                    <button class="compose-result-btn" onclick="window.copyComposeResult()">📋 Copy</button>
                                    <button class="compose-result-btn" onclick="window.useComposeResult()">✅ Use</button>
                                </div>
                            </div>
                            <div class="smart-compose-result-text" id="compose-result-text"></div>
                        </div>
                        
                        <!-- Loading -->
                        <div class="smart-compose-loading" id="compose-loading" style="display: none;">
                            <div class="loading-spinner"></div>
                            <p>Claude is thinking...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Switch compose mode
    window.switchComposeMode = function(mode) {
        document.querySelectorAll('.smart-compose-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.smart-compose-mode').forEach(modeDiv => {
            modeDiv.classList.remove('active');
        });
        
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        document.getElementById(`compose-mode-${mode}`).classList.add('active');
        
        // Hide result
        document.getElementById('compose-result').style.display = 'none';
    };
    
    // Generate text
    window.generateText = async function() {
        const prompt = document.getElementById('compose-generate-prompt').value.trim();
        
        if (!prompt) {
            showNotification('⚠️ Please describe what you want to write');
            return;
        }
        
        if (!checkUsageLimit('questions')) return;
        
        showComposeLoading();
        
        const result = await callClaudeAPI([
            { role: "user", content: `Write a message based on this request: ${prompt}\n\nProvide only the message text, no explanations.` }
        ], 500);
        
        hideComposeLoading();
        
        if (result) {
            showComposeResult(result);
            incrementUsage('questions');
        }
    };
    
    // Improve text
    window.improveText = async function() {
        const text = document.getElementById('compose-improve-text').value.trim();
        
        if (!text) {
            showNotification('⚠️ Please paste text to improve');
            return;
        }
        
        if (!checkUsageLimit('questions')) return;
        
        showComposeLoading();
        
        const result = await callClaudeAPI([
            { role: "user", content: `Improve this message (fix grammar, make it clearer and more professional):\n\n${text}\n\nProvide only the improved text, no explanations.` }
        ], 500);
        
        hideComposeLoading();
        
        if (result) {
            showComposeResult(result);
            incrementUsage('questions');
        }
    };
    
    // Translate text
    window.translateText = async function() {
        const text = document.getElementById('compose-translate-text').value.trim();
        const lang = document.getElementById('compose-translate-lang').value;
        
        if (!text) {
            showNotification('⚠️ Please enter text to translate');
            return;
        }
        
        if (!checkUsageLimit('translations')) return;
        
        showComposeLoading();
        
        const result = await callClaudeAPI([
            { role: "user", content: `Translate this to ${lang}:\n\n${text}\n\nProvide only the translation, no explanations.` }
        ], 500);
        
        hideComposeLoading();
        
        if (result) {
            showComposeResult(result);
            incrementUsage('translations');
        }
    };
    
    // Change tone
    window.changeTone = async function(tone) {
        const text = document.getElementById('compose-tone-text').value.trim();
        
        if (!text) {
            showNotification('⚠️ Please enter a message');
            return;
        }
        
        if (!checkUsageLimit('questions')) return;
        
        showComposeLoading();
        
        const result = await callClaudeAPI([
            { role: "user", content: `Rewrite this message in a ${tone} tone:\n\n${text}\n\nProvide only the rewritten text, no explanations.` }
        ], 500);
        
        hideComposeLoading();
        
        if (result) {
            showComposeResult(result);
            incrementUsage('questions');
        }
    };
    
    // Show compose loading
    function showComposeLoading() {
        document.getElementById('compose-loading').style.display = 'flex';
        document.getElementById('compose-result').style.display = 'none';
    }
    
    // Hide compose loading
    function hideComposeLoading() {
        document.getElementById('compose-loading').style.display = 'none';
    }
    
    // Show compose result
    function showComposeResult(text) {
        document.getElementById('compose-result-text').textContent = text;
        document.getElementById('compose-result').style.display = 'block';
    }
    
    // Copy compose result
    window.copyComposeResult = function() {
        const text = document.getElementById('compose-result-text').textContent;
        navigator.clipboard.writeText(text).then(() => {
            showNotification('✅ Copied to clipboard');
        });
    };
    
    // Use compose result
    window.useComposeResult = function() {
        const text = document.getElementById('compose-result-text').textContent;
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.value = text;
        }
        window.closeSmartCompose();
    };
    
    // Open/close smart compose
    window.openSmartCompose = function() {
        if (!claudeEnabled) {
            showNotification('⚠️ Claude AI is disabled. Enable it in settings.');
            return;
        }
        
        const modal = document.getElementById('smart-compose-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    };
    
    window.closeSmartCompose = function() {
        const modal = document.getElementById('smart-compose-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };
    
    // ========================================
    // FEATURE 4: CHAT SUMMARIZATION
    // ========================================
    
    window.summarizeChat = async function() {
        if (!claudeEnabled || !claudeFeatures.chatSummary) {
            showNotification('⚠️ Chat summarization is disabled');
            return;
        }
        
        if (!checkUsageLimit('questions')) return;
        
        // Get last 50 messages
        const chatMessages = document.querySelectorAll('#chat-messages .message-bubble');
        if (chatMessages.length === 0) {
            showNotification('⚠️ No messages to summarize');
            return;
        }
        
        const messages = Array.from(chatMessages).slice(-50).map(msg => {
            const sender = msg.closest('.message-received') ? 'Other' : 'Me';
            const text = msg.querySelector('.message-text')?.textContent || '';
            return `${sender}: ${text}`;
        }).join('\n');
        
        showNotification('🤖 Claude is summarizing chat...');
        
        const summary = await callClaudeAPI([
            { role: "user", content: `Summarize this conversation in 3-5 bullet points:\n\n${messages}` }
        ], 800);
        
        if (summary) {
            showSummaryModal(summary);
            incrementUsage('questions');
        }
    };
    
    // Show summary modal
    function showSummaryModal(summary) {
        const existingModal = document.getElementById('summary-modal');
        if (existingModal) existingModal.remove();
        
        const modalHTML = `
            <div id="summary-modal" class="summary-modal">
                <div class="summary-modal-overlay" onclick="document.getElementById('summary-modal').remove()"></div>
                <div class="summary-modal-container">
                    <div class="summary-modal-header">
                        <h3>📋 Chat Summary</h3>
                        <button class="summary-modal-close" onclick="document.getElementById('summary-modal').remove()">✕</button>
                    </div>
                    <div class="summary-modal-content">
                        <div class="summary-text">${formatClaudeText(summary)}</div>
                        <button class="summary-copy-btn" onclick="navigator.clipboard.writeText(\`${summary.replace(/`/g, '\\`')}\`).then(() => showNotification('✅ Copied'))">
                            📋 Copy Summary
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // ========================================
    // FEATURE 5: DOCUMENT ANALYSIS
    // ========================================
    
    window.analyzeDocument = async function(fileData, fileName) {
        if (!claudeEnabled || !claudeFeatures.documentAnalysis) {
            showNotification('⚠️ Document analysis is disabled');
            return;
        }
        
        if (!checkUsageLimit('documents')) return;
        
        showNotification('🤖 Claude is analyzing document...');
        
        // For now, we'll analyze text-based documents
        // In production, you'd extract text from PDF, DOC, etc.
        
        const analysis = await callClaudeAPI([
            { role: "user", content: `Analyze this document and provide:
1. Brief summary
2. Key points (3-5 bullets)
3. Main topics

Document: ${fileName}
Content: [Document analysis feature - full implementation would include document parsing]` }
        ], 1000);
        
        if (analysis) {
            showDocumentAnalysisModal(analysis, fileName);
            incrementUsage('documents');
        }
    };
    
    // Show document analysis modal
    function showDocumentAnalysisModal(analysis, fileName) {
        const existingModal = document.getElementById('doc-analysis-modal');
        if (existingModal) existingModal.remove();
        
        const modalHTML = `
            <div id="doc-analysis-modal" class="doc-analysis-modal">
                <div class="doc-analysis-overlay" onclick="document.getElementById('doc-analysis-modal').remove()"></div>
                <div class="doc-analysis-container">
                    <div class="doc-analysis-header">
                        <h3>📄 Document Analysis</h3>
                        <button class="doc-analysis-close" onclick="document.getElementById('doc-analysis-modal').remove()">✕</button>
                    </div>
                    <div class="doc-analysis-content">
                        <div class="doc-analysis-file">📎 ${escapeHtml(fileName)}</div>
                        <div class="doc-analysis-text">${formatClaudeText(analysis)}</div>
                        <div class="doc-analysis-actions">
                            <button class="doc-analysis-btn" onclick="navigator.clipboard.writeText(\`${analysis.replace(/`/g, '\\`')}\`).then(() => showNotification('✅ Copied'))">
                                📋 Copy Analysis
                            </button>
                            <button class="doc-analysis-btn" onclick="window.openDocumentQA('${escapeHtml(fileName)}')">
                                🤔 Ask Questions
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Document Q&A
    window.openDocumentQA = function(fileName) {
        // Close analysis modal
        const analysisModal = document.getElementById('doc-analysis-modal');
        if (analysisModal) analysisModal.remove();
        
        showNotification(`💡 Tip: Use "/claude" to ask questions about ${fileName}`);
    };
    
    // ========================================
    // FEATURE 6: CLAUDE SETTINGS PANEL
    // ========================================
    
    function createClaudeSettingsPanel() {
        const panelHTML = `
            <div id="claude-settings-panel" class="claude-settings-panel" style="display: none;">
                <div class="claude-settings-overlay" onclick="window.closeClaudeSettings()"></div>
                <div class="claude-settings-container">
                    <div class="claude-settings-header">
                        <h3>🤖 Claude AI Settings</h3>
                        <button class="claude-settings-close" onclick="window.closeClaudeSettings()">✕</button>
                    </div>
                    
                    <div class="claude-settings-content">
                        <!-- Master Toggle -->
                        <div class="claude-setting-item master-toggle">
                            <div class="claude-setting-info">
                                <div class="claude-setting-label">
                                    <span class="claude-icon-large">🤖</span>
                                    <span>Enable Claude AI</span>
                                </div>
                                <div class="claude-setting-desc">Turn Claude AI assistant on or off</div>
                            </div>
                            <label class="claude-toggle">
                                <input type="checkbox" id="claude-master-toggle" ${claudeEnabled ? 'checked' : ''} onchange="window.toggleClaudeMaster(this.checked)">
                                <span class="claude-toggle-slider"></span>
                            </label>
                        </div>
                        
                        <!-- Features -->
                        <div class="claude-features-section" id="claude-features-section" ${!claudeEnabled ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                            <h4>Features</h4>
                            
                            <div class="claude-setting-item">
                                <div class="claude-setting-info">
                                    <div class="claude-setting-label">💬 Chat Commands</div>
                                    <div class="claude-setting-desc">Use /claude to ask questions</div>
                                </div>
                                <label class="claude-toggle">
                                    <input type="checkbox" ${claudeFeatures.chatCommand ? 'checked' : ''} onchange="window.toggleClaudeFeature('chatCommand', this.checked)">
                                    <span class="claude-toggle-slider"></span>
                                </label>
                            </div>
                            
                            <div class="claude-setting-item">
                                <div class="claude-setting-info">
                                    <div class="claude-setting-label">✨ Smart Replies</div>
                                    <div class="claude-setting-desc">AI-generated quick replies</div>
                                </div>
                                <label class="claude-toggle">
                                    <input type="checkbox" ${claudeFeatures.smartReplies ? 'checked' : ''} onchange="window.toggleClaudeFeature('smartReplies', this.checked)">
                                    <span class="claude-toggle-slider"></span>
                                </label>
                            </div>
                            
                            <div class="claude-setting-item">
                                <div class="claude-setting-info">
                                    <div class="claude-setting-label">📝 Smart Compose</div>
                                    <div class="claude-setting-desc">AI writing assistant</div>
                                </div>
                                <label class="claude-toggle">
                                    <input type="checkbox" ${claudeFeatures.smartCompose ? 'checked' : ''} onchange="window.toggleClaudeFeature('smartCompose', this.checked)">
                                    <span class="claude-toggle-slider"></span>
                                </label>
                            </div>
                            
                            <div class="claude-setting-item">
                                <div class="claude-setting-info">
                                    <div class="claude-setting-label">📋 Chat Summaries</div>
                                    <div class="claude-setting-desc">Summarize long conversations</div>
                                </div>
                                <label class="claude-toggle">
                                    <input type="checkbox" ${claudeFeatures.chatSummary ? 'checked' : ''} onchange="window.toggleClaudeFeature('chatSummary', this.checked)">
                                    <span class="claude-toggle-slider"></span>
                                </label>
                            </div>
                            
                            <div class="claude-setting-item">
                                <div class="claude-setting-info">
                                    <div class="claude-setting-label">📄 Document Analysis</div>
                                    <div class="claude-setting-desc">AI document insights</div>
                                </div>
                                <label class="claude-toggle">
                                    <input type="checkbox" ${claudeFeatures.documentAnalysis ? 'checked' : ''} onchange="window.toggleClaudeFeature('documentAnalysis', this.checked)">
                                    <span class="claude-toggle-slider"></span>
                                </label>
                            </div>
                            
                            <div class="claude-setting-item">
                                <div class="claude-setting-info">
                                    <div class="claude-setting-label">🔧 Grammar Check</div>
                                    <div class="claude-setting-desc">Auto-correct before sending</div>
                                </div>
                                <label class="claude-toggle">
                                    <input type="checkbox" ${claudeFeatures.grammarCheck ? 'checked' : ''} onchange="window.toggleClaudeFeature('grammarCheck', this.checked)">
                                    <span class="claude-toggle-slider"></span>
                                </label>
                            </div>
                            
                            <div class="claude-setting-item">
                                <div class="claude-setting-info">
                                    <div class="claude-setting-label">🌐 Auto-Translate</div>
                                    <div class="claude-setting-desc">Translate messages automatically</div>
                                </div>
                                <label class="claude-toggle">
                                    <input type="checkbox" ${claudeFeatures.autoTranslate ? 'checked' : ''} onchange="window.toggleClaudeFeature('autoTranslate', this.checked)">
                                    <span class="claude-toggle-slider"></span>
                                </label>
                            </div>
                            
                            <div class="claude-setting-item">
                                <div class="claude-setting-info">
                                    <div class="claude-setting-label">😊 Sentiment Analysis</div>
                                    <div class="claude-setting-desc">Analyze message emotions</div>
                                </div>
                                <label class="claude-toggle">
                                    <input type="checkbox" ${claudeFeatures.sentimentAnalysis ? 'checked' : ''} onchange="window.toggleClaudeFeature('sentimentAnalysis', this.checked)">
                                    <span class="claude-toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Usage Stats -->
                        <div class="claude-usage-section">
                            <h4>Today's Usage (Free Tier)</h4>
                            <div class="claude-usage-stats">
                                <div class="claude-usage-item">
                                    <div class="claude-usage-label">Questions</div>
                                    <div class="claude-usage-bar">
                                        <div class="claude-usage-fill" style="width: ${(usageStats.questionsAsked / FREE_LIMITS.questionsPerDay) * 100}%"></div>
                                    </div>
                                    <div class="claude-usage-text">${usageStats.questionsAsked} / ${FREE_LIMITS.questionsPerDay}</div>
                                </div>
                                
                                <div class="claude-usage-item">
                                    <div class="claude-usage-label">Smart Replies</div>
                                    <div class="claude-usage-bar">
                                        <div class="claude-usage-fill" style="width: ${(usageStats.repliesGenerated / FREE_LIMITS.repliesPerDay) * 100}%"></div>
                                    </div>
                                    <div class="claude-usage-text">${usageStats.repliesGenerated} / ${FREE_LIMITS.repliesPerDay}</div>
                                </div>
                                
                                <div class="claude-usage-item">
                                    <div class="claude-usage-label">Documents</div>
                                    <div class="claude-usage-bar">
                                        <div class="claude-usage-fill" style="width: ${(usageStats.documentsAnalyzed / FREE_LIMITS.documentsPerDay) * 100}%"></div>
                                    </div>
                                    <div class="claude-usage-text">${usageStats.documentsAnalyzed} / ${FREE_LIMITS.documentsPerDay}</div>
                                </div>
                                
                                <div class="claude-usage-item">
                                    <div class="claude-usage-label">Translations</div>
                                    <div class="claude-usage-bar">
                                        <div class="claude-usage-fill" style="width: ${(usageStats.translationsMade / FREE_LIMITS.translationsPerDay) * 100}%"></div>
                                    </div>
                                    <div class="claude-usage-text">${usageStats.translationsMade} / ${FREE_LIMITS.translationsPerDay}</div>
                                </div>
                            </div>
                            
                            <button class="claude-upgrade-btn" onclick="showNotification('💎 Premium features coming soon!')">
                                💎 Upgrade to Pro - Unlimited Usage
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', panelHTML);
    }
    
    // Toggle Claude master switch
    window.toggleClaudeMaster = function(enabled) {
        claudeEnabled = enabled;
        localStorage.setItem('claude_enabled', enabled);
        
        const featuresSection = document.getElementById('claude-features-section');
        if (featuresSection) {
            if (enabled) {
                featuresSection.style.opacity = '1';
                featuresSection.style.pointerEvents = 'auto';
                showNotification('✅ Claude AI enabled');
            } else {
                featuresSection.style.opacity = '0.5';
                featuresSection.style.pointerEvents = 'none';
                showNotification('❌ Claude AI disabled');
            }
        }
    };
    
    // Toggle Claude feature
    window.toggleClaudeFeature = function(feature, enabled) {
        claudeFeatures[feature] = enabled;
        localStorage.setItem('claude_features', JSON.stringify(claudeFeatures));
        console.log(`🤖 [CLAUDE-AI] Feature ${feature}: ${enabled ? 'enabled' : 'disabled'}`);
    };
    
    // Open/close Claude settings
    window.openClaudeSettings = function() {
        const panel = document.getElementById('claude-settings-panel');
        if (panel) {
            panel.style.display = 'flex';
        }
    };
    
    window.closeClaudeSettings = function() {
        const panel = document.getElementById('claude-settings-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    };
    
    // ========================================
    // FEATURE 7: UPGRADE MODAL
    // ========================================
    
    function showUpgradeModal(limitType) {
        const limitNames = {
            questions: 'daily questions',
            replies: 'smart replies',
            documents: 'document analyses',
            translations: 'translations'
        };
        
        const existingModal = document.getElementById('upgrade-modal');
        if (existingModal) existingModal.remove();
        
        const modalHTML = `
            <div id="upgrade-modal" class="upgrade-modal">
                <div class="upgrade-overlay" onclick="document.getElementById('upgrade-modal').remove()"></div>
                <div class="upgrade-container">
                    <div class="upgrade-header">
                        <h3>💎 Upgrade to Pro</h3>
                        <button class="upgrade-close" onclick="document.getElementById('upgrade-modal').remove()">✕</button>
                    </div>
                    <div class="upgrade-content">
                        <div class="upgrade-limit-notice">
                            ⚠️ You've reached your free tier limit for ${limitNames[limitType]}
                        </div>
                        
                        <div class="upgrade-plans">
                            <div class="upgrade-plan">
                                <h4>Free</h4>
                                <div class="upgrade-price">$0</div>
                                <ul class="upgrade-features">
                                    <li>✅ 10 questions/day</li>
                                    <li>✅ 20 smart replies/day</li>
                                    <li>✅ 3 documents/day</li>
                                    <li>✅ 15 translations/day</li>
                                </ul>
                                <button class="upgrade-plan-btn current">Current Plan</button>
                            </div>
                            
                            <div class="upgrade-plan featured">
                                <div class="upgrade-badge">POPULAR</div>
                                <h4>Pro</h4>
                                <div class="upgrade-price">$5<span>/month</span></div>
                                <ul class="upgrade-features">
                                    <li>✅ Unlimited questions</li>
                                    <li>✅ Unlimited smart replies</li>
                                    <li>✅ Unlimited documents</li>
                                    <li>✅ Unlimited translations</li>
                                    <li>✅ Priority support</li>
                                    <li>✅ Advanced features</li>
                                </ul>
                                <button class="upgrade-plan-btn pro" onclick="showNotification('💎 Coming soon!')">
                                    Upgrade Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // ========================================
    // UI INTEGRATION
    // ========================================
    
    // Add Claude buttons to UI
    function addClaudeUI() {
        setTimeout(() => {
            // Add Claude Settings button to header
            const headerButtons = document.querySelector('.header-buttons');
            if (headerButtons && !document.getElementById('claude-settings-btn')) {
                const claudeBtn = document.createElement('button');
                claudeBtn.id = 'claude-settings-btn';
                claudeBtn.className = 'settings-btn';
                claudeBtn.innerHTML = '🤖 Claude AI';
                claudeBtn.onclick = window.openClaudeSettings;
                
                headerButtons.insertBefore(claudeBtn, headerButtons.firstChild);
            }
            
            // Add Smart Compose button to chat input
            const inputWrapper = document.querySelector('.chat-input-wrapper');
            if (inputWrapper && !document.getElementById('smart-compose-btn')) {
                const composeBtn = document.createElement('button');
                composeBtn.id = 'smart-compose-btn';
                composeBtn.className = 'input-icon';
                composeBtn.title = 'Smart Compose (AI)';
                composeBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                    </svg>
                `;
                composeBtn.onclick = window.openSmartCompose;
                
                const emojiBtn = document.getElementById('emoji-btn');
                if (emojiBtn) {
                    emojiBtn.parentNode.insertBefore(composeBtn, emojiBtn);
                }
            }
            
            // Add Summarize button to chat header
            const chatHeader = document.querySelector('.chat-header');
            if (chatHeader && !document.getElementById('summarize-chat-btn')) {
                const summarizeBtn = document.createElement('button');
                summarizeBtn.id = 'summarize-chat-btn';
                summarizeBtn.className = 'call-btn';
                summarizeBtn.title = 'Summarize Chat (AI)';
                summarizeBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="21" y1="10" x2="3" y2="10"></line>
                        <line x1="21" y1="6" x2="3" y2="6"></line>
                        <line x1="21" y1="14" x2="3" y2="14"></line>
                        <line x1="21" y1="18" x2="3" y2="18"></line>
                    </svg>
                `;
                summarizeBtn.onclick = window.summarizeChat;
                
                const callButtons = chatHeader.querySelector('.call-buttons');
                if (callButtons) {
                    callButtons.appendChild(summarizeBtn);
                }
            }
        }, 2000);
    }
    
    // Show notification
    function showNotification(message) {
        if (window.showToast) {
            window.showToast(message);
        } else {
            const notification = document.createElement('div');
            notification.className = 'claude-notification';
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(37, 211, 102, 0.95);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                z-index: 999999;
                animation: slideInRight 0.3s ease-out;
                font-size: 14px;
                font-weight: 500;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    function init() {
        createSmartComposeModal();
        createClaudeSettingsPanel();
        initChatCommand();
        addClaudeUI();
        addStyles();
        
        resetDailyUsageIfNeeded();
        
        console.log('✅ [CLAUDE-AI] Complete AI integration ready!');
        console.log(`🤖 Claude AI: ${claudeEnabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`📊 Today's usage: ${usageStats.questionsAsked} questions, ${usageStats.repliesGenerated} replies`);
        
        // Show welcome message if first time
        if (!localStorage.getItem('claude_welcomed')) {
            setTimeout(() => {
                showNotification('🤖 Claude AI is now available! Click "Claude AI" in the header to configure.');
                localStorage.setItem('claude_welcomed', 'true');
            }, 3000);
        }
    }
    
    // Add styles...
    // Add styles
    function addStyles() {
        const styles = `
            <style>
            /* ========================================
               CLAUDE AI STYLES
               ======================================== */
            
            /* Claude Typing Indicator */
            .claude-typing-indicator {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 15px;
                margin: 10px 0;
                animation: fadeIn 0.3s ease-out;
            }
            
            .claude-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            }
            
            .typing-bubble {
                background: rgba(255, 255, 255, 0.1);
                padding: 12px 18px;
                border-radius: 18px;
                display: flex;
                gap: 5px;
            }
            
            .typing-bubble span {
                width: 8px;
                height: 8px;
                background: rgba(255, 255, 255, 0.6);
                border-radius: 50%;
                animation: typingDot 1.4s infinite;
            }
            
            .typing-bubble span:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .typing-bubble span:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            @keyframes typingDot {
                0%, 60%, 100% {
                    transform: translateY(0);
                    opacity: 0.6;
                }
                30% {
                    transform: translateY(-10px);
                    opacity: 1;
                }
            }
            
            /* Claude Messages */
            .claude-message-wrapper {
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s ease-out;
                margin: 15px 0;
            }
            
            .claude-message-wrapper.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .claude-message {
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
                border: 1px solid rgba(102, 126, 234, 0.3);
                border-radius: 15px;
                padding: 15px;
                max-width: 80%;
            }
            
            .claude-message-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 10px;
            }
            
            .claude-icon {
                font-size: 20px;
            }
            
            .claude-label {
                color: #667eea;
                font-weight: 600;
                font-size: 14px;
            }
            
            .claude-badge {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 600;
                letter-spacing: 0.5px;
            }
            
            .claude-message-text {
                color: #e9edef;
                line-height: 1.6;
                font-size: 14px;
                margin-bottom: 12px;
            }
            
            .claude-message-text strong {
                color: #667eea;
            }
            
            .claude-message-actions {
                display: flex;
                gap: 10px;
            }
            
            .claude-action-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #e9edef;
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .claude-action-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateY(-2px);
            }
            
            /* Smart Replies */
            .smart-replies-container {
                background: rgba(17, 27, 33, 0.95);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding: 15px;
                animation: slideUp 0.3s ease-out;
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .smart-replies-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
            }
            
            .smart-replies-icon {
                font-size: 18px;
                margin-right: 8px;
            }
            
            .smart-replies-label {
                color: #8696a0;
                font-size: 13px;
                font-weight: 600;
            }
            
            .smart-replies-close {
                background: none;
                border: none;
                color: #8696a0;
                font-size: 18px;
                cursor: pointer;
                padding: 5px;
                border-radius: 50%;
                transition: all 0.2s;
            }
            
            .smart-replies-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #e9edef;
            }
            
            .smart-replies-buttons {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .smart-reply-btn {
                background: rgba(102, 126, 234, 0.2);
                border: 1px solid rgba(102, 126, 234, 0.4);
                color: #667eea;
                padding: 10px 18px;
                border-radius: 20px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
                white-space: nowrap;
            }
            
            .smart-reply-btn:hover {
                background: rgba(102, 126, 234, 0.3);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            
            /* Smart Compose Modal */
            .smart-compose-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 100004;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .smart-compose-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(8px);
            }
            
            .smart-compose-container {
                position: relative;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                background: #1f2c33;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: modalScale 0.3s ease-out;
                display: flex;
                flex-direction: column;
            }
            
            @keyframes modalScale {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            .smart-compose-header {
                padding: 20px;
                background: rgba(0, 0, 0, 0.3);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .smart-compose-header h3 {
                margin: 0;
                color: #e9edef;
                font-size: 20px;
                font-weight: 500;
            }
            
            .smart-compose-close {
                background: none;
                border: none;
                color: #8696a0;
                font-size: 24px;
                cursor: pointer;
                padding: 5px 10px;
                border-radius: 50%;
                transition: all 0.2s;
            }
            
            .smart-compose-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #e9edef;
            }
            
            .smart-compose-content {
                flex: 1;
                overflow-y: auto;
                padding: 25px;
            }
            
            .smart-compose-tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 25px;
                border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 15px;
            }
            
            .smart-compose-tab {
                background: none;
                border: none;
                color: #8696a0;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .smart-compose-tab:hover {
                background: rgba(255, 255, 255, 0.05);
                color: #e9edef;
            }
            
            .smart-compose-tab.active {
                background: rgba(102, 126, 234, 0.2);
                color: #667eea;
            }
            
            .smart-compose-mode {
                display: none;
            }
            
            .smart-compose-mode.active {
                display: block;
                animation: fadeIn 0.3s ease-out;
            }
            
            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
            
            .smart-compose-mode label {
                display: block;
                color: #8696a0;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 8px;
            }
            
            .smart-compose-mode textarea,
            .smart-compose-mode select {
                width: 100%;
                padding: 12px 15px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                color: #e9edef;
                font-size: 14px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                margin-bottom: 15px;
                resize: vertical;
                transition: all 0.2s;
            }
            
            .smart-compose-mode textarea:focus,
            .smart-compose-mode select:focus {
                outline: none;
                border-color: #667eea;
                background: rgba(0, 0, 0, 0.4);
            }
            
            .smart-compose-action-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                width: 100%;
            }
            
            .smart-compose-action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }
            
            .tone-buttons {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            
            .tone-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #e9edef;
                padding: 12px;
                border-radius: 10px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .tone-btn:hover {
                background: rgba(102, 126, 234, 0.2);
                border-color: #667eea;
                transform: translateY(-2px);
            }
            
            .smart-compose-result {
                margin-top: 20px;
                padding: 20px;
                background: rgba(37, 211, 102, 0.1);
                border: 1px solid rgba(37, 211, 102, 0.3);
                border-radius: 12px;
            }
            
            .smart-compose-result-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .smart-compose-result-header span {
                color: #25d366;
                font-weight: 600;
                font-size: 14px;
            }
            
            .compose-result-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #e9edef;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
                margin-left: 8px;
            }
            
            .compose-result-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .smart-compose-result-text {
                color: #e9edef;
                line-height: 1.6;
                font-size: 14px;
            }
            
            .smart-compose-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
                gap: 20px;
            }
            
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(102, 126, 234, 0.2);
                border-top-color: #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }
            
            .smart-compose-loading p {
                color: #8696a0;
                font-size: 14px;
            }
            
            /* Claude Settings Panel */
            .claude-settings-panel {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 100005;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .claude-settings-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(8px);
            }
            
            .claude-settings-container {
                position: relative;
                width: 90%;
                max-width: 700px;
                max-height: 90vh;
                background: #1f2c33;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: modalScale 0.3s ease-out;
                display: flex;
                flex-direction: column;
            }
            
            .claude-settings-header {
                padding: 20px;
                background: rgba(0, 0, 0, 0.3);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .claude-settings-header h3 {
                margin: 0;
                color: #e9edef;
                font-size: 20px;
                font-weight: 500;
            }
            
            .claude-settings-close {
                background: none;
                border: none;
                color: #8696a0;
                font-size: 24px;
                cursor: pointer;
                padding: 5px 10px;
                border-radius: 50%;
                transition: all 0.2s;
            }
            
            .claude-settings-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #e9edef;
            }
            
            .claude-settings-content {
                flex: 1;
                overflow-y: auto;
                padding: 25px;
            }
            
            .claude-setting-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 18px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 12px;
                margin-bottom: 12px;
                transition: all 0.2s;
            }
            
            .claude-setting-item:hover {
                background: rgba(255, 255, 255, 0.05);
            }
            
            .claude-setting-item.master-toggle {
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
                border: 1px solid rgba(102, 126, 234, 0.3);
                margin-bottom: 25px;
            }
            
            .claude-setting-info {
                flex: 1;
            }
            
            .claude-setting-label {
                color: #e9edef;
                font-size: 15px;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 5px;
            }
            
            .claude-icon-large {
                font-size: 24px;
            }
            
            .claude-setting-desc {
                color: #8696a0;
                font-size: 13px;
                line-height: 1.4;
            }
            
            .claude-toggle {
                position: relative;
                width: 50px;
                height: 28px;
                display: inline-block;
                flex-shrink: 0;
            }
            
            .claude-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .claude-toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.2);
                transition: 0.3s;
                border-radius: 28px;
            }
            
            .claude-toggle-slider:before {
                position: absolute;
                content: "";
                height: 20px;
                width: 20px;
                left: 4px;
                bottom: 4px;
                background: white;
                transition: 0.3s;
                border-radius: 50%;
            }
            
            .claude-toggle input:checked + .claude-toggle-slider {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            
            .claude-toggle input:checked + .claude-toggle-slider:before {
                transform: translateX(22px);
            }
            
            .claude-features-section {
                transition: all 0.3s;
            }
            
            .claude-features-section h4,
            .claude-usage-section h4 {
                color: #8696a0;
                font-size: 13px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 25px 0 15px 0;
            }
            
            .claude-usage-section {
                margin-top: 30px;
                padding-top: 25px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .claude-usage-stats {
                margin-bottom: 20px;
            }
            
            .claude-usage-item {
                margin-bottom: 15px;
            }
            
            .claude-usage-label {
                color: #e9edef;
                font-size: 13px;
                font-weight: 500;
                margin-bottom: 8px;
            }
            
            .claude-usage-bar {
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 5px;
            }
            
            .claude-usage-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                border-radius: 10px;
                transition: width 0.3s ease-out;
            }
            
            .claude-usage-text {
                color: #8696a0;
                font-size: 12px;
            }
            
            .claude-upgrade-btn {
                width: 100%;
                padding: 15px;
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
            }
            
            .claude-upgrade-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
            }
            
            /* Summary Modal */
            .summary-modal,
            .doc-analysis-modal,
            .upgrade-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 100006;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .summary-modal-overlay,
            .doc-analysis-overlay,
            .upgrade-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(8px);
            }
            
            .summary-modal-container,
            .doc-analysis-container,
            .upgrade-container {
                position: relative;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                background: #1f2c33;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: modalScale 0.3s ease-out;
                display: flex;
                flex-direction: column;
            }
            
            .summary-modal-header,
            .doc-analysis-header,
            .upgrade-header {
                padding: 20px;
                background: rgba(0, 0, 0, 0.3);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .summary-modal-header h3,
            .doc-analysis-header h3,
            .upgrade-header h3 {
                margin: 0;
                color: #e9edef;
                font-size: 20px;
                font-weight: 500;
            }
            
            .summary-modal-close,
            .doc-analysis-close,
            .upgrade-close {
                background: none;
                border: none;
                color: #8696a0;
                font-size: 24px;
                cursor: pointer;
                padding: 5px 10px;
                border-radius: 50%;
                transition: all 0.2s;
            }
            
            .summary-modal-close:hover,
            .doc-analysis-close:hover,
            .upgrade-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #e9edef;
            }
            
            .summary-modal-content,
            .doc-analysis-content,
            .upgrade-content {
                flex: 1;
                overflow-y: auto;
                padding: 25px;
            }
            
            .summary-text,
            .doc-analysis-text {
                color: #e9edef;
                line-height: 1.8;
                font-size: 14px;
                margin-bottom: 20px;
            }
            
            .summary-copy-btn,
            .doc-analysis-btn {
                background: rgba(102, 126, 234, 0.2);
                border: 1px solid rgba(102, 126, 234, 0.4);
                color: #667eea;
                padding: 12px 24px;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .summary-copy-btn:hover,
            .doc-analysis-btn:hover {
                background: rgba(102, 126, 234, 0.3);
                transform: translateY(-2px);
            }
            
            .doc-analysis-file {
                color: #8696a0;
                font-size: 13px;
                padding: 12px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                margin-bottom: 15px;
            }
            
            .doc-analysis-actions {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            
            /* Upgrade Modal */
            .upgrade-limit-notice {
                background: rgba(245, 158, 11, 0.2);
                border: 1px solid rgba(245, 158, 11, 0.4);
                color: #f59e0b;
                padding: 15px;
                border-radius: 12px;
                margin-bottom: 25px;
                font-size: 14px;
                text-align: center;
            }
            
            .upgrade-plans {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
            }
            
            .upgrade-plan {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 25px;
                text-align: center;
                position: relative;
            }
            
            .upgrade-plan.featured {
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
                border-color: rgba(102, 126, 234, 0.4);
            }
            
            .upgrade-badge {
                position: absolute;
                top: -10px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 4px 12px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.5px;
            }
            
            .upgrade-plan h4 {
                color: #e9edef;
                font-size: 18px;
                margin: 0 0 15px 0;
            }
            
            .upgrade-price {
                color: #667eea;
                font-size: 36px;
                font-weight: 700;
                margin-bottom: 20px;
            }
            
            .upgrade-price span {
                font-size: 16px;
                font-weight: 400;
                color: #8696a0;
            }
            
            .upgrade-features {
                list-style: none;
                padding: 0;
                margin: 0 0 25px 0;
                text-align: left;
            }
            
            .upgrade-features li {
                color: #e9edef;
                font-size: 13px;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .upgrade-features li:last-child {
                border-bottom: none;
            }
            
            .upgrade-plan-btn {
                width: 100%;
                padding: 12px;
                border: none;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .upgrade-plan-btn.current {
                background: rgba(255, 255, 255, 0.1);
                color: #8696a0;
                cursor: default;
            }
            
            .upgrade-plan-btn.pro {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            }
            
            .upgrade-plan-btn.pro:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .claude-message {
                    max-width: 95%;
                }
                
                .smart-replies-buttons {
                    flex-direction: column;
                }
                
                .smart-reply-btn {
                    width: 100%;
                }
                
                .smart-compose-tabs {
                    overflow-x: auto;
                    flex-wrap: nowrap;
                }
                
                .upgrade-plans {
                    grid-template-columns: 1fr;
                }
            }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();