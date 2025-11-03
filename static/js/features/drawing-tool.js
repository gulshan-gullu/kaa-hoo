// ========================================
// DRAWING TOOL FEATURE
// ========================================

(function() {
    'use strict';
    
    let canvas, ctx;
    let isDrawing = false;
    let currentColor = '#000000';
    let currentWidth = 3;
    
    window.openDrawingTool = function() {
        console.log('✏️ Opening drawing tool...');
        
        if (!window.currentChatUser) {
            alert('Please select a contact first');
            return;
        }
        
        showDrawingUI();
        initializeCanvas();
    };
    
    function showDrawingUI() {
        const drawingHTML = `
            <div id="drawing-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 10000; display: flex; flex-direction: column;">
                <!-- Header -->
                <div style="padding: 15px 20px; background: rgba(0,0,0,1); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h2 style="color: white; margin: 0; font-size: 18px;">Draw</h2>
                    <button onclick="closeDrawingTool()" style="background: none; border: none; color: white; font-size: 32px; cursor: pointer; line-height: 1;">×</button>
                </div>
                
                <!-- Tools -->
                <div style="padding: 15px 20px; background: rgba(0,0,0,0.9); display: flex; gap: 15px; align-items: center; flex-wrap: wrap; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <!-- Color Picker -->
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="color: rgba(255,255,255,0.8); font-size: 13px;">Color:</span>
                        <input type="color" id="drawing-color" value="#000000" onchange="changeColor(this.value)" 
                               style="width: 40px; height: 40px; border: 2px solid rgba(255,255,255,0.3); border-radius: 8px; cursor: pointer;">
                    </div>
                    
                    <!-- Brush Size -->
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="color: rgba(255,255,255,0.8); font-size: 13px;">Size:</span>
                        <button onclick="changeBrushSize(2)" style="width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            <div style="width: 6px; height: 6px; border-radius: 50%; background: white;"></div>
                        </button>
                        <button onclick="changeBrushSize(5)" style="width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            <div style="width: 12px; height: 12px; border-radius: 50%; background: white;"></div>
                        </button>
                        <button onclick="changeBrushSize(10)" style="width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            <div style="width: 18px; height: 18px; border-radius: 50%; background: white;"></div>
                        </button>
                    </div>
                    
                    <!-- Tools -->
                    <button onclick="clearCanvas()" style="padding: 8px 16px; background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; color: #ef4444; cursor: pointer; font-size: 13px;">🗑️ Clear</button>
                    <button onclick="changeBackgroundColor()" style="padding: 8px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: white; cursor: pointer; font-size: 13px;">🎨 BG</button>
                </div>
                
                <!-- Canvas -->
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; overflow: hidden;">
                    <canvas id="drawing-canvas" 
                            style="background: white; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); max-width: 100%; max-height: 100%; touch-action: none;">
                    </canvas>
                </div>
                
                <!-- Footer -->
                <div style="padding: 20px; background: rgba(0,0,0,1); border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: flex-end; gap: 15px;">
                    <button onclick="closeDrawingTool()" style="padding: 12px 30px; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 15px;">Cancel</button>
                    <button onclick="sendDrawing()" style="padding: 12px 30px; background: #25d366; border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 15px; font-weight: 600;">Send</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', drawingHTML);
    }
    
    function initializeCanvas() {
        canvas = document.getElementById('drawing-canvas');
        if (!canvas) return;
        
        ctx = canvas.getContext('2d');
        
        // Set canvas size
        const container = canvas.parentElement;
        const maxWidth = Math.min(800, container.clientWidth - 40);
        const maxHeight = Math.min(600, container.clientHeight - 40);
        
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        
        // Setup drawing
        setupDrawing();
    }
    
    function setupDrawing() {
        // Mouse events
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        
        // Touch events for mobile
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchmove', handleTouchMove);
        canvas.addEventListener('touchend', stopDrawing);
    }
    
    function startDrawing(e) {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        if (!isDrawing) return;
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }
    
    window.changeColor = function(color) {
        currentColor = color;
    };
    
    window.changeBrushSize = function(size) {
        currentWidth = size;
    };
    
    window.clearCanvas = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    
    window.changeBackgroundColor = function() {
        const color = prompt('Enter background color (hex):', '#FFFFFF');
        if (color) {
            canvas.style.background = color;
        }
    };
    
    window.sendDrawing = function() {
        console.log('📤 Sending drawing...');
        
        canvas.toBlob(function(blob) {
            const file = new File([blob], 'drawing.png', { type: 'image/png' });
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('target_user', window.currentChatUser.id);
            formData.append('caption', '✏️ Drawing');
            
            fetch('/api/send-file', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('✅ Drawing sent successfully!');
                    closeDrawingTool();
                } else {
                    alert('Failed to send drawing');
                }
            })
            .catch(error => {
                console.error('❌ Error sending drawing:', error);
                alert('Failed to send drawing');
            });
        }, 'image/png');
    };
    
    window.closeDrawingTool = function() {
        const modal = document.getElementById('drawing-modal');
        if (modal) modal.remove();
    };
    
})();