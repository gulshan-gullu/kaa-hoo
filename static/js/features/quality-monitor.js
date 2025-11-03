// ==================== CALL QUALITY MONITORING ====================

let qualityMonitor = null;
let qualityStats = {
    latency: 0,
    jitter: 0,
    packetLoss: 0,
    bitrate: 0,
    quality: 'checking'
};

function startQualityMonitoring() {
    console.log('ðŸ“Š [QUALITY] Starting monitoring...');
    
    if (qualityMonitor) {
        clearInterval(qualityMonitor);
    }
    
    qualityMonitor = setInterval(async () => {
        if (!window.peerConnection) {
            console.log('ðŸ“Š [QUALITY] Waiting for peer connection...');
            return;
        }
        
        try {
            const stats = await window.peerConnection.getStats();
            analyzeCallQuality(stats);
        } catch (error) {
            console.error('ðŸ“Š [QUALITY] Error:', error);
        }
    }, 2000);
}

function analyzeCallQuality(stats) {
    let inboundAudio = null;
    let candidatePair = null;
    
    stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            inboundAudio = report;
        }
        
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            candidatePair = report;
        }
    });
    
    if (!inboundAudio || !candidatePair) {
        updateQualityDisplay('checking', null);
        return;
    }
    
    const latency = candidatePair.currentRoundTripTime ? 
        Math.round(candidatePair.currentRoundTripTime * 1000) : 0;
    
    const jitter = inboundAudio.jitter ? 
        Math.round(inboundAudio.jitter * 1000) : 0;
    
    const packetsReceived = inboundAudio.packetsReceived || 0;
    const packetsLost = inboundAudio.packetsLost || 0;
    const packetLoss = packetsReceived > 0 ? 
        ((packetsLost / (packetsReceived + packetsLost)) * 100).toFixed(2) : 0;
    
    const bitrate = inboundAudio.bytesReceived ? 
        Math.round((inboundAudio.bytesReceived * 8) / 1000) : 0;
    
    qualityStats = {
        latency,
        jitter,
        packetLoss,
        bitrate,
        quality: calculateQuality(latency, jitter, packetLoss)
    };
    
    updateQualityDisplay(qualityStats.quality, qualityStats);
    
    if (qualityStats.quality === 'poor') {
        showPoorConnectionWarning();
    } else {
        hidePoorConnectionWarning();
    }
}

function calculateQuality(latency, jitter, packetLoss) {
    if (latency < 100 && jitter < 30 && packetLoss < 1) {
        return 'excellent';
    }
    
    if (latency < 200 && jitter < 50 && packetLoss < 3) {
        return 'good';
    }
    
    return 'poor';
}

function updateQualityDisplay(quality, stats) {
    const badge = document.getElementById('qualityBadge');
    const statusText = document.getElementById('qualityStatus');
    
    if (!badge || !statusText) return;
    
    badge.classList.remove('excellent', 'good', 'poor');
    badge.classList.add(quality);
    
    const statusLabels = {
        'checking': 'Checking...',
        'excellent': 'Excellent',
        'good': 'Good',
        'poor': 'Poor'
    };
    statusText.textContent = statusLabels[quality] || 'Unknown';
    
    if (stats) {
        const latencyEl = document.getElementById('statLatency');
        const jitterEl = document.getElementById('statJitter');
        const packetLossEl = document.getElementById('statPacketLoss');
        const bitrateEl = document.getElementById('statBitrate');
        
        if (latencyEl) latencyEl.textContent = `${stats.latency} ms`;
        if (jitterEl) jitterEl.textContent = `${stats.jitter} ms`;
        if (packetLossEl) packetLossEl.textContent = `${stats.packetLoss}%`;
        if (bitrateEl) bitrateEl.textContent = `${stats.bitrate} kbps`;
    }
    
    console.log(`ðŸ“Š [QUALITY] ${quality.toUpperCase()}:`, stats);
}

function showPoorConnectionWarning() {
    let warning = document.getElementById('poorConnectionWarning');
    
    if (!warning) {
        warning = document.createElement('div');
        warning.id = 'poorConnectionWarning';
        warning.className = 'poor-connection-warning';
        warning.innerHTML = 'âš ï¸ Poor connection quality';
        
        const modal = document.getElementById('callModal');
        if (modal) {
            const container = modal.querySelector('.call-container');
            if (container) container.appendChild(warning);
        }
    }
}

function hidePoorConnectionWarning() {
    const warning = document.getElementById('poorConnectionWarning');
    if (warning) {
        warning.remove();
    }
}

function stopQualityMonitoring() {
    if (qualityMonitor) {
        clearInterval(qualityMonitor);
        qualityMonitor = null;
    }
    
    updateQualityDisplay('checking', null);
    hidePoorConnectionWarning();
    
    console.log('ðŸ“Š [QUALITY] Monitoring stopped');
}

// Initialize toggle button
function initQualityMonitor() {
    const toggleBtn = document.getElementById('qualityToggleBtn');
    const statsPanel = document.getElementById('qualityStats');
    
    if (toggleBtn && statsPanel) {
        toggleBtn.addEventListener('click', () => {
            const isVisible = statsPanel.style.display === 'block';
            statsPanel.style.display = isVisible ? 'none' : 'block';
            toggleBtn.classList.toggle('active', !isVisible);
        });
    }
    
    console.log('âœ… Quality Monitor Module Loaded');
}
