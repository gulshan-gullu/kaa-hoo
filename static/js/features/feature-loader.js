/**
 * 🚀 FEATURE LOADER
 * Automatically loads CSS and initializes features
 */
class FeatureManager {
    constructor() {
        this.features = [];
        this.initialized = false;
    }

    async loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
            document.head.appendChild(link);
        });
    }

    async init() {
        if (this.initialized) {
            console.log('[FEATURE-LOADER] Features already initialized');
            return;
        }

        console.log('[FEATURE-LOADER] Starting feature initialization...');

        try {
            // Load CSS files only (JS files are loaded by index.html)
            await this.loadCSS('/static/js/features/whatsapp-media.css');
            console.log('[FEATURE-LOADER] WhatsApp Media CSS loaded');

            await this.loadCSS('/static/js/features/location-sharing.css');
            console.log('[FEATURE-LOADER] Location Sharing CSS loaded');

            // Initialize features (after JS files load from index.html)
            setTimeout(() => {
                if (window.whatsappMedia) {
                    window.whatsappMedia.init();
                    console.log('[FEATURE-LOADER] WhatsApp Media initialized');
                }

                if (window.locationSharing) {
                    window.locationSharing.init();
                    console.log('[FEATURE-LOADER] Location Sharing initialized');
                }

                if (window.websocketHandlers) {
                    window.websocketHandlers.init();
                    console.log('[FEATURE-LOADER] WebSocket Handlers initialized');
                }
            }, 1000);

            this.initialized = true;
            console.log('[FEATURE-LOADER] All features loaded successfully!');

        } catch (error) {
            console.error('[FEATURE-LOADER] Error loading features:', error);
        }
    }
}

// Create global instance
window.featureManager = new FeatureManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.featureManager.init();
    });
} else {
    window.featureManager.init();
}