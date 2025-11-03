// ========================================
// VOICE MESSAGE PLAYBACK SPEED CONTROL
// ========================================

(function() {
    'use strict';
    
    console.log('🎵 Voice Playback Speed Module Loading...');
    
    let currentSpeed = 1.0;
    const speeds = [1.0, 1.25, 1.5, 1.75, 2.0];
    let currentSpeedIndex = 0;
    
    // Override the playVoice function
    const originalPlayVoice = window.playVoice;
    
    window.playVoice = function(url) {
        // Stop any currently playing audio
        const existingAudios = document.querySelectorAll('audio.voice-player');
        existingAudios.forEach(a => {
            a.pause();
            a.remove();
        });
        
        // Create new audio element
        const audio = new Audio(url);
        audio.className = 'voice-player';
        audio.playbackRate = currentSpeed;
        
        // Create playback controls overlay
        const controls = createPlaybackControls(audio);
        document.body.appendChild(controls);
        
        // Play audio
        audio.play().catch(e => console.error('Playback failed:', e));
        
        // Update UI
        audio.addEventListener('play', () => {
            updatePlayingButton(url, true);
        });
        
        audio.addEventListener('pause', () => {
            updatePlayingButton(url, false);
        });
        
        audio.addEventListener('ended', () => {
            updatePlayingButton(url, false);
            controls.remove();
        });
        
        // Store reference
        audio.controls = controls;
        
        return audio;
    };
    
    function createPlaybackControls(audio) {
        const controls = document.createElement('div');
        controls.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            padding: 16px 24px;
            border-radius: 30px;
            display: flex;
            align-items: center;
            gap: 16px;
            z-index: 9999;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
        `;
        
        // Progress bar
        const progress = document.createElement('div');
        progress.style.cssText = `
            width: 200px;
            height: 4px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            cursor: pointer;
            position: relative;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.style.cssText = `
            height: 100%;
            background: #25d366;
            border-radius: 2px;
            width: 0%;
            transition: width 0.1s;
        `;
        progress.appendChild(progressFill);
        
        // Update progress
        audio.addEventListener('timeupdate', () => {
            const percent = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = percent + '%';
        });
        
        // Seek on click
        progress.addEventListener('click', (e) => {
            const rect = progress.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audio.currentTime = audio.duration * percent;
        });
        
        // Speed button
        const speedBtn = document.createElement('button');
        speedBtn.textContent = currentSpeed + 'x';
        speedBtn.style.cssText = `
            background: rgba(37, 211, 102, 0.2);
            border: 1px solid #25d366;
            color: #25d366;
            padding: 6px 12px;
            border-radius: 16px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.2s;
        `;
        
        speedBtn.addEventListener('click', () => {
            currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
            currentSpeed = speeds[currentSpeedIndex];
            audio.playbackRate = currentSpeed;
            speedBtn.textContent = currentSpeed + 'x';
        });
        
        // Pause/Play button
        const playBtn = document.createElement('button');
        playBtn.innerHTML = '⏸️';
        playBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
        `;
        
        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                playBtn.innerHTML = '⏸️';
            } else {
                audio.pause();
                playBtn.innerHTML = '▶️';
            }
        });
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            margin-left: 8px;
        `;
        
        closeBtn.addEventListener('click', () => {
            audio.pause();
            controls.remove();
        });
        
        controls.appendChild(playBtn);
        controls.appendChild(progress);
        controls.appendChild(speedBtn);
        controls.appendChild(closeBtn);
        
        return controls;
    }
    
    function updatePlayingButton(url, isPlaying) {
        const buttons = document.querySelectorAll(`button[onclick*="${url}"]`);
        buttons.forEach(btn => {
            btn.innerHTML = isPlaying ? '⏸️' : '▶️';
        });
    }
    
    console.log('✅ Voice Playback Speed Module Ready!');
})();