// ==================== TRANSLATION MODULE ====================
// Real-time voice translation for calls

class TranslationModule {
    constructor() {
        this.isEnabled = false;
        this.sourceLanguage = 'auto';
        this.targetLanguage = 'en';
        this.recognition = null;
        this.audioContext = null;
        this.mediaStream = null;
        
        console.log('ðŸŒ [TRANSLATION] Module initialized');
    }

    // Start translation
    async start(stream, targetLang = 'en') {
        try {
            console.log('ðŸŽ™ï¸ [TRANSLATION] Starting translation...');
            
            this.targetLanguage = targetLang;
            this.mediaStream = stream;
            this.isEnabled = true;

            // Initialize Web Speech API
            if ('webkitSpeechRecognition' in window) {
                this.recognition = new webkitSpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = this.sourceLanguage === 'auto' ? 'en-US' : this.sourceLanguage;

                this.recognition.onresult = (event) => {
                    this.handleSpeechResult(event);
                };

                this.recognition.onerror = (event) => {
                    console.error('âŒ [TRANSLATION] Speech recognition error:', event.error);
                };

                this.recognition.start();
                console.log('âœ… [TRANSLATION] Translation started');
                
                return { success: true };
            } else {
                throw new Error('Speech recognition not supported');
            }
        } catch (error) {
            console.error('âŒ [TRANSLATION] Start error:', error);
            return { success: false, error: error.message };
        }
    }

    // Handle speech recognition results
    async handleSpeechResult(event) {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');

        console.log('ðŸ—£ï¸ [TRANSLATION] Detected:', transcript);

        // Translate the text
        if (transcript && this.isEnabled) {
            const translated = await this.translateText(transcript);
            
            // Emit translation event
            if (translated) {
                window.dispatchEvent(new CustomEvent('translation-result', {
                    detail: {
                        original: transcript,
                        translated: translated,
                        sourceLang: this.sourceLanguage,
                        targetLang: this.targetLanguage
                    }
                }));
            }
        }
    }

    // Translate text using a simple API (you can replace with your preferred API)
    async translateText(text) {
        try {
            // Using LibreTranslate API (free and open-source)
            // You can replace this with Google Translate API or any other service
            const response = await fetch('https://libretranslate.com/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    q: text,
                    source: this.sourceLanguage,
                    target: this.targetLanguage,
                    format: 'text'
                })
            });

            const data = await response.json();
            console.log('âœ… [TRANSLATION] Translated:', data.translatedText);
            return data.translatedText;
        } catch (error) {
            console.error('âŒ [TRANSLATION] Translation error:', error);
            return text; // Return original text if translation fails
        }
    }

    // Stop translation
    stop() {
        console.log('ðŸ›‘ [TRANSLATION] Stopping...');
        
        if (this.recognition) {
            this.recognition.stop();
            this.recognition = null;
        }
        
        this.isEnabled = false;
        console.log('âœ… [TRANSLATION] Stopped');
    }

    // Change target language
    setTargetLanguage(langCode) {
        console.log('ðŸŒ [TRANSLATION] Target language changed to:', langCode);
        this.targetLanguage = langCode;
    }

    // Change source language
    setSourceLanguage(langCode) {
        console.log('ðŸŒ [TRANSLATION] Source language changed to:', langCode);
        this.sourceLanguage = langCode;
        
        if (this.recognition) {
            this.recognition.lang = langCode === 'auto' ? 'en-US' : langCode;
        }
    }

    // Get current state
    getState() {
        return {
            isEnabled: this.isEnabled,
            sourceLanguage: this.sourceLanguage,
            targetLanguage: this.targetLanguage
        };
    }
}

