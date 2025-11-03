// ========================================
// 🔍 ADVANCED MESSAGE SEARCH MODULE
// ========================================

(function() {
    'use strict';
    
    console.log('🔍 [MESSAGE-SEARCH] Module loading...');
    
    let searchHistory = JSON.parse(localStorage.getItem('search_history') || '[]');
    
    // Create search modal
    function createSearchModal() {
        const modalHTML = `
            <div id="search-modal" class="search-modal" style="display: none;">
                <div class="search-modal-overlay" onclick="window.closeSearchModal()"></div>
                <div class="search-modal-container">
                    <div class="search-modal-header">
                        <div class="search-input-wrapper">
                            <span class="search-icon">🔍</span>
                            <input type="text" id="global-search-input" placeholder="Search messages, contacts, or media..." autocomplete="off">
                            <button class="search-clear-btn" id="search-clear-btn" style="display: none;">✕</button>
                        </div>
                        <button class="search-close-btn" onclick="window.closeSearchModal()">✕</button>
                    </div>
                    
                    <div class="search-filters">
                        <button class="search-filter-btn active" data-filter="all">All</button>
                        <button class="search-filter-btn" data-filter="messages">Messages</button>
                        <button class="search-filter-btn" data-filter="contacts">Contacts</button>
                        <button class="search-filter-btn" data-filter="media">Media</button>
                    </div>
                    
                    <div class="search-content">
                        <div class="search-history" id="search-history">
                            <h4>Recent Searches</h4>
                            <div class="search-history-items" id="search-history-items"></div>
                        </div>
                        
                        <div class="search-results" id="search-results" style="display: none;">
                            <div class="search-results-header">
                                <span id="search-results-count">0 results</span>
                            </div>
                            <div class="search-results-list" id="search-results-list"></div>
                        </div>
                        
                        <div class="search-empty" id="search-empty" style="display: none;">
                            <div class="search-empty-icon">🔍</div>
                            <p>No results found</p>
                            <span>Try different keywords</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        attachSearchEvents();
    }
    
    // Attach search events
    function attachSearchEvents() {
        const searchInput = document.getElementById('global-search-input');
        const clearBtn = document.getElementById('search-clear-btn');
        const filterBtns = document.querySelectorAll('.search-filter-btn');
        
        let currentFilter = 'all';
        let searchTimeout;
        
        // Search input
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Show/hide clear button
            clearBtn.style.display = query ? 'block' : 'none';
            
            // Debounce search
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (query.length > 0) {
                    performSearch(query, currentFilter);
                } else {
                    showSearchHistory();
                }
            }, 300);
        });
        
        // Clear button
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            showSearchHistory();
            searchInput.focus();
        });
        
        // Filter buttons
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                
                const query = searchInput.value.trim();
                if (query) {
                    performSearch(query, currentFilter);
                }
            });
        });
        
        // Enter key to search
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    addToSearchHistory(query);
                    performSearch(query, currentFilter);
                }
            }
        });
    }
    
    // Perform search
    function performSearch(query, filter) {
        console.log('🔍 [MESSAGE-SEARCH] Searching:', query, 'Filter:', filter);
        
        const results = {
            messages: searchMessages(query),
            contacts: searchContacts(query),
            media: searchMedia(query)
        };
        
        let filteredResults = [];
        
        if (filter === 'all') {
            filteredResults = [
                ...results.messages,
                ...results.contacts,
                ...results.media
            ];
        } else {
            filteredResults = results[filter] || [];
        }
        
        displaySearchResults(filteredResults, query);
    }
    
    // Search messages
    function searchMessages(query) {
        const messages = JSON.parse(localStorage.getItem('chat_messages') || '{}');
        const results = [];
        
        Object.keys(messages).forEach(chatId => {
            const chatMessages = messages[chatId] || [];
            chatMessages.forEach(msg => {
                if (msg.text && msg.text.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        type: 'message',
                        chatId: chatId,
                        message: msg,
                        highlight: highlightText(msg.text, query)
                    });
                }
            });
        });
        
        return results;
    }
    
    // Search contacts
    function searchContacts(query) {
        const contacts = window.allUsers || [];
        return contacts
            .filter(contact => 
                contact.name.toLowerCase().includes(query.toLowerCase()) ||
                contact.id.toLowerCase().includes(query.toLowerCase())
            )
            .map(contact => ({
                type: 'contact',
                contact: contact,
                highlight: highlightText(contact.name, query)
            }));
    }
    
    // Search media
    function searchMedia(query) {
        const messages = JSON.parse(localStorage.getItem('chat_messages') || '{}');
        const results = [];
        
        Object.keys(messages).forEach(chatId => {
            const chatMessages = messages[chatId] || [];
            chatMessages.forEach(msg => {
                if (msg.file && msg.file.name.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        type: 'media',
                        chatId: chatId,
                        message: msg,
                        highlight: highlightText(msg.file.name, query)
                    });
                }
            });
        });
        
        return results;
    }
    
    // Highlight matching text
    function highlightText(text, query) {
        if (!text || !query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    // Display search results
    function displaySearchResults(results, query) {
        const historyDiv = document.getElementById('search-history');
        const resultsDiv = document.getElementById('search-results');
        const emptyDiv = document.getElementById('search-empty');
        const resultsList = document.getElementById('search-results-list');
        const resultsCount = document.getElementById('search-results-count');
        
        historyDiv.style.display = 'none';
        
        if (results.length === 0) {
            resultsDiv.style.display = 'none';
            emptyDiv.style.display = 'flex';
            return;
        }
        
        emptyDiv.style.display = 'none';
        resultsDiv.style.display = 'block';
        
        resultsCount.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;
        
        resultsList.innerHTML = '';
        
        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            
            if (result.type === 'message') {
                item.innerHTML = `
                    <div class="search-result-icon">💬</div>
                    <div class="search-result-content">
                        <div class="search-result-title">Message from ${result.message.sender}</div>
                        <div class="search-result-text">${result.highlight}</div>
                        <div class="search-result-time">${formatTime(result.message.timestamp)}</div>
                    </div>
                `;
                item.onclick = () => {
                    window.closeSearchModal();
                    // Navigate to chat
                    if (window.loadChat) {
                        window.loadChat(result.chatId);
                    }
                };
            } else if (result.type === 'contact') {
                item.innerHTML = `
                    <div class="search-result-icon">${result.contact.name.charAt(0).toUpperCase()}</div>
                    <div class="search-result-content">
                        <div class="search-result-title">${result.highlight}</div>
                        <div class="search-result-text">${result.contact.role}</div>
                    </div>
                `;
                item.onclick = () => {
                    window.closeSearchModal();
                    if (window.loadChat) {
                        window.loadChat(result.contact.id);
                    }
                };
            } else if (result.type === 'media') {
                item.innerHTML = `
                    <div class="search-result-icon">${result.message.file.icon || '📎'}</div>
                    <div class="search-result-content">
                        <div class="search-result-title">${result.highlight}</div>
                        <div class="search-result-text">${formatFileSize(result.message.file.size)}</div>
                        <div class="search-result-time">${formatTime(result.message.timestamp)}</div>
                    </div>
                `;
                item.onclick = () => {
                    window.closeSearchModal();
                    if (window.loadChat) {
                        window.loadChat(result.chatId);
                    }
                };
            }
            
            resultsList.appendChild(item);
        });
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    // Format time
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        
        return date.toLocaleDateString();
    }
    
    // Add to search history
    function addToSearchHistory(query) {
        if (!searchHistory.includes(query)) {
            searchHistory.unshift(query);
            searchHistory = searchHistory.slice(0, 10); // Keep last 10
            localStorage.setItem('search_history', JSON.stringify(searchHistory));
        }
    }
    
    // Show search history
    function showSearchHistory() {
        const historyDiv = document.getElementById('search-history');
        const resultsDiv = document.getElementById('search-results');
        const emptyDiv = document.getElementById('search-empty');
        const historyItems = document.getElementById('search-history-items');
        
        resultsDiv.style.display = 'none';
        emptyDiv.style.display = 'none';
        historyDiv.style.display = 'block';
        
        historyItems.innerHTML = '';
        
        if (searchHistory.length === 0) {
            historyItems.innerHTML = '<p class="search-history-empty">No recent searches</p>';
            return;
        }
        
        searchHistory.forEach(query => {
            const item = document.createElement('div');
            item.className = 'search-history-item';
            item.innerHTML = `
                <span class="search-history-icon">🕐</span>
                <span class="search-history-text">${query}</span>
                <button class="search-history-remove" data-query="${query}">✕</button>
            `;
            
            item.querySelector('.search-history-text').onclick = () => {
                document.getElementById('global-search-input').value = query;
                performSearch(query, 'all');
            };
            
            item.querySelector('.search-history-remove').onclick = (e) => {
                e.stopPropagation();
                searchHistory = searchHistory.filter(q => q !== query);
                localStorage.setItem('search_history', JSON.stringify(searchHistory));
                showSearchHistory();
            };
            
            historyItems.appendChild(item);
        });
    }
    
    // Open/close modal
    window.openSearchModal = function() {
        const modal = document.getElementById('search-modal');
        if (modal) {
            modal.style.display = 'flex';
            showSearchHistory();
            setTimeout(() => {
                document.getElementById('global-search-input').focus();
            }, 100);
        }
    };
    
    window.closeSearchModal = function() {
        const modal = document.getElementById('search-modal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('global-search-input').value = '';
            document.getElementById('search-clear-btn').style.display = 'none';
        }
    };
    
    // Add keyboard shortcut (Ctrl/Cmd + K)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            window.openSearchModal();
        }
        
        // ESC to close
        if (e.key === 'Escape') {
            const modal = document.getElementById('search-modal');
            if (modal && modal.style.display === 'flex') {
                window.closeSearchModal();
            }
        }
    });
    
    // Add search button to header
    function addSearchButton() {
        setTimeout(() => {
            const headerButtons = document.querySelector('.header-buttons');
            if (headerButtons && !document.getElementById('global-search-btn')) {
                const searchBtn = document.createElement('button');
                searchBtn.id = 'global-search-btn';
                searchBtn.className = 'settings-btn';
                searchBtn.innerHTML = '🔍 Search';
                searchBtn.onclick = window.openSearchModal;
                
                headerButtons.insertBefore(searchBtn, headerButtons.firstChild);
            }
        }, 1000);
    }
    
    // Initialize
    function init() {
        createSearchModal();
        addSearchButton();
        addStyles();
        console.log('✅ [MESSAGE-SEARCH] Module ready! Press Ctrl+K to search');
    }
    
    // Add styles
    function addStyles() {
        const styles = `
            <style>
            .search-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 100001;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding-top: 10vh;
            }
            
            .search-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(5px);
            }
            
            .search-modal-container {
                position: relative;
                width: 90%;
                max-width: 700px;
                max-height: 80vh;
                background: #1f2c33;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: searchModalSlideDown 0.3s ease-out;
                display: flex;
                flex-direction: column;
            }
            
            @keyframes searchModalSlideDown {
                from {
                    opacity: 0;
                    transform: translateY(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .search-modal-header {
                padding: 20px;
                background: rgba(0, 0, 0, 0.3);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                gap: 15px;
            }
            
            .search-input-wrapper {
                flex: 1;
                position: relative;
                display: flex;
                align-items: center;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 12px;
                padding: 0 15px;
            }
            
            .search-icon {
                font-size: 20px;
                margin-right: 10px;
            }
            
            #global-search-input {
                flex: 1;
                background: none;
                border: none;
                outline: none;
                color: #e9edef;
                font-size: 16px;
                padding: 12px 0;
            }
            
            #global-search-input::placeholder {
                color: #8696a0;
            }
            
            .search-clear-btn {
                background: none;
                border: none;
                color: #8696a0;
                font-size: 20px;
                cursor: pointer;
                padding: 5px;
                border-radius: 50%;
                transition: all 0.2s;
            }
            
            .search-clear-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #e9edef;
            }
            
            .search-close-btn {
                background: none;
                border: none;
                color: #8696a0;
                font-size: 24px;
                cursor: pointer;
                padding: 10px;
                border-radius: 50%;
                transition: all 0.2s;
            }
            
            .search-close-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #e9edef;
            }
            
            .search-filters {
                display: flex;
                gap: 10px;
                padding: 15px 20px;
                background: rgba(0, 0, 0, 0.2);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                overflow-x: auto;
            }
            
            .search-filter-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #8696a0;
                padding: 8px 20px;
                border-radius: 20px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
                white-space: nowrap;
            }
            
            .search-filter-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #e9edef;
            }
            
            .search-filter-btn.active {
                background: #25d366;
                border-color: #25d366;
                color: white;
            }
            
            .search-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .search-history h4 {
                color: #8696a0;
                font-size: 13px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 0 0 15px 0;
            }
            
            .search-history-items {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .search-history-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 15px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .search-history-item:hover {
                background: rgba(255, 255, 255, 0.07);
            }
            
            .search-history-icon {
                font-size: 18px;
                opacity: 0.6;
            }
            
            .search-history-text {
                flex: 1;
                color: #e9edef;
                font-size: 14px;
            }
            
            .search-history-remove {
                background: none;
                border: none;
                color: #8696a0;
                font-size: 18px;
                cursor: pointer;
                padding: 5px;
                border-radius: 50%;
                opacity: 0;
                transition: all 0.2s;
            }
            
            .search-history-item:hover .search-history-remove {
                opacity: 1;
            }
            
            .search-history-remove:hover {
                background: rgba(220, 38, 38, 0.2);
                color: #dc2626;
            }
            
            .search-history-empty {
                color: #8696a0;
                text-align: center;
                padding: 40px 20px;
                font-size: 14px;
            }
            
            .search-results-header {
                padding-bottom: 15px;
                margin-bottom: 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            #search-results-count {
                color: #8696a0;
                font-size: 13px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .search-results-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .search-result-item {
                display: flex;
                align-items: flex-start;
                gap: 15px;
                padding: 15px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .search-result-item:hover {
                background: rgba(255, 255, 255, 0.07);
                transform: translateX(5px);
            }
            
            .search-result-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 18px;
                font-weight: 600;
                flex-shrink: 0;
            }
            
            .search-result-content {
                flex: 1;
                min-width: 0;
            }
            
            .search-result-title {
                color: #e9edef;
                font-size: 15px;
                font-weight: 500;
                margin-bottom: 5px;
            }
            
            .search-result-text {
                color: #8696a0;
                font-size: 14px;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            
            .search-result-text mark {
                background: rgba(37, 211, 102, 0.3);
                color: #25d366;
                padding: 2px 4px;
                border-radius: 3px;
            }
            
            .search-result-time {
                color: #8696a0;
                font-size: 12px;
                margin-top: 5px;
            }
            
            .search-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
                text-align: center;
            }
            
            .search-empty-icon {
                font-size: 64px;
                opacity: 0.3;
                margin-bottom: 20px;
            }
            
            .search-empty p {
                color: #e9edef;
                font-size: 18px;
                margin-bottom: 8px;
            }
            
            .search-empty span {
                color: #8696a0;
                font-size: 14px;
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