// 📍 LOCATION SHARING FEATURE MODULE
// Current Location, Live Location, and Saved Places

class LocationSharingModule {
    constructor() {
        this.currentLocation = null;
        this.watchId = null;
        this.isLiveSharing = false;
        this.liveLocationInterval = null;
        this.selectedDuration = 60; // minutes
        this.liveSessionId = null;
        
        // Saved places (in production, load from database)
        this.savedPlaces = [];
        
        console.log('✅ [LOCATION] Module initialized');
    }

    async init() {
        this.createUI();
        this.attachEventListeners();
        await this.loadSavedPlaces();
        console.log('✅ [LOCATION] UI created');
    }

    createUI() {
        // Add location button to chat input (if not exists)
        const inputIconsLeft = document.querySelector('.input-icons-left');
        if (inputIconsLeft && !document.getElementById('location-btn')) {
            const locationBtn = document.createElement('button');
            locationBtn.className = 'input-icon location-btn';
            locationBtn.id = 'location-btn';
            locationBtn.title = 'Share Location';
            locationBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
            `;
            inputIconsLeft.appendChild(locationBtn);
        }

        // Create location menu
        const locationMenu = document.createElement('div');
        locationMenu.className = 'location-menu';
        locationMenu.id = 'location-menu';
        locationMenu.innerHTML = `
            <button class="location-menu-item" id="send-current-location">
                <span class="location-menu-icon">📍</span>
                <div class="location-menu-content">
                    <div class="location-menu-title">Send Current Location</div>
                    <div class="location-menu-desc">Share where you are now</div>
                </div>
            </button>

            <button class="location-menu-item" id="share-live-location">
                <span class="location-menu-icon">📡</span>
                <div class="location-menu-content">
                    <div class="location-menu-title">Share Live Location</div>
                    <div class="location-menu-desc">Update location in real-time</div>
                </div>
            </button>

            <button class="location-menu-item" id="send-saved-place">
                <span class="location-menu-icon">⭐</span>
                <div class="location-menu-content">
                    <div class="location-menu-title">Send Saved Place</div>
                    <div class="location-menu-desc">Share a saved location</div>
                </div>
            </button>
        `;

        const inputWrapper = document.querySelector('.chat-input-wrapper');
        if (inputWrapper) {
            inputWrapper.appendChild(locationMenu);
        }

        // Create location modal
        this.createLocationModal();

        // Create saved places modal
        this.createSavedPlacesModal();
    }

    createLocationModal() {
        const modal = document.createElement('div');
        modal.className = 'location-modal';
        modal.id = 'location-modal';
        modal.innerHTML = `
            <div class="location-modal-container">
                <div class="location-modal-header">
                    <h3 class="location-modal-title">
                        <span id="location-modal-icon">📍</span>
                        <span id="location-modal-title-text">Select Location</span>
                    </h3>
                    <button class="location-modal-close" id="location-modal-close">×</button>
                </div>

                <div class="location-map-container">
                    <div id="location-map" class="map-placeholder">
                        <div class="map-placeholder-icon">🗺️</div>
                        <div>Loading map...</div>
                    </div>

                    <div class="map-center-marker">📍</div>

                    <div class="map-controls">
                        <button class="map-control-btn" id="recenter-map-btn" title="Center on current location">
                            🎯
                        </button>
                        <button class="map-control-btn" id="zoom-in-btn" title="Zoom in">
                            +
                        </button>
                        <button class="map-control-btn" id="zoom-out-btn" title="Zoom out">
                            −
                        </button>
                    </div>
                </div>

                <div class="location-info-panel">
                    <div class="location-info-loading" id="location-info-loading">
                        <div class="location-spinner"></div>
                        Getting location info...
                    </div>

                    <div class="location-info-details" id="location-info-details">
                        <div class="location-info-item">
                            <span class="location-info-icon">📍</span>
                            <div class="location-info-text">
                                <div class="location-info-label">Address</div>
                                <div class="location-info-value" id="location-address">--</div>
                            </div>
                        </div>

                        <div class="location-info-item">
                            <span class="location-info-icon">🗺️</span>
                            <div class="location-info-text">
                                <div class="location-info-label">Coordinates</div>
                                <div class="location-info-value location-coordinates" id="location-coords">--</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="live-location-duration" id="live-location-duration" style="display: none;">
                    <button class="duration-option" data-duration="15">15 min</button>
                    <button class="duration-option active" data-duration="60">1 hour</button>
                    <button class="duration-option" data-duration="480">8 hours</button>
                </div>

                <div class="location-actions">
                    <button class="location-action-btn location-cancel-btn" id="location-cancel-btn">
                        Cancel
                    </button>
                    <button class="location-action-btn location-send-btn" id="location-send-btn" disabled>
                        <span id="location-send-icon">📍</span>
                        <span id="location-send-text">Send Location</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    createSavedPlacesModal() {
        const modal = document.createElement('div');
        modal.className = 'location-modal';
        modal.id = 'saved-places-modal';
        modal.innerHTML = `
            <div class="location-modal-container" style="height: auto; max-height: 80vh;">
                <div class="location-modal-header">
                    <h3 class="location-modal-title">
                        <span>⭐</span>
                        <span>Saved Places</span>
                    </h3>
                    <button class="location-modal-close" id="saved-places-close">×</button>
                </div>

                <div class="saved-places-list" id="saved-places-list">
                    <!-- Saved places will be populated here -->
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    attachEventListeners() {
        // Location button click
        const locationBtn = document.getElementById('location-btn');
        if (locationBtn) {
            locationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLocationMenu();
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('location-menu');
            const btn = document.getElementById('location-btn');
            
            if (menu && !menu.contains(e.target) && e.target !== btn) {
                menu.classList.remove('show');
            }
        });

        // Menu options
        const sendCurrentBtn = document.getElementById('send-current-location');
        const shareLiveBtn = document.getElementById('share-live-location');
        const sendSavedBtn = document.getElementById('send-saved-place');

        if (sendCurrentBtn) {
            sendCurrentBtn.addEventListener('click', () => {
                this.openCurrentLocation();
            });
        }

        if (shareLiveBtn) {
            shareLiveBtn.addEventListener('click', () => {
                this.openLiveLocation();
            });
        }

        if (sendSavedBtn) {
            sendSavedBtn.addEventListener('click', () => {
                this.openSavedPlaces();
            });
        }

        // Modal controls
        const modalClose = document.getElementById('location-modal-close');
        const cancelBtn = document.getElementById('location-cancel-btn');
        const sendBtn = document.getElementById('location-send-btn');

        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeLocationModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeLocationModal();
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.sendLocation();
            });
        }

        // Map controls
        const recenterBtn = document.getElementById('recenter-map-btn');
        if (recenterBtn) {
            recenterBtn.addEventListener('click', () => {
                this.recenterMap();
            });
        }

        // Duration options
        document.querySelectorAll('.duration-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.duration-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedDuration = parseInt(btn.dataset.duration);
            });
        });

        // Saved places modal
        const savedPlacesClose = document.getElementById('saved-places-close');
        if (savedPlacesClose) {
            savedPlacesClose.addEventListener('click', () => {
                this.closeSavedPlacesModal();
            });
        }
    }

    toggleLocationMenu() {
        const menu = document.getElementById('location-menu');
        if (menu) {
            menu.classList.toggle('show');
        }
    }

    closeLocationMenu() {
        const menu = document.getElementById('location-menu');
        if (menu) {
            menu.classList.remove('show');
        }
    }

    // ============================================
    // 📍 CURRENT LOCATION
    // ============================================

    async openCurrentLocation() {
        this.closeLocationMenu();
        
        const modal = document.getElementById('location-modal');
        const titleText = document.getElementById('location-modal-title-text');
        const titleIcon = document.getElementById('location-modal-icon');
        const sendIcon = document.getElementById('location-send-icon');
        const sendText = document.getElementById('location-send-text');
        const durationPanel = document.getElementById('live-location-duration');

        if (titleText) titleText.textContent = 'Send Current Location';
        if (titleIcon) titleIcon.textContent = '📍';
        if (sendIcon) sendIcon.textContent = '📍';
        if (sendText) sendText.textContent = 'Send Location';
        if (durationPanel) durationPanel.style.display = 'none';

        if (modal) {
            modal.classList.add('show');
        }

        this.isLiveSharing = false;
        await this.getCurrentLocation();
    }

    async getCurrentLocation() {
        try {
            console.log('📍 [LOCATION] Getting current location...');

            const sendBtn = document.getElementById('location-send-btn');
            if (sendBtn) {
                sendBtn.disabled = true;
            }

            // Check if geolocation is supported
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by your browser');
            }

            // Get position
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            this.currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date().toISOString()
            };

            console.log('✅ [LOCATION] Location obtained:', this.currentLocation);

            // Update UI
            this.updateLocationDisplay();

            // Get address
            await this.reverseGeocode(this.currentLocation.lat, this.currentLocation.lng);

            // Enable send button
            if (sendBtn) {
                sendBtn.disabled = false;
            }

            if (window.showNotification) {
                window.showNotification('Location obtained', 'success');
            }

        } catch (error) {
            console.error('❌ [LOCATION] Error:', error);

            let errorMessage = 'Failed to get location';

            if (error.code === 1) {
                errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            } else if (error.code === 2) {
                errorMessage = 'Location unavailable. Please check your GPS settings.';
            } else if (error.code === 3) {
                errorMessage = 'Location request timeout. Please try again.';
            }

            if (window.showNotification) {
                window.showNotification(errorMessage, 'error');
            }
        }
    }

    updateLocationDisplay() {
        const coords = document.getElementById('location-coords');
        const mapPlaceholder = document.getElementById('location-map');
        const loadingInfo = document.getElementById('location-info-loading');
        const detailsInfo = document.getElementById('location-info-details');

        if (coords && this.currentLocation) {
            coords.textContent = `${this.currentLocation.lat.toFixed(6)}, ${this.currentLocation.lng.toFixed(6)}`;
        }

        // Update map (in real implementation, use Google Maps or Leaflet)
        if (mapPlaceholder) {
            mapPlaceholder.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 15px; color: rgba(233, 237, 239, 0.6);">
                    <div style="font-size: 64px;">🗺️</div>
                    <div>Map View</div>
                    <div style="font-size: 14px;">${this.currentLocation.lat.toFixed(4)}, ${this.currentLocation.lng.toFixed(4)}</div>
                </div>
            `;
        }

        if (loadingInfo) {
            loadingInfo.style.display = 'none';
        }

        if (detailsInfo) {
            detailsInfo.classList.add('show');
        }
    }

    async reverseGeocode(lat, lng) {
        try {
            // Use our backend reverse geocoding endpoint
            const response = await fetch('/api/reverse-geocode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lat, lng })
            });

            const result = await response.json();

            if (result.success) {
                const address = result.address;
                
                const addressEl = document.getElementById('location-address');
                if (addressEl) {
                    addressEl.textContent = address;
                }

                this.currentLocation.address = address;
            }

        } catch (error) {
            console.error('❌ [LOCATION] Geocoding error:', error);
            
            const addressEl = document.getElementById('location-address');
            if (addressEl) {
                addressEl.textContent = 'Address unavailable';
            }
        }
    }

    recenterMap() {
        if (this.currentLocation) {
            console.log('🎯 [LOCATION] Recentering map');
            this.updateLocationDisplay();
        }
    }

    // ============================================
    // 📡 LIVE LOCATION
    // ============================================

    async openLiveLocation() {
        this.closeLocationMenu();
        
        const modal = document.getElementById('location-modal');
        const titleText = document.getElementById('location-modal-title-text');
        const titleIcon = document.getElementById('location-modal-icon');
        const sendIcon = document.getElementById('location-send-icon');
        const sendText = document.getElementById('location-send-text');
        const durationPanel = document.getElementById('live-location-duration');

        if (titleText) titleText.textContent = 'Share Live Location';
        if (titleIcon) titleIcon.textContent = '📡';
        if (sendIcon) sendIcon.textContent = '📡';
        if (sendText) sendText.textContent = 'Start Sharing';
        if (durationPanel) durationPanel.style.display = 'flex';

        if (modal) {
            modal.classList.add('show');
        }

        this.isLiveSharing = true;
        await this.getCurrentLocation();
    }

    startLiveLocationSharing() {
        console.log('📡 [LOCATION] Starting live location sharing...');

        // Watch position
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                };

                console.log('📡 [LOCATION] Location updated:', this.currentLocation);

                // Send update via WebSocket
                const currentChatUser = window.currentChatUser;
                if (window.socket && currentChatUser && this.liveSessionId) {
                    window.socket.emit('update_live_location', {
                        target_user: currentChatUser,
                        location: this.currentLocation,
                        session_id: this.liveSessionId
                    });
                }
            },
            (error) => {
                console.error('❌ [LOCATION] Watch error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );

        // Auto-stop after duration
        setTimeout(() => {
            this.stopLiveLocationSharing();
        }, this.selectedDuration * 60 * 1000);
    }

    stopLiveLocationSharing() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        if (this.liveLocationInterval) {
            clearInterval(this.liveLocationInterval);
            this.liveLocationInterval = null;
        }

        // Notify server
        if (this.liveSessionId) {
            fetch('/api/stop-live-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: this.liveSessionId,
                    user_id: window.currentUser?.id
                })
            });
        }

        // Notify via WebSocket
        const currentChatUser = window.currentChatUser;
        if (window.socket && currentChatUser) {
            window.socket.emit('stop_live_location', {
                target_user: currentChatUser,
                session_id: this.liveSessionId
            });
        }

        console.log('🛑 [LOCATION] Live location sharing stopped');

        if (window.showNotification) {
            window.showNotification('Live location sharing stopped', 'info');
        }

        this.liveSessionId = null;
    }

    // ============================================
    // ⭐ SAVED PLACES
    // ============================================

    async loadSavedPlaces() {
        try {
            const response = await fetch(`/api/saved-places?user_id=${window.currentUser?.id || 'default'}`);
            const result = await response.json();

            if (result.success) {
                this.savedPlaces = result.places;
                console.log('✅ [LOCATION] Saved places loaded:', this.savedPlaces.length);
            }
        } catch (error) {
            console.error('❌ [LOCATION] Failed to load saved places:', error);
        }
    }

    openSavedPlaces() {
        this.closeLocationMenu();

        const modal = document.getElementById('saved-places-modal');
        if (modal) {
            modal.classList.add('show');
        }

        this.populateSavedPlaces();
    }

    populateSavedPlaces() {
        const list = document.getElementById('saved-places-list');
        if (!list) return;

        list.innerHTML = '';

        if (this.savedPlaces.length === 0) {
            list.innerHTML = '<div style="padding: 40px; text-align: center; color: rgba(233, 237, 239, 0.6);">No saved places yet</div>';
            return;
        }

        this.savedPlaces.forEach(place => {
            const item = document.createElement('div');
            item.className = 'saved-place-item';
            item.innerHTML = `
                <span class="saved-place-icon">${place.icon}</span>
                <div class="saved-place-info">
                    <div class="saved-place-name">${place.name}</div>
                    <div class="saved-place-address">${place.address}</div>
                </div>
            `;

            item.addEventListener('click', () => {
this.sendSavedPlace(place);
            });

            list.appendChild(item);
        });
    }

    closeSavedPlacesModal() {
        const modal = document.getElementById('saved-places-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    async sendSavedPlace(place) {
        this.closeSavedPlacesModal();

        console.log('⭐ [LOCATION] Sending saved place:', place.name);

        const currentChatUser = window.currentChatUser;
        if (!currentChatUser) {
            if (window.showNotification) {
                window.showNotification('Please select a chat first', 'error');
            }
            return;
        }

        try {
            const response = await fetch('/api/send-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from_user: window.currentUser?.id,
                    to_user: currentChatUser?.id || currentChatUser,
                    location: {
                        lat: place.lat,
                        lng: place.lng,
                        address: place.address
                    },
                    is_live: false
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ [LOCATION] Saved place sent');

                // Display in chat
                this.displayLocationMessage(place, false);

                // Broadcast via WebSocket
                if (window.socket) {
                    window.socket.emit('send_location', {
                        target_user: currentChatUser,
                        location: {
                            lat: place.lat,
                            lng: place.lng,
                            address: place.address
                        },
                        is_live: false
                    });
                }

                if (window.showNotification) {
                    window.showNotification('Location sent', 'success');
                }
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('❌ [LOCATION] Send error:', error);
            if (window.showNotification) {
                window.showNotification('Failed to send location: ' + error.message, 'error');
            }
        }
    }

    // ============================================
    // 📤 SEND LOCATION
    // ============================================

    async sendLocation() {
        if (!this.currentLocation) {
            if (window.showNotification) {
                window.showNotification('Location not available', 'error');
            }
            return;
        }

        const currentChatUser = window.currentChatUser;
        if (!currentChatUser) {
            if (window.showNotification) {
                window.showNotification('Please select a chat first', 'error');
            }
            return;
        }

        console.log('📤 [LOCATION] Sending location...');

        try {
            const response = await fetch('/api/send-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from_user: window.currentUser?.id,
                    to_user: currentChatUser?.id || currentChatUser,
                    location: this.currentLocation,
                    is_live: this.isLiveSharing,
                    duration: this.isLiveSharing ? this.selectedDuration : null
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ [LOCATION] Location sent:', result);

                this.liveSessionId = result.session_id;

                // Display in chat
                this.displayLocationMessage(this.currentLocation, this.isLiveSharing);

                // Broadcast via WebSocket
                if (window.socket) {
                    window.socket.emit('send_location', {
                        target_user: currentChatUser,
                        location: this.currentLocation,
                        is_live: this.isLiveSharing,
                        duration: this.selectedDuration,
                        session_id: this.liveSessionId
                    });
                }

                // Start live sharing if enabled
                if (this.isLiveSharing) {
                    this.startLiveLocationSharing();
                }

                // Close modal
                this.closeLocationModal();

                if (window.showNotification) {
                    window.showNotification(
                        this.isLiveSharing ? 'Live location sharing started' : 'Location sent',
                        'success'
                    );
                }
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('❌ [LOCATION] Send error:', error);
            if (window.showNotification) {
                window.showNotification('Failed to send location: ' + error.message, 'error');
            }
        }
    }

    displayLocationMessage(location, isLive) {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-sent ${isLive ? 'live-location-message' : ''}`;
        
        let liveIndicator = '';
        if (isLive) {
            liveIndicator = `
                <div class="live-location-pulse"></div>
                <div class="live-location-timer">
                    📡 Live · ${this.selectedDuration} min
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="location-message">
                    <div class="location-preview-map">
                        ${liveIndicator}
                        <div class="location-preview-marker">📍</div>
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(233, 237, 239, 0.6);">
                            🗺️ Map Preview
                        </div>
                    </div>
                    <div class="location-message-info">
                        <div class="location-message-address">
                            ${location.address || 'Shared Location'}
                        </div>
                        <div class="location-message-coords">
                            ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}
                        </div>
                        <div class="location-message-actions">
                            <button class="location-open-btn" onclick="window.open('https://maps.google.com/?q=${location.lat},${location.lng}', '_blank')">
                                Open in Maps
                            </button>
                            ${isLive ? `
                                <button class="location-stop-btn" onclick="window.locationSharing.stopLiveLocationSharing()">
                                    Stop Sharing
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    closeLocationModal() {
        const modal = document.getElementById('location-modal');
        if (modal) {
            modal.classList.remove('show');
        }

        // Reset state
        this.currentLocation = null;
        
        const sendBtn = document.getElementById('location-send-btn');
        if (sendBtn) {
            sendBtn.disabled = true;
        }

        const loadingInfo = document.getElementById('location-info-loading');
        const detailsInfo = document.getElementById('location-info-details');

        if (loadingInfo) {
            loadingInfo.style.display = 'flex';
        }

        if (detailsInfo) {
            detailsInfo.classList.remove('show');
        }
    }
}

// Export to global scope
window.locationSharing = new LocationSharingModule();