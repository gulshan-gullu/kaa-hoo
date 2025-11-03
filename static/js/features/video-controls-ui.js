// ==========================================
// 🎛️ CA360 ADVANCED VIDEO CONTROLS UI
// Beautiful control panel for all video features
// ==========================================

(function() {
    'use strict';
    
    function createAdvancedVideoControls() {
        // Check if controls already exist
        if (document.getElementById('advanced-video-controls')) return;
        
        const controlsHTML = `
            <div id="advanced-video-controls" style="
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                backdrop-filter: blur(10px);
                border-radius: 16px;
                padding: 16px;
                display: none;
                gap: 12px;
                align-items: center;
                z-index: 9999;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            ">
                <!-- Screen Share -->
                <button id="screen-share-btn" onclick="window.AdvancedVideoFeatures.toggleScreenShare()" 
                    class="video-control-btn" title="Share screen">
                    🖥️
                </button>
                
                <!-- Virtual Background -->
                <div class="dropdown-container">
                    <button id="background-btn" class="video-control-btn" title="Virtual background">
                        🎨
                    </button>
                    <div id="background-menu" class="dropdown-menu">
                        <div class="menu-item" onclick="window.AdvancedVideoFeatures.disableBackgroundEffects()">
                            ❌ None
                        </div>
                        <div class="menu-item" onclick="window.AdvancedVideoFeatures.enableBackgroundBlur()">
                            🌫️ Blur Background
                        </div>
                        <div class="menu-item" onclick="showBackgroundGallery()">
                            🖼️ Virtual Background
                        </div>
                    </div>
                </div>
                
                <!-- Recording -->
                <button id="record-btn" onclick="window.AdvancedVideoFeatures.toggleRecording()" 
                    class="video-control-btn" title="Record call">
                    🎬
                </button>
                
                <!-- Picture-in-Picture -->
                <button id="pip-btn" onclick="window.AdvancedVideoFeatures.enablePictureInPicture()" 
                    class="video-control-btn" title="Picture-in-picture">
                    📱
                </button>
                
                <!-- Beauty Filter -->
                <button id="beauty-btn" onclick="window.AdvancedVideoFeatures.toggleBeautyFilter()" 
                    class="video-control-btn" title="Beauty filter">
                    ✨
                </button>
                
                <!-- Settings -->
                <button id="video-settings-btn" onclick="showVideoSettings()" 
                    class="video-control-btn" title="Video settings">
                    ⚙️
                </button>
            </div>
            
            <!-- Background Gallery Modal -->
            <div id="background-gallery-modal" style="
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 10000;
                padding: 40px;
                overflow: auto;
            ">
                <div style="max-width: 800px; margin: 0 auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                        <h2 style="color: white; margin: 0;">Choose Virtual Background</h2>
                        <button onclick="closeBackgroundGallery()" style="
                            background: none;
                            border: none;
                            color: white;
                            font-size: 32px;
                            cursor: pointer;
                        ">×</button>
                    </div>
                    
                    <div id="background-gallery" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                        gap: 16px;
                    ">
                        <!-- Backgrounds will be added here -->
                    </div>
                </div>
            </div>
            
            <style>
                .video-control-btn {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: none;
                    background: rgba(255,255,255,0.1);
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .video-control-btn:hover {
                    background: rgba(255,255,255,0.2);
                    transform: scale(1.1);
                }
                
                .video-control-btn:active {
                    transform: scale(0.95);
                }
                
                .dropdown-container {
                    position: relative;
                }
                
                .dropdown-menu {
                    position: absolute;
                    bottom: 60px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    padding: 8px;
                    display: none;
                    min-width: 200px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                }
                
                .dropdown-container:hover .dropdown-menu {
                    display: block;
                }
                
                .menu-item {
                    padding: 12px 16px;
                    color: white;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: background 0.2s;
                    white-space: nowrap;
                }
                
                .menu-item:hover {
                    background: rgba(255,255,255,0.1);
                }
                
                .background-option {
                    aspect-ratio: 16/9;
                    border-radius: 8px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.3s;
                    border: 3px solid transparent;
                }
                
                .background-option:hover {
                    transform: scale(1.05);
                    border-color: #3b82f6;
                }
                
                .background-option img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                @keyframes recordingPulse {
                    0%, 100% { opacity: 1; box-shadow: 0 0 20px rgba(239, 68, 68, 0.8); }
                    50% { opacity: 0.7; box-shadow: 0 0 30px rgba(239, 68, 68, 1); }
                }
                
                .recording-pulse {
                    animation: recordingPulse 1.5s infinite;
                }
            </style>
        `;
        
        document.body.insertAdjacentHTML('beforeend', controlsHTML);
        
        // Initialize background gallery
        initializeBackgroundGallery();
        
        console.log('✅ [UI] Advanced video controls created');
    }
    
    function showAdvancedControls() {
        const controls = document.getElementById('advanced-video-controls');
        if (controls) {
            controls.style.display = 'flex';
        }
    }
    
    function hideAdvancedControls() {
        const controls = document.getElementById('advanced-video-controls');
        if (controls) {
            controls.style.display = 'none';
        }
    }
    
    function initializeBackgroundGallery() {
        const backgrounds = [
            {
                name: 'Office',
                url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225"><rect fill="%23667eea" width="400" height="225"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="32" font-family="Arial">Office</text></svg>'
            },
            {
                name: 'Beach',
                url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225"><rect fill="%2306b6d4" width="400" height="225"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="32" font-family="Arial">Beach</text></svg>'
            },
            {
                name: 'Mountains',
                url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225"><rect fill="%2310b981" width="400" height="225"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="32" font-family="Arial">Mountains</text></svg>'
            },
            {
                name: 'City',
                url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225"><rect fill="%238b5cf6" width="400" height="225"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="32" font-family="Arial">City</text></svg>'
            },
            {
                name: 'Space',
                url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225"><rect fill="%23000000" width="400" height="225"/><circle cx="50" cy="50" r="20" fill="%23ffffff"/><circle cx="150" cy="100" r="15" fill="%23ffffff"/><circle cx="300" cy="75" r="10" fill="%23ffffff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="32" font-family="Arial">Space</text></svg>'
            },
            {
                name: 'Gradient',
                url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23667eea;stop-opacity:1"/><stop offset="100%" style="stop-color:%23764ba2;stop-opacity:1"/></linearGradient></defs><rect fill="url(%23grad)" width="400" height="225"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="32" font-family="Arial">Gradient</text></svg>'
            }
        ];
        
        const gallery = document.getElementById('background-gallery');
        if (!gallery) return;
        
        backgrounds.forEach(bg => {
            const option = document.createElement('div');
            option.className = 'background-option';
            option.onclick = () => selectBackground(bg.url);
            option.innerHTML = `<img src="${bg.url}" alt="${bg.name}">`;
            gallery.appendChild(option);
        });
    }
    
    window.showBackgroundGallery = function() {
        const modal = document.getElementById('background-gallery-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    };
    
    window.closeBackgroundGallery = function() {
        const modal = document.getElementById('background-gallery-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };
    
    window.selectBackground = function(imageUrl) {
        window.AdvancedVideoFeatures.enableVirtualBackground(imageUrl);
        closeBackgroundGallery();
    };
    
    window.showVideoSettings = function() {
        alert('Video Settings:\n\n' +
              '• Screen Share: Share your screen\n' +
              '• Virtual Background: Blur or replace background\n' +
              '• Recording: Record the call\n' +
              '• Picture-in-Picture: Minimize video\n' +
              '• Beauty Filter: Enhance appearance\n\n' +
              'All features are now active!');
    };
    
    // Auto-show controls when in video call
    if (window.CallingManager) {
        const originalInitiate = window.CallingManager.initiateCall;
        window.CallingManager.initiateCall = function(...args) {
            const result = originalInitiate.apply(this, args);
            if (args[2] === 'video') { // If video call
                setTimeout(showAdvancedControls, 1000);
            }
            return result;
        };
    }
    
    // Expose public API
    window.VideoControlsUI = {
        create: createAdvancedVideoControls,
        show: showAdvancedControls,
        hide: hideAdvancedControls
    };
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createAdvancedVideoControls);
    } else {
        createAdvancedVideoControls();
    }
    
    console.log('✅ [VideoControlsUI] Module loaded');

})();