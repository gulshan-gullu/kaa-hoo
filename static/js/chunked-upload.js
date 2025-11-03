// ==========================================
// 📦 CHUNKED FILE UPLOAD - Supports up to 3GB
// ==========================================

(function() {
    'use strict';
    
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const MAX_FILE_SIZE = 3 * 1024 * 1024 * 1024; // 3GB
    
    // Generate unique file ID
    function generateFileId() {
        return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Upload file in chunks with progress tracking
    async function uploadFileInChunks(file, targetUser, caption, onProgress) {
        console.log('📦 [CHUNKED] Starting chunked upload:', file.name, file.size);
        
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB limit`);
        }
        
        const fileId = generateFileId();
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        
        console.log(`📦 [CHUNKED] File will be split into ${totalChunks} chunks`);
        
        // Upload each chunk
        for (let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber++) {
            const start = chunkNumber * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);
            
            const formData = new FormData();
            formData.append('chunk', chunk);
            formData.append('chunkNumber', chunkNumber);
            formData.append('totalChunks', totalChunks);
            formData.append('fileId', fileId);
            formData.append('filename', file.name);
            
            console.log(`📦 [CHUNKED] Uploading chunk ${chunkNumber + 1}/${totalChunks}`);
            
            const response = await fetch('/api/upload-chunk', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`Chunk ${chunkNumber + 1} upload failed`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Chunk upload failed');
            }
            
            // Update progress
            const progress = ((chunkNumber + 1) / totalChunks) * 100;
            if (onProgress) {
                onProgress(progress, chunkNumber + 1, totalChunks);
            }
        }
        
        console.log('📦 [CHUNKED] All chunks uploaded, finalizing...');
        
        // Finalize upload
        const finalizeResponse = await fetch('/api/finalize-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileId: fileId,
                filename: file.name,
                fileSize: file.size,
                targetUser: targetUser,
                caption: caption
            }),
            credentials: 'include'
        });
        
        if (!finalizeResponse.ok) {
            throw new Error('Failed to finalize upload');
        }
        
        const result = await finalizeResponse.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Upload finalization failed');
        }
        
        console.log('✅ [CHUNKED] Upload complete!');
        return result;
    }
    
    // Expose to window
    window.uploadFileInChunks = uploadFileInChunks;
    window.MAX_FILE_SIZE = MAX_FILE_SIZE;
    
    console.log('✅ [CHUNKED] Chunked upload module ready (Max: 3GB)');
    
})();