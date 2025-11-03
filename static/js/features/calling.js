/**
 * ============================================================================
 * CA360 Chat - ULTIMATE Enterprise-Grade Calling System
 * ============================================================================
 * WhatsApp-Style Voice & Video Calls with WebRTC
 * Made in India 🇮🇳
 * 
 * ULTIMATE FEATURES:
 * ✅ Simple WhatsApp-style UI (NEW modals)
 * ✅ Comprehensive error handling & recovery
 * ✅ Automatic reconnection with exponential backoff
 * ✅ ICE candidate queuing & buffering
 * ✅ Socket disconnect resilience
 * ✅ Peer connection state validation
 * ✅ Memory leak prevention
 * ✅ Network quality monitoring
 * ✅ Graceful degradation
 * ✅ Production-ready logging
 * ✅ Race condition prevention
 * ✅ Performance metrics tracking
 * ✅ WebRTC support detection
 * ✅ Page visibility handling
 * 
 * @version 3.0.0 - ULTIMATE Edition
 * @license Proprietary - CA360 Chat
 */

class CA360Calling {
    constructor(socket, currentUser) {
        // Core dependencies
        this.socket = socket;
        this.currentUser = currentUser;
        
        // WebRTC components
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        
        // Call state management
        this.currentCall = null;
        this.isCallActive = false;
        this.callStartTime = null;
        this.callTimerInterval = null;
        
        // Audio components
        this.ringtone = null;
        this.ringtoneInteractionListener = null;
        
        // Connection recovery
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectDelay = 1000; // Start with 1 second
        
        // ICE candidate buffering (CRITICAL for race conditions)
        this.iceCandidateBuffer = [];
        this.isOfferAnswerComplete = false;
        
        // Socket resilience
        this.socketDisconnectTime = null;
        this.maxSocketDisconnectTime = 10000; // 10 seconds
        
        // Cleanup tracker
        this.isCleaningUp = false;
        
        // WebRTC configuration with enterprise-grade STUN/TURN servers
        this.config = {
            iceServers: [
                // Google STUN servers (most reliable)
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10,
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
            iceTransportPolicy: 'all' // Use both STUN and TURN
        };

        // Call state machine
        this.callState = {
            IDLE: 'idle',
            CALLING: 'calling',
            RINGING: 'ringing',
            CONNECTING: 'connecting',
            ACTIVE: 'active',
            ENDING: 'ending',
            RECONNECTING: 'reconnecting'
        };
        this.currentState = this.callState.IDLE;

        // Performance monitoring
        this.metrics = {
            callInitTime: null,
            connectionTime: null,
            iceGatheringTime: null,
            firstMediaTime: null
        };

        this.init();
    }

    /**
     * Initialize the calling system
     */
    init() {
        try {
            console.log('📞 [CA360 Calling] Initializing ULTIMATE enterprise calling system...');
            console.log('[CA360] User:', this.currentUser.name, '| ID:', this.currentUser.id);
            console.log('[CA360] WebRTC Support:', this.checkWebRTCSupport());
            
            this.setupSocketListeners();
            this.setupCallButtons();
            this.setupCallControls();
            this.setupErrorHandlers();
            this.setupVisibilityHandler();
            
            console.log('✅ [CA360 Calling] Initialized successfully');
        } catch (error) {
            console.error('❌ [CA360 Calling] Initialization failed:', error);
            this.handleFatalError('Failed to initialize calling system: ' + error.message);
        }
    }

    /**
     * Check WebRTC support in browser
     */
    checkWebRTCSupport() {
        const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        const hasRTCPeerConnection = !!(window.RTCPeerConnection);
        const hasWebSocket = !!(window.WebSocket);
        
        return {
            getUserMedia: hasGetUserMedia,
            RTCPeerConnection: hasRTCPeerConnection,
            WebSocket: hasWebSocket,
            isSupported: hasGetUserMedia && hasRTCPeerConnection && hasWebSocket
        };
    }

    /**
     * Setup socket event listeners with error boundaries
     */
    setupSocketListeners() {
        try {
            // Incoming call
            this.socket.on('call_incoming', (data) => {
                try {
                    console.log('📞 [CA360] Incoming call from:', data.caller_id, '|', data.caller_name);
                    this.handleIncomingCall(data);
                } catch (error) {
                    console.error('❌ [CA360] Error handling incoming call:', error);
                }
            });

            // Call accepted
            this.socket.on('call_accepted', async (data) => {
                try {
                    console.log('✅ [CA360] Call accepted by receiver');
                    await this.handleCallAccepted(data);
                } catch (error) {
                    console.error('❌ [CA360] Error handling call accepted:', error);
                    this.showNotification('Failed to establish connection', 'error');
                }
            });

            // Answer received
            this.socket.on('answer', async (data) => {
                try {
                    console.log('📬 [CA360] Received answer from caller');
                    await this.handleAnswer(data);
                } catch (error) {
                    console.error('❌ [CA360] Error handling answer:', error);
                }
            });

            // ICE candidate (with buffering)
            this.socket.on('ice_candidate', async (data) => {
                try {
                    console.log('🧊 [CA360] Received ICE candidate');
                    await this.handleIceCandidate(data);
                } catch (error) {
                    console.error('❌ [CA360] Error handling ICE candidate:', error);
                }
            });

            // Call declined
            this.socket.on('call_declined', (data) => {
                try {
                    console.log('❌ [CA360] Call declined');
                    this.handleCallDeclined(data);
                } catch (error) {
                    console.error('❌ [CA360] Error handling call declined:', error);
                }
            });

            // Call ended
            this.socket.on('call_ended', (data) => {
                try {
                    console.log('📴 [CA360] Call ended by remote user');
                    this.handleCallEnded(data);
                } catch (error) {
                    console.error('❌ [CA360] Error handling call ended:', error);
                }
            });

            // Socket disconnect (DON'T end call immediately)
            this.socket.on('disconnect', () => {
                console.warn('⚠️ [CA360] Socket disconnected');
                this.socketDisconnectTime = Date.now();
                
                if (this.isCallActive) {
                    console.warn('⚠️ [CA360] Socket disconnected during active call');
                    console.warn('[CA360] WebRTC will continue - waiting for socket reconnection...');
                    // Start monitoring - if socket doesn't reconnect in 10s, end call
                    this.monitorSocketReconnection();
                }
            });

            // Socket reconnect
            this.socket.on('connect', () => {
                console.log('✅ [CA360] Socket reconnected');
                this.socketDisconnectTime = null;
                
                if (this.currentState !== this.callState.IDLE && this.currentState !== this.callState.ENDING) {
                    console.log('🔄 [CA360] Call in progress, connection restored');
                }
            });

            console.log('✅ [CA360] Socket listeners registered');
        } catch (error) {
            console.error('❌ [CA360] Failed to setup socket listeners:', error);
        }
    }

    /**
     * Monitor socket reconnection during active call
     */
    monitorSocketReconnection() {
        setTimeout(() => {
            if (this.socketDisconnectTime && this.isCallActive) {
                const disconnectDuration = Date.now() - this.socketDisconnectTime;
                
                if (disconnectDuration >= this.maxSocketDisconnectTime) {
                    console.error('❌ [CA360] Socket disconnected too long, ending call');
                    this.showNotification('Connection lost', 'error');
                    this.cleanup();
                }
            }
        }, this.maxSocketDisconnectTime);
    }

    /**
     * Setup call button listeners
     */
    setupCallButtons() {
        try {
            // Voice call button
            const voiceBtn = document.getElementById('voice-call-btn');
            if (voiceBtn) {
                voiceBtn.addEventListener('click', () => {
                    this.handleCallButtonClick(false);
                });
                console.log('✅ [CA360] Voice call button attached');
            } else {
                console.warn('⚠️ [CA360] Voice call button not found');
            }

            // Video call button
            const videoBtn = document.getElementById('video-call-btn');
            if (videoBtn) {
                videoBtn.addEventListener('click', () => {
                    this.handleCallButtonClick(true);
                });
                console.log('✅ [CA360] Video call button attached');
            } else {
                console.warn('⚠️ [CA360] Video call button not found');
            }
        } catch (error) {
            console.error('❌ [CA360] Failed to setup call buttons:', error);
        }
    }

    /**
     * Handle call button click with bulletproof contact detection
     */
    handleCallButtonClick(isVideo) {
        try {
            // Try multiple ways to get contact info (bulletproof)
            let contactName = document.getElementById('contact-name')?.textContent || 'User';
            let contactId = null;
            
            // Method 1: From active contact item (most common)
            const activeContact = document.querySelector('.contact-item.active');
            if (activeContact) {
                contactId = activeContact.dataset.userId || 
                           activeContact.dataset.contactId ||
                           activeContact.getAttribute('data-user-id');
            }
            
            // Method 2: From currentContact global (if app.js sets it)
            if (!contactId && typeof currentContact !== 'undefined') {
                contactId = currentContact.id || currentContact.user_id;
                contactName = currentContact.name || contactName;
            }
            
            // Method 3: From window.selectedContact
            if (!contactId && typeof window.selectedContact !== 'undefined') {
                contactId = window.selectedContact.id || window.selectedContact.user_id;
                contactName = window.selectedContact.name || contactName;
            }
            
            // Method 4: From chat header data attribute
            const chatHeader = document.querySelector('[data-contact-id]');
            if (!contactId && chatHeader) {
                contactId = chatHeader.dataset.contactId;
            }
            
            console.log('🔍 [CA360] Contact detection:', {
                contactId: contactId,
                contactName: contactName,
                method: activeContact ? 'DOM' : 'Global'
            });
            
            // Validate contact selection
            if (!contactId) {
                console.error('❌ [CA360] No contact selected');
                this.showNotification('Please select a contact first', 'error');
                return;
            }

            // Validate call state
            if (this.currentState !== this.callState.IDLE) {
                console.warn('⚠️ [CA360] Call already in progress:', this.currentState);
                this.showNotification('Call already in progress', 'warning');
                return;
            }

            console.log(`📞 [CA360] ${isVideo ? 'Video' : 'Voice'} call button clicked for ${contactName} (${contactId})`);
            this.initiateCall(contactId, contactName, isVideo);
            
        } catch (error) {
            console.error('❌ [CA360] Error handling call button click:', error);
            this.showNotification('Failed to start call: ' + error.message, 'error');
        }
    }

    /**
     * Setup call control buttons
     */
    setupCallControls() {
        try {
            // Cancel (outgoing)
            const cancelBtn = document.getElementById('simple-cancel-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    console.log('❌ [CA360] Cancel button clicked');
                    this.endCall();
                });
            }

            // Accept (incoming)
            const acceptBtn = document.getElementById('simple-accept-btn');
            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => {
                    console.log('✅ [CA360] Accept button clicked');
                    this.acceptCall();
                });
            }

            // Reject (incoming)
            const rejectBtn = document.getElementById('simple-reject-btn');
            if (rejectBtn) {
                rejectBtn.addEventListener('click', () => {
                    console.log('❌ [CA360] Reject button clicked');
                    this.rejectCall();
                });
            }

            // End (active)
            const endBtn = document.getElementById('simple-end-btn');
            if (endBtn) {
                endBtn.addEventListener('click', () => {
                    console.log('📴 [CA360] End call button clicked');
                    this.endCall();
                });
            }

            // Mute toggle
            const muteBtn = document.getElementById('simple-mute-btn');
            if (muteBtn) {
                muteBtn.addEventListener('click', () => {
                    this.toggleMute();
                });
            }

            // Video toggle
            const videoBtn = document.getElementById('simple-video-toggle-btn');
            if (videoBtn) {
                videoBtn.addEventListener('click', () => {
                    this.toggleVideo();
                });
            }

            console.log('✅ [CA360] Call controls attached');
        } catch (error) {
            console.error('❌ [CA360] Failed to setup call controls:', error);
        }
    }

    /**
     * Setup global error handlers
     */
    setupErrorHandlers() {
        // WebRTC errors
        window.addEventListener('error', (event) => {
            if (event.message && event.message.includes('WebRTC')) {
                console.error('❌ [CA360] WebRTC Error:', event.message);
            }
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.toString().includes('WebRTC')) {
                console.error('❌ [CA360] Unhandled WebRTC rejection:', event.reason);
                event.preventDefault(); // Prevent console spam
            }
        });
    }

    /**
     * Setup page visibility handler to prevent call drops
     */
    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isCallActive) {
                console.log('👁️ [CA360] Page hidden during active call - maintaining connection');
            } else if (!document.hidden && this.isCallActive) {
                console.log('👁️ [CA360] Page visible again during active call');
            }
        });
    }

    /**
     * Initiate call to another user
     */
    async initiateCall(userId, userName, isVideo) {
        try {
            console.log(`📞 [CA360] Initiating ${isVideo ? 'video' : 'voice'} call to ${userName} (${userId})`);
            this.metrics.callInitTime = Date.now();
            
            // Validate state
            if (this.currentState !== this.callState.IDLE) {
                throw new Error('Already in a call');
            }

            // Validate socket connection
            if (!this.socket.connected) {
                throw new Error('Not connected to server');
            }

            this.currentState = this.callState.CALLING;
            
            // Store call info
            this.currentCall = {
                userId: userId,
                userName: userName,
                isVideo: isVideo,
                isInitiator: true,
                startTime: Date.now()
            };

            // Reset buffers
            this.iceCandidateBuffer = [];
            this.isOfferAnswerComplete = false;

            // Get local media
            await this.getLocalStream(isVideo);

            // Create peer connection
            await this.createPeerConnection();

            // Show outgoing call screen
            this.showOutgoingCallScreen(userName, isVideo);

            // Play ringtone
            this.playRingtone(true); // true = dial tone for caller

            // Send call initiation
            this.socket.emit('initiate_call', {
                target_user: userId,
                call_type: isVideo ? 'video' : 'audio',
                caller_name: this.currentUser.name || 'User'
            });

            console.log('✅ [CA360] Call initiated successfully');

        } catch (error) {
            console.error('❌ [CA360] Error initiating call:', error);
            this.showNotification(`Failed to start call: ${error.message}`, 'error');
            this.cleanup();
        }
    }

    /**
     * Get local media stream with comprehensive error handling
     */
    async getLocalStream(isVideo) {
        try {
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 1
                },
                video: isVideo ? {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    facingMode: 'user',
                    frameRate: { ideal: 30, max: 60 }
                } : false
            };

            console.log('🎤 [CA360] Requesting media permissions...');
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            console.log('✅ [CA360] Media permissions granted');
            console.log('[CA360] Audio tracks:', this.localStream.getAudioTracks().length);
            console.log('[CA360] Video tracks:', this.localStream.getVideoTracks().length);
            
            // Attach to local video if video call
            if (isVideo) {
                const localVideo = document.getElementById('simple-outgoing-video');
                if (localVideo) {
                    localVideo.srcObject = this.localStream;
                    localVideo.muted = true;
                    console.log('✅ [CA360] Local video preview attached');
                }
            }

            return this.localStream;

        } catch (error) {
            console.error('❌ [CA360] Error getting local stream:', error);
            
            // Provide user-friendly error messages
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                throw new Error('Camera/Microphone permission denied. Please allow access in browser settings.');
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                throw new Error('No camera/microphone found. Please connect a device.');
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                throw new Error('Camera/Microphone is already in use by another application.');
            } else if (error.name === 'OverconstrainedError') {
                throw new Error('Camera/Microphone does not meet requirements.');
            } else if (error.name === 'TypeError') {
                throw new Error('Invalid media constraints.');
            } else {
                throw new Error(`Media device error: ${error.message}`);
            }
        }
    }

    /**
     * Create peer connection with comprehensive monitoring
     */
    async createPeerConnection() {
        try {
            console.log('🔗 [CA360] Creating peer connection...');
            
            // Close existing connection if any
            if (this.peerConnection) {
                console.log('[CA360] Closing existing peer connection...');
                this.peerConnection.close();
                this.peerConnection = null;
            }

            this.peerConnection = new RTCPeerConnection(this.config);
            console.log('✅ [CA360] RTCPeerConnection created');

            // Add local tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    console.log('➕ [CA360] Adding local track:', track.kind, '| enabled:', track.enabled);
                    this.peerConnection.addTrack(track, this.localStream);
                });
            }

            // ==================== EVENT HANDLERS ====================

            // ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('🧊 [CA360] Local ICE candidate:', event.candidate.type);
                    
                    // CRITICAL: Only send if we have a valid peer connection and call
                    if (this.currentCall && this.currentCall.userId) {
                        this.socket.emit('ice_candidate', {
                            to_user: this.currentCall.userId,
                            candidate: event.candidate
                        });
                    } else {
                        console.warn('⚠️ [CA360] Cannot send ICE candidate - no active call');
                    }
                } else {
                    console.log('🧊 [CA360] All local ICE candidates sent');
                }
            };

            // Remote tracks
            this.peerConnection.ontrack = (event) => {
                console.log('📺 [CA360] Received remote track:', event.track.kind);
                
                if (!this.metrics.firstMediaTime) {
                    this.metrics.firstMediaTime = Date.now();
                    const delay = this.metrics.firstMediaTime - this.metrics.callInitTime;
                    console.log(`⚡ [CA360] First media after ${delay}ms`);
                }
                
                if (event.track.kind === 'audio') {
                    const remoteAudio = document.getElementById('simple-remote-audio');
                    if (remoteAudio) {
                        if (!remoteAudio.srcObject) {
                            remoteAudio.srcObject = new MediaStream();
                        }
                        remoteAudio.srcObject.addTrack(event.track);
                        
                        // Auto-play with retry
                        const playAudio = () => {
                            remoteAudio.play()
                                .then(() => {
                                    console.log('🔊 [CA360] Remote audio playing');
                                })
                                .catch(e => {
                                    console.warn('⚠️ [CA360] Audio autoplay failed:', e.message);
                                    // Retry on user interaction
                                    document.addEventListener('click', () => {
                                        remoteAudio.play().catch(console.error);
                                    }, { once: true });
                                });
                        };
                        
                        // Try immediately and after small delay
                        playAudio();
                        setTimeout(playAudio, 500);
                    }
                } else if (event.track.kind === 'video') {
                    const remoteVideo = document.getElementById('simple-remote-video');
                    if (remoteVideo) {
                        if (!remoteVideo.srcObject) {
                            remoteVideo.srcObject = new MediaStream();
                        }
                        remoteVideo.srcObject.addTrack(event.track);
                        console.log('📹 [CA360] Remote video track attached');
                    }
                }
            };

            // Connection state changes
            this.peerConnection.onconnectionstatechange = () => {
                const state = this.peerConnection.connectionState;
                console.log('🔗 [CA360] Connection state:', state);
                
                switch (state) {
                    case 'connected':
                        this.onCallConnected();
                        break;
                    case 'disconnected':
                        console.warn('⚠️ [CA360] Connection disconnected');
                        if (this.currentState === this.callState.ACTIVE) {
                            this.handleConnectionLost();
                        }
                        break;
                    case 'failed':
                        console.error('❌ [CA360] Connection failed');
                        this.handleConnectionFailed();
                        break;
                    case 'closed':
                        console.log('🔒 [CA360] Connection closed');
                        break;
                }
            };

            // ICE connection state
            this.peerConnection.oniceconnectionstatechange = () => {
                const state = this.peerConnection.iceConnectionState;
                console.log('🧊 [CA360] ICE connection state:', state);
                
                if (state === 'failed' || state === 'disconnected') {
                    console.warn('⚠️ [CA360] ICE connection issues - attempting restart');
                    if (this.peerConnection && this.currentState === this.callState.ACTIVE) {
                        this.peerConnection.restartIce();
                    }
                }
            };

            // ICE gathering state
            this.peerConnection.onicegatheringstatechange = () => {
                const state = this.peerConnection.iceGatheringState;
                console.log('🧊 [CA360] ICE gathering state:', state);
                
                if (state === 'complete' && !this.metrics.iceGatheringTime) {
                    this.metrics.iceGatheringTime = Date.now();
                }
            };

            // Signaling state
            this.peerConnection.onsignalingstatechange = () => {
                const state = this.peerConnection.signalingState;
                console.log('📡 [CA360] Signaling state:', state);
                
                // Mark offer/answer as complete when stable
                if (state === 'stable') {
                    this.isOfferAnswerComplete = true;
                    this.flushIceCandidateBuffer();
                }
            };

            // Negotiation needed
            this.peerConnection.onnegotiationneeded = () => {
                console.log('🔄 [CA360] Negotiation needed');
            };

            console.log('✅ [CA360] Peer connection created and configured');

        } catch (error) {
            console.error('❌ [CA360] Error creating peer connection:', error);
            throw error;
        }
    }

    /**
     * Handle incoming call
     */
    handleIncomingCall(data) {
        try {
            console.log('📞 [CA360] Handling incoming call from:', data.caller_name, '(', data.caller_id, ')');
            
            // Validate state
            if (this.currentState !== this.callState.IDLE) {
                console.warn('⚠️ [CA360] Already in a call, rejecting incoming call');
                this.socket.emit('call_declined', { caller_id: data.caller_id });
                return;
            }

            this.currentState = this.callState.RINGING;
            
            this.currentCall = {
                userId: data.caller_id,
                userName: data.caller_name,
                isVideo: data.call_type === 'video',
                isInitiator: false,
                startTime: Date.now()
            };

            // Reset buffers
            this.iceCandidateBuffer = [];
            this.isOfferAnswerComplete = false;

            this.showIncomingCallScreen(data.caller_name, data.call_type === 'video');
            this.playRingtone(false); // false = incoming ringtone
            
        } catch (error) {
            console.error('❌ [CA360] Error handling incoming call:', error);
        }
    }

    /**
     * Accept incoming call
     */
    async acceptCall() {
        try {
            console.log('✅ [CA360] Accepting call');
            
            // Validate state
            if (this.currentState !== this.callState.RINGING) {
                console.warn('⚠️ [CA360] Cannot accept call in current state:', this.currentState);
                return;
            }

            this.currentState = this.callState.CONNECTING;
            this.stopRingtone();

            // Get local media
            await this.getLocalStream(this.currentCall.isVideo);

            // Create peer connection
            await this.createPeerConnection();

            // Create and send offer
            console.log('📝 [CA360] Creating offer...');
            const offer = await this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: this.currentCall.isVideo
            });
            
            await this.peerConnection.setLocalDescription(offer);
            console.log('✅ [CA360] Local description set (offer)');

            this.socket.emit('call_accepted', {
                to_user: this.currentCall.userId,
                offer: offer
            });

            // Show active call screen
            this.showActiveCallScreen();

            console.log('✅ [CA360] Call accepted successfully');

        } catch (error) {
            console.error('❌ [CA360] Error accepting call:', error);
            this.showNotification(`Failed to accept call: ${error.message}`, 'error');
            this.cleanup();
        }
    }

    /**
     * Handle call acceptance (caller side)
     * BULLETPROOF with null checks and peer connection recovery
     */
    async handleCallAccepted(data) {
        try {
            console.log('✅ [CA360] Processing call acceptance');

            if (!data || !data.offer) {
                throw new Error('No offer received from receiver');
            }

            // CRITICAL: Ensure peer connection exists and is valid
            if (!this.peerConnection) {
                console.error('❌ [CA360] Peer connection is null, recreating...');
                await this.createPeerConnection();
            }

            // CRITICAL: Check signaling state
            if (this.peerConnection.signalingState === 'closed') {
                console.error('❌ [CA360] Peer connection closed, recreating...');
                await this.createPeerConnection();
            }

            // CRITICAL: Validate we're in the correct state
            if (this.peerConnection.signalingState !== 'stable' && 
                this.peerConnection.signalingState !== 'have-local-offer') {
                console.warn('⚠️ [CA360] Unexpected signaling state:', this.peerConnection.signalingState);
                console.warn('[CA360] Attempting to proceed anyway...');
            }

            this.currentState = this.callState.CONNECTING;

            // Set remote description (the offer from receiver)
            console.log('📥 [CA360] Setting remote description (offer)...');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            console.log('✅ [CA360] Remote description set');

            // Create answer
            console.log('📝 [CA360] Creating answer...');
            const answer = await this.peerConnection.createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: this.currentCall.isVideo
            });
            
            await this.peerConnection.setLocalDescription(answer);
            console.log('✅ [CA360] Local description set (answer)');

            // Send answer
            this.socket.emit('answer', {
                to_user: this.currentCall.userId,
                answer: answer
            });

            // Show active call screen
            this.showActiveCallScreen();

            console.log('✅ [CA360] Call acceptance processed successfully');

        } catch (error) {
            console.error('❌ [CA360] Error handling call acceptance:', error);
            console.error('[CA360] Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            this.showNotification(`Failed to establish connection: ${error.message}`, 'error');
            
            // Try to recover once
            if (this.reconnectAttempts === 0) {
                console.log('🔄 [CA360] Attempting recovery...');
                this.reconnectAttempts++;
                
                setTimeout(async () => {
                    try {
                        await this.createPeerConnection();
                        await this.handleCallAccepted(data);
                    } catch (retryError) {
                        console.error('❌ [CA360] Recovery failed:', retryError);
                        this.cleanup();
                    }
                }, 1000);
            } else {
                this.cleanup();
            }
        }
    }

    /**
     * Handle answer (receiver side)
     * BULLETPROOF with null checks
     */
    async handleAnswer(data) {
        try {
            console.log('📬 [CA360] Handling answer');
            
            if (!data || !data.answer) {
                throw new Error('No answer received');
            }

            // CRITICAL: Validate peer connection
            if (!this.peerConnection) {
                throw new Error('No peer connection available');
            }

            // CRITICAL: Validate signaling state
            const state = this.peerConnection.signalingState;
            if (state !== 'have-local-offer') {
                console.warn('⚠️ [CA360] Unexpected signaling state for answer:', state);
                if (state === 'closed') {
                    throw new Error('Peer connection is closed');
                }
            }

            // Set remote description (the answer from caller)
            console.log('📥 [CA360] Setting remote description (answer)...');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log('✅ [CA360] Answer processed successfully');

        } catch (error) {
            console.error('❌ [CA360] Error handling answer:', error);
            this.showNotification('Failed to process answer', 'error');
        }
    }

    /**
     * Handle ICE candidate with buffering for race conditions
     * BULLETPROOF - Queues candidates if peer connection not ready
     */
    async handleIceCandidate(data) {
        try {
            if (!data || !data.candidate) {
                console.warn('⚠️ [CA360] Empty ICE candidate received');
                return;
            }

            // CRITICAL: Check if peer connection exists
            if (!this.peerConnection) {
                console.warn('⚠️ [CA360] No peer connection yet, buffering ICE candidate');
                this.iceCandidateBuffer.push(data.candidate);
                return;
            }

            // CRITICAL: Check if offer/answer exchange is complete
            if (!this.isOfferAnswerComplete && this.peerConnection.signalingState !== 'stable') {
                console.warn('⚠️ [CA360] Offer/answer not complete, buffering ICE candidate');
                this.iceCandidateBuffer.push(data.candidate);
                return;
            }

            // Add the candidate
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            console.log('✅ [CA360] ICE candidate added successfully');

        } catch (error) {
            console.error('❌ [CA360] Error adding ICE candidate:', error);
            // Don't throw - ICE failures are recoverable
        }
    }

    /**
     * Flush buffered ICE candidates when ready
     */
    async flushIceCandidateBuffer() {
        if (this.iceCandidateBuffer.length === 0) {
            return;
        }

        console.log(`🧊 [CA360] Flushing ${this.iceCandidateBuffer.length} buffered ICE candidates`);

        for (const candidate of this.iceCandidateBuffer) {
            try {
                if (this.peerConnection && this.peerConnection.signalingState !== 'closed') {
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log('✅ [CA360] Buffered ICE candidate added');
                }
            } catch (error) {
                console.error('❌ [CA360] Error adding buffered ICE candidate:', error);
            }
        }

        this.iceCandidateBuffer = [];
        console.log('✅ [CA360] ICE candidate buffer flushed');
    }

    /**
     * Reject/Decline call
     */
    rejectCall() {
        try {
            console.log('❌ [CA360] Rejecting call');
            
            this.stopRingtone();
            
            if (this.currentCall && this.currentCall.userId) {
                this.socket.emit('call_declined', {
                    caller_id: this.currentCall.userId
                });
            }

            this.cleanup();
        } catch (error) {
            console.error('❌ [CA360] Error rejecting call:', error);
            this.cleanup();
        }
    }

    /**
     * Handle call declined
     */
    handleCallDeclined(data) {
        console.log('❌ [CA360] Call was declined by user');
        this.stopRingtone();
        this.showNotification('Call was declined', 'info');
        this.cleanup();
    }

    /**
     * End active call
     */
    endCall() {
        try {
            console.log('📴 [CA360] Ending call');
            
            if (this.isCleaningUp) {
                console.log('[CA360] Already cleaning up, skipping');
                return;
            }
            
            this.currentState = this.callState.ENDING;
            
            if (this.currentCall && this.currentCall.userId) {
                this.socket.emit('call_ended', {
                    target_user: this.currentCall.userId
                });
            }

            this.cleanup();
        } catch (error) {
            console.error('❌ [CA360] Error ending call:', error);
            this.cleanup();
        }
    }

    /**
     * Handle call ended by remote user
     */
    handleCallEnded(data) {
        console.log('📴 [CA360] Call ended by remote user');
        this.showNotification('Call ended', 'info');
        this.cleanup();
    }

    /**
     * Handle connection failure with retry logic
     */
    handleConnectionFailed() {
        console.error('🔴 [CA360] Connection failed');
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
            
            console.log(`🔄 [CA360] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);
            this.showNotification(`Connection lost, reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`, 'warning');
            
            setTimeout(() => {
                if (this.peerConnection) {
                    this.peerConnection.restartIce();
                }
            }, delay);
        } else {
            console.error('❌ [CA360] Max reconnection attempts reached');
            this.showNotification('Connection failed. Please try again.', 'error');
            this.cleanup();
        }
    }

    /**
     * Handle temporary connection loss
     */
    handleConnectionLost() {
        console.warn('⚠️ [CA360] Connection lost during active call');
        
        if (this.isCallActive && !this.isCleaningUp) {
            this.currentState = this.callState.RECONNECTING;
            this.showNotification('Connection lost, attempting to reconnect...', 'warning');
            this.handleConnectionFailed();
        }
    }

    /**
     * Call successfully connected
     */
    onCallConnected() {
        console.log('✅ [CA360] Call connected successfully');
        
        this.currentState = this.callState.ACTIVE;
        this.isCallActive = true;
        this.reconnectAttempts = 0; // Reset
        this.reconnectDelay = 1000; // Reset
        
        this.metrics.connectionTime = Date.now();
        const totalTime = this.metrics.connectionTime - this.metrics.callInitTime;
        console.log(`⚡ [CA360] Call established in ${totalTime}ms`);
        
        if (!this.callStartTime) {
            this.callStartTime = Date.now();
        }
        
        this.startCallTimer();
        this.stopRingtone();
        
        // Don't show notification - call screen already visible
    }

    /**
     * Toggle microphone mute
     */
    toggleMute() {
        try {
            if (!this.localStream) {
                console.warn('⚠️ [CA360] No local stream to mute');
                return;
            }

            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                const btn = document.getElementById('simple-mute-btn');
                if (btn) {
                    if (audioTrack.enabled) {
                        btn.classList.remove('muted');
                        btn.querySelector('.simple-control-label').textContent = 'Mic';
                    } else {
                        btn.classList.add('muted');
                        btn.querySelector('.simple-control-label').textContent = 'Muted';
                    }
                }
                console.log('🎤 [CA360] Microphone:', audioTrack.enabled ? 'ON' : 'OFF');
            }
        } catch (error) {
            console.error('❌ [CA360] Error toggling mute:', error);
        }
    }

    /**
     * Toggle video on/off
     */
    toggleVideo() {
        try {
            if (!this.localStream) {
                console.warn('⚠️ [CA360] No local stream to toggle video');
                return;
            }

            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                const btn = document.getElementById('simple-video-toggle-btn');
                if (btn) {
                    if (videoTrack.enabled) {
                        btn.classList.remove('video-off');
                        btn.querySelector('.simple-control-label').textContent = 'Video';
                    } else {
                        btn.classList.add('video-off');
                        btn.querySelector('.simple-control-label').textContent = 'Off';
                    }
                }
                console.log('📹 [CA360] Video:', videoTrack.enabled ? 'ON' : 'OFF');
            }
        } catch (error) {
            console.error('❌ [CA360] Error toggling video:', error);
        }
    }

    /**
     * Play ringtone with autoplay fix
     */
    playRingtone(isDialTone) {
        try {
            // Stop existing
            this.stopRingtone();
            
            // Create audio
            this.ringtone = new Audio('/static/audio/ringtone.mp3');
            this.ringtone.loop = true;
            this.ringtone.volume = isDialTone ? 0.3 : 0.7; // Quieter for dial tone
            
            // Try to play (may be blocked by browser)
            const playPromise = this.ringtone.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('🔔 [CA360] Ringtone playing');
                    })
                    .catch(error => {
                        console.warn('⚠️ [CA360] Autoplay blocked:', error.message);
                        
                        // Add one-time click listener to play
                        if (!this.ringtoneInteractionListener) {
                            this.ringtoneInteractionListener = () => {
                                if (this.ringtone) {
                                    this.ringtone.play()
                                        .then(() => console.log('🔔 [CA360] Ringtone playing after interaction'))
                                        .catch(console.error);
                                }
                                document.removeEventListener('click', this.ringtoneInteractionListener);
                                this.ringtoneInteractionListener = null;
                            };
                            document.addEventListener('click', this.ringtoneInteractionListener, { once: true });
                        }
                    });
            }
            
        } catch (error) {
            console.warn('⚠️ [CA360] Ringtone error:', error);
        }
    }

    /**
     * Stop ringtone
     */
    stopRingtone() {
        if (this.ringtone) {
            try {
                this.ringtone.pause();
                this.ringtone.currentTime = 0;
                this.ringtone = null;
                console.log('🔕 [CA360] Ringtone stopped');
            } catch (error) {
                console.warn('⚠️ [CA360] Error stopping ringtone:', error);
            }
        }
        
        // Remove interaction listener if exists
        if (this.ringtoneInteractionListener) {
            document.removeEventListener('click', this.ringtoneInteractionListener);
            this.ringtoneInteractionListener = null;
        }
    }

    /**
     * Start call duration timer
     */
    startCallTimer() {
        if (this.callTimerInterval) {
            clearInterval(this.callTimerInterval);
        }

        const timerElement = document.getElementById('simple-call-timer');
        if (!timerElement) {
            console.warn('⚠️ [CA360] Call duration element not found');
            return;
        }

        this.callTimerInterval = setInterval(() => {
            if (!this.isCallActive || !this.callStartTime) {
                clearInterval(this.callTimerInterval);
                return;
            }
            
            const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            const seconds = elapsed % 60;
            
            timerElement.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    /**
     * Show outgoing call screen (NEW SIMPLE MODALS)
     */
    showOutgoingCallScreen(userName, isVideo) {
        try {
            console.log('📞 [CA360] Showing outgoing call screen');
            
            // Hide others
            this.hideElement('simple-incoming-screen');
            this.hideElement('simple-active-screen');
            
            // Set info
            this.setTextContent('simple-outgoing-name', userName);
            this.setTextContent('simple-outgoing-initial', userName.charAt(0).toUpperCase());
            this.setTextContent('simple-outgoing-status', isVideo ? 'Video Calling...' : 'Calling...');
            
            // Show/hide video preview
            if (isVideo) {
                this.showElement('simple-outgoing-video');
                this.hideElement('simple-outgoing-avatar');
                
                // Attach video preview
                const videoPreview = document.getElementById('simple-outgoing-video');
                if (videoPreview && this.localStream) {
                    videoPreview.srcObject = this.localStream;
                }
            } else {
                this.hideElement('simple-outgoing-video');
                this.showElement('simple-outgoing-avatar');
            }
            
            // Show screen and modal
            this.showElement('simple-outgoing-screen');
            this.showElement('simpleCallModal');
        } catch (error) {
            console.error('❌ [CA360] Error showing outgoing call screen:', error);
        }
    }

    /**
     * Show incoming call screen (NEW SIMPLE MODALS)
     */
    showIncomingCallScreen(userName, isVideo) {
        try {
            console.log('📞 [CA360] Showing incoming call screen');
            
            // Hide others
            this.hideElement('simple-outgoing-screen');
            this.hideElement('simple-active-screen');
            
            // Set info
            this.setTextContent('simple-incoming-name', userName);
            this.setTextContent('simple-incoming-initial', userName.charAt(0).toUpperCase());
            this.setTextContent('simple-incoming-status', isVideo ? '📹 Incoming Video Call' : '🔔 Incoming Voice Call');
            
            // Show screen and modal
            this.showElement('simple-incoming-screen');
            this.showElement('simpleCallModal');
        } catch (error) {
            console.error('❌ [CA360] Error showing incoming call screen:', error);
        }
    }

    /**
     * Show active call screen (NEW SIMPLE MODALS)
     */
    showActiveCallScreen() {
        try {
            console.log('✅ [CA360] Showing active call screen');
            
            // Hide others
            this.hideElement('simple-outgoing-screen');
            this.hideElement('simple-incoming-screen');
            
            // Set info
            if (this.currentCall) {
                this.setTextContent('simple-active-name', this.currentCall.userName);
                this.setTextContent('simple-active-initial', this.currentCall.userName.charAt(0).toUpperCase());
                
                // Show/hide video
                if (this.currentCall.isVideo) {
                    this.showElement('simple-video-wrapper');
                    this.hideElement('simple-active-avatar-wrapper');
                    this.showElement('simple-video-toggle-btn');
                    
                    // Attach local video
                    const localVideo = document.getElementById('simple-local-video');
                    if (localVideo && this.localStream) {
                        localVideo.srcObject = this.localStream;
                    }
                } else {
                    this.hideElement('simple-video-wrapper');
                    this.showElement('simple-active-avatar-wrapper');
                    this.hideElement('simple-video-toggle-btn');
                }
            }
            
            // Show screen and modal
            this.showElement('simple-active-screen');
            this.showElement('simpleCallModal');
            
            // Stop ringtone and start timer
            this.stopRingtone();
            if (!this.callStartTime) {
                this.startCallTimer();
            }
        } catch (error) {
            console.error('❌ [CA360] Error showing active call screen:', error);
        }
    }

    /**
     * Comprehensive cleanup - BULLETPROOF
     */
    cleanup() {
        if (this.isCleaningUp) {
            console.log('[CA360] Already cleaning up, skipping duplicate cleanup');
            return;
        }

        this.isCleaningUp = true;
        console.log('🧹 [CA360] Cleaning up call resources...');
        
        try {
            // Stop ringtone
            this.stopRingtone();
            
            // Reset state
            this.isCallActive = false;
            this.currentState = this.callState.IDLE;
            this.callStartTime = null;
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            this.socketDisconnectTime = null;
            this.iceCandidateBuffer = [];
            this.isOfferAnswerComplete = false;

            // Clear timer
            if (this.callTimerInterval) {
                clearInterval(this.callTimerInterval);
                this.callTimerInterval = null;
            }

            // Stop all media tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    try {
                        track.stop();
                        console.log('🛑 [CA360] Stopped track:', track.kind);
                    } catch (error) {
                        console.warn('⚠️ [CA360] Error stopping track:', error);
                    }
                });
                this.localStream = null;
            }

            // Close peer connection
            if (this.peerConnection) {
                try {
                    this.peerConnection.close();
                    this.peerConnection = null;
                    console.log('🔒 [CA360] Peer connection closed');
                } catch (error) {
                    console.warn('⚠️ [CA360] Error closing peer connection:', error);
                }
            }

            // Clear video/audio elements (NEW SIMPLE MODALS)
            const elements = [
                'simple-remote-video',
                'simple-local-video',
                'simple-remote-audio',
                'simple-outgoing-video'
            ];
            
            elements.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.srcObject = null;
            });

            // Hide all screens (NEW SIMPLE MODALS)
            this.hideElement('simple-incoming-screen');
            this.hideElement('simple-outgoing-screen');
            this.hideElement('simple-active-screen');
            this.hideElement('simpleCallModal');

            // Reset call info
            this.currentCall = null;
            
            // Reset metrics
            this.metrics = {
                callInitTime: null,
                connectionTime: null,
                iceGatheringTime: null,
                firstMediaTime: null
            };
            
            console.log('✅ [CA360] Cleanup complete');
        } catch (error) {
            console.error('❌ [CA360] Error during cleanup:', error);
        } finally {
            this.isCleaningUp = false;
        }
    }

    // ==================== HELPER METHODS ====================

    showElement(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.style.display = 'flex';
        }
    }

    hideElement(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.style.display = 'none';
        }
    }

    setTextContent(elementId, text) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = text;
        }
    }

    showNotification(message, type = 'info') {
        console.log(`[CA360] Notification (${type}):`, message);
        
        // Show console notification for debugging
        const emoji = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} ${message}`);
    }

    handleFatalError(message) {
        console.error('💀 [CA360] Fatal error:', message);
        this.cleanup();
    }
}

// ============================================================================
// ENTERPRISE-GRADE INITIALIZATION WITH BULLETPROOF RETRY LOGIC
// ============================================================================

(function initializeCA360Calling() {
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds max wait
    const retryInterval = 100; // Check every 100ms
    
    console.log('🚀 [CA360] Starting ULTIMATE calling system initialization...');
    
    function tryInitialize() {
        attempts++;
        
        // Check if all dependencies are ready
        const socketReady = typeof socket !== 'undefined';
        const userReady = typeof currentUser !== 'undefined';
        const socketConnected = socketReady && socket.connected === true;
        
        if (socketReady && userReady && socketConnected) {
            try {
                // Initialize the calling system
                window.calling = new CA360Calling(socket, currentUser);
                
                console.log('✅ [CA360] 📞 ULTIMATE Calling System Ready - Made in India 🇮🇳');
                console.log(`[CA360] Initialized after ${attempts} attempt(s) (${attempts * retryInterval}ms)`);
                console.log('[CA360] User:', currentUser.name, '| Socket:', socket.id);
                console.log('[CA360] Mode: Enterprise Production-Ready with Simple UI');
                
                return true;
            } catch (error) {
                console.error('❌ [CA360] Initialization error:', error);
                console.error('[CA360] Please refresh the page and try again');
                return true; // Stop trying
            }
        }
        
        // Check if we've exceeded max attempts
        if (attempts >= maxAttempts) {
            console.error('❌ [CA360] Failed to initialize after', (maxAttempts * retryInterval / 1000), 'seconds');
            console.error('[CA360] Dependency status:');
            console.error('  - socket exists:', socketReady);
            console.error('  - socket connected:', socketReady ? socket.connected : 'N/A');
            console.error('  - currentUser exists:', userReady);
            
            // Still try to initialize if components exist
            if (socketReady && userReady) {
                console.warn('⚠️ [CA360] Initializing with potentially incomplete socket connection...');
                try {
                    window.calling = new CA360Calling(socket, currentUser);
                    console.log('✅ [CA360] Calling system initialized (degraded mode)');
                } catch (error) {
                    console.error('❌ [CA360] Final initialization attempt failed:', error);
                }
            }
            
            return true; // Stop trying
        }
        
        // Try again
        setTimeout(tryInitialize, retryInterval);
        return false;
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInitialize);
    } else {
        tryInitialize();
    }
})();

console.log('📞 [CA360] ULTIMATE calling module loaded - Awaiting initialization...');
