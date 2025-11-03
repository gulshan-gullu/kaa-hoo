// WebRTC Handler for Audio/Video Calls
class WebRTCHandler {
    constructor() {
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        
        // ICE servers configuration
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        
        // Media constraints
        this.audioConstraints = {
            audio: true,
            video: false
        };
        
        this.videoConstraints = {
            audio: true,
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
    }
    
    async initializeAudioCall() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(this.audioConstraints);
            this.createPeerConnection();
            return true;
        } catch (error) {
            console.error('Failed to initialize audio call:', error);
            return false;
        }
    }
    
    async initializeVideoCall() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(this.videoConstraints);
            this.createPeerConnection();
            return true;
        } catch (error) {
            console.error('Failed to initialize video call:', error);
            return false;
        }
    }
    
    createPeerConnection() {
        this.peerConnection = new RTCPeerConnection(this.iceServers);
        
        // Add local stream tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });
        }
        
        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            this.remoteStream = event.streams[0];
        };
        
        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // Send candidate to remote peer
                console.log('ICE candidate:', event.candidate);
            }
        };
    }
    
    async createOffer() {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        return offer;
    }
    
    async createAnswer() {
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return answer;
    }
    
    async setRemoteDescription(description) {
        await this.peerConnection.setRemoteDescription(description);
    }
    
    async addIceCandidate(candidate) {
        await this.peerConnection.addIceCandidate(candidate);
    }
    
    endCall() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebRTCHandler;
}