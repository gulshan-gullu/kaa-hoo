// ==================== TRANSLATION UI MODULE ====================
// UI controls for real-time translation

class TranslationUI {
    constructor() {
        this.container = null;
        this.isVisible = false;
        
        console.log('ðŸŽ¨ [TRANSLATION-UI] Module initialized');
    }

    // Create the translation UI
    create() {
        console.log('ðŸ”¨ [TRANSLATION-UI] Creating UI...');

        // Create container
        this.container = document.createElement('div');
        this.container.id = 'translation-panel';
        this.container.innerHTML = `
            <div class="translation-header">
                <span class="translation-title">ðŸŒ Translation</span>
                <button class="translation-close-btn" id="translationCloseBtn">âœ•</button>
            </div>
            
            <div class="translation-controls">
                <div class="translation-toggle">
                    <label class="toggle-switch">
                        <input type="checkbox" id="translationToggle">
                        <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">Enable Translation</span>
                </div>

                <div class="language-selectors">
                    <div class="language-select-group">
                        <label>From:</label>
                        <select id="sourceLanguageSelect" class="language-select">
                            <option value="auto">Auto Detect</option>
                            <option value="en-US">English</option>
                            <option value="es-ES">Spanish</option>
                            <option value="fr-FR">French</option>
                            <option value="de-DE">German</option>
                            <option value="zh-CN">Chinese</option>
                            <option value="ja-JP">Japanese</option>
                            <option value="ko-KR">Korean</option>
                            <option value="hi-IN">Hindi</option>
                        </select>
                    </div>

                    <div class="language-arrow">â†’</div>

                    <div class="language-select-group">
                        <label>To:</label>
                        <select id="targetLanguageSelect" class="language-select">
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="zh">Chinese</option>
                            <option value="ja">Japanese</option>
                            <option value="ko">Korean</option>
                            <option value="hi">Hindi</option>
                        </select>
                    </div>
                </div>

                <div class="translation-output" id="translationOutput">
                    <div class="translation-placeholder">
                        Translation will appear here...
                    </div>
                </div>
            </div>
        `;

        // Add styles
        this.addStyles();

        // Append to call modal
        const callContainer = document.querySelector('.call-container');
        if (callContainer) {
            callContainer.appendChild(this.container);
            console.log('âœ… [TRANSLATION-UI] UI created and appended');
        } else {
            console.warn('âš ï¸ [TRANSLATION-UI] Call container not found');
        }

        // Setup event listeners
        this.setupEventListeners();
    }

    // Add CSS styles
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #translation-panel {
                position: absolute;
                bottom: 20px;
                left: 20px;
                width: 320px;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(20px);
                border-radius: 15px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                padding: 15px;
                display: none;
                z-index: 1000;
                animation: slideInLeft 0.3s ease;
            }

            @keyframes slideInLeft {
                from { opacity: 0; transform: translateX(-50px); }
                to { opacity: 1; transform: translateX(0); }
            }

            .translation-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .translation-title {
                font-size: 16px;
                font-weight: 600;
                color: white;
            }

            .translation-close-btn {
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s;
            }

            .translation-close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: rotate(90deg);
            }

            .translation-toggle {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 15px;
            }

            .toggle-switch {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 26px;
            }

            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(255, 255, 255, 0.2);
                transition: 0.4s;
                border-radius: 26px;
            }

            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 20px;
                width: 20px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: 0.4s;
                border-radius: 50%;
            }

            input:checked + .toggle-slider {
                background-color: #25d366;
            }

            input:checked + .toggle-slider:before {
                transform: translateX(24px);
            }

            .toggle-label {
                color: white;
                font-size: 14px;
            }

            .language-selectors {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 15px;
            }

            .language-select-group {
                flex: 1;
            }

            .language-select-group label {
                display: block;
                color: rgba(255, 255, 255, 0.7);
                font-size: 12px;
                margin-bottom: 5px;
            }

            .language-select {
                width: 100%;
                padding: 8px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: white;
                font-size: 13px;
                cursor: pointer;
            }

            .language-select:focus {
                outline: none;
                border-color: #25d366;
            }

            .language-arrow {
                color: #25d366;
                font-size: 20px;
                margin-top: 20px;
            }

            .translation-output {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
                padding: 12px;
                min-height: 80px;
                max-height: 150px;
                overflow-y: auto;
            }

            .translation-placeholder {
                color: rgba(255, 255, 255, 0.4);
                font-size: 13px;
                text-align: center;
                padding: 20px 0;
            }

            .translation-result {
                margin-bottom: 10px;
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .translation-original {
                color: rgba(255, 255, 255, 0.6);
                font-size: 12px;
                margin-bottom: 4px;
            }

            .translation-text {
                color: white;
                font-size: 14px;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);
    }

    // Setup event listeners
    setupEventListeners() {
        // Close button
        const closeBtn = document.getElementById('translationCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        // Toggle translation
        const toggle = document.getElementById('translationToggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.enableTranslation();
                } else {
                    this.disableTranslation();
                }
            });
        }

        // Language selectors
        const sourceSelect = document.getElementById('sourceLanguageSelect');
        const targetSelect = document.getElementById('targetLanguageSelect');

        if (sourceSelect) {
            sourceSelect.addEventListener('change', (e) => {
                if (window.featureModules?.translation) {
                    window.featureModules.translation.setSourceLanguage(e.target.value);
                }
            });
        }

        if (targetSelect) {
            targetSelect.addEventListener('change', (e) => {
                if (window.featureModules?.translation) {
                    window.featureModules.translation.setTargetLanguage(e.target.value);
                }
            });
        }

        // Listen for translation results
        window.addEventListener('translation-result', (event) => {
            this.displayTranslation(event.detail);
        });
    }

    // Enable translation
    enableTranslation() {
        console.log('âœ… [TRANSLATION-UI] Enabling translation');
        
        const targetLang = document.getElementById('targetLanguageSelect').value;
        
        if (window.featureModules?.translation && window.localStream) {
            window.featureModules.translation.start(window.localStream, targetLang);
        }
    }

    // Disable translation
    disableTranslation() {
        console.log('ðŸ›‘ [TRANSLATION-UI] Disabling translation');
        
        if (window.featureModules?.translation) {
            window.featureModules.translation.stop();
        }
    }

    // Display translation result
    displayTranslation(data) {
        const output = document.getElementById('translationOutput');
        if (!output) return;

        // Remove placeholder
        const placeholder = output.querySelector('.translation-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        // Create translation element
        const resultDiv = document.createElement('div');
        resultDiv.className = 'translation-result';
        resultDiv.innerHTML = `
            <div class="translation-original">Original: ${data.original}</div>
            <div class="translation-text">${data.translated}</div>
        `;

        // Add to output
        output.insertBefore(resultDiv, output.firstChild);

        // Limit to last 5 translations
        while (output.children.length > 5) {
            output.removeChild(output.lastChild);
        }
    }

    // Show translation panel
    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.isVisible = true;
            console.log('ðŸ‘ï¸ [TRANSLATION-UI] Panel shown');
        }
    }

    // Hide translation panel
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.isVisible = false;
            console.log('ðŸ™ˆ [TRANSLATION-UI] Panel hidden');
        }
    }

    // Toggle visibility
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

