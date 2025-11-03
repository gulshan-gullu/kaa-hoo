// ==========================================
// 📱 CA360 MOBILE OPTIMIZER v2.0
// 120Hz Support • iOS/Android • Touch Optimized
// Better than WhatsApp, Telegram Mobile Apps
// Progressive Web App Ready
// ==========================================

(function() {
    'use strict';
    
    class MobileOptimizer {
        constructor() {
            this.deviceInfo = this.detectDevice();
            this.capabilities = this.detectCapabilities();
            this.orientation = this.getOrientation();
            this.initialized = false;
            this.wakeLock = null;
        }
        
        // ==================== DEVICE DETECTION ====================
        
        detectDevice() {
            const ua = navigator.userAgent;
            
            return {
                // Device type
                isIOS: /iPad|iPhone|iPod/.test(ua) && !window.MSStream,
                isAndroid: /Android/.test(ua),
                isMobile: /iPhone|iPad|iPod|Android/i.test(ua),
                isTablet: /iPad|Android(?!.*Mobile)/i.test(ua),
                isPhone: /iPhone|Android.*Mobile/i.test(ua),
                
                // Browser
                isSafari: /^((?!chrome|android).)*safari/i.test(ua),
                isChrome: /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor),
                isFirefox: /Firefox/.test(ua),
                isSamsung: /SamsungBrowser/.test(ua),
                isEdge: /Edg/.test(ua),
                
                // OS Version
                iOSVersion: this.getIOSVersion(ua),
                androidVersion: this.getAndroidVersion(ua),
                
                // Device details
                userAgent: ua,
                vendor: navigator.vendor,
                platform: navigator.platform,
                
                // Device model hints
                isIPhonePro: /iPhone14|iPhone15|iPhone16/.test(ua),
                isIPadPro: /iPad/.test(ua) && window.screen.width >= 1024
            };
        }
        
        getIOSVersion(ua) {
            const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (match) {
                return parseFloat(`${match[1]}.${match[2]}`);
            }
            return 0;
        }
        
        getAndroidVersion(ua) {
            const match = ua.match(/Android (\d+)\.(\d+)/);
            if (match) {
                return parseFloat(`${match[1]}.${match[2]}`);
            }
            return 0;
        }
        
        // ==================== CAPABILITY DETECTION ====================
        
        detectCapabilities() {
            return {
                // Display
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                pixelRatio: window.devicePixelRatio || 1,
                refreshRate: this.detectRefreshRate(),
                colorDepth: window.screen.colorDepth,
                orientation: window.screen.orientation?.type || 'unknown',
                
                // Touch
                touchPoints: navigator.maxTouchPoints || 0,
                touchSupport: 'ontouchstart' in window,
                
                // Sensors
                accelerometer: 'DeviceMotionEvent' in window,
                gyroscope: 'DeviceOrientationEvent' in window,
                
                // Media
                camera: this.hasCamera(),
                microphone: this.hasMicrophone(),
                
                // Performance
                cores: navigator.hardwareConcurrency || 4,
                memory: navigator.deviceMemory || 4,
                
                // Network
                connection: this.getConnectionInfo(),
                
                // Features
                webGL: this.hasWebGL(),
                webRTC: this.hasWebRTC(),
                serviceWorker: 'serviceWorker' in navigator,
                notifications: 'Notification' in window,
                vibration: 'vibrate' in navigator,
                wakeLock: 'wakeLock' in navigator,
                
                // Storage
                localStorage: this.hasLocalStorage(),
                sessionStorage: this.hasSessionStorage(),
                indexedDB: 'indexedDB' in window,
                
                // Battery
                battery: 'getBattery' in navigator
            };
        }
        
        detectRefreshRate() {
            let refreshRate = 60; // Default
            
            // Check screen.refreshRate (experimental)
            if (window.screen && window.screen.refreshRate) {
                refreshRate = window.screen.refreshRate;
            }
            
            // iOS ProMotion detection (120Hz)
            if (this.deviceInfo.isIOS && this.deviceInfo.iOSVersion >= 13) {
                // iPhone 13 Pro and later, iPad Pro support 120Hz
                if (this.deviceInfo.isIPhonePro || this.deviceInfo.isIPadPro) {
                    refreshRate = 120;
                }
            }
            
            // Android high refresh rate - measure it
            if (this.deviceInfo.isAndroid) {
                this.measureRefreshRate().then(rate => {
                    this.capabilities.refreshRate = rate;
                    console.log(`📱 [MOBILE] Measured ${rate}Hz display`);
                });
            }
            
            return refreshRate;
        }
        
        async measureRefreshRate() {
            return new Promise((resolve) => {
                let lastTime = performance.now();
                let frames = 0;
                const samples = [];
                const maxSamples = 60;
                
                const measureFrame = () => {
                    const now = performance.now();
                    const delta = now - lastTime;
                    lastTime = now;
                    
                    if (delta > 0 && frames > 5) { // Skip first few frames
                        samples.push(1000 / delta);
                    }
                    
                    frames++;
                    
                    if (samples.length < maxSamples) {
                        requestAnimationFrame(measureFrame);
                    } else {
                        // Calculate average and round to common refresh rates
                        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
                        
                        if (avg > 110) resolve(120);
                        else if (avg > 85) resolve(90);
                        else if (avg > 55) resolve(60);
                        else resolve(60);
                    }
                };
                
                requestAnimationFrame(measureFrame);
            });
        }
        
        getConnectionInfo() {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            
            if (!conn) return { 
                type: 'unknown', 
                effectiveType: 'unknown',
                downlink: 0,
                rtt: 0,
                saveData: false
            };
            
            return {
                type: conn.type || 'unknown',
                effectiveType: conn.effectiveType || 'unknown',
                downlink: conn.downlink || 0,
                rtt: conn.rtt || 0,
                saveData: conn.saveData || false
            };
        }
        
        hasCamera() {
            return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        }
        
        hasMicrophone() {
            return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        }
        
        hasWebGL() {
            try {
                const canvas = document.createElement('canvas');
                return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
            } catch (e) {
                return false;
            }
        }
        
        hasWebRTC() {
            return !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
        }
        
        hasLocalStorage() {
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return true;
            } catch (e) {
                return false;
            }
        }
        
        hasSessionStorage() {
            try {
                sessionStorage.setItem('test', 'test');
                sessionStorage.removeItem('test');
                return true;
            } catch (e) {
                return false;
            }
        }
        
        getOrientation() {
            // Check window.orientation first (legacy)
            if (window.orientation !== undefined) {
                return Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait';
            }
            
            // Check screen.orientation (modern)
            if (window.screen.orientation) {
                return window.screen.orientation.type.includes('landscape') ? 'landscape' : 'portrait';
            }
            
            // Fallback to window dimensions
            return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        }
        
        // ==================== OPTIMIZATION METHODS ====================
        
        async initialize() {
            if (this.initialized) {
                console.log('📱 [MOBILE] Already initialized');
                return;
            }
            
            console.log('📱 [MOBILE] Initializing optimizer...');
            console.log('📱 [MOBILE] Device:', this.getDeviceName());
            console.log('📱 [MOBILE] Display:', `${this.capabilities.screenWidth}x${this.capabilities.screenHeight} @${this.capabilities.refreshRate}Hz`);
            console.log('📱 [MOBILE] Pixel Ratio:', this.capabilities.pixelRatio);
            
            // Apply optimizations
            this.optimizeViewport();
            this.optimizeTouch();
            this.optimizePerformance();
            this.setupOrientationHandling();
            this.setupNetworkMonitoring();
            this.preventZoom();
            this.optimizeScrolling();
            this.setupWakeLock();
            this.setupBatteryMonitoring();
            
            // iOS specific
            if (this.deviceInfo.isIOS) {
                this.optimizeIOS();
            }
            
            // Android specific
            if (this.deviceInfo.isAndroid) {
                this.optimizeAndroid();
            }
            
            this.initialized = true;
            console.log('✅ [MOBILE] Optimizer ready');
            console.log('🎯 [MOBILE] Quality preset:', this.getQualityPreset());
        }
        
        optimizeViewport() {
            // Set viewport for mobile
            let viewport = document.querySelector('meta[name="viewport"]');
            if (!viewport) {
                viewport = document.createElement('meta');
                viewport.name = 'viewport';
                document.head.appendChild(viewport);
            }
            
            // High refresh rate support
            let content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            
            // iOS Safari viewport-fit for notch support
            if (this.deviceInfo.isIOS) {
                content += ', viewport-fit=cover';
            }
            
            viewport.content = content;
            
            console.log('✅ [MOBILE] Viewport optimized');
        }
        
        optimizeTouch() {
            // Prevent 300ms tap delay
            document.body.style.touchAction = 'manipulation';
            
            // Improve scrolling on iOS
            document.body.style.webkitOverflowScrolling = 'touch';
            
            // Add mobile-optimized styles
            const style = document.createElement('style');
            style.textContent = `
                /* Remove tap highlights and improve touch */
                button, .btn, .control, a {
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                }
                
                /* Smooth scrolling for high refresh rate displays */
                * {
                    -webkit-overflow-scrolling: touch;
                    scroll-behavior: smooth;
                }
                
                /* Remove tap highlight */
                * {
                    -webkit-tap-highlight-color: rgba(0,0,0,0);
                }
                
                /* Improve input on mobile */
                input, textarea, select {
                    -webkit-appearance: none;
                    appearance: none;
                }
            `;
            document.head.appendChild(style);
            
            console.log('✅ [MOBILE] Touch optimized');
        }
        
        optimizePerformance() {
            // Use hardware acceleration
            const style = document.createElement('style');
            style.textContent = `
                /* Hardware acceleration for smooth ${this.capabilities.refreshRate}Hz */
                .modal, .sidebar, .chat-container, .message, .call-modal {
                    transform: translateZ(0);
                    -webkit-transform: translateZ(0);
                    will-change: transform, opacity;
                    backface-visibility: hidden;
                }
                
                /* Smooth animations for high refresh rate */
                @media (prefers-reduced-motion: no-preference) {
                    * {
                        animation-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
                        transition-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
                    }
                }
                
                /* Optimize images for high DPI */
                @media (min-resolution: 2dppx) {
                    img {
                        image-rendering: -webkit-optimize-contrast;
                        image-rendering: crisp-edges;
                    }
                }
                
                /* Optimize text rendering */
                body {
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: optimizeLegibility;
                }
            `;
            document.head.appendChild(style);
            
            console.log(`✅ [MOBILE] Performance optimized for ${this.capabilities.refreshRate}Hz`);
        }
        
        setupOrientationHandling() {
            // Listen for orientation changes
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.orientation = this.getOrientation();
                    console.log('📱 [MOBILE] Orientation:', this.orientation);
                    
                    // Dispatch custom event
                    window.dispatchEvent(new CustomEvent('mobileOrientationChange', {
                        detail: { orientation: this.orientation }
                    }));
                }, 100);
            });
            
            // Also listen to resize (more reliable)
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    const newOrientation = this.getOrientation();
                    if (newOrientation !== this.orientation) {
                        this.orientation = newOrientation;
                        window.dispatchEvent(new CustomEvent('mobileOrientationChange', {
                            detail: { orientation: this.orientation }
                        }));
                    }
                }, 200);
            });
        }
        
        setupNetworkMonitoring() {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            
            if (conn) {
                conn.addEventListener('change', () => {
                    this.capabilities.connection = this.getConnectionInfo();
                    console.log('📱 [MOBILE] Connection:', this.capabilities.connection.effectiveType);
                    
                    // Dispatch event for app to adapt
                    window.dispatchEvent(new CustomEvent('mobileConnectionChange', {
                        detail: this.capabilities.connection
                    }));
                });
            }
        }
        
        preventZoom() {
            // Prevent double-tap zoom
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (e) => {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, { passive: false });
            
            // Prevent pinch zoom
            document.addEventListener('gesturestart', (e) => {
                e.preventDefault();
            }, { passive: false });
            
            document.addEventListener('gesturechange', (e) => {
                e.preventDefault();
            }, { passive: false });
            
            document.addEventListener('gestureend', (e) => {
                e.preventDefault();
            }, { passive: false });
            
            console.log('✅ [MOBILE] Zoom prevention enabled');
        }
        
        optimizeScrolling() {
            // Smooth scrolling for high refresh rate displays
            if (this.capabilities.refreshRate >= 90) {
                const style = document.createElement('style');
                style.textContent = `
                    .chat-messages, .contacts-list, .scrollable {
                        scroll-snap-type: y proximity;
                        -webkit-overflow-scrolling: touch;
                    }
                    
                    /* Ultra-smooth momentum scrolling */
                    * {
                        -webkit-overflow-scrolling: touch;
                        overscroll-behavior: contain;
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        async setupWakeLock() {
            // Keep screen awake during calls
            if ('wakeLock' in navigator) {
                console.log('✅ [MOBILE] WakeLock API available');
            } else {
                console.warn('⚠️ [MOBILE] WakeLock not supported');
            }
        }
        
        async acquireWakeLock() {
            if ('wakeLock' in navigator) {
                try {
                    this.wakeLock = await navigator.wakeLock.request('screen');
                    console.log('✅ [MOBILE] Screen wake lock acquired');
                    
                    this.wakeLock.addEventListener('release', () => {
                        console.log('📱 [MOBILE] Screen wake lock released');
                    });
                    
                    return true;
                } catch (error) {
                    console.error('❌ [MOBILE] Wake lock failed:', error);
                    return false;
                }
            }
            return false;
        }
        
        releaseWakeLock() {
            if (this.wakeLock) {
                this.wakeLock.release();
                this.wakeLock = null;
                console.log('✅ [MOBILE] Wake lock released');
            }
        }
        
        async setupBatteryMonitoring() {
            if ('getBattery' in navigator) {
                try {
                    const battery = await navigator.getBattery();
                    
                    console.log('🔋 [MOBILE] Battery:', Math.round(battery.level * 100) + '%');
                    console.log('🔌 [MOBILE] Charging:', battery.charging);
                    
                    // Monitor battery changes
                    battery.addEventListener('levelchange', () => {
                        const level = Math.round(battery.level * 100);
                        if (level < 20 && !battery.charging) {
                            console.warn('⚠️ [MOBILE] Low battery:', level + '%');
                            // Could trigger battery saver mode
                        }
                    });
                    
                    battery.addEventListener('chargingchange', () => {
                        console.log('🔌 [MOBILE] Charging:', battery.charging);
                    });
                    
                } catch (error) {
                    console.warn('⚠️ [MOBILE] Battery API failed:', error);
                }
            }
        }
        
        optimizeIOS() {
            console.log('📱 [MOBILE] Applying iOS optimizations...');
            
            // iOS Safari specific fixes
            const style = document.createElement('style');
            style.textContent = `
                /* iOS notch/Dynamic Island support */
                body {
                    padding-top: env(safe-area-inset-top);
                    padding-bottom: env(safe-area-inset-bottom);
                    padding-left: env(safe-area-inset-left);
                    padding-right: env(safe-area-inset-right);
                }
                
                /* Prevent iOS input zoom */
                input, textarea, select {
                    font-size: 16px !important;
                }
                
                /* iOS button style fix */
                button, input[type="button"], input[type="submit"] {
                    -webkit-appearance: none;
                    appearance: none;
                    border-radius: 8px;
                }
                
                /* ProMotion 120Hz optimization */
                @media (min-resolution: 3dppx) {
                    * {
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                    }
                }
                
                /* Fix iOS vh units */
                .full-height {
                    height: 100vh;
                    height: -webkit-fill-available;
                }
            `;
            document.head.appendChild(style);
            
            // Prevent iOS rubber band scrolling on body
            let startY = 0;
            document.body.addEventListener('touchstart', (e) => {
                startY = e.touches[0].pageY;
            }, { passive: true });
            
            document.body.addEventListener('touchmove', (e) => {
                const y = e.touches[0].pageY;
                const scrollable = e.target.closest('.scrollable');
                
                if (!scrollable && e.target === document.body) {
                    e.preventDefault();
                }
            }, { passive: false });
            
            console.log('✅ [MOBILE] iOS optimizations applied');
        }
        
        optimizeAndroid() {
            console.log('📱 [MOBILE] Applying Android optimizations...');
            
            // Android specific optimizations
            const style = document.createElement('style');
            style.textContent = `
                /* Android Chrome theme */
                body {
                    -webkit-font-smoothing: antialiased;
                    text-rendering: optimizeLegibility;
                }
                
                /* High refresh rate optimization */
                @media (min-resolution: 2dppx) {
                    * {
                        backface-visibility: hidden;
                        perspective: 1000px;
                    }
                }
                
                /* Android safe area (for edge-to-edge) */
                @supports (padding: env(safe-area-inset-top)) {
                    body {
                        padding-top: env(safe-area-inset-top);
                        padding-bottom: env(safe-area-inset-bottom);
                    }
                }
            `;
            document.head.appendChild(style);
            
            console.log('✅ [MOBILE] Android optimizations applied');
        }
        
        // ==================== HELPER METHODS ====================
        
        getDeviceName() {
            const { isIOS, isAndroid, isTablet, isPhone } = this.deviceInfo;
            
            if (isIOS) {
                if (isTablet) return 'iPad';
                return 'iPhone';
            }
            
            if (isAndroid) {
                if (isTablet) return 'Android Tablet';
                return 'Android Phone';
            }
            
            return 'Desktop';
        }
        
        isHighEnd() {
            // Determine if device is high-end
            return this.capabilities.cores >= 6 &&
                   this.capabilities.memory >= 4 &&
                   this.capabilities.refreshRate >= 90;
        }
        
        isMidRange() {
            return this.capabilities.cores >= 4 &&
                   this.capabilities.memory >= 2;
        }
        
        isLowEnd() {
            return !this.isHighEnd() && !this.isMidRange();
        }
        
        getQualityPreset() {
            if (this.isHighEnd()) return 'ultra';
            if (this.isMidRange()) return 'high';
            return 'medium';
        }
        
        getOptimalVideoResolution() {
            const quality = this.getQualityPreset();
            const { connection } = this.capabilities;
            
            // Adjust based on network
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                return { width: 320, height: 240, fps: 15 };
            }
            
            if (connection.effectiveType === '3g') {
                return { width: 640, height: 480, fps: 24 };
            }
            
            // High-end device with good connection
            if (quality === 'ultra' && (connection.effectiveType === '4g' || connection.downlink > 5)) {
                return { width: 1280, height: 720, fps: 30 };
            }
            
            // Mid-range
            if (quality === 'high') {
                return { width: 960, height: 540, fps: 30 };
            }
            
            // Default
            return { width: 640, height: 480, fps: 24 };
        }
        
        getOptimalAudioBitrate() {
            const { connection } = this.capabilities;
            
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                return 24000; // 24kbps
            }
            
            if (connection.effectiveType === '3g') {
                return 48000; // 48kbps
            }
            
            if (connection.effectiveType === '4g' || connection.downlink > 2) {
                return 64000; // 64kbps
            }
            
            return 48000; // Default
        }
        
        // ==================== PUBLIC API ====================
        
        getInfo() {
            return {
                device: this.deviceInfo,
                capabilities: this.capabilities,
                orientation: this.orientation,
                qualityPreset: this.getQualityPreset(),
                optimalVideo: this.getOptimalVideoResolution(),
                optimalAudio: this.getOptimalAudioBitrate(),
                isHighEnd: this.isHighEnd(),
                isMidRange: this.isMidRange(),
                isLowEnd: this.isLowEnd()
            };
        }
        
        log() {
            console.group('📱 Mobile Device Info');
            console.log('Device:', this.getDeviceName());
            console.log('OS:', this.deviceInfo.isIOS ? 
                `iOS ${this.deviceInfo.iOSVersion}` : 
                `Android ${this.deviceInfo.androidVersion}`);
            console.log('Browser:', 
                this.deviceInfo.isChrome ? 'Chrome' :
                this.deviceInfo.isSafari ? 'Safari' :
                this.deviceInfo.isFirefox ? 'Firefox' :
                this.deviceInfo.isSamsung ? 'Samsung Internet' : 'Unknown');
            console.log('Display:', `${this.capabilities.screenWidth}x${this.capabilities.screenHeight} @${this.capabilities.refreshRate}Hz`);
            console.log('Pixel Ratio:', this.capabilities.pixelRatio);
            console.log('Orientation:', this.orientation);
            console.log('Cores:', this.capabilities.cores);
            console.log('Memory:', this.capabilities.memory + 'GB');
            console.log('Connection:', this.capabilities.connection.effectiveType, 
                `(${this.capabilities.connection.downlink}Mbps)`);
            console.log('Touch Points:', this.capabilities.touchPoints);
            console.log('Quality Preset:', this.getQualityPreset());
            console.log('Optimal Video:', this.getOptimalVideoResolution());
            console.log('Optimal Audio:', this.getOptimalAudioBitrate() / 1000 + 'kbps');
            console.log('Features:', {
                webRTC: this.capabilities.webRTC,
                serviceWorker: this.capabilities.serviceWorker,
                notifications: this.capabilities.notifications,
                vibration: this.capabilities.vibration,
                wakeLock: this.capabilities.wakeLock
            });
            console.groupEnd();
        }
        
        // Manual control methods
        enableHardwareAcceleration() {
            document.body.style.transform = 'translateZ(0)';
            console.log('✅ [MOBILE] Hardware acceleration enabled');
        }
        
        disableAnimations() {
            const style = document.createElement('style');
            style.id = 'disable-animations';
            style.textContent = `
                *, *::before, *::after {
                    animation-duration: 0s !important;
                    transition-duration: 0s !important;
                }
            `;
            document.head.appendChild(style);
            console.log('✅ [MOBILE] Animations disabled for performance');
        }
        
        enableAnimations() {
            const style = document.getElementById('disable-animations');
            if (style) {
                style.remove();
                console.log('✅ [MOBILE] Animations enabled');
            }
        }
    }
    
    // ==================== GLOBAL INSTANCE ====================
    window.MobileOptimizer = new MobileOptimizer();
    
    // Auto-initialize on mobile
    if (window.MobileOptimizer.deviceInfo.isMobile) {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.MobileOptimizer.initialize();
                window.MobileOptimizer.log();
            });
        } else {
            window.MobileOptimizer.initialize();
            window.MobileOptimizer.log();
        }
    } else {
        console.log('💻 [MOBILE] Desktop detected - mobile optimizations skipped');
    }
    
    console.log('✅ [MOBILE] Mobile Optimizer v2.0 loaded');
    
})();