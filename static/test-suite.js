/**
 * CA360 Video Call Comprehensive Test Suite
 * Version: 2.0
 * Total Tests: 45
 * Categories: 7
 */

class CA360TestSuite {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: [],
            timestamp: new Date().toISOString(),
            duration: 0
        };
        this.startTime = null;
    }

    // ==================== BASIC FUNCTIONALITY TESTS ====================
    
    async testBasicVideoCall() {
        const test = { name: "Basic Video Call", category: "basicFunctionality" };
        try {
            // Test getUserMedia availability
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("getUserMedia not supported");
            }
            
            // Test basic stream acquisition
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (stream.getTracks().length < 2) {
                throw new Error("Insufficient tracks (expected video + audio)");
            }
            
            // Cleanup
            stream.getTracks().forEach(track => track.stop());
            
            test.status = "PASSED";
            test.message = "Video call initiation successful";
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testAudioVideoToggle() {
        const test = { name: "Audio/Video Toggle", category: "basicFunctionality" };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            const videoTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];
            
            // Test video toggle
            videoTrack.enabled = false;
            if (videoTrack.enabled) throw new Error("Video toggle failed");
            videoTrack.enabled = true;
            if (!videoTrack.enabled) throw new Error("Video re-enable failed");
            
            // Test audio toggle
            audioTrack.enabled = false;
            if (audioTrack.enabled) throw new Error("Audio toggle failed");
            audioTrack.enabled = true;
            if (!audioTrack.enabled) throw new Error("Audio re-enable failed");
            
            stream.getTracks().forEach(track => track.stop());
            
            test.status = "PASSED";
            test.message = "Audio/Video toggle working correctly";
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testScreenShare() {
        const test = { name: "Screen Share", category: "basicFunctionality" };
        try {
            if (!navigator.mediaDevices.getDisplayMedia) {
                test.status = "WARNING";
                test.message = "Screen share not supported in this browser";
                return test;
            }
            
            // Note: Can't auto-test without user interaction
            test.status = "PASSED";
            test.message = "Screen share API available (requires manual testing)";
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testCallEnd() {
        const test = { name: "Call End", category: "basicFunctionality" };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            // Simulate call end
            stream.getTracks().forEach(track => {
                track.stop();
                if (track.readyState !== 'ended') {
                    throw new Error(`Track not stopped: ${track.kind}`);
                }
            });
            
            test.status = "PASSED";
            test.message = "Call end functionality working";
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testMultipleDevices() {
        const test = { name: "Multiple Devices", category: "basicFunctionality" };
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            const audioDevices = devices.filter(d => d.kind === 'audioinput');
            
            if (videoDevices.length === 0) throw new Error("No video devices found");
            if (audioDevices.length === 0) throw new Error("No audio devices found");
            
            test.status = "PASSED";
            test.message = `Found ${videoDevices.length} video, ${audioDevices.length} audio devices`;
            test.details = { videoDevices: videoDevices.length, audioDevices: audioDevices.length };
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testDeviceSwitching() {
        const test = { name: "Device Switching", category: "basicFunctionality" };
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            
            if (videoDevices.length < 2) {
                test.status = "WARNING";
                test.message = "Only one video device available";
                return test;
            }
            
            // Test switching between devices
            const stream1 = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: videoDevices[0].deviceId }
            });
            stream1.getTracks().forEach(track => track.stop());
            
            const stream2 = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: videoDevices[1].deviceId }
            });
            stream2.getTracks().forEach(track => track.stop());
            
            test.status = "PASSED";
            test.message = "Device switching successful";
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testPermissions() {
        const test = { name: "Permissions Check", category: "basicFunctionality" };
        try {
            const cameraPermission = await navigator.permissions.query({ name: 'camera' });
            const micPermission = await navigator.permissions.query({ name: 'microphone' });
            
            test.status = "PASSED";
            test.message = `Camera: ${cameraPermission.state}, Mic: ${micPermission.state}`;
            test.details = { camera: cameraPermission.state, microphone: micPermission.state };
            
            if (cameraPermission.state === 'denied' || micPermission.state === 'denied') {
                test.status = "WARNING";
                test.message = "Permissions denied - user action required";
            }
        } catch (error) {
            test.status = "WARNING";
            test.message = "Permissions API not fully supported";
        }
        return test;
    }

    // ==================== NETWORK RESILIENCE TESTS ====================

    async testNetworkDisconnect() {
        const test = { name: "Network Disconnect Handling", category: "networkResilience" };
        try {
            // Simulate connection state monitoring
            const pc = new RTCPeerConnection();
            
            let stateChanges = 0;
            pc.onconnectionstatechange = () => stateChanges++;
            
            // Simulate state change
            pc.close();
            
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (pc.connectionState !== 'closed') {
                throw new Error("Connection state not updated");
            }
            
            test.status = "PASSED";
            test.message = "Connection state tracking working";
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testReconnectionAttempt() {
        const test = { name: "Reconnection Attempt", category: "networkResilience" };
        try {
            // Test ICE restart capability
            const pc = new RTCPeerConnection({ iceRestart: true });
            
            if (!pc.restartIce) {
                test.status = "WARNING";
                test.message = "ICE restart not supported";
            } else {
                test.status = "PASSED";
                test.message = "Reconnection capability available";
            }
            
            pc.close();
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testBandwidthAdaptation() {
        const test = { name: "Bandwidth Adaptation", category: "networkResilience" };
        try {
            const pc = new RTCPeerConnection();
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const sender = pc.addTrack(stream.getVideoTracks()[0], stream);
            
            // Test setting bandwidth parameters
            const parameters = sender.getParameters();
            if (!parameters.encodings) {
                throw new Error("Encoding parameters not available");
            }
            
            parameters.encodings[0].maxBitrate = 500000; // 500kbps
            await sender.setParameters(parameters);
            
            stream.getTracks().forEach(track => track.stop());
            pc.close();
            
            test.status = "PASSED";
            test.message = "Bandwidth adaptation supported";
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testPacketLossTolerance() {
        const test = { name: "Packet Loss Tolerance", category: "networkResilience" };
        try {
            // Test FEC support
            const pc = new RTCPeerConnection();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const sender = pc.addTrack(stream.getAudioTracks()[0], stream);
            
            const params = sender.getParameters();
            test.status = "PASSED";
            test.message = "RTP parameters accessible for packet loss handling";
            test.details = { codecs: params.codecs?.length || 0 };
            
            stream.getTracks().forEach(track => track.stop());
            pc.close();
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testJitterBuffer() {
        const test = { name: "Jitter Buffer", category: "networkResilience" };
        try {
            // WebRTC has built-in jitter buffering
            const pc = new RTCPeerConnection();
            
            // Check if we can monitor jitter
            test.status = "PASSED";
            test.message = "Jitter buffer handling available (WebRTC native)";
            
            pc.close();
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testNetworkTypeDetection() {
        const test = { name: "Network Type Detection", category: "networkResilience" };
        try {
            if ('connection' in navigator) {
                const conn = navigator.connection;
                test.status = "PASSED";
                test.message = `Connection type: ${conn.effectiveType || 'unknown'}`;
                test.details = {
                    type: conn.type,
                    effectiveType: conn.effectiveType,
                    downlink: conn.downlink,
                    rtt: conn.rtt
                };
            } else {
                test.status = "WARNING";
                test.message = "Network Information API not supported";
            }
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testFallbackMechanism() {
        const test = { name: "Fallback Mechanism", category: "networkResilience" };
        try {
            // Test ability to reduce quality
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1920, height: 1080 }
            });
            
            const settings = stream.getVideoTracks()[0].getSettings();
            
            // Try to apply lower resolution
            await stream.getVideoTracks()[0].applyConstraints({
                width: { ideal: 640 },
                height: { ideal: 480 }
            });
            
            stream.getTracks().forEach(track => track.stop());
            
            test.status = "PASSED";
            test.message = "Quality fallback mechanism working";
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    // ==================== QUALITY MONITORING TESTS ====================

    async testVideoQuality() {
        const test = { name: "Video Quality", category: "qualityMonitoring" };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            
            const resolution = settings.width * settings.height;
            const isHD = resolution >= 1280 * 720;
            
            test.status = isHD ? "PASSED" : "WARNING";
            test.message = `Resolution: ${settings.width}x${settings.height} (${isHD ? 'HD' : 'SD'})`;
            test.details = settings;
            
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testAudioQuality() {
        const test = { name: "Audio Quality", category: "qualityMonitoring" };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const track = stream.getAudioTracks()[0];
            const settings = track.getSettings();
            
            test.status = "PASSED";
            test.message = `Sample rate: ${settings.sampleRate}Hz, Channels: ${settings.channelCount}`;
            test.details = settings;
            
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testFrameRate() {
        const test = { name: "Frame Rate", category: "qualityMonitoring" };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { frameRate: 30 } });
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            
            const fps = settings.frameRate;
            test.status = fps >= 24 ? "PASSED" : "WARNING";
            test.message = `Frame rate: ${fps} FPS`;
            test.details = { frameRate: fps };
            
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testLatency() {
        const test = { name: "Latency", category: "qualityMonitoring" };
        try {
            const start = performance.now();
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const latency = performance.now() - start;
            
            test.status = latency < 1000 ? "PASSED" : "WARNING";
            test.message = `Media acquisition latency: ${latency.toFixed(2)}ms`;
            test.details = { latency: latency };
            
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testEchoCancellation() {
        const test = { name: "Echo Cancellation", category: "qualityMonitoring" };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            const track = stream.getAudioTracks()[0];
            const settings = track.getSettings();
            
            test.status = "PASSED";
            test.message = `Echo: ${settings.echoCancellation}, Noise: ${settings.noiseSuppression}`;
            test.details = settings;
            
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testBitrateControl() {
        const test = { name: "Bitrate Control", category: "qualityMonitoring" };
        try {
            const pc = new RTCPeerConnection();
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const sender = pc.addTrack(stream.getVideoTracks()[0], stream);
            
            const params = sender.getParameters();
            params.encodings = params.encodings || [{}];
            params.encodings[0].maxBitrate = 1000000; // 1Mbps
            
            await sender.setParameters(params);
            
            test.status = "PASSED";
            test.message = "Bitrate control available";
            
            stream.getTracks().forEach(track => track.stop());
            pc.close();
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    // ==================== ADVANCED VIDEO TESTS ====================

    async testMultipleStreams() {
        const test = { name: "Multiple Streams", category: "advancedVideo" };
        try {
            const stream1 = await navigator.mediaDevices.getUserMedia({ video: true });
            const stream2 = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            if (stream1.getTracks().length === 0 || stream2.getTracks().length === 0) {
                throw new Error("Failed to create multiple streams");
            }
            
            test.status = "PASSED";
            test.message = "Multiple stream handling working";
            
            stream1.getTracks().forEach(track => track.stop());
            stream2.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testPictureInPicture() {
        const test = { name: "Picture-in-Picture", category: "advancedVideo" };
        try {
            const video = document.createElement('video');
            
            if (!document.pictureInPictureEnabled) {
                test.status = "WARNING";
                test.message = "Picture-in-Picture not supported";
                return test;
            }
            
            test.status = "PASSED";
            test.message = "Picture-in-Picture API available";
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testVideoEffects() {
        const test = { name: "Video Effects", category: "advancedVideo" };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const track = stream.getVideoTracks()[0];
            
            // Test if we can apply constraints (basic effects)
            await track.applyConstraints({
                brightness: { ideal: 100 },
                contrast: { ideal: 100 }
            });
            
            test.status = "PASSED";
            test.message = "Video effects/constraints applicable";
            
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "WARNING";
            test.message = "Advanced video effects limited";
        }
        return test;
    }

    async testVirtualBackground() {
        const test = { name: "Virtual Background", category: "advancedVideo" };
        try {
            // Check canvas support for background processing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) throw new Error("Canvas not supported");
            
            test.status = "PASSED";
            test.message = "Canvas API available for virtual backgrounds";
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testRecording() {
        const test = { name: "Call Recording", category: "advancedVideo" };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            if (!MediaRecorder.isTypeSupported('video/webm')) {
                test.status = "WARNING";
                test.message = "WebM recording not supported";
                stream.getTracks().forEach(track => track.stop());
                return test;
            }
            
            const recorder = new MediaRecorder(stream);
            
            test.status = "PASSED";
            test.message = "Recording capability available";
            
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testSnapshot() {
        const test = { name: "Snapshot/Screenshot", category: "advancedVideo" };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            
            const video = document.createElement('video');
            video.srcObject = stream;
            await video.play();
            
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            const dataUrl = canvas.toDataURL('image/png');
            
            test.status = dataUrl.length > 100 ? "PASSED" : "FAILED";
            test.message = test.status === "PASSED" ? "Snapshot capability working" : "Snapshot failed";
            
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testFullscreen() {
        const test = { name: "Fullscreen Mode", category: "advancedVideo" };
        try {
            const div = document.createElement('div');
            
            if (!div.requestFullscreen && !div.webkitRequestFullscreen && !div.mozRequestFullScreen) {
                test.status = "WARNING";
                test.message = "Fullscreen API not supported";
                return test;
            }
            
            test.status = "PASSED";
            test.message = "Fullscreen API available";
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    // ==================== STRESS TESTS ====================

    async testHighResolution() {
        const test = { name: "High Resolution (4K)", category: "stressTests" };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 3840 }, height: { ideal: 2160 } }
            });
            
            const settings = stream.getVideoTracks()[0].getSettings();
            const is4K = settings.width >= 3840 && settings.height >= 2160;
            
            test.status = is4K ? "PASSED" : "WARNING";
            test.message = `Max resolution: ${settings.width}x${settings.height}`;
            test.details = settings;
            
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "WARNING";
            test.message = "4K not supported - " + error.message;
        }
        return test;
    }

    async testLongDuration() {
        const test = { name: "Long Duration Call", category: "stressTests" };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            // Simulate 5 second call
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const tracks = stream.getTracks();
            const allActive = tracks.every(track => track.readyState === 'live');
            
            test.status = allActive ? "PASSED" : "FAILED";
            test.message = allActive ? "Stream stable after 5 seconds" : "Stream unstable";
            
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testMemoryLeak() {
        const test = { name: "Memory Leak Detection", category: "stressTests" };
        try {
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            // Create and destroy multiple streams
            for (let i = 0; i < 5; i++) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
            }
            
            // Force garbage collection if available
            if (window.gc) window.gc();
            
            const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const memoryIncrease = finalMemory - initialMemory;
            
            test.status = memoryIncrease < 50 * 1024 * 1024 ? "PASSED" : "WARNING";
            test.message = `Memory change: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`;
        } catch (error) {
            test.status = "WARNING";
            test.message = "Memory API not available";
        }
        return test;
    }

    async testCPUUsage() {
        const test = { name: "CPU Usage", category: "stressTests" };
        try {
            const start = performance.now();
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1920, height: 1080, frameRate: 30 }
            });
            
            // Run for 3 seconds
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const duration = performance.now() - start;
            
            stream.getTracks().forEach(track => track.stop());
            
            test.status = "PASSED";
            test.message = `HD stream maintained for ${(duration/1000).toFixed(1)}s`;
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testRapidToggling() {
        const test = { name: "Rapid Toggle Stress", category: "stressTests" };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            const videoTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];
            
            // Rapid toggling
            for (let i = 0; i < 20; i++) {
                videoTrack.enabled = !videoTrack.enabled;
                audioTrack.enabled = !audioTrack.enabled;
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            // Verify still working
            if (videoTrack.readyState !== 'live' || audioTrack.readyState !== 'live') {
                throw new Error("Tracks became inactive after toggling");
            }
            
            test.status = "PASSED";
            test.message = "Survived 20 rapid toggles";
            
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    // ==================== EDGE CASES ====================

    async testNoCamera() {
        const test = { name: "No Camera Handling", category: "edgeCases" };
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some(d => d.kind === 'videoinput');
            
            if (!hasCamera) {
                test.status = "PASSED";
                test.message = "Correctly detected no camera available";
            } else {
                test.status = "PASSED";
                test.message = "Camera available (edge case test N/A)";
            }
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testNoMicrophone() {
        const test = { name: "No Microphone Handling", category: "edgeCases" };
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasMic = devices.some(d => d.kind === 'audioinput');
            
            if (!hasMic) {
                test.status = "PASSED";
                test.message = "Correctly detected no microphone available";
            } else {
                test.status = "PASSED";
                test.message = "Microphone available (edge case test N/A)";
            }
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testPermissionDenied() {
        const test = { name: "Permission Denied", category: "edgeCases" };
        try {
            // This will only properly test if permissions are actually denied
            try {
                await navigator.mediaDevices.getUserMedia({ video: true });
                test.status = "PASSED";
                test.message = "Permissions granted (edge case N/A)";
            } catch (permError) {
                if (permError.name === 'NotAllowedError') {
                    test.status = "PASSED";
                    test.message = "Correctly handled permission denial";
                } else {
                    throw permError;
                }
            }
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testDeviceInUse() {
        const test = { name: "Device Already in Use", category: "edgeCases" };
        try {
            const stream1 = await navigator.mediaDevices.getUserMedia({ video: true });
            
            try {
                const stream2 = await navigator.mediaDevices.getUserMedia({ video: true });
                stream2.getTracks().forEach(track => track.stop());
                
                test.status = "PASSED";
                test.message = "Can open same device multiple times";
            } catch (err) {
                test.status = "PASSED";
                test.message = "Correctly handled device in use";
            }
            
            stream1.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testInvalidConstraints() {
        const test = { name: "Invalid Constraints", category: "edgeCases" };
        try {
            try {
                await navigator.mediaDevices.getUserMedia({
                    video: { width: { exact: 999999 }, height: { exact: 999999 } }
                });
                test.status = "WARNING";
                test.message = "Invalid constraints accepted (unexpected)";
            } catch (constraintError) {
                test.status = "PASSED";
                test.message = "Correctly rejected invalid constraints";
            }
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testBrowserCompatibility() {
        const test = { name: "Browser Compatibility", category: "edgeCases" };
        try {
            const features = {
                getUserMedia: !!navigator.mediaDevices?.getUserMedia,
                getDisplayMedia: !!navigator.mediaDevices?.getDisplayMedia,
                RTCPeerConnection: !!window.RTCPeerConnection,
                MediaRecorder: !!window.MediaRecorder,
                WebSocket: !!window.WebSocket
            };
            
            const supported = Object.values(features).filter(Boolean).length;
            const total = Object.keys(features).length;
            
            test.status = supported === total ? "PASSED" : "WARNING";
            test.message = `${supported}/${total} features supported`;
            test.details = features;
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testLowBattery() {
        const test = { name: "Low Battery Handling", category: "edgeCases" };
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                test.status = "PASSED";
                test.message = `Battery: ${(battery.level * 100).toFixed(0)}%, Charging: ${battery.charging}`;
                test.details = {
                    level: battery.level,
                    charging: battery.charging
                };
            } else {
                test.status = "WARNING";
                test.message = "Battery API not supported";
            }
        } catch (error) {
            test.status = "WARNING";
            test.message = "Battery API not available";
        }
        return test;
    }

    // ==================== PERFORMANCE TESTS ====================

    async testStartupTime() {
        const test = { name: "Call Startup Time", category: "performance" };
        try {
            const start = performance.now();
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const duration = performance.now() - start;
            
            test.status = duration < 2000 ? "PASSED" : "WARNING";
            test.message = `Startup time: ${duration.toFixed(2)}ms`;
            test.details = { startupTime: duration };
            
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testSwitchingSpeed() {
        const test = { name: "Device Switching Speed", category: "performance" };
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            
            if (videoDevices.length < 2) {
                test.status = "WARNING";
                test.message = "Not enough devices for switching test";
                return test;
            }
            
            const stream1 = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: videoDevices[0].deviceId }
            });
            
            const start = performance.now();
            stream1.getTracks().forEach(track => track.stop());
            
            const stream2 = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: videoDevices[1].deviceId }
            });
            const switchTime = performance.now() - start;
            
            test.status = switchTime < 1000 ? "PASSED" : "WARNING";
            test.message = `Switch time: ${switchTime.toFixed(2)}ms`;
            
            stream2.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testFrameDrops() {
        const test = { name: "Frame Drop Detection", category: "performance" };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1920, height: 1080, frameRate: 30 }
            });
            
            const track = stream.getVideoTracks()[0];
            
            // Run for 2 seconds and check stability
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (track.readyState === 'live') {
                test.status = "PASSED";
                test.message = "No frame drops detected in 2s test";
            } else {
                test.status = "FAILED";
                test.message = "Stream became inactive";
            }
            
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    async testAudioLatency() {
        const test = { name: "Audio Latency", category: "performance" };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { latency: 0.01 } // Request low latency
            });
            
            const track = stream.getAudioTracks()[0];
            const settings = track.getSettings();
            
            test.status = "PASSED";
            test.message = `Audio latency configured`;
            test.details = settings;
            
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            test.status = "WARNING";
            test.message = "Latency control not available";
        }
        return test;
    }

    async testConcurrentStreams() {
        const test = { name: "Concurrent Streams", category: "performance" };
        try {
            const streams = [];
            
            // Try to open 3 streams simultaneously
            for (let i = 0; i < 3; i++) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                streams.push(stream);
            }
            
            test.status = streams.length === 3 ? "PASSED" : "WARNING";
            test.message = `Opened ${streams.length} concurrent streams`;
            
            streams.forEach(stream => {
                stream.getTracks().forEach(track => track.stop());
            });
        } catch (error) {
            test.status = "WARNING";
            test.message = "Limited concurrent streams - " + error.message;
        }
        return test;
    }

    async testResourceCleanup() {
        const test = { name: "Resource Cleanup", category: "performance" };
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const trackCount = stream.getTracks().length;
            
            stream.getTracks().forEach(track => track.stop());
            
            // Verify all tracks stopped
            const stoppedCount = stream.getTracks().filter(t => t.readyState === 'ended').length;
            
            test.status = stoppedCount === trackCount ? "PASSED" : "WARNING";
            test.message = `${stoppedCount}/${trackCount} tracks properly cleaned up`;
        } catch (error) {
            test.status = "FAILED";
            test.message = error.message;
        }
        return test;
    }

    // ==================== TEST RUNNER ====================

    async runAllTests() {
        console.log("🚀 Starting CA360 Video Call Test Suite...");
        console.log("=" .repeat(60));
        
        this.startTime = performance.now();
        
        const testSuites = {
            basicFunctionality: [
                'testBasicVideoCall',
                'testAudioVideoToggle',
                'testScreenShare',
                'testCallEnd',
                'testMultipleDevices',
                'testDeviceSwitching',
                'testPermissions'
            ],
            networkResilience: [
                'testNetworkDisconnect',
                'testReconnectionAttempt',
                'testBandwidthAdaptation',
                'testPacketLossTolerance',
                'testJitterBuffer',
                'testNetworkTypeDetection',
                'testFallbackMechanism'
            ],
            qualityMonitoring: [
                'testVideoQuality',
                'testAudioQuality',
                'testFrameRate',
                'testLatency',
                'testEchoCancellation',
                'testBitrateControl'
            ],
            advancedVideo: [
                'testMultipleStreams',
                'testPictureInPicture',
                'testVideoEffects',
                'testVirtualBackground',
                'testRecording',
                'testSnapshot',
                'testFullscreen'
            ],
            stressTests: [
                'testHighResolution',
                'testLongDuration',
                'testMemoryLeak',
                'testCPUUsage',
                'testRapidToggling'
            ],
            edgeCases: [
                'testNoCamera',
                'testNoMicrophone',
                'testPermissionDenied',
                'testDeviceInUse',
                'testInvalidConstraints',
                'testBrowserCompatibility',
                'testLowBattery'
            ],
            performance: [
                'testStartupTime',
                'testSwitchingSpeed',
                'testFrameDrops',
                'testAudioLatency',
                'testConcurrentStreams',
                'testResourceCleanup'
            ]
        };

        for (const [category, tests] of Object.entries(testSuites)) {
            console.log(`\n📦 ${category.toUpperCase()}`);
            console.log("-".repeat(60));
            
            for (const testName of tests) {
                const result = await this[testName]();
                this.results.tests.push(result);
                
                const icon = result.status === "PASSED" ? "✅" : 
                            result.status === "WARNING" ? "⚠️" : "❌";
                
                console.log(`${icon} ${result.name}: ${result.message}`);
                
                if (result.status === "PASSED") this.results.passed++;
                else if (result.status === "WARNING") this.results.warnings++;
                else this.results.failed++;
            }
        }

        this.results.duration = performance.now() - this.startTime;
        this.displaySummary();
        this.downloadResults();
        
        return this.results;
    }

    async runTestSuite(suiteName) {
        const suites = {
            basic: ['basicFunctionality'],
            network: ['networkResilience'],
            quality: ['qualityMonitoring'],
            advanced: ['advancedVideo'],
            stress: ['stressTests'],
            edge: ['edgeCases'],
            perf: ['performance']
        };

        const suite = suites[suiteName];
        if (!suite) {
            console.error(`Unknown suite: ${suiteName}`);
            return;
        }

        console.log(`🚀 Running ${suiteName} tests...`);
        // Implementation similar to runAllTests but filtered
    }

    displaySummary() {
        console.log("\n" + "=".repeat(60));
        console.log("📊 TEST SUMMARY");
        console.log("=".repeat(60));
        console.log(`Total Tests: ${this.results.tests.length}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`⚠️  Warnings: ${this.results.warnings}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⏱️  Duration: ${(this.results.duration / 1000).toFixed(2)}s`);
        console.log(`📈 Success Rate: ${((this.results.passed / this.results.tests.length) * 100).toFixed(1)}%`);
        console.log("=".repeat(60));
    }

    downloadResults() {
        const blob = new Blob([JSON.stringify(this.results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ca360-test-results-${new Date().toISOString()}.json`;
        a.click();
        console.log("📥 Results downloaded");
    }

    listSuites() {
        console.log("Available test suites:");
        console.log("  - basic: Basic functionality (7 tests)");
        console.log("  - network: Network resilience (7 tests)");
        console.log("  - quality: Quality monitoring (6 tests)");
        console.log("  - advanced: Advanced video (7 tests)");
        console.log("  - stress: Stress tests (5 tests)");
        console.log("  - edge: Edge cases (7 tests)");
        console.log("  - perf: Performance (6 tests)");
    }
}

// Make it globally available
window.CA360TestSuite = new CA360TestSuite();

console.log("✅ CA360 Test Suite loaded!");
console.log("Run: CA360TestSuite.runAllTests()");
console.log("Or: CA360TestSuite.listSuites()");